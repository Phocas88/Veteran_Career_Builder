import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeServer} from '../server.mjs';
const server=makeServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/privacy.html');
 const images=await page.evaluate(async()=>{
  const examples=await import('/template-examples.js?v=20261030-visible-gallery'),e=await import('/exports.js?v=20261027-resume-studio'),p=await import('/vendor/pdf.mjs');p.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.mjs';const photo=await examples.examplePhoto(),out=[];
  for(const [key,design] of Object.entries(e.designs)){
   const model=examples.exampleModel(key,design.photo?photo:null),blob=await e.exportPdf(model),task=p.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false});
   try{const pdf=await task.promise,first=await pdf.getPage(1),viewport=first.getViewport({scale:430/612}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await first.render({canvasContext:canvas.getContext('2d'),viewport}).promise;out.push({key,width:canvas.width,height:canvas.height,pages:pdf.numPages,data:canvas.toDataURL('image/jpeg',.85).split(',')[1]});}finally{await task.destroy();}
  }return out;
 });
 const root=new URL('../public/template-previews/',import.meta.url);await mkdir(root,{recursive:true});
 for(const image of images)await writeFile(new URL(image.key+'.jpg',root),Buffer.from(image.data,'base64'));
 const hash=createHash('sha256');for(const file of ['public/exports.js','public/resume-designs.js','public/template-examples.js','public/example-headshot.jpg'])hash.update(await readFile(new URL('../'+file,import.meta.url)));
 await writeFile(new URL('manifest.json',root),JSON.stringify({version:1,fingerprint:hash.digest('hex'),portrait:'AI-generated fictional example applicant; never applied to a user resume',previews:images.map(({data,...rest})=>rest)},null,2)+'\n');console.log('Rendered '+images.length+' complete template examples with the actual PDF exporter.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
