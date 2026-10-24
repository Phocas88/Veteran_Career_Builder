import {initProfileSetup} from './profile-setup.js?v=20261026-profile-setup';
import {showAppView} from './app-shell.js?v=20261025-standalone-app';
import { initGuidedFlow, setFlow } from './guided-flow.js?v=20261025-standalone-app';
import { fillBackground, readBackground } from './background-form.js?v=20261026-profile-setup';
import { initPayments, requestPaidReview, resetPayments, refreshPurchases, hasPaidBuild, choosePaidEntry, forgetActiveBuild, unlockSavedBuild, careerBuildContext } from './payments.js?v=20261025-standalone-app';
import { initCareerTools } from './career-tools.js?v=20261026-profile-setup';
import {initAppShell} from './app-shell.js?v=20261025-standalone-app';
import { normalizeProfile, profileToResume, profileFromWebsite } from './veteran-profile.js?v=20261025-standalone-app';
import { createCloudStore, savedResumeToDraft } from './cloud-store.js?v=20261026-profile-setup';
import { connectFirebase } from './firebase-client.js';

const $ = id => document.getElementById(id);
const website = /(^|\.)veterancareerpath\.com$/i.test(location.hostname);
let connection, store, user = null, accountVersion = 0;
let saved = [];
let callback;
let profileDirty = false;
let authReady;
let authMode = 'signin';
let careerUI, profileSetup;
const guest = account => !!account && !account.email;
function choice() { try { return sessionStorage.getItem('vcp_resume_entry'); } catch { return null; } }
function rememberChoice(value) { try { if(value)sessionStorage.setItem('vcp_resume_entry',value);else sessionStorage.removeItem('vcp_resume_entry'); } catch {} }
function mode(value) {
  authMode = value;
  $('auth-title').textContent = value === 'create' ? 'Create your free account' : 'Welcome back';
  $('auth-submit').value = value;
  $('auth-submit').textContent = value === 'create' ? 'Create free account' : 'Sign in';
  $('auth-password').autocomplete = value === 'create' ? 'new-password' : 'current-password';
  $('account-terms').closest('label').hidden = value !== 'create';
  $('auth-switch').textContent = value === 'create' ? 'Already have an account? Sign in' : 'New here? Create a free account';
  $('guest-link-note').hidden = !guest(user);
  $('auth-status').textContent = '';
}
function openAccount(value) {
  $('welcome-dialog').close();
  mode(value || (guest(user) ? 'create' : 'signin'));
  $('account-dialog').showModal();
  ensureConnection().catch(error => { $('auth-status').textContent = errorText(error); });
}
function continueGuest() {
  rememberChoice('guest'); $('welcome-dialog').close(); $('account-dialog').close();
  $('account-label').textContent = user && !guest(user) ? 'My account' : 'Account';
}
function updateUser(next) {
  ++accountVersion;
  if (user && user.uid !== next?.uid) resetPrivateState();
  user = next;
  const registered = !!next && !guest(next);
  $('account-label').textContent = registered ? 'My account' : 'Account';
  $('account-email').textContent = registered ? next.email : '';
  $('account-signed-in').hidden = !registered; $('account-form').hidden = registered;
  $('start-saved').hidden = !registered; $('save-submitted-row').hidden = !registered; $('guest-checkout-note').hidden = registered;
  $('auth-guest').hidden = registered; $('guest-end').hidden = !guest(next);
  $('account-value').textContent = registered ? 'Save a version in Resumes to keep your work.' : 'Guest session · Sign in to save across devices.';
  status(registered ? 'Save a version here, then reopen it whenever you want to make updates.' : 'A free account lets you keep resumes and background details for later.');
  if (registered || guest(next)) { rememberChoice(registered ? 'account' : 'guest'); $('welcome-dialog').close(); }
  if (next) { callback?.restoreDeviceDraft(next.uid); if (registered) refreshSaved(); refreshPurchases(); }
  careerUI?.accountChanged();profileSetup?.accountChanged();
}
async function ensureGuest() {
  const c = await ensureConnection();
  if (c.auth.currentUser) return c;
  const response = await fetch('https://vcp-proxy.vercel.app/api/claude', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({workspace:true,action:'guest'})});
  const result = await response.json();
  if (!response.ok || typeof result.token !== 'string') throw new Error(result.error || 'Guest checkout could not start. Try again or create a free account.');
  await c.auth.setPersistence(c.firebase.auth.Auth.Persistence.SESSION);
  try { await c.auth.signInWithCustomToken(result.token); } catch { throw new Error('Guest checkout could not start. Your draft is safe; try again or create a free account.'); }
  return c;
}


