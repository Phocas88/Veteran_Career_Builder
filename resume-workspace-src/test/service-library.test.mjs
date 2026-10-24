import test from 'node:test';
import assert from 'node:assert/strict';
import {searchServiceLibrary,addReferenceToProfile} from '../public/service-library-model.js';
const data={branches:{army:{name:'Army'},navy:{name:'Navy'},coastguard:{name:'Coast Guard'}},entries:[
 {id:'army-92y',branch:'army',kind:'specialty',code:'92Y',title:'Unit Supply Specialist',paths:[{name:'Inventory coordinator'}]},
 {id:'navy-bm',branch:'navy',kind:'specialty',code:'BM',title:"Boatswain's Mate"},
 {id:'cg-bm',branch:'coastguard',kind:'specialty',code:'BM',title:"Boatswain's Mate"},
 {id:'army-b4',branch:'army',kind:'qualification',code:'B4',title:'Recorded qualification'}
]};
test('library search distinguishes shared codes by branch and searches code spacing, title and career directions',()=>{
 assert.equal(searchServiceLibrary(data,{branch:'army',query:'92 y'})[0].code,'92Y');
 assert.equal(searchServiceLibrary(data,{branch:'army',query:'inventory coordinator'})[0].code,'92Y');
 assert.equal(searchServiceLibrary(data,{query:'BM'}).length,2);assert.equal(searchServiceLibrary(data,{branch:'navy',query:'BM'})[0].id,'navy-bm');
 assert.equal(searchServiceLibrary(data,{branch:'army',kind:'qualification',query:'B4'}).length,1);
 assert.equal(searchServiceLibrary(data,{query:'no such specialty'}).length,0);
});
test('adding a specialty preserves actual duties, history and achievements without importing general reference claims',()=>{
 const source={name:'EXAMPLE',roles:[{branch:'army',code:'OLD',title:'Actual duty title',duties:'Actually performed records maintenance.',achievements:'Verified result.',startDate:'2020-01',asi:[{code:'Q1',desc:'Verified qualification'}]}]};
 const next=addReferenceToProfile(source,{...data.entries[0],intro:'Managed 100 people.',capabilities:['Expert in every inventory system']},'0');
 assert.equal(next.roles[0].code,'92Y');assert.equal(next.roles[0].title,'Actual duty title');assert.equal(next.roles[0].duties,source.roles[0].duties);assert.equal(next.roles[0].startDate,'2020-01');assert.equal(next.roles[0].asi[0].code,'Q1');
 assert.ok(!JSON.stringify(next).includes('100 people'));assert.ok(!JSON.stringify(next).includes('Expert in every'));assert.equal(source.roles[0].code,'OLD');
});
test('qualification additions cannot cross branches, duplicate a held code or overflow entries',()=>{
 const profile={roles:[{branch:'army',title:'Existing role'}]};
 assert.throws(()=>addReferenceToProfile(profile,data.entries[1],'0'),/different branch/);
 const next=addReferenceToProfile(profile,data.entries[3],'0');assert.equal(next.roles[0].asi[0].code,'B4');assert.equal(next.roles[0].code,'');
 assert.throws(()=>addReferenceToProfile(next,data.entries[3],'0'),/already on/);
 assert.throws(()=>addReferenceToProfile(profile,data.entries[3],'999'),/Choose the service/);
 const reused=addReferenceToProfile({roles:[{}]},data.entries[0]);assert.equal(reused.roles.length,1);assert.equal(reused.roles[0].branch,'army');
 const full={roles:Array.from({length:12},()=>({branch:'army'}))};assert.throws(()=>addReferenceToProfile(full,data.entries[0]),/12 service/);
});
