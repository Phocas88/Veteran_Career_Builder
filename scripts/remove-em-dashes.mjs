import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const exts = new Set(['.html', '.js', '.mjs', '.css', '.md', '.xml', '.json', '.py', '.svg']);
const skipDirs = new Set(['.git', 'node_modules', '.firebase-public']);
const changed = [];
const emDash = String.fromCharCode(0x2014);
const emDashPattern = new RegExp(`${emDash}|&m${'dash;'}|&#82${'12;'}|&#x20${'14;'}`, 'gi');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (exts.has(path.extname(entry.name).toLowerCase())) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function normalize(text) {
  return text
    .replace(emDashPattern, ',')
    .replace(/\s+,\s+/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s+/g, ', ');
}

for (const abs of walk(root)) {
  const before = fs.readFileSync(abs, 'utf8');
  const after = normalize(before);
  if (after !== before) {
    fs.writeFileSync(abs, after, 'utf8');
    changed.push(path.relative(root, abs));
  }
}

let remaining = 0;
for (const abs of walk(root)) {
  const text = fs.readFileSync(abs, 'utf8');
  const matches = text.match(emDashPattern);
  if (matches) remaining += matches.length;
}

console.log(`Em dash cleanup changed ${changed.length} files.`);
console.log(`Remaining em dash/entity count: ${remaining}`);
if (remaining > 0) process.exitCode = 1;
