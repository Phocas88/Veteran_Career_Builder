import test from 'node:test';
import assert from 'node:assert/strict';
import { branches, profileToResume, normalizeProfile, profileFromWebsite } from '../public/veteran-profile.js';
import { createCloudStore, savedResumeToDraft } from '../public/cloud-store.js';

test('older website structured resumes open as readable text while retaining facts and clearance status', () => {
  const data = { name: 'ALEX EXAMPLE', contact: 'alex@example.com', summary: 'Logistics professional.', experience: [{ employer: 'U.S. Navy', title: 'Logistics specialist', dates: 'Jan 2021 – Dec 2024', bullets: ['Maintained records for 12 systems.'] }], education: [{ degree: 'B.S. in progress', school: 'Example University', year: 'Expected 2027' }], skills: ['Excel'], clearance: 'Inactive Secret' };
  const draft = savedResumeToDraft({ resumeData: data });
  assert.match(draft.resume, /U.S. Navy/); assert.match(draft.resume, /12 systems/); assert.match(draft.resume, /B.S. in progress/); assert.match(draft.resume, /Inactive Secret/);
  assert.equal(savedResumeToDraft({ content: JSON.stringify(data) }).resume, draft.resume);
  assert.deepEqual(savedResumeToDraft({ content: 'Plain text' }), { resume: 'Plain text' });
});

test('every branch can build a resume from actual duties without inventing hours, credentials, or outcomes', () => {
  for (const [branch, info] of Object.entries(branches)) {
    const text = profileToResume({ name: 'ALEX EXAMPLE', roles: [{ branch, code: 'TEST', rank: 'E-5', title: 'Supply specialist', dates: 'Jan 2021 – Dec 2024', duties: 'Maintained equipment records and trained new staff.' }], education: 'Degree in progress' });
    assert.ok(text.includes(info.name)); assert.ok(text.includes(info.code + ': TEST'));
    assert.ok(text.includes('Degree in progress')); assert.ok(!text.includes('Hours per week')); assert.ok(!text.includes('GS-'));
  }
  assert.throws(() => profileToResume({ name: 'ALEX' }), /actual duties/);
  const p = normalizeProfile({ roles: [{ branch: '__proto__', component: 'invented' }] });
  assert.equal(p.roles[0].branch, ''); assert.equal(p.roles[0].component, '');
});

test('website profile import selects only career fields and ignores billing, disability and access claims', () => {
  const p = profileFromWebsite({ personal: { name: 'ALEX', email: 'alex@example.com', disability: 'private' }, milExperiences: [{ branch: 'Navy', rating: 'LS', title: 'Logistics specialist', duties: 'Maintained supplies.' }], stripeSession: 'private-session', accessExpiry: 999 });
  assert.equal(p.roles[0].branch, 'navy'); assert.equal(p.roles[0].code, 'LS');
  assert.ok(!JSON.stringify(p).includes('private')); assert.ok(!JSON.stringify(p).includes('999'));
});

test('cloud operations use authenticated owner paths, preserve the main profile, and reject signed-out or switched accounts', async () => {
  const paths = []; let resolveRead; let lastEntry;
  const auth = { currentUser: { uid: 'owner-a' } };
  const ref = path => ({
    collection(name) { return ref(path + '/' + name); }, doc(id = 'new-id') { paths.push(path + '/' + id); return ref(path + '/' + id); },
    async set(data, options) { lastEntry = { data, options }; }, async delete() {},
    get() { return new Promise(resolve => { resolveRead = resolve; }); }
  });
  const store = createCloudStore({ auth, db: { collection(name) { return ref(name); } } });
  await store.saveProfile({ name: 'ALEX' });
  assert.deepEqual(lastEntry.options, { merge: true }); assert.equal(lastEntry.data.background.name, 'ALEX');
  await store.save({ resume: 'ALEX\nActual experience' }, '<script>bad</script>');
  assert.ok(paths.includes('profiles/owner-a/resumeProgramResumes/new-id')); assert.equal(lastEntry.data.content, 'ALEX\nActual experience');
  await assert.rejects(store.remove('../other'), /Choose/);
  const pending = store.profile(); auth.currentUser = { uid: 'owner-b' }; resolveRead({ exists: true, data: () => ({ personal: 'owner-a information' }) });
  await assert.rejects(pending, /account changed/);
  auth.currentUser = null; await assert.rejects(store.saveProfile({}), /Sign in/);
});

