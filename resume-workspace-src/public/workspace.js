import { fillBackground, readBackground } from './background-form.js?v=20261018-branches';
import { initPayments, requestPaidReview, resetPayments, refreshPurchases } from './payments.js?v=20261018-branches';
import { normalizeProfile, profileToResume, profileFromWebsite } from './veteran-profile.js';
import { createCloudStore, savedResumeToDraft } from './cloud-store.js';
import { connectFirebase } from './firebase-client.js';

const $ = id => document.getElementById(id);
const website = /(^|\.)veterancareerpath\.com$/i.test(location.hostname);
let connection, store, user = null, accountVersion = 0;
let saved = [];
let callback;
let profileDirty = false;


function status(text) { $('cloud-status').textContent = text; }
function errorText(error) {
  const code = error?.code || '';
  if (/invalid-credential|wrong-password|user-not-found/.test(code)) return 'Sign-in failed. Check your email and password or reset your password.';
  if (/email-already-in-use/.test(code)) return 'An account already uses that email. Sign in or reset your password.';
  if (/permission-denied/.test(code)) return 'Your account could not access this saved item. Sign in again or contact support.';
  if (/weak-password/.test(code)) return 'Choose a password with at least 8 characters.';
  if (/too-many-requests/.test(code)) return 'Too many attempts. Wait a few minutes before trying again.';
  if (/network/.test(code)) return 'Account services could not connect. Check your connection and try again.';
  return 'Account services could not complete that action. Your current draft is unchanged. Try again or contact support.';
}
const readProfile = readBackground;
function fillProfile(profile) { fillBackground(profile); profileDirty = false; }
function resetPrivateState() {
  saved = []; renderSaved(); fillProfile({}); $('cloud-consent').checked = false;
  $('save-title').value = ''; $('auth-email').value = ''; $('auth-password').value = ''; $('ai-consent').checked = false;
  callback?.clearAccountDraft();
  resetPayments();
}
async function ensureConnection() {
  if (connection) return connection;
  const c = await connectFirebase(); connection = c; store = createCloudStore(c);
  c.auth.onAuthStateChanged(next => {
    ++accountVersion;
    if (user && user.uid !== next?.uid) resetPrivateState();
    user = next;
    $('account-label').textContent = next ? 'My account' : 'Sign in';
    $('account-email').textContent = next?.email || '';
    $('account-signed-in').hidden = !next; $('account-form').hidden = !!next;
    $('cloud-signed-in').hidden = !next; $('cloud-signed-out').hidden = !!next;
    status(next ? 'Signed in. Your draft is saved only when you choose Save to account.' : 'Work without an account, or sign in to save across devices.');
    if (next) { callback?.restoreDeviceDraft(next.uid); refreshSaved(); refreshPurchases(); }
  });
  return c;
}
async function refreshSaved() {
  const version = accountVersion;
  try { const items = await store.list(); if (version !== accountVersion) return; saved = items; renderSaved(); }
  catch { status('Saved resumes could not load. Your local draft is unchanged. Try Refresh saved resumes.'); }
}
function renderSaved() {
  const list = $('saved-resumes'); list.replaceChildren();
  for (const item of saved) {
    const row = document.createElement('li'); const title = document.createElement('span'); title.textContent = item.title || 'Saved resume';
    const open = document.createElement('button'); open.className = 'text-button'; open.textContent = 'Open';
    open.addEventListener('click', () => {
      if (callback.getDraft().resume.trim() && !confirm('Replace the current draft with this saved resume? Download or save your current work first.')) return;
      callback.loadDraft(savedResumeToDraft(item)); status('Saved resume opened. Changes are not saved automatically.');
    });
    const remove = document.createElement('button'); remove.className = 'text-button danger'; remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      if (!confirm('Delete this resume from your account? Downloaded copies and the current editor are not deleted.')) return;
      remove.disabled = true;
      try { await store.remove(item.id); await refreshSaved(); status('Saved resume deleted from the active account database.'); }
      catch (error) { status(errorText(error)); remove.disabled = false; }
    }); row.append(title, open, remove); list.append(row);
  }
  $('saved-empty').hidden = saved.length > 0;
}
async function cloudAction(action) {
  try {
    await ensureConnection();
    if (!connection.auth.currentUser) { $('account-dialog').showModal(); return; }
    if (!$('cloud-consent').checked) { $('cloud-details').open = true; status('Check the cloud storage agreement before saving. You can continue working without saving.'); $('cloud-consent').focus(); return; }
    await action();
  } catch (error) { status(errorText(error)); }
}

export const draftOwnerId = () => user?.uid || null;

