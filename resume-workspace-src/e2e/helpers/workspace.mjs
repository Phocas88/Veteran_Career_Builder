// Rendering regressions use an account that already owns every design. Payment tests
// pass templateEntitlements:[] to exercise a fresh one-template purchase.
const allTemplates='classic modern compact federal executive minimal heritage technical scholar horizon atlas signal patriot leadership consultant civic folio graduate industrial contemporary manager creative federal-concise federal-experience'.split(' ');
export function paidResponse(body,id='a'.repeat(64),templates=allTemplates){
 const entitlements={templates:[...templates],includedTemplate:templates[0]||null};
 if(body.action==='template-finish')return {...entitlements,document:{...body.document,buildId:body.buildId}};
 if(body.action==='purchase')return {...entitlements,id,status:'paid',prepaid:true,entryMode:body.entryMode,requestId:body.requestId,input:null};
 if(body.action==='verify')return {...entitlements,id:body.buildId,status:'paid',prepaid:true};
 // Match the server's validateInput: resume text is preserved; optional text is trimmed.
 if(body.action==='bind')return {...entitlements,id:body.buildId,status:'paid',prepaid:true,input:{...body.input,role:(body.input.role||'').trim(),jobDescription:(body.input.jobDescription||'').trim(),applicationType:body.input.applicationType??'private',additionalDetails:(body.input.additionalDetails||'').trim()}};
 return null;
}
export async function unlockEntry(page){
 if(await page.locator('#flow-payment').isVisible()){await page.locator('#upfront-consent').check();await page.locator('#purchase-start').click();}
}
export async function installAccount(page,kind='none',options={}) {
 await page.addInitScript(({kind,uid,records})=>{
  let docSequence=0;const listeners=[];window.__oauthCalls=[];window.__persistence=[];window.__googleResult={uid:'google-new',email:'google@example.com',isNewUser:true};window.__googleFailure=null;window.__writes=[];window.__deleted=[];window.__records=records||{};
  const makeUser=(uid,email,providerData=[])=>({uid,email,providerData,getIdToken:async()=> 'firebase-'+uid,async linkWithPopup(provider){window.__oauthCalls.push({action:'link',uid:this.uid,parameters:provider.parameters});if(window.__googleFailure)throw Object.assign(new Error('Fixture provider failure'),{code:window.__googleFailure,email:'google@example.com'});this.email=window.__googleResult.email;this.providerData=[{providerId:'google.com'}];window.__switchAuth(this);return {user:this,additionalUserInfo:{isNewUser:false}};},async linkWithCredential(credential){this.email=credential.email;window.__switchAuth(this);return {user:this};}});
  const auth={currentUser:kind==='registered'?makeUser(uid||'veteran-a','alex@example.com'):kind==='guest'?makeUser('resumeGuest_fixture',null):null,
   onAuthStateChanged(fn){listeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));},async setPersistence(value){window.__persistence.push(value);},async signInWithPopup(provider){window.__oauthCalls.push({action:'signin',parameters:provider.parameters});if(window.__googleFailure)throw Object.assign(new Error('Fixture provider failure'),{code:window.__googleFailure,email:'google@example.com'});const next=window.__googleResult;window.__switchAuth(makeUser(next.uid,next.email,[{providerId:'google.com'}]));return {user:auth.currentUser,additionalUserInfo:{isNewUser:next.isNewUser}};},async signOut(){window.__switchAuth(null);},
   async signInWithCustomToken(token){if(token!=='fixture-custom-token')throw new Error('Unexpected custom token');window.__switchAuth(makeUser('resumeGuest_fixture',null));return {user:auth.currentUser};},
   async createUserWithEmailAndPassword(email){window.__switchAuth(makeUser('registered-new',email));return {user:auth.currentUser};},
   async signInWithEmailAndPassword(email){window.__switchAuth(makeUser('veteran-a',email));return {user:auth.currentUser};}
  };
  window.__switchAuth=value=>{auth.currentUser=typeof value==='string'?makeUser(value,value+'@example.com'):value;listeners.forEach(fn=>fn(auth.currentUser));};
  function ref(path){return {path,id:path.split('/').at(-1),collection:name=>ref(path+'/'+name),doc:(id=(++docSequence===1?'saved-new':'saved-new-'+docSequence))=>ref(path+'/'+id),orderBy(key,direction){this.__order=[key,direction];return this;},limit(n){this.__limit=n;return this;},startAfter(cursor){this.__after=cursor.id;return this;},
   async set(data,options){if(window.__failFinishedSave&&path.includes('/resumeProgramResumes/'))throw new Error('Fixture library save failure');if(window.__failProfileSave&&path.endsWith('/resumeProgram/background'))throw new Error('Fixture save failure');window.__writes.push({path,data,options});window.__records[path]=options?.merge?{...window.__records[path],...data}:data;},async delete(){window.__deleted.push(path);delete window.__records[path];},
   async get(){if(path.startsWith('publicProfiles/')){window.__cvReads=(window.__cvReads||0)+1;if(window.__cvReadDelayMs)await new Promise(r=>setTimeout(r,window.__cvReadDelayMs));}if(path.endsWith('/resumeProgram/background')){if(window.__profileLoadDelayMs)await new Promise(r=>setTimeout(r,window.__profileLoadDelayMs));if(window.__failProfileLoad)throw new Error('Fixture profile read failure');}if(/\/(resumeProgramResumes|resumeProgramJobs|resumeProgramLetters)$/.test(path)){let docs=Object.entries(window.__records).filter(([key])=>key.startsWith(path+'/')).map(([key,data])=>({id:key.split('/').at(-1),data:()=>data}));if(path.endsWith('/resumeProgramJobs')){docs.sort((a,b)=>String(b.data().updatedAt||'').localeCompare(String(a.data().updatedAt||''))||a.id.localeCompare(b.id));if(this.__after)docs=docs.slice(docs.findIndex(d=>d.id===this.__after)+1);if(this.__limit)docs=docs.slice(0,this.__limit);}return {docs};}if(path in window.__records)return {exists:true,data:()=>window.__records[path]};return {exists:false,data:()=>undefined};}
  };}
  const firebaseAuth=()=>auth;firebaseAuth.GoogleAuthProvider=class{setCustomParameters(value){this.parameters=value;}};firebaseAuth.Auth={Persistence:{LOCAL:'local',SESSION:'session'}};firebaseAuth.EmailAuthProvider={credential:(email,password)=>({email,password})};
  const db={collection:name=>ref(name)};window.firebase={apps:[{name:'vcp-resume-program',auth:()=>auth,firestore:()=>db}],auth:firebaseAuth,firestore:()=>db};
 },{kind,...options});
 let owned=[...(options.templateEntitlements??allTemplates)],included=owned[0]||null;
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();
  if(body.action==='template-finish'){
   if(!included||owned.includes(body.document.design)){included ||= body.document.design;owned=[...new Set([...owned,body.document.design])];return route.fulfill({json:{templates:owned,includedTemplate:included,document:{...body.document,buildId:body.buildId}}});}
   return route.fulfill({json:{url:'https://checkout.stripe.com/c/pay/fixture-template'}});
  }
  return route.fulfill({json:body.action==='guest'?{token:'fixture-custom-token'}:paidResponse(body,undefined,owned)||{builds:[]}});
 });
}
export async function start(page,path='edit') {
 await page.goto('/');
 if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();
 await page.locator(path==='build'?'#choose-build':'#choose-import').click();
 await unlockEntry(page);
 if(path!=='build')await page.locator('#resume-paste-mode').click();
 else await page.locator('#background-fields > details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
}
export async function checkout(page) {
 await page.locator('#next-job').click();await page.locator('#next-checkout').click();
}
export async function agreements(page) {await page.locator('#ai-consent').check();await page.locator('#purchase-consent').check();}
export async function expandBackground(page){await page.locator('#background-builder .builder-group').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));}

export async function selectProfileSection(page,section){await page.locator('[data-profile-section]').selectOption(section);}
export async function agreeCloudSaving(page){await page.locator('#career-storage').evaluate(n=>n.open=true);await page.locator('#career-storage-consent').check();}
