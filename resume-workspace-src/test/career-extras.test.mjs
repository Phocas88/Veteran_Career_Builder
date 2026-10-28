import test from 'node:test';import assert from 'node:assert/strict';
import {parsePosting,parseApplicationCsv,applicationKey} from '../public/application-import-model.js';
import {combinedRating,compensation,rateYear,RATE_YEARS,RATES} from '../public/va-calculator-model.js';
import {normalizeProfile,profileToResume} from '../public/veteran-profile.js';
import {profileToCv,selectCv,cvDefaults} from '../public/digital-cv-model.js';
import {describeReference} from '../public/service-descriptions.js';
import {CONDITIONS,CONDITION_CATEGORIES,findConditions} from '../public/va-conditions.js';
test('posting imports use supplied facts, keep the description and reject executable links',()=>{
 const source='Job title: Analyst\nCompany: Example Employer\nContact: Hiring team\nMaintain verified records.';const job=parsePosting(source,'javascript:alert(1)');assert.equal(job.role,'Analyst');assert.equal(job.company,'Example Employer');assert.equal(job.contact,'Hiring team');assert.equal(job.url,'');assert.equal(job.description,source);
 const schema=parsePosting(JSON.stringify({'@type':'JobPosting',title:'Specialist',hiringOrganization:{name:'Example'},description:'<p>Verified duties</p>',url:'https://www.usajobs.gov/job/123'}));assert.equal(schema.applicationType,'federal');assert.equal(schema.description,'Verified duties');assert.equal(parsePosting('Some unstructured posting text').role,'');assert.throws(()=>parsePosting('x'.repeat(8001)),/8,000/);
});
test('CSV handles quoted commas, multiline descriptions, dates and duplicate keys',()=>{
 const rows=parseApplicationCsv('Job title,Company,URL,Date applied,Description\r\n"Analyst, Senior",Example,https://example.com/job,2026-10-26,"Line one\nLine two"\r\nAnalyst,Example,javascript:bad,invalid,Other');assert.equal(rows.length,2);assert.equal(rows[0].job.role,'Analyst, Senior');assert.equal(rows[0].job.description,'Line one\nLine two');assert.equal(rows[0].job.appliedDate,'2026-10-26');assert.equal(rows[1].job.url,'');assert.equal(rows[1].job.appliedDate,'');assert.equal(rows[1].selected,false);assert.ok(rows[1].warnings.length>=2);assert.equal(parseApplicationCsv('Job title,Company,Date applied\nAnalyst,Example,10/26/2026')[0].job.appliedDate,'2026-10-26');assert.equal(applicationKey(rows[0].job),applicationKey({...rows[0].job,url:'https://example.com/job/'}));assert.throws(()=>parseApplicationCsv('Name,Other\nA,B'),/Job title/);assert.throws(()=>parseApplicationCsv('Job title,Company\n"Unclosed,A'),/unclosed/);
});
test('VA calculations match the published table example and zero percent has no base compensation',()=>{
 assert.deepEqual(combinedRating([50,30,10]).steps.map(s=>s.combined),[50,65,69]);assert.equal(combinedRating([50,30,10]).rating,70);assert.equal(combinedRating([10,10]).combined,19);assert.equal(combinedRating([100,90]).rating,100);assert.equal(compensation(0,{children:2}).monthly,0);assert.equal(compensation(20,{spouse:true,children:2,parents:2}).monthly,356.66);assert.throws(()=>combinedRating([35]),/ratings/);
});
test('VA dependent estimates use 2026 amounts, including separate school-child additions',()=>{
 assert.equal(compensation(100,{spouse:true,children:1,parents:2}).monthly,4671.47);assert.equal(compensation(100,{schoolChildren:1}).monthly,4291.03);assert.equal(compensation(70,{spouse:true,spouseAA:true}).monthly,2102.45);assert.equal(compensation(100,{children:2,schoolChildren:1}).monthly,4546.99);assert.throws(()=>compensation(70,{children:-1}),/dependent/);
});
test('profile photo survives normalization but never enters resume/AI source; CV sharing is individually opt-in',()=>{
 const photo='data:image/jpeg;base64,/9j/4P/Z',p=normalizeProfile({name:'Example',photo,github:'https://github.com/example',portfolio:'https://example.com',jobs:[{jobTitle:'Analyst',duties:'Verified recordkeeping.'}]});assert.equal(p.photo,photo);assert.ok(!profileToResume(p).includes(photo));const base=profileToCv(p),privateCv=selectCv(base,cvDefaults());assert.equal(privateCv.photo,'');assert.equal(privateCv.contact.github,undefined);const publicCv=selectCv(base,{...cvDefaults(),photo:true,github:true,portfolio:true});assert.equal(publicCv.photo,photo);assert.equal(publicCv.contact.github,'https://github.com/example');assert.equal(normalizeProfile({photo:'data:image/svg+xml;base64,PHN2Zz4='}).photo,'');
});
test('library explanations retain curated text and explain duty titles without claiming individual qualifications',()=>{
 assert.equal(describeReference({intro:'Curated source explanation.'}),'Curated source explanation.');assert.match(describeReference({branch:'army',kind:'specialty',title:'Motor Transport Operator'}),/vehicle operations/);assert.match(describeReference({kind:'duty',title:'Master Driver'}),/driver training/);assert.match(describeReference({kind:'qualification',title:'Unknown Historical Code'}),/does not establish/);
});
import {createCloudStore} from '../public/cloud-store.js';
test('large imported trackers retain reachable older pages and deduplication can read the complete owner history',async()=>{
 const docs=Array.from({length:202},(_,i)=>({id:'job-'+i,data:()=>({role:'Role '+i,company:'Example',updatedAt:1000-i})}));const auth={currentUser:{uid:'owner'}};const ref=()=>({collection:()=>ref(),doc:()=>ref(),orderBy:()=>{let offset=0,count=100;return{limit(n){count=n;return this;},startAfter(cursor){offset=docs.findIndex(d=>d.id===cursor.id)+1;return this;},async get(){return{docs:docs.slice(offset,offset+count)};}};}});const store=createCloudStore({auth,db:{collection:()=>ref()}});const first=await store.jobs();assert.equal(first.length,100);assert.equal(first.hasMore,true);const second=await store.jobs({after:first.cursor});assert.equal(second[0].role,'Role 100');assert.equal(second.hasMore,true);const third=await store.jobs({after:second.cursor});assert.equal(third.length,2);assert.equal(third.hasMore,false);const complete=await store.jobs({all:true});assert.equal(complete.length,202);assert.equal(new Set(complete.map(j=>j.id)).size,202);assert.equal(complete[201].role,'Role 201');
});

