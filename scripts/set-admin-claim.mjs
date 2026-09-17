// One-time utility: grant the `admin: true` custom claim to a Firebase Auth user.
// The Firestore rules (firestore.rules) use this claim to gate admin-only access
// (reading the email subscriber list, moderating community collections).
//
// Setup:
//   1. Firebase Console -> Project settings -> Service accounts -> Generate new private key
//   2. Save the JSON somewhere OUTSIDE the repo (it's a secret).
//   3. npm i firebase-admin   (or: npm i -g firebase-admin)
//
// Usage (PowerShell):
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"
//   node scripts/set-admin-claim.mjs you@example.com
//
// Usage (bash):
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/set-admin-claim.mjs <uid-or-email>
//
// The user must sign out and back in afterward for the new claim to take effect.

import admin from 'firebase-admin';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/set-admin-claim.mjs <uid-or-email>');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path first.');
  process.exit(1);
}

admin.initializeApp({ projectId: 'veteran-career-builder' });

const auth = admin.auth();

try {
  const user = arg.includes('@') ? await auth.getUserByEmail(arg) : await auth.getUser(arg);
  if (user.customClaims && user.customClaims.admin === true) {
    console.log(`No change: ${user.email || user.uid} already has admin claim.`);
    process.exit(0);
  }
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  console.log(`✓ admin claim set on ${user.email || user.uid}.`);
  console.log('They must sign out and back in to refresh their ID token.');
  process.exit(0);
} catch (e) {
  console.error('Failed to set admin claim:', e.message);
  process.exit(1);
}
