// Turn a profile backup JSON (from find-user-data.mjs) into a clean, human-readable
// Markdown career profile / master resume-data sheet.
//
// Usage:
//   node scripts/export-profile.mjs <backup.json> <output.md>
// Pure local file transform -- no Firebase/network.

import { readFileSync, writeFileSync } from 'fs';

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error('Usage: node scripts/export-profile.mjs <backup.json> <output.md>'); process.exit(1); }

const data = JSON.parse(readFileSync(inPath, 'utf8'));
const p = data.profile || {};
const per = p.personal || {};

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = s => { if (!s) return ''; const [y, m] = String(s).split('-'); return m ? `${MONTHS[+m]} ${y}` : y; };
const span = e => `${ym(e.startDate) || '?'} – ${e.current ? 'Present' : (ym(e.endDate) || '?')}`;
const clean = s => (s || '').toString().trim().replace(/\r?\n+/g, '\n');
const bullets = txt => clean(txt).split('\n').map(l => l.trim()).filter(Boolean).map(l => `- ${l.replace(/^[-•]\s*/, '')}`).join('\n');

const L = [];
L.push(`# ${per.name || 'Career Profile'}`);
const contact = [per.location, per.phone, per.email, per.linkedin].filter(Boolean).join('  |  ');
if (contact) L.push(contact);
L.push(`\n_Master resume data exported ${outPath.split(/[\\/]/).pop()} — keep this; it's everything entered on VeteranCareerPath._`);

if (p.target && Object.values(p.target).some(Boolean)) {
  L.push(`\n## Career Target`);
  if (p.target.title) L.push(`**Target roles:** ${p.target.title}`);
  if (p.target.keywords) L.push(`**Priorities:** ${p.target.keywords}`);
  if (p.target.industry) L.push(`**Industries:** ${p.target.industry}`);
  if (p.target.openTo) L.push(`**Open to:** ${p.target.openTo}`);
  if (p.target.interests) L.push(`**Interests:** ${p.target.interests}`);
}

const mil = p.milExperiences || [];
if (mil.length) {
  L.push(`\n## Military Service`);
  const svc = (p.serviceRecords || [])[0];
  if (svc) L.push(`_${svc.branch || ''} — ${svc.status || ''}_`);
  for (const e of mil) {
    L.push(`\n### ${e.rank || ''} — ${e.mosTitle || e.jobTitle || ''}${e.mos ? ` (${e.mos})` : ''}`);
    L.push(`${e.unit || ''}${e.branch ? `, ${e.branch}` : ''}${e.serviceType ? ` (${e.serviceType})` : ''}  ·  ${span(e)}`);
    const clr = [e.clearanceLevel && e.clearanceLevel !== 'None' ? `${e.clearanceLevel} clearance (${e.clearanceStatus || ''})` : '', e.sciAccess ? 'SCI' : ''].filter(Boolean).join(', ');
    if (clr) L.push(`Clearance: ${clr}`);
    const ctx = [];
    if (e._leaderCount) ctx.push(`led ${e._leaderCount}`);
    if (e._trainedCount) ctx.push(`trained ${e._trainedCount}`);
    if (e._unitSize) ctx.push(`unit size ${e._unitSize}`);
    if (e._equipValue && e._equipValue !== 'N/A') ctx.push(`accountable for ${e._equipValue} equipment`);
    if (e._technology) ctx.push(`systems: ${e._technology}`);
    if (ctx.length) L.push(`_${ctx.join(' · ')}_`);
    const acc = [e._operations, e._improvement, e._communication, e._compliance].filter(Boolean).join('\n');
    if (acc) L.push(bullets(acc));
    if (Array.isArray(e.additionalDuties) && e.additionalDuties.length) L.push(`**Additional duties:** ${e.additionalDuties.join(', ')}`);
    if (Array.isArray(e.awards) && e.awards.length) L.push(`**Awards:** ${e.awards.join(', ')}`);
  }
}

const civ = p.civExperiences || [];
if (civ.length) {
  L.push(`\n## Civilian Experience`);
  for (const e of civ) {
    L.push(`\n### ${e.jobTitle || ''} — ${e.employer || ''}`);
    L.push(`${e.location || ''}  ·  ${span(e)}`);
    if (e.duties) L.push(bullets(e.duties));
  }
}

const edu = p.education || [];
if (edu.length) {
  L.push(`\n## Education`);
  for (const e of edu) {
    L.push(`- **${e.degree || ''}${e.field ? `, ${e.field}` : ''}** — ${e.institution || ''}${e.year ? ` (${e.year})` : ''}`);
    if (e.pme) L.push(`  - Professional military education: ${e.pme}`);
  }
}

const sk = p.skills || {};
if (Object.values(sk).some(v => v && String(v).trim())) {
  L.push(`\n## Skills & Certifications`);
  if (sk.leadership) L.push(`**Leadership:** ${sk.leadership}`);
  if (sk.technical) L.push(`**Technical:** ${sk.technical}`);
  if (sk.languages) L.push(`**Languages:** ${sk.languages}`);
  if (sk.certs) L.push(`**Certifications:** ${sk.certs}`);
}

writeFileSync(outPath, L.join('\n') + '\n');
console.log(`Wrote ${outPath} (${mil.length} military, ${civ.length} civilian, ${edu.length} education)`);
