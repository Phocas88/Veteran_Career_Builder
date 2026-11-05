import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {protectHtml,enforcedCsp,referrerPolicy} from './security-headers.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export function standaloneOrigin(value=''){
 if(!value)return '';
 try{const raw=value.trim().replace(/\/$/,''),url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||url.port||url.origin!==raw)throw new Error();return url.origin;}
 catch{throw new Error('VCP_APP_ORIGIN must be an exact HTTPS origin, such as https://resume.example.');}
}
export function buildStandaloneResume({source=path.join(root,'resume-workspace-src/public'),output=path.join(os.tmpdir(),'vcp-resume-standalone'),origin=process.env.VCP_APP_ORIGIN||''}={}){
 const appOrigin=standaloneOrigin(origin),required=['index.html','app.js','app-install.js','app-install.css','app-worker.js','offline.html','manifest.webmanifest','app-icon-192.png','app-icon-512.png','app-icon-maskable-512.png','apple-touch-icon.png','vendor/pdf.mjs','vendor/pdf.worker.mjs','vendor/pdf-export.mjs','vendor/word-export.mjs','service-library-data.json'];
 for(const file of required)if(!fs.existsSync(path.join(source,file)))throw new Error('Build the resume workspace first. Missing public asset: '+file);
 const sourcePath=path.resolve(source),outputPath=path.resolve(output);if(outputPath===sourcePath||outputPath.startsWith(sourcePath+path.sep)||sourcePath.startsWith(outputPath+path.sep)||outputPath===path.parse(outputPath).root)throw new Error('Choose a separate output directory for the standalone app.');
 const allowed=new Set(['.html','.js','.mjs','.css','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.gif','.ttf','.woff','.woff2','.wasm','.bcmap','.pfb','.txt']);
 fs.rmSync(outputPath,{recursive:true,force:true});fs.cpSync(sourcePath,outputPath,{recursive:true,filter:file=>{
  const relative=path.relative(sourcePath,file);if(!relative)return true;if(relative.split(path.sep).some(part=>part.startsWith('.')||['node_modules','api','test','scripts'].includes(part)))return false;
  const stat=fs.lstatSync(file);if(stat.isSymbolicLink())return false;return stat.isDirectory()||allowed.has(path.extname(file).toLowerCase());
 }});
 const index=path.join(outputPath,'index.html');let html=fs.readFileSync(index,'utf8').replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi,'');
 if(appOrigin){html=html.replace('</head>','<link rel="canonical" href="'+appOrigin+'/">\n</head>').replace('value="https://veterancareerpath.com/resumereview/"','value="'+appOrigin+'/"');const share=path.join(outputPath,'completion-prompt.js');if(fs.existsSync(share))fs.writeFileSync(share,fs.readFileSync(share,'utf8').replace("export const APP_SHARE_URL='https://veterancareerpath.com/resumereview/';","export const APP_SHARE_URL='"+appOrigin+"/';"));}
 fs.writeFileSync(index,protectHtml(html));
 fs.writeFileSync(path.join(outputPath,'vercel.json'),JSON.stringify({headers:[{source:'/(.*)',headers:[{key:'Content-Security-Policy',value:enforcedCsp},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:referrerPolicy}]},{source:'/app-worker.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'}]},{source:'/manifest.webmanifest',headers:[{key:'Cache-Control',value:'no-cache'}]}]},null,2)+'\n');
 fs.writeFileSync(path.join(outputPath,'DEPLOYMENT-READINESS.txt'),'VCP Resume standalone website bundle\n'+(appOrigin?'Target: '+appOrigin+'\n':'No custom domain has been selected or connected.\n')+'\nDomain connection and purchase have not been performed. Before launch, configure Firebase authorized domains/Google sign-in, the API exact-origin allowlists, Stripe return URLs, analytics parent origins and Virtual CV links. Keep the existing website available while testing those flows. See docs/standalone-resume-launch.md in the source repository. No private source, account records or server secrets belong in this bundle.\n');
 return {output:outputPath,origin:appOrigin||null,domainConnected:false,backendConfiguredForNewDomain:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log('STANDALONE_APP_BUNDLE '+JSON.stringify(buildStandaloneResume()));
