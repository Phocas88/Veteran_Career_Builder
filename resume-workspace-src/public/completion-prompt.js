const $=id=>document.getElementById(id);
export const APP_SHARE_URL='https://veterancareerpath.com/resumereview/';
export function initCompletionPrompt(api){
 const dialog=$('completion-dialog');
 let context=null,generation=0,busy=false,controller=null;const offered=new Set();
 const current=c=>c&&api.owner()===c.owner&&api.build()?.id===c.buildId;
 function close(){if(dialog.open)dialog.close();}
 function reset(){generation++;controller?.abort();controller=null;context=null;busy=false;close();$('completion-feedback').reset();$('completion-feedback-status').textContent='';$('completion-share-status').textContent='';offered.clear();}
 function next(submitted=false){
  $('completion-feedback').hidden=true;$('completion-next').hidden=false;
  $('completion-title').textContent=submitted?'Thank you for your feedback':'What would you like to do next?';
  $('completion-intro').textContent=submitted?'Your feedback was sent. These next steps are optional.':'Your resume is complete. These next steps are optional.';
  dialog.scrollTop=0;$('completion-title').focus({preventScroll:true});
 }
 async function offer(buildId){
  const owner=api.owner(),key=owner+':'+buildId,c={owner,buildId};
  if(!owner||!current(c)||offered.has(key)||document.body.dataset.appView!=='workspace')return;
  offered.add(key);const version=generation;
  try{
   const result=await api.request('feedback-prompt',{buildId});
   if(version!==generation||!current(c)||result.show!==true||document.body.dataset.appView!=='workspace'||document.querySelector('dialog[open]'))return;
   context=c;$('completion-link-fallback').hidden=true;$('completion-feedback').reset();$('completion-submit').disabled=false;$('completion-skip').disabled=false;$('completion-feedback-status').textContent='';$('completion-share-status').textContent='';$('completion-rating-label').textContent='Choose 1 to 5 stars';
   for(const label of dialog.querySelectorAll('.completion-stars label'))label.dataset.filled='false';
   $('completion-feedback').hidden=false;$('completion-next').hidden=true;$('completion-title').textContent='How was your experience?';$('completion-intro').textContent='Your resume is saved and ready to download.';dialog.showModal();
  }catch{/* A feedback connection failure never interrupts the saved resume. */}
 }
 $('completion-feedback').addEventListener('change',()=>{
  const value=Number(new FormData($('completion-feedback')).get('experience-rating'));
  const labels=['Poor','Fair','Good','Very good','Excellent'];
  $('completion-rating-label').textContent=value?value+' out of 5 · '+labels[value-1]:'Choose 1 to 5 stars';
  for(const label of dialog.querySelectorAll('.completion-stars label'))label.dataset.filled=String(Number(label.querySelector('input').value)<=value);
 });
 $('completion-feedback').onsubmit=async event=>{
  event.preventDefault();if(busy||!current(context))return;
  const rating=Number(new FormData(event.currentTarget).get('experience-rating'));if(!Number.isInteger(rating)||rating<1||rating>5)return;
  const c=context,version=generation;busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  $('completion-submit').disabled=true;$('completion-skip').disabled=true;$('completion-feedback-status').textContent='Sending your feedback…';
  try{const result=await api.request('feedback-submit',{buildId:c.buildId,rating,comment:$('completion-comment').value.trim()},controller.signal);if(version!==generation||!current(c)||!dialog.open)return;if(result.submitted!==true)throw new Error('not_submitted');next(true);}
  catch{if(version===generation&&current(c)&&dialog.open)$('completion-feedback-status').textContent='Your resume is saved. Feedback could not be sent. Try again, or choose Skip.';}
  finally{clearTimeout(timeout);if(version===generation){busy=false;controller=null;$('completion-submit').disabled=false;$('completion-skip').disabled=false;}}
 };
 $('completion-close').onclick=close;$('completion-done').onclick=close;$('completion-skip').onclick=()=>next();
 dialog.addEventListener('close',()=>{generation++;controller?.abort();controller=null;busy=false;context=null;$('completion-comment').value='';if(document.body.dataset.appView==='workspace')$('download-pdf')?.focus({preventScroll:true});});
 for(const [id,run]of [['completion-cv',api.openCv],['completion-letter',api.openLetter]])$(id).onclick=()=>{if(!current(context))return;close();run();};
 const selectLink=()=>{$('completion-link-fallback').hidden=false;$('completion-link').focus();$('completion-link').select();$('completion-share-status').textContent='Link selected. Copy it and send it to another veteran.';};
 async function copy(){
  const version=generation;
  try{if(!navigator.clipboard?.writeText){selectLink();return;}await navigator.clipboard.writeText(APP_SHARE_URL);if(version===generation&&dialog.open)$('completion-share-status').textContent='App link copied. Paste it into a message to another veteran.';}
  catch{if(version===generation&&dialog.open)selectLink();}
 }
 $('completion-copy').onclick=copy;
 $('completion-share').onclick=async()=>{
  if(!navigator.share){await copy();return;}
  const version=generation;
  try{await navigator.share({title:'VCP Resume',text:'A resume and career app built for veterans. Take a look:',url:APP_SHARE_URL});if(version===generation&&dialog.open)$('completion-share-status').textContent='Thanks for sharing VCP Resume.';}
  catch(error){if(version===generation&&dialog.open)$('completion-share-status').textContent=error.name==='AbortError'?'Sharing canceled. You can share or copy the link when ready.':'Sharing could not open. Use Copy link instead.';}
 };
 document.addEventListener('resume:finished',event=>offer(event.detail?.buildId));
 document.addEventListener('app:account-cleared',reset);
 document.addEventListener('app:view-changed',()=>{if(dialog.open)close();});
 return {reset};
}
