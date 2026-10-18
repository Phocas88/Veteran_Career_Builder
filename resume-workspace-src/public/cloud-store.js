// Firebase rules remain the security boundary. Every operation derives its path
// from the current authenticated UID; caller-supplied owner IDs are never accepted.
export function savedResumeToDraft(item = {}) {
  if (item.workspace && typeof item.workspace.resume === 'string') return item.workspace;
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
  return {
    async profile() { const { uid, ref } = owner(); const snap = await ref.get(); assertOwner(uid); return snap.exists ? snap.data() : {}; },
    async saveProfile(profile) { const { uid, ref } = owner(); await ref.set({ resumeWorkspaceProfile: profile, updatedAt: Date.now() }, { merge: true }); assertOwner(uid); },
    async list() { const { uid, ref } = owner(); const snap = await ref.collection('resumes').orderBy('createdAt', 'desc').limit(50).get(); assertOwner(uid); return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })); },
    async save(draft, title) {
      const { uid, ref } = owner();
      if (!draft.resume?.trim() || draft.resume.length > 20000) throw new Error('Add a resume of up to 20,000 characters before saving.');
      const doc = ref.collection('resumes').doc();
      // Compatible with the website’s existing My Account resume list.
      const entry = { id: doc.id, title: String(title || 'My veteran resume').trim().slice(0, 120),
        content: draft.resume, createdAt: new Date().toISOString(), date: new Date().toLocaleDateString('en-US'),
        preview: draft.resume.slice(0, 120), format: 'workspace', source: 'vcp-resume-workspace',
        workspace: draft };
      await doc.set(entry); assertOwner(uid); return entry;
    },
    async remove(id) { const { uid, ref } = owner(); if (typeof id !== 'string' || !id || id.includes('/')) throw new Error('Choose a saved resume.'); await ref.collection('resumes').doc(id).delete(); assertOwner(uid); }
  };
}
