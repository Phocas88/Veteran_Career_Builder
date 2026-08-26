import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const skipDirs = new Set(['.git', 'node_modules', '.firebase-public']);
const skipFiles = new Set(['scripts/validate-site-audit.mjs', 'scripts/remove-em-dashes.mjs']);
const publicExts = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.svg', '.md']);
const emDash = String.fromCharCode(0x2014);
const emDashEntityPattern = `${emDash}|&m${'dash;'}|&#82${'12;'}|&#x20${'14;'}|\\\\u20${'14'}`;
const credentialPattern = [
  'api\\.' + 'anthropic\\.com',
  'x-api' + '-key',
  'fetch\\(PROXY',
  'fetch\\(PROXY_URL',
  'https:\\/\\/vcp-proxy\\.vercel\\.app\\/api\\/claude',
  'VCP_' + 'CODES',
  'OWNER' + '2025',
  'OWNER' + '2026',
  'ALPHA' + '30',
  'VET' + 'TEST',
  'AMON' + '26',
  'TAP' + '2026',
  'VSO' + '2026',
].join('|');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (publicExts.has(path.extname(entry.name).toLowerCase())) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      if (!skipFiles.has(rel)) out.push(abs);
    }
  }
  return out;
}

const checks = [
  { name: 'em_dash_or_entity', pattern: new RegExp(emDashEntityPattern, 'i') },
  { name: 'direct_anthropic_or_proxy_secret', pattern: new RegExp(credentialPattern) },
  { name: 'broken_numeric_function_or_css', pattern: /(?:rgba\([^)]*\d[^)]* to |rgb\([^)]*\d[^)]* to |set[A-Za-z]+\([^)]*\d[^)]* to |slice\([^)]*\d[^)]* to |\{\d+ to \d+\}|points="2 to 3|\$\d+ to \d{3}|\b\d+ to \d{3}\b|April \d+ to 20\d\d|January \d+ to \d{4}|September \d+ to \d{4})/ },
];

let failures = 0;
for (const check of checks) {
  const hits = [];
  for (const abs of walk(root)) {
    const rel = path.relative(root, abs).replace(/\\/g, '/');
    const text = fs.readFileSync(abs, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (check.pattern.test(line)) hits.push(`${rel}:${index + 1}:${line.trim().slice(0, 180)}`);
    });
  }
  if (hits.length) {
    failures += hits.length;
    console.error(`FAIL ${check.name}: ${hits.length} hits`);
    for (const hit of hits.slice(0, 50)) console.error(hit);
    if (hits.length > 50) console.error(`... ${hits.length - 50} more`);
  } else {
    console.log(`PASS ${check.name}`);
  }
}

if (failures) process.exit(1);
