import test from 'node:test';import assert from 'node:assert/strict';
import {purchasedResumeItems,mergeResumeItems} from '../public/resume-list-model.js';
test('paid finished documents remain discoverable when the separate library copy is missing',()=>{const items=purchasedResumeItems([{id:'paid-build',status:'paid',createdAt:1,templates:['modern','classic']}]);assert.equal(items.length,2);assert.ok(items.every(item=>item.finished));const merged=mergeResumeItems([],items);assert.equal(merged[0].buildId,'paid-build');assert.equal(new Set(merged.map(i=>i.id)).size,2);});
test('library copies merge with purchases without duplicating a finished design or hiding other saved drafts',()=>{const paid=purchasedResumeItems([{id:'paid-build',status:'complete',createdAt:1,templates:['modern']}]);const items=mergeResumeItems([{id:paid[0].id,title:'My named resume',workspace:{resume:'Latest client text'}},{id:'separate-draft',title:'Other draft'}],paid);assert.equal(items.length,2);const finished=items.find(i=>i.purchased);assert.equal(finished.title,'My named resume');assert.equal(finished.finished,true);assert.equal(finished.design,'modern');});
test('paid and reviewed builds have a clear next action; unpaid and deleted records are excluded',()=>{const items=purchasedResumeItems(['paid','complete','awaiting_payment','deleted'].map((status,i)=>({id:'b'+i,status,createdAt:1,templates:[]})));assert.equal(items.length,2);assert.equal(items[0].stage,'draft');assert.equal(items[1].stage,'review');});
import {createCloudStore} from '../public/cloud-store.js';
test('explicit draft saves update one private paid-build copy and finishing retains the formatted document without a duplicate draft',async()=>{
 const records=new Map(),auth={currentUser:{uid:'owner-a'}};const ref=path=>({collection:key=>ref(path+'/'+key),doc:key=>ref(path+'/'+key),async set(value){records.set(path,value);},async delete(){records.delete(path);}});const store=createCloudStore({auth,db:{collection:key=>ref(key)}}),buildId='a'.repeat(64);
 await store.saveWorking({resume:'Original working resume',buildId});await store.saveWorking({resume:'Updated working resume',buildId});assert.equal(records.size,1);assert.equal([...records.values()][0].content,'Updated working resume');await store.saveFinished({resume:'Finished resume',buildId,design:'modern',exportSettings:{fontSize:12}});assert.equal(records.size,1);assert.equal([...records.values()][0].finished,true);assert.equal([...records.values()][0].workspace.exportSettings.fontSize,12);
});

test('deleting one purchased design hides only that document and never recreates a fallback draft',()=>{
 const build={id:'paid-build',status:'complete',createdAt:1,templates:['classic','modern'],deletedTemplates:['classic']};
 assert.deepEqual(purchasedResumeItems([build]).map(r=>r.design),['modern']);
 assert.deepEqual(purchasedResumeItems([{...build,deletedTemplates:['classic','modern']}]),[]);
});

test('the server source-availability flag survives an older finished library copy',()=>{
 const paid=purchasedResumeItems([{id:'paid-build',status:'complete',createdAt:1,templates:['classic'],hasSubmittedResume:true}]);const merged=mergeResumeItems([{id:paid[0].id,hasSubmittedResume:false,workspace:{resume:'Tailored result'}}],paid);assert.equal(merged[0].hasSubmittedResume,true);
});
test('workspace reset markers are owner scoped and ignore malformed timestamps',async()=>{
 let uid='owner-a',path='',value=1000;const auth={get currentUser(){return {uid}}},ref=p=>({collection:k=>ref(p+'/'+k),doc:k=>ref(p+'/'+k),async get(){path=p;return {exists:true,data:()=>({resetAt:value})}}});const store=createCloudStore({auth,db:{collection:k=>ref(k)}});assert.equal(await store.workspaceReset(),1000);assert.equal(path,'profiles/owner-a/resumeProgram/workspaceState');value='bad';assert.equal(await store.workspaceReset(),0);uid='owner-b';await store.workspaceReset();assert.equal(path,'profiles/owner-b/resumeProgram/workspaceState');
});
