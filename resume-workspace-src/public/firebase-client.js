// Public web configuration, copied from the existing Veteran Career Path site.
// This is not an Admin credential; Firestore rules enforce access.
const config = {
  apiKey: 'AIzaSyDEh2Aivj4q8hVITI60fLZz8uCyP6UV7Os',
  authDomain: 'veteran-career-builder.firebaseapp.com', projectId: 'veteran-career-builder',
  storageBucket: 'veteran-career-builder.firebasestorage.app',
  messagingSenderId: '664123627374', appId: '1:664123627374:web:157c9d6d7f764e12bb537f'
};
let pending;
function script(name) {
  return new Promise((resolve, reject) => {
    const node = document.createElement('script');
    node.src = `https://www.gstatic.com/firebasejs/10.7.0/firebase-${name}-compat.js`;
    node.crossOrigin = 'anonymous'; node.onload = resolve;
    node.onerror = () => { node.remove(); reject(new Error('Account services could not load. Check your connection and try again.')); };
    document.head.append(node);
  });
}
export function connectFirebase() {
  if (!pending) pending = (async () => {
    if (!window.firebase) await script('app');
    if (!window.firebase.auth) await script('auth');
    if (!window.firebase.firestore) await script('firestore');
    const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
    return { auth: app.auth(), db: app.firestore(), firebase: window.firebase };
  })().catch(error => { pending = null; throw error; });
  return pending;
}
