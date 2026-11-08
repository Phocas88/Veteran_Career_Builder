// Uses the existing deploy credential only in the CI runner. Never log keys,
// assertions, access tokens, raw provider responses or credential JSON.
import {createSign} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// These are the permissions used by our Hosting REST publisher. It does not
// inspect Service Usage, list API keys, change IAM or deploy other services.
export const requiredHostingPermissions=['firebasehosting.sites.get','firebasehosting.sites.update'];
const oauthUrl='https://oauth2.googleapis.com/token';
const failure=code=>Object.assign(new Error(code),{code});

export function parseDeployCredential(value){
 let credential;try{credential=JSON.parse(value||'');}catch{throw failure('FIREBASE_CREDENTIAL_INVALID_JSON');}
 if(credential?.type!=='service_account'||typeof credential.private_key!=='string'||!credential.private_key.includes('PRIVATE KEY')||!/^[-a-zA-Z0-9._+]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(credential.client_email||''))throw failure('FIREBASE_CREDENTIAL_INVALID_SERVICE_ACCOUNT');
 return credential;
}

export function deployAssertion(credential,now=Date.now()){
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),issued=Math.floor(now/1000);
 const input=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:credential.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud:oauthUrl,iat:issued,exp:issued+3600});
 try{const signer=createSign('RSA-SHA256');signer.update(input);return input+'.'+signer.sign(credential.private_key,'base64url');}catch{throw failure('FIREBASE_CREDENTIAL_INVALID_PRIVATE_KEY');}
}

export function validateProject(project){
 if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project))throw failure('FIREBASE_TARGET_PROJECT_INVALID');
 return project;
}

export async function googleDeployHeaders(credential,{fetcher=fetch,now=Date.now()}={}){
 let tokenResponse;try{tokenResponse=await fetcher(oauthUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:deployAssertion(credential,now)}).toString(),redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw failure('FIREBASE_OAUTH_REQUEST_FAILED');}
 let token;try{token=await tokenResponse.json();}catch{throw failure('FIREBASE_OAUTH_RESPONSE_INVALID');}
 if(!tokenResponse.ok||typeof token.access_token!=='string'||!token.access_token)throw failure('FIREBASE_OAUTH_AUTHENTICATION_FAILED');
 return {Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
}

export async function inspectFirebaseHostingAccess({credential,project='veteran-career-builder',fetcher=fetch,now=Date.now()}={}){
 validateProject(project);
 const headers=await googleDeployHeaders(credential,{fetcher,now});
 const permissionResponse=await fetcher('https://cloudresourcemanager.googleapis.com/v1/projects/'+project+':testIamPermissions',{method:'POST',headers,body:JSON.stringify({permissions:requiredHostingPermissions}),redirect:'error',signal:AbortSignal.timeout(15000)});
 let permissionBody={};try{permissionBody=await permissionResponse.json();}catch{/* Report a bounded failure, not raw Google output. */}
 const tested=permissionResponse.ok&&Array.isArray(permissionBody.permissions),granted=new Set(tested?permissionBody.permissions:[]);
 const siteResponse=await fetcher('https://firebasehosting.googleapis.com/v1beta1/projects/'+project+'/sites/'+project,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
 let site={};try{site=await siteResponse.json();}catch{/* Unknown results never pass. */}
 const siteAccessible=siteResponse.ok&&typeof site.name==='string'&&/^projects\/[a-z0-9-]+\/sites\/[a-z0-9-]+$/.test(site.name)&&site.name.endsWith('/sites/'+project);
 const report={project,serviceAccount:credential.client_email,credentialProject:credential.project_id||null,authentication:'accepted',deploymentMethod:'hosting-rest-api',permissionTestStatus:permissionResponse.status,permissionsTested:tested,missingPermissions:tested?requiredHostingPermissions.filter(p=>!granted.has(p)):null,hostingSiteStatus:siteResponse.status,siteAccessible};
 report.ready=tested&&report.missingPermissions.length===0&&siteAccessible;return report;
}

export function accessExitCode(report,{reportOnly=false}={}){return reportOnly||report.ready?0:1;}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const report=await inspectFirebaseHostingAccess({credential:parseDeployCredential(process.env.FIREBASE_SERVICE_ACCOUNT),project:process.env.FIREBASE_DEPLOY_PROJECT||'veteran-career-builder'});
  console.log('FIREBASE_HOSTING_ACCESS '+JSON.stringify(report));
  console.log('FIREBASE_DEPLOY_ACCOUNT '+report.serviceAccount);
  for(const permission of report.missingPermissions||[])console.log('FIREBASE_MISSING_PERMISSION '+permission);
  if(!report.ready)console.log('::warning::Firebase Hosting access needs attention. See the safe permission report above; credentials were not printed.');
  process.exitCode=accessExitCode(report,{reportOnly:process.argv.includes('--report-only')});
 }catch(error){console.error('FIREBASE_HOSTING_ACCESS_FAILED '+(error.code?.startsWith('FIREBASE_')?error.code:'FIREBASE_ACCESS_REQUEST_FAILED'));process.exitCode=1;}
}
