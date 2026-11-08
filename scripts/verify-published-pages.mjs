// Public release files and unauthenticated authorization checks. No user records.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {protectHtml} from './security-headers.mjs';
import {searchPages,siteSchema,jsonLd,renderSearchPage} from '../resume-website-src/search-pages.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mainOrigin='https://veterancareerpath.com',resumeOrigin='https://veteranresumes.com',apiOrigin='https://vcp-proxy.vercel.app';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const publicFiles=['digital-cv.js','cv-content.js','skill-organization.js','app-install.js','app-worker.js','manifest.webmanifest','offline.html','app-shell.js','cover-letters.js','analytics-guide.html','analytics.js','completion-prompt.js','completion-prompt.css'];

export function expectedPublishedFiles(sourceRoot=root){
 const read=relative=>fs.readFileSync(path.join(sourceRoot,relative));
 const records=[];
 const add=(url,bytes)=>records.push({url,sha256:digest(bytes)});
 const publicFile=file=>'resume-workspace-src/public/'+file;
 const entry=read(publicFile('index.html')).toString().replace('</head>','<link rel="canonical" href="'+mainOrigin+'/resumereview/">\n</head>');
 add(mainOrigin+'/resumereview/',protectHtml(entry));
 // Compare release bytes instead of old version strings and private function names.
 for(const file of publicFiles){const bytes=read(publicFile(file));add(mainOrigin+'/resumereview/'+file,file.endsWith('.html')?protectHtml(bytes.toString()):bytes);}
 for(const file of ['admin.html','admin-billing.js','admin-resume.js','index.html']){const bytes=read(file);add(mainOrigin+'/'+(file==='index.html'?'':file),file.endsWith('.html')?protectHtml(bytes.toString()):bytes);}
 const landing=read('resume-website-src/index.html').toString().replace('</head>',jsonLd(siteSchema(resumeOrigin))+'</head>');
 add(resumeOrigin+'/',protectHtml(landing));
 for(const page of searchPages)add(resumeOrigin+'/'+page.slug+'/',protectHtml(renderSearchPage(page,landing,resumeOrigin)));
 return records;
}

export async function verifyPublishedRelease({files=expectedPublishedFiles(),fetcher=fetch,release=process.env.GITHUB_SHA||'release-check'}={}){
 for(const file of files){
  const url=new URL(file.url);url.searchParams.set('release',release);
  const response=await fetcher(url.href,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==file.sha256)throw new Error('Published release does not match: '+file.url);
 }
 async function protectedRoute(endpoint,{method='GET',body,cache=false}={}){
  const response=await fetcher(apiOrigin+endpoint,{method,headers:{Origin:mainOrigin,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(response.status!==401||(cache&&response.headers.get('cache-control')!=='no-store'))throw new Error('Authorization check failed: '+endpoint);
  const result=await response.json();if(result.error!=='missing_token')throw new Error('Authorization check failed: '+endpoint);
 }
 await protectedRoute('/api/admin-subscribers',{cache:true});
 await protectedRoute('/api/admin-resume');
 await protectedRoute('/api/claude',{method:'POST',body:{workspace:true,action:'feedback-submit',buildId:'a'.repeat(64),rating:5,comment:''}});
 await protectedRoute('/api/claude',{method:'POST',body:{workspace:true,action:'letter-list'}});
 const collector=await fetcher(apiOrigin+'/api/resume-activity',{headers:{Origin:apiOrigin},signal:AbortSignal.timeout(15000)});if(collector.status!==405)throw new Error('Aggregate activity method check failed');
 return {publicPages:files.length,releaseBytesMatch:true,billingRouteProtected:true,appReportsProtected:true,letterPurchasesProtected:true,feedbackProtected:true,aggregateRouteAvailable:true,privateRecordsRead:false};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 for(let attempt=0;attempt<12;attempt++){
  try{console.log('PUBLISHED_RELEASE_CHECK '+JSON.stringify(await verifyPublishedRelease()));break;}
  catch(error){if(attempt===11)throw error;console.log(error.message);await new Promise(resolve=>setTimeout(resolve,10000));}
 }
}
