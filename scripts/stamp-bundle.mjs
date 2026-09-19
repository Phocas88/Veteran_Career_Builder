// Cache-busting: stamp app.html's <script src="/app.bundle.js"> with a short content
// hash of the built bundle, so browsers always fetch the latest after a deploy instead
// of serving a stale copy (GitHub Pages caches assets with max-age=600 and no hashing).
// Runs as part of `npm run build` after esbuild. Deterministic: same bundle -> same hash.

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const bundle = readFileSync('app.bundle.js');
const hash = createHash('sha256').update(bundle).digest('hex').slice(0, 10);

const html = readFileSync('app.html', 'utf8');
const re = /(<script[^>]*\bsrc="\/app\.bundle\.js)(\?v=[a-f0-9]+)?"/;

if (!re.test(html)) {
  console.error('stamp-bundle: could not find the app.bundle.js <script> tag in app.html');
  process.exit(1);
}

const stamped = html.replace(re, `$1?v=${hash}"`);
if (stamped !== html) writeFileSync('app.html', stamped);   // idempotent: same bundle -> same hash -> no-op
console.log('stamped app.html -> /app.bundle.js?v=' + hash);
