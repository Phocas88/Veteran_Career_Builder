import {safeProfilePhoto} from './profile-media.js?v=20261026-career-tools';
import {profileToCv,resumeToCv,selectCv,optionsFromCv,cvDefaults,cvUrl,safeCvLink} from './digital-cv-model.js?v=20261026-career-tools';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
const optionNames=Object.keys(cvDefaults());
export function renderCvPreview(root,cv){
 root.replaceChildren();if(safeProfilePhoto(cv.photo)){const photo=node('img');photo.src=cv.photo;photo.alt='Profile photo';photo.className='cv-profile-photo';photo.width=104;photo.height=104;root.append(photo);}root.append(node('h2',cv.name||'Your name'),node('p',cv.headline||'Your professional headline'));
 if(cv.location)root.append(node('p',cv.location));
 const section=(title,children)=>{if(!children.length)return;const s=node('section');s.append(node('h3',title),...children);root.append(s);};
 if(cv.summary)section('Summary',[node('p',cv.summary)]);
 const experience=rows=>rows.map(e=>{const d=node('article');d.append(node('h4',e.title||[e.rank,e.mosTitle].filter(Boolean).join(' · ')||'Military service'),node('p',[e.employer||e.unit,e.branch,e.serviceType].filter(Boolean).join(' · ')),node('p',[e.startDate,e.current?'Present':e.endDate].filter(Boolean).join(' – ')));if(e.bullets?.length){const ul=node('ul');ul.append(...e.bullets.map(b=>node('li',b)));d.append(ul);}return d;});
 section('Military service',experience(cv.military||[]));section('Civilian experience',experience(cv.civilian||[]));
 section('Education',(cv.education||[]).map(e=>{const p=node('p');p.append(node('strong',[e.degree,e.field].filter(Boolean).join(' · ')),node('br'),document.createTextNode([e.institution,e.year].filter(Boolean).join(' · ')));return p;}));
 for(const [key,title]of [['technical','Skills'],['leadership','Leadership'],['certs','Certifications'],['languages','Languages']])if(cv.skills?.[key])section(title,[node('p',cv.skills[key])]);
 const contact=[];for(const [key,label]of [['email','Email'],['phone','Phone'],['linkedin','LinkedIn'],['portfolio','Portfolio'],['github','GitHub'],['website','Website']])if(cv.contact?.[key]){const a=node('a',label+': '+cv.contact[key]);const value=cv.contact[key];a.href=key==='email'?'mailto:'+encodeURIComponent(value):key==='phone'?'tel:'+value.replace(/[^+\d]/g,''):safeCvLink(value);a.rel='noopener noreferrer';a.target='_blank';contact.push(a);}
 section('Contact',contact);
}
export function initDigitalCv(api){
 let base={},published=null,slug='',generation=0,busy=false,loaded=false,loadFailed=false,sources=[],stage='source',previewReady=false;
 const message=text=>{$('cv-status').textContent=text;};
 const fields=()=>Object.fromEntries(['name','headline','summary'].map(k=>[k,$('cv-'+k).value]));
 const options=()=>Object.fromEntries(optionNames.map(k=>[k,$('cv-include-'+k).checked]));
 const draft=()=>selectCv(base,options(),fields());
 function controls(){
  const registered=!!api.user()?.email;$('cv-account').hidden=registered;
  $('cv-workflow').hidden=!registered||!loaded;$('cv-source-panel').hidden=!registered||!loaded||stage!=='source';$('cv-editor').hidden=!registered||!loaded||stage!=='preview';$('cv-published').hidden=!published||stage!=='share';$('cv-source-state').hidden=stage!=='preview';
  $('cv-publish').disabled=busy||!loaded||loadFailed;$('cv-refresh').disabled=busy||!loaded;$('cv-use-resume').disabled=busy||!loaded||!sources.length;
  for(const id of ['cv-copy','cv-share','cv-unpublish','cv-start-update'])$(id).disabled=busy;
  $('cv-step-preview').disabled=busy||!previewReady;$('cv-step-share').disabled=busy||!published;$('cv-step-source').disabled=busy;
  for(const [id,key]of [['cv-step-source','source'],['cv-step-preview','preview'],['cv-step-share','share']])$(id).setAttribute('aria-current',stage===key?'step':'false');
  $('cv-publish').textContent=published?'Publish CV update':'Publish my digital CV';$('cv-state').textContent=stage==='share'?'Live · your shareable CV link':stage==='preview'?'Step 2 · Check your public preview':'Step 1 · Choose a resume';
 }
 function show(next){stage=next;controls();window.scrollTo({top:0,behavior:'instant'});}
 function preview(){renderCvPreview($('cv-preview'),draft());}
 function fill(source,opts){base=source;for(const k of ['name','headline','summary'])$('cv-'+k).value=source[k]||'';for(const k of optionNames)$('cv-include-'+k).checked=!!opts[k];$('cv-consent').checked=false;preview();}
 const changed=()=>{$('cv-consent').checked=false;preview();if(published)message('Check this preview, then Publish CV update to replace the page at your existing link.');};
 for(const k of ['name','headline','summary'])$('cv-'+k).addEventListener('input',changed);
 for(const k of optionNames)$('cv-include-'+k).addEventListener('change',changed);
 $('cv-account-signin').onclick=api.openAccount;$('cv-edit-profile').onclick=api.openProfile;
 $('cv-step-source').onclick=()=>show('source');$('cv-step-preview').onclick=()=>show('preview');$('cv-step-share').onclick=()=>show('share');
 async function refreshSources(){
  const token=generation,uid=api.user()?.uid,current=api.getDraft();
  const saved=await api.listVersions().catch(()=>[]);if(token!==generation||uid!==api.user()?.uid)return;
  sources=[...saved.filter(item=>item.finished).map(item=>({title:(item.title||'My resume')+' · purchased',item})),...(current.resume?.trim()?[{title:'Current resume in editor',resume:current.resume}]:[]),...saved.filter(item=>!item.finished&&item.workspace?.resume).map(item=>({title:item.title||'Saved draft',item}))];
  $('cv-resume-source').replaceChildren(...sources.map((item,index)=>new Option(item.title,String(index))));
  $('cv-source-help').textContent=sources.length?'Your purchased documents are listed first. Choose the version employers should see.':'No finished resume yet. Save a resume first, or use your career profile below.';controls();
 }
 async function useResume(text,title='Selected resume'){
  const uid=api.user()?.uid;await open();if(uid!==api.user()?.uid||!loaded||busy)return;
  const source=resumeToCv(text),profile=profileToCv(api.getProfile());source.photo=profile.photo;for(const key of ['portfolio','github','website'])source.contact[key] ||= profile.contact[key];
  fill(source,{...options(),military:true,civilian:true,education:true,skills:true,certifications:true,languages:true});previewReady=true;$('cv-source-state').textContent='Resume: '+title;message('Check the preview and choose what to share. Publishing updates your existing CV link.');show('preview');
 }
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
  try{await api.ready();const result=await api.load();if(token!==generation||uid!==api.user()?.uid)return;slug=result.slug;published=result.cv;loaded=true;fill(published||profileToCv(api.getProfile()),published?optionsFromCv(published):cvDefaults());previewReady=!!published;
   $('cv-link').value=cvUrl(slug);$('cv-open').href=cvUrl(slug);$('cv-source-state').textContent=published?'Current published CV':'';stage=published?'share':'source';await refreshSources();message(published?'Your existing link is ready to share. Choose Update from a saved resume when you have a newer document.':'Choose a resume to begin. Nothing is public until you publish.');
  }catch{if(token===generation){loadFailed=true;message('Your CV could not load. Try again before replacing an existing published page.');}}
  finally{if(token===generation){busy=false;controls();$('cv-retry').hidden=!loadFailed;}}
 }
 $('cv-retry').onclick=open;$('cv-start-update').onclick=async()=>{await refreshSources();message('Choose the updated resume, then continue to the public preview.');show('source');};
 $('cv-refresh').onclick=()=>{fill(profileToCv(api.getProfile()),options());previewReady=true;$('cv-source-state').textContent='Resume source: career profile';message('Check your profile details below before publishing.');show('preview');};
 $('cv-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!loaded||loadFailed||stage!=='preview')return;
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
 function reset(){generation++;base={};published=null;slug='';busy=false;loaded=false;loadFailed=false;sources=[];stage='source';previewReady=false;$('cv-resume-source').replaceChildren();fill({},cvDefaults());$('cv-source-state').textContent='';$('cv-link').value='';$('cv-open').removeAttribute('href');$('cv-retry').hidden=true;message('');controls();}
 reset();return {open,reset,useResume};
}
