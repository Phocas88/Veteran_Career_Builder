// Audit whether given users have resume data in Firestore.
// For each email: find the Firebase account(s), then report two things separately —
//   INPUTS  = did they fill in their resume source data (military/civilian experience)?
//   SAVED   = did they save a generated resume (the resumes subcollection)?
//
// Usage:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\key.json"
//   node scripts/audit-subscriber-resumes.mjs email1 email2 ...
// Read-only.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const EMAILS = process.argv.slice(2).map(e => e.trim().toLowerCase()).filter(Boolean);
if (!EMAILS.length) { console.error('Usage: node scripts/audit-subscriber-resumes.mjs <email> [email...]'); process.exit(1); }
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) { console.error('Set GOOGLE_APPLICATION_CREDENTIALS first.'); process.exit(1); }

initializeApp({ projectId: 'veteran-career-builder', credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

// index all auth users by email (handles same-email-multiple-accounts)
const byEmail = new Map();
let pageToken;
do {
  const res = await auth.listUsers(1000, pageToken);
  for (const u of res.users) {
    const set = new Set();
    if (u.email) set.add(u.email.toLowerCase());
    (u.providerData || []).forEach(p => p.email && set.add(p.email.toLowerCase()));
    for (const e of set) { if (!byEmail.has(e)) byEmail.set(e, []); byEmail.get(e).push(u); }
  }
  pageToken = res.pageToken;
} while (pageToken);

const len = a => Array.isArray(a) ? a.length : 0;

console.log('');
for (const email of EMAILS) {
  const users = byEmail.get(email) || [];
  if (!users.length) { console.log(`✗ ${email}\n    no Firebase account (never logged in / signed up under a different email)\n`); continue; }
  for (const u of users) {
    const ref = db.collection('profiles').doc(u.uid);
    const snap = await ref.get();
    const p = snap.exists ? (snap.data() || {}) : {};
    const mil = len(p.milExperiences), civ = len(p.civExperiences), edu = len(p.education);
    const svc = len(p.serviceRecords);
    const skillsFilled = p.skills && Object.values(p.skills).some(v => v && String(v).trim());
    const inputs = mil > 0 || civ > 0 || svc > 0;
    const resumes = (await ref.collection('resumes').get()).size;
    const covers = (await ref.collection('coverLetters').get()).size;

    const inputMark = inputs ? '✓' : '·';
    const savedMark = resumes > 0 ? '✓' : '·';
    console.log(`${email}  [${u.email && u.email.toLowerCase() !== email ? 'via ' + (u.providerData?.[0]?.providerId || 'link') : (u.providerData?.[0]?.providerId || 'password')}]`);
    console.log(`    profile: ${snap.exists ? 'yes' : 'NO'}   ${inputMark} inputs (mil ${mil}, civ ${civ}, edu ${edu}, svc ${svc}, skills ${skillsFilled ? 'y' : 'n'})   ${savedMark} saved resumes: ${resumes}   cover letters: ${covers}`);
    console.log('');
  }
}
process.exit(0);
