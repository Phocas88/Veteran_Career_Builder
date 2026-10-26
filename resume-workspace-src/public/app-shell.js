const $=id=>document.getElementById(id);
const careerViews=new Set(['profile','applications','library','versions','match','skills','letter','digital-cv']);
let view='home',config;
let noticeTimer;
let replaying=false;
const requestedView=location.hash.slice(1);
export const getAppView=()=>view;
export const isCareerView=()=>careerViews.has(view);
export function showAppView(next,{scroll=true}={}){
 if(!['home','workspace','settings','calculator',...careerViews].includes(next))return;
 const previous=view;view=next;
 $('home-panel').hidden=next!=='home';$('document-workspace').hidden=next!=='workspace';$('career-dialog').hidden=!careerViews.has(next);$('settings-panel').hidden=next!=='settings';$('calculator-panel').hidden=next!=='calculator';
 document.body.dataset.appView=next;
 if(config&&previous!==next&&!replaying)history.pushState({appView:next},'',location.pathname+location.search+'#'+next);
 const active=next==='digital-cv'?'profile':['workspace','versions','match','skills'].includes(next)?'resumes':next;
 for(const b of document.querySelectorAll('[data-app-route]')){b.classList.toggle('active',b.dataset.appRoute===active);if(b.dataset.appRoute===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 document.dispatchEvent(new CustomEvent('app:view-changed',{detail:{view:next,previous}}));
 if(scroll&&previous!==next){window.scrollTo({top:0,behavior:'instant'});const heading=(careerViews.has(next)?$('career-title'):next==='home'?$('home-title'):next==='settings'?$('settings-title'):next==='calculator'?$('calculator-title'):null);heading?.focus({preventScroll:true});}
}
export function initAppShell(options){
 config=options;
 for(const b of document.querySelectorAll('[data-app-route]'))b.onclick=()=>{
  const target=b.dataset.appRoute;
  if(target==='resumes')options.openCareer('versions');
  else if(target==='profile')options.openCareer('profile');
  else if(target==='applications')options.openCareer('jobs');
  else if(target==='letter')options.openCareer('letter');
  else if(target==='library')options.openCareer('library');
  else showAppView(target);
 };
 $('app-home').onclick=()=>showAppView('home');$('app-settings').onclick=()=>showAppView('settings');
 $('settings-account').onclick=options.openAccount;
 $('settings-purchases').onclick=()=>{options.openAccount();$('purchase-history').open=true;};
 $('home-continue').onclick=options.continueResume;$('resume-continue').onclick=options.continueResume;
 $('resumes-new').onclick=()=>showAppView('home');
 $('profile-save-bottom').onclick=()=>$('career-profile-save').click();
 $('profile-use-bottom').onclick=()=>$('career-profile-build').click();
 $('start-saved').onclick=()=>options.openCareer('versions');
 window.addEventListener('popstate',()=>{
  const target=location.hash.slice(1)||'home';replaying=true;
  try{if(careerViews.has(target))options.openCareer(target==='applications'?'jobs':target);else showAppView(['home','workspace','settings','calculator'].includes(target)?target:'home');}
  finally{replaying=false;}
 });
 document.addEventListener('app:notice',event=>{const t=$('toast');t.textContent=event.detail;t.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{t.hidden=true;},4500);});
 document.addEventListener('resume:payment-changed',syncAppSummary);
 document.addEventListener('resume:draft-changed',syncAppSummary);
 if(requestedView&&!new URLSearchParams(location.search).has('build'))queueMicrotask(()=>{if(view!=='home')return;replaying=true;try{if(careerViews.has(requestedView))options.openCareer(requestedView==='applications'?'jobs':requestedView);else if(['settings','calculator'].includes(requestedView))showAppView(requestedView);}finally{replaying=false;}});
 syncAppSummary();
}
export function syncAppSummary(){
 if(!config)return;
 const draft=config.getDraft(),paid=config.hasPaidBuild(),hasText=!!draft.resume.trim();
 $('home-current').hidden=!paid&&!hasText;$('resume-current').hidden=!paid&&!hasText;
 $('home-current-title').textContent=hasText?(draft.role||'Your current resume'):'Your unlocked resume build';
 $('home-current-note').textContent=paid?'Continue where you left off.':'Your draft is on this device. Open purchase history if you already paid.';
 $('resume-current-title').textContent=hasText?(draft.role||'Resume open in editor'):'Paid build · ready to continue';
 $('version-save-details').hidden=!hasText;
}
