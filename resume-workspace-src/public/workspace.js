import {purchasedResumeItems,mergeResumeItems} from './resume-list-model.js?v=20261028-guided';
import {initProfileImport} from './profile-import.js?v=20261026-guided-updates';
import {createProfileStorage} from './profile-storage.js?v=20261030-visible-gallery';
import {beginGooglePopup,googleErrorMessage,startsProfileSetup} from './google-auth.js?v=20261028-google-signin';
import {initProfileSetup} from './profile-setup.js?v=20261026-career-tools';
import {showAppView} from './app-shell.js?v=20261028-guided';
import { initGuidedFlow, setFlow } from './guided-flow.js?v=20261028-guided';
import { fillBackground, readBackground } from './background-form.js?v=20261026-career-tools';
import { initPayments, requestPaidReview, resetPayments, refreshPurchases, hasPaidBuild, choosePaidEntry, forgetActiveBuild, unlockSavedBuild, careerBuildContext, listPurchasedResumes, deletePurchasedResume, openPurchasedResume, readPurchasedResume, openBuild } from './payments.js?v=20261028-guided';
import { initCareerTools } from './career-tools.js?v=20261029-completion';
import {initCompletionPrompt} from './completion-prompt.js?v=20261029-completion2';
import {initAppShell} from './app-shell.js?v=20261028-guided';
import { normalizeProfile, profileToResume, profileFromWebsite } from './veteran-profile.js?v=20261026-career-tools';
import { createCloudStore, savedResumeToDraft } from './cloud-store.js?v=20261028-guided';
import { connectFirebase } from './firebase-client.js';

