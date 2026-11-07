import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createCanvas,DOMMatrix,Path2D,ImageData} from '@napi-rs/canvas';
globalThis.DOMMatrix??=DOMMatrix;globalThis.Path2D??=Path2D;globalThis.ImageData??=ImageData;
const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
const {createResumeDocument,exportPdf}=await import('../public/exports.js');
const {designs}=await import('../public/resume-designs.js');
const {exportLetter}=await import('../public/letter-exports.js');
const fixture=JSON.parse(await readFile(new URL('./fixtures/ad-demo.json',import.meta.url),'utf8'));
if(fixture.fictional!==true||!fixture.resume.includes('alex.carter@example.com')||!fixture.coverLetter.includes('Example Company'))throw new Error('Public examples require the reviewed fictional fixture.');
const names=new Map([['Example Logistics Group','Northline Logistics'],['Example State College','Westbridge College'],['Example Training Institute','Professional Development Institute'],['Example Company','Evergreen Manufacturing']]);
const personalize=text=>{for(const [from,to]of names)text=text.replaceAll(from,to);return text;};
const resume=personalize(fixture.resume),letter=personalize(fixture.coverLetter);
const federal=resume.replace('Jan 2021 – Present\n','Jan 2021 – Present\nRichmond, VA | Hours per week: 40\n').replace('Jun 2014 – May 2020\n','Jun 2014 – May 2020\nFort Campbell, KY | Hours per week: 40\n').replace('Bachelor of Science in Business Administration | May 2022','Bachelor of Science in Business Administration | May 2022 | GPA: 3.6/4.0');
const photo='data:image/jpeg;base64,'+(await readFile(new URL('../public/example-headshot.jpg',import.meta.url))).toString('base64');
const output=new URL('../public/site-examples/',import.meta.url);await mkdir(output,{recursive:true});
const selections=[
 ['resume-modern','modern'],['resume-executive','executive'],['resume-folio','folio'],['resume-classic','classic'],['resume-creative','creative'],['resume-federal','federal'],['resume-federal-experience','federal-experience'],['cover-letter',null]
];
const examples=[];
for(const [key,design]of selections){
 const selected=design?designs[design]:null;if(design&&!selected)throw new Error('The advertised template is not available: '+design);
 const model=design?createResumeDocument(selected.federal?federal:resume,{design,applicationType:selected.federal?'federal':'private',paper:'letter',arrangement:'professional',exportSettings:selected.photo?{photo}:{}}):null;
 if(selected?.photo&&!model.photo)throw new Error('The portrait layout must display its sample portrait: '+key);
 if(selected?.federal&&model.photo)throw new Error('Federal resume examples must not include a photo.');
 const blob=model?await exportPdf(model):await exportLetter(letter,'pdf');
 const bytes=new Uint8Array(await blob.arrayBuffer()),task=pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:false,standardFontDataUrl:fileURLToPath(new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url))});
 try{
  const pdf=await task.promise;if(pdf.numPages>2)throw new Error('The public example exceeds two pages: '+key);
  const text=[];
  for(let number=1;number<=pdf.numPages;number++){
   const page=await pdf.getPage(number),base=page.getViewport({scale:1});
   if(Math.abs(base.width-612)>.1||Math.abs(base.height-792)>.1)throw new Error('Public documents must use US Letter: '+key);
   const viewport=page.getViewport({scale:816/612}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
   await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
   await writeFile(new URL(key+(number===1?'':'-'+number)+'.png',output),canvas.toBuffer('image/png'));
   text.push((await page.getTextContent()).items.map(item=>item.str).join(' '));
  }
  const content=text.join(' ');
  if(!/CARTER/i.test(content)||!content.includes('alex.carter@example.com')||!/Bachelor of Science/i.test(content))throw new Error('A complete public document was not rendered: '+key);
  if(selected?.federal){
   if((content.match(/Hours\s+per\s+week:\s+40/g)||[]).length!==2||!/Jan\s+2021/.test(content)||!/Jun\s+2014/.test(content))throw new Error('Federal examples need month/year employment dates and verified hours for both jobs.');
   if(model.style.fontSize<10||model.style.headingSize<14||Object.values(model.style.margins).some(value=>value<36))throw new Error('Federal example typography must retain the application standard.');
  }
  await writeFile(new URL(key+'.pdf',output),bytes);
  examples.push({key,design,name:selected?.name||'Cover letter',category:selected?.federal?'federal':design?'civilian':'letter',photo:Boolean(model?.photo),pages:pdf.numPages,width:816,height:1056,fictional:true});
 }finally{await task.destroy();}
}
await writeFile(new URL('manifest.json',output),JSON.stringify({fictional:true,person:'Alex Carter',school:'Westbridge College',company:'Evergreen Manufacturing',templateCount:Object.keys(designs).length,renderer:'Application PDF exporters and PDF.js; fictional local fixture only',examples},null,2)+'\n');
console.log('WEBSITE_EXAMPLES '+JSON.stringify({fictional:true,examples}));
