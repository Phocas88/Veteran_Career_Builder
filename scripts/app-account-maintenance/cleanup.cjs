'use strict';
const {createHash}=require('node:crypto');
const receiptFields=['uid','createdAt','sessionId','amount','discountAmount','currency','prepaid'];
async function resetAppResumes({db,uid,slug,now=Date.now}){
 if(typeof uid!=='string'||!uid||slug!=='vcp-resume-'+createHash('sha256').update('vcp-resume-program:'+uid).digest('hex').slice(0,32))throw new Error('The authorized app owner does not match this CV.');
 const cv=db.collection('publicProfiles').doc(slug),snapshot=await cv.get();
 if(snapshot.exists&&(snapshot.data().uid!==uid||snapshot.data().source!=='vcp-resume-program'))throw new Error('The public CV belongs to another application or owner.');
 const privateAccount=db.collection('profiles').doc(uid),library=privateAccount.collection('resumeProgramResumes'),builds=db.collection('_privateResumeProgramUsers').doc(uid).collection('builds');
 const originalLibrary=await library.get(),originalBuilds=await builds.get();let children=0;
 if(originalBuilds.docs.some(doc=>doc.data().uid!==uid))throw new Error('A purchase has an unexpected owner. No data was changed.');
 // Mark each build deleted before removing children so in-flight generation
 // cannot repopulate the old input, review or career assessment.
 for(const build of originalBuilds.docs){
  await db.runTransaction(async tx=>{const current=await tx.get(build.ref);if(!current.exists)return;const data=current.data();if(data.uid!==uid)throw new Error('A purchase has an unexpected owner.');const receipt=Object.fromEntries(receiptFields.filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]]));tx.set(build.ref,{...receipt,status:'deleted',templates:[],includedTemplate:null,updatedAt:now()});});
  for(const collection of await build.ref.listCollections()){await db.recursiveDelete(collection);children++;}
 }
 await db.recursiveDelete(library);
 await db.runTransaction(async tx=>{const current=await tx.get(cv);if(current.exists&&(current.data().uid!==uid||current.data().source!=='vcp-resume-program'))throw new Error('The public CV owner changed.');if(current.exists)tx.delete(cv);});
 const resetAt=now();await privateAccount.collection('resumeProgram').doc('workspaceState').set({resetAt,scope:'saved-resumes-and-digital-cv'});
 const [remaining,checkedBuilds,checkedCv]=await Promise.all([library.get(),builds.get(),cv.get()]);
 if(remaining.size||checkedCv.exists||checkedBuilds.docs.some(doc=>doc.data().status!=='deleted'||Object.keys(doc.data()).some(key=>![...receiptFields,'status','templates','includedTemplate','updatedAt'].includes(key))))throw new Error('The app reset could not be fully verified.');
 return {savedResumesRemoved:originalLibrary.size,purchaseRecordsCleared:originalBuilds.size,childCollectionsRemoved:children,publicCvRemoved:snapshot.exists,remainingSavedResumes:remaining.size,publicCvExists:checkedCv.exists,resetAt};
}
module.exports={resetAppResumes};
