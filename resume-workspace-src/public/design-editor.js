import {designs,fontFamilies,accentColors,normalizeExportSettings} from './resume-designs.js?v=20261027-resume-studio';
import {initTemplateExamples} from './template-examples.js?v=20261029-clear-flow';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const ownSectionSettings=settings=>Object.fromEntries(Object.entries(settings).filter(([key])=>['sectionOrder','headings','hiddenSections','photo'].includes(key)));
export function initDesignEditor(api){
 let settings={},shown=6,sectionKey='',lastFederal=false,revision=0;
 const change=()=>{settings=normalizeExportSettings(settings);api.change();};
 const examples=initTemplateExamples({canUse:key=>!lastFederal||!!designs[key].federal,choose(key){const radio=document.querySelector('[name="resume-design"][value="'+key+'"]');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}});
 $('preview-selected-template').onclick=()=>examples.open(document.querySelector('[name="resume-design"]:checked').value);
 const gallery=$('design-gallery');gallery.replaceChildren();
 for(const [key,design]of Object.entries(designs)){
  const card=node('label',null,'design-option studio-template');card.dataset.category=design.category;card.dataset.search=(design.name+' '+design.description).toLowerCase();
  const input=node('input');input.type='radio';input.name='resume-design';input.value=key;input.checked=key==='classic';
  card.dataset.photo=String(!!design.photo);const preview=node('button','Preview example','text-button template-preview-button');preview.type='button';preview.dataset.previewTemplate=key;preview.setAttribute('aria-label','Preview '+design.name+' example resume');preview.onclick=event=>{event.preventDefault();event.stopPropagation();examples.open(key);};card.append(input,node('strong',design.name),node('small',design.description),node('small',design.federal?'Federal · no photo':design.photo?'Civilian · photo optional':design.layout==='single'?'One column':'Two columns'),preview);gallery.append(card);
 }
 gallery.addEventListener('change',event=>{if(event.target.name==='resume-design'){settings=ownSectionSettings(settings);shown=6;api.designChanged(event.target.value);}});
 function filter(){const category=$('template-category').value,search=$('template-search').value.trim().toLowerCase();let count=0,visible=0;for(const card of gallery.children){const match=(!category||card.dataset.category===category||category==='photo'&&card.dataset.photo==='true')&&(!search||card.dataset.search.includes(search));if(match)count++;card.hidden=!match||visible>=shown;if(match&&visible<shown)visible++;}$('template-count').textContent=`${visible} of ${count} templates`;$('template-more').hidden=visible>=count;}
 $('template-category').onchange=()=>{shown=6;filter();};$('template-search').oninput=()=>{shown=6;filter();};$('template-more').onclick=()=>{shown+=6;filter();};
 for(const b of document.querySelectorAll('[data-studio-tab]'))b.onclick=()=>{for(const panel of document.querySelectorAll('[data-studio-panel]'))panel.hidden=panel.dataset.studioPanel!==b.dataset.studioTab;for(const tab of document.querySelectorAll('[data-studio-tab]'))tab.setAttribute('aria-pressed',String(tab===b));};
 for(const [key,font]of Object.entries(fontFamilies))$('format-font').add(new Option(font.name,key));
 for(const [key,color]of Object.entries(accentColors))$('format-color').add(new Option(key[0].toUpperCase()+key.slice(1),color));
 function readFormat(){
  for(const field of document.querySelectorAll('[data-format-key]'))settings[field.dataset.formatKey]=field.type==='number'?Number(field.value):field.value;
  settings.margins=Object.fromEntries(['top','right','bottom','left'].map(side=>[side,Number($('margin-'+side).value)*72]));change();
 }
 for(const control of document.querySelectorAll('[data-format-key],[data-margin]'))control.addEventListener('change',readFormat);
 $('format-reset').onclick=()=>{settings=ownSectionSettings(settings);change();};
 function renderSections(model){
  const key=JSON.stringify(model.sections.map(s=>[s.id,s.heading,s.hidden]));if(key===sectionKey)return;sectionKey=key;
  const list=$('studio-section-list');list.replaceChildren();
  model.sections.forEach((section,index)=>{
   const item=node('li',null,'studio-section');const title=node('input');title.value=section.heading;title.maxLength=80;title.setAttribute('aria-label','Section heading: '+section.originalHeading);title.dataset.sectionId=section.id;
   title.onchange=()=>{settings.headings={...settings.headings,[section.id]:title.value};change();};
   const include=node('input');include.type='checkbox';include.checked=!section.hidden;include.setAttribute('aria-label','Include '+section.heading+' in exports');include.onchange=()=>{const hidden=new Set(settings.hiddenSections||[]);if(include.checked)hidden.delete(section.id);else hidden.add(section.id);settings.hiddenSections=[...hidden];change();};
   const label=node('label',null,'checkbox-label');label.append(include,document.createTextNode('Include in export'));
   const actions=node('div',null,'section-order-actions');for(const [text,move]of [['↑',-1],['↓',1]]){const b=node('button',text,'button button-secondary');b.type='button';b.disabled=index+move<0||index+move>=model.sections.length;b.setAttribute('aria-label',(move<0?'Move up: ':'Move down: ')+section.heading);b.onclick=()=>{const order=model.sections.map(s=>s.id);[order[index],order[index+move]]=[order[index+move],order[index]];settings.sectionOrder=order;change();};actions.append(b);}
   item.append(title,label,actions);list.append(item);
  });$('studio-section-empty').hidden=model.sections.length>0;
 }
 $('section-reset').onclick=()=>{delete settings.sectionOrder;delete settings.headings;delete settings.hiddenSections;sectionKey='';change();};
 $('add-custom-section').onclick=()=>{const title=$('custom-section-title').value.trim(),text=$('custom-section-text').value.trim();if(!title||!text){api.error('Add a section heading and the facts you want to include.');return;}const next=api.getSource().trim()+`\n\n## ${title}\n${text}`;if(next.length>20000){api.error('This would exceed the resume text limit. Your existing text is unchanged. Shorten the new section.');return;}api.editSource(next);$('custom-section-title').value='';$('custom-section-text').value='';};
 $('studio-source-text').oninput=()=>api.editSource($('studio-source-text').value);
 $('studio-edit').onclick=()=>{$('studio-text-editor').open=true;$('studio-text-editor').scrollIntoView({block:'start'});$('studio-source-text').focus({preventScroll:true});};
 $('studio-preview').onclick=()=>$('resume-proof').scrollIntoView({block:'start',behavior:'instant'});
 $('resume-photo-upload').onclick=()=>$('resume-photo-input').click();
 $('resume-photo-input').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;const owner=api.owner(),token=++revision;
  try{
   if(!['image/jpeg','image/png'].includes(file.type)||file.size>2*1024*1024)throw new Error('Choose a JPG or PNG photo up to 2 MB.');
   const bitmap=await createImageBitmap(file);if(bitmap.width>12000||bitmap.height>12000){bitmap.close();throw new Error('Choose a smaller photo.');}
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,256,256);const side=Math.min(bitmap.width,bitmap.height);ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);bitmap.close();
   if(owner!==api.owner()||token!==revision)return;settings.photo=canvas.toDataURL('image/jpeg',.82);change();
  }catch(error){api.error(error.message||'The photo could not be opened. Your resume is unchanged.');}finally{event.target.value='';}
 };
 $('resume-photo-remove').onclick=()=>{delete settings.photo;change();};
 function sync(model){
  const s=model.style,federal=model.applicationType==='federal';$('selected-template-name').textContent=designs[model.design].name;$('selected-template-note').textContent=designs[model.design].description;
  $('studio-layout-note').textContent=federal?'Federal: one column, no photo, readable text. Check every requirement in the announcement.':s.layout==='single'?'Simple layouts are a good starting point for online applications.':'Two-column layout: education, skills and credentials appear in the side column. Ordering applies within each column.';
  for(const radio of document.querySelectorAll('[name="resume-design"]'))radio.disabled=federal&&!designs[radio.value].federal;
  if(federal!==lastFederal){$('template-category').value=federal?'federal':'';shown=6;lastFederal=federal;}filter();
  for(const opt of $('format-font').options)opt.disabled=federal&&opt.value==='SourceSerif';
  for(const opt of [...$('format-color').options])if(opt.dataset.templateColor)opt.remove();if(![...$('format-color').options].some(o=>o.value===s.color)){const opt=new Option('Template color',s.color);opt.dataset.templateColor='true';$('format-color').add(opt);}
  for(const field of document.querySelectorAll('[data-format-key]')){const key=field.dataset.formatKey;field.value=key==='nameAlignment'?s.alignment:key==='textAlignment'?s.textAlignment:s[key];if(field.type==='number')field.min=key==='fontSize'&&federal?10:key==='headingSize'&&federal?14:field.dataset.min||field.min;}
  $('format-color').disabled=federal;$('format-nameAlignment').disabled=federal;$('format-textAlignment').disabled=federal;
  for(const side of ['top','right','bottom','left']){$('margin-'+side).value=(s.margins[side]/72).toFixed(2);$('margin-'+side).min=federal?'.5':'.35';}
  $('format-federal-note').hidden=!federal;$('resume-paper').disabled=federal;
  const photoAllowed=!federal&&!!designs[model.design].photo;$('resume-photo-controls').hidden=!photoAllowed&&!settings.photo;$('resume-photo-input').disabled=!photoAllowed;$('resume-photo-remove').hidden=!settings.photo;
  $('resume-photo-upload').disabled=!photoAllowed;$('resume-photo-upload').textContent=settings.photo?'Change photo':'Upload a photo';$('resume-photo-controls').open=photoAllowed||!!settings.photo;$('resume-photo-preview').hidden=!settings.photo;if(settings.photo)$('resume-photo-preview').src=settings.photo;else $('resume-photo-preview').removeAttribute('src');
  $('resume-photo-status').textContent=settings.photo?(photoAllowed?'Photo added. It appears only in photo-enabled civilian designs.':'This draft retains a photo in its design settings, but this layout excludes it. Remove it below if you do not want to keep that copy.'):'Optional. Your photo is never sent for AI review.';
  if(document.activeElement!==$('studio-source-text'))$('studio-source-text').value=api.getSource();renderSections(model);
 }
 filter();return{sync,getSettings:()=>normalizeExportSettings(settings),load(value){revision++;settings=normalizeExportSettings(value);sectionKey='';},reset(){revision++;examples.reset();settings={};sectionKey='';shown=6;lastFederal=false;$('template-search').value='';$('template-category').value='';filter();$('resume-photo-input').value='';$('resume-photo-preview').removeAttribute('src');$('resume-photo-preview').hidden=true;$('studio-source-text').value='';$('custom-section-title').value='';$('custom-section-text').value='';$('studio-section-list').replaceChildren();$('studio-text-editor').open=false;$('template-library').open=false;$('resume-photo-controls').open=false;document.querySelector('.studio-add-section').open=false;},resetOrder(){delete settings.sectionOrder;sectionKey='';}};
}
