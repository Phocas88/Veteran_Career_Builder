export async function installAccount(page,kind='none') {
 await page.addInitScript(({kind})=>{
  const listeners=[];window.__writes=[];window.__deleted=[];window.__records={};
  const makeUser=(uid,email)=>({uid,email,getIdToken:async()=> 'firebase-'+uid,async linkWithCredential(credential){this.email=credential.email;window.__switchAuth(this);return {user:this};}});
  const auth={currentUser:kind==='registered'?makeUser('veteran-a','alex@example.com'):kind==='guest'?makeUser('resumeGuest_fixture',null):null,
   onAuthStateChanged(fn){listeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));},async setPersistence(){},async signOut(){window.__switchAuth(null);},
   async signInWithCustomToken(token){if(token!=='fixture-custom-token')throw new Error('Unexpected custom token');window.__switchAuth(makeUser('resumeGuest_fixture',null));return {user:auth.currentUser};},
   async createUserWithEmailAndPassword(email){window.__switchAuth(makeUser('registered-new',email));return {user:auth.currentUser};},
   async signInWithEmailAndPassword(email){window.__switchAuth(makeUser('veteran-a',email));return {user:auth.currentUser};}
  };
  window.__switchAuth=value=>{auth.currentUser=typeof value==='string'?makeUser(value,value+'@example.com'):value;listeners.forEach(fn=>fn(auth.currentUser));};
  function ref(path){return {path,collection:name=>ref(path+'/'+name),doc:(id='saved-new')=>ref(path+'/'+id),orderBy(){return this;},limit(){return this;},
   async set(data,options){window.__writes.push({path,data,options});window.__records[path]=data;},async delete(){window.__deleted.push(path);delete window.__records[path];},
   async get(){if(path.endsWith('/resumeProgramResumes'))return {docs:Object.entries(window.__records).filter(([key])=>key.startsWith(path+'/')).map(([key,data])=>({id:key.split('/').at(-1),data:()=>data}))};return {exists:true,data:()=>({background:{name:'ALEX VETERAN',roles:[{branch:'navy',code:'LS',title:'Supply technician',duties:'Maintained equipment records.'}]}})};}
  };}
  const firebaseAuth=()=>auth;firebaseAuth.Auth={Persistence:{LOCAL:'local',SESSION:'session'}};firebaseAuth.EmailAuthProvider={credential:(email,password)=>({email,password})};
  const db={collection:name=>ref(name)};window.firebase={apps:[{name:'vcp-resume-program',auth:()=>auth,firestore:()=>db}],auth:firebaseAuth,firestore:()=>db};
 },{kind});
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>route.fulfill({json:route.request().postDataJSON().action==='guest'?{token:'fixture-custom-token'}:{builds:[]}}));
}
export async function start(page,path='edit') {
 await page.goto('/');
 if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();
 await page.locator(path==='build'?'#choose-build':'#choose-import').click();
 if(path!=='build')await page.locator('#resume-paste-mode').click();
}
export async function checkout(page) {
 await page.locator('#next-job').click();await page.locator('#next-checkout').click();
}
export async function agreements(page) {await page.locator('#ai-consent').check();await page.locator('#purchase-consent').check();}
export async function expandBackground(page){await page.locator('#background-builder .builder-group').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));}