function status(text) { $('cloud-status').textContent = text; }
function errorText(error) {
  const code = error?.code || '';
  if (/invalid-credential|wrong-password|user-not-found/.test(code)) return 'Sign-in failed. Check your email and password or reset your password.';
  if (/email-already-in-use|credential-already-in-use/.test(code)) return 'An account already uses that email. Sign in or reset your password.';
  if (/permission-denied/.test(code)) return 'Your account could not access this saved item. Sign in again or contact support.';
  if (/weak-password/.test(code)) return 'Choose a password with at least 8 characters.';
  if (/too-many-requests/.test(code)) return 'Too many attempts. Wait a few minutes before trying again.';
  if (/network/.test(code)) return 'Account services could not connect. Check your connection and try again.';
  return 'Account services could not complete that action. Your current draft is unchanged. Try again or contact support.';
}
const readProfile = readBackground;
function fillProfile(profile) { fillBackground(profile); profileDirty = false; }
function resetPrivateState() {
  profileSetup?.reset();careerUI?.reset();
  saved = []; fillProfile({});
  $('auth-email').value = ''; $('auth-password').value = ''; $('ai-consent').checked = false; $('purchase-consent').checked = false; $('save-submitted').checked = false;
  callback?.clearAccountDraft();
  resetPayments();
}
async function ensureConnection() {
  if (connection) { await authReady; return connection; }
  const c = await connectFirebase(); connection = c; store = createCloudStore(c);
  let ready; authReady = new Promise(resolve => { ready = resolve; });
  c.auth.onAuthStateChanged(next => { updateUser(next); ready(); });
  await authReady; return c;
}
async function refreshSaved() {
  const version = accountVersion;
  try { const items = await store.list(); if (version !== accountVersion) return []; saved = items; return items; }
  catch { status('Saved resumes could not load. Your local draft is unchanged. Open Resumes and try Refresh.'); }
}
async function cloudAction(action) {
  try {
    await ensureConnection();
    if (!connection.auth.currentUser || guest(connection.auth.currentUser)) { openAccount('create'); return; }
    if (!$('career-storage-consent').checked) { careerUI.open('profile'); $('career-storage').open = true; status('Agree to private account storage before saving.'); $('career-storage-consent').focus(); return; }
    await action();
  } catch (error) { status(errorText(error)); }
}

export const draftOwnerId = () => user?.uid || null;
async function openSavedVersion(item) {
  if(callback.getDraft().resume.trim()&&!confirm('Replace the current draft with this saved version? Save or download your current work first.'))return false;
  const draft=savedResumeToDraft(item),version=accountVersion;
  if(draft.buildId)await unlockSavedBuild(draft.buildId);
  if(version!==accountVersion)throw new Error('Your account changed. Reopen this version.');
  $('account-dialog').close();callback.loadDraft(draft);status('Saved version opened. Save again to create another snapshot.');return true;
}
async function careerStore(write=false) {
 await ensureConnection();
 if(!user?.email)throw new Error('Create a free account or sign in to save and reopen career tools across devices.');
 if(write&&!$('career-storage-consent').checked){$('career-storage').open=true;$('career-storage-consent').focus();throw new Error('Agree to private account storage before saving.');}
 return store;
}

