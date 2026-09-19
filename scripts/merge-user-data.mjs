// Consolidate one Firebase user's data into another (e.g. when the same person
// created two accounts -- email/password AND Google -- with the same email, and
// each account accumulated its own resumes / cover letters / etc).
//
// SAFETY MODEL: this is ADDITIVE ONLY.
//   - It copies docs from SOURCE into TARGET.
//   - It NEVER overwrites a doc that already exists in TARGET (those are skipped + logged).
//   - It NEVER deletes anything from SOURCE.
//   - For the profile doc it only FILLS IN fields TARGET is missing; existing TARGET values win.
//   - It backs up BOTH accounts to ./data-backups/ before writing.
//   - Dry-run by default. Nothing is written unless you pass --apply.
//
// Setup (one time): see find-user-data.mjs header (service-account key + firebase-admin).
//
// Usage:
//   node scripts/merge-user-data.mjs <SOURCE_uid> <TARGET_uid>            # dry run: shows the plan
//   node scripts/merge-user-data.mjs <SOURCE_uid> <TARGET_uid> --apply    # actually copy
//
// TARGET should be the account he actually logs into / keeps. SOURCE is the extra one.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';

const BACKUP_DIR = 'data-backups';
const SUBS = ['resumes', 'coverLetters', 'emails', 'scores'];

const SOURCE = process.argv[2];
const TARGET = process.argv[3];
const APPLY = process.argv.includes('--apply');

if (!SOURCE || !TARGET) {
  console.error('Usage: node scripts/merge-user-data.mjs <SOURCE_uid> <TARGET_uid> [--apply]');
  process.exit(1);
}
if (SOURCE === TARGET) { console.error('SOURCE and TARGET are the same uid.'); process.exit(1); }
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path first.');
  process.exit(1);
}

initializeApp({ projectId: 'veteran-career-builder', credential: applicationDefault() });
const db = getFirestore();

async function snapshot(uid) {
  const ref = db.collection('profiles').doc(uid);
  const prof = await ref.get();
  const out = { uid, profile: prof.exists ? prof.data() : null, subcollections: {} };
  for (const s of SUBS) {
    const q = await ref.collection(s).get();
    out.subcollections[s] = new Map(q.docs.map(d => [d.id, d.data()]));
  }
  return out;
}

const src = await snapshot(SOURCE);
const tgt = await snapshot(TARGET);

// Back up both before doing anything.
mkdirSync(BACKUP_DIR, { recursive: true });
for (const snap of [src, tgt]) {
  const plain = { uid: snap.uid, profile: snap.profile, subcollections: {} };
  for (const s of SUBS) plain.subcollections[s] = [...snap.subcollections[s]].map(([id, v]) => ({ id, ...v }));
  writeFileSync(`${BACKUP_DIR}/premerge__${snap.uid}.json`, JSON.stringify(plain, null, 2));
}
console.log(`\nBacked up both accounts to ./${BACKUP_DIR}/premerge__*.json\n`);

// Plan the copy: source docs whose id is NOT already in target.
const plan = {};
let toCopy = 0, toSkip = 0;
for (const s of SUBS) {
  const copy = [], skip = [];
  for (const [id, v] of src.subcollections[s]) {
    if (tgt.subcollections[s].has(id)) skip.push(id);
    else copy.push([id, v]);
  }
  plan[s] = copy;
  toCopy += copy.length; toSkip += skip.length;
  const label = (v, id) => (v && (v.title || v.targetTitle || v.subject || v.name)) || id;
  console.log(`${s}: copy ${copy.length}, skip ${skip.length} (already in target)`);
  copy.forEach(([id, v]) => console.log(`   + ${label(v, id)}`));
  skip.forEach(id => console.log(`   = ${id} (kept target's copy)`));
}

// Profile doc: only fill fields target is missing/empty.
const profileFill = {};
if (src.profile) {
  const t = tgt.profile || {};
  for (const [k, v] of Object.entries(src.profile)) {
    const cur = t[k];
    const empty = cur === undefined || cur === null || cur === '' ||
      (Array.isArray(cur) && cur.length === 0);
    if (empty && v !== undefined && v !== null && v !== '') profileFill[k] = v;
  }
}
const fillKeys = Object.keys(profileFill);
console.log(`\nprofile doc: fill ${fillKeys.length} missing field(s)${fillKeys.length ? ': ' + fillKeys.join(', ') : ''}`);

console.log(`\n== TOTAL: ${toCopy} docs to copy, ${toSkip} already present, ${fillKeys.length} profile fields to fill ==`);

if (!APPLY) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply to perform the merge.\n');
  process.exit(0);
}

// Apply: additive writes only.
const tref = db.collection('profiles').doc(TARGET);
let wrote = 0;
for (const s of SUBS) {
  for (const [id, v] of plan[s]) { await tref.collection(s).doc(id).set(v); wrote++; }
}
if (fillKeys.length) await tref.set(profileFill, { merge: true });
console.log(`\nMerge complete: copied ${wrote} docs into ${TARGET}, filled ${fillKeys.length} profile fields.`);
console.log('SOURCE account was left untouched (backup exists). Verify in the app, then you can');
console.log('retire the SOURCE login if you want.\n');
process.exit(0);
