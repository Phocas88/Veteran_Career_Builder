import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildStandaloneResume} from './build-standalone-resume.mjs';
import {protectHtml} from './security-headers.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));

export function buildResumeWebsite({source=path.join(root,'resume-workspace-src/public'),website=path.join(root,'resume-website-src'),output=path.join(root,'resume-website'),origin='https://veteranresumes.com'}={}){
 const result=buildStandaloneResume({source,output,origin});
 // Keep the former root assets available for already-open editors and workers.
 // Account/draft storage stays on the same origin with the same identifiers.
 const files=fs.readdirSync(output).filter(name=>!['vercel.json','DEPLOYMENT-READINESS.txt'].includes(name));
 const app=path.join(output,'app');fs.mkdirSync(app);
 for(const file of files)fs.cpSync(path.join(output,file),path.join(app,file),{recursive:true});
 const appIndex=path.join(app,'index.html');let html=fs.readFileSync(appIndex,'utf8');
 html=html.replace('rel="canonical" href="'+origin+'/"','rel="canonical" href="'+origin+'/app/"').replace('href="./manifest.webmanifest"','href="/manifest.webmanifest"').replace('src="./app-install.js?','src="/app-install.js?');
 html=html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
 fs.writeFileSync(appIndex,html);
 for(const file of ['index.html','landing.css','landing.js','website-routing.mjs']){
  const body=fs.readFileSync(path.join(website,file));fs.writeFileSync(path.join(output,file),file.endsWith('.html')?protectHtml(body.toString()):body);
 }
 const manifestFile=path.join(output,'manifest.webmanifest'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 // Preserve the original installed-app identity; change its launch destination.
 Object.assign(manifest,{id:'/index.html',start_url:'/app/',scope:'/',name:'Veteran Resumes by Veteran Career Path',short_name:'Veteran Resumes'});
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /app/\nSitemap: '+origin+'/sitemap.xml\n');
 fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+origin+'/</loc></url></urlset>\n');
 return {...result,landing:'/',workspace:'/app/'};
}
