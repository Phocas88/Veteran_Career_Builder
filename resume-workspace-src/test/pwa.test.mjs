import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {initAppInstall,isAppInstalled} from '../public/app-install.js';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url));
test('the app identity, launch and icon paths work on the current path and a standalone domain',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));
 for(const root of ['https://veterancareerpath.com/resumereview/','https://resume.example/']){
  for(const field of ['scope','start_url'])assert.equal(new URL(manifest[field],root).href,root);assert.equal(new URL(manifest.id,root).href,new URL('./index.html',root).href);
  for(const icon of manifest.icons){const png=read(icon.src.slice(2));assert.equal(png.subarray(1,4).toString(),'PNG');const size=Number(icon.sizes.split('x')[0]);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.ok(new URL(icon.src,root).href.startsWith(root));}
 }
 assert.equal(manifest.display,'standalone');assert.equal(manifest.prefer_related_applications,false);assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable'));
});
function worker(scope='https://resume.example/resumereview/'){
 const events={},stores=new Map(),fetches=[],removed=[];let online=true;
 const storage={async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {async addAll(urls){for(const url of urls)data.set(url,new Response(url.includes('offline.html')?'OFFLINE_HELP':'PUBLIC_INSTALL_ASSET'));},async match(url){return data.get(String(url))?.clone();}};},async keys(){return [...stores.keys()];},async delete(name){removed.push(name);return stores.delete(name);}};
 const self={registration:{scope},addEventListener:(name,handler)=>events[name]=handler,async skipWaiting(){},clients:{async claim(){}}};
 vm.runInNewContext(read('app-worker.js').toString(),{self,caches:storage,URL,Response,fetch:async request=>{fetches.push(request.url);if(!online)throw new TypeError('offline');return new Response('LIVE_RESPONSE');}});
 return {stores,fetches,removed,setOnline:value=>online=value,async run(name,request){let result,wait;events[name]({request,respondWith:value=>result=value,waitUntil:value=>wait=value});if(wait)await wait;return result?await result:undefined;}};
}
test('installation caches only public support assets and update cleanup leaves other caches intact',async()=>{
 const w=worker();w.stores.set('private-account-cache',new Map());w.stores.set('vcp-resume-install:/:older',new Map());w.stores.set('vcp-resume-install:/resumereview/:older',new Map());await w.run('install');
 const current=[...w.stores.keys()].find(key=>key.endsWith('20261105-install'));assert.ok(current);const urls=[...w.stores.get(current).keys()];assert.equal(urls.length,6);assert.ok(urls.every(url=>/offline\.html|app-install\.css|app-icon-|apple-touch-icon/.test(url)));assert.ok(urls.every(url=>!url.includes('api/')&&!url.includes('index.html')&&!url.includes('resume-input')));
 await w.run('activate');assert.deepEqual(w.removed,['vcp-resume-install:/resumereview/:older']);assert.ok(w.stores.has('private-account-cache'));assert.ok(w.stores.has('vcp-resume-install:/:older'));
});
test('API, payment, auth, cross-origin and out-of-scope requests are never intercepted or cached',async()=>{
 const w=worker();await w.run('install');
 for(const request of [
  {url:'https://resume.example/resumereview/api/review',method:'POST',mode:'cors'},
  {url:'https://resume.example/resumereview/api/account',method:'GET',mode:'navigate'},
  {url:'https://vcp-proxy.vercel.app/api/claude',method:'POST',mode:'cors'},
  {url:'https://checkout.stripe.com/example',method:'GET',mode:'navigate'},
  {url:'https://identitytoolkit.googleapis.com/v1/accounts:signIn',method:'POST',mode:'cors'},
  {url:'https://resume.example/resumereview/private.json',method:'GET',mode:'cors'},
  {url:'https://resume.example/other-page',method:'GET',mode:'navigate'}
 ])assert.equal(await w.run('fetch',request),undefined);
 assert.deepEqual(w.fetches,[]);
});
test('live navigations stay on the network and offline launch returns help without storing query strings',async()=>{
 for(const scope of ['https://resume.example/','https://resume.example/resumereview/']){
  const w=worker(scope);await w.run('install');const request={url:scope+'?checkout=success&build=PRIVATE_REFERENCE',method:'GET',mode:'navigate'};
  assert.equal(await (await w.run('fetch',request)).text(),'LIVE_RESPONSE');w.setOnline(false);assert.equal(await (await w.run('fetch',request)).text(),'OFFLINE_HELP');
  for(const store of w.stores.values())assert.ok([...store.keys()].every(key=>!key.includes('PRIVATE_REFERENCE')));
 }
});
test('only the explicitly cached public support assets remain available offline',async()=>{
 const w=worker();await w.run('install');w.setOnline(false);const css={url:'https://resume.example/resumereview/app-install.css?v=20261105-install',method:'GET',mode:'cors'};assert.equal(await (await w.run('fetch',css)).text(),'PUBLIC_INSTALL_ASSET');assert.deepEqual(w.fetches,[]);
});
function installFixture(installed=false){
 const listeners={},mediaListeners={},buttons=[{disabled:false,events:{},addEventListener(name,handler){this.events[name]=handler;},focus(){this.focused=true;}}],panels=[{hidden:true}],status={textContent:''},dialog={open:false,events:{},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();},addEventListener(name,handler){this.events[name]=handler;}},close={addEventListener(name,handler){this.click=handler;}};
 const doc={getElementById:id=>({'app-install-dialog':dialog,'app-install-status':status,'app-install-close':close})[id],querySelectorAll:selector=>selector==='[data-install-app]'?buttons:panels};
 const win={addEventListener:(name,handler)=>listeners[name]=handler,matchMedia:query=>({matches:installed&&query.includes('standalone'),addEventListener:(name,handler)=>mediaListeners[name]=handler})},registrations=[];
 const nav={serviceWorker:{async register(url,options){registrations.push({url,options});}}};initAppInstall({win,nav,doc,moduleUrl:'https://resume.example/app-install.js?v=1'});
 return {listeners,buttons,panels,status,dialog,close,registrations};
}
test('installation waits for the user action, falls back to readable help, and restores focus',async()=>{
 const f=installFixture();assert.equal(f.panels[0].hidden,false);await f.buttons[0].events.click({currentTarget:f.buttons[0]});assert.equal(f.dialog.open,true);f.close.click();assert.equal(f.buttons[0].focused,true);assert.equal(f.registrations[0].url,'https://resume.example/app-worker.js');assert.equal(f.registrations[0].options.scope,'/');
 let calls=0,prevented=false;f.listeners.beforeinstallprompt({preventDefault(){prevented=true;},async prompt(){calls++;},userChoice:Promise.resolve({outcome:'accepted'})});assert.equal(prevented,true);assert.equal(calls,0);await f.buttons[0].events.click({currentTarget:f.buttons[0]});assert.equal(calls,1);f.listeners.appinstalled();assert.equal(f.panels[0].hidden,true);
});
test('installed displays hide installation controls and cancelled installation remains optional',async()=>{
 assert.equal(isAppInstalled({matchMedia:()=>({matches:false})},{standalone:true}),true);assert.equal(installFixture(true).panels[0].hidden,true);
 const f=installFixture();f.listeners.beforeinstallprompt({preventDefault(){},async prompt(){},userChoice:Promise.resolve({outcome:'dismissed'})});await f.buttons[0].events.click({currentTarget:f.buttons[0]});assert.match(f.status.textContent,/later/);assert.equal(f.panels[0].hidden,false);assert.equal(f.buttons[0].disabled,false);
});
