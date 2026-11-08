import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {expectedPublishedFiles,verifyPublishedRelease} from '../scripts/verify-published-pages.mjs';

const sample='CURRENT_RELEASE_FACT';
const files=[{url:'https://veterancareerpath.com/resumereview/',sha256:createHash('sha256').update(sample).digest('hex')}];
function fixture({stale=false,open=false,wrongError=false,cache='no-store'}={}){
 const calls=[];return {calls,async fetcher(url,options={}){calls.push({url,options});if(url.includes('/resumereview/'))return new Response(stale?'OLD_RELEASE':sample);if(url.endsWith('/api/resume-activity'))return new Response('',{status:405});return Response.json({error:wrongError?'internal_error':'missing_token'},{status:open?200:401,headers:{'Cache-Control':cache}});}};
}
test('the expected release comes from current source files and includes both public websites',()=>{
 const expected=expectedPublishedFiles();assert.equal(expected.length,22);assert.equal(new Set(expected.map(x=>x.url)).size,expected.length);assert.ok(expected.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));assert.ok(expected.some(x=>x.url==='https://veteranresumes.com/federal-resume/'));assert.ok(expected.some(x=>x.url==='https://veterancareerpath.com/'));
});
test('current public bytes pass while every private endpoint still rejects missing credentials',async()=>{
 const mock=fixture(),result=await verifyPublishedRelease({files,fetcher:mock.fetcher,release:'test-release'});assert.equal(result.releaseBytesMatch,true);assert.equal(result.privateRecordsRead,false);assert.equal(mock.calls.length,6);assert.equal(new URL(mock.calls[0].url).searchParams.get('release'),'test-release');assert.ok(mock.calls.every(x=>!x.options.headers?.Authorization));
});
test('stale HTML is rejected even when the URL succeeds and contains an app script',async()=>{
 const mock=fixture({stale:true});await assert.rejects(verifyPublishedRelease({files,fetcher:mock.fetcher}),/Published release does not match/);assert.equal(mock.calls.length,1);
});
test('a successful private response, changed authorization error or cacheable billing response fails verification',async()=>{
 for(const options of[{open:true},{wrongError:true},{cache:'public, max-age=60'}]){const mock=fixture(options);await assert.rejects(verifyPublishedRelease({files,fetcher:mock.fetcher}),/Authorization check failed/);}
});
test('resume-program errors retain their own sign-in message while requiring unauthorized JSON responses',async()=>{
 const mock=fixture();const fetcher=async(url,options)=>options?.method==='POST'?Response.json({error:'Sign in to your free resume-program account.'},{status:401}):mock.fetcher(url,options);
 assert.equal((await verifyPublishedRelease({files,fetcher})).feedbackProtected,true);
});
