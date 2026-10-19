// A disconnected browser must read the existing build, never start a second AI
// execution or another checkout. Every read still verifies the current account.
const recoveryMessage='The connection was interrupted. Reopen this build from purchase history to recover it. No second payment is needed.';
function pause(ms,signal){
 return new Promise((resolve,reject)=>{
  signal?.throwIfAborted();
  const finish=()=>{signal?.removeEventListener('abort',abort);resolve();};
  const timer=setTimeout(finish,ms);
  const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(signal.reason);};
  signal?.addEventListener('abort',abort,{once:true});
 });
}
export async function runRecoverableBuild(api,buildId,{signal,onRecover=()=>{},wait=pause,now=Date.now,action='run',extra={}}={}){
 const deadline=now()+220000;
 try{return (await api(action,{buildId,consent:true,keepAlive:true,...extra},signal)).review;}
 catch(error){
  signal?.throwIfAborted();
  if(error.errorCode==='CLARIFICATION_UPDATE_USED')throw error;
  if(!error.recoverable&&error.status!==409)throw error;
 }
 onRecover();
 let idleReads=0;
 while(now()<deadline){
  signal?.throwIfAborted();
  let build;
  try{build=await api('get',{buildId},signal);}
  catch(error){
   signal?.throwIfAborted();
   if(!error.recoverable)throw error;
   await wait(3000,signal);continue;
  }
  if(build.lastError)throw Object.assign(new Error(build.lastError.error),{status:build.lastError.status,errorCode:build.lastError.errorCode});
  if(build.review&&(action!=='refine'||build.refinementCount>=1))return build.review;
  if(build.status==='running')idleReads=0;
  else if(++idleReads>=3)throw new Error(recoveryMessage);
  await wait(3000,signal);
 }
 throw new Error(recoveryMessage);
}
