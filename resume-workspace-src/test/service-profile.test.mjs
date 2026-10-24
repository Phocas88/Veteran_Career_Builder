import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,profileToResume} from '../public/veteran-profile.js';
import {findSpecialty} from '../public/service-codes.js';
import {branchCatalog} from '../public/branch-catalog.js';
import {addReferenceToProfile} from '../public/service-library-model.js';
test('full recorded MOS, independent skill level, ranks and qualifiers survive normalization and draft creation',()=>{
 const original={name:'EXAMPLE VETERAN',roles:[{branch:'army',rank:'SGT',payGrade:'E-5',code:'88M',fullCode:'88M02',skillLevel:'As recorded',title:'Driver',duties:'Operated assigned vehicles.',rankHistory:[{rank:'PFC',payGrade:'E-3',startDate:'2020-01',endDate:'2021-06'},{rank:'SGT',payGrade:'E-5',startDate:'2021-07',current:true}],asi:[{code:'EX',desc:'Applicant verified qualification'}]}]};
 const saved=normalizeProfile(original);assert.equal(saved.roles[0].fullCode,'88M02');assert.equal(saved.roles[0].skillLevel,'As recorded');assert.equal(saved.roles[0].rankHistory.length,2);
 const text=profileToResume(saved);for(const value of ['88M02','Rank history: PFC','Pay grade: E-3','2020-01','Applicant verified qualification'])assert.ok(text.includes(value),value);
 const altered=normalizeProfile({...original,roles:original.roles.map(r=>({...r,rank:'SSG',payGrade:'E-6',skillLevel:''}))});assert.equal(altered.roles[0].fullCode,'88M02');assert.equal(altered.roles[0].skillLevel,'');
});
test('full Army code resolves its base family without guessing grade or qualifiers and other branches keep their codes',()=>{
 assert.equal(findSpecialty(branchCatalog.army,'88M02','army').code,'88M');assert.equal(findSpecialty(branchCatalog.army,'88m02','army').code,'88M');
 assert.equal(findSpecialty(branchCatalog.army,'unknown','army'),null);assert.equal(findSpecialty(branchCatalog.army,'88M02','navy'),null);
 const p=normalizeProfile({roles:[{branch:'navy',code:'LS',fullCode:'LS as recorded',skillLevel:'Verified level'},{branch:'airforce',fullCode:'2S051'}]});assert.equal(p.roles[0].fullCode,'LS as recorded');assert.equal(p.roles[1].fullCode,'2S051');assert.equal(p.roles[1].rank,'');
});
test('same-family reference updates preserve full code while a changed family clears incompatible code details',()=>{
 const p={roles:[{branch:'army',code:'88M',fullCode:'88M02',skillLevel:'Applicant level',rank:'SGT'}]};
 const same=addReferenceToProfile(p,{branch:'army',kind:'specialty',code:'88M',title:'Motor Transport Operator'},'0');assert.equal(same.roles[0].fullCode,'88M02');
 const changed=addReferenceToProfile(p,{branch:'army',kind:'specialty',code:'92Y',title:'Unit Supply Specialist'},'0');assert.equal(changed.roles[0].fullCode,'');assert.equal(changed.roles[0].skillLevel,'');assert.equal(changed.roles[0].rank,'SGT');
 const legacy=addReferenceToProfile({roles:[{branch:'army',code:'88M02'}]},{branch:'army',kind:'specialty',code:'88M',title:'Motor Transport Operator'},'0');assert.equal(legacy.roles[0].fullCode,'88M02');
});
