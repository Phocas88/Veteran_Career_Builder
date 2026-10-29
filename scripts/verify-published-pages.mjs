// Only public pages and an unauthenticated authorization check. No user records.
const base='https://veterancareerpath.com';
const checks=[
 ['/resumereview/','id="usage-analytics-description"'],
 ['/resumereview/analytics-guide.html','G-CMFKLT321J'],
 ['/admin.html','admin-billing.js?v=20261029-admin'],
 ['/admin-billing.js','/api/admin-subscribers'],
 ['/admin-resume.js','renderFeedback'],
 ['/resumereview/analytics.js','privacyChoicePending'],
 ['/resumereview/completion-prompt.js','feedback-submit'],
 ['/resumereview/completion-prompt.css','.completion-stars'],
];
for(let attempt=0;attempt<12;attempt++){
 try{
  for(const [path,expected]of checks){const response=await fetch(base+path+'?release='+(process.env.GITHUB_SHA||'admin-reporting'),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok||!(await response.text()).includes(expected))throw new Error('Waiting for '+path);}
  const api=await fetch('https://vcp-proxy.vercel.app/api/admin-subscribers',{headers:{Origin:base},signal:AbortSignal.timeout(15000)});
  if(api.status!==401||(await api.json()).error!=='missing_token'||api.headers.get('cache-control')!=='no-store')throw new Error('Waiting for the protected subscriber route');
  const report=await fetch('https://vcp-proxy.vercel.app/api/admin-resume',{headers:{Origin:base},signal:AbortSignal.timeout(15000)});if(report.status!==401||(await report.json()).error!=='missing_token')throw new Error('Waiting for protected app reports');
  const feedback=await fetch('https://vcp-proxy.vercel.app/api/claude',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({workspace:true,action:'feedback-submit',buildId:'a'.repeat(64),rating:5,comment:''}),signal:AbortSignal.timeout(15000)});if(feedback.status!==401)throw new Error('Waiting for protected feedback submission');
  const collector=await fetch('https://vcp-proxy.vercel.app/api/resume-activity',{headers:{Origin:'https://vcp-proxy.vercel.app'},signal:AbortSignal.timeout(15000)});if(collector.status!==405)throw new Error('Waiting for aggregate activity route');
  console.log('PUBLISHED_ADMIN_CHECK '+JSON.stringify({publicPages:checks.length,appAvailable:true,guideAvailable:true,billingRouteProtected:true,appReportsProtected:true,aggregateRouteAvailable:true,completionAvailable:true,feedbackProtected:true,privateRecordsRead:false}));break;
 }catch(error){if(attempt===11)throw error;console.log(error.message);await new Promise(resolve=>setTimeout(resolve,10000));}
}
