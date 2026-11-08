// Read-only release verification against Firebase's default public mirror URL.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateProject} from './check-firebase-hosting-access.mjs';

const publicFiles=['index.html','app.html','app.js','app.bundle.js','resumereview/index.html','resumereview/cozy.css','resumereview/digital-cv.js','resumereview/skill-organization.js'];
const securityHeaders=['Content-Security-Policy','X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Cross-Origin-Opener-Policy'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function verifyFirebaseMirror({root=process.cwd(),project='veteran-career-builder',fetcher=fetch,release=process.env.GITHUB_SHA||'release-check'}={}){
 validateProject(project);
 const hosting=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8')).hosting;
 const expected=Object.fromEntries(hosting.headers.find(rule=>rule.source==='**').headers.map(item=>[item.key,item.value]));
 for(const file of publicFiles){
  // Use the canonical clean URL. Firebase's /index.html?query redirect can
  // return a query-only Location, which loops back to that same filename.
  let route='/'+file;
  if(hosting.cleanUrls)route=route.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'');
  if(hosting.trailingSlash===false&&route!=='/')route=route.replace(/\/$/,'');
  const url=new URL(route,'https://'+project+'.web.app');url.searchParams.set('release',release);
  const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==digest(fs.readFileSync(path.join(root,'.firebase-public',file))))throw new Error('Firebase mirror release mismatch: '+file);
  for(const header of securityHeaders)if(!expected[header]||response.headers.get(header)!==expected[header])throw new Error('Firebase mirror header mismatch: '+header);
 }
 return {project,files:publicFiles.length,releaseBytesMatch:true,securityHeadersMatch:true};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 for(let attempt=0;attempt<12;attempt++){
  try{console.log('FIREBASE_MIRROR_CHECK '+JSON.stringify(await verifyFirebaseMirror()));break;}
  catch(error){if(attempt===11)throw error;console.log(error.message);await new Promise(resolve=>setTimeout(resolve,10000));}
 }
}
