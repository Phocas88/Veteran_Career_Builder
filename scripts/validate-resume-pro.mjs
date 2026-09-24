import fs from 'node:fs';

const html = fs.readFileSync('resume-pro.html', 'utf8');
const js = fs.readFileSync('assets/js/resume-pro.js', 'utf8');
const css = fs.readFileSync('assets/css/resume-pro.css', 'utf8');
const data = JSON.parse(fs.readFileSync('data/mil-acronyms.json', 'utf8'));

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const references = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]));
const missingIds = [...references].filter(id => !ids.has(id));
const duplicateIds = [...html.matchAll(/\bid="([^"]+)"/g)]
  .map(match => match[1])
  .filter((id, index, all) => all.indexOf(id) !== index);

const required = [
  ['checkout endpoint', js.includes('/api/resume-checkout')],
  ['entitlement endpoint', js.includes('/api/resume-entitlement')],
  ['generation endpoint', js.includes('/api/resume-generate')],
  ['privacy disclosure', html.includes('Privacy and retention:')],
  ['one-time price disclosure', html.includes('$1.00')],
  ['resume stylesheet', css.includes('.rp-output')],
  ['acronym records', Array.isArray(data) && data.length >= 50],
];

const failed = required.filter(([, ok]) => !ok).map(([name]) => name);
if (missingIds.length || duplicateIds.length || failed.length) {
  console.error(JSON.stringify({ missingIds, duplicateIds: [...new Set(duplicateIds)], failed }, null, 2));
  process.exit(1);
}

console.log(`resume-pro validation passed: ${ids.size} IDs, ${data.length} acronym records`);
