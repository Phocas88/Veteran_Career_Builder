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
  assert.deepEqual(lastEntry.options, { merge: true }); assert.equal(lastEntry.data.resumeWorkspaceProfile.name, 'ALEX');
  await store.save({ resume: 'ALEX\nActual experience' }, '<script>bad</script>');
  assert.ok(paths.includes('profiles/owner-a/resumes/new-id')); assert.equal(lastEntry.data.content, 'ALEX\nActual experience');
  await assert.rejects(store.remove('../other'), /Choose/);
  const pending = store.profile(); auth.currentUser = { uid: 'owner-b' }; resolveRead({ exists: true, data: () => ({ personal: 'owner-a information' }) });
  await assert.rejects(pending, /account changed/);
  auth.currentUser = null; await assert.rejects(store.saveProfile({}), /Sign in/);
});
