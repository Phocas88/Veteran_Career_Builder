'use strict';
const admin=require('/tmp/vcp-reset/node_modules/firebase-admin');
const {resetAppResumes}=require('./cleanup.cjs');
// This UID was verified against the account email supplied by the owner using
// the read-only inspection run. No email or resume text is stored in this script.
const uid='EB2pJNb1p7Ra33HHlchA6V0qdM72',slug='vcp-resume-815b82f2047852dc5a96e5649af51217';
(async()=>{
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT;if(!raw)throw new Error('Maintenance credential unavailable.');
 const credentials=JSON.parse(raw.trim().startsWith('{')?raw:Buffer.from(raw,'base64').toString());
 if(credentials.project_id!=='veteran-career-builder')throw new Error('Wrong Firebase project.');
 if(credentials.private_key?.includes('\\n'))credentials.private_key=credentials.private_key.replace(/\\n/g,'\n');
 admin.initializeApp({credential:admin.credential.cert(credentials),projectId:credentials.project_id});
 const user=await admin.auth().getUser(uid);if(!user.email)throw new Error('The previously verified account no longer has a login email.');
 const result=await resetAppResumes({db:admin.firestore(),uid,slug});
 await admin.auth().getUser(uid);console.log('APP_RESET_VERIFIED '+JSON.stringify({...result,signInPreserved:true}));
 const response=await fetch('https://profiles.veterancareerpath.com/veteran/'+slug+'?reset='+result.resetAt,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});if(response.status!==404)throw new Error('The removed public CV has not yet returned 404.');console.log('PUBLIC_CV_REMOVAL_VERIFIED HTTP 404');await admin.app().delete();
})().catch(error=>{console.error('Authorized app reset could not finish. Code: '+(error.code||error.message));process.exitCode=1;});
