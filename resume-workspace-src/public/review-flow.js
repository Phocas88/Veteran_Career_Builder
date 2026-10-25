const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};

// Keep all answers in the DOM while showing one task at a time. Moving between
// questions never submits an AI request or discards another question's answer.
export function initReviewFlow(api){
 let stage='draft',index=0;
 const root=$('review-results'),nav=el('nav',null,'review-task-nav');nav.setAttribute('aria-label','Review steps');
 for(const [key,text]of [['draft','1 · Revised resume'],['details','2 · Add details']]){const b=el('button',text);b.type='button';b.dataset.reviewStage=key;b.onclick=()=>show(key);nav.append(b);}
 const finish=el('button','3 · Design & download');finish.type='button';finish.dataset.reviewFinish='true';finish.onclick=()=>api.finish();nav.append(finish);
 const title=el('h2','Review your revised resume');title.id='review-task-title';title.tabIndex=-1;
 const intro=el('p','Check the draft first. Add optional details if something is missing, then choose a design.','review-task-intro');
 const draft=el('section');draft.id='review-draft-stage';
 const notes=el('details',null,'review-notes');notes.id='review-notes';notes.append(el('summary','Review summary, strengths & individual edits'));
 for(const n of [root.querySelector('.review-overview'),root.querySelector('.strengths-card'),root.querySelector('.suggestions-header'),$('review-stale'),$('undo-review'),$('suggestion-list')])notes.append(n);
 const details=el('section');details.id='review-details-stage';
 const questionHeader=el('div',null,'question-heading'),counter=el('p',null,'question-counter');counter.id='review-question-counter';counter.setAttribute('role','status');
 questionHeader.append(el('h3','Fill in the gaps'),el('p','Answer what you know, or skip a question. One AI update is included; gather your answers before sending.'),counter);
 const findings=$('findings-card'),steps=$('next-steps-card');
 findings.replaceChildren($('review-findings'));
 const extra=el('section',null,'review-extra-fields');extra.id='review-extra-fields';extra.append(el('h3','Anything else to add?'),el('p','Optional: identify the job or section, then enter a fact you can verify.'),$('additional-facts'),$('add-review-fact'));
 const send=steps.querySelector('.answer-action');send.id='review-send-area';
 steps.replaceChildren($('next-steps'),extra);
 const actions=el('div',null,'question-navigation'),prev=el('button','← Previous','button button-secondary'),next=el('button','Next question →','button button-primary');prev.type=next.type='button';prev.id='review-question-prev';next.id='review-question-next';
 prev.onclick=()=>{index--;renderQuestion(true);};next.onclick=()=>{index++;renderQuestion(true);};actions.append(prev,next);
 const skip=el('button','Skip questions & continue to design →','text-button');skip.type='button';skip.id='review-skip-details';skip.onclick=()=>api.finish();
 details.append(questionHeader,findings,steps,actions,send,skip);
 const draftActions=el('div',null,'review-draft-actions');const ask=el('button','Something missing? Answer follow-up questions','button button-secondary');ask.id='review-open-details';ask.type='button';ask.onclick=()=>show('details');
 const current=el('button','Keep my current resume & choose a design →','text-button');current.type='button';current.id='review-keep-current';current.onclick=()=>api.finish(false);
 draftActions.append(ask,current);
 const oldActions=root.querySelector('.results-actions');oldActions?.remove();
 draft.append($('rewrite-card'),draftActions,notes);root.replaceChildren(nav,title,intro,draft,details);
 function questions(){return [...$('review-findings').children,...$('next-steps').children];}
 function renderQuestion(focus=false){
  const all=questions();index=Math.max(0,Math.min(index,all.length));
  all.forEach((q,i)=>q.hidden=i!==index);
  findings.hidden=index>=$('review-findings').children.length;
  steps.hidden=index<$('review-findings').children.length;
  extra.hidden=index!==all.length;send.hidden=index!==all.length;
  prev.disabled=index===0;next.hidden=index===all.length;
  next.textContent=index===all.length-1?'Next: extra details & submit →':'Next question →';
  const answered=all.filter(q=>q.querySelector('textarea')?.value.trim()).length;
  counter.textContent=index===all.length?`Ready to finish · ${answered} of ${all.length} questions answered`:`Question ${index+1} of ${all.length} · ${answered} answered`;
  if(focus){questionHeader.scrollIntoView({block:'start',behavior:'instant'});const target=index===all.length?extra.querySelector('input'):all[index]?.querySelector('textarea');target?.focus({preventScroll:true});}
 }
 function show(value,focus=true){stage=value;draft.hidden=value!=='draft';details.hidden=value!=='details';for(const b of nav.querySelectorAll('[data-review-stage]'))b.setAttribute('aria-current',b.dataset.reviewStage===value?'step':'false');title.textContent=value==='draft'?'Review your revised resume':'Add details only you can provide';intro.hidden=value==='details';renderQuestion();if(focus){title.focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}}
 root.addEventListener('input',()=>renderQuestion());
 return {refresh(review){index=0;ask.textContent=`Something missing? Answer ${questions().length} follow-up ${questions().length===1?'question':'questions'}`;intro.textContent=review.refinementCount?'Your answers have been incorporated. Check the updated draft, then use it for your download.':'Check the draft first. Add optional details if something is missing, then choose a design.';notes.open=!review.revisedResume;show('draft',false);},reset(){index=0;notes.open=false;show('draft',false);},show,get stage(){return stage;}};
}
