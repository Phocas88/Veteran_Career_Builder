import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeJob,safeJobUrl,versionGroups} from '../public/career-model.js';
import {normalizeProfileSetup,profileSteps} from '../public/profile-steps.js';
import {createCloudStore,savedResumeToDraft} from '../public/cloud-store.js';
function fixture(){
 const records=new Map();let seq=0;const auth={currentUser:{uid:'owner-a'}};
 const ref=path=>({collection:k=>ref(path+'/'+k),doc:(id='item-'+(++seq))=>({...ref(path+'/'+id),id}),orderBy(){return this;},limit(){return this;},
  async set(value,options){records.set(path,structuredClone(options?.merge?{...records.get(path),...value}:value));},async delete(){records.delete(path);},async get(){return {exists:records.has(path),data:()=>records.get(path),docs:[...records].filter(([key])=>key.startsWith(path+'/')).map(([key,data])=>({id:key.split('/').at(-1),data:()=>data}))};}
 });return {records,auth,store:createCloudStore({auth,db:{collection:ref}})};
}
test('application fields are bounded and untrusted job links cannot execute code',()=>{
 assert.equal(safeJobUrl('javascript:alert(1)'),'');assert.equal(safeJobUrl('data:text/html,test'),'');assert.equal(safeJobUrl('https://user:pass@example.com'),'');
 const job=normalizeJob({role:' Planner ',company:'Example',description:'a'.repeat(9000),status:'forged',url:'https://example.com/jobs',followUpDate:'invalid',notes:'n'.repeat(4000)});
 assert.equal(job.role,'Planner');assert.equal(job.status,'Saved');assert.equal(job.description.length,8000);assert.equal(job.notes.length,3000);assert.equal(job.followUpDate,'');
});
test('saving a restored draft creates another snapshot in its family and keeps the original intact',async()=>{
 const {store}=fixture();const first=await store.save({resume:'Original resume',applicationType:'federal',design:'modern',buildId:'a'.repeat(64)},'Federal');
 const restored=savedResumeToDraft(first);const second=await store.save({...restored,resume:'Updated resume'},'Job-specific');
 assert.equal(second.familyId,first.id);assert.equal(second.parentVersionId,first.id);assert.notEqual(first.id,second.id);assert.equal((await store.getVersion(first.id)).workspace.resume,'Original resume');
 assert.equal(savedResumeToDraft(second).design,'modern');assert.equal(savedResumeToDraft(second).buildId,'a'.repeat(64));assert.equal(versionGroups(await store.list()).length,1);
 await store.remove(second.id);assert.equal((await store.list()).length,1);
});
test('applications, cover letters and profiles are private program records and are isolated across accounts',async()=>{
 const {store,auth,records}=fixture();const job=await store.saveJob({role:'Planner',company:'Example',status:'Interview',interviewDate:'2026-11-12',resumeVersionId:'version-1',resumeVersionLabel:'Federal version'});
 assert.equal((await store.getJob(job.id)).resumeVersionLabel,'Federal version');
 await store.saveLetter('a'.repeat(64),'Dear Hiring Team,\n\nActual experience.','Planner');await store.saveProfile({name:'Example'});
 assert.ok([...records.keys()].every(key=>key.startsWith('profiles/owner-a/resumeProgram')));
 auth.currentUser={uid:'owner-b'};assert.deepEqual(await store.jobs(),[]);assert.deepEqual(await store.letters(),[]);
 await assert.rejects(()=>store.getJob(job.id),/deleted/);auth.currentUser={uid:'owner-a'};
 await store.removeJob(job.id);await store.removeLetter('a'.repeat(64));assert.deepEqual(await store.jobs(),[]);assert.deepEqual(await store.letters(),[]);
 await assert.rejects(()=>store.saveJob({role:'Planner',company:'Example'},'../other'),/Choose/);
 auth.currentUser=null;await assert.rejects(()=>store.list(),/Sign in/);
});

test('guided setup metadata is bounded to known sections and never trusts extra account claims',()=>{
 assert.equal(normalizeProfileSetup({version:2,status:'active'}),null);assert.equal(normalizeProfileSetup({version:1,status:'paid'}),null);
 assert.equal(profileSteps.length,9);assert.equal(new Set(profileSteps.map(s=>s.key)).size,9);
 assert.deepEqual(normalizeProfileSetup({version:1,status:'paused',section:'unknown',skipped:['roles','roles','paid',null],owner:'other',paid:true}),{version:1,status:'paused',section:'personal',skipped:['roles']});
});
test('profile and setup progress save together, survive ordinary profile saves and stay private to the owner',async()=>{
 const {store,auth}=fixture(),setup={version:1,status:'paused',section:'educationEntries',skipped:['jobs']};
 await store.saveProfile({name:'EXAMPLE VETERAN'},setup);assert.deepEqual(await store.profile(),{resumeWorkspaceProfile:{name:'EXAMPLE VETERAN'},profileSetup:setup});
 await store.saveProfile({name:'UPDATED EXAMPLE'});assert.deepEqual((await store.profile()).profileSetup,setup);
 auth.currentUser={uid:'owner-b'};assert.deepEqual(await store.profile(),{});auth.currentUser={uid:'owner-a'};
 await store.removeProfile();assert.deepEqual(await store.profile(),{});
});
