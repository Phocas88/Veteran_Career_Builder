import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { reviewResume, ReviewError } from './lib/review.mjs';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };
export function makeServer({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL, review = reviewResume } = {}) {
  const limits = new Map();
  return createServer(async (req, res) => {
    const headers = {
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' https://www.gstatic.com https://veterancareerpath.com; style-src 'self'; img-src 'self' data: https://veterancareerpath.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://vcp-proxy.vercel.app; frame-src https://veteran-career-builder.firebaseapp.com; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
      'Cache-Control': 'no-store'
    };
    const send = (status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { ...headers, 'Content-Type': type }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/review') {
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'Use POST to request a review.' }); }
        if (req.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Open the app to request a review.' });
        const origin = req.headers.origin;
        if (origin) {
          let originHost;
          try { originHost = new URL(origin).host; } catch { return send(403, { error: 'Invalid request origin.' }); }
          if (originHost !== req.headers.host) return send(403, { error: 'Open the app to request a review.' });
        }
        if (!(req.headers['content-type'] ?? '').startsWith('application/json')) return send(415, { error: 'Send resume text as JSON.' });
        // Local/private deployment protection. Use a shared rate-limit service before public launch.
        const now = Date.now();
        for (const [key, entry] of limits) if (entry.reset < now) limits.delete(key);
        const identity = req.socket.remoteAddress ?? 'unknown';
        const limit = limits.get(identity) ?? { count: 0, reset: now + 15 * 60000 };
        if (limit.count >= 10) { res.setHeader('Retry-After', Math.ceil((limit.reset - now) / 1000)); return send(429, { error: 'You have made several reviews. Please try again in a few minutes.' }); }
        limit.count++; limits.set(identity, limit);
        let rawBody;
        if (req.body !== undefined) {
          // Vercel may parse JSON before invoking a function. Enforce the same byte limit.
          rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          if (Buffer.byteLength(rawBody, 'utf8') > 150000) return send(413, { error: 'That file is too large. Paste up to 20,000 characters of resume text.' });
        } else {
          const chunks = []; let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 150000) return send(413, { error: 'That file is too large. Paste up to 20,000 characters of resume text.' });
            chunks.push(chunk);
          }
          rawBody = Buffer.concat(chunks).toString('utf8');
        }
        let body;
        try { body = JSON.parse(rawBody); } catch { return send(400, { error: 'We could not read that request. Please try again.' }); }
        const result = await review(body, { apiKey, model });
        return send(200, result);
      }
      if (url.pathname.startsWith('/api/')) return send(404, { error: 'Page not found.' });
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(405, 'Method not allowed.', 'text/plain'); }
      const routes = new Set(['/', '/index.html', '/app.js', '/corrections.js', '/imports.js', '/exports.js', '/page-preview.js', '/styles.css', '/resume.css', '/icon.svg', '/manifest.webmanifest', '/workspace.js', '/cloud-store.js', '/firebase-client.js', '/veteran-profile.js', '/veteran.css', '/privacy.html', '/brand.svg', '/guided-flow.js', '/branch-controls.js', '/branch-catalog.js', '/background-form.js', '/profile-fields.js', '/payments.js', '/build-recovery.js', '/cookies.html', '/terms.html']);
      for (const file of ['career-tools.js','career-model.js','career.css','letter-exports.js']) routes.add('/'+file);
      for (const file of ['service-library.js','service-library-model.js','service-library-data.json']) routes.add('/'+file);
      routes.add('/service-codes.js');
      if (!routes.has(url.pathname) && !url.pathname.startsWith('/vendor/')) return send(404, 'Page not found.', 'text/plain');
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const fullPath = path.resolve(root, file);
      if (!fullPath.startsWith(root)) return send(404, 'Page not found.', 'text/plain');
      const data = await readFile(fullPath);
      res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error instanceof ReviewError) return send(error.status, { error: error.message });
      if (error.code === 'ENOENT') return send(404, 'Page not found.', 'text/plain');
      // Do not log request bodies, resumes, API credentials, or upstream response contents.
      return send(500, { error: 'Something went wrong. Your resume has not been changed.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  makeServer().listen(port, host, () => console.log(`Resume Studio: http://${host}:${port}`));
}
