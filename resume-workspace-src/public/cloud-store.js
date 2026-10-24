// Firebase rules remain the security boundary. Every operation derives its path
// from the current authenticated UID; caller-supplied owner IDs are never accepted.
import { normalizeJob } from './career-model.js?v=20261025-standalone-app';
export function savedResumeToDraft(item = {}) {
  if (item.workspace && typeof item.workspace.resume === 'string') return {...item.workspace, versionFamily:item.familyId || item.id, versionId:item.id, versionTitle:item.title || 'Saved resume'};
  let data = item.resumeData;
  if (!data && typeof item.content === 'string') {
    try { data = JSON.parse(item.content.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { /* Ordinary text is already a valid draft. */ }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { resume: typeof item.content === 'string' ? item.content : '' };
  const text = value => typeof value === 'string' ? value : '';
  const strings = value => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
  const sections = [text(data.name), text(data.contact), data.summary && 'PROFESSIONAL SUMMARY\n' + text(data.summary)];
  if (Array.isArray(data.experience)) sections.push('EXPERIENCE\n' + data.experience.map(job => [
    [text(job.title), text(job.dates)].filter(Boolean).join(' | '), text(job.employer),
    ...strings(job.bullets).map(bullet => '• ' + bullet)
  ].filter(Boolean).join('\n')).join('\n\n'));
  if (Array.isArray(data.education)) sections.push('EDUCATION\n' + data.education.map(education => [text(education.degree), text(education.school), text(education.year)].filter(Boolean).join(' · ')).join('\n'));
  for (const [key, title] of [['skills','SKILLS'],['certifications','CERTIFICATIONS'],['awards','AWARDS']]) {
    const values = strings(data[key]); if (values.length) sections.push(title + '\n' + values.map(value => '• ' + value).join('\n'));
  }
  if (text(data.clearance)) sections.push('CLEARANCE\n' + data.clearance);
  return { resume: sections.filter(Boolean).join('\n\n') || text(item.content) };
}

export function createCloudStore({ db, auth }) {
  function owner() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in before accessing saved resumes.');
    return { uid: user.uid, ref: db.collection('profiles').doc(user.uid) };
  }
  function assertOwner(uid) {
    if (auth.currentUser?.uid !== uid) throw new Error('Your account changed. Please try again.');
  }
  function validId(id) {if(typeof id!=='string'||!/^[\w-]{1,160}$/.test(id))throw new Error('Choose a saved item.');return id;}
  return {
    async getJob(id) {const {uid,ref}=owner();const snap=await ref.collection('resumeProgramJobs').doc(validId(id)).get();assertOwner(uid);if(!snap.exists)throw new Error('This saved job was deleted. Choose another application.');return {...normalizeJob(snap.data()),id};},
    async getVersion(id) {const {uid,ref}=owner();const snap=await ref.collection('resumeProgramResumes').doc(validId(id)).get();assertOwner(uid);if(!snap.exists)throw new Error('This saved resume version was deleted. Open another version.');return {...snap.data(),id};},
    async profile() { const { uid, ref } = owner(); const snap = await ref.collection('resumeProgram').doc('background').get(); assertOwner(uid); return snap.exists ? {resumeWorkspaceProfile: snap.data().background} : {}; },
    async saveProfile(profile) { const { uid, ref } = owner(); await ref.collection('resumeProgram').doc('background').set({ background: profile, updatedAt: Date.now() }, { merge: true }); assertOwner(uid); },
    async removeProfile() { const {uid,ref} = owner(); await ref.collection('resumeProgram').doc('background').delete(); assertOwner(uid); },
    async list() { const { uid, ref } = owner(); const snap = await ref.collection('resumeProgramResumes').orderBy('createdAt', 'desc').limit(50).get(); assertOwner(uid); return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })); },
    async save(draft, title) {
      const { uid, ref } = owner();
      if (!draft.resume?.trim() || draft.resume.length > 20000) throw new Error('Add a resume of up to 20,000 characters before saving.');
      const doc = ref.collection('resumeProgramResumes').doc();
      // Program-only namespace; main-site resumes and subscription data are untouched.
      const familyId = typeof draft.versionFamily === 'string' && /^[\w-]{1,160}$/.test(draft.versionFamily) ? draft.versionFamily : doc.id;
      const entry = { id: doc.id, familyId, parentVersionId: typeof draft.versionId === 'string' ? draft.versionId.slice(0,160) : '', title: String(title || 'My veteran resume').trim().slice(0, 120),
        content: draft.resume, createdAt: new Date().toISOString(), date: new Date().toLocaleDateString('en-US'),
        preview: draft.resume.slice(0, 120), format: 'workspace', source: 'vcp-resume-workspace',
        workspace: draft };
      await doc.set(entry); assertOwner(uid); return entry;
    },
    async remove(id) { const { uid, ref } = owner(); if (typeof id !== 'string' || !id || id.includes('/')) throw new Error('Choose a saved resume.'); await ref.collection('resumeProgramResumes').doc(id).delete(); assertOwner(uid); },
    async jobs() { const {uid,ref}=owner(); const snap=await ref.collection('resumeProgramJobs').orderBy('updatedAt','desc').limit(100).get(); assertOwner(uid); return snap.docs.map(doc=>({...normalizeJob(doc.data()),id:doc.id,updatedAt:doc.data().updatedAt})); },
    async saveJob(value, id) {
      const {uid,ref}=owner(); if(id!==undefined&&(typeof id!=='string'||!id||!/^[\w-]{1,160}$/.test(id)))throw new Error('Choose a saved application.');
      const data=normalizeJob(value); if(!data.role||!data.company)throw new Error('Add a job title and employer before saving.');
      const doc=id?ref.collection('resumeProgramJobs').doc(id):ref.collection('resumeProgramJobs').doc();
      await doc.set({...data,updatedAt:new Date().toISOString()}); assertOwner(uid); return {...data,id:doc.id};
    },
    async removeJob(id) {const {uid,ref}=owner();if(typeof id!=='string'||!/^[\w-]{1,160}$/.test(id))throw new Error('Choose a saved application.');await ref.collection('resumeProgramJobs').doc(id).delete();assertOwner(uid);},
    async letters() {const {uid,ref}=owner();const snap=await ref.collection('resumeProgramLetters').orderBy('updatedAt','desc').limit(100).get();assertOwner(uid);return snap.docs.map(doc=>({...doc.data(),id:doc.id}));},
    async saveLetter(buildId,content,title) {const {uid,ref}=owner();if(!/^[a-f0-9]{64}$/.test(buildId)||typeof content!=='string'||!content.trim()||content.length>10000)throw new Error('Open a completed build and add a cover letter of up to 10,000 characters.');await ref.collection('resumeProgramLetters').doc(buildId).set({content,title:String(title||'Cover letter').slice(0,200),buildId,updatedAt:new Date().toISOString()});assertOwner(uid);},
    async removeLetter(id) {const {uid,ref}=owner();if(typeof id!=='string'||!/^[\w-]{1,160}$/.test(id))throw new Error('Choose a saved cover letter.');await ref.collection('resumeProgramLetters').doc(id).delete();assertOwner(uid);}
  };
}
