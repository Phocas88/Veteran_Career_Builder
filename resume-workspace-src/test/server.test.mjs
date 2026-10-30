import test from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../server.mjs';
import { Readable } from 'node:stream';

async function withServer(fn, options = {}) {
  // Unit tests must never inherit a deployment's real provider credentials.
  const server = makeServer({ apiKey: '', ...options });
  const base = 'http://127.0.0.1:3000';
  const request = (target, init = {}) => new Promise((resolve, reject) => {
    const url = new URL(target);
    const req = Readable.from(init.body ? [Buffer.from(init.body)] : []);
    req.method = init.method || 'GET';
    req.url = url.pathname;
    req.headers = Object.fromEntries(Object.entries({ host: url.host, ...(init.headers || {}) }).map(([k,v]) => [k.toLowerCase(),v]));
    req.socket = { remoteAddress: '127.0.0.1' };
    if ('parsedBody' in init) req.body = init.parsedBody;
    const responseHeaders = {};
    const res = {
      headersSent: false,
      statusCode: 200,
      setHeader(name,value) { responseHeaders[name.toLowerCase()] = String(value); },
      writeHead(status,headers) { this.statusCode=status; for(const [k,v] of Object.entries(headers)) this.setHeader(k,v); this.headersSent=true; },
      end(body) { resolve(new Response(body, { status: this.statusCode, headers: responseHeaders })); }
    };
    req.on('error',reject);
    server.emit('request',req,res);
  });
  await fn(base,request);
}

test('the application and modules load; local secrets and source files cannot be downloaded', async () => withServer(async (base, request) => {
  for (const route of ['/', '/app.js', '/skill-organization.js', '/cv-content.js', '/corrections.js', '/build-recovery.js', '/styles.css', '/manifest.webmanifest']) assert.equal((await request(base + route)).status, 200);
  for (const route of ['/.env.local', '/server.mjs', '/package.json', '/.git/config', '/lib/review.mjs']) assert.equal((await request(base + route)).status, 404);
  const home = await request(base);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(home.headers.get('cache-control'), 'no-store');
  assert.match(await home.text(), /Veteran Career Path/);
}));

test('the API rejects cross-site and malformed requests before invoking review', async () => {
  let calls = 0;
  await withServer(async (base, request) => {
    assert.equal((await request(base + '/api/review')).status, 405);
    assert.equal((await request(base + '/api/review', { method: 'POST', headers: { origin: 'https://other.example', 'content-type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await request(base + '/api/review', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await request(base + '/api/review', { method: 'POST', body: 'text' })).status, 415);
    assert.equal((await request(base + '/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })).status, 400);
    assert.equal(calls, 0);
  }, { review: async () => { calls++; return {}; } });
});

test('valid reviews pass through the server without storing or returning a secret', async () => withServer(async (base, request) => {
  const response = await request(base + '/api/review', { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify({ resume: 'sample resume' }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { score: 80, suggestions: [] });
}, { apiKey: 'private-test-token', review: async (body, options) => {
  assert.equal(body.resume, 'sample resume');
  assert.equal(options.apiKey, 'private-test-token');
  return { score: 80, suggestions: [] };
} }));

test('missing credentials produce an explicit error and reviews are rate limited', async () => withServer(async (base, request) => {
  const resume = 'A resume with relevant experience. '.repeat(10);
  const options = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resume }) };
  const unavailable = await request(base + '/api/review', options);
  assert.equal(unavailable.status, 503);
  assert.match((await unavailable.json()).error, /not connected/);
  for (let i = 0; i < 9; i++) await request(base + '/api/review', options);
  const limited = await request(base + '/api/review', options);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
}));

test('serverless pre-parsed bodies use the same handler and cannot bypass byte limits', async () => {
  let calls = 0;
  await withServer(async (base, request) => {
    const headers = { 'content-type': 'application/json' };
    const valid = await request(base + '/api/review', { method: 'POST', headers, parsedBody: { resume: 'provided by serverless runtime' } });
    assert.equal(valid.status, 200);
    const oversized = await request(base + '/api/review', { method: 'POST', headers, parsedBody: { resume: 'x'.repeat(150001) } });
    assert.equal(oversized.status, 413);
    assert.equal(calls, 1);
  }, { review: async body => { calls++; assert.equal(body.resume, 'provided by serverless runtime'); return { score: 80 }; } });
});
