import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {servingConfig,prepareHostingFiles,checkedUploadUrl,publishHostingVersion,deployFirebaseHosting} from '../scripts/deploy-firebase-hosting.mjs';
import {verifyFirebaseMirror} from '../scripts/verify-firebase-hosting.mjs';

const hosting=JSON.parse(await fs.readFile(new URL('../firebase.json',import.meta.url),'utf8')).hosting;
const required=['index.html','app.html','app.js','app.bundle.js','404.html'];
const project='example-target',version='sites/example-target/versions/version1';
const headers={Authorization:'Bearer PRIVATE_TEST_ACCESS_TOKEN','Content-Type':'application/json'};
async function fixture(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'vcp-hosting-test-'));await fs.mkdir(path.join(root,'.firebase-public'));
 for(const file of required)await fs.writeFile(path.join(root,'.firebase-public',file),'public contents: '+file);
 await fs.writeFile(path.join(root,'firebase.json'),JSON.stringify({hosting}));
 return root;
}
function service(files,{uploadHost,uploadStatus=200,finalStatus='FINALIZED',creationStatus=200,unknownHash=false}={}){
 const calls=[],uploads=[],batches=[];
 return {calls,uploads,batches,async fetcher(url,options={}){
  calls.push({url,method:options.method});assert.equal(options.redirect,'error');
  if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'PRIVATE_TEST_ACCESS_TOKEN'});
  if(url.endsWith('/versions'))return Response.json({name:version,status:'CREATED'},{status:creationStatus});
  if(url.endsWith(':populateFiles')){
   const batch=JSON.parse(options.body).files;batches.push(batch);assert.ok(Object.keys(batch).length<=1000);
   return Response.json({uploadUrl:(uploadHost||'https://upload-firebasehosting.googleapis.com')+'/upload/'+version+'/files',uploadRequiredHashes:unknownHash?['f'.repeat(64)]:[...new Set(Object.values(batch))]});
  }
  if(url.startsWith('https://upload-firebasehosting.googleapis.com/')){
   const chunks=[];for await(const chunk of options.body)chunks.push(chunk);const bytes=Buffer.concat(chunks),hash=url.split('/').at(-1);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);assert.equal(String(bytes.length),options.headers['Content-Length']);
   uploads.push(gunzipSync(bytes).toString());return new Response('',{status:uploadStatus});
  }
  if(options.method==='PATCH')return Response.json({name:version,status:finalStatus});
  if(url.includes('/releases?')){
   assert.equal(new URL(url).searchParams.get('versionName'),version);
   return Response.json({name:'sites/example-target/releases/release1',version:{name:version,status:'FINALIZED'}});
  }
  throw new Error('UNEXPECTED_TEST_REQUEST');
 }};
}

test('the REST configuration retains every security/cache header and permanent redirect in order',()=>{
 const config=servingConfig(hosting);
 assert.equal(config.cleanUrls,true);assert.equal(config.trailingSlashBehavior,'REMOVE');
 assert.deepEqual(config.headers,hosting.headers.map(rule=>({glob:rule.source,headers:Object.fromEntries(rule.headers.map(item=>[item.key,item.value]))})));
 assert.equal(config.headers[0].headers['Cross-Origin-Opener-Policy'],'same-origin-allow-popups');
 assert.deepEqual(config.redirects,hosting.redirects.map(rule=>({glob:rule.source,location:rule.destination,statusCode:rule.type})));
 for(const change of [{rewrites:[{source:'**',destination:'/index.html'}]},{public:'.'},{ignore:[]},{i18n:{root:'/x'}}])assert.throws(()=>servingConfig({...hosting,...change}),/FIREBASE_HOSTING_/);
});

test('only build files are prepared; hidden/private files stay out and hashes identify the actual gzip bytes',async()=>{
 const root=await fixture();let files;
 try{
  await fs.writeFile(path.join(root,'private-key.json'),'PRIVATE_OUTSIDE_BUILD');
  await fs.mkdir(path.join(root,'.firebase-public/.hidden'));await fs.writeFile(path.join(root,'.firebase-public/.hidden/private'),'PRIVATE_HIDDEN');
  await fs.writeFile(path.join(root,'.firebase-public/.env'),'PRIVATE_ENV');
  files=await prepareHostingFiles(root);assert.equal(files.entries.length,5);
  for(const entry of files.entries){const compressed=await fs.readFile(entry.compressedFile);assert.equal(createHash('sha256').update(compressed).digest('hex'),entry.hash);assert.equal(gunzipSync(compressed).toString(),'public contents: '+entry.path.slice(1));}
  const tempDir=files.tempDir;await files.cleanup();await assert.rejects(fs.stat(tempDir),{code:'ENOENT'});
 }finally{await files?.cleanup();await fs.rm(root,{recursive:true,force:true});}
});

