// Checkout never receives resume content. Private server-owned build records make
// paid results recoverable without trusting redirect flags or browser storage.
import {runRecoverableBuild} from './build-recovery.js?v=20261025-standalone-app';
const $=id=>document.getElementById(id);
const endpoint='https://vcp-proxy.vercel.app/api/claude';
let config,active=null,generation=0;
// Match server validation: preserve resume content exactly and trim only optional
// job details. Formatting cleanup must never turn a verified purchase into a new one.
const sameInput=(a,b)=>!!a&&!!b&&a.resume===b.resume
 &&(a.applicationType??'private')===(b.applicationType??'private')
 &&['role','jobDescription','additionalDetails'].every(k=>(a[k]||'').trim()===(b[k]||'').trim());
const msg=t=>{$('purchase-status').textContent=t;};
async function api(action,extra={},signal){
 const c=await config.ensureConnection();const owner=c.auth.currentUser;
 if(!owner)throw new Error('Sign in to your free resume-program account first.');
 const version=generation;const token=await owner.getIdToken();
 if(c.auth.currentUser?.uid!==owner.uid||version!==generation)throw new Error('Account changed. Try again.');
 signal?.throwIfAborted();
 let response,data;
 try{
  response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-VCP-Firebase-Token':token},body:JSON.stringify({workspace:true,action,...extra}),signal});
  data=await response.json();
 }catch(error){
  signal?.throwIfAborted();
  if(c.auth.currentUser?.uid!==owner.uid||version!==generation)throw new Error('Account changed. Result discarded.');
  throw Object.assign(new Error('Connection interrupted. Your existing build is still recoverable from purchase history; no second payment is needed.'),{recoverable:true});
 }
 if(c.auth.currentUser?.uid!==owner.uid||version!==generation)throw new Error('Account changed. Result discarded.');
 const status=data.httpStatus||response.status;
 if(!response.ok||status>=400)throw Object.assign(new Error(data.error||'The purchase service could not complete this action.'),{status,errorCode:data.errorCode,recoverable:status>=500&&!data.errorCode});
 return data;
}
let entryMode='edit',requestId=null,entryContext=null;
const changed=()=>document.dispatchEvent(new Event('resume:payment-changed'));
export const hasPaidBuild=()=>!!active?.verified;
export const careerBuildContext=()=>active?.verified?{id:active.id,completed:!!active.review,bound:!!active.input,role:active.input?.role||'',jobDescription:active.input?.jobDescription||'',refinementCount:active.refinementCount||0,templates:active.templates||[],includedTemplate:active.includedTemplate||null,matches:active.careerMatches??active.review?.careerMatches}:null;
export async function requestCareerAssessment(signal,source){
 if(source?.resumeId)return api('career-assess-saved',{resumeId:source.resumeId,consent:true,keepAlive:true},signal);
 const id=source?.buildId||active?.id;
 if(!id||!source&&!active?.verified)throw new Error('Choose a saved resume first.');
 const result=await api('career-assess',{buildId:id,...(source?.design?{design:source.design}:{}),expand:true,consent:true,keepAlive:true},signal);
 if(!source){if(active?.id!==id)throw new Error('Another resume was opened. Open the assessed purchase to see its careers.');active={...active,careerMatches:result.matches};changed();}
 return result;
}
export async function requestCareerKit(signal){
 if(!active?.verified||!active.review)throw new Error('Open a completed resume build from purchase history first.');
 const result=await api('career',{buildId:active.id,consent:true,keepAlive:true},signal);return result.kit;
}
export async function unlockSavedBuild(id){
 if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))throw new Error('Open the original purchase from purchase history to unlock this older saved resume.');
 if(active?.id===id&&active.verified)return;
 const build=await api('get',{buildId:id});await unlock(build);
}
export async function deletePurchasedResume(item){
 const buildId=item.buildId||item.workspace?.buildId,design=item.design||item.workspace?.design;
 if(!buildId)throw new Error('Choose a saved resume first.');
 await api(item.finished?'resume-delete':'delete',{buildId,...(item.finished?{design}:{})});
 if(active?.id===buildId)forgetActiveBuild();
 document.dispatchEvent(new Event('resume:library-changed'));
}
export async function listPurchasedResumes(){const result=await api('list');return result.builds||[];}
export async function readPurchasedResume(buildId,design){const result=await api('template-open',{buildId,design});return {...result.document,buildId};}
export async function openPurchasedResume(buildId,design){
 const build=await api('get',{buildId});await unlock(build);
 const document=await readPurchasedResume(buildId,design);config.adapter.loadDraft(document);config.adapter.showExport({ready:true});return document;
}
export const canUseTemplate=design=>hasPaidBuild()&&(active.templates||[]).includes(design);
export async function finishTemplate(document){
 if(!hasPaidBuild())throw new Error('Reopen your paid build first.');
 const id=active.id;if(document.buildId&&document.buildId!==id)throw new Error('Another resume is open. Reopen the document you want to save.');
 const result=await api('template-finish',{buildId:id,document,storageConsent:true});
 if(active?.id!==id)throw new Error('Another resume was opened while saving. Your original document is still saved with its purchase.');
 if(result.url){redirectCheckout(result.url);return null;}
 active={...active,templates:result.templates,includedTemplate:result.includedTemplate};changed();return result.document;
}
export const includedUpdateAvailable=()=>hasPaidBuild()&&(active.refinementCount||0)<1;
export function forgetActiveBuild(){active=null;requestId=null;entryContext=null;changed();}
const runBuild=(id,signal,action='run',extra={})=>runRecoverableBuild(api,id,{signal,action,extra,onRecover:()=>{msg('Reconnecting to your existing build…');$('loading-message').textContent='Reconnecting and checking your saved result. No second payment is needed.';}});
export function resetPayments(){generation++;forgetActiveBuild();$('purchase-list').replaceChildren();msg('');}
function redirectCheckout(value){
 const url=new URL(value);if(url.origin!=='https://checkout.stripe.com')throw new Error('Checkout URL could not be verified.');
 location.assign(url.href);
}
export function choosePaidEntry(mode,context=null){
 entryMode=mode;
 const started=!!active?.input||!!active?.templates?.length;
 if(hasPaidBuild()&&!started){config.adapter.openEntry(mode);return;}
 const newBuild=hasPaidBuild()&&started;
 if(newBuild)forgetActiveBuild();
 entryContext=context;
 config.adapter.showPayment();
 $('purchase-path').textContent=mode==='build'?'Build a new resume':'Improve an existing resume';
 $('purchase-start-status').textContent=newBuild?'This starts a new resume build. Your previous purchase and result remain in purchase history.':'';
}
async function unlock(build){
 const verified=await api('verify',{buildId:build.id});
 active={...build,...verified,verified:true};requestId=active.requestId||null;changed();return active;
}
export async function beginPurchase(){
 const button=$('purchase-start');
 if(!$('upfront-consent').checked){$('purchase-start-status').textContent='Agree to the purchase and recovery terms to continue.';$('upfront-consent').focus();return;}
 button.disabled=true;
 try{
  await config.ensureGuest();requestId ||= crypto.randomUUID();
  const build=await api('purchase',{entryMode,requestId,storageConsent:true,...(entryContext?{entryContext}: {})});active={...build,entryMode,requestId,entryContext,verified:false};changed();
  if(build.url){redirectCheckout(build.url);return;}
  await unlock(active);if(active.entryContext)await config.restoreEntryContext(active.entryContext);config.adapter.openEntry(active.entryMode||entryMode);
 }catch(error){$('purchase-start-status').textContent=error.message;}
 finally{button.disabled=false;}
}
export async function openBuild(id,{confirmReplace=true}={}){
 let build=await api('get',{buildId:id});
 if(confirmReplace&&build.input&&config.adapter.getDraft().resume.trim()&&!sameInput(build.input,config.adapter.getDraft())&&!confirm('Open this purchase’s original draft? Save or download your current work first.'))return;
 active={...build,verified:false};entryMode=build.entryMode||'edit';requestId=build.requestId||null;
 $('account-dialog').close();
 try{build=await unlock(build);}catch(error){
  if(error.status!==402)throw error;
  if(build.prepaid){choosePaidEntry(entryMode);$('purchase-start-status').textContent='Complete your existing checkout to unlock the builder.';return build;}
  config.adapter.showPayment();$('purchase-start-status').textContent=error.message;return build;
 }
 if(build.input)config.adapter.loadDraft(build.input);
 if(build.review){config.adapter.loadReview(build.review,build.input?.resume);msg(build.lastError?.error||'Build reopened. Your selected template and repeat downloads are included.');}
 else if(build.input){config.adapter.showCheckout();msg('Your paid draft is restored. Finish this build without another payment.');}
 else{if(build.entryContext)await config.restoreEntryContext(build.entryContext);config.adapter.openEntry(build.entryMode||'edit');msg('Payment verified. Your resume build is unlocked.');}
 if(build.includedTemplate&&!(build.deletedTemplates||[]).includes(build.includedTemplate)){const result=await api('template-open',{buildId:id,design:build.includedTemplate});config.adapter.loadDraft({...result.document,buildId:id});config.adapter.showExport({ready:true});}
 return build;
}
export async function refreshPurchases(){
 try{
  const {builds}=await api('list');const list=$('purchase-list');list.replaceChildren();
  for(const build of builds){
   const amount=Number.isInteger(build.amount)?build.amount:199;
   const price=amount===0&&build.discountAmount>0?'Free · promo code':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount/100);
   const row=document.createElement('li'),text=document.createElement('span');
   text.textContent=new Date(build.createdAt).toLocaleDateString()+' · '+price+' · '+({complete:'Ready',paid:'Paid — continue building',running:'Building',awaiting_payment:'Checkout started — payment not yet verified'}[build.status]||build.status);
   const open=document.createElement('button');open.type='button';open.className='text-button';open.textContent=build.status==='complete'?'Open result':'Continue / recover';open.onclick=()=>openBuild(build.id).catch(e=>msg(e.message));
   const remove=document.createElement('button');remove.type='button';remove.className='text-button danger';remove.textContent='Delete data';remove.onclick=async()=>{
    if(!confirm('Delete this build’s input, answers and AI result? This does not cancel payment or issue a refund. A minimal purchase record is retained for accounting.'))return;
    try{await api('delete',{buildId:build.id});if(active?.id===build.id)forgetActiveBuild();await refreshPurchases();msg('Build input and result deleted from the active database.');}catch(e){msg(e.message);}
   };
   row.append(text,open);for(const design of (build.templates||[]).filter(value=>!(build.deletedTemplates||[]).includes(value))){const use=document.createElement('button');use.type='button';use.className='text-button';use.textContent='Open saved '+design;use.onclick=async()=>{try{await openBuild(build.id);const result=await api('template-open',{buildId:build.id,design});config.adapter.loadDraft(result.document);config.adapter.showExport({ready:true});}catch(e){msg(e.message);}};row.append(use);}row.append(remove);list.append(row);
  }
  $('purchase-empty').hidden=builds.length>0;
  const params=new URLSearchParams(location.search),id=params.get('build');
  if(id&&/^[a-f0-9]{64}$/.test(id)){
   $('purchase-history').open=true;history.replaceState(null,'',location.pathname+location.hash);
   const build=await openBuild(id);
   if(params.has('template')&&build?.verified){
    const design=params.get('template');
    if(params.get('checkout')==='canceled'){msg('Template checkout canceled. Your original template remains available. Choose the same new template to resume checkout.');return;}
    const result=await api('template-verify',{buildId:id,design,storageConsent:true});active={...active,templates:result.templates,includedTemplate:result.includedTemplate};changed();config.adapter.loadDraft(result.document);config.adapter.showExport({ready:true});try{await config.saveFinished(result.document);msg('New template verified and saved in My resumes. Repeat downloads are included.');}catch{msg('Template payment verified. Your finished resume is safe in purchase history. Press Save finished resume to retry the My resumes save without paying again.');}return;
   }
   if(params.get('checkout')==='success'&&build?.verified&&build.input&&!build.review){
    msg('Payment verified. Preparing your resume…');
    await config.adapter.recoverReview(async signal=>{const review=await runBuild(id,signal);active.review=review;active.refinementCount=review.refinementCount||0;return review;});
   }else if(params.get('checkout')==='canceled')msg('Checkout canceled. You can resume it from purchase history.');
  }
 }catch(error){msg(error.message);}
}
export function initPayments(c){config=c;$('refresh-purchases').onclick=()=>refreshPurchases();$('purchase-start').onclick=beginPurchase;}
export async function requestPaidReview(payload,signal){
 if(!hasPaidBuild()){choosePaidEntry('edit');throw Object.assign(new Error('Complete checkout before building your resume.'),{handled:true});}
 if(active.prepaid&&!active.input){const bound=await api('bind',{buildId:active.id,input:payload,consent:true,storageConsent:true},signal);active={...active,...bound,verified:true};}
 if(!sameInput(active.input,payload)){
  // Keep the verified purchase available for retry/recovery. Only an explicit
  // new-build action may start another checkout.
  throw new Error('This purchase is linked to the resume and job details you first submitted. Restore those details or reopen this build from purchase history to retry without paying again.');
 }
 const review=await runBuild(active.id,signal);active.review=review;active.refinementCount=review.refinementCount||0;changed();refreshPurchases();return review;
}
export async function refinePaidReview(answers,signal){
 if(!active?.review||!includedUpdateAvailable())throw new Error('Reopen your purchased review to use its included clarification update.');
 const review=await runBuild(active.id,signal,'refine',{answers});
 active.review=review;active.refinementCount=review.refinementCount||1;changed();return review;
}
