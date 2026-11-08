// Firebase's documented Hosting REST flow. Credentials stay in the CI runner;
// only the tested static directory is uploaded. No IAM, Auth or database writes.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createGzip} from 'node:zlib';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {parseDeployCredential,googleDeployHeaders,validateProject} from './check-firebase-hosting-access.mjs';

const api='https://firebasehosting.googleapis.com/v1beta1/';
const failure=(code,status)=>Object.assign(new Error(code),{code,...(status?{status}:{})});
const hashPattern=/^[a-f0-9]{64}$/;

function pattern(rule){
 const names=['source','regex'].filter(key=>typeof rule[key]==='string'&&rule[key]);
 if(names.length!==1)throw failure('FIREBASE_HOSTING_CONFIG_PATTERN_INVALID');
 return {[names[0]==='source'?'glob':'regex']:rule[names[0]]};
}

export function servingConfig(hosting){
 if(!hosting||Array.isArray(hosting)||hosting.public!=='.firebase-public'||JSON.stringify(hosting.ignore)!==JSON.stringify(['**/.*']))throw failure('FIREBASE_HOSTING_PUBLIC_SCOPE_INVALID');
 const supported=new Set(['public','ignore','headers','redirects','cleanUrls','trailingSlash']);
 if(Object.keys(hosting).some(key=>!supported.has(key)))throw failure('FIREBASE_HOSTING_CONFIG_UNSUPPORTED');
 const config={};
 if(hosting.headers!==undefined){
  if(!Array.isArray(hosting.headers))throw failure('FIREBASE_HOSTING_HEADERS_INVALID');
  config.headers=hosting.headers.map(rule=>{
   if(Object.keys(rule).some(key=>!['source','regex','headers'].includes(key))||!Array.isArray(rule.headers))throw failure('FIREBASE_HOSTING_HEADERS_INVALID');
   const headers={};
   for(const item of rule.headers){
    if(Object.keys(item).some(key=>!['key','value'].includes(key))||typeof item.key!=='string'||!/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(item.key)||typeof item.value!=='string'||/[\r\n]/.test(item.value)||Object.keys(headers).some(key=>key.toLowerCase()===item.key.toLowerCase()))throw failure('FIREBASE_HOSTING_HEADERS_INVALID');
    Object.defineProperty(headers,item.key,{value:item.value,enumerable:true});
   }
   return {...pattern(rule),headers};
  });
 }
 if(hosting.redirects!==undefined){
  if(!Array.isArray(hosting.redirects))throw failure('FIREBASE_HOSTING_REDIRECTS_INVALID');
  config.redirects=hosting.redirects.map(rule=>{
   if(Object.keys(rule).some(key=>!['source','regex','destination','type'].includes(key))||typeof rule.destination!=='string'||/[\r\n]/.test(rule.destination)||!Number.isInteger(rule.type)||rule.type<300||rule.type>399)throw failure('FIREBASE_HOSTING_REDIRECTS_INVALID');
   return {...pattern(rule),location:rule.destination,statusCode:rule.type};
  });
 }
 if(hosting.cleanUrls!==undefined){if(typeof hosting.cleanUrls!=='boolean')throw failure('FIREBASE_HOSTING_CONFIG_INVALID');config.cleanUrls=hosting.cleanUrls;}
 if(hosting.trailingSlash!==undefined){if(typeof hosting.trailingSlash!=='boolean')throw failure('FIREBASE_HOSTING_CONFIG_INVALID');config.trailingSlashBehavior=hosting.trailingSlash?'ADD':'REMOVE';}
 return config;
}

