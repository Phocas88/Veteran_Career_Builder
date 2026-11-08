import {careerBuildContext,includedUpdateAvailable,refinePaidReview} from './payments.js?v=20261028-guided';

const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};

// Questions belong to one purchased comparison. Answers stay in memory until
// explicitly sent; neither navigation nor a checkbox starts an AI request.
export function initJobClarifications(api){
 let buildId='',revision=0,questions=[],answers=new Map(),candidate=null,controller=null,epoch=0;
 const form=$('job-match-answers'),preview=$('job-match-updated'),message=$('job-match-status'),error=$('job-match-error');
 function clear(){epoch++;controller?.abort();controller=null;buildId='';revision=0;questions=[];answers.clear();candidate=null;form.hidden=true;preview.hidden=true;message.textContent='';error.textContent='';error.hidden=true;$('job-match-consent').checked=false;$('job-match-draft').value='';$('job-match-original').value='';}
 function current(){return careerBuildContext()?.id===buildId;}
 function payload(){return questions.flatMap((q,index)=>{const answer=answers.get(index)?.trim();return q.status!=='Supported'&&answer?[{id:'job-'+index,answer,question:q.nextAction,requirement:q.requirement}]:[];});}
 function sync(){
  const available=includedUpdateAvailable()&&current(),values=payload();
  $('job-match-answer-count').textContent=values.length?`${values.length} ${values.length===1?'answer':'answers'} ready. Blank answers will be skipped.`:'Answer what you know. You can leave any question blank.';
  $('job-match-send').disabled=!!controller||!available||!values.length||!$('job-match-consent').checked;
  $('job-match-send').textContent=controller?'Updating your resume…':'Review updated wording';
  $('job-match-consent').disabled=!!controller||!available;
  for(const field of document.querySelectorAll('[data-job-answer-index]'))field.disabled=!!controller||!available;
  const previous=api.reviewAnswers().length;
  $('job-match-update-note').textContent=available?'Your purchase includes one update. Keep answers brief; combined details have a 4,000-character limit.'+(previous?` Your ${previous} existing Resume review ${previous===1?'answer is':'answers are'} included too.`:''):'Your included update has been used. You can still edit your resume and download your saved design.';
  form.setAttribute('aria-busy',String(!!controller));
 }
 function focusPreview(){const title=$('job-match-updated-title');title.focus({preventScroll:true});title.scrollIntoView({block:'start',behavior:'instant'});}
 function render(kit,build){
  if(build.id!==buildId){clear();buildId=build.id;revision=build.refinementCount||0;}
  else if(revision!==(build.refinementCount||0)&&!candidate&&!controller){answers.clear();revision=build.refinementCount||0;}
  questions=kit.qualifications;
  $('career-matches').replaceChildren(...questions.map((q,index)=>{
   const card=el('article',null,'career-result'),heading=el('h4',q.requirement),prompt=el('p',q.nextAction);heading.id='job-requirement-'+index;prompt.id='job-question-'+index;card.append(el('span',q.status,'career-badge'),heading);
   if(q.evidence)card.append(el('blockquote',q.evidence));card.append(prompt);
   if(q.status!=='Supported'){
    const label=el('label','Your experience (optional)','field-label');label.htmlFor='job-answer-'+index;
    const field=el('textarea',null,'answer-input');field.id=label.htmlFor;field.dataset.jobAnswerIndex=index;field.rows=3;field.maxLength=1000;field.value=answers.get(index)||'';field.setAttribute('aria-describedby',heading.id+' '+prompt.id+' job-match-answer-help');
    field.addEventListener('input',()=>{answers.set(index,field.value);error.hidden=true;sync();});card.append(label,field);
   }
   return card;
  }));
  form.hidden=!questions.some(q=>q.status!=='Supported');preview.hidden=!candidate;sync();
 }
 $('job-match-consent').addEventListener('change',sync);
 $('job-match-send').addEventListener('click',async()=>{
  const values=[...api.reviewAnswers(),...payload()];if(controller||!current()||!includedUpdateAvailable()||!payload().length||!$('job-match-consent').checked)return;
  const context=careerBuildContext(),draft=api.getDraft();
  if(draft.role.trim()!==context.role.trim()||draft.jobDescription.trim()!==context.jobDescription.trim()||draft.applicationType!==context.applicationType){error.textContent='The job details in your editor changed. Reopen this purchase to answer questions for its original job.';error.hidden=false;return;}
  const run=epoch,ownerBuild=buildId;controller=new AbortController();const pending=controller;
  const timeout=setTimeout(()=>pending.abort('timeout'),240000);error.hidden=true;message.textContent='Updating this resume with your answers. Your current text stays in the editor until you choose the new wording.';sync();
  try{
   const review=await refinePaidReview(values,pending.signal);
   if(run!==epoch||!current()||pending.signal.aborted)return;
   candidate=review;revision=review.refinementCount||1;api.stageReview(review);$('job-match-draft').value=review.revisedResume;$('job-match-original').value=review.submittedResume||'';
   form.hidden=true;preview.hidden=false;$('job-match-consent').checked=false;message.textContent='Your updated wording is ready to review. It has not replaced the text in your editor.';focusPreview();
  }catch(e){if(run===epoch&&careerBuildContext()?.id===ownerBuild){error.textContent=pending.signal.aborted?'The update is taking longer than expected. Reopen this purchase to recover it; no second payment is needed.':e.message;error.hidden=false;message.textContent='Your answers are still here. Your existing purchase remains available.';}}
  finally{clearTimeout(timeout);if(run===epoch){controller=null;sync();}}
 });
 $('job-match-use-draft').addEventListener('click',()=>{
  if(!candidate||!current())return;const text=$('job-match-draft').value.trim();
  if(!text||text.length>20000){error.textContent='Keep the updated resume between 1 and 20,000 characters.';error.hidden=false;$('job-match-draft').focus();return;}
  const submitted=candidate.submittedResume||'',currentText=api.getDraft().resume;
  if(submitted&&currentText!==submitted&&!confirm('Replace the text currently in your editor with this updated wording? Your other saved resumes remain unchanged.'))return;
  const review=candidate;candidate=null;preview.hidden=true;api.useReview(review,text);
 });
 return {render,reset:clear,keepResult(build){return build?.id===buildId&&!!(controller||candidate);},contextChanged(){if(buildId&&!current())clear();}};
}
