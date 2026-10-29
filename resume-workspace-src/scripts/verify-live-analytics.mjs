// Fictional fields only. Read Google's real SDK, then abort every analytics hit
// before delivery so this privacy check does not populate the owner's reports.
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const VERSION='vcp-resume-analytics-v1',MEASUREMENT_ID='G-CMFKLT321J',html='',csp='';
const cid='123456789.1793200000000',sid='1793200000';
const parentHtml=`<!doctype html><html><head><title>PRIVATE_PARENT_TITLE</title></head><body><form><input value="PRIVATE_EMAIL"><textarea>PRIVATE_RESUME_AND_VA_ENTRY</textarea></form><a href="https://profiles.veterancareerpath.com/veteran/PRIVATE_CV">PRIVATE_FILENAME.pdf</a><iframe id="bridge" hidden sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" src="https://vcp-proxy.vercel.app/api/resume-analytics?v=e7c65eed0897bc0b2ae5a369896c36ff52275f49"></iframe><script>addEventListener('message',event=>{if(event.origin!=='https://vcp-proxy.vercel.app'||event.data.type!=='ready')return;const target=document.getElementById('bridge').contentWindow;target.postMessage({protocol:${JSON.stringify(VERSION)},type:'configure',client_id:${JSON.stringify(cid)},session_id:${JSON.stringify(sid)},source:'linkedin',screen:'home'},'https://vcp-proxy.vercel.app');for(const name of ['page_view','vcp_resume_review_complete'])target.postMessage({protocol:${JSON.stringify(VERSION)},type:'event',name,screen:'home',session_id:${JSON.stringify(sid)},engagement_time_msec:1500,params:{kind:'new',email:'PRIVATE_EMAIL',resume:'PRIVATE_RESUME',filename:'PRIVATE_FILENAME',page_location:'https://example.com/PRIVATE_URL'}},'https://vcp-proxy.vercel.app');});document.getElementById('bridge').addEventListener('load',()=>document.getElementById('bridge').contentWindow.postMessage({protocol:${JSON.stringify(VERSION)},type:'hello'},'https://vcp-proxy.vercel.app'));</script></body></html>`;
const servers=[http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(parentHtml);}),http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.setHeader('Content-Security-Policy',csp);res.setHeader('Referrer-Policy','no-referrer');res.end(html);})];
let browser;const diagnostics={errors:[],console:[],responses:[]};
try{
 await Promise.all(servers.map((server,index)=>new Promise(resolve=>server.listen(3000+index,'127.0.0.1',resolve))));
 browser=await chromium.launch({channel:'chromium'});const context=await browser.newContext();const external=[],hits=[];const page=await context.newPage();page.on('pageerror',error=>diagnostics.errors.push(error.message));page.on('console',message=>{if(['error','warning'].includes(message.type()))diagnostics.console.push(message.text().replace(/PRIVATE_[A-Z_]+/g,'REDACTED_TEST'));});page.on('response',async response=>{if(response.url().startsWith('https://vcp-proxy.vercel.app/api/resume-analytics')){const headers=await response.allHeaders();diagnostics.responses.push({status:response.status(),csp:headers['content-security-policy'],xfo:headers['x-frame-options'],referrer:headers['referrer-policy']});}});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname.endsWith('google-analytics.com')||url.hostname.endsWith('analytics.google.com')){const headers=await request.allHeaders();const record={url:request.url(),body:request.postData()||'',headers};external.push(record);hits.push(record);return route.abort();}
  if(url.hostname==='www.googletagmanager.com')external.push({url:request.url(),headers:await request.allHeaders()});return route.continue();
 });
 await page.goto('http://127.0.0.1:3000/?build=PRIVATE_BUILD&email=PRIVATE_QUERY_EMAIL');
 await page.waitForTimeout(1500);diagnostics.frames=[];for(const frame of page.frames())if(frame.url().startsWith('https://vcp-proxy.vercel.app')){try{diagnostics.frames.push(await frame.evaluate(()=>({title:document.title,gtag:typeof window.gtag,layer:window.dataLayer?.length,scripts:Array.from(document.scripts).map(script=>script.src||'inline'),helpers:Array.from((document.querySelector('script')?.textContent||'').matchAll(/\b__[A-Za-z_0-9]+\b/g)).map(match=>match[0]).slice(0,12)})));}catch(error){diagnostics.frames.push({error:error.message});}}console.log('COLLECTOR_BROWSER_DIAGNOSTICS '+JSON.stringify(diagnostics));const deadline=Date.now()+60000;while(Date.now()<deadline&&!diagnostics.errors.length&&!hits.some(hit=>(hit.url+' '+hit.body).includes('vcp_resume_review_complete')))await new Promise(resolve=>setTimeout(resolve,250));
 assert.ok(hits.length,'The live Google SDK should attempt a measurement request.');assert.ok(hits.some(hit=>(hit.url+' '+hit.body).includes('vcp_resume_review_complete')),'The SDK should serialize a permitted app event.');
 assert.ok(!JSON.stringify(external).includes('PRIVATE_'),'No parent URL, title, field, filename or extra event property may reach Google.');
 for(const hit of hits){const url=new URL(hit.url);assert.equal(url.searchParams.get('tid'),MEASUREMENT_ID);assert.equal(url.searchParams.get('cid'),cid);assert.equal(url.searchParams.get('dl'),'https://veterancareerpath.com/resumereview/screen/home');}
 const live=await context.newPage(),before=hits.length;
 await live.goto('https://veterancareerpath.com/resumereview/?utm_source=linkedin&email=PRIVATE_APP_QUERY',{waitUntil:'domcontentloaded'});
 await live.locator('#welcome-guest').click();
 assert.equal(await live.locator('#usage-analytics-frame').count(),0,'Actual app stays off before consent');
 await live.locator('#usage-analytics-notice [data-analytics-choice=allow]').click();
 const homeDeadline=Date.now()+20000;while(Date.now()<homeDeadline&&!hits.slice(before).some(hit=>(new URL(hit.url)).searchParams.get('dl')==='https://veterancareerpath.com/resumereview/screen/home'))await new Promise(resolve=>setTimeout(resolve,200));
 assert.ok(hits.length>before,'Actual app must complete the live handshake');
 const profile=live.locator('[data-app-route=profile]');if(!await profile.isVisible())await live.locator('#app-menu-open').click();await profile.click();await live.locator('#builder-name').fill('PRIVATE_APP_NAME');
 const profileDeadline=Date.now()+20000;while(Date.now()<profileDeadline&&!hits.slice(before).some(hit=>(new URL(hit.url)).searchParams.get('dl')==='https://veterancareerpath.com/resumereview/screen/profile'))await new Promise(resolve=>setTimeout(resolve,200));
 assert.ok(hits.slice(before).some(hit=>(new URL(hit.url)).searchParams.get('dl')==='https://veterancareerpath.com/resumereview/screen/profile'),'Actual app screen events should serialize');
 assert.ok(!JSON.stringify(external).includes('PRIVATE_'),'Actual app query and profile data must stay out of Google requests');
 await live.locator('#app-settings').click();await live.locator('#cookie-settings').click();await live.locator('#analytics-preferences [data-analytics-choice=deny]').click();await live.waitForTimeout(250);assert.equal(await live.locator('#usage-analytics-frame').count(),0,'Actual app withdrawal removes measurement');
 assert.equal(await live.evaluate(()=>localStorage.getItem('vcp_resume_analytics_visitor_v1')),null,'Withdrawal removes the app browser identifier');
 console.log('LIVE_APP_CONSENT_CHECK '+JSON.stringify({beforeConsentOff:true,liveHandshake:true,fixedScreenEvents:true,privateDataSent:false,withdrawalStops:true,analyticsHitsDelivered:0}));
 console.log('REAL_ANALYTICS_SDK_CHECK '+JSON.stringify({sdkLoaded:true,allowedEventSerialized:true,privateDataSent:false,analyticsHitsDelivered:0,destinationMatched:true,browserIdMatched:true}));
}finally{await browser?.close();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));}
