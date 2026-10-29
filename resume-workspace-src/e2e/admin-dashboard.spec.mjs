import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const html=await readFile(new URL('admin.html',root),'utf8');
const assets=Object.fromEntries(await Promise.all(['admin-billing.js','admin-billing.css'].map(async name=>[name,await readFile(new URL(name,root),'utf8')])));
const subscription=(values={})=>({id:'sub_A1',name:'Alex Example',email:'alex@example.com',status:'active',amount:199,currency:'usd',interval:'month',intervalCount:1,created:1700000000000,currentPeriodEnd:1800000000000,cancelAtPeriodEnd:false,...values});
async function fixture(page,billing){
 const ga=[],billingCalls=[];
 await page.addInitScript(()=>{
  window.__forcedTokens=0;
  const user={uid:'fixture-admin',isAnonymous:false,email:'owner@example.com',getIdToken:async force=>{if(force)window.__forcedTokens++;return 'fixture-admin-token';},getIdTokenResult:async()=>({claims:{admin:true}})};
  const auth={currentUser:user,getRedirectResult:async()=>null,onAuthStateChanged(fn){queueMicrotask(()=>fn(user));return ()=>{};},signOut:async()=>{auth.currentUser=null;},signInWithPopup:async()=>({user})};
  const ref={orderBy(){return this;},limit(){return this;},where(){return this;},get:async()=>({docs:[],size:0,empty:true,forEach(){}})};
  const authFn=()=>auth;authFn.GoogleAuthProvider=class{};
  window.firebase={initializeApp(){},auth:authFn,firestore:()=>({collection:()=>ref})};
  window.google={accounts:{oauth2:{initTokenClient:options=>({requestAccessToken:()=>options.callback({access_token:'fixture-ga-token'})})}}};
 });
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='veterancareerpath.com'){
   if(url.pathname==='/admin.html')return route.fulfill({contentType:'text/html',body:html});
   const name=url.pathname.slice(1);if(assets[name])return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':'text/css',body:assets[name]});
   return route.fulfill({body:''});
  }
  if(url.hostname==='vcp-proxy.vercel.app'){
   if(url.pathname==='/api/admin-subscribers'){billingCalls.push(url);expect(route.request().headers().authorization).toBe('Bearer fixture-admin-token');return billing(route,url,billingCalls.length);}
   return route.fulfill({json:{messages:[],unread:0,subscribers:[]}});
  }
  if(url.hostname==='analyticsdata.googleapis.com'){
   const body=route.request().postDataJSON();ga.push(body);return route.fulfill({json:{rows:[]}});
  }
  return route.fulfill({body:''});
 });
 await page.goto('https://veterancareerpath.com/admin.html');await expect(page.locator('#dashboard')).toBeVisible();
 return {ga,billingCalls};
}
const openBilling=page=>page.locator('.tabs button').filter({hasText:'Paid Subs'}).click();
test('paid subscriptions load, paginate without duplicates and remain readable on a phone',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 const {billingCalls}=await fixture(page,(route,url)=>route.fulfill({json:url.searchParams.has('cursor')?{subscribers:[subscription(),subscription({id:'sub_C3',name:'Casey Example',currency:'jpy',amount:5000,status:'trialing'})],nextCursor:null}:{subscribers:[subscription({name:'<script>Example</script>'}),subscription({id:'sub_B2',name:'Past Example',status:'canceled'})],nextCursor:'sub_B2'}}));
 await openBilling(page);await expect(page.locator('#subs-root')).toContainText('<script>Example</script>');await expect(page.locator('#subs-root script')).toHaveCount(0);await expect(page.locator('#subs-root')).toContainText('$1.99');
 await page.locator('#subs-more').click();await expect(page.locator('#subs-root')).toContainText('Showing 3 subscriptions.');expect(billingCalls.at(-1).searchParams.get('cursor')).toBe('sub_B2');await expect(page.locator('#subs-root')).toContainText('Casey Example');await expect(page.locator('#stat-sub-total')).toHaveText('2');await expect(page.locator('#subs-more')).toHaveCount(0);
 await page.locator('.subs-archive summary').click();await expect(page.locator('#subs-root')).toContainText('Past Example');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await mkdir('/tmp/vcp-ux-previews',{recursive:true});await page.screenshot({path:'/tmp/vcp-ux-previews/admin-billing-phone.png',fullPage:true});
});
test('billing errors offer a working retry and sign-out removes private records',async({page})=>{
 await fixture(page,(route,url,count)=>count===1?route.fulfill({status:503,json:{error:'billing_unavailable'}}):route.fulfill({json:{subscribers:[subscription()],nextCursor:null}}));
 await openBilling(page);await expect(page.locator('#subs-root [role=alert]')).toContainText('Retry');await expect(page.locator('#subs-root')).not.toContainText('No recurring subscriptions');await page.locator('#subs-retry').click();await expect(page.locator('#subs-root')).toContainText('Alex Example');
 await page.locator('button[onclick="doLogout()"]').click();await expect(page.locator('#dashboard')).toBeHidden();await expect(page.locator('#subs-root')).toBeEmpty();
});
test('an expired admin token refreshes once and a later access denial clears billing data',async({page})=>{
 await fixture(page,(route,url,count)=>route.fulfill(count===1?{status:401,json:{error:'expired_token'}}:count===2?{json:{subscribers:[subscription()],nextCursor:null}}:{status:403,json:{error:'not_admin'}}));
 await openBilling(page);await expect(page.locator('#subs-root')).toContainText('Alex Example');expect(await page.evaluate(()=>window.__forcedTokens)).toBe(1);await page.locator('#subs-refresh').click();await expect(page.locator('#subs-root')).toContainText('does not have administrator access');await expect(page.locator('#subs-root')).not.toContainText('alex@example.com');
});
test('Analytics offers working report links and scopes optional embedded GA reports to the app',async({page})=>{
 const {ga}=await fixture(page,route=>route.fulfill({json:{subscribers:[],nextCursor:null}}));
 await page.locator('.tabs button').filter({hasText:'Analytics'}).click();await expect(page.locator('#admin-open-ga')).toHaveAttribute('href','https://analytics.google.com/analytics/web/');await expect(page.locator('#admin-app-report-guide')).toHaveAttribute('href','/resumereview/analytics-guide.html');await expect(page.locator('#panel-analytics')).not.toContainText('Could not load');
 await page.locator('.admin-report-advanced > summary').click();await page.locator('#ga-client-id').fill('fixture.apps.googleusercontent.com');await page.locator('#ga-property-id').fill('123456789');await page.locator('#ga-connect-btn').click();await expect.poll(()=>ga.length).toBeGreaterThan(0);expect(ga[0].dimensionFilter.filter.stringFilter.value).toBe('/resumereview/screen/');
 const before=ga.length;await page.locator('#ga-report-scope').selectOption('all');await expect.poll(()=>ga.length).toBeGreaterThan(before);expect(ga.at(-1).dimensionFilter).toBeUndefined();
});
