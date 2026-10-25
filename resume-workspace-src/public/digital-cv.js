import {profileToCv,resumeToCv,selectCv,optionsFromCv,cvDefaults,cvUrl,safeCvLink} from './digital-cv-model.js?v=20261101-finished-resumes';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
const optionNames=Object.keys(cvDefaults());
export function renderCvPreview(root,cv){
 root.replaceChildren();root.append(node('h2',cv.name||'Your name'),node('p',cv.headline||'Your professional headline'));
 if(cv.location)root.append(node('p',cv.location));
 const section=(title,children)=>{if(!children.length)return;const s=node('section');s.append(node('h3',title),...children);root.append(s);};
 if(cv.summary)section('Summary',[node('p',cv.summary)]);
 const experience=rows=>rows.map(e=>{const d=node('article');d.append(node('h4',e.title||[e.rank,e.mosTitle].filter(Boolean).join(' · ')||'Military service'),node('p',[e.employer||e.unit,e.branch,e.serviceType].filter(Boolean).join(' · ')),node('p',[e.startDate,e.current?'Present':e.endDate].filter(Boolean).join(' – ')));if(e.bullets?.length){const ul=node('ul');ul.append(...e.bullets.map(b=>node('li',b)));d.append(ul);}return d;});
 section('Military service',experience(cv.military||[]));section('Civilian experience',experience(cv.civilian||[]));
 section('Education',(cv.education||[]).map(e=>{const p=node('p');p.append(node('strong',[e.degree,e.field].filter(Boolean).join(' · ')),node('br'),document.createTextNode([e.institution,e.year].filter(Boolean).join(' · ')));return p;}));
 for(const [key,title]of [['technical','Skills'],['leadership','Leadership'],['certs','Certifications'],['languages','Languages']])if(cv.skills?.[key])section(title,[node('p',cv.skills[key])]);
 const contact=[];for(const [key,label]of [['email','Email'],['phone','Phone'],['linkedin','LinkedIn']])if(cv.contact?.[key]){const a=node('a',label+': '+cv.contact[key]);const value=cv.contact[key];a.href=key==='email'?'mailto:'+encodeURIComponent(value):key==='phone'?'tel:'+value.replace(/[^+\d]/g,''):safeCvLink(value);a.rel='noopener noreferrer';a.target='_blank';contact.push(a);}
 section('Contact',contact);
}
export function initDigitalCv(api){
 let sources=[],base={},published=null,slug='',generation=0,busy=false,loaded=false,loadFailed=false;
 const message=text=>{$('cv-status').textContent=text;};
 const fields=()=>Object.fromEntries(['name','headline','summary'].map(k=>[k,$('cv-'+k).value]));
 const options=()=>Object.fromEntries(optionNames.map(k=>[k,$('cv-include-'+k).checked]));
 const draft=()=>selectCv(base,options(),fields());
 function controls(){const registered=!!api.user()?.email;$('cv-account').hidden=registered;$('cv-editor').hidden=!registered||!loaded;$('cv-published').hidden=!published;$('cv-publish').disabled=busy||!loaded||loadFailed;$('cv-refresh').disabled=busy||!loaded;$('cv-use-resume').disabled=busy||!loaded||!sources.length;for(const id of ['cv-copy','cv-share','cv-unpublish'])$(id).disabled=busy;$('cv-publish').textContent=published?'Update published CV':'Publish my digital CV';$('cv-state').textContent=published?'Published · anyone with the link can view this CV.':'Private · your CV has not been published.';}
 function preview(){renderCvPreview($('cv-preview'),draft());}
 function fill(source,opts){base=source;for(const k of ['name','headline','summary'])$('cv-'+k).value=source[k]||'';for(const k of optionNames)$('cv-include-'+k).checked=!!opts[k];$('cv-consent').checked=false;preview();}
 const changed=()=>{$('cv-consent').checked=false;preview();if(published)message('Changes are private until you choose Update published CV.');};
 for(const k of ['name','headline','summary'])$('cv-'+k).addEventListener('input',changed);
 for(const k of optionNames)$('cv-include-'+k).addEventListener('change',changed);
 $('cv-account-signin').onclick=api.openAccount;
 $('cv-edit-profile').onclick=api.openProfile;
 async function refreshSources(){
  const token=generation,uid=api.user()?.uid;
  const current=api.getDraft();const saved=await api.listVersions().catch(()=>[]);
  if(token!==generation||uid!==api.user()?.uid)return;
  sources=[...(current.resume?.trim()?[{title:'Current resume in editor',resume:current.resume}]:[]),...saved.map(item=>({title:item.title||'Saved resume',resume:item.workspace?.resume||item.content||''})).filter(x=>x.resume.trim())];
  $('cv-resume-source').replaceChildren(...sources.map((item,index)=>new Option(item.title,String(index))));
  $('cv-source-help').textContent=sources.length?'Choose the updated resume below, load it, check every section, then publish to update the same link.':'No resume is available yet. Finish and save a resume, or use your career profile below.';controls();
 }
 async function useResume(text,title='Selected resume'){
  const uid=api.user()?.uid;await open();if(uid!==api.user()?.uid||!loaded||busy)return;
  fill(resumeToCv(text),{...options(),military:true,civilian:true,education:true,skills:true,certifications:true,languages:true});$('cv-source-state').textContent='Private preview from: '+title+'.';
  message('Resume loaded into this private CV preview. Check parsed names, jobs and dates, choose what to share, then '+(published?'Update published CV':'Publish my digital CV')+'. Your live page has not changed.');
 }
 $('cv-use-resume').onclick=()=>{const source=sources[Number($('cv-resume-source').value)];if(source)useResume(source.resume,source.title).catch(error=>message(error.message));};
 async function open(){
  if(loaded&&!loadFailed){await refreshSources();controls();return;}
  const token=++generation,uid=api.user()?.uid;busy=true;loaded=false;loadFailed=false;published=null;controls();message('');
  if(!api.user()?.email){busy=false;controls();return;}
  message('Loading your digital CV…');
  try{await api.ready();const result=await api.load();if(token!==generation||uid!==api.user()?.uid)return;slug=result.slug;published=result.cv;loaded=true;
   fill(published||profileToCv(api.getProfile()),published?optionsFromCv(published):cvDefaults());$('cv-link').value=cvUrl(slug);$('cv-open').href=cvUrl(slug);
   $('cv-source-state').textContent=published?'Showing the published snapshot. Resume updates are not public yet.':'Private preview from your career profile.';message('Load your updated resume below to match your CV to it. Nothing changes on the public page until you publish.');await refreshSources();
  }catch{if(token===generation){loadFailed=true;message('Your digital CV could not load. Try again before replacing an existing published CV.');}}
  finally{if(token===generation){busy=false;controls();$('cv-retry').hidden=!loadFailed;}}
 }
 $('cv-retry').onclick=open;
 $('cv-refresh').onclick=()=>{if(!confirm('Replace this CV draft with your current profile details? Your public link will stay unchanged until you publish the update.'))return;fill(profileToCv(api.getProfile()),options());$('cv-source-state').textContent='Private preview from your current career profile.';message('Profile details refreshed in this private preview. Check every section before publishing.');};
 $('cv-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!loaded||loadFailed)return;
  if(!$('cv-consent').checked){message('Check the public preview, then agree to publish the selected details.');$('cv-consent').focus();return;}
  const cv=draft();if(!cv.name){message('Enter your name before publishing.');$('cv-name').focus();return;}
  const token=generation;busy=true;controls();message('Publishing your chosen details…');
  try{await api.publish(cv);if(token!==generation)return;published=cv;$('cv-consent').checked=false;message(JSON.stringify(draft())===JSON.stringify(cv)?'Your digital CV is live. Copy the link below to share it.':'CV published. Newer edits in this preview are still private; publish again to include them.');$('cv-published').hidden=false;$('cv-link').focus();}
  catch(error){if(token===generation)message('The CV could not be published. Your draft is still here. Check your connection and try again.');}
  finally{if(token===generation){busy=false;controls();}}
 });
 $('cv-unpublish').onclick=async()=>{if(busy||!published||!confirm('Unpublish this digital CV? The link will stop showing your profile after the short cache refresh. Copies already saved by others may remain.'))return;const token=generation;busy=true;controls();try{await api.unpublish();if(token!==generation)return;published=null;message('CV unpublished. The link stops showing your profile after a short cache refresh. Your private profile is unchanged.');}catch{if(token===generation)message('Unpublishing failed. Your CV may still be public. Check your connection and try again.');}finally{if(token===generation){busy=false;controls();}}};
 $('cv-copy').onclick=async()=>{const token=generation;try{await navigator.clipboard.writeText(cvUrl(slug));if(token===generation)message('Link copied. Share it with an employer or add it to an application.');}catch{if(token===generation){$('cv-link').focus();$('cv-link').select();message('Select and copy the link in the box above.');}}};
 $('cv-share').hidden=!navigator.share;
 $('cv-share').onclick=async()=>{try{await navigator.share({title:'My digital CV',url:cvUrl(slug)});}catch(error){if(error.name!=='AbortError')message('Sharing could not open. Use Copy link instead.');}};
 function reset(){generation++;sources=[];$('cv-resume-source').replaceChildren();$('cv-source-state').textContent='';base={};published=null;slug='';busy=false;loaded=false;loadFailed=false;fill({},cvDefaults());$('cv-link').value='';$('cv-open').removeAttribute('href');$('cv-retry').hidden=true;message('');controls();}
 reset();return {open,reset,useResume};
}
