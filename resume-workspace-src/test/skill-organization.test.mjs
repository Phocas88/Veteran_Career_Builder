import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cvSkillGroups,cleanPublicCv} from '../public/cv-content.js';
import {profileToCv,selectCv,cvDefaults} from '../public/digital-cv-model.js';
const backgrounds=JSON.parse(readFileSync(new URL('./fixtures/skill-backgrounds.json',import.meta.url)));
for(const fixture of backgrounds)test('whole-background skills: '+fixture.background,()=>{
 const source={name:'Example Veteran',skills:{technical:fixture.skills.join(', ')}},original=structuredClone(source),groups=cvSkillGroups(source.skills.technical);
 assert.deepEqual(groups.flatMap(group=>group.items).sort(),[...fixture.skills].sort());assert.deepEqual(groups.map(group=>group.title).sort(),[...fixture.categories].sort());
 const normalized=cleanPublicCv(source);assert.deepEqual(cleanPublicCv(normalized),normalized);assert.deepEqual(source,original);
 assert.equal(selectCv(source,{...cvDefaults(),skills:false}).skills.technical,'');
});
test('profile categories are respected without publishing private skill evidence or proficiency',()=>{
 const source={name:'Example Veteran',skillsEntries:[{name:'NetSuite',category:'Technical',evidence:'PRIVATE_EVIDENCE',proficiency:'PRIVATE_LEVEL'},{name:'Staff coaching',category:'Leadership'},{name:'Inventory control',category:'Operations'}]};
 const cv=profileToCv(source),groups=cvSkillGroups(cv.skills.technical,cv.skills.leadership);
 assert.deepEqual(groups.find(group=>group.title==='ERP & WMS systems').items,['NetSuite']);assert.deepEqual(groups.find(group=>group.title==='Leadership skills').items,['Staff coaching']);assert.deepEqual(groups.find(group=>group.title==='Operations').items,['Inventory control']);assert.doesNotMatch(JSON.stringify(cv),/PRIVATE_EVIDENCE|PRIVATE_LEVEL/);
});
test('short PDF skill continuations remain single readable skill items',()=>{
 const groups=cvSkillGroups('Operations: vendor\nmanagement, process\nimprovement, inventory\ncontrol');assert.deepEqual(groups[0].items,['vendor management','process improvement','inventory control']);
});
test('ambiguous skills and learning status stay visible without assigning a specialty',()=>{
 const items=['incident response','risk assessment','Learning SAP','No licensed nursing experience'];assert.deepEqual(cvSkillGroups(items.join(', ')),[{title:'Additional skills',items}]);
});
