import test from 'node:test';
import assert from 'node:assert/strict';
import {runRecoverableBuild} from '../public/build-recovery.js';
const review={score:85,revisedResume:'Fictional revised resume',suggestions:[]};
const dropped=()=>Object.assign(new Error('Connection interrupted'),{recoverable:true});

test('a disconnected clarification update waits for its new result rather than returning the first review',async()=>{
 let reads=0;const updated={...review,refinementCount:1};
 const result=await runRecoverableBuild(async(action,body)=>{
  if(action==='refine'){assert.deepEqual(body.answers,[{id:'step-0',answer:'Verified fact'}]);throw dropped();}
  return ++reads===1?{status:'running',refinementCount:0,review}:{status:'complete',refinementCount:1,review:updated};
 },'existing',{action:'refine',extra:{answers:[{id:'step-0',answer:'Verified fact'}]},wait:async()=>{}});
 assert.deepEqual(result,updated);assert.equal(reads,2);
 await assert.rejects(runRecoverableBuild(async()=>{throw Object.assign(new Error('Update already used'),{status:409,errorCode:'CLARIFICATION_UPDATE_USED'});},'existing',{action:'refine'}),/already used/);
});

test('a dropped review reads the same saved build without a second run or checkout',async()=>{
 const actions=[];let reads=0,notifications=0;
 const result=await runRecoverableBuild(async(action,body)=>{
  actions.push(action);assert.equal(body.buildId,'existing');
  if(action==='run'){assert.equal(body.keepAlive,true);throw dropped();}
  if(++reads===1)throw dropped();
  return reads<4?{status:'running'}:{status:'complete',review};
 },'existing',{onRecover:()=>notifications++,wait:async()=>{}});
 assert.deepEqual(result,review);assert.equal(notifications,1);assert.deepEqual(actions,['run','get','get','get','get']);
});

test('an already-running build is polled, while an explicit AI failure is never automatically rerun',async()=>{
 let calls=0;
 assert.deepEqual(await runRecoverableBuild(async action=>{
  calls++;if(action==='run')throw Object.assign(new Error('Already running'),{status:409});return {review};
 },'existing'),review);
 assert.equal(calls,2);
 calls=0;
 await assert.rejects(runRecoverableBuild(async()=>{calls++;throw Object.assign(new Error('AI authentication'),{status:503,errorCode:'AI_AUTHENTICATION'});},'existing'),/AI authentication/);
 assert.equal(calls,1);
});

test('recovery reports the saved provider error and stops if the account changes',async()=>{
 for(const accountChanged of [false,true]){
  let calls=0;
  await assert.rejects(runRecoverableBuild(async action=>{
   calls++;if(action==='run')throw dropped();
   if(accountChanged)throw new Error('Account changed. Result discarded.');
   return {status:'paid',lastError:{error:'AI authentication failed',errorCode:'AI_AUTHENTICATION',status:503}};
  },'existing'),accountChanged?/Account changed/:/AI authentication failed/);
  assert.equal(calls,2);
 }
});

test('cancel interrupts recovery immediately; recovery has a deadline and never creates a checkout',async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(runRecoverableBuild(async action=>{
  calls++;if(action==='run')throw dropped();return {status:'running'};
 },'existing',{signal:controller.signal,wait:async()=>controller.abort(new Error('Canceled'))}),/Canceled/);
 assert.equal(calls,2);
 let clock=0;calls=0;
 await assert.rejects(runRecoverableBuild(async action=>{calls++;if(action==='run')throw dropped();return {status:'running'};},'existing',{now:()=>clock,wait:async()=>{clock+=110000;}}),/No second payment/);
 assert.equal(calls,3);
});

test('an interrupted request that never started asks to recover instead of silently executing again',async()=>{
 const actions=[];
 await assert.rejects(runRecoverableBuild(async action=>{actions.push(action);if(action==='run')throw dropped();return {status:'paid'};},'existing',{wait:async()=>{}}),/purchase history/);
 assert.deepEqual(actions,['run','get','get','get']);
});
