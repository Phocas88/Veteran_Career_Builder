// Checkout never receives resume content. Private server-owned build records make
// paid results recoverable without trusting redirect flags or browser storage.
const $=id=>document.getElementById(id);
const endpoint='https://vcp-proxy.vercel.app/api/claude';
let config,active=null,generation=0;
const sameInput=(a,b)=>['resume','role','jobDescription','applicationType','additionalDetails'].every(k=>(a?.[k]||'')===(b?.[k]||''));
const msg=t=>{$('purchase-status').textContent=t;};
async function api(action,extra={},signal){
 const c=await config.ensureConnection();const owner=c.auth.currentUser;
 if(!owner)throw new Error('Sign in to your free resume-program account first.');
 const version=generation;const token=await owner.getIdToken();
 if(c.auth.currentUser?.uid!==owner.uid||version!==generation)throw new Error('Account changed. Try again.');
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-VCP-Firebase-Token':token},body:JSON.stringify({workspace:true,action,...extra}),signal});
 const data=await response.json();
 if(c.auth.currentUser?.uid!==owner.uid||version!==generation)throw new Error('Account changed. Result discarded.');
 if(!response.ok)throw Object.assign(new Error(data.error||'The purchase service could not complete this action.'),{status:response.status});
 return data;
}
export function resetPayments(){generation++;active=null;$('purchase-list').replaceChildren();msg('');}
async function openBuild(id){
 const build=await api('get',{buildId:id});
 if(config.adapter.getDraft().resume.trim()&&!sameInput(build.input,config.adapter.getDraft())&&!confirm('Open this purchase’s original draft? Save or download your current work first.'))return;
 active=build; $('account-dialog').close(); config.adapter.loadDraft(build.input);
 if(build.review){config.adapter.loadReview(build.review);msg('Paid build reopened. Formatting and downloads are included.');}
 else { config.adapter.showCheckout(); msg(build.status==='running'?'This build is running. Reopen it shortly to recover the result.':'Your draft is restored. Continue from checkout to finish this build.'); }
 return build;
}
export async function refreshPurchases(){
 try{
 const {builds}=await api('list');const list=$('purchase-list');list.replaceChildren();
 for(const build of builds){const row=document.createElement('li');const text=document.createElement('span');text.textContent=new Date(build.createdAt).toLocaleDateString()+' · $1.99 · '+({complete:'Ready',paid:'Paid — retry available',running:'Building',awaiting_payment:'Checkout started — payment not yet verified'}[build.status]||build.status);
 const open=document.createElement('button');open.type='button';open.className='text-button';open.textContent=build.status==='complete'?'Open result':'Continue / recover';open.onclick=()=>openBuild(build.id).catch(e=>msg(e.message));
 const remove=document.createElement('button');remove.type='button';remove.className='text-button danger';remove.textContent='Delete data';remove.onclick=async()=>{if(!confirm('Delete the input and AI result for this build? This does not cancel a payment or issue a refund. A minimal purchase record is retained for accounting.'))return;try{await api('delete',{buildId:build.id});if(active?.id===build.id)active=null;await refreshPurchases();msg('Build input and result deleted from the active database.');}catch(e){msg(e.message);}};
 row.append(text,open,remove);list.append(row);}
 $('purchase-empty').hidden=builds.length>0;
 const params=new URLSearchParams(location.search);const id=params.get('build');
 if(id&&/^[a-f0-9]{64}$/.test(id)){
  $('purchase-history').open = true;
  history.replaceState(null,'',location.pathname+location.hash);
  const build=await openBuild(id);
  if(params.get('checkout')==='success' && build && !build.review) {
    msg('Checking payment and preparing your resume…');
    await config.adapter.recoverReview(async signal => (await api('run',{buildId:id,consent:true},signal)).review);
  } else if(params.get('checkout')==='canceled') msg('Checkout canceled. Your draft is restored. You can continue whenever you’re ready.');
 }
 }catch(e){msg(e.message);}
}
export function initPayments(c){config=c; $('refresh-purchases').onclick=()=>refreshPurchases();}
export async function requestPaidReview(payload,signal){
 if(active&&sameInput(active.input,payload)){
  try{const result=await api('run',{buildId:active.id,consent:true},signal);refreshPurchases();return result.review;}catch(e){if(e.status!==402)throw e;}
 }
 const build=await api('prepare',{input:payload,consent:true,storageConsent:true},signal);
 active={...build,input:payload};
 if(build.url){
  const url=new URL(build.url);if(url.origin!=='https://checkout.stripe.com')throw new Error('Checkout URL could not be verified.');
  location.assign(url.href);throw Object.assign(new Error('Opening secure Stripe checkout.'),{handled:true});
 }
 const result=build.review?build:await api('run',{buildId:build.id,consent:true},signal);
 refreshPurchases();return result.review;
}
