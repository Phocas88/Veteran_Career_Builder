import {combinedRating,compensation,rateYear} from './va-calculator-model.js?v=20261028-va';
import {CONDITION_CATEGORIES,CONDITIONS,findConditions} from './va-conditions.js?v=20261028-va';

const $=id=>document.getElementById(id);
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
const typeNames={unspecified:'Type not specified',primary:'Primary',secondary:'Secondary',aggravated:'Aggravated by service',presumptive:'Presumptive'};

export function initVaCalculator(){
 const form=$('va-form'),editor=$('va-condition-editor'),preset=$('va-condition-preset');
 let conditions=[],editing=null,sequence=0,step=1,lastEstimate=null;
 const focus=id=>{const n=$(id);n.focus({preventScroll:true});n.scrollIntoView({block:'start',behavior:'instant'});};
 for(const item of CONDITION_CATEGORIES)$('va-condition-category').add(new Option(item.label,item.id));
 for(const id of ['va-condition-rating','va-official'])for(let n=0;n<=100;n+=10)$(id).add(new Option(n+'%',String(n)));
 $('va-list-title').tabIndex=-1;

 function clearErrors(){for(const id of ['va-error','va-condition-error'])$(id).textContent='';}
 function error(message,target='va-error',field=target){$(target).textContent=message;focus(field);return false;}
 function showStep(next,{moveFocus=true}={}){
  step=next;clearErrors();form.hidden=next===3;$('va-result').hidden=next!==3;
  $('va-step-conditions').hidden=next!==1;$('va-step-family').hidden=next!==2;
  for(const [index,item] of [...document.querySelectorAll('.va-steps li')].entries()){
   if(index===next-1)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
   item.classList.toggle('va-step-done',index<next-1);
  }
  if(moveFocus)focus(next===1?'va-conditions-title':next===2?'va-family-title':'va-result-title');
 }
 function rateNotice(){
  const meta=rateYear(Number($('va-rate-year').value));
  $('va-rate-note').textContent=meta.projected?'2027 planning estimate: applies the announced 3.6% COLA to 2026 VA amounts. VA has not yet published its 2027 dollar tables. Choose 2026 for currently published payments.':'Published 2026 VA amounts, effective December 1, 2025. These are the current published rates; the 2027 COLA is not included.';
  $('va-rate-note').dataset.projected=String(meta.projected);
 }
 function fillPresets(selected=''){
  const matches=findConditions({category:$('va-condition-category').value,query:$('va-condition-search').value});
  preset.replaceChildren(new Option(matches.length?'Choose a condition':'No matches — enter your condition name',''));
  for(const item of matches)preset.add(new Option(item.name,item.id));
  preset.add(new Option('My condition is not listed — enter its name','custom'));
  preset.value=[...preset.options].some(option=>option.value===selected)?selected:'';
  $('va-condition-count').textContent=matches.length+' common '+(matches.length===1?'condition':'conditions')+(matches.length?' · or enter the name from your letter.':'. Try another search, or enter the name from your letter.');
  describeSelection();
 }
 function describeSelection(){
  const selected=CONDITIONS.find(item=>item.id===preset.value),manual=preset.value==='custom';
  $('va-custom-name-wrap').hidden=!manual;$('va-condition-info').hidden=!selected;
  if(selected){
   $('va-condition-info-name').textContent=selected.name;$('va-condition-description').textContent=selected.description;
   $('va-condition-evaluation').textContent=selected.evaluation;$('va-condition-source').href=selected.source;
  }else{for(const id of ['va-condition-info-name','va-condition-description','va-condition-evaluation'])$(id).textContent='';$('va-condition-source').removeAttribute('href');}
 }
 function resetEditor(){
  editing=null;$('va-condition-search').value='';$('va-condition-name').value='';$('va-condition-rating').value='';$('va-condition-type').value='unspecified';
  $('va-editor-title').textContent='Add a condition';$('va-add-condition').textContent='+ Add condition to my list';fillPresets();
 }
 function setEditor(open,{moveFocus=true}={}){
  editor.hidden=!open;$('va-add-another').hidden=open||!conditions.length;
  $('va-cancel-edit').hidden=!open||!conditions.length;
  if(open&&moveFocus)focus('va-editor-title');
 }
 function renderConditions(){
  const list=$('va-rating-rows');list.replaceChildren();
  for(const item of conditions){
   const row=node('article');row.className='va-condition-row';
   const heading=node('div');heading.className='va-condition-row-heading';heading.append(node('h4',item.name),node('strong',item.rating+'%'));
   row.append(heading,node('p',item.category+' · '+typeNames[item.type]));
   const actions=node('div');actions.className='va-condition-actions';
   const edit=node('button','Edit'),remove=node('button','Remove');
   for(const button of [edit,remove]){button.type='button';button.className='text-button';button.setAttribute('aria-label',button.textContent+' '+item.name);}
   edit.onclick=()=>editCondition(item.id);
   remove.onclick=()=>{
    conditions=conditions.filter(value=>value.id!==item.id);if(editing===item.id){resetEditor();setEditor(!conditions.length,{moveFocus:false});}
    renderConditions();$('va-condition-status').textContent='Removed '+item.name+'. '+conditions.length+' '+(conditions.length===1?'condition remains.':'conditions remain.');
    if(!conditions.length){resetEditor();setEditor(true,{moveFocus:false});}
    focus('va-list-title');
   };
   actions.append(edit,remove);row.append(actions);list.append(row);
  }
  $('va-list-title').textContent='Your conditions ('+conditions.length+')';$('va-list-empty').hidden=!!conditions.length;
 }
 function editCondition(id){
  const item=conditions.find(value=>value.id===id);if(!item)return;
  resetEditor();editing=id;$('va-condition-category').value=item.categoryId||'';
  const stored=CONDITIONS.find(value=>value.id===item.presetId);fillPresets(stored?stored.id:'custom');
  $('va-condition-name').value=item.name;$('va-condition-rating').value=String(item.rating);$('va-condition-type').value=item.type;
  $('va-editor-title').textContent='Edit this condition';$('va-add-condition').textContent='Save condition changes';
  clearErrors();$('va-condition-status').textContent='';setEditor(true);
 }
 function addCondition(){
  clearErrors();const selected=CONDITIONS.find(item=>item.id===preset.value),manual=preset.value==='custom';
  const name=selected?.name||(manual?$('va-condition-name').value.trim():'');
  if(!name)return error('Choose a condition, or press “My condition isn’t listed” to enter its name.','va-condition-error',manual?'va-condition-name':'va-condition-preset');
  if(!$('va-condition-rating').value)return error('Choose the percentage from your decision letter before adding this condition.','va-condition-error','va-condition-rating');
  if(!editing&&conditions.length>=30)return error('You can add up to 30 conditions. Use your VA combined rating for a longer award.','va-condition-error');
  const category=CONDITION_CATEGORIES.find(item=>item.id===$('va-condition-category').value);
  const item={id:editing||++sequence,name,rating:Number($('va-condition-rating').value),type:$('va-condition-type').value,presetId:selected?.id||'',categoryId:selected?.categoryId||category?.id||'',category:selected?.category||category?.label||'Other condition'};
  if(conditions.some(value=>value.id!==editing&&value.name.toLowerCase()===name.toLowerCase()))return error('This condition is already in your list. Use Edit to change it, or enter the distinct name of a separately awarded condition.','va-condition-error');
  const wasEditing=!!editing;
  if(editing)conditions=conditions.map(value=>value.id===editing?item:value);else conditions.push(item);
  renderConditions();resetEditor();setEditor(false,{moveFocus:false});
  $('va-condition-status').textContent=(wasEditing?'Updated ':'Added ')+item.name+' at '+item.rating+'%. '+(wasEditing?'Your changes are in the list.':'Add another condition, or press Next.');
  focus('va-list-title');return true;
 }
 const hasPending=()=>!editor.hidden&&(editing||preset.value||$('va-condition-name').value.trim()||$('va-condition-rating').value);
 function conditionInput(){
  const official=$('va-rating-mode').value==='official';
  if(official){if(!$('va-official').value)throw new Error('Choose your VA-assigned combined rating.');return {official:true,rating:Number($('va-official').value),steps:[]};}
  if(hasPending())throw new Error(editing?'Press “Save condition changes” before continuing.':'Your condition has not been added yet. Press “Add condition to my list” before continuing.');
  if(!conditions.length)throw new Error('Add at least one condition, or choose “I know my VA combined rating.”');
  return {official:false,...combinedRating(conditions.map(item=>item.rating))};
 }
 function nextFamily(){
  try{conditionInput();showStep(2);return true;}
  catch(e){return error(e.message,'va-error',$('va-rating-mode').value==='official'?'va-official':hasPending()?'va-add-condition':'va-condition-preset');}
 }
 function dependentInput(){
  const count=id=>$(id).value.trim()===''?NaN:Number($(id).value);
  return {spouse:$('va-spouse').checked,spouseAA:$('va-spouse-aa').checked,children:count('va-children'),schoolChildren:count('va-school-children'),parents:count('va-parents'),smcK:count('va-smc-k'),smcS:$('va-smc-s').checked,tdiu:$('va-tdiu').checked,year:Number($('va-rate-year').value)};
 }
 function inputSummary(combined,options){
  const list=node('ul');
  if(combined.official)list.append(node('li','VA-assigned combined rating: '+combined.rating+'%'));
  else for(const item of conditions)list.append(node('li',item.name+' · '+item.rating+'% · '+typeNames[item.type]));
  list.append(node('li','Dependent spouse: '+(options.spouse?'Yes':'No')),node('li','Children under 18: '+options.children),node('li','Children 18–23 in qualifying school: '+options.schoolChildren),node('li','Dependent parents: '+options.parents));
  if(options.spouse&&options.spouseAA)list.append(node('li','Spouse Aid and Attendance: Yes'));
  if(options.tdiu)list.append(node('li','VA-awarded TDIU: Yes'));if(options.smcS)list.append(node('li','VA-awarded SMC-S: Yes'));if(options.smcK)list.append(node('li','SMC-K awards: '+options.smcK));
  return list;
 }
 function calculate({moveFocus=true}={}){
  try{
   const combined=conditionInput(),options=dependentInput(),result=compensation(combined.rating,options),current=compensation(combined.rating,{...options,year:2026});
   lastEstimate={combined,options,result,current};
   $('va-combined-result').textContent=combined.rating+'%';$('va-pay-result').textContent=money(result.monthly)+' / month';$('va-annual-result').textContent=money(result.annual)+' / year';
   $('va-result-year').textContent=rateYear(result.year).label;
   $('va-pay-basis').textContent=options.smcS?'Payment uses the SMC-S basic rate awarded by VA.':options.tdiu?'Your combined rating stays '+combined.rating+'%; payment uses the 100% rate because you selected VA-awarded TDIU.':combined.rating<30?'Dependent additions are not paid below 30%.':'Your family selections are included in the breakdown below.';
   $('va-cola-comparison').hidden=!result.projected;$('va-cola-comparison').textContent=result.projected?'For the same selections, 2026 published rates give '+money(current.monthly)+'/month. The 2027 planning estimate is '+money(Math.round((result.monthly-current.monthly)*100)/100)+' more per month. Final VA amounts may differ.':'';
   $('va-breakdown').replaceChildren(...(result.breakdown.length?result.breakdown:[{label:'No basic compensation at 0%',amount:0}]).map(item=>{const li=node('li');li.append(node('span',item.label),node('strong',money(item.amount)));return li;}));
   $('va-input-summary').replaceChildren(inputSummary(combined,options));
   $('va-math').replaceChildren(...combined.steps.map(value=>node('li',value.prior+'% combined with '+value.rating+'% → '+value.combined+'%')));
   if(!combined.official)$('va-math').append(node('li','Final '+combined.combined+'% rounds to '+combined.rating+'%.'));
   $('va-math-details').hidden=combined.official;$('va-print-status').textContent='';showStep(3,{moveFocus});return true;
  }catch(e){error(e.message);return false;}
 }
 function printEstimate(){
  if(!lastEstimate)return;
  const popup=window.open('','_blank');
  if(!popup){$('va-print-status').textContent='Your browser blocked the print window. Allow pop-ups for this site, then press Print / save PDF again.';return;}
  // Build with text nodes so a manually entered condition can never become HTML.
  const d=popup.document;d.title='VA compensation estimate';const style=d.createElement('style');
  style.textContent='body{font:12pt Arial,sans-serif;color:#111;background:#fff;max-width:800px;margin:32px auto;padding:0 22px;line-height:1.6}h1{font-size:24pt}h2{font-size:17pt;margin-top:24px}li{margin:8px 0}a{overflow-wrap:anywhere;color:#111}@media print{button{display:none}@page{margin:18mm}}';d.head.append(style);
  const add=(tag,text)=>{const value=d.createElement(tag);value.textContent=text;d.body.append(value);return value;};
  add('p','Veteran Career Path · VCP Resume');add('h1','VA compensation estimate');add('h2',rateYear(lastEstimate.result.year).label);
  add('p','Combined rating: '+lastEstimate.combined.rating+'%');add('p',money(lastEstimate.result.monthly)+' / month · '+money(lastEstimate.result.annual)+' / year');
  add('p',$('va-pay-basis').textContent);if(lastEstimate.result.projected)add('p',$('va-cola-comparison').textContent);
  add('h2','Monthly payment breakdown');d.body.append(d.importNode($('va-breakdown'),true));
  add('h2','Conditions & family details used');d.body.append(d.importNode($('va-input-summary'),true));
  if(!lastEstimate.combined.official){add('h2','Combined-rating math');d.body.append(d.importNode($('va-math'),true));}
  add('p',lastEstimate.result.projected?'2027 projection: 2026 VA table amounts × 1.036, rounded individually to cents. VA has not yet published 2027 dollar tables; final figures and rounding may differ.':'Published 2026 VA amounts, effective December 1, 2025.');
  add('p',$('calculator-panel').querySelector('.va-footer p').textContent);
  add('h2','Sources');for(const link of document.querySelectorAll('.va-year-panel a')){const a=add('a',link.textContent+' — '+link.href);a.href=link.href;add('br','');}
  add('p','Sources checked October 28, 2026. Prepared '+new Date().toLocaleDateString('en-US')+'.');
  const print=add('button','Print / save PDF');print.type='button';print.onclick=()=>popup.print();popup.opener=null;popup.focus();popup.print();
  $('va-print-status').textContent='Print view opened. Choose a printer or Save as PDF in your browser.';
 }
 function reset(){
  conditions=[];editing=null;sequence=0;lastEstimate=null;form.reset();$('va-rate-year').value='2027';
  $('va-condition-category').value='';resetEditor();setEditor(true,{moveFocus:false});renderConditions();
  $('va-condition-status').textContent='';$('va-spouse-aa-wrap').hidden=true;$('va-individual').hidden=false;$('va-official-wrap').hidden=true;
  $('va-extra-awards').open=false;$('va-print-status').textContent='';
  for(const id of ['va-combined-result','va-pay-result','va-annual-result','va-result-year','va-pay-basis','va-cola-comparison','va-breakdown','va-input-summary','va-math'])$(id).replaceChildren();
  rateNotice();showStep(1,{moveFocus:false});
 }
 $('va-rate-year').onchange=()=>{rateNotice();if(step===3)calculate({moveFocus:false});};
 $('va-condition-category').onchange=()=>{clearErrors();$('va-condition-search').value='';$('va-condition-name').value='';fillPresets();};
 $('va-condition-search').oninput=()=>{clearErrors();fillPresets(preset.value);};
 preset.onchange=()=>{clearErrors();describeSelection();if(preset.value==='custom')focus('va-condition-name');};
 $('va-manual-condition').onclick=()=>{clearErrors();preset.value='custom';describeSelection();focus('va-condition-name');};
 $('va-add-condition').onclick=addCondition;
 $('va-add-another').onclick=()=>{resetEditor();clearErrors();$('va-condition-status').textContent='';setEditor(true);};
 $('va-cancel-edit').onclick=()=>{resetEditor();clearErrors();setEditor(false,{moveFocus:false});focus('va-list-title');};
 $('va-rating-mode').onchange=()=>{const direct=$('va-rating-mode').value==='official';$('va-individual').hidden=direct;$('va-official-wrap').hidden=!direct;clearErrors();};
 $('va-spouse').onchange=()=>{$('va-spouse-aa-wrap').hidden=!$('va-spouse').checked;if(!$('va-spouse').checked)$('va-spouse-aa').checked=false;};
 form.addEventListener('input',clearErrors);
 $('va-next-family').onclick=nextFamily;$('va-back-conditions').onclick=()=>showStep(1);$('va-edit-conditions').onclick=()=>showStep(1);$('va-edit-family').onclick=()=>showStep(2);
 form.onsubmit=event=>{event.preventDefault();if(step===1){if(!editor.hidden&&$('va-rating-mode').value==='individual')addCondition();else nextFamily();}else calculate();};
 $('va-print').onclick=printEstimate;$('va-clear').onclick=()=>{reset();focus('va-conditions-title');};
 document.addEventListener('app:account-cleared',reset);reset();
}
