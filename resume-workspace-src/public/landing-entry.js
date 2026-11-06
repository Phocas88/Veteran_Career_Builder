// Honor a public-page start choice after the existing privacy/account prompts.
// Starting a path uses the normal paid-entry controls and never auto-checks out.
export function initLandingEntry({getChoice,getDraft,hasPaidBuild,doc=document,win=window}={}){
 const url=new URL(win.location.href),intent=url.searchParams.get('start');
 if(!['build','upload'].includes(intent))return;
 let handled=false;
 const resume=()=>{
  if(handled||!getChoice()||doc.querySelector('dialog[open]'))return;
  handled=true;url.searchParams.delete('start');win.history.replaceState(null,'',url.pathname+url.search+win.location.hash);
  if(hasPaidBuild()||getDraft().resume.trim())return;
  doc.getElementById(intent==='upload'?'choose-import':'choose-build').click();
 };
 for(const dialog of doc.querySelectorAll('dialog'))dialog.addEventListener('close',()=>queueMicrotask(resume));
 doc.addEventListener('app:privacy-ready',()=>queueMicrotask(resume));
 queueMicrotask(resume);
}