const $ = id => document.getElementById(id);
const website = /(^|\.)veterancareerpath\.com$/i.test(location.hostname);
let connection, store, user = null, accountVersion = 0, profileImport;
let saved = [];
let callback;
let profileDirty = false;
let profileStorage;
let authReady;
let authMode = 'signin';
let careerUI,profileSetup,googleReady=false,googleBusy=false,emailBusy=false,persistenceEpoch=0;
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
  $('auth-status').textContent='';$('google-existing-choice').hidden=true;
}
function openAccount(value) {
  $('welcome-dialog').close();
  mode(value || (guest(user) ? 'create' : 'signin'));
  $('account-dialog').showModal();
  ensureConnection().catch(error => { $('auth-status').textContent = errorText(error); });
}
function continueGuest() {
  rememberChoice('guest'); $('welcome-dialog').close(); $('account-dialog').close();
  $('account-label').textContent = 'Account';
}
function updateUser(next) {
  ++accountVersion;const previousUser=user;
  if (user && user.uid !== next?.uid) resetPrivateState();
  user = next;
  const registered = !!next && !guest(next);
  $('account-label').textContent = 'Account';
  $('account-email').textContent = registered ? next.email : '';
  $('account-signed-in').hidden=!registered;$('account-form').hidden=registered;$('google-signin-box').hidden=registered;$('auth-remember-row').hidden=registered;
  $('account-link-google').hidden=!registered||!!next.providerData?.some(provider=>provider.providerId==='google.com');
  $('start-saved').hidden = !registered; $('save-submitted-row').hidden = !registered; $('guest-checkout-note').hidden = registered;
  $('auth-guest').hidden = registered; $('guest-end').hidden = !guest(next);
  $('account-value').textContent = registered ? 'Save a version in Resumes to keep your work.' : 'Guest session · Sign in to save across devices.';
  status(registered ? 'Save a version here, then reopen it whenever you want to make updates.' : 'A free account lets you keep resumes and background details for later.');
  if (registered || guest(next)) { rememberChoice(registered ? 'account' : 'guest'); $('welcome-dialog').close(); }
  if (next) { restoreAccountWorkspace(next,accountVersion); if (registered) refreshSaved(); refreshPurchases(); }
  profileImport?.accountChanged();careerUI?.accountChanged();profileSetup?.accountChanged();profileStorage?.accountChanged();syncGoogleButtons();if(previousUser?.email&&!next?.email)prepareGooglePersistence();
}
async function restoreAccountWorkspace(account,version){
  // A server-side account reset must also retire the owner's older device draft.
  // Read the marker before restoring; do not revive a cached copy after deletion.
  try{const resetAt=account.email?await store.workspaceReset():0;if(user?.uid!==account.uid||version!==accountVersion)return;callback?.restoreDeviceDraft(account.uid,resetAt);}
  catch{if(user?.uid===account.uid&&version===accountVersion)status('Your device draft could not be checked. Reopen Account to retry. Saved resumes remain in Resumes.');}
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
  document.dispatchEvent(new Event('app:account-cleared'));
  profileImport?.reset();profileStorage?.reset();profileSetup?.reset();careerUI?.reset();$('google-existing-choice').hidden=true;
  saved=[];fillProfile({});$('keep-signed-in').checked=false;
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
function syncGoogleButtons(){
 const busy=googleBusy||emailBusy;
 for(const id of ['auth-google','welcome-google','account-link-google','google-switch-account'])$(id).disabled=!googleReady||busy;
 $('welcome-google-status').textContent=!googleReady?'Preparing Google sign-in…':'';
 $('auth-submit').disabled=busy;$('keep-signed-in').disabled=busy;
 for(const id of ['auth-guest','guest-end','account-signout','auth-switch'])$(id).disabled=busy;
 for(const id of ['auth-google','welcome-google','account-link-google'])$(id).setAttribute('aria-busy',String(googleBusy));
}
async function prepareGooglePersistence(){
 if(!connection)return;const epoch=++persistenceEpoch;googleReady=false;syncGoogleButtons();
 try{await authReady;if(!connection.auth.currentUser?.email)await connection.auth.setPersistence($('keep-signed-in').checked&&!guest(connection.auth.currentUser)?connection.firebase.auth.Auth.Persistence.LOCAL:connection.firebase.auth.Auth.Persistence.SESSION);if(epoch===persistenceEpoch){googleReady=true;syncGoogleButtons();}}
 catch{if(epoch===persistenceEpoch){googleReady=false;syncGoogleButtons();$('auth-status').textContent='Account services could not prepare Google sign-in. Try opening Account again, or use email sign-in.';}}
}
function googleSignIn({linkCurrent=false,switchFromGuest=false}={}){
 if(!googleReady||googleBusy||emailBusy)return;
 const before=connection.auth.currentUser,guestBefore=guest(before)?before.uid:null,remember=$('keep-signed-in').checked;
 if(switchFromGuest&&!confirm('Switch to your existing Google account? This ends the guest session and may lose access to its purchases. Finish or download guest results first. Cancel to keep the guest session or link a different Google account.'))return;
 googleBusy=true;syncGoogleButtons();$('google-existing-choice').hidden=true;
 let operation;
 try{operation=beginGooglePopup(connection,{linkCurrent,switchFromGuest});}catch(error){operation=Promise.reject(error);}
 $('welcome-dialog').close();if(!$('account-dialog').open)$('account-dialog').showModal();$('auth-status').textContent=linkCurrent?'Linking Google…':'Connecting to Google…';
 Promise.resolve(operation).then(async result=>{
  if(connection.auth.currentUser?.uid!==result.user.uid)throw Object.assign(new Error('Account changed'),{code:'auth/user-mismatch'});
  let persistenceWarning=false;if(!linkCurrent){try{await connection.auth.setPersistence(remember?connection.firebase.auth.Auth.Persistence.LOCAL:connection.firebase.auth.Auth.Persistence.SESSION);}catch{persistenceWarning=true;}}
  if(connection.auth.currentUser?.uid!==result.user.uid)return;
  updateUser(result.user);rememberChoice('account');$('auth-password').value='';$('auth-status').textContent='';$('account-dialog').close();
  if(!linkCurrent&&startsProfileSetup(result,guestBefore))profileSetup.newAccount();
  document.dispatchEvent(new CustomEvent('app:notice',{detail:linkCurrent?'Google is linked to this account. You can use either sign-in method.':persistenceWarning?'Signed in with Google. This browser could not save your sign-in preference.':'Signed in with Google.'}));
 }).catch(error=>{
  $('auth-status').textContent=googleErrorMessage(error);
  if(guest(connection.auth.currentUser)&&error?.code==='auth/credential-already-in-use')$('google-existing-choice').hidden=false;
  if(error?.code==='auth/account-exists-with-different-credential'){
   mode('signin');$('auth-status').textContent=googleErrorMessage(error);const email=error.email||error.customData?.email;if(typeof email==='string'&&email.length<=254)$('auth-email').value=email;
  }
 }).finally(()=>{googleBusy=false;syncGoogleButtons();});
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
  if(!item.finished&&!item.purchased&&callback.getDraft().resume.trim()&&!confirm('Replace the current draft with this saved version? Save or download your current work first.'))return false;
  const draft=savedResumeToDraft(item),version=accountVersion;
  const buildId=item.buildId||draft.buildId,design=item.design||draft.design;
  if(item.finished&&buildId&&callback.getDraft().resume.trim()&&((callback.getDraft().buildId&&callback.getDraft().buildId!==buildId)||(draft.resume&&callback.getDraft().resume!==draft.resume))&&!confirm('Open this purchased resume? Unsaved changes in your current editor will be replaced.'))return false;
  if(item.finished&&buildId){$('account-dialog').close();await openPurchasedResume(buildId,design);return true;}
  if(item.purchased&&!draft.resume&&buildId){await openBuild(buildId,{confirmReplace:false});return true;}
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

export async function saveFinishedResume(draft){
 if(!user?.email)return null;
 const uid=user.uid,version=accountVersion;await ensureConnection();
 if(uid!==user?.uid||version!==accountVersion)throw new Error('Your account changed. Reopen your finished resume.');
 const item=await store.saveFinished(draft);
 if(version!==accountVersion)throw new Error('Your account changed while saving. Reopen your finished resume.');
 callback.markVersion(item);await refreshSaved();return item;
}
export function initWorkspace(adapter) {
  callback = adapter; fillProfile({});
  careerUI=initCareerTools({
   user:()=>user,openAccount:()=>openAccount(),reviewCurrent:()=>adapter.showCheckout(),getProfile:readProfile,getDraft:()=>callback.getDraft(),
   applyProfile:profile=>{fillProfile(profile);profileDirty=true;profileStorage?.dirty();const select=document.querySelector('[data-profile-section]');select.value='roles';select.dispatchEvent(new Event('change'));},
   saveProfile:()=>profileStorage.save(undefined,profileSetup?.snapshot()||undefined),
   loadInterest:async()=>(await careerStore()).interest(),saveInterest:async value=>(await careerStore()).saveInterest(value),removeInterest:async()=>(await careerStore()).removeInterest(),
   loadProfile:()=>profileStorage.reload(),
   profileReady:()=>profileStorage.accountChanged(),
   saveFinished:saveFinishedResume,
   loadDigitalCv:async()=>(await careerStore()).digitalCv(),
   publishDigitalCv:async cv=>{const uid=user?.uid,version=accountVersion;const s=await careerStore();if(uid!==user?.uid||version!==accountVersion)throw new Error('Your account changed. Review your CV again.');return s.publishDigitalCv(cv);},
   unpublishDigitalCv:async()=>{const uid=user?.uid,version=accountVersion;const s=await careerStore();if(uid!==user?.uid||version!==accountVersion)throw new Error('Your account changed. Open your CV again.');return s.unpublishDigitalCv();},
   buildProfile:()=>choosePaidEntry('build'),
   listVersions:async()=>{
    const uid=user?.uid,version=accountVersion,s=await careerStore();
    const values=await Promise.allSettled([s.list(),listPurchasedResumes()]);
    if(version!==accountVersion||uid!==user?.uid)throw new Error('Your account changed. Open My resumes again.');
    if(values.every(value=>value.status==='rejected'))throw new Error('Your resumes could not load. Try again; your purchases are still recoverable.');
    return mergeResumeItems(values[0].status==='fulfilled'?values[0].value:[],purchasedResumeItems(values[1].status==='fulfilled'?values[1].value:[]));
   },
   resolveVersion:async item=>item.finished&&(item.buildId||item.workspace?.buildId)?readPurchasedResume(item.buildId||item.workspace.buildId,item.design||item.workspace.design):savedResumeToDraft(item),
   downloadVersion:async item=>{if(await openSavedVersion(item)!==false)callback.downloadPdf();},
   saveVersion:async title=>{const s=await careerStore(true);const item=await s.save(callback.getDraft(),title);callback.markVersion(item);await refreshSaved();return item;},
   openVersion:openSavedVersion,removeVersion:async item=>{
    const uid=user?.uid,version=accountVersion,s=await careerStore();
    if(uid!==user?.uid||version!==accountVersion)throw new Error('Your account changed. Open My resumes again.');
    if(item.purchased||item.finished&&(item.buildId||item.workspace?.buildId))await deletePurchasedResume(item);
    else await s.remove(item.id);
    if(uid!==user?.uid||version!==accountVersion)throw new Error('Your account changed. Open My resumes again.');
    await refreshSaved();document.dispatchEvent(new Event('resume:library-changed'));
   },
   listJobs:async options=>(await careerStore()).jobs(options),saveJob:async(job,id)=>(await careerStore(true)).saveJob(job,id),removeJob:async id=>(await careerStore()).removeJob(id),
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
  profileSetup=initProfileSetup({user:()=>user,getProfile:readProfile,isDirty:()=>profileDirty,fillProfile,markClean:()=>{profileDirty=false;},openProfile:()=>careerUI.open('profile'),goHome:()=>showAppView('home'),useProfile:()=>choosePaidEntry('build'),load:async()=>(await careerStore()).profile(),save:(profile,setup)=>profileStorage.save(profile,setup)});
  profileStorage=createProfileStorage({user:()=>user,read:readProfile,isDirty:()=>profileDirty,fill:data=>fillProfile(profileFromWebsite(data)),clean:()=>{profileDirty=false;},loaded:data=>profileSetup.loaded(data),store:()=>careerStore(),openAccount:()=>openAccount('create'),confirm:message=>confirm(message),status:({kind,text,busy,retry})=>{
    $('profile-save-feedback').textContent=text;$('profile-persistence-status').textContent=text;$('profile-persistence-status').dataset.state=kind;$('profile-load-retry').hidden=!retry;
    for(const id of ['career-profile-save','profile-save-bottom','save-profile'])$(id).disabled=busy;
  }});
  profileImport=initProfileImport({user:()=>user,getProfile:readProfile,getResume:()=>callback.getDraft().resume,ready:async()=>{await ensureConnection();await profileStorage.accountChanged();},applyProfile:profile=>{fillProfile(profile);profileDirty=true;profileStorage.dirty();},saveProfile:()=>profileStorage.save(undefined,profileSetup?.snapshot()||undefined),openProfile:()=>careerUI.open('profile'),openAccount:()=>openAccount('create')});
  document.addEventListener('resume:save-working',async()=>{
    if(!user?.email){$('draft-save-status').textContent='Create an account to save this draft across visits.';openAccount('create');return;}
    const uid=user.uid,version=accountVersion;$('save-progress').disabled=true;$('draft-save-status').textContent='Saving your draft…';
    try{await ensureConnection();if(version!==accountVersion||uid!==user?.uid)return;const item=await store.saveWorking(callback.getDraft());if(version!==accountVersion)return;callback.markVersion(item);$('draft-save-status').textContent='Draft saved in My resumes. Finish your design when you are ready to download.';}
    catch(error){if(version===accountVersion)$('draft-save-status').textContent='This draft could not be saved. Keep this tab open and try again.';}
    finally{if(version===accountVersion)$('save-progress').disabled=false;}
  });
  $('profile-load-retry').onclick=()=>profileStorage.reload();
  initAppShell({openCareer:careerUI.open,openAccount:()=>openAccount(),getDraft:()=>callback.getDraft(),hasPaidBuild,continueResume:()=>callback.continueResume()});
  initCompletionPrompt({owner:()=>user?.uid,build:careerBuildContext,openCv:()=>$('finished-cv').click(),openLetter:()=>careerUI.open('letter'),request:async(action,details,signal)=>{
    const c=await ensureConnection(),owner=c.auth.currentUser,version=accountVersion;
    if(!owner)throw new Error('Sign in again.');
    const token=await owner.getIdToken();
    if(owner.uid!==user?.uid||version!==accountVersion)throw new Error('Account changed.');
    const response=await fetch('https://vcp-proxy.vercel.app/api/claude',{method:'POST',headers:{'Content-Type':'application/json','X-VCP-Firebase-Token':token},body:JSON.stringify({workspace:true,action,...details}),signal:signal||AbortSignal.timeout(12000)});
    const result=await response.json();
    if(owner.uid!==user?.uid||version!==accountVersion||!response.ok)throw new Error('Feedback could not be sent.');
    return result;
  }});
  initGuidedFlow({showResume:adapter.showResume,manualFinish:()=>adapter.showExport(),openAccount:()=>openAccount(),canUse:hasPaidBuild,startEntry:choosePaidEntry,newResume:()=>{
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
  initPayments({saveFinished:saveFinishedResume, ensureConnection, ensureGuest, adapter,restoreEntryContext:async context=>{
    await ensureConnection();const version=accountVersion;
    const [job,resume]=await Promise.all([store.getJob(context.jobId),context.resumeVersionId?store.getVersion(context.resumeVersionId):null]);
    if(version!==accountVersion)throw new Error('Your account changed. Open this purchase again.');
    if(resume)callback.loadDraft(savedResumeToDraft(resume));callback.setJob(job);
  } });
  $('background-fields').addEventListener('input', () => { profileDirty = true;profileStorage.dirty(); });
  $('build-draft').addEventListener('click', () => {
    if(!hasPaidBuild()){choosePaidEntry('build');return;}
    try {
      const text = profileToResume(readProfile());
      if (callback.getDraft().resume.trim() && !confirm('Replace the current draft with your service background? Save or download your existing work first.')) return;
      callback.loadDraft({ ...callback.getDraft(), resume: text });
      $('builder-status').textContent = 'Your starting draft is ready. Check the text, then choose AI review or design and download.';
      setFlow('edit'); $('resume-input').focus();
    } catch (error) { $('builder-status').textContent = error.message;$('builder-status').scrollIntoView({block:'center',behavior:'instant'}); }
  });
  $('auth-google').onclick=()=>googleSignIn();$('welcome-google').onclick=()=>googleSignIn();$('account-link-google').onclick=()=>googleSignIn({linkCurrent:true});$('google-switch-account').onclick=()=>googleSignIn({switchFromGuest:true});$('google-keep-guest').onclick=()=>{$('google-existing-choice').hidden=true;$('auth-status').textContent='Your guest session is unchanged. You can continue working or try a different Google account.';};
  $('keep-signed-in').addEventListener('change',prepareGooglePersistence);
  $('account-open').addEventListener('click',()=>{openAccount();if(!googleReady)ensureConnection().then(prepareGooglePersistence).catch(()=>{});});
  $('account-close').addEventListener('click', () => { $('account-dialog').close(); if(!choice())$('welcome-dialog').showModal(); });
  $('account-form').addEventListener('submit', async event => {
    event.preventDefault(); $('auth-status').textContent = '';
    if(googleBusy||emailBusy)return;const button=event.submitter;emailBusy=true;syncGoogleButtons();
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
    finally{emailBusy=false;syncGoogleButtons();}
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
  $('save-profile').addEventListener('click', () => profileStorage.save(undefined,profileSetup?.snapshot()||undefined).catch(error=>status(errorText(error))));
  $('load-profile').addEventListener('click', async () => {if(await profileStorage.reload()){setFlow('build');$('background-builder').open=true;}});
  $('delete-background').addEventListener('click', async () => {
    if (!user || !confirm('Delete the service background saved by this workspace? Your original website profile, resumes, and downloaded files are unchanged.')) return;
    try { const uid = connection.auth.currentUser.uid; await store.removeProfile(); if(user?.uid===uid){profileSetup?.reset();status('Workspace service background deleted from the active database.');} }
    catch (error) { status(errorText(error)); }
  });
  $('export-account').addEventListener('click', async () => {
    try {
      if (!user) return; const version = accountVersion;
      const [profile, resumes, applications, coverLetters, digitalCv, careerInterests] = await Promise.all([store.profile(), store.list(), store.jobs(), store.letters(), store.digitalCv(), store.interest()]); if (version !== accountVersion) return;
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, resumes, applications, coverLetters, digitalCv, careerInterests }, null, 2)], { type: 'application/json' });
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
  ensureConnection().then(prepareGooglePersistence).catch(()=>{$('welcome-google-status').textContent='Google sign-in could not load. Try email sign-in or continue as guest.';status('Account services could not load. You can still edit and export without cloud storage.');});
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
