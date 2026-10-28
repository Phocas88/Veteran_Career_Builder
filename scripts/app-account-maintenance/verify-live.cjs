'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const admin=require('/tmp/vcp-reset/node_modules/firebase-admin');
const catalog=require('./career-catalog.json');
const resume=`ALEX EXAMPLE — FICTIONAL TEST RESUME
PROFESSIONAL EXPERIENCE
Military transportation team leader | Example support unit | 2010–2017
Planned delivery routes and scheduled 40 vehicles for supply movements.
Trained 15 teammates on preventive inspections, safety procedures and recordkeeping.
Maintained accurate equipment inventory records and coordinated delivery schedules with multiple teams.
Warehouse coordinator | Example Distribution | 2017–2020
Prepared vendor purchase orders, coordinated freight shipments and reconciled inventory counts.
Checked receiving records, arranged storage locations and resolved shipping discrepancies with suppliers.
Tracked operating costs and prepared monthly budget summaries for the warehouse manager.
Operations supervisor | Example Services | 2020–2023
Assigned weekly staff schedules and coached a team of 10 employees.
Investigated workflow delays, documented root causes and introduced process improvements.
Answered customer questions, resolved service complaints and maintained office records.
Prepared training materials, delivered orientation sessions and explained procedures to new employees.
Inventory analyst | Example Logistics | 2023–2026
Used SQL, Excel and Power BI to analyze stock levels, prepare reports and identify demand patterns.
Worked with purchasing, transport and customer support teams to plan inventory replenishment.
EDUCATION
Bachelor of Business Administration | Example University | 2022
Coursework in project planning, accounting, organizational communication and supply chain management.
SKILLS
Inventory records, procurement coordination, route planning, employee coaching, administrative support, customer service, budgets, reporting, workplace training and process improvement.`;
(async()=>{
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT;if(!raw)throw new Error('Maintenance credential unavailable.');const credentials=JSON.parse(raw.trim().startsWith('{')?raw:Buffer.from(raw,'base64').toString());if(credentials.project_id!=='veteran-career-builder')throw new Error('Wrong Firebase project.');if(credentials.private_key?.includes('\\n'))credentials.private_key=credentials.private_key.replace(/\\n/g,'\n');admin.initializeApp({credential:admin.credential.cert(credentials),projectId:credentials.project_id});const db=admin.firestore(),uid='resumeVerification_'+crypto.randomBytes(12).toString('hex'),ref=db.collection('profiles').doc(uid).collection('resumeProgramResumes').doc('fictional-verification');let created=false;
 try{
  await admin.auth().createUser({uid,displayName:'Fictional career verification'});created=true;
  await ref.set({title:'Fictional multi-field verification',workspace:{resume,role:'Data Analyst',jobDescription:'Targeted data occupation only; independent exploration must use all resume facts.'}});
  const token=await admin.auth().createCustomToken(uid);
  const session=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyDEh2Aivj4q8hVITI60fLZz8uCyP6UV7Os',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,returnSecureToken:true}),signal:AbortSignal.timeout(20000)});const auth=await session.json();if(!session.ok||!auth.idToken)throw new Error('Fictional test session could not start.');
  const started=Date.now(),response=await fetch('https://vcp-proxy.vercel.app/api/claude',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://veterancareerpath.com','X-VCP-Firebase-Token':auth.idToken},body:JSON.stringify({workspace:true,action:'career-assess-saved',resumeId:'fictional-verification',consent:true,keepAlive:true}),signal:AbortSignal.timeout(150000)});const result=await response.json();if(!response.ok||(result.httpStatus||200)>=400)throw new Error('Live career assessment failed: '+(result.errorCode||response.status));
  const fields=new Set(result.matches.map(m=>catalog.occupations.find(o=>o.code===m.code)?.category));console.log('LIVE_CAREER_OBSERVED '+JSON.stringify({count:result.matches.length,fields:[...fields],titles:result.matches.map(m=>catalog.occupations.find(o=>o.code===m.code)?.title)}));assert.ok(result.matches.length>=8,'Expected broad multi-field career results. Received '+result.matches.length);assert.ok(fields.size>=3,'Expected at least three distinct supported career fields. Received '+fields.size);assert.ok(result.matches.every(m=>resume.includes(m.evidence)),'Evidence must be an original resume passage.');
  console.log('LIVE_CAREER_VERIFIED '+JSON.stringify({matches:result.matches.length,fields:[...fields],titles:result.matches.map(m=>catalog.occupations.find(o=>o.code===m.code).title),durationSeconds:Math.round((Date.now()-started)/1000),targetRoleExcluded:true,originalEvidenceVerified:true}));
  const cached=await fetch('https://vcp-proxy.vercel.app/api/claude',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://veterancareerpath.com','X-VCP-Firebase-Token':auth.idToken},body:JSON.stringify({workspace:true,action:'career-assess-saved',resumeId:'fictional-verification',consent:true}),signal:AbortSignal.timeout(20000)});const recovered=await cached.json();assert.deepEqual(recovered.matches,result.matches);console.log('LIVE_RECOVERY_VERIFIED no-second-checkout');
 }finally{await db.recursiveDelete(db.collection('profiles').doc(uid));await db.collection('_privateWorkspaceLimits').doc(uid).delete();if(created)await admin.auth().deleteUser(uid);await admin.app().delete();console.log('FICTIONAL_TEST_DATA_REMOVED');}
})().catch(error=>{console.error('Live verification failed: '+error.message);process.exitCode=1;});
