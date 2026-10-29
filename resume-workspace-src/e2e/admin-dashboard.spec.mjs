import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const html=await readFile(new URL('admin.html',root),'utf8');
const assets=Object.fromEntries(await Promise.all(['admin-billing.js','admin-billing.css','admin-resume.js','admin-resume.css'].map(async name=>[name,await readFile(new URL(name,root),'utf8')])));
const subscription=(values={})=>({id:'sub_A1',name:'Alex Example',email:'alex@example.com',status:'active',amount:199,currency:'usd',interval:'month',intervalCount:1,created:1700000000000,currentPeriodEnd:1800000000000,cancelAtPeriodEnd:false,...values});
async function fixture(page,billing,resume){
 const ga=[],billingCalls=[],reportCalls=[];
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
   if(url.pathname==='/api/admin-resume'){reportCalls.push(url);expect(route.request().headers().authorization).toBe('Bearer fixture-admin-token');return resume?resume(route,url,reportCalls.length):route.fulfill({json:url.searchParams.get('view')==='activity'?{days:[],screenLabels:{home:'Home'}}:{purchases:[],nextCursor:null}});}
   if(url.pathname==='/api/admin-subscribers'){billingCalls.push(url);expect(route.request().headers().authorization).toBe('Bearer fixture-admin-token');return billing(route,url,billingCalls.length);}
   return route.fulfill({json:{messages:[],unread:0,subscribers:[]}});
  }
  if(url.hostname==='analyticsdata.googleapis.com'){
   const body=route.request().postDataJSON();ga.push(body);return route.fulfill({json:{rows:body.dimensions?.[0]?.name==='pagePath'?[{dimensionValues:[{value:'<b>Example page</b>'}],metricValues:[{value:'3'}]}]:[]}});
  }
  return route.fulfill({body:''});
 });
 await page.goto('https://veterancareerpath.com/admin.html');await expect(page.locator('#dashboard')).toBeVisible();
 return {ga,billingCalls,reportCalls};
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
 let unavailable=true;await fixture(page,route=>unavailable?route.fulfill({status:503,json:{error:'billing_unavailable'}}):route.fulfill({json:{subscribers:[subscription()],nextCursor:null}}));
 await openBilling(page);await expect(page.locator('#subs-root [role=alert]')).toContainText('Retry');await expect(page.locator('#subs-root')).not.toContainText('No recurring subscriptions');unavailable=false;await page.locator('#subs-retry').click();await expect(page.locator('#subs-root')).toContainText('Alex Example');
 await page.locator('button[onclick="doLogout()"]').click();await expect(page.locator('#dashboard')).toBeHidden();await expect(page.locator('#subs-root')).toBeEmpty();
});
test('an expired admin token refreshes once and a later access denial clears billing data',async({page})=>{
 let denied=false;await fixture(page,(route,url,count)=>route.fulfill(count===1?{status:401,json:{error:'expired_token'}}:denied?{status:403,json:{error:'not_admin'}}:{json:{subscribers:[subscription()],nextCursor:null}}));
 await openBilling(page);await expect(page.locator('#subs-root')).toContainText('Alex Example');expect(await page.evaluate(()=>window.__forcedTokens)).toBe(1);denied=true;await page.locator('#subs-refresh').click();await expect(page.locator('#subs-root')).toContainText('does not have administrator access');await expect(page.locator('#subs-root')).not.toContainText('alex@example.com');
});
test('Analytics offers working report links and scopes optional embedded GA reports to the app',async({page})=>{
 const {ga}=await fixture(page,route=>route.fulfill({json:{subscribers:[],nextCursor:null}}));
 await page.locator('.tabs button').filter({hasText:'Analytics'}).click();await expect(page.locator('#admin-open-ga')).toHaveAttribute('href','https://analytics.google.com/analytics/web/');await expect(page.locator('#admin-app-report-guide')).toHaveAttribute('href','/resumereview/analytics-guide.html');await expect(page.locator('#panel-analytics')).not.toContainText('Could not load');
 await page.locator('.admin-report-advanced > summary').click();await page.locator('#ga-client-id').fill('fixture.apps.googleusercontent.com');await page.locator('#ga-property-id').fill('123456789');await page.locator('#ga-connect-btn').click();await expect.poll(()=>ga.length).toBeGreaterThan(0);expect(ga[0].dimensionFilter.filter.stringFilter.value).toBe('/resumereview/screen/');await expect(page.locator('#ga-today')).toHaveText('0');await expect(page.locator('#ga-pages')).toContainText('<b>Example page</b>');await expect(page.locator('#ga-pages b')).toHaveCount(0);
 const before=ga.length;await page.locator('#ga-report-scope').selectOption('all');await expect.poll(()=>ga.length).toBeGreaterThan(before);expect(ga.at(-1).dimensionFilter).toBeUndefined();
});