export async function prepareHostingFiles(root){
 const directory=path.join(path.resolve(root),'.firebase-public');
 if(!(await fsp.lstat(directory)).isDirectory())throw failure('FIREBASE_HOSTING_PUBLIC_DIRECTORY_INVALID');
 const tempDir=await fsp.mkdtemp(path.join(os.tmpdir(),'vcp-hosting-upload-'));
 const entries=[],byHash=new Map();let totalBytes=0;
 const cleanup=()=>fsp.rm(tempDir,{recursive:true,force:true});
 async function walk(relative=''){
  const children=await fsp.readdir(path.join(directory,relative),{withFileTypes:true});
  for(const child of children.sort((a,b)=>a.name.localeCompare(b.name))){
   // Honor the repository's explicit **/.* ignore rule at every depth.
   if(child.name.startsWith('.'))continue;
   if(/[\\\x00-\x1f\x7f]/.test(child.name))throw failure('FIREBASE_HOSTING_FILENAME_INVALID');
   const rel=path.join(relative,child.name),source=path.join(directory,rel);
   if(child.isSymbolicLink())throw failure('FIREBASE_HOSTING_SYMLINK_REJECTED');
   if(child.isDirectory()){await walk(rel);continue;}
   if(!child.isFile())throw failure('FIREBASE_HOSTING_FILE_TYPE_INVALID');
   const info=await fsp.lstat(source);
   if(!info.isFile()||info.size>2*1024**3||entries.length>=100000)throw failure('FIREBASE_HOSTING_FILE_LIMIT');
   const compressedFile=path.join(tempDir,entries.length+'.gz'),hasher=createHash('sha256');
   await pipeline(fs.createReadStream(source,{flags:fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW}),createGzip({level:9}),new Transform({transform(chunk,encoding,done){hasher.update(chunk);done(null,chunk);}}),fs.createWriteStream(compressedFile,{flags:'wx',mode:0o600}));
   const hash=hasher.digest('hex'),bytes=(await fsp.stat(compressedFile)).size;
   const entry={path:'/'+rel.split(path.sep).join('/'),hash,compressedFile,bytes};
   entries.push(entry);byHash.set(hash,entry);totalBytes+=info.size;
  }
 }
 try{
  await walk();
  for(const required of ['/index.html','/app.html','/app.js','/app.bundle.js','/404.html'])if(!entries.some(file=>file.path===required))throw failure('FIREBASE_HOSTING_BUILD_INCOMPLETE');
  return {entries,byHash,totalBytes,tempDir,cleanup};
 }catch(error){await cleanup();throw error;}
}

export function checkedUploadUrl(value,version){
 let url;try{url=new URL(value);}catch{throw failure('FIREBASE_HOSTING_UPLOAD_URL_INVALID');}
 if(url.protocol!=='https:'||url.host!=='upload-firebasehosting.googleapis.com'||url.username||url.password||url.search||url.hash||url.pathname!=='/upload/'+version+'/files')throw failure('FIREBASE_HOSTING_UPLOAD_URL_INVALID');
 return url.href;
}

