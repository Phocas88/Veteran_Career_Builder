import test from 'node:test';import assert from 'node:assert/strict';
import {questions,areas,normalizeAnswers,scoreAssessment,interestCareers,occupationLink} from '../public/interest-model.js';
import {createCloudStore} from '../public/cloud-store.js';
test('30 original activities balance the six areas; missing answers never become neutral responses',()=>{assert.equal(questions.length,30);for(const area of areas)assert.equal(questions.filter(q=>q.area===area.key).length,5);assert.equal(normalizeAnswers([undefined,NaN,5,'4',0])[4],0);assert.throws(()=>scoreAssessment([4]),/all 30/);});
test('interest scoring is deterministic, tie-aware and distinct from aptitude or hiring predictions',()=>{const values=questions.map(q=>q.area==='R'?4:0),result=scoreAssessment(values);assert.equal(result.scores.R,20);assert.equal(result.scores.I,0);assert.equal(result.areas[0].key,'R');assert.ok(interestCareers(values).every(o=>o.interests.includes('R')));assert.deepEqual(interestCareers(Array(30).fill(2)),[]);assert.deepEqual(interestCareers(Array(30).fill(0)),[]);assert.ok(interestCareers(values,{preparation:1}).every(o=>o.preparation<=1));assert.equal(occupationLink('javascript:alert(1)'),'');});
test('interest saves use a private per-user namespace and preserve only valid responses',async()=>{const records={},auth={currentUser:{uid:'owner'}};const db={collection:path=>({doc:id=>({collection:name=>({doc:key=>({get:async()=>({exists:!!records[path+'/'+id+'/'+name+'/'+key],data:()=>records[path+'/'+id+'/'+name+'/'+key]}),set:async value=>{records[path+'/'+id+'/'+name+'/'+key]=value;},delete:async()=>{delete records[path+'/'+id+'/'+name+'/'+key];}})})})})};const store=createCloudStore({auth,db});await store.saveInterest({version:2,answers:Array(30).fill(2),public:true});assert.equal(records['profiles/owner/resumeProgram/interests'].public,undefined);assert.deepEqual((await store.interest()).answers,Array(30).fill(2));await assert.rejects(()=>store.saveInterest({version:2,answers:Array(30).fill(9)}),/valid/);auth.currentUser={uid:'other'};assert.equal(await store.interest(),null);auth.currentUser={uid:'owner'};await store.removeInterest();assert.equal(await store.interest(),null);});

test('career exploration uses original VCP identifiers and preserves older saved results',async()=>{const {catalog}=await import('../public/career-data.js');assert.ok(catalog.occupations.every(item=>item.code.startsWith('vcp-')));assert.doesNotMatch(JSON.stringify(catalog),/onet|USDOL|creativecommons/i);const {occupation,validResumeMatches}=await import('../public/interest-model.js');assert.equal(occupation('43-5071.00').code,'vcp-inventory-and-shipping-coordinator');assert.equal(validResumeMatches([{code:'43-5071.00',evidence:'Saved evidence',reason:'Saved connection',checkNext:'Saved check'}])[0].code,'vcp-inventory-and-shipping-coordinator');});

test('the original scenario edition is versioned and supplies practical next steps in every area',async()=>{
 const {interestVersion,interestQuestionSet,nextSteps}=await import('../public/interest-model.js');
 assert.equal(interestVersion,2);assert.equal(interestQuestionSet,'vcp-next-mission-2');assert.equal(new Set(questions.map(q=>q.text)).size,30);
 assert.ok(questions.every(q=>q.text.includes('Would you enjoy')||q.text.includes('Would you choose')));assert.ok(areas.every(a=>nextSteps[a.key]?.length>80));
});
test('career results cover many distinct roles, group without duplicates and search by field or description',async()=>{
 const {catalog}=await import('../public/career-data.js'),{groupCareers,careerCatalogSize}=await import('../public/interest-model.js');
 assert.equal(careerCatalogSize,166);assert.equal(catalog.categories.length,12);assert.equal(new Set(catalog.occupations.map(o=>o.code)).size,166);
 const groups=groupCareers([...catalog.occupations,catalog.occupations[0]]);assert.equal(groups.length,12);assert.equal(groups.reduce((n,g)=>n+g.items.length,0),166);
 assert.ok(groupCareers(catalog.occupations,{search:'CYBERSECURITY'}).every(g=>g.key==='technology'));assert.equal(groupCareers(catalog.occupations,{search:'zzzzzz'}).length,0);
 const ranked=interestCareers(questions.map(q=>q.area==='R'?4:0));assert.ok(ranked.length>20);assert.ok(ranked.every(r=>r.affinity>0));assert.ok(ranked.length<=166);
});
test('earlier answers retain their question version rather than being silently applied to the rewritten test',async()=>{
 const records={'profiles/owner/resumeProgram/interests':{version:1,answers:Array(30).fill(4)}};
 const db={collection:path=>({doc:id=>({collection:name=>({doc:key=>({get:async()=>({exists:true,data:()=>records[path+'/'+id+'/'+name+'/'+key]})})})})})};
 const store=createCloudStore({auth:{currentUser:{uid:'owner'}},db});assert.equal((await store.interest()).version,1);assert.equal(records['profiles/owner/resumeProgram/interests'].version,1);
});

test('next steps reflect expressed interests and never recommend a disliked, flat or uniformly low area',async()=>{
 const {interestActions}=await import('../public/interest-model.js');
 const handsOn=questions.map(q=>q.area==='R'?4:0);assert.deepEqual(interestActions(handsOn).map(a=>a.key),['R']);
 assert.deepEqual(interestActions(Array(30).fill(2)),[]);assert.deepEqual(interestActions(Array(30).fill(1)),[]);
 const mixed=questions.map(q=>q.area==='E'?4:q.area==='C'?3:0);assert.deepEqual(interestActions(mixed).map(a=>a.key),['E','C']);
});