const order=(values={})=>({id:'cs_test_A1',name:'Alex Example',email:'alex@example.com',service:'resume',design:null,amount:199,currency:'usd',discount:0,refunded:0,status:'paid',createdAt:1793200000000,stripeUrl:'https://dashboard.stripe.com/payments/pi_A1',...values});
test('VCP Resume purchases show historical promos, template payments, refunds and accurate totals on mobile',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 const rows=[order({name:'<b>Alex Example</b>'}),order({id:'cs_test_Promo',name:'Promo Example',email:'promo@example.com',amount:0,discount:199,status:'promo'}),order({id:'cs_test_Template',name:'Casey Example',service:'template',design:'modern',amount:100,refunded:50,status:'partially_refunded'}),order({id:'cs_test_Refund',service:'template',amount:100,refunded:100,status:'refunded'})];
 const {reportCalls}=await fixture(page,route=>route.fulfill({json:{subscribers:[]}}),(route,url)=>route.fulfill({json:{purchases:url.searchParams.get('cursor')?[rows[2],rows[3]]:rows.slice(0,2),nextCursor:url.searchParams.get('cursor')?null:'cs_test_Promo'}}));
 await page.locator('#resume-admin-tab').click();await expect(page.locator('#resume-admin-root')).toContainText('Promo Example');await expect(page.locator('#resume-admin-root b')).toHaveCount(0);await page.locator('#resume-admin-more').click();await expect(page.locator('#resume-admin-orders .resume-order')).toHaveCount(4);
 await expect(page.locator('.resume-admin-card').filter({hasText:'Collected after refunds'}).locator('strong')).toHaveText('$2.49');await expect(page.locator('.resume-admin-card').filter({hasText:'$0 promo checkouts'}).locator('strong')).toHaveText('1');await expect(page.locator('.resume-admin-card').filter({hasText:'Additional templates'}).locator('strong')).toHaveText('2');
 await page.locator('#resume-admin-status').selectOption('promo');await expect(page.locator('#resume-admin-orders .resume-order')).toHaveCount(1);await page.locator('#resume-admin-status').selectOption('all');await page.locator('#resume-admin-search').fill('promo@example.com');await expect(page.locator('#resume-admin-orders .resume-order')).toHaveCount(1);
 await page.locator('#resume-admin-period').selectOption('all');await expect.poll(()=>reportCalls.at(-1).searchParams.get('days')).toBe('all');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await mkdir('/tmp/vcp-ux-previews',{recursive:true});await page.screenshot({path:'/tmp/vcp-ux-previews/admin-resume-purchases-phone.png',fullPage:true});
});
test('VCP Resume activity is visible inside admin with clear scope and source counts',async({page})=>{
 await fixture(page,route=>route.fulfill({json:{subscribers:[]}}),(route,url)=>route.fulfill({json:url.searchParams.get('view')==='activity'?{days:[{date:'2026-10-29',events:{page_view:40,vcp_resume_start:10,vcp_resume_download:4,vcp_resume_review_complete:6},screens:{home:25,resume_download:15},sources:{linkedin:20,tiktok:20}}],screenLabels:{home:'Home',resume_download:'Download resume'}}:{purchases:[],nextCursor:null}}));
 await page.locator('#resume-admin-shortcut').click();await page.locator('[data-resume-admin-view=activity]').click();await expect(page.locator('.resume-admin-card').filter({hasText:'Page views'}).locator('strong')).toHaveText('40');await expect(page.locator('.resume-admin-card').filter({hasText:'Downloads'}).locator('strong')).toHaveText('4');await expect(page.locator('#resume-admin-root')).toContainText('TikTok');await expect(page.locator('#resume-admin-root')).toContainText('Earlier traffic remains in Google Analytics');await expect(page.locator('#resume-admin-root')).toContainText('VA calculator and crisis-help activity are excluded');
});
test('app reporting errors retry without showing false zero totals and logout clears customer records',async({page})=>{
 let unavailable=true;await fixture(page,route=>route.fulfill({json:{subscribers:[]}}),route=>unavailable?route.fulfill({status:503,json:{error:'billing_unavailable'}}):route.fulfill({json:{purchases:[order()],nextCursor:null}}));
 await page.locator('#resume-admin-tab').click();await expect(page.locator('#resume-admin-root [role=alert]')).toContainText('Retry');await expect(page.locator('.resume-admin-card').filter({hasText:'Completed checkouts'}).locator('strong')).toHaveText('—');unavailable=false;await page.locator('#resume-admin-retry').click();await expect(page.locator('#resume-admin-orders')).toContainText('alex@example.com');await page.locator('button[onclick="doLogout()"]').click();await expect(page.locator('#resume-admin-root')).toBeEmpty();await expect(page.locator('#stat-resume-purchases')).toHaveText('—');
});