test('2027 COLA is a labeled projection from published 2026 amounts, not a fabricated VA table',()=>{
 const original=JSON.stringify(RATES);
 assert.equal(RATE_YEARS[2027].cola,3.6);assert.equal(rateYear(2027).projected,true);assert.equal(rateYear(2026).effective,'2025-12-01');
 assert.equal(compensation(100,{year:2027}).monthly,4080.37);assert.equal(compensation(70,{year:2027}).monthly,1873.55);
 const family={spouse:true,spouseAA:true,children:3};assert.equal(compensation(70,family).monthly,2367.45);
 const future=compensation(70,{...family,year:2027});assert.equal(future.monthly,2452.69);assert.equal(future.annual,29432.28);assert.equal(future.projected,true);
 assert.equal(compensation(0,{year:2027}).monthly,0);assert.equal(JSON.stringify(RATES),original);
 for(const value of [2028,2025,'2027','toString','__proto__',NaN])assert.throws(()=>rateYear(value),/Choose 2026/);
});
test('awarded SMC-S replaces the basic schedule, SMC-K is additive even at zero, and TDIU preserves the actual rating',()=>{
 assert.equal(compensation(50,{smcS:true}).monthly,4408.53);assert.equal(compensation(100,{smcS:true,spouse:true,children:1,parents:2}).monthly,5141.42);
 assert.equal(compensation(100,{smcS:true,spouse:true,children:3,schoolChildren:1,spouseAA:true,smcK:1}).monthly,5700.89);
 assert.equal(compensation(0,{smcK:1}).monthly,139.87);assert.equal(compensation(0,{year:2027,smcK:1}).monthly,144.91);
 assert.equal(compensation(70,{tdiu:true}).monthly,3938.58);assert.equal(compensation(70,{tdiu:true}).payRating,100);
 assert.equal(compensation(70,{tdiu:true,smcS:true}).monthly,4408.53);assert.equal(compensation(20,{spouse:true,spouseAA:true,children:2,smcK:1}).monthly,496.53);
 for(const smcK of [-1,4,NaN,1.5])assert.throws(()=>compensation(100,{smcK}),/SMC-K/);
 for(const option of [{children:NaN},{schoolChildren:1.5},{parents:3}])assert.throws(()=>compensation(50,option),/dependent/);
});
test('all 15 condition categories provide meaningful explanations and searchable alternatives without assigning percentages',()=>{
 assert.equal(CONDITION_CATEGORIES.length,15);assert.ok(CONDITIONS.length>=120);assert.equal(new Set(CONDITIONS.map(item=>item.id)).size,CONDITIONS.length);
 for(const item of CONDITIONS){assert.ok(item.description.length>20,item.name);assert.ok(item.evaluation.length>50,item.name);assert.match(item.source,/^https:\/\/www\.ecfr\.gov\//);assert.equal(item.rating,undefined);}
 assert.equal(findConditions({query:'tinnitus'})[0].name,'Tinnitus');assert.ok(findConditions({query:'knee'}).length>=3);
 assert.equal(findConditions({category:'hearing',query:'PTSD'}).length,0);assert.ok(findConditions({query:'spinal nerve'}).length>=2);
 assert.match(findConditions({query:'periodontal'})[0].evaluation,/not compensable/);
});
