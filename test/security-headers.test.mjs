import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { protectHtml, enforcedCsp, pageCsp, referrerPolicy } from '../scripts/security-headers.mjs';

test('published HTML receives an early, idempotent baseline without changing scripts or page content', () => {
  const html='<!doctype html><html><head><meta charset="utf-8"><script>window.ready=true;</script></head><body><iframe src="https://js.stripe.com"></iframe></body></html>';
  const protectedHtml=protectHtml(html);
  assert.ok(protectedHtml.indexOf(pageCsp)<protectedHtml.indexOf('<script>'));
  assert.ok(protectedHtml.includes('<script>window.ready=true;</script>'));
  assert.ok(protectedHtml.includes('<iframe src="https://js.stripe.com"></iframe>'));
  assert.equal(protectHtml(protectedHtml),protectedHtml);
  assert.equal(protectHtml('<div>Fragment</div>'),'<div>Fragment</div>');
  assert.ok(!pageCsp.includes('frame-ancestors'));
});

test('existing stricter page policies are retained', () => {
  const html='<HEAD><meta content="default-src none" http-equiv="Content-Security-Policy"><meta content="no-referrer" name="referrer"></HEAD>';
  assert.equal(protectHtml(html),html);
});

test('Firebase enforces framing, object and base restrictions and preserves authentication-compatible isolation', () => {
  const firebase=JSON.parse(fs.readFileSync(new URL('../firebase.json',import.meta.url),'utf8'));
  const headers=Object.fromEntries(firebase.hosting.headers.find(x=>x.source==='**').headers.map(x=>[x.key.toLowerCase(),x.value]));
  assert.equal(headers['content-security-policy'],enforcedCsp);
  assert.match(headers['content-security-policy-report-only'],/script-src/);
  assert.equal(headers['x-frame-options'],'SAMEORIGIN');
  assert.equal(headers['x-content-type-options'],'nosniff');
  assert.equal(headers['referrer-policy'],referrerPolicy);
  assert.equal(headers['cross-origin-opener-policy'],'same-origin-allow-popups');
  assert.match(headers['strict-transport-security'],/max-age=31536000/);
});

test('the hosting build publishes only bounded public certificate challenges and keeps tests private', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'vcp-public-build-'));
  try {
    for (const file of ['index.html','app.html','app.js','app.bundle.js','404.html']) fs.writeFileSync(path.join(root,file),file.endsWith('.html')?'<html><head></head><body>Site</body></html>':'// Site');
    fs.mkdirSync(path.join(root,'.well-known/acme-challenge'),{recursive:true});
    fs.writeFileSync(path.join(root,'.well-known/acme-challenge/public-proof'),'public-proof.value');
    fs.writeFileSync(path.join(root,'.well-known/acme-challenge/private.pem'),'do not publish');
    fs.mkdirSync(path.join(root,'test'));fs.writeFileSync(path.join(root,'test/private.mjs'),'do not publish');
    const child=spawnSync(process.execPath,[new URL('../scripts/build-hosting.mjs',import.meta.url).pathname,root],{encoding:'utf8'});
    assert.equal(child.status,0,child.stderr);
    assert.equal(fs.readFileSync(path.join(root,'.firebase-public/.well-known/acme-challenge/public-proof'),'utf8'),'public-proof.value');
    assert.ok(!fs.existsSync(path.join(root,'.firebase-public/.well-known/acme-challenge/private.pem')));
    assert.ok(!fs.existsSync(path.join(root,'.firebase-public/test')));
    assert.match(fs.readFileSync(path.join(root,'.firebase-public/index.html'),'utf8'),/Content-Security-Policy/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
