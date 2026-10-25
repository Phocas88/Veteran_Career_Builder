import {initDigitalCv} from './digital-cv.js?v=20261101-finished-resumes';
import {selectProfileSection} from './background-form.js?v=20261030-visible-gallery';
import { normalizeJob, jobStatuses, versionGroups, profileSummary } from './career-model.js?v=20261025-standalone-app';
import { savedResumeToDraft } from './cloud-store.js?v=20261101-finished-resumes';
import { careerBuildContext, requestCareerKit } from './payments.js?v=20261101-finished-resumes';
import { exportLetter } from './letter-exports.js?v=20261025-standalone-app';
import {initServiceLibrary} from './service-library.js?v=20261030-visible-gallery';
import {showAppView,getAppView,isCareerView,syncAppSummary} from './app-shell.js?v=20261031-digital-cv';

const $=id=>document.getElementById(id);
const node=(tag,content,className)=>{const el=document.createElement(tag);if(content)el.textContent=content;if(className)el.className=className;return el;};
const button=(label,run)=>{const b=node('button',label,'text-button');b.type='button';b.addEventListener('click',()=>Promise.resolve().then(run).catch(e=>status(e.message)));return b;};
const status=message=>{$('career-status').textContent=message;if(message)document.dispatchEvent(new CustomEvent('app:notice',{detail:message}));};
export function initCareerTools(api){
 let tab='profile',generation=0,jobs=[],versions=[],letters=[],editingJob=null,kitController,letterBuildId='',letterRole='',letterRevision=-1,busy=false;
 const kits=new Map();
 let returnView='home';
 const field=name=>$('career-job-form').elements.namedItem(name);
 const fieldNames=['role','company','url','applicationType','status','appliedDate','interviewDate','followUpDate','contact','description','notes','resumeVersionId'];
 const readJob=()=>normalizeJob(Object.fromEntries(fieldNames.map(k=>[k,field(k).value])));
 const profileHome=$('background-fields').parentElement;
 const profileBefore=$('background-fields').nextSibling;
 const digitalCv=initDigitalCv({user:api.user,getProfile:api.getProfile,getDraft:api.getDraft,listVersions:api.listVersions,ready:api.profileReady,load:api.loadDigitalCv,publish:api.publishDigitalCv,unpublish:api.unpublishDigitalCv,openAccount:api.openAccount,openProfile:()=>open('profile')});
 const library=initServiceLibrary({getProfile:api.getProfile,applyProfile:api.applyProfile,showProfile:()=>{select('profile');selectProfileSection('roles');},user:api.user,saveProfile:api.saveProfile,openAccount:api.openAccount});
 function restoreProfile(){profileHome.insertBefore($('background-fields'),profileBefore);}
 function updateProfile(){const profile=api.getProfile();$('career-profile-summary').textContent=profileSummary(profile);$('career-profile-summary').hidden=!['roles','jobs','educationEntries','certifications','skillsEntries'].some(key=>profile[key]?.some(entry=>Object.values(entry).some(v=>typeof v==='string'&&v.trim())));}
 function account(){
  const registered=!!api.user()?.email;
  $('career-account-note').textContent=registered?'Your account saves are private. Choose Save when you want to keep changes.':'Guests can use the included AI kit. Create a free account to save profiles, versions, applications and edited cover letters across devices.';
  $('career-signin').hidden=registered;
 }
 function letterSource(){ const hasLetter=!!$('career-cover-letter').value.trim();$('cover-letter-editor').hidden=!hasLetter&&!careerBuildContext()?.completed;for(const id of ['career-letter-save','career-letter-pdf','career-letter-word','career-letter-text'])$(id).disabled=!hasLetter;$('cover-letter-step').textContent=hasLetter?'2 · Check and edit your letter, then download below':'1 · Create your included cover letter above'; $('career-letter-source').textContent=letterBuildId?'Letter in this editor: '+(letterRole||'General application')+(letterBuildId!==careerBuildContext()?.id?' · from another saved build':''):''; }
 function kitContext(){
  const build=careerBuildContext(),ready=!!build?.completed;
  $('career-kit-context').textContent=ready?`For this build: ${build.role || 'General resume'}${build.jobDescription?' · job announcement included':' · no announcement supplied'}`:'Open a completed build from purchase history, or finish your current review first.';
  $('cover-letter-start').hidden=ready||!!$('career-cover-letter').value.trim();if(tab==='letter')$('career-kit-controls').hidden=!ready;$('cover-letter-step').hidden=!ready&&!$('career-cover-letter').value.trim();$('career-kit-generate').disabled=busy||!ready;$('career-kit-generate').textContent=tab==='letter'?'Generate cover letter · included':'Open or create my included career kit';
  const key=build?build.id+':'+build.refinementCount:'';
  const current=kits.get(key);if(current)renderKit(current,build);
  else if(!busy){$('career-match-summary').textContent='Create your included career kit to see evidence and missing details.';$('career-matches').replaceChildren();$('career-translations').replaceChildren();$('career-kit-checks').hidden=true;}
 }
 $('letter-start-resume').onclick=()=>showAppView('home');$('letter-start-purchase').onclick=()=>api.openPurchases();
 function select(next){
  tab=next;for(const el of document.querySelectorAll('[data-career-panel]'))el.hidden=el.dataset.careerPanel!==tab;
  for(const el of document.querySelectorAll('[data-career-tab]'))el.setAttribute('aria-pressed',String(el.dataset.careerTab===tab));
  $('career-kit-controls').hidden=!['match','skills','letter'].includes(tab);$('career-kit-title').textContent=tab==='letter'?'Generate your cover letter':'Tools for your completed build';$('career-kit-details').querySelector('summary').textContent=tab==='letter'?'Create or reopen your included cover letter':'Create or reopen your included AI kit';
  $('career-storage').hidden=['library','digital-cv'].includes(tab);
  $('career-title').textContent=({'digital-cv':'My digital CV',profile:'My profile',jobs:'Applications',library:'Service library',versions:'My resumes',match:'Job match',skills:'Translate skills',letter:'Cover letter'})[tab];
  document.querySelector('.document-tools').hidden=!['match','skills','letter'].includes(tab);
  $('career-tool-help').textContent=({'digital-cv':'Choose what to share, preview it, then publish.',profile:'Your background, ready to reuse.',library:'Find codes and qualifications for every branch.',jobs:'Your job search, one application at a time.',versions:'Saved versions and your current work.',match:'See how your experience fits the job.',skills:'Civilian wording grounded in your actual service.',letter:'A cover letter for this resume and job.'})[tab]||'';
  $('career-kit-checks').hidden=!['match','skills','letter'].includes(tab)||!$('career-checks').children.length;
  if(tab==='profile'){$('career-profile-slot').append($('background-fields'));updateProfile();}
  if(tab==='library')library.open();
  if(tab==='digital-cv')digitalCv.open();
  if(['match','skills','letter'].includes(tab))kitContext();letterSource();if(tab==='letter')$('career-kit-details').open=!$('career-cover-letter').value.trim();
  showAppView(tab==='jobs'?'applications':tab);
  syncAppSummary();
 }
 function open(next='profile'){
  if($('account-dialog').open)$('account-dialog').close();
  if(!isCareerView())returnView=getAppView();
  status('');account();select(next);
  if(api.user()?.email&&['jobs','versions','letter'].includes(next))refresh().catch(e=>{if(tab===next)status(e.message);});
 }
 function close(){ $('career-dialog').hidden=true;restoreProfile();if(isCareerView())showAppView(returnView==='workspace'?'workspace':'home'); }
 $('career-close').onclick=close;
 document.addEventListener('app:view-changed',event=>{if(!isCareerView())restoreProfile();});
 $('career-results-open').onclick=()=>open('match');
 document.addEventListener('app:open-career',event=>open(event.detail));
 for(const b of document.querySelectorAll('[data-career-launch]'))b.onclick=()=>open(b.dataset.careerLaunch);
 for(const el of document.querySelectorAll('[data-career-tab]'))el.onclick=()=>open(el.dataset.careerTab);
 $('career-signin').onclick=()=>api.openAccount();
 $('background-fields').addEventListener('input',updateProfile);
 async function guarded(run,message){const version=generation;try{const result=await run();if(result!==false&&version===generation&&message)status(message);}catch(e){if(version===generation)status(e.message);}}
 $('career-profile-save').onclick=()=>guarded(()=>api.saveProfile(),'Career profile saved. Reuse it when you start your next resume.');
 $('career-profile-load').onclick=()=>guarded(async()=>{const loaded=await api.loadProfile();updateProfile();return loaded;},'Saved career profile loaded. Your editor is unchanged.');
 $('career-profile-build').onclick=()=>{close();api.buildProfile();};
 function updateVersionOptions(){
  const selected=field('resumeVersionId').value;const select=field('resumeVersionId');select.replaceChildren(new Option('Not selected',''));
  for(const item of versions)select.add(new Option(`${item.title} · ${item.createdAt?.slice(0,10)||''}`,item.id));
  if(selected&&!versions.some(v=>v.id===selected))select.add(new Option('Previously linked version (not loaded or deleted)',selected));
  select.value=selected;
 }
 function renderVersions(){
  $('career-versions-empty').hidden=versions.length>0;
  $('career-versions').replaceChildren(...versionGroups(versions).map(group=>{
   const section=node('section',null,'career-version-group');section.append(node('h4',group[0].title||'Resume'));
   for(const item of group){const row=node('article',null,'career-result');
    const type={private:'Civilian',federal:'Federal',government:'State / local'}[item.workspace?.applicationType]||'Resume';
    row.append(node('h5',item.title||'Saved resume'),node('p',`${type} · ${new Date(item.createdAt).toLocaleString()}`));
    const actions=node('div',null,'career-actions');actions.append(button('Open version',async()=>{if(await api.openVersion(item)!==false)close();}),button('Use for digital CV',async()=>{open('digital-cv');await digitalCv.useResume(savedResumeToDraft(item).resume,item.title||'Saved resume');}),button('Compare',()=>{
     $('career-current-text').value=api.getDraft().resume;$('career-version-text').value=savedResumeToDraft(item).resume;$('career-version-comparison').hidden=false;$('career-version-comparison').open=true;
    }),button('Delete',async()=>{if(!confirm('Delete this saved version? Other versions, linked purchase results and downloaded copies stay available.'))return;await api.removeVersion(item.id);await refresh();status('Saved version deleted.');}));
    row.append(actions);section.append(row);
   }return section;
  }));updateVersionOptions();
 }
 const refreshVersions=async()=>{versions=await api.listVersions();renderVersions();};
 $('career-version-save').onclick=()=>guarded(async()=>{const item=await api.saveVersion($('career-version-title').value);$('career-version-title').value=item.title;await refreshVersions();},'A new version was saved. Earlier versions remain available.');
 $('career-version-refresh').onclick=()=>guarded(refreshVersions,'Resume versions refreshed.');
 function fillJob(job={}){
  editingJob=job.id||null;const data=normalizeJob(job);updateVersionOptions();
  if(data.resumeVersionId&&!versions.some(v=>v.id===data.resumeVersionId))field('resumeVersionId').add(new Option(data.resumeVersionLabel||'Previously linked version',data.resumeVersionId));
  for(const k of fieldNames)field(k).value=data[k]||'';
  $('career-job-form-title').textContent=editingJob?'Update application':'Add an application';
 }
 function renderJobs(){
  const stage=$('career-job-filter').value,shown=jobs.filter(j=>!stage||j.status===stage);$('career-jobs-empty').hidden=shown.length>0;
  $('career-jobs-empty').textContent=jobs.length?'No applications in this stage.':'No applications saved yet. Add a job you are interested in.';
  $('career-jobs').replaceChildren(...shown.map(job=>{
   const li=node('li',null,'career-result');li.append(node('h4',job.role),node('p',`${job.company} · ${job.status}`));
   const dates=[job.appliedDate&&'Applied: '+job.appliedDate,job.interviewDate&&'Interview: '+job.interviewDate,job.followUpDate&&'Follow up: '+job.followUpDate].filter(Boolean);
   if(dates.length)li.append(node('p',dates.join(' · ')));
   if(job.resumeVersionId)li.append(node('p','Submitted resume: '+(job.resumeVersionLabel||'Saved version')));
   const actions=node('div',null,'career-actions');actions.append(button('Edit',()=>{fillJob(job);$('career-job-form').hidden=false;$('career-job-form').scrollIntoView({block:'start'});}),button('Use job for resume',()=>tailor(job)),button('Delete',async()=>{if(!confirm('Delete this application record? Saved resume versions remain.'))return;await api.removeJob(job.id);await refresh();if(editingJob===job.id)fillJob();status('Application deleted.');}));
   if(job.url){const link=node('a','Open job posting ↗');link.href=job.url;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}li.append(actions);return li;
  }));
 }
 async function refresh(){
  const version=generation,requested=tab;
  if(requested==='jobs'){const values=await Promise.all([api.listJobs(),api.listVersions()]);if(version!==generation)return;[jobs,versions]=values;renderJobs();renderVersions();}
  else if(requested==='versions'){const values=await api.listVersions();if(version!==generation)return;versions=values;renderVersions();}
  else if(requested==='letter'){const values=await api.listLetters();if(version!==generation)return;letters=values;renderLetters();}
 }
 $('career-job-cancel').onclick=()=>{$('career-job-form').hidden=true;fillJob();$('career-job-new').focus();};
 $('career-job-filter').onchange=renderJobs;$('career-job-new').onclick=()=>{fillJob();$('career-job-form').hidden=false;field('role').focus();};
 $('career-job-refresh').onclick=()=>guarded(refresh,'Applications refreshed.');
 $('career-job-form').onsubmit=async event=>{event.preventDefault();const job=readJob();const selected=versions.find(v=>v.id===job.resumeVersionId);job.resumeVersionLabel=selected?.title||jobs.find(j=>j.id===editingJob)?.resumeVersionLabel||'';
  $('career-job-save').disabled=true;await guarded(async()=>{const saved=await api.saveJob(job,editingJob||undefined);await refresh();fillJob(saved);$('career-job-form').hidden=true;},'Application saved.');$('career-job-save').disabled=false;
 };
 async function tailor(job){
  if(!job.role){status('Add the target job title first.');return;}
  if(!job.description&&!confirm('No announcement was supplied. You can tailor to the role, but requirement matching needs the announcement. Continue?'))return;
  if(await api.chooseJob(job)!==false)close();
 }
 $('career-job-tailor').onclick=()=>tailor({...readJob(),...(editingJob?{id:editingJob}:{})}).catch(e=>status(e.message));
 function renderKit(kit,build){
  $('career-kit-details').open=false;
  $('career-match-summary').textContent=kit.summary;
  $('career-matches').replaceChildren(...kit.qualifications.map(q=>{const card=node('article',null,'career-result');card.append(node('span',q.status,'career-badge'),node('h4',q.requirement));if(q.evidence)card.append(node('blockquote',q.evidence));card.append(node('p',q.nextAction));return card;}));
  if(!kit.qualifications.length)$('career-matches').append(node('p','No quoted requirements were matched. Supply a job announcement with a new targeted build for a fuller comparison.'));
  $('career-translations').replaceChildren(...kit.translations.map(t=>{const card=node('article',null,'career-result');card.append(node('h4',`${t.militaryTerm} → ${t.civilianSkill}`),node('blockquote',t.evidence),node('p',t.resumeWording));if(t.careerDirections.length)card.append(node('p','Career directions to explore: '+t.careerDirections.join(' · ')));return card;}));
  if(!kit.translations.length)$('career-translations').append(node('p','No evidence-based military translations were found in this build. Civilian experience may already use civilian wording. Add your actual releasable service duties to a future build for more specific translations.'));
  // Preserve manual edits when switching tabs. Explicitly generating/reopening a
  // different build never silently replaces unsaved letter text.
  if(!letterBuildId||letterBuildId===build.id&&!$('career-cover-letter').value){$('career-cover-letter').value=kit.coverLetter;letterBuildId=build.id;letterRole=build.role;letterRevision=build.refinementCount;}
  letterSource();$('career-checks').replaceChildren(...kit.checks.map(c=>node('li',c)));$('career-kit-checks').hidden=!kit.checks.length||!['match','skills','letter'].includes(tab);
 }
 $('career-kit-generate').onclick=async()=>{
  const build=careerBuildContext();if(!build?.completed)return;
  if(!$('career-ai-consent').checked){status('Agree to AI processing and recovery storage first.');$('career-ai-consent').focus();return;}
  if(letterBuildId&&(letterBuildId!==build.id||letterRevision!==build.refinementCount)&&$('career-cover-letter').value.trim()&&!confirm('Opening tools for this build will replace the cover letter in this tab. Save or download your edits first. Continue?'))return;
  if(letterBuildId!==build.id||letterRevision!==build.refinementCount){letterBuildId='';$('career-cover-letter').value='';}
  const version=generation;kitController=new AbortController();busy=true;kitContext();status('Preparing your included career kit. This can take a couple of minutes. No additional payment is needed.');
  try{const kit=await requestCareerKit(AbortSignal.any([kitController.signal,AbortSignal.timeout(145000)]));if(version!==generation||careerBuildContext()?.id!==build.id)return;kits.set(build.id+':'+build.refinementCount,kit);renderKit(kit,build);if(tab==='letter'){$('career-kit-details').open=false;$('cover-letter-step').scrollIntoView({block:'start'});$('career-cover-letter').focus({preventScroll:true});}status('Your career kit is ready. Check every fact before applying.');}
  catch(e){if(version===generation)status(e.name==='TimeoutError'?'The career kit is taking longer than expected. Reopen this purchase and retry the same kit; do not pay again.':e.message);}
  finally{if(version===generation){busy=false;kitContext();}}
 };
 $('career-kit-recover').onclick=()=>{close();api.openPurchases();};
 $('career-return-review').onclick=()=>{close();api.returnReview();};
 async function downloadLetter(format){const blob=await exportLetter($('career-cover-letter').value,format);const a=node('a');a.href=URL.createObjectURL(blob);a.download='veteran-career-path-cover-letter.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status('Cover letter downloaded.');}
 for(const [id,format]of [['career-letter-pdf','pdf'],['career-letter-word','docx'],['career-letter-text','txt']])$(id).onclick=()=>guarded(()=>downloadLetter(format));
 function renderLetters(){
  $('career-letters').replaceChildren(...letters.map(letter=>{const li=node('li',null,'career-result');li.append(node('strong',letter.title||'Cover letter'));const actions=node('div',null,'career-actions');actions.append(button('Open',()=>{if($('career-cover-letter').value.trim()&&!confirm('Replace the current cover letter? Save or download any unsaved edits first.'))return;$('career-cover-letter').value=letter.content;letterBuildId=letter.buildId;letterRole=letter.title;letterRevision=-1;letterSource();}),button('Delete',async()=>{if(!confirm('Delete this saved cover letter? The original career kit and downloaded copies remain.'))return;await api.removeLetter(letter.id);await refresh();status('Saved cover letter deleted.');}));li.append(actions);return li;}));
 }
 $('career-cover-letter').addEventListener('input',letterSource);
 $('career-letter-save').onclick=()=>guarded(async()=>{if(!letterBuildId)throw new Error('Open a completed build and create its career kit first.');await api.saveLetter(letterBuildId,$('career-cover-letter').value,letterRole?letterRole+' · cover letter':'Cover letter');await refresh();},'Your edited cover letter is saved to your account.');
 document.addEventListener('resume:payment-changed',()=>{if(!$('career-dialog').hidden&&['match','skills','letter'].includes(tab))kitContext();});
 fillJob();
 return {open,accountChanged(){account();if(tab==='digital-cv'&&isCareerView())digitalCv.open();if(api.user()?.email&&isCareerView()&&['jobs','versions','letter'].includes(tab))refresh().catch(e=>status(e.message));},reset(){digitalCv.reset();library.reset();generation++;kitController?.abort();busy=false;jobs=[];versions=[];letters=[];kits.clear();editingJob=null;letterBuildId='';letterRole='';letterRevision=-1;$('career-cover-letter').value='';$('career-current-text').value='';$('career-version-text').value='';$('career-version-comparison').hidden=true;$('career-version-title').value='';$('career-storage-consent').checked=false;$('career-ai-consent').checked=false;$('career-checks').replaceChildren();$('career-kit-checks').hidden=true;$('career-matches').replaceChildren();$('career-translations').replaceChildren();$('career-match-summary').textContent='';letterSource();status('');fillJob();$('career-job-form').hidden=true;renderJobs();renderVersions();renderLetters();if(!$('career-dialog').hidden)close();}};
}
