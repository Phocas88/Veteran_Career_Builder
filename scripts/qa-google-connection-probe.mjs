import {createSign} from 'node:crypto';
import {parseDeployCredential} from './check-firebase-hosting-access.mjs';
const credential=parseDeployCredential(process.env.FIREBASE_SERVICE_ACCOUNT);
const site='https://veteranresumes.com/';
const knownReasons=new Set(['PERMISSION_DENIED','SERVICE_DISABLED','ACCESS_TOKEN_SCOPE_INSUFFICIENT','INSUFFICIENT_AUTHENTICATION_SCOPES','accessNotConfigured','forbidden','insufficientPermissions','invalid_grant','unauthorized_client','userRateLimitExceeded','invalid_scope']);
function reason(body){const value=body?.error?.details?.find(v=>typeof v.reason==='string')?.reason||body?.error?.errors?.[0]?.reason||body?.error?.status||body?.error;return knownReasons.has(value)?value:'UNCLASSIFIED_PROVIDER_DENIAL';}
async function token(scope){
 const now=Math.floor(Date.now()/1000),encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const input=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:credential.client_email,scope,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+300});
 const signature=createSign('RSA-SHA256').update(input).sign(credential.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:input+'.'+signature}),redirect:'error',signal:AbortSignal.timeout(15000)});
 const b=await r.json();if(!r.ok||typeof b.access_token!=='string')return {failed:true,status:r.status,reason:reason(b)};return {headers:{Authorization:'Bearer '+b.access_token,'Content-Type':'application/json'}};
}
async function inspect(name,scope,url,method='GET',body){
 const auth=await token(scope);if(auth.failed){console.log('GOOGLE_CONNECTION '+JSON.stringify({name,authentication:false,status:auth.status,reason:auth.reason}));return;}
 const r=await fetch(url,{method,headers:auth.headers,...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});let b={};try{b=await r.json();}catch{}
 const result={name,authentication:true,status:r.status,...(!r.ok?{reason:reason(b)}:{})};
 if(r.ok&&name==='site-verification'){
  const match=typeof b.token==='string'&&b.token.match(/<meta\s+name=["']google-site-verification["']\s+content=["']([A-Za-z0-9_-]{10,300})["']/i);
  result.publicTokenAvailable=!!match;if(match)console.log('PUBLIC_SEARCH_VERIFICATION_TOKEN '+match[1]);
 }
 if(r.ok&&name==='search-console')result.permission=['siteOwner','siteFullUser','siteRestrictedUser','siteUnverifiedUser'].includes(b.permissionLevel)?b.permissionLevel:'UNKNOWN';
 if(r.ok&&name==='adsense'){const row=(b.sites||[]).find(s=>s.domain==='veteranresumes.com');result.siteFound=!!row;result.morePages=!!b.nextPageToken;if(row)result.siteState=['READY','REQUIRES_REVIEW','GETTING_READY','NEEDS_ATTENTION'].includes(row.state)?row.state:'UNKNOWN';}
 console.log('GOOGLE_CONNECTION '+JSON.stringify(result));
}
for(const operation of [
 ['site-verification','https://www.googleapis.com/auth/siteverification','https://www.googleapis.com/siteVerification/v1/token','POST',{site:{type:'SITE',identifier:site},verificationMethod:'META'}],
 ['search-console','https://www.googleapis.com/auth/webmasters.readonly','https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(site)],
 ['adsense','https://www.googleapis.com/auth/adsense.readonly','https://adsense.googleapis.com/v2/accounts/pub-4999040528510137/sites?pageSize=100']
]){try{await inspect(...operation);}catch{console.log('GOOGLE_CONNECTION '+JSON.stringify({name:operation[0],requestFailed:true}));}}
