// Firebase rules remain the security boundary. Every operation derives its path
// from the current authenticated UID; caller-supplied owner IDs are never accepted.
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
