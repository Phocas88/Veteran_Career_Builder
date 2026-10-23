import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { hostingAccessToken,prepareHostingDomains,domainSummary,instructionsForDomains } from '../scripts/prepare-hosting-domains.mjs';

const keys=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const credentialJson=JSON.stringify({client_email:'fixture@example.invalid',private_key:keys.privateKey.export({type:'pkcs8',format:'pem'})});
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});

test('the existing CI credential signs a short-lived request without exposing the key',async()=>{
 const token=await hostingAccessToken(credentialJson,async(url,options)=>{
  assert.equal(url,'https://oauth2.googleapis.com/token');
  const [header,payload,signature]=options.body.get('assertion').split('.');
  assert.ok(crypto.verify('RSA-SHA256',Buffer.from(header+'.'+payload),keys.publicKey,Buffer.from(signature,'base64url')));
  const claims=JSON.parse(Buffer.from(payload,'base64url'));
  assert.equal(claims.exp-claims.iat,300);assert.equal(claims.scope,'https://www.googleapis.com/auth/firebase');
  assert.ok(!options.body.toString().includes('PRIVATE KEY'));
  return response({access_token:'fixture-oauth-token'});
 });
 assert.equal(token,'fixture-oauth-token');
});

test('existing custom domains are only read and never reconfigured',async()=>{
 const calls=[];const result=await prepareHostingDomains({credentialJson,fetcher:async(url,options)=>{
  calls.push({url,method:options.method});
  if(url.includes('oauth2.googleapis.com'))return response({access_token:'fixture-token'});
  assert.equal(options.method,'GET');return response({name:url.split('/v1beta1/')[1],hostState:'HOST_ACTIVE',cert:{state:'CERT_ACTIVE'}});
 }});
 assert.equal(result.length,2);assert.equal(calls.filter(x=>x.method==='POST').length,1);assert.equal(result[0].certificate,'CERT_ACTIVE');
});

test('only the two known domains can be prepared and no DNS provider is modified',async()=>{
 const created=new Set(),calls=[];
 const result=await prepareHostingDomains({credentialJson,wait:async()=>{},fetcher:async(url,options)=>{
  calls.push({url,method:options.method});
  if(url.includes('oauth2.googleapis.com'))return response({access_token:'fixture-token'});
  assert.ok(url.startsWith('https://firebasehosting.googleapis.com/'));
  const u=new URL(url);const domain=u.searchParams.get('customDomainId')||u.pathname.split('/').at(-1);
  assert.ok(['veterancareerpath.com','www.veterancareerpath.com'].includes(domain));
  if(options.method==='POST'){created.add(domain);return response({name:'operation'});}
  return created.has(domain)?response({name:'projects/site/customDomains/'+domain}):response({},404);
 }});
 assert.equal(result.length,2);assert.equal(created.size,2);assert.ok(calls.every(x=>['GET','POST'].includes(x.method)));
});

test('DNS instructions preserve unrelated records and separate certificate verification from routing',()=>{
 const row={requiredAction:'ADD',domainName:'_acme-challenge.veterancareerpath.com',type:'TXT',rdata:'public-proof'};
 const summary=domainSummary({name:'site/customDomains/veterancareerpath.com',cert:{state:'CERT_VALIDATING',verification:{dns:{desired:[{records:[row,row,{...row,requiredAction:'NONE'}]}]}}}});
 assert.equal(summary.records.length,1);assert.equal(summary.records[0].phase,'certificate');
 const instructions=instructionsForDomains([summary]);assert.match(instructions,/Preserve MX/);assert.match(instructions,/Keep the current website A\/CNAME/);assert.match(instructions,/CERT_ACTIVE/);
});

test('authentication errors stay bounded and never echo provider contents or credentials',async()=>{
 await assert.rejects(hostingAccessToken(credentialJson,async()=>response({error:'private-provider-content'},401)),error=>/HTTP 401/.test(error.message)&&!error.message.includes('private-provider-content'));
 await assert.rejects(hostingAccessToken('not-json'),/unavailable or malformed/);
});
