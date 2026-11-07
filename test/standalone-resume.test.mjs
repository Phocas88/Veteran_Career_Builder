import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildStandaloneResume,standaloneOrigin} from '../scripts/build-standalone-resume.mjs';
test('the dedicated website publishes only the app and preserves install and security headers',()=>{
 const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.outputDirectory,'resume-website');
 assert.equal(config.buildCommand,'node scripts/build-resume-website.mjs');
 assert.match(config.installCommand,/npm ci --prefix resume-workspace-src/);
 assert.match(config.headers.find(row=>row.source==='/app-worker.js').headers[0].value,/no-cache/);
 assert.ok(config.headers.find(row=>row.headers.some(header=>header.key==='Content-Security-Policy')).headers.some(row=>row.key==='Content-Security-Policy'&&row.value.includes("frame-ancestors 'self'")));
});
test('standalone origins reject paths, credentials, insecure URLs and query-driven redirects',()=>{
 assert.equal(standaloneOrigin(''),'');assert.equal(standaloneOrigin('https://resume.example/'),'https://resume.example');
 for(const value of ['http://resume.example','https://resume.example/app','https://resume.example?next=evil','https://user:secret@resume.example','https://resume.example:444'])assert.throws(()=>standaloneOrigin(value),/exact HTTPS origin/);
});
test('standalone packaging rewrites only public app identity links and excludes secrets and private source',t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'vcp-standalone-test-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const source=path.join(base,'source'),output=path.join(base,'output');fs.mkdirSync(source);
 const files=['app.js','app-install.js','app-install.css','app-worker.js','offline.html','manifest.webmanifest','app-icon-192.png','app-icon-512.png','app-icon-maskable-512.png','apple-touch-icon.png','vendor/pdf.mjs','vendor/pdf.worker.mjs','vendor/pdf-export.mjs','vendor/word-export.mjs','service-library-data.json'];
 for(const file of files){fs.mkdirSync(path.dirname(path.join(source,file)),{recursive:true});fs.writeFileSync(path.join(source,file),'public fixture');}
 fs.writeFileSync(path.join(source,'index.html'),'<html><head><link rel="canonical" href="https://veterancareerpath.com/resumereview/"></head><body><input value="https://veterancareerpath.com/resumereview/"></body></html>');fs.writeFileSync(path.join(source,'completion-prompt.js'),"export const APP_SHARE_URL='https://veterancareerpath.com/resumereview/';");fs.writeFileSync(path.join(source,'.env'),'PRIVATE_SECRET');fs.mkdirSync(path.join(source,'api'));fs.writeFileSync(path.join(source,'api/private.js'),'PRIVATE_SOURCE');
 const result=buildStandaloneResume({source,output,origin:'https://resume.example'});assert.equal(result.domainConnected,false);assert.equal(result.backendConfiguredForNewDomain,false);assert.equal(fs.existsSync(path.join(output,'.env')),false);assert.equal(fs.existsSync(path.join(output,'api/private.js')),false);assert.match(fs.readFileSync(path.join(output,'index.html'),'utf8'),/canonical" href="https:\/\/resume\.example\//);assert.match(fs.readFileSync(path.join(output,'completion-prompt.js'),'utf8'),/https:\/\/resume\.example\//);assert.match(fs.readFileSync(path.join(output,'DEPLOYMENT-READINESS.txt'),'utf8'),/not been performed/);
 fs.writeFileSync(path.join(source,'index.html'),'<html><head></head><body><section class="app-install-card"></section></body></html>');
 buildStandaloneResume({source,output,origin:'https://veteranresumes.com'});
 const migration=fs.readFileSync(path.join(output,'index.html'),'utf8');assert.match(migration,/id="previous-app-help"/);assert.match(migration,/Guest purchases and drafts/);assert.match(migration,/same account/);assert.match(migration,/https:\/\/veterancareerpath.com\/resumereview\//);
 buildStandaloneResume({source,output,origin:''});assert.doesNotMatch(fs.readFileSync(path.join(output,'index.html'),'utf8'),/rel="canonical"|previous-app-help/);assert.throws(()=>buildStandaloneResume({source,output:source}),/separate output/);
});
