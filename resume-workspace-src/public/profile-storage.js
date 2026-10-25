// Profile reads and writes share one owner boundary. A delayed load must never
// replace edits made while it was pending, or populate a different account.
export function createProfileStorage(api){
 let owner='',generation=0,loading=null,loaded=false,saving=false,pending=false,loadFailed=false;
 const registered=()=>!!api.user()?.email;
 const emit=(kind,text,busy=false)=>api.status({kind,text,busy,retry:loadFailed});
 function dirty(){emit('unsaved',registered()?'Unsaved changes · choose Save profile to keep them.':'Guest profile · create an account to save across visits.');}
 async function load(replace=false){
  if(!registered()){emit('guest','Create a free account to save your profile.');return false;}
  if(replace&&api.isDirty()&&!api.confirm('Replace your unsaved profile with the saved profile?'))return false;
  const token=generation,uid=api.user().uid,before=JSON.stringify(api.read());
  emit('loading','Loading your saved profile…',true);
  try{
   const data=await(await api.store()).profile();
   if(token!==generation||api.user()?.uid!==uid)return false;
   loaded=true;loadFailed=false;
   const changed=JSON.stringify(api.read())!==before;
   if((api.isDirty()&&!replace)||changed){pending=!!data.resumeWorkspaceProfile;dirty();return false;}
   pending=false;
   if(data.resumeWorkspaceProfile){api.fill(data);api.loaded(data);emit('saved','Saved profile restored from your account.');}
   else emit('ready','No saved profile yet · add your details, then choose Save profile.');
   return true;
  }catch{
   if(token===generation){loadFailed=true;emit('load-error','Your saved profile could not load. Your current entries are safe. Try loading again before saving over an existing profile.');}
   return false;
  }
 }
 function accountChanged(){
  const user=api.user(),key=(user?.uid||'')+':'+!!user?.email;if(key===owner)return loading;
  owner=key;generation++;loaded=false;saving=false;pending=false;loadFailed=false;
  if(!registered()){loading=null;emit('guest','Guest profile · create a free account to save across visits.');return;}
  loading=load();return loading;
 }
 async function save(profile,setup){
  if(!registered()){api.openAccount();return false;}
  const token=generation,uid=api.user().uid;await loading;
  if(token!==generation||api.user()?.uid!==uid)return false;
  if(!loaded)throw new Error('Load your saved profile first using Try loading again. Your current entries are unchanged.');
  if(saving)return false;
  if(pending&&!api.confirm('A saved profile was found while you were editing. Replace that saved copy with the details currently shown here?'))return false;
  const snapshot=profile||api.read();saving=true;emit('saving','Saving your profile to your account…',true);
  try{
   await(await api.store()).saveProfile(snapshot,setup);
   if(token!==generation||api.user()?.uid!==uid)return false;
   pending=false;
   if(JSON.stringify(snapshot)===JSON.stringify(api.read())){api.clean();emit('saved','Profile saved to your account · '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));}
   else dirty();
   return true;
  }catch(error){if(token===generation)emit('save-error','Profile not saved. Your entries are still here. Check your connection and try Save profile again.');throw error;}
  finally{if(token===generation)saving=false;}
 }
 return{accountChanged,save,dirty,reload(){loading=load(!loadFailed);return loading;},reset(){owner='';generation++;loading=null;loaded=false;saving=false;pending=false;loadFailed=false;}};
}
