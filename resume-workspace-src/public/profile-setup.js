import {profileSteps,normalizeProfileSetup} from './profile-steps.js?v=20261026-profile-setup';
import {selectProfileSection,getProfileSection} from './background-form.js?v=20261029-clear-flow';
const $=id=>document.getElementById(id);
const notice=message=>document.dispatchEvent(new CustomEvent('app:notice',{detail:message}));
export function initProfileSetup(api){
 let state=null,running=false,needsRestore=false,savedProfile=null,owner='',generation=0,busy=false,lastSaved=false;
 const selected=()=>profileSteps.find(step=>step.key===getProfileSection())||profileSteps[0];
 const canSave=()=>!!api.user()?.email&&$('profile-setup-cloud').checked;
 function snapshot(){return state?normalizeProfileSetup({...state,section:running?selected().key:state.section}):null;}
 function render(){
  const step=running?selected():profileSteps.find(s=>s.key===state?.section)||profileSteps[0],index=profileSteps.indexOf(step);
  document.body.classList.toggle('profile-setup-active',running);
  $('profile-setup-panel').hidden=!running;$('profile-setup-controls').hidden=!running;
  $('profile-setup-offer').hidden=running;$('profile-setup-offer-button').textContent=state&&state.status!=='complete'?'Continue profile setup →':'Guide me through my profile →';
  $('profile-setup-finished').hidden=state?.status!=='complete';
  $('profile-setup-progress').textContent=`Step ${index+1} of ${profileSteps.length} · ${step.title}`;
  $('profile-setup-meter').value=index+1;$('profile-setup-meter').max=profileSteps.length;
  $('profile-setup-question').textContent=step.question;$('profile-setup-hint').textContent=step.hint;
  $('profile-setup-tips').replaceChildren(...step.tips.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
  $('profile-setup-tip-details').open=false;
  $('profile-setup-cloud-row').hidden=!api.user()?.email;
  $('profile-setup-save-note').textContent=canSave()?'Next, Skip and Finish later save your profile and setup progress to your private app account.':'Changes stay in this tab until you choose to save them. Skipping keeps any details you have entered.';
  $('profile-setup-next').textContent=canSave()?(index===profileSteps.length-1?'Save & finish setup':'Save & next →'):(index===profileSteps.length-1?'Finish setup':'Next →');
  $('profile-setup-next').setAttribute('aria-label',index===profileSteps.length-1?'Finish profile setup':'Next: '+profileSteps[index+1].title);
  for(const id of ['profile-setup-next','profile-setup-skip','profile-setup-later','profile-setup-back'])$(id).disabled=busy||(id==='profile-setup-back'&&index===0);
  const pending=!!state&&state.status!=='complete';$('home-profile-setup').hidden=!pending;
  $('home-profile-setup-note').textContent=`Step ${index+1} of ${profileSteps.length} · ${lastSaved?'Saved to your account':'Changes in this tab only'}`;
 }
 function focusPrompt(){ $('profile-setup-panel').scrollIntoView({block:'start',behavior:'instant'});$('profile-setup-question').focus({preventScroll:true}); }
 function activate(){running=true;state.status='active';api.openProfile();selectProfileSection(state.section);render();focusPrompt();}
 function start(){generation++;state={version:1,status:'active',section:'personal',skipped:[]};needsRestore=false;lastSaved=false;$('profile-setup-status').textContent='';activate();}
 function resume(){
  if(!state||state.status==='complete'){start();return;}
  if(needsRestore){if(api.isDirty()&&!confirm('Load your saved setup? This replaces unsaved profile fields in this tab.'))return;api.fillProfile(savedProfile);needsRestore=false;}
  activate();
 }
 async function advance(kind){
  if(!running||busy)return;
  const step=selected(),index=profileSteps.indexOf(step),token=generation,uid=api.user()?.uid;
  const skipped=state.skipped.filter(key=>key!==step.key);if(kind==='skip')skipped.push(step.key);
  const candidate=normalizeProfileSetup({...state,skipped,status:kind==='later'?'paused':index===profileSteps.length-1?'complete':'active',section:kind==='later'?step.key:profileSteps[Math.min(index+1,profileSteps.length-1)].key});
  busy=true;$('profile-setup-status').textContent='';render();
  try{
   let wrote=false;
   if(canSave()){
    $('profile-setup-status').textContent='Saving your profile…';
    const profile=api.getProfile();await api.save(profile,candidate);
    if(token!==generation||api.user()?.uid!==uid)return;
    if(JSON.stringify(profile)===JSON.stringify(api.getProfile()))api.markClean();
    wrote=true;
   }
   if(token!==generation||api.user()?.uid!==uid)return;
   state=candidate;lastSaved=wrote;needsRestore=false;$('profile-setup-status').textContent=wrote?'Profile and setup progress saved.':'Your changes are in this tab only.';
   if(candidate.status==='paused'){running=false;api.goHome();notice(wrote?'Profile saved. Continue setup from Home whenever you are ready.':'Setup paused in this tab. Save your profile before closing the tab to keep your changes.');}
   else if(candidate.status==='complete'){running=false;notice(wrote?'Profile setup finished and saved. You can update any section anytime.':'Setup finished. Save your profile to keep it for a future visit.');$('profile-setup-finished').hidden=false;$('profile-setup-finished').scrollIntoView({block:'start'});}
   else selectProfileSection(candidate.section);
  }catch{
   if(token===generation)$('profile-setup-status').textContent='Your profile could not be saved. Your entries are still here. Try again, or turn off account saving to continue in this tab.';
  }finally{if(token===generation){busy=false;render();if(running)focusPrompt();}}
 }
 function reset(){generation++;state=null;running=false;needsRestore=false;savedProfile=null;busy=false;lastSaved=false;$('profile-setup-cloud').checked=false;$('profile-setup-status').textContent='';render();}
 async function accountChanged(){
  const next=api.user(),key=next?.uid||'';if(key===owner){render();return;}owner=key;reset();
  if(!next?.email)return;
  const token=generation;
  try{const data=await api.load();if(token!==generation||api.user()?.uid!==key)return;loaded(data);}catch{/* A profile load failure must never prevent account setup or editing. */}
 }
 function loaded(data){const saved=normalizeProfileSetup(data?.profileSetup);if(!saved)return;state=saved;savedProfile=data.resumeWorkspaceProfile||{};needsRestore=true;lastSaved=true;running=false;render();}
 $('profile-setup-offer-button').onclick=resume;$('home-profile-setup-continue').onclick=resume;
 $('profile-setup-next').onclick=()=>advance('next');$('profile-setup-skip').onclick=()=>advance('skip');$('profile-setup-later').onclick=()=>advance('later');
 $('profile-setup-back').onclick=()=>{const index=profileSteps.indexOf(selected());if(index>0){state.section=profileSteps[index-1].key;selectProfileSection(state.section);render();focusPrompt();}};
 $('profile-setup-cloud').onchange=()=>{$('career-storage-consent').checked=$('profile-setup-cloud').checked;render();};
 $('career-storage-consent').addEventListener('change',()=>{if(!$('career-storage-consent').checked)$('profile-setup-cloud').checked=false;render();});
 $('profile-setup-done').onclick=api.goHome;
 $('profile-setup-build').onclick=()=>api.useProfile();
 document.addEventListener('profile:section-changed',()=>{if(running){if(state.section!==selected().key)lastSaved=false;state.section=selected().key;render();focusPrompt();}});
 $('background-fields').addEventListener('input',()=>{lastSaved=false;});
 document.addEventListener('profile:rendered',()=>{if(running)selectProfileSection(state.section);render();});
 document.addEventListener('app:view-changed',render);
 render();return {newAccount:start,accountChanged,reset,snapshot,loaded};
}
