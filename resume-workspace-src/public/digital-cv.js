import {cleanPublicCv,cvSkillGroups,cvCredentialEntries,cvListItems} from './cv-content.js?v=20261030-sections';
import {safeProfilePhoto} from './profile-media.js?v=20261026-career-tools';
import {profileToCv,resumeToCv,selectCv,optionsFromCv,cvDefaults,cvUrl,safeCvLink,cvSectionCounts,normalizePublishedCv} from './digital-cv-model.js?v=20261030-sections';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
const optionNames=Object.keys(cvDefaults());
const previewDate=value=>{const match=/^(\d{4})-(0[1-9]|1[0-2])$/.exec(value||'');return match?new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'-01T00:00:00Z')):value||'';};
const previewDates=entry=>[previewDate(entry.startDate),entry.current?'Present':previewDate(entry.endDate)].filter(Boolean).join(' – ')||entry.dateText||'';
export function renderCvPreview(root,value){
 const cv=cleanPublicCv(value);root.replaceChildren();
 const sheet=node('div');sheet.className='cv-preview-sheet';const header=node('header');header.className='cv-preview-heading';
 if(safeProfilePhoto(cv.photo)){const photo=node('img');photo.src=cv.photo;photo.alt='Profile photo';photo.className='cv-profile-photo';photo.width=104;photo.height=104;header.append(photo);}
 const introduction=node('div');introduction.append(node('h2',cv.name||'Your name'));if(cv.headline)introduction.append(node('p',cv.headline));if(cv.location)introduction.append(node('p',cv.location));header.append(introduction);
 const body=node('div');body.className='cv-preview-body';sheet.append(header,body);root.append(sheet);
 const section=(title,children,key)=>{if(!children.length)return;const s=node('section');s.dataset.cvContent=key;s.append(node('h3',title),...children);body.append(s);};
 const list=(values,className)=>{const ul=node('ul');if(className)ul.className=className;ul.append(...values.map(text=>node('li',text)));return ul;};
 const grid=(cards,className='cv-record-grid')=>{const wrap=node('div');wrap.className=className;wrap.append(...cards);return [wrap];};
 const record=(title,paragraphs,className='cv-record')=>{const article=node('article');article.className=className;article.append(node('h4',title));for(const [text,style]of paragraphs.filter(([text])=>!!text)){const p=node('p',text);if(style)p.className=style;article.append(p);}return article;};
 if(cv.summary)section('Professional summary',cv.summary.split(/\n\s*\n/).map(text=>node('p',text)),'summary');
 const experience=(rows,military=false)=>rows.map(e=>{const d=node('article');d.className='cv-preview-position';const heading=node('div');heading.className='cv-preview-position-heading';heading.append(node('h4',military?[e.rank,e.mosTitle||e.title].filter(Boolean).join(' · ')||'Military service':e.title||'Professional experience'));if(previewDates(e))heading.append(node('p',previewDates(e)));d.append(heading);const org=[e.employer||e.unit,e.branch,e.serviceType,e.location].filter(Boolean).join(' · ');if(org)d.append(node('p',org));if(e.bullets?.length)d.append(list(e.bullets));return d;});
 section('Professional experience',experience(cv.civilian||[]),'civilian');section('Military service',experience(cv.military||[],true),'military');
 const groups=cvSkillGroups(cv.skills?.technical,cv.skills?.leadership);if(groups.length)section('Skills & tools',grid(groups.map(group=>{const card=record(group.title,[],'cv-skill-group');card.append(list(group.items,'cv-skill-list'));return card;}),'cv-skill-grid'),'skills');
 if(cv.education?.length)section('Education',grid(cv.education.map(e=>{const qualification=[e.degree,e.field].filter(Boolean).join(' · ');return record(e.institution||qualification||'Education',[[e.institution?qualification:'','cv-qualification'],[[e.year,e.status].filter(Boolean).join(' · '),'cv-record-meta'],[e.details,'cv-record-notes']],'cv-record cv-education');})),'education');
 const certificates=cvCredentialEntries(cv.skills?.certs);if(certificates.length)section('Licenses & certifications',grid(certificates.map(e=>record(e.name,[[e.details,'']],'cv-record cv-certification'))),'certifications');
 if(cv.training?.length)section('Training & professional development',grid(cv.training.map(e=>record(e.name,[[e.institution,''],[[e.date,e.status].filter(Boolean).join(' · '),'cv-record-meta']],'cv-record cv-training'))),'training');
 section('Projects & volunteering',(cv.projects||[]).map(e=>{const block=record(e.name||'Project',[[e.title,''],[previewDates(e),'cv-record-meta']],'cv-preview-position');if(e.bullets?.length)block.append(list(e.bullets));return block;}),'projects');
 const languages=cvListItems(cv.skills?.languages);if(languages.length)section('Languages',[list(languages,'cv-language-list')],'languages');
 const contact=[];for(const [key,label]of [['email','Email'],['phone','Phone'],['linkedin','LinkedIn'],['portfolio','Portfolio'],['github','GitHub'],['website','Website']])if(cv.contact?.[key]){const a=node('a',label+': '+cv.contact[key]);const value=cv.contact[key];a.href=key==='email'?'mailto:'+encodeURIComponent(value):key==='phone'?'tel:'+value.replace(/[^+\d]/g,''):safeCvLink(value);a.rel='noopener noreferrer';a.target='_blank';contact.push(a);}
 section('Contact',contact,'contact');
}
export function initDigitalCv(api){
 let base={},published=null,slug='',generation=0,busy=false,loaded=false,loadFailed=false,sources=[],stage='source',previewReady=false,reviewStep=null;
 const reviewSections=[['about','Introduction'],['military','Military service'],['civilian','Civilian & government jobs'],['education','Education'],['skills','Skills & qualifications'],['contact','Contact & visibility']];
 let confirmed=new Set();
 const message=text=>{$('cv-status').textContent=text;};
 const fields=()=>Object.fromEntries(['name','headline','summary'].map(k=>[k,$('cv-'+k).value]));
 const options=()=>Object.fromEntries(optionNames.map(k=>[k,$('cv-include-'+k).checked]));
 const draft=()=>selectCv(base,options(),fields());
 const previewSize=()=>{const root=$('cv-preview'),sheet=root.querySelector('.cv-preview-sheet');if(!sheet||!root.clientWidth)return;const expanded=root.dataset.expanded==='true',scale=expanded?1:Math.min(1,root.clientWidth/1120);sheet.style.transform='scale('+scale+')';root.style.height=expanded?'min(70vh,900px)':Math.ceil(sheet.scrollHeight*scale)+'px';root.style.overflow=expanded?'auto':'hidden';};
 const resize=new ResizeObserver(()=>requestAnimationFrame(previewSize));resize.observe($('cv-preview').parentElement);
 $('cv-preview-size').onclick=()=>{const expanded=$('cv-preview').dataset.expanded!=='true';$('cv-preview').dataset.expanded=String(expanded);$('cv-preview-size').setAttribute('aria-pressed',String(expanded));$('cv-preview-size').textContent=expanded?'Fit preview to screen':'Enlarge preview';previewSize();};
 function controls(){
  const registered=!!api.user()?.email;$('cv-account').hidden=registered;
  $('cv-workflow').hidden=!registered||!loaded;$('cv-source-panel').hidden=!registered||!loaded||stage!=='source';$('cv-editor').hidden=!registered||!loaded||stage!=='preview';$('cv-published').hidden=!published||stage!=='share';$('cv-source-state').hidden=stage!=='preview';
  $('cv-publish').disabled=busy||!loaded||loadFailed||reviewStep!==null;$('cv-refresh').disabled=busy||!loaded;$('cv-use-resume').disabled=busy||!loaded||!sources.length;
  for(const id of ['cv-copy','cv-share','cv-unpublish','cv-start-update'])$(id).disabled=busy;
  $('cv-step-preview').disabled=busy||!previewReady||reviewStep!==null;$('cv-step-share').disabled=busy||!published||reviewStep!==null;$('cv-step-source').disabled=busy;
  for(const [id,key]of [['cv-step-source','source'],['cv-step-preview','preview'],['cv-step-share','share']])$(id).setAttribute('aria-current',stage===key?'step':'false');
  $('cv-publish').textContent=published?'Publish CV update':'Publish my digital CV';$('cv-state').textContent=reviewStep!==null&&stage==='preview'?'Step 2 · Review each section':stage==='share'?'Live · your shareable CV link':stage==='preview'?'Step 2 · Check your public preview':'Step 1 · Choose a resume';
 }
 function show(next){stage=next;controls();reviewControls();window.scrollTo({top:0,behavior:'instant'});}
 function reviewControls(){
  const guided=reviewStep!==null;document.body.classList.toggle('cv-preview-ready',stage==='preview'&&!guided);document.body.classList.toggle('cv-reviewing',guided&&stage==='preview');$('cv-section-guide').hidden=!guided;$('cv-review-actions').hidden=!guided;$('cv-preview-help').hidden=guided;document.querySelector('.cv-preview-column').hidden=guided;document.querySelector('.cv-publish-box').hidden=guided;
  for(const section of document.querySelectorAll('[data-cv-review-section]'))section.hidden=guided&&section.dataset.cvReviewSection!==reviewSections[reviewStep][0];
  if(!guided)return;const title=reviewSections[reviewStep][1];$('cv-options').open=true;$('cv-review-title').textContent=title;$('cv-review-progress').textContent=`Section ${reviewStep+1} of ${reviewSections.length} · ${confirmed.size} confirmed`;$('cv-review-meter').value=confirmed.size;$('cv-review-back').disabled=busy||reviewStep===0;$('cv-review-next').disabled=busy;$('cv-review-next').textContent=reviewStep===reviewSections.length-1?'Confirm & see complete preview →':'Confirm & next →';
 }
 function startReview(){reviewStep=0;confirmed.clear();$('cv-review-confirmation').textContent='Start with your introduction. Confirm each section to continue.';show('preview');$('cv-review-title').focus({preventScroll:true});}
 $('cv-review-next').onclick=()=>{if(busy||reviewStep===null)return;if(reviewStep===0&&!$('cv-name').value.trim()){message('Enter the name to display before continuing.');$('cv-name').focus();return;}const title=reviewSections[reviewStep][1];confirmed.add(reviewStep);if(reviewStep<reviewSections.length-1){reviewStep++;reviewControls();$('cv-review-confirmation').textContent='✓ '+title+' confirmed. Next: '+reviewSections[reviewStep][1]+'.';window.scrollTo({top:0,behavior:'instant'});$('cv-review-title').focus({preventScroll:true});message('');}else{reviewStep=null;$('cv-options').open=false;show('preview');message('✓ Your sections are checked.');$('cv-state').focus({preventScroll:true});}};
 $('cv-review-back').onclick=()=>{if(busy||reviewStep===null||reviewStep===0)return;reviewStep--;reviewControls();$('cv-review-confirmation').textContent='Reviewing '+reviewSections[reviewStep][1]+'.';window.scrollTo({top:0,behavior:'instant'});$('cv-review-title').focus({preventScroll:true});};
 function preview(){for(const key of ['location','email','phone','linkedin','portfolio','github','website']){const label=$('cv-include-'+key).closest('label');let value=label.querySelector('.cv-private-value');if(!value){value=node('span');value.className='cv-private-value';label.append(value);}value.textContent=(key==='location'?base.location:base.contact?.[key])||'Not in this source';}const cv=draft();renderCvPreview($('cv-preview'),cv);for(const section of document.querySelectorAll('[data-cv-section-preview]')){const key=section.dataset.cvSectionPreview;const parts={...cv,military:[],civilian:[],education:[],training:[],projects:[],skills:{},contact:{},summary:'',photo:''};parts[key]=cv[key];if(key==='contact')parts.location=cv.location;const holder=node('div');renderCvPreview(holder,parts);section.replaceChildren(...holder.querySelectorAll('section'));if(!section.children.length)section.append(node('p',key==='contact'?'No contact details selected. Your CV can be shared without them.':'No details to share in this section. You can continue or add them below.'));}contentCheck(cv);requestAnimationFrame(previewSize);}
 function editSection(index){reviewStep=index;confirmed.delete(index);show('preview');$('cv-review-title').focus({preventScroll:true});}
 function contentCheck(cv){
  const count=cvSectionCounts(cv),root=$('cv-content-check');root.replaceChildren(node('p',`Experience: ${count.military+count.civilian} · Education: ${count.education} · Skills: ${count.skills}`));
  for(const [key,index,label]of [['education',3,'Education'],['skills',4,'Skills']])if(!count[key]){const row=node('div');row.className='cv-missing-section';row.append(node('p',label+' is not included in this preview. You can add it now or leave it out.'));const button=node('button','Review '+label.toLowerCase());button.type='button';button.className='text-button';button.onclick=()=>editSection(index);row.append(button);root.append(row);}
 }
 function editField(parent,label,value,max,change,{multiline=false,placeholder=''}={}){
  const wrapper=node('label',label);wrapper.className='cv-edit-field';const field=node(multiline?'textarea':'input');field.value=value||'';field.maxLength=max;field.placeholder=placeholder;if(multiline)field.rows=4;else field.type='text';field.oninput=()=>{change(field.value);changed();};wrapper.append(field);parent.append(wrapper);return field;
 }
 function renderEditors(){
  const root=$('cv-education-fields');root.replaceChildren();for(const [index,entry]of (base.education||[]).entries()){
   const card=node('fieldset');card.className='cv-education-entry';card.append(node('legend','Education '+(index+1)));
   for(const [key,label,max,placeholder]of [['institution','School or institution',200,'e.g. Example University'],['degree','Degree or qualification',160,'e.g. Bachelor of Science'],['field','Field of study',200,'e.g. Business Administration'],['year','Year or expected completion',100,'e.g. 2022 or Expected June 2027'],['status','Completion status · optional',60,'e.g. In progress or Completed']])editField(card,label,entry[key],max,value=>{entry[key]=value;},{placeholder});
   const remove=node('button','Remove this education entry');remove.type='button';remove.className='text-button';remove.onclick=()=>{base.education.splice(index,1);renderEditors();changed();};card.append(remove);root.append(card);
  }
  const skills=$('cv-skill-fields');skills.replaceChildren();base.skills||={};for(const [key,label,placeholder]of [['technical','Skills & tools','e.g. Inventory planning, Excel, staff training'],['leadership','Leadership skills · optional','e.g. Team coaching, scheduling'],['certs','Licenses & certifications · optional','One credential per line; include the issuer and status as recorded'],['languages','Languages · optional','e.g. Spanish — conversational']])editField(skills,label,base.skills[key],6000,value=>{base.skills[key]=value;},{multiline:true,placeholder});
 }
 $('cv-add-education').onclick=()=>{base.education||=[];if(base.education.length>=30){message('This CV supports up to 30 education entries.');return;}base.education.push({institution:'',degree:'',field:'',year:''});$('cv-include-education').checked=true;renderEditors();changed();$('cv-education-fields').querySelector('fieldset:last-child input').focus();};
 function fill(source,opts){base=structuredClone(source);for(const k of ['name','headline','summary'])$('cv-'+k).value=source[k]||'';for(const k of optionNames)$('cv-include-'+k).checked=!!opts[k];$('cv-consent').checked=false;renderEditors();preview();}
 const changed=()=>{if(reviewStep!==null){confirmed.delete(reviewStep);reviewControls();}$('cv-consent').checked=false;preview();if(published)message('Check this preview, then Publish CV update to replace the page at your existing link.');};
 for(const k of ['name','headline','summary'])$('cv-'+k).addEventListener('input',changed);
 for(const k of optionNames)$('cv-include-'+k).addEventListener('change',changed);
 $('cv-account-signin').onclick=api.openAccount;$('cv-edit-profile').onclick=api.openProfile;
 $('cv-step-source').onclick=()=>show('source');$('cv-step-preview').onclick=()=>show('preview');$('cv-step-share').onclick=()=>show('share');
 async function refreshSources(){
  const token=generation,uid=api.user()?.uid,current=api.getDraft();
  const saved=await api.listVersions().catch(()=>[]);if(token!==generation||uid!==api.user()?.uid)return;
  sources=[...saved.filter(item=>item.finished).map(item=>({title:(item.title||'My resume')+' · purchased',item})),...(current.resume?.trim()?[{title:'Current resume in editor',resume:current.resume}]:[]),...saved.filter(item=>!item.finished&&(item.workspace?.resume||item.content||item.resumeData)).map(item=>({title:item.title||'Saved draft',item}))];
  $('cv-resume-source').replaceChildren(...sources.map((item,index)=>new Option(item.title,String(index))));
  $('cv-source-help').textContent=sources.length?'Your finished resumes are stored in My resumes. Choose the document you want employers to see, then press the button below.':'No finished resume yet. Save a resume first, or use your career profile below.';controls();
 }
 async function useResume(text,title='Selected resume'){
  const uid=api.user()?.uid;await open();if(uid!==api.user()?.uid||!loaded||busy)return;
  const source=resumeToCv(text),profile=profileToCv(api.getProfile());source.photo=profile.photo;for(const key of ['portfolio','github','website'])source.contact[key] ||= profile.contact[key];
  fill(source,{...options(),military:true,civilian:true,education:true,skills:true,certifications:true,languages:true,training:true,projects:true});previewReady=true;$('cv-source-state').textContent='Resume: '+title;message('Check the preview and choose what to share. Publishing updates your existing CV link.');startReview();
 }
 async function useProfile(){const uid=api.user()?.uid;await open();if(uid!==api.user()?.uid||!loaded||busy)return;fill(profileToCv(api.getProfile()),options());previewReady=true;$('cv-source-state').textContent='Source: your approved profile details';message('');startReview();}
 $('cv-use-resume').onclick=async()=>{
  if(busy)return;const source=sources[Number($('cv-resume-source').value)];if(!source)return;
  const uid=api.user()?.uid,token=generation;busy=true;controls();message('Opening the selected resume…');
  try{const value=source.item?await api.resolveVersion(source.item):{resume:source.resume};if(uid!==api.user()?.uid||token!==generation)return;busy=false;await useResume(value.resume,source.title);}
  catch(error){if(token===generation)message(error.message||'This resume could not load. Open it in My resumes and try again.');}
  finally{if(token===generation){busy=false;controls();}}
 };
 async function open(){
  if(loaded&&!loadFailed){await refreshSources();controls();return;}
  const token=++generation,uid=api.user()?.uid;busy=true;loaded=false;loadFailed=false;published=null;controls();message('');
  if(!api.user()?.email){busy=false;controls();return;}
  message('Loading your digital CV…');
  try{await api.ready();const result=await api.load();if(token!==generation||uid!==api.user()?.uid)return;slug=result.slug;published=result.cv?normalizePublishedCv(result.cv):null;loaded=true;fill(published||profileToCv(api.getProfile()),published?optionsFromCv(published):cvDefaults());previewReady=!!published;
   $('cv-link').value=cvUrl(slug);$('cv-open').href=cvUrl(slug);$('cv-source-state').textContent=published?'Your currently published CV':'';stage=published?'share':'source';await refreshSources();message(published?'Your existing link is ready to share. Choose Update from a saved resume when you have a newer document.':'Choose a resume to begin. Nothing is public until you publish.');
  }catch{if(token===generation){loadFailed=true;message('Your CV could not load. Try again before replacing an existing published page.');}}
  finally{if(token===generation){busy=false;controls();$('cv-retry').hidden=!loadFailed;}}
 }
 $('cv-retry').onclick=open;$('cv-start-update').onclick=async()=>{await refreshSources();message('Choose the updated resume, then continue to the public preview.');show('source');};
 $('cv-refresh').onclick=()=>useProfile().catch(()=>message('Your profile could not load. Try again.'));
 $('cv-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!loaded||loadFailed||stage!=='preview'||reviewStep!==null)return;
  if(!$('cv-consent').checked){message('Confirm that the details in this preview may be public.');$('cv-consent').focus();return;}
  const cv=draft();if(!cv.name){message('Enter your name before publishing.');$('cv-name').focus();return;}
  const token=generation;busy=true;controls();message('Publishing your CV…');
  try{await api.publish(cv);if(token!==generation)return;published=cv;$('cv-consent').checked=false;
   if(JSON.stringify(draft())===JSON.stringify(cv)){show('share');message('Your digital CV is live. Copy your link to share it.');$('cv-link').focus();}
   else message('Your update was published. Newer edits in this preview are still private; publish again to include them.');
  }catch(error){if(token===generation)message('Publishing failed. Your preview is still here. Try again.');}
  finally{if(token===generation){busy=false;controls();}}
 });
 $('cv-unpublish').onclick=async()=>{if(busy||!published||!confirm('Unpublish your digital CV? The link will stop displaying it after a short cache refresh.'))return;const token=generation;busy=true;controls();try{await api.unpublish();if(token!==generation)return;published=null;show('source');message('Your digital CV is unpublished. Your resumes are still saved privately.');}catch{if(token===generation)message('Unpublishing failed. Your CV may still be public. Try again.');}finally{if(token===generation){busy=false;controls();}}};
 $('cv-copy').onclick=async()=>{const token=generation;try{await navigator.clipboard.writeText(cvUrl(slug));if(token===generation)message('Link copied. You can share it with an employer.');}catch{if(token===generation){$('cv-link').focus();$('cv-link').select();message('Select and copy your link above.');}}};
 $('cv-share').hidden=!navigator.share;$('cv-share').onclick=async()=>{try{await navigator.share({title:'My digital CV',url:cvUrl(slug)});}catch(error){if(error.name!=='AbortError')message('Use Copy link to share your CV.');}};
 function reset(){generation++;base={};published=null;slug='';busy=false;loaded=false;loadFailed=false;sources=[];stage='source';previewReady=false;reviewStep=null;confirmed.clear();$('cv-review-confirmation').textContent='';reviewControls();$('cv-resume-source').replaceChildren();fill({},cvDefaults());$('cv-source-state').textContent='';$('cv-link').value='';$('cv-open').removeAttribute('href');$('cv-retry').hidden=true;message('');controls();}
 reset();return {open,reset,useResume,useProfile};
}
