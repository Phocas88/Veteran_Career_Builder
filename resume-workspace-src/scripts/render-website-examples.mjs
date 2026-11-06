import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createCanvas,DOMMatrix,Path2D,ImageData} from '@napi-rs/canvas';
globalThis.DOMMatrix??=DOMMatrix;globalThis.Path2D??=Path2D;globalThis.ImageData??=ImageData;
const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
const {createResumeDocument,exportPdf}=await import('../public/exports.js');
const {exportLetter}=await import('../public/letter-exports.js');
const demo=JSON.parse(await readFile(new URL('./fixtures/ad-demo.json',import.meta.url),'utf8'));
if(demo.fictional!==true||!demo.resume.includes('alex.carter@example.com')||!demo.coverLetter.includes('Example Company'))throw new Error('Public examples require the reviewed fictional fixture.');
const federal=demo.resume.replace('Jan 2021 – Present\n','Jan 2021 – Present\nHours per week: 40\n').replace('Jun 2014 – May 2020\n','Jun 2014 – May 2020\nHours per week: 40\n');
const output=new URL('../public/site-examples/',import.meta.url);await mkdir(output,{recursive:true});
const examples=[];
for(const [key,design,applicationType,text]of [
 ['resume-modern','modern','private',demo.resume],['resume-classic','classic','private',demo.resume],['resume-federal','federal','federal',federal],['cover-letter',null,null,demo.coverLetter]
]){
 const blob=design?await exportPdf(createResumeDocument(text,{design,applicationType,paper:'letter',arrangement:'professional'})):await exportLetter(text,'pdf');
 const bytes=new Uint8Array(await blob.arrayBuffer()),task=pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:false,standardFontDataUrl:fileURLToPath(new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url))});
 try{
  const pdf=await task.promise;if(pdf.numPages>2)throw new Error('The public example exceeds two pages: '+key);
  const page=await pdf.getPage(1),viewport=page.getViewport({scale:816/612}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  await writeFile(new URL(key+'.pdf',output),bytes);await writeFile(new URL(key+'.png',output),canvas.toBuffer('image/png'));
  const pageText=(await page.getTextContent()).items.map(item=>item.str).join(' ');
  if(!pageText.includes('CARTER')&&!pageText.includes('Carter'))throw new Error('Example content was not rendered: '+key);
  examples.push({key,pages:pdf.numPages,width:canvas.width,height:canvas.height,fictional:true});
 }finally{await task.destroy();}
}
await writeFile(new URL('manifest.json',output),JSON.stringify({fictional:true,person:'Alex Carter',school:'Example State College',company:'Example Company',renderer:'The application PDF exporters and PDF.js; no live account or AI request',examples},null,2)+'\n');
console.log('WEBSITE_EXAMPLES '+JSON.stringify({fictional:true,examples}));
