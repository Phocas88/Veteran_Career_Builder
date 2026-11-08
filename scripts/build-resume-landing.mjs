import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildStandaloneResume} from './build-standalone-resume.mjs';
import {protectHtml} from './security-headers.mjs';
import {searchPages,siteSchema,jsonLd,renderSearchPage} from '../resume-website-src/search-pages.mjs';
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
 const publicLanding=fs.readFileSync(path.join(website,'index.html'),'utf8');
 const landingWithSchema=publicLanding.replace('</head>',jsonLd(siteSchema(origin))+'</head>');
 for(const file of ['index.html','landing.css','guides.css','landing.js','website-routing.mjs','website-ads.js','ads.txt']){
  const body=file==='index.html'?landingWithSchema:fs.readFileSync(path.join(website,file));fs.writeFileSync(path.join(output,file),file.endsWith('.html')?protectHtml(body.toString()):body);
 }
 for(const page of searchPages){const directory=path.join(output,page.slug);fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'index.html'),protectHtml(renderSearchPage(page,landingWithSchema,origin)));}
 const manifestFile=path.join(output,'manifest.webmanifest'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 // The root-scoped worker also returns this document for an /app/ launch.
 // Root URLs keep its cached logo and stylesheet available at either address.
 const offlineFile=path.join(output,'offline.html');
 fs.writeFileSync(offlineFile,fs.readFileSync(offlineFile,'utf8').replaceAll('href="./app-install.css','href="/app-install.css').replaceAll('href="./app-icon-','href="/app-icon-').replaceAll('src="./app-icon-','src="/app-icon-').replace('href="./"','href="/app/"'));
 // Preserve the original installed-app identity; change its launch destination.
 Object.assign(manifest,{id:'/index.html',start_url:'/app/',scope:'/',name:'Veteran Resumes by Veteran Career Path',short_name:'Veteran Resumes'});
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /app/\nSitemap: '+origin+'/sitemap.xml\n');
 const publicUrls=['/',...searchPages.map(page=>'/'+page.slug+'/')];
 fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+publicUrls.map(url=>'<url><loc>'+origin+url+'</loc></url>').join('')+'</urlset>\n');
 return {...result,landing:'/',workspace:'/app/'};
}
