import {groupLetters,letterDetails,letterSource,letterJobUrl,letterFileName} from './cover-letter-model.js';
import {exportLetter} from './letter-exports.js?v=20261025-standalone-app';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
export function initCoverLetters(api){
 let generation=0,busy=false,pendingOpen=false,active=null,requestId=crypto.randomUUID(),sources=[],selected=null,legacy=[],purchases=[],applicationType='private',controller,dirty=false,returnHandled=false;
 const visible=()=>!document.querySelector('[data-career-panel="letter"]').hidden;
 const status=text=>{$('letter-status').textContent=text;};
 const read=()=>({resume:selected?.draft?.resume||'',role:$('letter-role').value.trim(),company:$('letter-company').value.trim(),jobUrl:$('letter-job-url').value.trim(),jobDescription:$('letter-posting').value.trim(),additionalDetails:$('letter-details').value.trim(),applicationType});
 function fill(input={}){for(const [id,key]of [['letter-role','role'],['letter-company','company'],['letter-job-url','jobUrl'],['letter-posting','jobDescription'],['letter-details','additionalDetails']])$(id).value=input[key]||'';applicationType=input.applicationType||'private';}
 function sourceOptions(){const value=selected?.id||'';$('letter-resume-choice').replaceChildren(new Option('Choose a Finished Resume',''),...sources.map(r=>new Option(r.title||'My Resume',r.id)));$('letter-resume-choice').value=value;$('letter-source-empty').hidden=sources.length>0;$('letter-saved-sources').hidden=!sources.length;$('letter-source-signin').hidden=!!api.user()?.email||sources.length>0;$('letter-next-job').disabled=busy||!selected;$('letter-selected-resume').hidden=!selected;if(selected)$('letter-selected-resume').textContent='Selected: '+(selected.title||'My Resume')+' · '+(selected.design||selected.workspace?.design||'Saved Design').replaceAll('-',' ');}
 async function loadSources(version=generation){
  if(!api.user()){sources=[];selected=null;sourceOptions();return;}
  const values=await api.listLetterResumes();if(version!==generation)return;sources=values.filter(item=>letterSource(item));if(selected&&!sources.some(r=>r.id===selected.id))selected=null;sourceOptions();
 }

 function step(number,focus=true){
  document.querySelector('.letter-intro').hidden=false;
  $('letter-create').hidden=false;$('letter-recovery').hidden=true;$('cover-letter-editor').hidden=true;
  for(const [i,id]of ['letter-source-step','letter-job-step','letter-pay-step'].entries())$(id).hidden=i+1!==number;
  for(const el of document.querySelectorAll('[data-letter-progress]')){if(Number(el.dataset.letterProgress)===number)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}
  if(number===3)$('letter-order-summary').textContent=[read().role||'Job posting supplied',read().company].filter(Boolean).join(' · ')+' · $1 USD';
  if(focus){const title=$(['letter-source-step','letter-job-step','letter-pay-step'][number-1]).querySelector('h3');title.scrollIntoView({block:'start'});title.focus({preventScroll:true});}
 }
 function setBusy(value){busy=value;for(const id of ['letter-pay','letter-resume-order','letter-new','letter-refresh','letter-source-refresh','career-letter-save'])$(id).disabled=value;$('letter-resume-choice').disabled=value||!sources.length;$('letter-next-job').disabled=value||!selected;document.querySelector('[data-career-panel="letter"]').setAttribute('aria-busy',String(value));}
 async function guarded(run){if(busy)return;const version=generation;setBusy(true);try{await run(version);}catch(error){if(version===generation){status(error.name==='TimeoutError'||error.message==='Failed to fetch'?'The connection did not finish. Reopen this letter below and retry; do not pay again.':error.message);if(active&&!active.result)recovery(active);}}finally{if(version===generation){setBusy(false);if(pendingOpen){pendingOpen=false;if(visible())queueMicrotask(()=>open());}}}}
 function recovery(letter){document.querySelector('.letter-intro').hidden=true;active=letter;$('letter-create').hidden=true;$('cover-letter-editor').hidden=true;$('letter-recovery').hidden=false;$('letter-new').hidden=false;
  $('letter-recovery-title').textContent=letter.title||'Your Cover Letter Purchase';
  const unpaid=letter.status==='awaiting_payment';$('letter-recovery-note').textContent=unpaid?'Checkout has not been verified yet. Continue the existing checkout for this letter.':'Your $1 checkout is verified. Create or retry this letter using the same purchase; no second payment is needed.';
  $('letter-resume-order').textContent=unpaid?'Resume Checkout →':'Create / Retry This Purchased Letter →';
 }
 function showResult(letter){document.querySelector('.letter-intro').hidden=true;active=letter;dirty=false;$('letter-create').hidden=true;$('letter-recovery').hidden=true;$('cover-letter-editor').hidden=false;$('letter-new').hidden=false;
  $('career-cover-letter').value=letter.result.coverLetter;const meta=letterDetails({...letter,kind:letter.legacy?'saved':'paid'});$('career-letter-source').textContent=[meta.company,meta.role,meta.dateLabel].filter(Boolean).join(' · ');
  $('letter-edit-note').textContent=letter.legacy?'This previously generated letter remains available. Save edits to your account or download a copy.':'Saved privately with this purchase. Save edits before leaving. Repeat downloads are included.';
  $('letter-checks').replaceChildren(...(letter.result.checks||[]).map(text=>node('li',text)));$('letter-checks-details').hidden=!$('letter-checks').children.length;
  $('letter-ready-title').scrollIntoView({block:'start'});$('letter-ready-title').focus({preventScroll:true});status('Your cover letter is ready. Check it, then download.');
 }
 function redirect(url){const target=new URL(url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw new Error('Checkout could not open safely. Reopen this letter below.');location.assign(target.href);}
 async function generate(letter,version){
  recovery(letter);status('Writing your cover letter… This can take a minute. Your purchase is saved.');controller=new AbortController();
  const result=await api.letterRequest('letter-run',{letterId:letter.id,consent:true,keepAlive:true},AbortSignal.any([controller.signal,AbortSignal.timeout(145000)]));
  if(version!==generation)return;showResult(result);await refresh(version);
 }
 async function openOrder(row,version){
  if(dirty&&!confirm('Open another letter? Save or download your unsaved edits first.'))return;
  status('Opening your letter…');const result=await api.letterRequest('letter-get',{letterId:row.id});if(version!==generation)return;
  if(result.result)showResult(result);else{recovery(result);status('Your existing purchase is open. Continue below.');$('letter-recovery-title').focus();}
 }
 async function continueOrder(version){
  if(!active)return;
  if(active.status!=='awaiting_payment')return generate(active,version);
  const result=await api.letterRequest('letter-prepare',{requestId:active.requestId,input:active.input,source:active.source||undefined,consent:true,storageConsent:true});if(version!==generation)return;
  if(result.url){status('Opening secure checkout…');redirect(result.url);}else if(result.result)showResult(result);else await generate(result,version);
 }
 function action(label,run){const b=node('button',label,'text-button');b.type='button';b.onclick=()=>guarded(run);return b;}
 function render(){
  const rows=[...purchases.map(v=>({...v,kind:'paid'})),...legacy.map(v=>({...v,kind:v.kind||'saved'}))];$('career-letters-empty').hidden=rows.length>0;
  $('career-letters').replaceChildren(...groupLetters(rows).map(group=>{
   const section=node('details',null,'letter-company-group');section.open=true;const heading=node('summary'),title=node('h3',group.company),count=node('span',group.letters.length+' '+(group.letters.length===1?'Letter':'Letters'),'letter-company-count');heading.append(title,count);const list=node('ul',null,'letter-company-entries');
   for(const row of group.letters){const li=node('li',null,'career-result');li.append(node('h4',row.role),node('p',row.dateLabel,'letter-date'),node('p',row.kind==='paid'?(row.hasResult?'Saved · downloads included':row.status==='awaiting_payment'?'Checkout incomplete':'Paid · ready to create or retry'):'Previously saved · available to download','field-hint'));
    const actions=node('div',null,'career-actions');actions.append(action(row.kind==='paid'&&!row.hasResult?'Continue':'Open',async version=>{
     if(row.kind==='paid')return openOrder(row,version);
     if(dirty&&!confirm('Save or download your unsaved edits before opening this letter. Continue?'))return;
     const letter=row.kind==='generated'?await api.letterRequest('letter-legacy',{letterId:row.id}):{...row,legacy:true,result:{coverLetter:row.content,checks:[]}};
     if(version===generation)showResult({...row,...letter,legacy:true});
    }));
    if(row.jobUrl){const link=node('a','Open Job Posting ↗','text-button');link.href=row.jobUrl;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
    if(row.kind!=='generated')actions.append(action('Delete',async version=>{if(!confirm('Delete this cover letter and its stored text? Downloaded copies and the payment receipt remain.'))return;if(row.kind==='paid')await api.letterRequest('letter-delete',{letterId:row.id});else await api.removeLetter(row.id);if(version!==generation)return;if(active?.id===row.id)clear();await refresh(generation);status('Cover letter deleted.');}));li.append(actions);list.append(li);
   }section.append(heading,list);return section;
  }));
 }

 async function refresh(version=generation){
  if(!api.user()){purchases=[];legacy=[];render();return;}
  const result=await api.letterRequest('letter-list');if(version!==generation)return;
  purchases=result.letters||[];let saved=[];if(api.user()?.email)saved=await api.listLetters();if(version!==generation)return;
  const savedIds=new Set(saved.map(x=>x.buildId||x.id));legacy=[...saved.map(x=>({...x,kind:'saved'})),...(result.legacy||[]).filter(x=>!savedIds.has(x.id)).map(x=>({...x,kind:'generated'}))];render();
 }
 function clear(){active=null;selected=null;requestId=crypto.randomUUID();dirty=false;fill();sourceOptions();$('career-cover-letter').value='';$('letter-agreement').checked=false;$('letter-new').hidden=true;step(1,false);}
 $('letter-next-job').onclick=()=>{if(!selected?.draft?.resume){status('Choose a finished resume from My Resumes first.');$('letter-resume-choice').focus();return;}status('');step(2);};
 $('letter-next-pay').onclick=()=>{const input=read();if(!input.role){status('Enter the position you are applying for.');$('letter-role').focus();return;}if(!input.company){status('Enter the company or organization for this letter.');$('letter-company').focus();return;}if(input.jobUrl&&!letterJobUrl(input.jobUrl)){status('Enter a valid HTTP or HTTPS job posting link.');$('letter-job-url').focus();return;}status('');step(3);};
 $('letter-back-source').onclick=()=>step(1);$('letter-back-job').onclick=()=>step(2);
 $('letter-source-refresh').onclick=()=>guarded(async version=>{await loadSources(version);if(version===generation)status(sources.length?'Choose a finished resume below.':'Finish a resume with Veteran Resumes to use it here.');});
 $('letter-source-signin').onclick=()=>api.openAccount();$('letter-start-resume').onclick=()=>api.startResume();
 $('letter-resume-choice').onchange=()=>guarded(async version=>{const value=$('letter-resume-choice').value,item=sources.find(r=>r.id===value);selected=null;sourceOptions();if(!item)return;status('Opening your saved resume…');const draft=await api.resolveVersion(item);if(version!==generation)return;if(!draft.resume?.trim())throw new Error('This resume has no saved text. Open My Resumes and finish saving it first.');selected={...item,draft};applicationType=draft.applicationType||'private';sourceOptions();status('Selected '+(item.title||'My Resume')+'. Continue to Job Details.');});
 $('letter-pay').onclick=()=>guarded(async version=>{
  if(!$('letter-agreement').checked){status('Agree to the $1 letter terms and private recovery storage before checkout.');$('letter-agreement').focus();return;}
  if(!selected||!letterSource(selected)){status('Choose a finished resume first.');step(1);return;}const input=read();status('Checking your selected resume and opening secure checkout…');await api.ensureLetterGuest();if(version!==generation)return;
  const result=await api.letterRequest('letter-prepare',{requestId,input,source:letterSource(selected),consent:true,storageConsent:true});if(version!==generation)return;active={...result,input:result.input||input,source:result.source||letterSource(selected),requestId};recovery(active);
  if(result.url)redirect(result.url);else if(result.result)showResult(result);else await generate(result,version);
 });
 $('letter-resume-order').onclick=()=>guarded(continueOrder);
 $('letter-new').onclick=()=>{if(dirty&&!confirm('Save or download your edits before starting another letter. Continue?'))return;clear();status('A new cover letter costs $1. Your previous letters remain below.');step(1);};
 $('letter-refresh').onclick=()=>guarded(async version=>{await refresh(version);if(version===generation)status('Your cover letters are up to date.');});
 $('career-cover-letter').oninput=()=>{dirty=true;$('letter-edit-note').textContent='Unsaved edits. Choose Save edits or download a copy.';};
 $('career-letter-save').onclick=()=>guarded(async version=>{if(!active?.result)return;const content=$('career-cover-letter').value;if(active.legacy){if(!api.user()?.email){api.openAccount();return;}await api.saveLegacyLetter(active.buildId||active.id,content,active.title||'Cover Letter',{company:active.company||active.input?.company||'',role:active.role||active.input?.role||'',jobUrl:active.jobUrl||active.input?.jobUrl||''});}else await api.letterRequest('letter-save',{letterId:active.id,content});if(version!==generation)return;dirty=false;$('letter-edit-note').textContent='Your edits are saved. Repeat downloads are included.';status('Your edited cover letter is saved.');await refresh(version);});
 for(const [id,format]of [['career-letter-pdf','pdf'],['career-letter-word','docx'],['career-letter-text','txt']])$(id).onclick=()=>guarded(async version=>{if(!active?.result)return;const blob=await exportLetter($('career-cover-letter').value,format);if(version!==generation)return;const a=node('a');a.href=URL.createObjectURL(blob);a.download=letterFileName({...active,kind:active.legacy?'saved':'paid'})+'.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status('Cover letter downloaded. Repeat downloads are included.');});
 async function open(){
  if(busy)return;const version=generation;await guarded(async()=>{
   await Promise.all([refresh(version),loadSources(version)]);if(version!==generation)return;
   const url=new URL(location.href),id=url.searchParams.get('letter');if(returnHandled||!/^[a-f0-9]{64}$/.test(id||''))return;
   if(!api.user()){status('Sign in to the account used for this letter, or return to the guest session where you started checkout.');return;}
   const result=await api.letterRequest('letter-get',{letterId:id});if(version!==generation)return;returnHandled=true;url.searchParams.delete('letter');url.searchParams.delete('checkout');history.replaceState(null,'',url.pathname+url.search+url.hash);
   if(result.result)showResult(result);else if(result.status==='awaiting_payment'){recovery(result);status('Your checkout is saved. Continue it when you are ready.');}else await generate(result,version);
  });
 }
 clear();
 return {open,accountChanged(){if(visible()){if(busy)pendingOpen=true;else open();}},reset(){generation++;pendingOpen=false;controller?.abort();purchases=[];legacy=[];sources=[];selected=null;returnHandled=false;setBusy(false);clear();sourceOptions();render();status('');}};
}

