import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildResumeWebsite} from '../scripts/build-resume-landing.mjs';
import {appDestination} from '../resume-website-src/website-routing.mjs';

test('the app permits Google authentication popups without weakening the existing content protections',()=>{
 const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 const app=config.headers.find(rule=>rule.source==='/app/(.*)');
 assert.equal(app.headers.find(header=>header.key==='Cross-Origin-Opener-Policy').value,'same-origin-allow-popups');
 const security=config.headers.find(rule=>rule.headers.some(header=>header.key==='Content-Security-Policy')).headers;
 assert.ok(security.some(header=>header.key==='Content-Security-Policy'&&header.value.includes("object-src 'none'")));
});

test('the isolated analytics host exposes only its public collector routes and preserves their stricter response policy',()=>{
 const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 const rules=config.rewrites;assert.equal(rules.length,2);
 for(const rule of rules){assert.deepEqual(rule.has,[{type:'host',value:'usage.veteranresumes.com'}]);assert.ok(['/api/resume-analytics','/api/resume-activity'].includes(rule.source));assert.equal(rule.destination,'https://vcp-proxy.vercel.app'+rule.source);}
 const redirect=config.redirects.find(rule=>rule.has?.some(check=>check.value==='usage.veteranresumes.com'));
 const redirected=new RegExp('^'+redirect.source.replace(':path','')+'$');assert.equal(redirect.destination,'https://veteranresumes.com/:path');
 for(const path of ['/','/app/','/index.html','/api/private','/api/resume-analytics-extra'])assert.ok(redirected.test(path),path+' should leave the collector host');
 for(const path of ['/api/resume-analytics','/api/resume-activity'])assert.equal(redirected.test(path),false);
 const baseline=config.headers.find(rule=>rule.headers.some(header=>header.key==='Content-Security-Policy'));
 const protectedPath=new RegExp('^'+baseline.source+'$');assert.equal(protectedPath.test('/api/resume-analytics'),false,'The collector must retain its backend hash-locked CSP and embedding origins');
 for(const path of ['/','/app/','/api/resume-activity','/api/resume-analytics-extra'])assert.ok(protectedPath.test(path));
});

test('legacy checkout returns, saved deep links and installed launches reach the workspace without losing recovery context',()=>{
 const id='a'.repeat(64),origin='https://veteranresumes.com';
 for(const tail of ['?build='+id+'&checkout=success','?build='+id+'&template=modern&checkout=canceled','?letter='+id+'&checkout=success#letter','#digital-cv','#profile'])assert.equal(appDestination(origin+'/'+tail),origin+'/app/'+tail);
 assert.equal(appDestination(origin+'/?utm_source=linkedin',true),origin+'/app/?utm_source=linkedin');
 for(const tail of ['', '#examples','#pricing','?build=untrusted&next=https://evil.invalid','?letter=bad'])assert.equal(appDestination(origin+'/'+tail),null);
});
test('the public page and workspace have distinct routes while preserving the original installed-app identity and existing assets',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'resume-website-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const source=path.join(tmp,'public'),output=path.join(tmp,'website');fs.mkdirSync(source);
 const files=['app.js','app-install.js','app-install.css','app-worker.js','offline.html','app-icon-192.png','app-icon-512.png','app-icon-maskable-512.png','apple-touch-icon.png','vendor/pdf.mjs','vendor/pdf.worker.mjs','vendor/pdf-export.mjs','vendor/word-export.mjs','service-library-data.json'];
 for(const f of files){fs.mkdirSync(path.dirname(path.join(source,f)),{recursive:true});fs.writeFileSync(path.join(source,f),'public fixture');}
 fs.writeFileSync(path.join(source,'manifest.webmanifest'),JSON.stringify({id:'./index.html',start_url:'./',scope:'./'}));
 fs.writeFileSync(path.join(source,'index.html'),'<html><head><link rel="manifest" href="./manifest.webmanifest"><script src="./app-install.js?v=1"></script></head><body><section class="app-install-card"></section><input value="https://veterancareerpath.com/resumereview/"></body></html>');
 fs.writeFileSync(path.join(source,'.env'),'PRIVATE');
 fs.mkdirSync(path.join(source,'site-examples'));fs.writeFileSync(path.join(source,'site-examples/cover-letter.pdf'),'%PDF-fictional-example');
 buildResumeWebsite({source,output});
 const landing=fs.readFileSync(path.join(output,'index.html'),'utf8'),app=fs.readFileSync(path.join(output,'app/index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.webmanifest'),'utf8'));
 assert.match(landing,/Your experience\./);assert.doesNotMatch(landing,/\b(?:demo|fictional)\b/i);assert.match(landing,/data-hero-carousel/);assert.match(landing,/id="template-rail"/);assert.match(landing,/site-examples\/resume-folio\.png/);assert.match(landing,/site-examples\/resume-federal-experience\.png/);assert.match(landing,/site-examples\/cover-letter\.png/);assert.match(landing,/href="\/app\//);
 assert.match(landing,/google-adsense-account/);assert.doesNotMatch(app,/google-adsense-account|website-ads\.js/);
 assert.match(fs.readFileSync(path.join(output,'ads.txt'),'utf8'),/^google\.com, pub-4999040528510137, DIRECT, f08c47fec0942fa0/);
 assert.equal(fs.existsSync(path.join(output,'app/website-ads.js')),false);
 assert.match(app,/src="\/app-install\.js/);assert.match(app,/href="\/manifest\.webmanifest"/);assert.match(app,/canonical" href="https:\/\/veteranresumes\.com\/app\//);assert.match(app,/Guest purchases and drafts/);
 assert.equal(manifest.id,'/index.html');assert.equal(manifest.start_url,'/app/');assert.equal(manifest.scope,'/');
 assert.ok(fs.existsSync(path.join(output,'app.js')));assert.ok(fs.existsSync(path.join(output,'app/app.js')));assert.ok(fs.existsSync(path.join(output,'website-routing.mjs')));
 assert.equal(fs.readFileSync(path.join(output,'site-examples/cover-letter.pdf'),'utf8'),'%PDF-fictional-example');
 assert.equal(fs.existsSync(path.join(output,'app/.env')),false);assert.equal(fs.existsSync(path.join(output,'.env')),false);
});
