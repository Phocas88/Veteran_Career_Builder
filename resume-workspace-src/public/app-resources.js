import {showAppView} from './app-shell.js?v=20261027-saved-careers';
import {combinedRating,compensation} from './va-calculator-model.js?v=20261026-career-tools';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
export function initAppResources(){
 const help=$('emergency-help-dialog');let restoreWelcome=false;const openHelp=()=>{restoreWelcome=$('welcome-dialog').open;if(restoreWelcome)$('welcome-dialog').close();help.showModal();};$('emergency-help-open').onclick=openHelp;$('welcome-help-open').onclick=openHelp;$('emergency-help-close').onclick=()=>help.close();help.addEventListener('close',()=>{if(restoreWelcome){restoreWelcome=false;$('welcome-dialog').showModal();}});
 for(const id of ['home-va-calculator','settings-va-calculator'])$(id).onclick=()=>showAppView('calculator');
 const rows=$('va-rating-rows');
 function add(value=10){if(rows.children.length>=30)return;const row=el('div');row.className='va-rating-row';const label=el('label','Individual rating'),select=el('select');for(let n=0;n<=100;n+=10)select.add(new Option(n+'%',String(n)));select.value=String(value);select.setAttribute('aria-label','Individual disability rating');label.append(select);const remove=el('button','Remove');remove.type='button';remove.className='text-button';remove.onclick=()=>{row.remove();$('va-result').hidden=true;};row.append(label,remove);rows.append(row);$('va-result').hidden=true;}
 $('va-add-rating').onclick=()=>add();$('va-clear').onclick=reset;
 function mode(){const direct=$('va-rating-mode').value==='official';$('va-individual').hidden=direct;$('va-official-wrap').hidden=!direct;$('va-result').hidden=true;}
 $('va-rating-mode').onchange=mode;
 $('va-spouse').onchange=()=>{$('va-spouse-aa-wrap').hidden=!$('va-spouse').checked;if(!$('va-spouse').checked)$('va-spouse-aa').checked=false;$('va-result').hidden=true;};
 $('va-form').addEventListener('input',()=>{$('va-result').hidden=true;$('va-error').textContent='';});
 $('va-form').onsubmit=event=>{event.preventDefault();try{
  const official=$('va-rating-mode').value==='official',combined=official?{rating:Number($('va-official').value),steps:[]}:combinedRating([...rows.querySelectorAll('select')].map(s=>Number(s.value)));
  const result=compensation(combined.rating,{spouse:$('va-spouse').checked,spouseAA:$('va-spouse-aa').checked,children:Number($('va-children').value),schoolChildren:Number($('va-school-children').value),parents:Number($('va-parents').value)});
  $('va-combined-result').textContent=combined.rating+'%';$('va-pay-result').textContent=money(result.monthly)+' / month';$('va-annual-result').textContent=money(result.annual)+' / year';$('va-breakdown').replaceChildren(...result.breakdown.map(item=>{const row=el('li',item.label+': '+money(item.amount));return row;}));$('va-math').replaceChildren(...combined.steps.map(step=>el('li',step.prior+'% combined with '+step.rating+'% → '+step.combined+'%')));$('va-math-details').hidden=official;$('va-result').hidden=false;$('va-result').scrollIntoView({block:'start',behavior:'instant'});
 }catch(error){$('va-error').textContent=error.message;$('va-result').hidden=true;}};
 function reset(){rows.replaceChildren();$('va-form').reset();$('va-error').textContent='';$('va-result').hidden=true;$('va-spouse-aa-wrap').hidden=true;add(10);mode();}
 document.addEventListener('app:account-cleared',reset);reset();
}
