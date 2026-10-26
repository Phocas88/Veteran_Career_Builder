import test from 'node:test';import assert from 'node:assert/strict';
import {parsePosting,parseApplicationCsv,applicationKey} from '../public/application-import-model.js';
import {combinedRating,compensation} from '../public/va-calculator-model.js';
import {normalizeProfile,profileToResume} from '../public/veteran-profile.js';
import {profileToCv,selectCv,cvDefaults} from '../public/digital-cv-model.js';
import {describeReference} from '../public/service-descriptions.js';
test('posting imports use supplied facts, keep the description and reject executable links',()=>{
 const source='Job title: Analyst\nCompany: Example Employer\nContact: Hiring team\nMaintain verified records.';const job=parsePosting(source,'javascript:alert(1)');assert.equal(job.role,'Analyst');assert.equal(job.company,'Example Employer');assert.equal(job.contact,'Hiring team');assert.equal(job.url,'');assert.equal(job.description,source);
 const schema=parsePosting(JSON.stringify({'@type':'JobPosting',title:'Specialist',hiringOrganization:{name:'Example'},description:'<p>Verified duties</p>',url:'https://www.usajobs.gov/job/123'}));assert.equal(schema.applicationType,'federal');assert.equal(schema.description,'Verified duties');assert.equal(parsePosting('Some unstructured posting text').role,'');
});
test('CSV handles quoted commas, multiline descriptions, dates and duplicate keys',()=>{
 const rows=parseApplicationCsv('Job title,Company,URL,Date applied,Description\r\n"Analyst, Senior",Example,https://example.com/job,2026-10-26,"Line one\nLine two"\r\nAnalyst,Example,javascript:bad,invalid,Other');assert.equal(rows.length,2);assert.equal(rows[0].job.role,'Analyst, Senior');assert.equal(rows[0].job.description,'Line one\nLine two');assert.equal(rows[0].job.appliedDate,'2026-10-26');assert.equal(rows[1].job.url,'');assert.equal(rows[1].job.appliedDate,'');assert.equal(applicationKey(rows[0].job),applicationKey({...rows[0].job,url:'https://example.com/job/'}));assert.throws(()=>parseApplicationCsv('Name,Other\nA,B'),/Job title/);assert.throws(()=>parseApplicationCsv('Job title,Company\n"Unclosed,A'),/unclosed/);
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