export function initWorkspace(adapter) {
  callback = adapter; fillProfile({});
  careerUI=initCareerTools({
   user:()=>user,openAccount:()=>openAccount(),getProfile:readProfile,getDraft:()=>callback.getDraft(),
   applyProfile:profile=>{fillProfile(profile);profileDirty=true;const select=document.querySelector('[data-profile-section]');select.value='roles';select.dispatchEvent(new Event('change'));},
   saveProfile:async()=>{const s=await careerStore(true);await s.saveProfile(readProfile(),profileSetup?.snapshot()||undefined);profileDirty=false;},
   loadProfile:async()=>{const s=await careerStore();if(profileDirty&&!confirm('Replace your unsaved career profile with the saved profile?'))return;const version=accountVersion;const data=await s.profile();if(version===accountVersion){fillProfile(profileFromWebsite(data));profileSetup?.loaded(data);}},
   buildProfile:()=>choosePaidEntry('build'),
   listVersions:async()=>{const s=await careerStore();return s.list();},
   saveVersion:async title=>{const s=await careerStore(true);const item=await s.save(callback.getDraft(),title);callback.markVersion(item);await refreshSaved();return item;},
   openVersion:openSavedVersion,removeVersion:async id=>(await careerStore()).remove(id),
   listJobs:async()=>(await careerStore()).jobs(),saveJob:async(job,id)=>(await careerStore(true)).saveJob(job,id),removeJob:async id=>(await careerStore()).removeJob(id),
   listLetters:async()=>(await careerStore()).letters(),saveLetter:async(id,content,title)=>(await careerStore(true)).saveLetter(id,content,title),removeLetter:async id=>(await careerStore()).removeLetter(id),
   chooseJob:async job=>{
    const context=careerBuildContext(),draft=callback.getDraft();
    if(context?.completed&&draft.role.trim()===job.role.trim()&&draft.jobDescription.trim()===(job.description||'').trim()&&draft.applicationType===job.applicationType){callback.showResume();setFlow('job');return;}
    if(context?.bound&&!confirm('Tailoring to a different job starts a new $1.99 AI build. Your current result remains in purchase history. Save or download any unsaved edits first. Continue to the new build?'))return false;
    if(context&&!context.bound){callback.setJob(job);choosePaidEntry('edit');return;}
    // Save a private snapshot and job before redirecting to Stripe. Checkout
    // carries only opaque IDs; the user's resume never goes to Stripe.
    const s=await careerStore(true),savedJob=await s.saveJob(job,job.id||undefined);
    const version=draft.resume.trim()?await s.save(draft,job.role+' · source for tailoring'):null;
    if(version)callback.markVersion(version);
    callback.setJob(job);choosePaidEntry('edit',{jobId:savedJob.id,resumeVersionId:version?.id||''});
   },
   openPurchases:()=>{openAccount();$('purchase-history').open=true;},returnReview:()=>callback.showReviewTab()
  });
  profileSetup=initProfileSetup({user:()=>user,getProfile:readProfile,isDirty:()=>profileDirty,fillProfile,markClean:()=>{profileDirty=false;},openProfile:()=>careerUI.open('profile'),goHome:()=>showAppView('home'),useProfile:()=>choosePaidEntry('build'),load:async()=>(await careerStore()).profile(),save:async(profile,setup)=>(await careerStore(true)).saveProfile(profile,setup)});
  initAppShell({openCareer:careerUI.open,openAccount:()=>openAccount(),getDraft:()=>callback.getDraft(),hasPaidBuild,continueResume:()=>callback.continueResume()});
  initGuidedFlow({showResume:adapter.showResume,openAccount:()=>openAccount(),canUse:hasPaidBuild,startEntry:choosePaidEntry,newResume:()=>{
    if(callback.getDraft().resume.trim()&&!confirm('Start a new paid build? Save or download your current work first. Your previous purchases remain in purchase history.'))return false;
    callback.clearAccountDraft();forgetActiveBuild();return true;
  }});
  $('welcome-create').onclick = () => openAccount('create');
  $('welcome-signin').onclick = () => openAccount('signin');
  $('welcome-guest').onclick = continueGuest;
  $('auth-guest').onclick = continueGuest;
  $('guest-end').onclick = async () => {
    if(!confirm('End this guest session and clear this device? Download your work or create an account first. You may lose access to guest purchases when the session ends.'))return;
    $('account-dialog').close(); const c=await ensureConnection(); await c.auth.signOut(); rememberChoice(null); $('welcome-dialog').showModal();
  };
  $('welcome-dialog').addEventListener('cancel', event => { event.preventDefault(); continueGuest(); });
  $('auth-switch').onclick = () => mode(authMode === 'create' ? 'signin' : 'create');
  $('checkout-create').onclick = () => openAccount('create');
  if (!choice() && !new URLSearchParams(location.search).has('build')) $('welcome-dialog').showModal();
  initPayments({ ensureConnection, ensureGuest, adapter,restoreEntryContext:async context=>{
    await ensureConnection();const version=accountVersion;
    const [job,resume]=await Promise.all([store.getJob(context.jobId),context.resumeVersionId?store.getVersion(context.resumeVersionId):null]);
    if(version!==accountVersion)throw new Error('Your account changed. Open this purchase again.');
    if(resume)callback.loadDraft(savedResumeToDraft(resume));callback.setJob(job);
  } });
  $('background-fields').addEventListener('input', () => { profileDirty = true; });
  $('build-draft').addEventListener('click', () => {
    if(!hasPaidBuild()){choosePaidEntry('build');return;}
    try {
      const text = profileToResume(readProfile());
      if (callback.getDraft().resume.trim() && !confirm('Replace the current draft with your service background? Save or download your existing work first.')) return;
      callback.loadDraft({ ...callback.getDraft(), resume: text });
      $('builder-status').textContent = 'Your starting draft is ready. Check the text, then continue to job details.';
      setFlow('edit'); $('resume-input').focus();
    } catch (error) { $('builder-status').textContent = error.message; }
  });
  $('account-open').addEventListener('click', () => openAccount());
  $('account-close').addEventListener('click', () => { $('account-dialog').close(); if(!choice())$('welcome-dialog').showModal(); });
  $('account-form').addEventListener('submit', async event => {
    event.preventDefault(); $('auth-status').textContent = '';
    const button = event.submitter; button.disabled = true;
    try {
      const c = await ensureConnection();
      await c.auth.setPersistence($('keep-signed-in').checked ? c.firebase.auth.Auth.Persistence.LOCAL : c.firebase.auth.Auth.Persistence.SESSION);
      if (button.value === 'create') {
        if (!$('account-terms').checked) throw new Error('Agree to the Terms and Privacy Policy before creating your account.');
        if ($('auth-password').value.length < 8) throw Object.assign(new Error('weak password'), { code: 'auth/weak-password' });
        if (guest(c.auth.currentUser)) {
          const credential = c.firebase.auth.EmailAuthProvider.credential($('auth-email').value.trim(), $('auth-password').value);
          await c.auth.currentUser.linkWithCredential(credential); updateUser(c.auth.currentUser);
        } else await c.auth.createUserWithEmailAndPassword($('auth-email').value.trim(), $('auth-password').value);
      } else {
        if (guest(c.auth.currentUser) && !confirm('Signing in to an existing account clears this guest workspace. Download any guest work first. Creating a new account instead keeps this guest session’s work and purchases. Continue to sign in?')) return;
        await c.auth.signInWithEmailAndPassword($('auth-email').value.trim(), $('auth-password').value);
      }
      rememberChoice('account'); $('welcome-dialog').close(); $('auth-password').value = ''; $('account-dialog').close();
      if(button.value==='create')profileSetup.newAccount();
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
    try { $('account-dialog').close(); await connection.auth.signOut(); rememberChoice(null); $('welcome-dialog').showModal(); } catch { $('auth-status').textContent = 'Sign-out failed. Try again before leaving a shared device.'; }
  });
  $('save-profile').addEventListener('click', () => cloudAction(async () => { await store.saveProfile(readProfile(),profileSetup?.snapshot()||undefined); profileDirty = false; status('Program background saved. Main-site profile and subscriptions are separate.'); }));
  $('load-profile').addEventListener('click', async () => {
    try {
      await ensureConnection(); if (!user || guest(user)) { openAccount('create'); return; }
      if (profileDirty && !confirm('Replace the unsaved service background with your account profile?')) return;
      const version = accountVersion; const data = await store.profile(); if (version !== accountVersion) return;
      $('account-dialog').close(); fillProfile(profileFromWebsite(data)); setFlow('build'); $('background-builder').open = true; status('Account background loaded. Check the details before building a draft.');
    } catch (error) { status(errorText(error)); }
  });
  $('delete-background').addEventListener('click', async () => {
    if (!user || !confirm('Delete the service background saved by this workspace? Your original website profile, resumes, and downloaded files are unchanged.')) return;
    try { const uid = connection.auth.currentUser.uid; await store.removeProfile(); if(user?.uid===uid){profileSetup?.reset();status('Workspace service background deleted from the active database.');} }
    catch (error) { status(errorText(error)); }
  });
  $('export-account').addEventListener('click', async () => {
    try {
      if (!user) return; const version = accountVersion;
      const [profile, resumes, applications, coverLetters] = await Promise.all([store.profile(), store.list(), store.jobs(), store.letters()]); if (version !== accountVersion) return;
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, resumes, applications, coverLetters }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'veteran-career-path-account.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      status('Downloaded your profile, up to 50 resume versions, 100 applications and 100 cover letters. Contact support for a full account export.');
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
  ensureConnection().catch(() => status('Account services could not load. You can still edit and export without cloud storage.'));
}

export async function requestVeteranReview(payload, signal) {
  if (!$('ai-consent').checked) { $('ai-consent').focus(); throw new Error('Agree to sending this draft for AI processing before requesting a build.'); }
  if (!$('purchase-consent').checked) { $('purchase-consent').focus(); throw new Error('Agree to save your paid build for recovery before starting AI review. No additional payment is needed.'); }
  const c = await ensureGuest();
  if (c.auth.currentUser && !guest(c.auth.currentUser) && $('save-submitted').checked) {
    await store.save(callback.getDraft(), payload.role ? payload.role + ' · submitted resume' : 'Submitted resume');
    await refreshSaved();
  }
  return requestPaidReview(payload,signal);
}
