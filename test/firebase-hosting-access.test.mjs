import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createVerify} from 'node:crypto';
import {parseDeployCredential,deployAssertion,inspectFirebaseHostingAccess,requiredHostingPermissions,accessExitCode} from '../scripts/check-firebase-hosting-access.mjs';
const keys=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
const credential={type:'service_account',project_id:'example-source',client_email:'deploy@example-source.iam.gserviceaccount.com',private_key:keys.privateKey,token_uri:'https://untrusted.invalid/token'};
function mock({missing=[],tokenFailure=false,permissionFailure=false,state='ENABLED'}={}){
 const calls=[];return {calls,async fetcher(url,options){calls.push({url,options});if(url==='https://oauth2.googleapis.com/token')return Response.json(tokenFailure?{error:'PRIVATE_PROVIDER_DETAIL'}:{access_token:'PRIVATE_TEST_ACCESS_TOKEN'},{status:tokenFailure?400:200});if(url.includes(':testIamPermissions'))return Response.json(permissionFailure?{error:{message:'PRIVATE_PROVIDER_DETAIL'}}:{permissions:requiredHostingPermissions.filter(p=>!missing.includes(p))},{status:permissionFailure?403:200});return Response.json({state},{status:200});}};
}
test('bad credential JSON and private keys return fixed errors without including credential values',()=>{
 for(const value of ['PRIVATE_CREDENTIAL_VALUE','{}'])assert.throws(()=>parseDeployCredential(value),error=>error.code.startsWith('FIREBASE_')&&!error.message.includes('PRIVATE_CREDENTIAL_VALUE'));
 assert.throws(()=>deployAssertion({...credential,private_key:'PRIVATE_INVALID_KEY'}),error=>error.code==='FIREBASE_CREDENTIAL_INVALID_PRIVATE_KEY'&&!error.message.includes('PRIVATE_INVALID_KEY'));
});
test('the assertion has a bounded lifetime, a pinned Google audience and a valid signature',()=>{
 const assertion=deployAssertion(credential,1700000000000),[head,payload,signature]=assertion.split('.'),claims=JSON.parse(Buffer.from(payload,'base64url'));
 assert.equal(claims.aud,'https://oauth2.googleapis.com/token');assert.equal(claims.exp-claims.iat,3600);assert.equal(claims.iss,credential.client_email);const verifier=createVerify('RSA-SHA256');verifier.update(head+'.'+payload);assert.equal(verifier.verify(keys.publicKey,signature,'base64url'),true);
});
test('permission checks are read-only and work with a cross-project deploy account',async()=>{
 const service=mock(),report=await inspectFirebaseHostingAccess({credential,project:'example-target',fetcher:service.fetcher});assert.equal(report.ready,true);assert.equal(report.project,'example-target');assert.equal(report.credentialProject,'example-source');assert.equal(service.calls.length,3);assert.equal(service.calls.some(c=>/setIamPolicy|enable$/.test(c.url)),false);assert.ok(service.calls.every(c=>c.url.startsWith('https://')&&!c.url.includes('untrusted.invalid')));
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE_TEST_ACCESS_TOKEN|PRIVATE KEY|PRIVATE_PROVIDER_DETAIL/);
});
test('missing permission and unknown IAM results cannot be reported as ready or silently pass deployment',async()=>{
 for(const options of [{missing:['serviceusage.services.get']},{permissionFailure:true},{state:'DISABLED'}]){const service=mock(options),report=await inspectFirebaseHostingAccess({credential,project:'example-target',fetcher:service.fetcher});assert.equal(report.ready,false);assert.equal(accessExitCode(report),1);assert.equal(accessExitCode(report,{reportOnly:true}),0);if(options.missing)assert.deepEqual(report.missingPermissions,options.missing);if(options.permissionFailure)assert.equal(report.missingPermissions,null);}
});
test('Google authentication failure returns a fixed code without provider details',async()=>{
 const service=mock({tokenFailure:true});await assert.rejects(inspectFirebaseHostingAccess({credential,project:'example-target',fetcher:service.fetcher}),error=>error.code==='FIREBASE_OAUTH_AUTHENTICATION_FAILED'&&!error.message.includes('PRIVATE_PROVIDER_DETAIL'));assert.equal(service.calls.length,1);
});
