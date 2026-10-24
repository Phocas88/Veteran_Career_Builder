// Keep cover-letter paragraphs separate; reuse the self-hosted document engines.
export async function exportLetter(text, format) {
 if(typeof text!=='string'||!text.trim()||text.length>10000)throw new Error('Add a cover letter of up to 10,000 characters first.');
 const paragraphs=text.trim().split(/\n\s*\n/u);
 if(format==='txt')return new Blob([text],{type:'text/plain;charset=utf-8'});
 if(format==='pdf'){
  const {pdfMake}=await import('./vendor/pdf-export.mjs');
  return pdfMake.createPdf({pageSize:'LETTER',pageMargins:[54,54,54,54],defaultStyle:{font:'Roboto',fontSize:11,lineHeight:1.25},content:paragraphs.map(p=>({text:p,margin:[0,0,0,12],orphans:2,widows:2}))}).getBlob();
 }
 if(format==='docx'){
  const {Document,Paragraph,TextRun,Packer}=await import('./vendor/word-export.mjs');
  return Packer.toBlob(new Document({creator:'Veteran Career Path',sections:[{properties:{page:{margin:{top:1080,bottom:1080,left:1080,right:1080}}},children:paragraphs.map(p=>new Paragraph({spacing:{after:180,line:280},children:p.split('\n').map((line,i)=>new TextRun({text:line,break:i?1:0,font:'Calibri',size:22}))}))}]}));
 }
 throw new Error('Choose PDF, Word, or text.');
}