export function initWorkspace(adapter) {
  callback = adapter; fillProfile({});
  initPayments({ ensureConnection, adapter });
  $('background-builder').addEventListener('input', () => { profileDirty = true; });
  $('build-draft').addEventListener('click', () => {
    try {
      const text = profileToResume(readProfile());
      if (callback.getDraft().resume.trim() && !confirm('Replace the current draft with your service background? Save or download your existing work first.')) return;
      callback.loadDraft({ ...callback.getDraft(), resume: text });
      $('builder-status').textContent = 'Your fact-based draft is ready below. Add a target role, then request an AI review to translate and improve it.';
      $('resume-input').focus();
    } catch (error) { $('builder-status').textContent = error.message; }
  });
  $('account-open').addEventListener('click', async () => {
    $('account-dialog').showModal();
    try { await ensureConnection(); } catch (error) { $('auth-status').textContent = error.message; }
  });
  $('account-close').addEventListener('click', () => $('account-dialog').close());
  $('account-form').addEventListener('submit', async event => {
    event.preventDefault(); $('auth-status').textContent = '';
    const button = event.submitter; button.disabled = true;
    try {
      const c = await ensureConnection();
      await c.auth.setPersistence($('keep-signed-in').checked ? c.firebase.auth.Auth.Persistence.LOCAL : c.firebase.auth.Auth.Persistence.SESSION);
      if (button.value === 'create') {
        if (!$('account-terms').checked) throw new Error('Agree to the Terms and Privacy Policy before creating your account.');
        if ($('auth-password').value.length < 8) throw Object.assign(new Error('weak password'), { code: 'auth/weak-password' });
        await c.auth.createUserWithEmailAndPassword($('auth-email').value.trim(), $('auth-password').value);
      } else await c.auth.signInWithEmailAndPassword($('auth-email').value.trim(), $('auth-password').value);
      $('auth-password').value = ''; $('account-dialog').close();
    } catch (error) { $('auth-status').textContent = error.message?.startsWith('Agree to') ? error.message : errorText(error); }
    finally { button.disabled = false; }
  });
  $('reset-password').addEventListener('click', async () => {
    if (!$('auth-email').validity.valid || !$('auth-email').value) { $('auth-status').textContent = 'Enter your account email first.'; return; }
    try { const c = await ensureConnection(); await c.auth.sendPasswordResetEmail($('auth-email').value.trim()); $('auth-status').textContent = 'If this address has an account, a password reset email will be sent.'; }
    catch { $('auth-status').textContent = 'Password reset could not be sent. Check your connection and try again.'; }
  });
  $('account-signout').addEventListener('click', async () => {
    if (!confirm('Sign out and clear this workspace on this device? Save or download any work you need first.')) return;
    try { await connection.auth.signOut(); $('account-dialog').close(); } catch { $('auth-status').textContent = 'Sign-out failed. Try again before leaving a shared device.'; }
  });
  $('save-cloud').addEventListener('click', () => cloudAction(async () => { await store.save(callback.getDraft(), $('save-title').value); await refreshSaved(); status('Resume saved to your resume-program account.'); }));
  $('save-profile').addEventListener('click', () => cloudAction(async () => { await store.saveProfile(readProfile()); profileDirty = false; status('Program background saved. Main-site profile and subscriptions are separate.'); }));
  $('load-profile').addEventListener('click', async () => {
    try {
      await ensureConnection(); if (!user) { $('account-dialog').showModal(); return; }
      if (profileDirty && !confirm('Replace the unsaved service background with your account profile?')) return;
      const version = accountVersion; const data = await store.profile(); if (version !== accountVersion) return;
      fillProfile(profileFromWebsite(data)); $('background-builder').open = true; status('Account background loaded. Check the details before building a draft.');
    } catch (error) { status(errorText(error)); }
  });
  $('refresh-saved').addEventListener('click', () => { if (store && user) refreshSaved(); });
  $('delete-background').addEventListener('click', async () => {
    if (!user || !confirm('Delete the service background saved by this workspace? Your original website profile, resumes, and downloaded files are unchanged.')) return;
    try { const uid = connection.auth.currentUser.uid; await store.removeProfile(); if (user?.uid === uid) status('Workspace service background deleted from the active database.'); }
    catch (error) { status(errorText(error)); }
  });
  $('export-account').addEventListener('click', async () => {
    try {
      if (!user) return; const version = accountVersion;
      const [profile, resumes] = await Promise.all([store.profile(), store.list()]); if (version !== accountVersion) return;
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, resumes }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'veteran-career-path-account.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      status('Downloaded your profile and up to 50 most recent saved resumes. Contact support for a full account export.');
    } catch (error) { status(errorText(error)); }
  });
  $('cookie-settings').addEventListener('click', () => $('storage-dialog').showModal());
  $('storage-close').addEventListener('click', () => $('storage-dialog').close());
  $('essential-storage').addEventListener('click', () => {
    try { localStorage.setItem('vcp_workspace_storage_choice', 'essential'); } catch { /* Choice applies to this tab. */ }
    $('storage-notice').hidden = true;
  });
  try { $('storage-notice').hidden = localStorage.getItem('vcp_workspace_storage_choice') === 'essential'; } catch { /* Show explanation without persistence. */ }
  // Restore only this program’s named Firebase session. No offline disk cache.
  if (website || location.hostname === 'mobile-resume-review-app.vercel.app' || new URLSearchParams(location.search).has('build')) ensureConnection().catch(() => status('Account services could not load. You can still edit and export without cloud storage.'));
}

export async function requestVeteranReview(payload, signal) {
  if (!$('ai-consent').checked) { $('ai-consent').focus(); throw new Error('Agree to sending this draft for AI processing before requesting a build.'); }
  const c=await ensureConnection();
  if(!c.auth.currentUser){$('account-dialog').showModal();throw new Error('Create a free resume-program account or sign in. No main-site subscription is required.');}
  return requestPaidReview(payload,signal);
}
