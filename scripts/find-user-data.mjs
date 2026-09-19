// One-time recovery utility: find every Firebase account for a given email and
// report which one actually holds the user's data (resumes, cover letters, etc).
//
// Why this exists: the site allows BOTH email/password and Google sign-in, so the
// same email can map to more than one Firebase UID -- and each UID has its own
// profiles/{uid} document + subcollections. Stripe subscriptions are unrelated to
// where the data lives; data is keyed to the Firebase login.
//
// Setup (one time):
//   1. Firebase Console -> Project settings -> Service accounts -> Generate new private key
//   2. Save the JSON OUTSIDE the repo (it's a secret). e.g. C:\keys\vcb-admin.json
//   3. From the repo:  npm i firebase-admin
//
// Run (PowerShell):
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\keys\vcb-admin.json"
//   node scripts/find-user-data.mjs gforceangel@yahoo.com
//
// Run (bash):
//   GOOGLE_APPLICATION_CREDENTIALS=/c/keys/vcb-admin.json node scripts/find-user-data.mjs gforceangel@yahoo.com
//
// It reads only; it changes nothing.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';

const BACKUP_DIR = 'data-backups';
const EMAIL = (process.argv[2] || '').trim().toLowerCase();
if (!EMAIL) {
  console.error('Usage: node scripts/find-user-data.mjs <email>');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path first (see header).');
  process.exit(1);
}

initializeApp({ projectId: 'veteran-career-builder', credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

const SUBS = ['resumes', 'coverLetters', 'emails', 'scores'];

function emailsOf(u) {
  const set = new Set();
  if (u.email) set.add(u.email.toLowerCase());
  (u.providerData || []).forEach(p => p.email && set.add(p.email.toLowerCase()));
  return set;
}

// 1) find every Auth account whose primary or provider email matches
const matches = [];
let pageToken;
do {
  const res = await auth.listUsers(1000, pageToken);
  for (const u of res.users) if (emailsOf(u).has(EMAIL)) matches.push(u);
  pageToken = res.pageToken;
} while (pageToken);

console.log(`\n=== Firebase accounts matching ${EMAIL}: ${matches.length} ===\n`);
if (matches.length === 0) {
  console.log('No Auth account with that email. He may have signed up under a different');
  console.log('address, or never created a login (data would only be in localStorage on his device).');
  process.exit(0);
}

// 2) inspect each account's profile + subcollections
const report = [];
for (const u of matches) {
  const providers = (u.providerData || []).map(p => p.providerId).join(', ') || 'password';
  const ref = db.collection('profiles').doc(u.uid);
  const snap = await ref.get();
  const d = snap.exists ? (snap.data() || {}) : null;

  const counts = {};
  let total = 0;
  const backup = { uid: u.uid, providers, authEmail: u.email, profile: d, subcollections: {} };
  for (const s of SUBS) {
    const q = await ref.collection(s).get();
    counts[s] = q.size;
    total += q.size;
    backup.subcollections[s] = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Always write a full local backup of this account's data (read-only from Firestore).
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = `${BACKUP_DIR}/${EMAIL.replace(/[^a-z0-9]/gi, '_')}__${u.uid}.json`;
  writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  // peek at the most recent resume for a human-recognizable label
  let latestResume = null;
  try {
    const rs = await ref.collection('resumes').orderBy('id', 'desc').limit(1).get();
    if (!rs.empty) {
      const r = rs.docs[0].data() || {};
      latestResume = (r.title || r.targetTitle || r.name || '(untitled)') +
        (r.updatedAt || r.id ? '  @ ' + new Date(Number(r.updatedAt || r.id)).toISOString().slice(0, 10) : '');
    }
  } catch (e) { /* ignore ordering errors */ }

  report.push({ u, providers, d, counts, total, latestResume, backupFile });
}

// 3) richest first -- that's almost certainly "his actual data"
report.sort((a, b) => b.total - a.total ||
  Number((b.d && b.d.updatedAt) || 0) - Number((a.d && a.d.updatedAt) || 0));

report.forEach((r, i) => {
  const md = r.d && r.d.metadata;
  console.log(`${i === 0 ? '>> LIKELY HIS DATA' : '   also-exists   '}  UID ${r.u.uid}`);
  console.log(`     sign-in via : ${r.providers}`);
  console.log(`     created     : ${r.u.metadata.creationTime}`);
  console.log(`     last sign-in: ${r.u.metadata.lastSignInTime}`);
  console.log(`     profile doc : ${r.d ? 'exists' : 'MISSING'}` +
    (r.d && r.d.updatedAt ? `  (updatedAt ${new Date(Number(r.d.updatedAt)).toISOString().slice(0, 16).replace('T', ' ')})` : ''));
  if (r.d && r.d.personal) console.log(`     name/email  : ${r.d.personal.name || '?'} / ${r.d.personal.email || r.u.email || '?'}`);
  console.log(`     data counts : resumes=${r.counts.resumes}  coverLetters=${r.counts.coverLetters}  emails=${r.counts.emails}  scores=${r.counts.scores}  (total ${r.total})`);
  if (r.latestResume) console.log(`     newest resume: ${r.latestResume}`);
  console.log(`     backup saved: ${r.backupFile}`);
  console.log('');
});

console.log(`Full JSON backups of every account above were written to ./${BACKUP_DIR}/ — nothing`);
console.log('was changed in Firestore (read-only). Keep the ">> LIKELY HIS DATA" account. If two');
console.log('accounts both have data, send me the two UIDs and I can write a merge script.\n');
process.exit(0);
