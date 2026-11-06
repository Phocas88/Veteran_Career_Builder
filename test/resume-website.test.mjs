import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildResumeWebsite} from '../scripts/build-resume-landing.mjs';
import {appDestination} from '../resume-website-src/website-routing.mjs';

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
 buildResumeWebsite({source,output});
 const landing=fs.readFileSync(path.join(output,'index.html'),'utf8'),app=fs.readFileSync(path.join(output,'app/index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.webmanifest'),'utf8'));
 assert.match(landing,/Your experience\./);assert.match(landing,/Fictional example/);assert.match(landing,/site-examples\/cover-letter\.png/);assert.match(landing,/href="\/app\//);
 assert.match(app,/src="\/app-install\.js/);assert.match(app,/href="\/manifest\.webmanifest"/);assert.match(app,/canonical" href="https:\/\/veteranresumes\.com\/app\//);assert.match(app,/Guest purchases and drafts/);
 assert.equal(manifest.id,'/index.html');assert.equal(manifest.start_url,'/app/');assert.equal(manifest.scope,'/');
 assert.ok(fs.existsSync(path.join(output,'app.js')));assert.ok(fs.existsSync(path.join(output,'app/app.js')));assert.ok(fs.existsSync(path.join(output,'website-routing.mjs')));
 assert.equal(fs.existsSync(path.join(output,'app/.env')),false);assert.equal(fs.existsSync(path.join(output,'.env')),false);
});
