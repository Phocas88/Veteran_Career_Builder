// Scan ALL Firestore profiles and print a one-line summary of each.
// Optional args = search terms; any profile whose name/email/location/uid matches
// (case-insensitive substring) is flagged with >>> and listed first.
//
// Usage:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\key.json"
//   node scripts/scan-profiles.mjs                 # list everyone
//   node scripts/scan-profiles.mjs lumis michelle  # highlight matches
// Read-only.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const TERMS = process.argv.slice(2).map(t => t.trim().toLowerCase()).filter(Boolean);
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) { console.error('Set GOOGLE_APPLICATION_CREDENTIALS first.'); process.exit(1); }

initializeApp({ projectId: 'veteran-career-builder', credential: applicationDefault() });
const db = getFirestore();

const len = a => Array.isArray(a) ? a.length : 0;
const snap = await db.collection('profiles').get();

const rows = [];
for (const doc of snap.docs) {
  const p = doc.data() || {};
  const per = p.personal || {};
  const name = (per.name || '').trim();
  const email = (per.email || '').trim();
  const loc = (per.location || p.targetLocation || '').trim();
  const hay = [name, email, loc, doc.id].join(' ').toLowerCase();
  const match = TERMS.length && TERMS.some(t => hay.includes(t));
  const inputs = len(p.milExperiences) + len(p.civExperiences) + len(p.serviceRecords);
  const resumes = (await doc.ref.collection('resumes').get()).size;
  rows.push({ match, name, email, loc, uid: doc.id, inputs, resumes, plan: p.plan || '' });
}

rows.sort((a, b) => (b.match - a.match) || (b.inputs - a.inputs));

console.log(`\n${snap.size} total profiles${TERMS.length ? `  (search: ${TERMS.join(', ')})` : ''}\n`);
for (const r of rows) {
  const flag = r.match ? '>>> ' : '    ';
  console.log(`${flag}${(r.name || '(no name)').padEnd(24)} ${(r.email || '(no email)').padEnd(30)} ${(r.loc || '').padEnd(20)} inputs:${r.inputs} resumes:${r.resumes} ${r.plan}`);
  if (r.match) console.log(`        uid ${r.uid}`);
}
if (TERMS.length && !rows.some(r => r.match)) console.log(`No profile matched: ${TERMS.join(', ')}`);
console.log('');
process.exit(0);