export async function publishHostingVersion({project,config,files,headers,fetcher=fetch,onProgress=()=>{}}){
 validateProject(project);
 async function request(resource,{method='POST',body}={}){
  let response;try{response=await fetcher(api+resource,{method,headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(60000)});}catch{throw failure('FIREBASE_HOSTING_REQUEST_FAILED');}
  if(!response.ok)throw failure('FIREBASE_HOSTING_HTTP_'+response.status,response.status);
  try{return await response.json();}catch{throw failure('FIREBASE_HOSTING_RESPONSE_INVALID');}
 }
 const created=await request('sites/'+project+'/versions',{body:{config}});
 const version=created.name;
 if(typeof version!=='string'||!new RegExp('^sites/'+project+'/versions/[A-Za-z0-9_-]+$').test(version)||created.status!=='CREATED')throw failure('FIREBASE_HOSTING_VERSION_INVALID');
 const needed=new Map();
 for(let start=0;start<files.entries.length;start+=1000){
  const batch=files.entries.slice(start,start+1000),hashes=new Set(batch.map(file=>file.hash));
  const populated=await request(version+':populateFiles',{body:{files:Object.fromEntries(batch.map(file=>[file.path,file.hash]))}});
  if(populated.uploadRequiredHashes!==undefined&&!Array.isArray(populated.uploadRequiredHashes))throw failure('FIREBASE_HOSTING_HASH_RESPONSE_INVALID');
  const required=populated.uploadRequiredHashes||[];
  // A fully cached batch needs no upload endpoint or upload request.
  const url=required.length?checkedUploadUrl(populated.uploadUrl,version):null;
  for(const hash of required){
   if(!hashPattern.test(hash)||!hashes.has(hash)||!files.byHash.has(hash))throw failure('FIREBASE_HOSTING_HASH_RESPONSE_INVALID');
   needed.set(hash,url);
  }
 }
 onProgress({phase:'uploading',files:files.entries.length,uploads:needed.size});
 const queue=[...needed],workers=Array.from({length:Math.min(8,queue.length)},async()=>{
  while(queue.length){
   const [hash,url]=queue.shift(),entry=files.byHash.get(hash);let done=false;
   // Uploads are content-addressed and safe to retry; version/release creation
   // is not retried blindly when the response is unknown.
   for(let attempt=0;attempt<3&&!done;attempt++){
    const stream=fs.createReadStream(entry.compressedFile);
    try{
     const response=await fetcher(url+'/'+hash,{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(entry.bytes)},body:stream,duplex:'half',redirect:'error',signal:AbortSignal.timeout(120000)});
     if(response.ok){await response.body?.cancel();done=true;}
     else{await response.body?.cancel();if(response.status!==429&&response.status<500)throw failure('FIREBASE_HOSTING_UPLOAD_HTTP_'+response.status,response.status);}
    }catch(error){if(error.code?.startsWith('FIREBASE_HOSTING_UPLOAD_HTTP_'))throw error;}
    finally{stream.destroy();}
    if(!done&&attempt<2)await new Promise(resolve=>setTimeout(resolve,500*2**attempt));
   }
   if(!done)throw failure('FIREBASE_HOSTING_UPLOAD_FAILED');
  }
 });
 const results=await Promise.allSettled(workers);
 const rejected=results.find(result=>result.status==='rejected');if(rejected)throw rejected.reason;
 const finalized=await request(version+'?updateMask=status',{method:'PATCH',body:{status:'FINALIZED'}});
 if(finalized.name!==version||finalized.status!=='FINALIZED')throw failure('FIREBASE_HOSTING_FINALIZE_FAILED');
 const release=await request('sites/'+project+'/releases?versionName='+encodeURIComponent(version));
 if(typeof release.name!=='string'||!new RegExp('^sites/'+project+'/releases/[A-Za-z0-9_-]+$').test(release.name)||release.version?.name!==version||release.version.status!=='FINALIZED')throw failure('FIREBASE_HOSTING_RELEASE_INVALID');
 return {project,version,release:release.name,files:files.entries.length,uploadedHashes:needed.size,sourceBytes:files.totalBytes};
}

export async function deployFirebaseHosting({root=process.cwd(),project='veteran-career-builder',credential,fetcher=fetch,onProgress}={}){
 validateProject(project);
 const config=servingConfig(JSON.parse(await fsp.readFile(path.join(root,'firebase.json'),'utf8')).hosting);
 const files=await prepareHostingFiles(root);
 try{
  const headers=await googleDeployHeaders(credential,{fetcher});
  return await publishHostingVersion({project,config,files,headers,fetcher,onProgress});
 }finally{await files.cleanup();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await deployFirebaseHosting({project:process.env.FIREBASE_DEPLOY_PROJECT||'veteran-career-builder',credential:parseDeployCredential(process.env.FIREBASE_SERVICE_ACCOUNT),onProgress:progress=>console.log('FIREBASE_HOSTING_PROGRESS '+JSON.stringify(progress))});
  console.log('FIREBASE_HOSTING_RELEASE '+JSON.stringify(result));
 }catch(error){console.error('FIREBASE_HOSTING_DEPLOY_FAILED '+(/^FIREBASE_[A-Z0-9_]+$/.test(error.code||'')?error.code:'FIREBASE_HOSTING_DEPLOY_REQUEST_FAILED'));process.exitCode=1;}
}