test('an incomplete build or symlink cannot be deployed',async()=>{
 const root=await fixture();try{
  await fs.unlink(path.join(root,'.firebase-public/app.js'));await assert.rejects(prepareHostingFiles(root),/BUILD_INCOMPLETE/);
  await fs.symlink(path.join(root,'firebase.json'),path.join(root,'.firebase-public/app.js'));await assert.rejects(prepareHostingFiles(root),/SYMLINK_REJECTED/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('upload targets must be the exact Google HTTPS endpoint for the created version',()=>{
 const good='https://upload-firebasehosting.googleapis.com/upload/'+version+'/files';assert.equal(checkedUploadUrl(good,version),good);
 for(const value of [good.replace('https:','http:'),good.replace('.googleapis.com','.evil.invalid'),good.replace('version1','version2'),good+'?token=PRIVATE',good.replace('https://','https://user:pass@'),'not a url'])assert.throws(()=>checkedUploadUrl(value,version),/UPLOAD_URL_INVALID/);
});

test('the ordinary deployment uploads complete gzip files before finalization and a live release',async()=>{
 const root=await fixture();let files;try{
  files=await prepareHostingFiles(root);const remote=service(files);
  const result=await publishHostingVersion({project,config:servingConfig(hosting),files,headers,fetcher:remote.fetcher});
  assert.equal(result.files,5);assert.equal(result.uploadedHashes,5);assert.equal(remote.uploads.length,5);
  assert.equal(remote.calls.at(-2).method,'PATCH');assert.match(remote.calls.at(-1).url,/\/releases\?/);
  assert.equal(remote.calls.filter(call=>/\/releases\?/.test(call.url)).length,1);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_TEST_ACCESS_TOKEN/);
 }finally{await files?.cleanup();await fs.rm(root,{recursive:true,force:true});}
});

test('failed uploads, unexpected hashes/hosts and an unfinalized version never release partial content',async()=>{
 const root=await fixture();let files;try{
  files=await prepareHostingFiles(root);
  for(const options of [{uploadStatus:403},{uploadHost:'https://untrusted.invalid'},{unknownHash:true},{finalStatus:'CREATED'},{creationStatus:403}]){
   const remote=service(files,options);await assert.rejects(publishHostingVersion({project,config:{},files,headers,fetcher:remote.fetcher}),error=>error.code.startsWith('FIREBASE_HOSTING_')&&!error.message.includes('PRIVATE'));
   assert.equal(remote.calls.some(call=>/\/releases\?/.test(call.url)),false);
   assert.equal(remote.calls.some(call=>call.url.includes('untrusted.invalid')),false);
  }
 }finally{await files?.cleanup();await fs.rm(root,{recursive:true,force:true});}
});

test('large manifests are batched and identical content is uploaded once',async()=>{
 const root=await fixture();let files;try{
  files=await prepareHostingFiles(root);const original=files.entries[0];files.entries=Array.from({length:2001},(_,i)=>({...original,path:'/file'+i}));
  const remote=service(files),result=await publishHostingVersion({project,config:{},files,headers,fetcher:remote.fetcher});
  assert.deepEqual(remote.batches.map(batch=>Object.keys(batch).length),[1000,1000,1]);assert.equal(result.files,2001);assert.equal(remote.uploads.length,1);
 }finally{await files?.cleanup();await fs.rm(root,{recursive:true,force:true});}
});

test('the full publisher uses the existing credential only for Google and cleans temporary compressed files',async()=>{
 const root=await fixture(),before=(await fs.readdir(os.tmpdir())).filter(name=>name.startsWith('vcp-hosting-upload-'));
 try{
  const keys=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
  const credential={type:'service_account',client_email:'deploy@example-target.iam.gserviceaccount.com',private_key:keys.privateKey};
  const remote=service(null);await deployFirebaseHosting({root,project,credential,fetcher:remote.fetcher});
  assert.equal(remote.calls[0].url,'https://oauth2.googleapis.com/token');
  const failed=service(null,{creationStatus:403});await assert.rejects(deployFirebaseHosting({root,project,credential,fetcher:failed.fetcher}),/HTTP_403/);
  assert.deepEqual((await fs.readdir(os.tmpdir())).filter(name=>name.startsWith('vcp-hosting-upload-')),before);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('public verification checks the built release bytes and authentication-compatible security headers',async()=>{
 const root=await fixture();
 try{
  await fs.mkdir(path.join(root,'.firebase-public/resumereview'));
  for(const file of ['index.html','cozy.css','digital-cv.js','skill-organization.js'])await fs.writeFile(path.join(root,'.firebase-public/resumereview',file),'public '+file);
  const expectedHeaders=Object.fromEntries(hosting.headers[0].headers.map(item=>[item.key,item.value]));
  function fetcher({stale=false,badHeader=false}={}){return async url=>{
   assert.equal(url.origin,'https://example-target.web.app');assert.ok(url.searchParams.get('release'));
   const body=await fs.readFile(path.join(root,'.firebase-public',url.pathname));
   return new Response(stale?'OLD_RELEASE':body,{headers:{...expectedHeaders,...(badHeader?{'Cross-Origin-Opener-Policy':'same-origin'}:{})}});
  };}
  const result=await verifyFirebaseMirror({root,project,fetcher:fetcher()});assert.equal(result.files,8);assert.equal(result.securityHeadersMatch,true);
  await assert.rejects(verifyFirebaseMirror({root,project,fetcher:fetcher({stale:true})}),/release mismatch/);
  await assert.rejects(verifyFirebaseMirror({root,project,fetcher:fetcher({badHeader:true})}),/header mismatch/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
