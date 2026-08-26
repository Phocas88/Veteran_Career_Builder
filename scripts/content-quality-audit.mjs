import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const reportDir = path.join(root, 'reports');
fs.mkdirSync(reportDir, { recursive: true });

const skipDirs = new Set(['.git', 'node_modules', '.firebase-public']);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
}

function strip(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function get(pattern, text) {
  const match = text.match(pattern);
  return match ? match[1].trim().replace(/\s+/g, ' ') : '';
}

function classify(rel, title, words, noindex, canonical, externalLinks) {
  if (noindex) return 'noindex_or_legacy';
  if (rel.startsWith('mos/')) return words < 350 ? 'thin_mos_review' : 'mos_reference';
  if (/veteran-benefits\.html$/.test(rel)) return externalLinks < 2 ? 'state_benefits_sources_review' : 'state_benefits';
  if (/^(tools-|scout-|career-assessment|.*calculator)/.test(rel)) return 'tool_page';
  if (words < 250) return 'thin_review';
  if (canonical && !canonical.endsWith(rel) && rel !== 'index.html') return 'canonicalized_duplicate';
  if (/guide|benefits|resource|careers|resume|interview/i.test(title)) return 'resource_page';
  return 'standard_page';
}

walk(root);

const rows = [[
  'route',
  'title',
  'word_count',
  'canonical',
  'robots',
  'internal_links',
  'external_links',
  'classification',
  'recommendation'
]];

for (const abs of files.sort()) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  const html = fs.readFileSync(abs, 'utf8');
  const title = get(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const canonical = get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, html);
  const robots = get(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i, html);
  const text = strip(html);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const hrefs = [...html.matchAll(/<a\b[^>]+href=["']([^"']+)["']/gi)].map(m => m[1]);
  const internal = hrefs.filter(h => h.startsWith('/') || h.includes('veterancareerpath.com')).length;
  const external = hrefs.filter(h => /^https?:\/\//i.test(h) && !h.includes('veterancareerpath.com')).length;
  const noindex = /noindex/i.test(robots);
  const classification = classify(rel, title, words, noindex, canonical, external);
  let recommendation = 'keep';
  if (classification === 'thin_review') recommendation = 'review for consolidation or noindex';
  if (classification === 'thin_mos_review') recommendation = 'improve MOS-specific substance or consolidate';
  if (classification === 'state_benefits_sources_review') recommendation = 'add official current state/VA sources or noindex';
  if (classification === 'noindex_or_legacy' || classification === 'canonicalized_duplicate') recommendation = 'excluded from sitemap or redirected';
  rows.push([rel, title, String(words), canonical, robots, String(internal), String(external), classification, recommendation]);
}

const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
const out = path.join(reportDir, 'content-quality-audit.csv');
fs.writeFileSync(out, csv, 'utf8');

const counts = rows.slice(1).reduce((acc, row) => {
  acc[row[7]] = (acc[row[7]] || 0) + 1;
  return acc;
}, {});
const summary = {
  totalHtmlRoutes: rows.length - 1,
  counts,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(reportDir, 'content-quality-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');

console.log(`Audited ${summary.totalHtmlRoutes} HTML routes.`);
for (const [key, value] of Object.entries(counts).sort()) console.log(`${key}: ${value}`);
