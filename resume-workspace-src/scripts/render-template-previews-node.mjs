// Use the same PDF document and PDF.js renderer as the browser gallery without
// requiring a browser or operating-system Chrome libraries on the static host.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createCanvas,DOMMatrix,Path2D,ImageData} from '@napi-rs/canvas';
globalThis.DOMMatrix??=DOMMatrix;
globalThis.Path2D??=Path2D;
globalThis.ImageData??=ImageData;
const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
const examples=await import('../public/template-examples.js?v=20261030-visible-gallery');
const {designs,exportPdf}=await import('../public/exports.js?v=20261027-resume-studio');
const photo='data:image/jpeg;base64,'+(await readFile(new URL('../public/example-headshot.jpg',import.meta.url))).toString('base64');
const root=new URL('../public/template-previews/',import.meta.url),previews=[];
await mkdir(root,{recursive:true});
for(const [key,design]of Object.entries(designs)){
 const blob=await exportPdf(examples.exampleModel(key,design.photo?photo:null));
 const task=pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,useSystemFonts:false,standardFontDataUrl:fileURLToPath(new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url))});
 try{
  const pdf=await task.promise,first=await pdf.getPage(1),viewport=first.getViewport({scale:430/612});
  const width=Math.ceil(viewport.width),height=Math.ceil(viewport.height),canvas=createCanvas(width,height);
  await first.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  await writeFile(new URL(key+'.jpg',root),canvas.toBuffer('image/jpeg',85));
  previews.push({key,width,height,pages:pdf.numPages});
 }finally{await task.destroy();}
}
const hash=createHash('sha256');
for(const file of ['public/exports.js','public/resume-designs.js','public/template-examples.js','public/example-headshot.jpg'])hash.update(await readFile(new URL('../'+file,import.meta.url)));
await writeFile(new URL('manifest.json',root),JSON.stringify({version:1,fingerprint:hash.digest('hex'),portrait:'AI-generated fictional example applicant; never applied to a user resume',previews},null,2)+'\n');
console.log('Rendered '+previews.length+' complete template examples with the actual PDF exporter and Node PDF.js.');