test('structured civilian, military progression, education and credentials retain verified facts and statuses', () => {
 const p={name:'ALEX EXAMPLE',email:'alex@example.com',phone:'555-0100',city:'Austin',state:'TX',roles:[{branch:'army',rank:'SSG',payGrade:'E-6',code:'92Y',mosTitle:'Unit Supply Specialist',title:'Supply sergeant',serviceType:'Separated/Veteran',startDate:'2021-01',endDate:'2024-12',tos:'Verified service period',duties:'Maintained supplies.',clearanceLevel:'Secret',clearanceStatus:'Inactive',includeClearance:true,mosRoles:[{title:'Dispatcher',rankAtRole:'E-5',fromYear:'2021',toYear:'2022',keyDuty:'Coordinated deliveries.'}],asi:[{code:'TEST',desc:'Verified qualifier'}],sqi:[{code:'X',desc:'Recorded designator'}],additionalDuties:[{name:'Safety NCO',duties:'Delivered safety briefings.'}],awards:[{name:'Achievement Medal',date:'2022-06',reason:'Verified award reason.'}],deployments:[{name:'Training rotation',location:'Releasable location',startDate:'2022-01',endDate:'2022-06',duties:'Maintained records.'}]}],jobs:[{employer:'Example Agency',jobTitle:'Inventory analyst',type:'Other Government (Federal/State)',startDate:'2025-01',current:true,hours:'32',series:'2005',grade:'GS-7',duties:'Reconciled inventory records.',achievements:'Resolved documented discrepancies.',supervisor:'Do not publish',includeSupervisor:false}],educationEntries:[{institution:'Example University',degree:'B.S.',field:'Analytics',status:'In progress',year:'2027',gpa:'3.5',gpaScale:'4.0',credits:'60',creditType:'Semester',pme:'Completed PME'}],certifications:[{name:'Example credential',issuer:'Example issuer',status:'Expired',issued:'2020-01',expires:'2023-01'}],training:[{name:'Completed course',institution:'Service school',status:'Completed',hours:'40'}],skillsEntries:[{name:'Spreadsheet analysis',category:'Technical',evidence:'Used in inventory role.'}],languages:[{name:'Spanish',speaking:'Conversational',test:'Verified test supplied'}]};
 const result=profileToResume(p);
 for(const fact of ['Example Agency','Hours per week: 32','Federal series: 2005','GS-7','Dispatcher','E-5','Verified qualifier','Recorded designator','Safety NCO','Achievement Medal','Training rotation','Secret','Inactive','In progress','2027','Expired','Spanish','Semester credits','Completed PME'])assert.ok(result.includes(fact),fact);
 assert.ok(!result.includes('Do not publish'));
 assert.ok(!profileToResume({...p,roles:p.roles.map(r=>({...r,includeClearance:false}))}).includes('Clearance:'));
 assert.equal(normalizeProfile(p).educationEntries[0].status,'In progress');
});

test('overlong backgrounds fail without silently cutting the generated resume',()=>{
 const roles=Array.from({length:12},()=>({branch:'navy',title:'Supply specialist',duties:'A'.repeat(2400)}));
 assert.throws(()=>profileToResume({name:'ALEX',roles}),/fields are unchanged/);
});
test('achievements and nested duties survive service draft creation even without a duty title or specialty code',()=>{
 for(const role of [{branch:'army',achievements:'Reduced verified scheduling errors.'},{branch:'navy',mosRoles:[{keyDuty:'Coordinated public training schedules.'}]},{branch:'marines',additionalDuties:[{name:'Safety representative',duties:'Delivered weekly safety briefings.',startDate:'2022-01',endDate:'2023-02'}]},{branch:'airforce',deployments:[{name:'Public training rotation',duties:'Maintained releasable equipment records.'}]}]){
  const text=profileToResume({name:'EXAMPLE VETERAN',roles:[role]});
  assert.match(text,/MILITARY EXPERIENCE/);assert.ok(text.includes(role.achievements||role.mosRoles?.[0].keyDuty||role.additionalDuties?.[0].duties||role.deployments?.[0].duties));
 }
 assert.throws(()=>profileToResume({name:'EXAMPLE VETERAN',roles:[{additionalDuties:[{name:'Safety representative',duties:'Led verified safety briefings.'}]}]}),/Choose a branch/);
 const text=profileToResume({name:'EXAMPLE VETERAN',jobs:[{achievements:'Resolved verified inventory discrepancies.'}],projects:[{duties:'Organized a community event.'}]});assert.match(text,/Resolved verified inventory discrepancies/);assert.match(text,/Organized a community event/);
});
