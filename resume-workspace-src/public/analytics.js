import {CONSENT_KEY,VISITOR_KEY,SESSION_KEY,ONCE_KEY,BRIDGE_URL,BRIDGE_ORIGIN,PROTOCOL_VERSION,PROTOCOL,analyticsEvent,allowedScreen,readConsent,trafficSource,analyticsIdentity,forgetAnalytics} from './analytics-model.js?v=20261029-analytics';
import {careerBuildContext} from './payments.js?v=20261028-guided';

const $=id=>document.getElementById(id);
const memory=new Map();
const storage={getItem:key=>{try{return localStorage.getItem(key)??memory.get(key)??null;}catch{return memory.get(key)??null;}},setItem:(key,value)=>{memory.set(key,value);try{localStorage.setItem(key,value);}catch{}},removeItem:key=>{memory.delete(key);try{localStorage.removeItem(key);}catch{}}};
let initialized=false,consent=null,frame=null,ready=false,configured=false,blocked=false,queue=[],identity=null,lastScreen=null,lastEventAt=0;
const privacySignal=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
const privateScreen=()=>document.body.dataset.appView==='calculator'||$('emergency-help-dialog')?.open===true;
const enabled=()=>consent===true&&!privacySignal()&&!privateScreen();
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0];
function screen(){
 const view=document.body.dataset.appView||'home';
 if(view==='calculator')return null;
 if(view==='workspace'){
  if(!$('review-panel').hidden)return 'resume_review';if(!$('export-panel').hidden)return 'resume_download';
  const stage=Array.from(document.querySelectorAll('[data-flow]')).find(item=>!item.hidden)?.dataset.flow||'start';return allowedScreen('resume_'+stage)||'resume_start';
 }
 return allowedScreen(({versions:'resumes','digital-cv':'digital_cv'})[view]||view);
}
function context(){return analyticsIdentity(storage,random,Date.now(),trafficSource(location.href,document.referrer));}
function post(value){frame?.contentWindow?.postMessage({protocol:PROTOCOL_VERSION,...value},BRIDGE_ORIGIN);}
function stop(){
 const old=frame;frame=null;ready=false;configured=false;queue=[];identity=null;lastEventAt=0;
 if(!old)return;
 old.contentWindow?.postMessage({protocol:PROTOCOL_VERSION,type:'stop'},BRIDGE_ORIGIN);
 // Give the separate document time to disable its tag before removal. Nothing
 // else is queued while the visitor's choice or a private screen stops tracking.
 setTimeout(()=>old.remove(),100);
}
function start(){
 if(!enabled()||blocked||frame||!screen())return;
 identity=context();frame=document.createElement('iframe');frame.id='usage-analytics-frame';frame.hidden=true;frame.title='Optional app usage measurement';frame.tabIndex=-1;frame.referrerPolicy='no-referrer';frame.sandbox='allow-scripts allow-same-origin';const candidate=frame;frame.onload=()=>{if(frame===candidate&&enabled())post({type:'hello'});};frame.src=BRIDGE_URL;document.body.append(frame);
}
function configure(){
 if(!enabled()||!ready||configured||!frame)return;
 identity=context();configured=true;post({type:'configure',...identity,screen:screen()});
 for(const item of queue)post(item);queue=[];
}
function recordUsage(name,params={}){
 if(!initialized||!enabled()||blocked||document.visibilityState==='hidden')return false;
 const clean=analyticsEvent(name,params),current=screen();if(!clean||!current)return false;
 const value=context();if(identity&&identity.client_id!==value.client_id)stop();
 const now=Date.now(),elapsed=lastEventAt?Math.min(3600000,Math.max(0,now-lastEventAt)):0;lastEventAt=now;
 const packet={type:'event',...clean,screen:current,session_id:value.session_id,engagement_time_msec:elapsed};
 start();if(configured)post(packet);else if(queue.length<30)queue.push(packet);return true;
}
export function trackUsage(name,params={}){try{return recordUsage(name,params);}catch{return false;}}
async function once(name,params,reference){
 if(!enabled()||typeof reference!=='string'||reference.length>180)return;
 try{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(name+':'+reference));
  if(!enabled())return;
  const key=Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('');
  let seen=[];try{seen=JSON.parse(sessionStorage.getItem(ONCE_KEY)||'[]');if(!Array.isArray(seen))seen=[];}catch{}
  if(seen.includes(key)||!trackUsage(name,params))return;try{sessionStorage.setItem(ONCE_KEY,JSON.stringify([...seen,key].slice(-60)));}catch{}
 }catch{/* Analytics must never interrupt account or payment recovery. */}
}
function pageChanged(){
 const current=screen();
 if(!enabled()||!current){stop();return;}
 start();if(current!==lastScreen){lastScreen=current;trackUsage('page_view');}
 refreshNotice();
}
function refreshNotice(){
 const hasModal=$('welcome-dialog')?.open||$('account-dialog')?.open;
 $('usage-analytics-notice').hidden=consent!==null||privacySignal()||hasModal||document.body.dataset.appView!=='home';
 const status=privacySignal()?'A browser privacy signal is active. Optional analytics stays off.':consent===true&&blocked?'Your choice is saved. Analytics could not load; the app is still available.':consent===true?'Optional usage analytics is on. You can turn it off at any time.':consent===false?'Essential only. Optional usage analytics is off.':'Optional usage analytics is off until you choose Allow.';
 $('analytics-choice-status').textContent=status;
 for(const button of document.querySelectorAll('[data-analytics-choice="allow"]'))button.disabled=privacySignal();
}
function choose(allow){
 consent=allow&&!privacySignal();storage.setItem(CONSENT_KEY,JSON.stringify({version:1,enabled:consent,updatedAt:Date.now()}));
 blocked=false;
 if(!consent){stop();forgetAnalytics(storage);try{sessionStorage.removeItem(ONCE_KEY);}catch{}}
 else{lastScreen=null;lastEventAt=Date.now();pageChanged();}
 refreshNotice();
}
export function initUsageAnalytics(){
 if(initialized)return;initialized=true;consent=readConsent(storage.getItem(CONSENT_KEY));
 if(consent!==true||privacySignal()){forgetAnalytics(storage);try{sessionStorage.removeItem(ONCE_KEY);}catch{}}
 const returns=new URLSearchParams(location.search),returnId=returns.get('build'),returned=returns.get('checkout')==='success';
 const returnService=returns.has('template')?'template':'resume';
 window.addEventListener('message',event=>{
  if(event.origin!==BRIDGE_ORIGIN||event.source!==frame?.contentWindow||event.data?.protocol!==PROTOCOL_VERSION)return;
  if(event.data.type==='ready'){ready=true;configure();}
  if(event.data.type==='blocked'){blocked=true;stop();$('analytics-choice-status').textContent='Your choice is saved. Analytics could not load; the app is still available.';}
 });
 for(const button of document.querySelectorAll('[data-analytics-choice]'))button.addEventListener('click',()=>choose(button.dataset.analyticsChoice==='allow'));
 for(const id of ['welcome-dialog','account-dialog']){$(id)?.addEventListener('close',refreshNotice);if($(id))new MutationObserver(refreshNotice).observe($(id),{attributes:true,attributeFilter:['open']});}
 document.addEventListener('app:view-changed',()=>{pageChanged();refreshNotice();});
 const observer=new MutationObserver(pageChanged);
 for(const item of document.querySelectorAll('[data-flow],#review-panel,#export-panel,#emergency-help-dialog'))observer.observe(item,{attributes:true,attributeFilter:[item.tagName==='DIALOG'?'open':'hidden']});
 document.addEventListener('visibilitychange',()=>{lastEventAt=Date.now();if(document.visibilityState==='visible')pageChanged();});
 window.addEventListener('storage',event=>{if(event.key===CONSENT_KEY){consent=readConsent(event.newValue);if(consent!==true){stop();forgetAnalytics(storage);}else{blocked=false;lastScreen=null;pageChanged();}refreshNotice();}});
 document.addEventListener('app:account-cleared',()=>{stop();forgetAnalytics(storage);try{sessionStorage.removeItem(ONCE_KEY);}catch{}lastScreen=null;});
 document.addEventListener('resume:payment-changed',()=>{
  if(!returned||!returnId)return;const current=careerBuildContext();
  if(current?.id===returnId)once('vcp_resume_checkout_verified',{service:returnService},returnId+':'+returnService);
 });
 for(const [id,path]of [['choose-import','upload'],['choose-build','manual']])$(id)?.addEventListener('click',()=>trackUsage('vcp_resume_start',{path}));
 $('purchase-start')?.addEventListener('click',()=>{if($('upfront-consent').checked)trackUsage('vcp_resume_checkout_requested',{service:'resume'});});
 setInterval(()=>{if(enabled()&&document.visibilityState==='visible')trackUsage('vcp_resume_active');},20000);
 refreshNotice();pageChanged();
}
