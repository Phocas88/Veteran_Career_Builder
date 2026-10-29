import {initCareerExplorer} from './career-explorer.js?v=20261028-guided';
import {initApplicationImport} from './application-import.js?v=20261026-career-tools';
import {designs} from './resume-designs.js?v=20261027-resume-studio';
import {initDigitalCv} from './digital-cv.js?v=20261028-guided';
import {selectProfileSection} from './background-form.js?v=20261026-career-tools';
import { normalizeJob, jobStatuses, versionGroups, profileSummary } from './career-model.js?v=20261025-standalone-app';
import { savedResumeToDraft } from './cloud-store.js?v=20261028-guided';
import { careerBuildContext, requestCareerKit } from './payments.js?v=20261028-guided';
import {initCoverLetters} from './cover-letters.js?v=20261029-letters';
import {initServiceLibrary} from './service-library.js?v=20261026-career-tools';
import {showAppView,getAppView,isCareerView,syncAppSummary} from './app-shell.js?v=20261028-guided';

const $=id=>document.getElementById(id);
const node=(tag,content,className)=>{const el=document.createElement(tag);if(content)el.textContent=content;if(className)el.className=className;return el;};
const button=(label,run)=>{const b=node('button',label,'text-button');b.type='button';b.addEventListener('click',()=>Promise.resolve().then(run).catch(e=>status(e.message)));return b;};
const status=message=>{$('career-status').textContent=message;if(message)document.dispatchEvent(new CustomEvent('app:notice',{detail:message}));};
export function initCareerTools(api){
 let tab='profile',generation=0,jobs=[],versions=[],editingJob=null,kitController,busy=false;
 let jobCursor=null,moreJobs=false;const kits=new Map();

 const applicationImport=initApplicationImport({user:api.user,signIn:api.openAccount,list:()=>api.listJobs({all:true}),save:api.saveJob,refresh,review(job){fillJob(job);$('career-job-form').hidden=false;$('career-job-form').scrollIntoView({block:'start',behavior:'instant'});field('role').focus({preventScroll:true});status('Suggested fields are ready. Check them, fill any blanks, then Save application.');}});
 let returnView='home';
 const field=name=>$('career-job-form').elements.namedItem(name);
 const fieldNames=['role','company','url','applicationType','status','appliedDate','interviewDate','followUpDate','contact','description','notes','resumeVersionId'];
 const readJob=()=>normalizeJob(Object.fromEntries(fieldNames.map(k=>[k,field(k).value])));
 const profileHome=$('background-fields').parentElement;
 const profileBefore=$('background-fields').nextSibling;
 const digitalCv=initDigitalCv({user:api.user,getProfile:api.getProfile,getDraft:api.getDraft,listVersions:api.listVersions,resolveVersion:api.resolveVersion,ready:api.profileReady,load:api.loadDigitalCv,publish:api.publishDigitalCv,unpublish:api.unpublishDigitalCv,openAccount:api.openAccount,openProfile:()=>open('profile')});
 const careerExplorer=initCareerExplorer(api);
 const coverLetters=initCoverLetters(api);
 const library=initServiceLibrary({getProfile:api.getProfile,applyProfile:api.applyProfile,showProfile:()=>{select('profile');selectProfileSection('roles');},user:api.user,saveProfile:api.saveProfile,openAccount:api.openAccount});
 function restoreProfile(){profileHome.insertBefore($('background-fields'),profileBefore);}
 function updateProfile(){const profile=api.getProfile();$('career-profile-summary').textContent=profileSummary(profile);$('career-profile-summary').hidden=!['roles','jobs','educationEntries','certifications','skillsEntries'].some(key=>profile[key]?.some(entry=>Object.values(entry).some(v=>typeof v==='string'&&v.trim())));}
 function account(){
  const registered=!!api.user()?.email;
  $('career-account-note').textContent=registered?'Your account saves are private. Choose Save when you want to keep changes.':'Guests can use the included AI kit. Create a free account to save profiles, versions, applications and edited cover letters across devices.';
  $('career-signin').hidden=registered;
 }
 function kitContext(){
  const build=careerBuildContext(),ready=!!build?.completed;
  $('career-kit-context').textContent=ready?`Resume: ${build.role||'General application'}`:'Choose a completed resume to begin.';
  $('career-kit-generate').disabled=busy||!ready;
  const key=build?build.id+':'+build.refinementCount:'';
  const current=kits.get(key);if(current)renderKit(current,build);
  else if(!busy){$('career-match-summary').textContent='Create your included career kit to see evidence and missing details.';$('career-matches').replaceChildren();$('career-translations').replaceChildren();$('career-kit-checks').hidden=true;}
 }
 function select(next){
  tab=next;for(const el of document.querySelectorAll('[data-career-panel]'))el.hidden=el.dataset.careerPanel!==tab;
  for(const el of document.querySelectorAll('[data-career-tab]'))el.setAttribute('aria-pressed',String(el.dataset.careerTab===tab));
  $('career-kit-controls').hidden=!['match','skills'].includes(tab);
  $('career-storage').hidden=['library','digital-cv','careers','letter'].includes(tab);
  $('career-title').textContent=({careers:'Career explorer','digital-cv':'Virtual CV',profile:'My profile',jobs:'Applications',library:'Service library',versions:'My resumes',match:'Job match',skills:'Translate skills',letter:'Cover letters'})[tab];
  document.querySelector('.document-tools').hidden=!['match','skills'].includes(tab);
  $('career-tool-help').textContent=({careers:'Explore your experience, your interests, and your next step.','digital-cv':'Choose what to share, preview it, then publish.',profile:'Your background, ready to reuse.',library:'Find codes and qualifications for every branch.',jobs:'Your job search, one application at a time.',versions:'Your purchased resumes, ready to open and download.',match:'See how your experience fits the job.',skills:'Civilian wording grounded in your actual service.',letter:'Optional. Create a matching letter when you need one.'})[tab]||'';
  $('career-kit-checks').hidden=!['match','skills'].includes(tab)||!$('career-checks').children.length;
  if(tab==='profile'){$('career-profile-slot').append($('background-fields'));updateProfile();}
  if(tab==='careers')careerExplorer.open();
  if(tab==='library')library.open();
  if(tab==='digital-cv')digitalCv.open();
  if(['match','skills'].includes(tab))kitContext();
  if(tab==='letter')coverLetters.open();
  showAppView(tab==='jobs'?'applications':tab);
  syncAppSummary();
 }
 function open(next='profile'){
  if($('account-dialog').open)$('account-dialog').close();
  if(!isCareerView())returnView=getAppView();
  status('');account();select(next);
  if(api.user()?.email&&['jobs','versions'].includes(next))refresh().catch(e=>{if(tab===next)status(e.message);});
 }
 function close(){ $('career-dialog').hidden=true;restoreProfile();if(isCareerView())showAppView(returnView==='workspace'?'workspace':'home'); }
 $('career-close').onclick=close;
 document.addEventListener('app:view-changed',event=>{if(!isCareerView())restoreProfile();});
 $('finished-cv').onclick=()=>{open('digital-cv');digitalCv.useResume(api.getDraft().resume,'Finished resume in editor').catch(error=>status(error.message));};
 $('career-results-open').onclick=()=>open('match');
 document.addEventListener('app:open-career',event=>open(event.detail));
 document.addEventListener('app:cv-from-profile',()=>{open('digital-cv');digitalCv.useProfile().catch(error=>status(error.message));});
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
   const section=node('section',null,'career-version-group');
   for(const item of group){const row=node('article',null,'career-result');
    const type={private:'Civilian',federal:'Federal',government:'State / local'}[item.workspace?.applicationType]||'Resume';
    row.dataset.resumeState=item.finished?'finished':item.stage||'draft';row.append(node('span',item.finished?'Ready to download':item.stage==='review'?'Review ready':'Draft in progress','resume-state'),node('h3',item.finished?(item.title==='My resume'?'My resume':item.title||'My resume'):(item.title||'Resume build')),node('p',`${item.finished?designs[item.design||item.workspace?.design]?.name+' template · ':''}${type} · ${new Date(item.createdAt).toLocaleDateString()}`));
    const actions=node('div',null,'career-actions');
    if(item.finished){const download=button('Download PDF',async()=>{await api.downloadVersion(item);});download.className='button button-primary';actions.append(download);}
    actions.append(button(item.finished?'Open finished resume':item.stage==='review'?'Continue to design':'Continue editing',async()=>{await api.openVersion(item);}));if(item.finished||item.workspace?.resume)actions.append(button('Update digital CV',async()=>{const owner=api.user()?.uid;const draft=await api.resolveVersion(item);if(owner!==api.user()?.uid)return;open('digital-cv');await digitalCv.useResume(draft.resume,item.title||'Saved resume');}));
    actions.append(button('Assess careers',async()=>{open('careers');await careerExplorer.useSource(item);}));
    const more=node('details',null,'resume-more'),summary=node('summary','More options');more.append(summary);
    if(!item.purchased||item.content)more.append(button('Compare text',()=>{$('career-current-text').value=api.getDraft().resume;$('career-version-text').value=savedResumeToDraft(item).resume;$('career-version-comparison').hidden=false;$('career-version-comparison').open=true;}));
    if(item.purchased)more.append(button('Purchase & recovery details',()=>api.openPurchases()));
    const remove=button('Delete resume',async()=>{
     const note=item.finished&&(item.buildId||item.workspace?.buildId)?'Delete this saved template and its career matches? Other templates, the submitted resume, and the payment receipt remain in purchase history. Your profile and Virtual CV are unchanged.':item.purchased?'Delete this resume build, its submitted text, review, and saved copies? The payment receipt is kept; this does not issue a refund. Your profile and Virtual CV are unchanged.':'Delete this saved resume and its career matches? Your profile, Virtual CV, and other saved documents are unchanged.';
     if(!confirm(note))return;const owner=api.user()?.uid;remove.disabled=true;remove.textContent='Deleting…';
     try{await api.removeVersion(item);if(owner!==api.user()?.uid)return;await refresh();status('Resume deleted from My resumes.');}
     finally{remove.disabled=false;remove.textContent='Delete resume';}
    });remove.classList.add('resume-delete');actions.append(remove);
    row.append(actions,more);section.append(row);
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
  $('career-job-more').hidden=!moreJobs;$('career-job-count').textContent=jobs.length?jobs.length+' applications loaded'+(moreJobs?' · Load older applications to include earlier records.':''):'';
  const stage=$('career-job-filter').value,shown=jobs.filter(j=>!stage||j.status===stage);$('career-jobs-empty').hidden=shown.length>0;
  $('career-jobs-empty').textContent=jobs.length?'No applications in this stage.':'No applications saved yet. Add a job you are interested in.';
  $('career-jobs').replaceChildren(...shown.map(job=>{
   const li=node('li',null,'career-result');li.append(node('h4',job.role),node('p',`${job.company} · ${job.status}`));
   const dates=[job.appliedDate&&'Applied: '+job.appliedDate,job.interviewDate&&'Interview: '+job.interviewDate,job.followUpDate&&'Follow up: '+job.followUpDate].filter(Boolean);
   if(dates.length)li.append(node('p',dates.join(' · ')));
   if(job.resumeVersionId)li.append(node('p','Submitted resume: '+(job.resumeVersionLabel||'Saved version')));
   const actions=node('div',null,'career-actions');actions.append(button('Edit',()=>{fillJob(job);$('career-job-form').hidden=false;$('career-job-form').scrollIntoView({block:'start'});}),button('Copy as new',()=>{fillJob({...job,id:undefined,status:'Saved',appliedDate:'',interviewDate:'',followUpDate:'',notes:''});$('career-job-form').hidden=false;$('career-job-form').scrollIntoView({block:'start'});field('company').focus({preventScroll:true});}),button('Use job for resume',()=>tailor(job)),button('Delete',async()=>{if(!confirm('Delete this application record? Saved resume versions remain.'))return;await api.removeJob(job.id);await refresh();if(editingJob===job.id)fillJob();status('Application deleted.');}));
   if(job.url){const link=node('a','Open job posting ↗');link.href=job.url;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}li.append(actions);return li;
  }));
 }
 async function refresh(){
  const version=generation,requested=tab;
  if(requested==='jobs'){const values=await Promise.all([api.listJobs(),api.listVersions()]);if(version!==generation)return;[jobs,versions]=values;jobCursor=jobs.cursor;moreJobs=!!jobs.hasMore;renderJobs();renderVersions();}
  else if(requested==='versions'){const values=await api.listVersions();if(version!==generation)return;versions=values;renderVersions();}
 }
 $('career-job-cancel').onclick=()=>{$('career-job-form').hidden=true;fillJob();$('career-job-new').focus();};
 $('career-job-more').onclick=async()=>{const version=generation,cursor=jobCursor;$('career-job-more').disabled=true;try{const page=await api.listJobs({after:cursor});if(version!==generation)return;const ids=new Set(jobs.map(j=>j.id));jobs.push(...page.filter(j=>!ids.has(j.id)));jobCursor=page.cursor;moreJobs=!!page.hasMore;renderJobs();}catch(error){if(version===generation)status(error.message);}finally{if(version===generation)$('career-job-more').disabled=false;}};
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
  $('career-checks').replaceChildren(...kit.checks.map(c=>node('li',c)));$('career-kit-checks').hidden=!kit.checks.length||!['match','skills'].includes(tab);
 }
 $('career-kit-generate').onclick=async()=>{
  const build=careerBuildContext();if(!build?.completed)return;
  if(!$('career-ai-consent').checked){status('Agree to AI processing and recovery storage first.');$('career-ai-consent').focus();return;}
  const version=generation;kitController=new AbortController();busy=true;kitContext();status('Preparing your included career kit. This can take a couple of minutes. No additional payment is needed.');
  try{const kit=await requestCareerKit(AbortSignal.any([kitController.signal,AbortSignal.timeout(145000)]));if(version!==generation||careerBuildContext()?.id!==build.id)return;kits.set(build.id+':'+build.refinementCount,kit);renderKit(kit,build);status('Your career kit is ready. Check every fact before applying.');}
  catch(e){if(version===generation)status(e.name==='TimeoutError'?'The career kit is taking longer than expected. Reopen this purchase and retry the same kit; do not pay again.':e.message);}
  finally{if(version===generation){busy=false;kitContext();}}
 };
 $('career-kit-recover').onclick=()=>{close();api.openPurchases();};
 $('career-return-review').onclick=()=>{close();api.returnReview();};
 document.addEventListener('resume:payment-changed',()=>{if(!$('career-dialog').hidden&&['match','skills'].includes(tab))kitContext();});
 fillJob();
 return {open,accountChanged(){account();careerExplorer.accountChanged();coverLetters.accountChanged();if(tab==='digital-cv'&&isCareerView())digitalCv.open();if(api.user()?.email&&isCareerView()&&['jobs','versions'].includes(tab))refresh().catch(e=>status(e.message));},reset(){coverLetters.reset();careerExplorer.reset();applicationImport.reset();digitalCv.reset();library.reset();generation++;kitController?.abort();busy=false;jobs=[];jobCursor=null;moreJobs=false;versions=[];kits.clear();editingJob=null;$('career-current-text').value='';$('career-version-text').value='';$('career-version-comparison').hidden=true;$('career-version-title').value='';$('career-storage-consent').checked=false;$('career-ai-consent').checked=false;$('career-checks').replaceChildren();$('career-kit-checks').hidden=true;$('career-matches').replaceChildren();$('career-translations').replaceChildren();$('career-match-summary').textContent='';status('');fillJob();$('career-job-form').hidden=true;renderJobs();renderVersions();if(!$('career-dialog').hidden)close();}};
}
