import test from 'node:test';import assert from 'node:assert/strict';
import {analyticsEvent,allowedScreen,readConsent,trafficSource,analyticsIdentity,forgetAnalytics,CONSENT_KEY,VISITOR_KEY,SESSION_KEY,ONCE_KEY} from '../public/analytics-model.js';
const now=1793200000000;
const store=()=>{const data=new Map();return {data,getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
test('analytics is a distinct explicit, expiring app choice and malformed/main-site choices never grant it',()=>{
 for(const value of [null,'yes','essential','true','{"analytics":true}','{"enabled":true}','bad JSON'])assert.equal(readConsent(value,now),null);
 assert.equal(readConsent(JSON.stringify({version:1,enabled:true,updatedAt:now}),now),true);assert.equal(readConsent(JSON.stringify({version:1,enabled:false,updatedAt:now}),now),false);
 assert.equal(readConsent(JSON.stringify({version:1,enabled:true,updatedAt:now-181*86400000}),now),null);assert.equal(readConsent(JSON.stringify({version:1,enabled:true,updatedAt:now+1}),now),null);
});
test('only fixed event names, categorical parameters and ordinary app screens pass the analytics boundary',()=>{
 assert.equal(analyticsEvent('PRIVATE_EMAIL'),null);assert.equal(analyticsEvent('__proto__'),null);assert.equal(allowedScreen('calculator'),null);assert.equal(allowedScreen('emergency'),null);assert.equal(allowedScreen('private-user-name'),null);
 assert.deepEqual(analyticsEvent('vcp_resume_download',{format:'pdf',document:'resume',filename:'PRIVATE_NAME.pdf',user_id:'PRIVATE_UID',resume:'PRIVATE_TEXT'}),{name:'vcp_resume_download',params:{format:'pdf',document:'resume'}});
 assert.deepEqual(analyticsEvent('vcp_resume_review_failed',{reason:'PRIVATE_ERROR'}),{name:'vcp_resume_review_failed',params:{}});assert.equal(analyticsEvent('page_view',null),null);
});
test('traffic source classification never returns raw URLs, campaigns, search queries or Stripe referrals',()=>{
 assert.equal(trafficSource('https://veterancareerpath.com/resumereview/?utm_source=linkedin&utm_campaign=PRIVATE'),'linkedin');assert.equal(trafficSource('https://veterancareerpath.com/resumereview/?email=PRIVATE','https://www.tiktok.com/@PRIVATE'),'tiktok');
 assert.equal(trafficSource('https://veterancareerpath.com/resumereview/?build=PRIVATE','https://checkout.stripe.com/pay/PRIVATE'),'direct');assert.equal(trafficSource('https://veterancareerpath.com/resumereview/','https://PRIVATE.example/path?q=PRIVATE'),'other');assert.equal(trafficSource('bad'),'direct');
});
test('browser and session IDs contain no identity, persist for their stated windows and preserve acquisition through checkout',()=>{
 const storage=store(),one=analyticsIdentity(storage,()=>123,now,'linkedin');assert.equal(one.client_id,'123.'+now);assert.equal(one.source,'linkedin');assert.equal(analyticsIdentity(storage,()=>999,now+1000,'direct').client_id,one.client_id);assert.equal(analyticsIdentity(storage,()=>999,now+1000,'direct').source,'linkedin');
 const next=analyticsIdentity(storage,()=>999,now+31*60000,'direct');assert.notEqual(next.session_id,one.session_id);assert.equal(next.client_id,one.client_id);assert.equal(next.source,'direct');const later=analyticsIdentity(storage,()=>999,now+91*86400000,'direct');assert.notEqual(later.client_id,one.client_id);
 storage.setItem(CONSENT_KEY,'choice');storage.setItem(ONCE_KEY,'dedup');forgetAnalytics(storage);assert.equal(storage.getItem(VISITOR_KEY),null);assert.equal(storage.getItem(SESSION_KEY),null);assert.equal(storage.getItem(ONCE_KEY),null);assert.equal(storage.getItem(CONSENT_KEY),'choice');
});
test('corrupt stored identifiers cannot become user-supplied tracking IDs',()=>{
 const storage=store();storage.setItem(VISITOR_KEY,JSON.stringify({value:'PRIVATE_UID',expires:now+86400000}));storage.setItem(SESSION_KEY,JSON.stringify({id:'PRIVATE_UID',seen:now,source:'PRIVATE_QUERY'}));const result=analyticsIdentity(storage,()=>111,now,'google');assert.equal(result.client_id,'111.'+now);assert.equal(result.source,'google');assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
