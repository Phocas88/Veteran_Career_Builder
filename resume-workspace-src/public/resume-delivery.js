const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
export function initResumeDelivery(api){
 const panel=$('export-panel'),layout=panel.querySelector('.export-layout'),tools=panel.querySelector('.export-tools');let ready=false;
 const header=el('div',null,'delivery-header'),kicker=el('p','FINISH YOUR RESUME','app-eyebrow'),title=el('h2','Choose your design'),hint=el('p','Choose a template below, then save your finished resume. Your first design is included.');title.id='delivery-title';title.tabIndex=-1;header.append(kicker,title,hint);
 const finish=tools.querySelector('.template-finish-box'),downloads=tools.querySelector('.export-downloads'),actions=$('finished-actions'),status=$('finished-status');
 const readyActions=el('div',null,'delivery-actions'),change=el('button','Change design','button button-secondary'),edit=el('button','Edit resume text','text-button');change.id='delivery-change-design';edit.id='delivery-edit';change.type=edit.type='button';change.onclick=()=>show(false,true);edit.onclick=api.edit;readyActions.append(change,edit);
 const bar=el('section',null,'delivery-downloads');bar.id='delivery-downloads';bar.setAttribute('aria-label','Download your purchased resume');bar.append(downloads,el('p','Downloads save your latest edits with this purchased design. Repeat downloads are included.','field-hint'),actions,readyActions);
 const optional=el('details',null,'delivery-optional'),summary=el('summary','Other tools · optional');optional.append(summary,el('p','Your resume is complete. Use these tools only if they help your application.'),$('studio-cover-letter'));$('studio-cover-letter').className='button button-secondary';$('studio-cover-letter').textContent='Create a cover letter';
 panel.prepend(header,finish,status,bar,optional);tools.querySelector(':scope > .section-kicker')?.remove();tools.querySelector(':scope > #export-heading')?.setAttribute('hidden','');
 const intro=tools.querySelector(':scope > p');if(intro)intro.hidden=true;
 function show(value,focus=false){ready=value;panel.dataset.deliveryStage=ready?'ready':'design';title.textContent=ready?'Your resume is ready':'Choose your design';hint.textContent=ready?'Your purchased document is saved. Download it below, or return to My resumes anytime.':'Choose a template below, then save your finished resume. Your first design is included.';finish.hidden=ready;readyActions.hidden=!ready;optional.hidden=!ready;if(focus){window.scrollTo({top:0,behavior:'instant'});title.focus({preventScroll:true});}}
 function refresh(owned){bar.hidden=!owned;actions.hidden=!owned;$('resume-proof').hidden=!owned;}
 show(false);return {show,refresh,reset(){optional.open=false;show(false);},get ready(){return ready;}};
}
