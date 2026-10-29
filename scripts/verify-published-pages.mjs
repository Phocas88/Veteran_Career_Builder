// Only public pages and an unauthenticated authorization check. No user records.
const base='https://veterancareerpath.com';
const checks=[
 ['/resumereview/','VCP Resume'],
 ['/resumereview/analytics-guide.html','G-CMFKLT321J'],
 ['/admin.html','admin-billing.js?v=20261029-admin'],
 ['/admin-billing.js','/api/admin-subscribers'],
];
for(let attempt=0;attempt<12;attempt++){
 try{
  for(const [path,expected]of checks){const response=await fetch(base+path+'?release='+(process.env.GITHUB_SHA||'admin-reporting'),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok||!(await response.text()).includes(expected))throw new Error('Waiting for '+path);}
  const api=await fetch('https://vcp-proxy.vercel.app/api/admin-subscribers',{headers:{Origin:base},signal:AbortSignal.timeout(15000)});
  if(api.status!==401||(await api.json()).error!=='missing_token'||api.headers.get('cache-control')!=='no-store')throw new Error('Waiting for the protected subscriber route');
  console.log('PUBLISHED_ADMIN_CHECK '+JSON.stringify({publicPages:checks.length,appAvailable:true,guideAvailable:true,billingRouteProtected:true,privateRecordsRead:false}));break;
 }catch(error){if(attempt===11)throw error;console.log(error.message);await new Promise(resolve=>setTimeout(resolve,10000));}
}
