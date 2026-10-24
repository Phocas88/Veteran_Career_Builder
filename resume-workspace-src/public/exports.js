// One document model drives the preview and every formatted export.
const sectionNames = new Map();
for (const [kind, names] of Object.entries({
  summary: ['summary', 'professional summary', 'career summary', 'profile', 'professional profile', 'objective', 'career objective', 'about me'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'relevant experience', 'military experience', 'military service', 'civilian experience'],
  skills: ['skills', 'technical skills', 'core skills', 'key skills', 'core competencies', 'competencies', 'areas of expertise', 'qualifications', 'skills & qualifications', 'education & skills'],
  education: ['education', 'academic background', 'education & training', 'education and training', 'education & certifications'],
  certifications: ['certifications', 'certificates', 'licenses', 'licenses & certifications', 'certifications & licenses', 'certifications & clearance', 'training', 'professional development', 'professional training', 'military training', 'training & military schools'],
  projects: ['projects', 'selected projects', 'key projects', 'achievements', 'accomplishments', 'career highlights', 'selected achievements', 'projects & volunteering', 'projects & volunteer experience'],
  other: ['volunteer experience', 'volunteering', 'community involvement', 'awards', 'honors', 'publications', 'languages', 'interests', 'references', 'additional information']
})) for (const name of names) sectionNames.set(name, kind);

export {designs,fontFamilies,accentColors,normalizeExportSettings} from './resume-designs.js?v=20261027-resume-studio';
import {designs,fontFamilies,resolveDesign} from './resume-designs.js?v=20261027-resume-studio';
export const arrangements = {
  original: { name: 'As written', description: 'Keep your current section order.' },
  professional: { name: 'Professional', description: 'Summary, experience, education, then skills.' },
  skills: { name: 'Skills-focused', description: 'Bring skills and qualifications ahead of work history.' },
  combination: { name: 'Combination', description: 'Lead with skills and achievements, followed by experience.' }
};
const orders = {
  professional: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'other'],
  skills: ['summary', 'skills', 'certifications', 'experience', 'education', 'projects', 'other'],
  combination: ['summary', 'skills', 'projects', 'experience', 'education', 'certifications', 'other']
};
export const papers = { letter: { name: 'US Letter', width: 612, height: 792 }, a4: { name: 'A4', width: 595.28, height: 841.89 } };

function headingKind(line) {
  const label = line.trim().replace(/^#{1,6}\s+/u, '').replace(/:$/u, '').replace(/\s+and\s+/giu, ' & ').toLowerCase();
  return sectionNames.get(label)??sectionNames.get(label.split(/\s+[–—-]\s+/u)[0])??(/^#{1,6}\s+\S/.test(line)?'other':undefined);
}

const bulletPattern = /^[•●▪◦*\-–]\s+/u;
const year='(?:19|20)\\d{2}';
const month='(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const monthToken=`(?:${month}\\.?\\s+${year}|(?:0?[1-9]|1[0-2])/${year}|${year}-(?:0[1-9]|1[0-2]))`;
const datePattern=new RegExp(`\\b(?:${monthToken}|${year})\\s*(?:–|—|-|to)\\s*(?:Present|Current|Now|${monthToken}|${year})\\b`,'iu');
const monthYear=new RegExp(`\\b${monthToken}\\b`,'giu');
function keyFor(type, text, index) {
  let hash = 2166136261;
  for (const char of type + text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${type}-${(hash >>> 0).toString(36)}-${index}`;
}

export function createResumeDocument(text, options = {}) {
  const resolved=resolveDesign(options.design,options.applicationType,options.exportSettings);
  const {design,style}=resolved;
  const arrangement = Object.hasOwn(arrangements, options.arrangement) ? options.arrangement : 'original';
  const paper=resolved.federal?'letter':Object.hasOwn(papers,options.paper)?options.paper:'letter';
  const lines = String(text).replace(/\r\n?/gu, '\n').split('\n');
  const prefix = [];
  const sections = [];
  let current;
  for (const raw of lines) {
    const value = raw.trim();
    const kind = headingKind(value);
    if (kind) {
      current = { kind, heading: value.replace(/^#{1,6}\s+/u, ''), lines: [] };
      sections.push(current);
    } else (current ? current.lines : prefix).push(value);
  }
  const sectionCounts=new Map();
  for(const section of sections){const n=sectionCounts.get(section.heading)||0;sectionCounts.set(section.heading,n+1);section.id=keyFor('section',section.heading,n);section.originalHeading=section.heading;section.heading=resolved.settings.headings?.[section.id]||section.heading;section.hidden=resolved.settings.hiddenSections?.includes(section.id)||false;}
  if(resolved.settings.sectionOrder?.length){const custom=resolved.settings.sectionOrder;sections.sort((a,b)=>(custom.includes(a.id)?custom.indexOf(a.id):custom.length)-(custom.includes(b.id)?custom.indexOf(b.id):custom.length));}
  else if(orders[arrangement]){const order=orders[arrangement];sections.sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind));}
  const nodes = [];
  function addLines(values, header = false, kind = '') {
    let contact = header;
    let blank = false;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (!value) { contact = false; blank = true; continue; }
      if (/^\[PAGE BREAK\]$/iu.test(value)) { nodes.push({ type: 'break', text: '' }); blank = false; continue; }
      const next = values.slice(i + 1).find(Boolean) ?? '';
      const previous = nodes.at(-1);
      const dated = datePattern.test(value);
      let type = bulletPattern.test(value) ? 'bullet' : contact ? 'contact' : 'body';
      if (kind === 'experience' && type === 'body') {
        if (dated && value.length < 200 && !/[.!?]$/u.test(value)) type = datePattern.exec(value)?.index === 0 ? 'metadata' : 'job';
        else if (value.length < 160 && datePattern.exec(next)?.index === 0) type = 'job';
        else if (previous && ['job', 'metadata'].includes(previous.type) && value.length < 180) type = 'employer';
      }
      if (/^(?:Hours(?: worked)?(?: per week)?|Hours\/week|Series|Grade|Pay plan|Dates|Employer)\s*:/iu.test(value)) type = 'metadata';
      const mayJoin = options.reflow !== false && previous && ['body', 'bullet'].includes(previous.type) && type === 'body' && (!blank || /^[a-z(]/u.test(value) && !/[.!?]$/u.test(previous.text));
      if (mayJoin) previous.text += ' ' + value;
      else {
        if (blank && previous && !['heading', 'break'].includes(previous.type)) nodes.push({ type: 'space', text: '' });
        nodes.push({ type, text: value });
      }
      blank = false;
    }
  }
  while (prefix.length && !prefix[0]) prefix.shift();
  const title = prefix[0] && prefix[0].length <= 100 && !/^[•●▪◦*\-–]\s/u.test(prefix[0]) && (sections.length || prefix.slice(1, 4).some(line => /@/u.test(line))) ? prefix.shift() : '';
  if (title) nodes.push({ type: 'name', text: title });
  addLines(prefix, !!title);
  for (const section of sections) {
    const start=nodes.length;if(section.hidden){section.nodes=[];continue;}
    nodes.push({type:'heading',text:section.heading,sectionId:section.id,kind:section.kind});
    addLines(section.lines,false,section.kind);
    section.nodes=nodes.slice(start);for(const node of section.nodes){node.sectionId=section.id;node.kind=section.kind;}
  }
  while (nodes.at(-1)?.type === 'space') nodes.pop();
  const counts = new Map();
  for (const node of nodes) {
    const key = node.type + node.text;
    const index = counts.get(key) ?? 0; counts.set(key, index + 1);
    node.id=node.type==='heading'?node.sectionId:keyFor(node.type,node.text,index);
    node.pageBreak = (options.pageBreaks ?? []).includes(node.id);
  }
  return {design,arrangement,paper,title,nodes,sections,photo:resolved.photo,applicationType:resolved.federal?'federal':options.applicationType??'private',style,page:papers[paper]};
}

export function federalChecks(model, announcement = '') {
  const all = model.nodes.map(x => x.text).join('\n');
  const jobs = model.nodes.map((node, index) => ({ node, index })).filter(x => x.node.type === 'job');
  const checks = [];
  const contact = model.nodes.filter(x => ['name', 'contact'].includes(x.type)).map(x => x.text).join('\n');
  if (!/@/u.test(contact) || !/(?:\+?\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4}/u.test(contact)) checks.push('Confirm your name, email address, and phone number are present.');
  if (!announcement.trim()) checks.push('Paste the job announcement so specialized experience and required qualifications can be reviewed.');
  if (/\b(?:degree|education|transcripts?|bachelor|master)\b/iu.test(announcement) && !model.nodes.some(x=>x.type==='heading'&&(x.kind==='education'||/education|academic/iu.test(x.text)))) checks.push('The announcement mentions education. Add the relevant school, degree or coursework, completion status, and dates if required.');
  if (/\b(?:certification|certified|license|licensure)\b/iu.test(announcement) && !/certification|certified|licen[cs]e|credential/iu.test(all)) checks.push('The announcement mentions a credential. Identify any required license or certification you hold, its issuer and current status. Do not claim a credential you do not have.');
  if (!jobs.length) checks.push('Check each relevant job for title, employer, start/end month and year, and hours per week.');
  for (let i = 0; i < jobs.length; i++) {
    const { node, index } = jobs[i];
    const nextSection = model.nodes.findIndex((x, candidate) => candidate > index && x.type === 'heading');
    const body = model.nodes.slice(index, Math.min(jobs[i + 1]?.index ?? model.nodes.length, nextSection < 0 ? model.nodes.length : nextSection)).map(x => x.text).join('\n');
    if (!/(?:\d+(?:\.\d+)?\s*(?:hours|hrs)\s*(?:per|\/)\s*(?:week|wk)|hours(?: worked)?(?: per week|\/week)?\s*:\s*\d+)/iu.test(body)) checks.push(`${node.text}: add verified hours per week.`);
    const dates = node.text + '\n' + model.nodes.slice(index + 1, index + 4).filter(x => x.type === 'metadata').map(x => x.text).join('\n');
    const matches=dates.match(monthYear)??[];
    if(!model.nodes.slice(index,Math.min(jobs[i+1]?.index??model.nodes.length,nextSection<0?model.nodes.length:nextSection)).some(n=>n.type==='employer')&&!/employer\s*:/i.test(body)&&node.text.split(/\s+[|·]\s+/).length<3)checks.push(`${node.text}: confirm the employer name is included.`);
    if (matches.length < (/\b(?:Present|Current|Now)\b/iu.test(dates) ? 1 : 2)) checks.push(`${node.text}: confirm both start/end month and year (or Present).`);
  }
  if(model.nodes.some(x=>x.type==='heading'&&x.kind==='education'))checks.push('When education is relevant or required, verify the school, degree, completion date and GPA, and provide any required transcript.');
  if(/\b(?:SSN|Social Security|date of birth|DOB)\b/i.test(all))checks.push('Remove Social Security numbers, birth dates and other sensitive personal information before applying.');
  if(/\b(?:NIST|National Institute of Standards and Technology)\b/i.test(announcement))checks.push('NIST guidance prohibits AI-generated resume text. Use your own writing and check the agency instructions before submitting an AI-assisted draft.');
  checks.push('For civilian federal jobs, verify pay plan, series, and grade when applicable. Military rank is not a GS grade.');
  checks.push('Follow the announcement and agency rules, including any restrictions on AI-assisted writing; required supporting documents are separate from your resume.');
  checks.push('Match the announcement’s education, certification, specialized-experience, and supporting-document requirements. This checklist does not establish eligibility.');
  return checks;
}

export function documentParts(model){
 const header=[],body=[];let inHeader=true;
 for(const node of model.nodes){if(node.type==='heading')inHeader=false;if(inHeader&&(node.type==='name'||node.type==='contact')&&header.length<4&&node.text.length<250)header.push(node);else body.push(node);}
 const asideIds=new Set(model.sections.filter(s=>!s.hidden&&['skills','education','certifications'].includes(s.kind)).map(s=>s.id));
 const side=model.style.layout==='single'?[]:body.filter(n=>asideIds.has(n.sectionId));
 const main=side.length?body.filter(n=>!asideIds.has(n.sectionId)):body;
 return {header,main,side,layout:side.length?model.style.layout:'single'};
}
export function plainTextForModel(model){return model.nodes.map(n=>['space','break'].includes(n.type)?'':n.text).join('\n').trim();}
export function renderResume(container,model){
 const {style:s,page}=model,parts=documentParts(model);container.className=`resume-document design-${model.design}`;
 for(const [key,value]of Object.entries({'body-size':`${s.fontSize}pt`,'line-height':s.lineHeight,'name-size':`${s.nameSize}pt`,'heading-size':`${s.headingSize}pt`,'section-gap':`${s.sectionGap}pt`,'paragraph-gap':`${s.paragraphGap}pt`,'accent':`#${s.color}`,'paper-width':`${page.width}pt`,'paper-height':`${page.height}pt`,'name-align':s.alignment,'body-align':s.textAlignment,'resume-font':fontFamilies[s.font].css,'small-size':`${model.applicationType==='federal'?10:Math.max(9.5,s.fontSize-.5)}pt`}))container.style.setProperty(`--${key}`,value);
 for(const side of ['top','right','bottom','left'])container.style.setProperty(`--margin-${side}`,`${s.margins[side]}pt`);
 const make=nodes=>{const fragment=document.createDocumentFragment();for(const node of nodes){const el=document.createElement(node.type==='name'?'h2':node.type==='heading'?'h3':'p');el.className=`resume-${node.type}${node.pageBreak?' force-page-break':''}`;el.textContent=node.text;if(node.type==='space')el.setAttribute('aria-hidden','true');fragment.append(el);}return fragment;};
 const header=document.createElement('header');header.className=`resume-header header-${s.header}`;const identity=document.createElement('div');identity.append(make(parts.header));header.append(identity);
 if(model.photo){const img=document.createElement('img');img.src=model.photo;img.alt='Profile photo';img.className='resume-photo';header.append(img);}
 const body=document.createElement('div');body.className=`resume-columns columns-${parts.layout}`;const main=document.createElement('div');main.className='resume-main';main.append(make(parts.main));
 if(parts.side.length){const aside=document.createElement('aside');aside.className='resume-side';aside.append(make(parts.side));body.append(...(parts.layout==='left'?[aside,main]:[main,aside]));}else body.append(main);
 container.replaceChildren(header,body);
}
function pdfNode(model,node,width,ink){
 const s=model.style,small=model.applicationType==='federal'?10:Math.max(9.5,s.fontSize-.5),pageBreak=node.pageBreak||node.type==='break'?'before':undefined;
 if(node.type==='break')return {text:'',pageBreak};
 if(node.type==='space')return {text:' ',fontSize:1,margin:[0,0,0,2]};
 if(node.type==='name')return {text:node.text,fontSize:s.nameSize,bold:true,alignment:s.alignment,color:ink||`#${s.color}`,margin:[0,0,0,5]};
 if(node.type==='heading'){
  const content={text:node.text,headlineLevel:1,fontSize:s.headingSize,bold:true,color:`#${s.color}`,margin:[0,s.sectionGap,0,5],pageBreak};
  if(s.header==='plain'||model.applicationType==='federal')return content;
  if(s.header==='bar')return {table:{widths:[width],body:[[{...content,margin:[6,4,6,4],fillColor:'#EEF2F5'}]]},layout:'noBorders',margin:[0,s.sectionGap,0,5],pageBreak};
  return {headlineLevel:1,stack:[{...content,margin:[0,0,0,3]},{canvas:[{type:'line',x1:0,y1:0,x2:width,y2:0,lineWidth:.6,lineColor:`#${s.color}`}]}],pageBreak,margin:[0,s.sectionGap,0,6]};
 }
 const result={text:node.text,pageBreak,alignment:s.textAlignment,margin:[0,0,0,s.paragraphGap]};
 if(node.type==='job')Object.assign(result,{bold:true,margin:[0,5,0,3]});
 if(node.type==='employer')Object.assign(result,{italics:true,color:'#444444'});
 if(node.type==='metadata')Object.assign(result,{fontSize:small,color:'#444444'});
 if(node.type==='contact')Object.assign(result,{fontSize:small,alignment:s.alignment,color:ink||'#52525B'});
 if(node.type==='bullet')result.margin=[9,0,0,s.paragraphGap];
 return result;
}
function pdfFlow(model,nodes,width){
 const content=[],s=model.style,available=model.page.height-s.margins.top-s.margins.bottom;
 for(let i=0;i<nodes.length;i++){
  const node=nodes[i];
  if(['heading','job'].includes(node.type)){
   const group=[node];let cursor=i+1;
   while(cursor<nodes.length&&group.length<8){const next=nodes[cursor];if(next.pageBreak||['break','heading','job'].includes(next.type))break;group.push(next);cursor++;if(['body','bullet'].includes(next.type))break;}
   const estimate=group.reduce((sum,n)=>sum+Math.ceil(n.text.length/Math.max(16,width/(s.fontSize*.52)))*s.fontSize*s.lineHeight+8,0);
   if(estimate<available*.55){content.push({stack:group.map((n,index)=>({...pdfNode(model,n,width),...(index===0?{pageBreak:undefined}:{})})),unbreakable:true,pageBreak:node.pageBreak?'before':undefined});i=cursor-1;continue;}
  }
  content.push(pdfNode(model,node,width));
 }
 return content;
}
export function createPdfDefinition(model){
 const {style:s,page}=model,parts=documentParts(model),m=s.margins,width=page.width-m.left-m.right;
 const headerInk=s.header==='band'?'#FFFFFF':undefined;
 const identity={stack:parts.header.map(n=>pdfNode(model,n,width-(model.photo?70:0),headerInk))};
 let header=model.photo?{columns:[{...identity,width:'*'},{image:model.photo,fit:[58,58],width:58}],columnGap:12}:identity;
 if(['band','card'].includes(s.header))header={table:{widths:['*'],body:[[{...header,fillColor:s.header==='band'?`#${s.color}`:'#EEF2F5',margin:[10,10,10,10]}]]},layout:'noBorders',margin:[0,0,0,10]};
 else header={...header,margin:[0,0,0,s.header==='bar'?12:6]};
 if(s.decoration)header={stack:[header,{canvas:[{type:'line',x1:0,y1:0,x2:width,y2:0,lineWidth:2,lineColor:'#'+s.decoration}]}],margin:[0,0,0,10]};
 const content=parts.header.length||model.photo?[header]:[];
 if(parts.layout==='single')content.push(...pdfFlow(model,parts.main,width));
 else{
  const sideWidth=Math.round(width*.29),gap=18,mainWidth=width-sideWidth-gap;
  const main={width:mainWidth,stack:pdfFlow(model,parts.main,mainWidth)},side={width:sideWidth,stack:pdfFlow(model,parts.side,sideWidth)};
  content.push({columns:parts.layout==='left'?[side,main]:[main,side],columnGap:gap});
 }
 return {pageBreakBefore:(node,following)=>(node.headlineLevel===1||node.style==='heading')&&following.getFollowingNodesOnPage().length===0,info:{title:model.title?`${model.title} — Resume`:'Resume',creator:'VCP Resume'},pageSize:{width:page.width,height:page.height},pageMargins:[m.left,m.top,m.right,m.bottom],defaultStyle:{font:s.font,fontSize:s.fontSize,lineHeight:s.lineHeight,color:'#222222'},content,
 footer:(current,total)=>total>1?{columns:[{text:model.title||''},{text:`${current} / ${total}`,alignment:'right'}],font:s.font,fontSize:8,color:'#666666',margin:[m.left,12,m.right,0]}:null};
}
export async function exportPdf(model){const {pdfMake}=await import('./vendor/pdf-export.mjs');return pdfMake.createPdf(createPdfDefinition(model)).getBlob();}
export async function exportWord(model){
 const {Document,Paragraph,TextRun,Packer,HeadingLevel,AlignmentType,Table,TableRow,TableCell,WidthType,ImageRun,Footer,PageNumber}=await import('./vendor/word-export.mjs');
 const {style:s,page}=model,parts=documentParts(model),font=fontFamilies[s.font].word,small=model.applicationType==='federal'?10:Math.max(9.5,s.fontSize-.5);
 const align=value=>({left:AlignmentType.LEFT,center:AlignmentType.CENTER,right:AlignmentType.RIGHT,justify:AlignmentType.JUSTIFIED}[value]||AlignmentType.LEFT);
 const paragraph=(node,ink)=>new Paragraph({
  ...(node.type==='name'?{heading:HeadingLevel.TITLE,alignment:align(s.alignment),keepNext:true}:{}),
  ...(node.type==='heading'?{heading:HeadingLevel.HEADING_1,keepNext:true,...(s.header!=='plain'&&model.applicationType!=='federal'?{border:{bottom:{color:s.color,size:6,space:4,style:'single'}}}:{})}:{}),
  ...(['job','employer','metadata'].includes(node.type)?{keepNext:true}:{}),
  ...(node.pageBreak||node.type==='break'?{pageBreakBefore:true}:{}),
  ...(node.type==='contact'?{alignment:align(s.alignment)}:node.type!=='name'?{alignment:align(s.textAlignment)}:{}),
  ...(node.type==='bullet'?{indent:{left:180,hanging:140}}:{}),widowControl:true,keepLines:node.type==='bullet'&&node.text.length<800,
  spacing:{before:node.type==='heading'?s.sectionGap*20:node.type==='job'?100:0,after:node.type==='space'?40:node.type==='name'||node.type==='heading'?100:s.paragraphGap*20,line:Math.round(s.lineHeight*240)},
  children:[new TextRun({text:node.text,font,size:2*(node.type==='name'?s.nameSize:node.type==='heading'?s.headingSize:['contact','metadata'].includes(node.type)?small:s.fontSize),bold:['name','heading','job'].includes(node.type),italics:node.type==='employer',color:ink||(['name','heading'].includes(node.type)?s.color:['metadata','contact','employer'].includes(node.type)?'444444':'222222')})]
 });
 const children=[],headerInk=s.header==='band'?'FFFFFF':undefined;
 let head=parts.header.map(n=>paragraph(n,headerInk));
 let portrait;
 if(model.photo){const type=model.photo.startsWith('data:image/png')?'png':'jpg';const bytes=Uint8Array.from(atob(model.photo.split(',')[1]),c=>c.charCodeAt(0));portrait=new Paragraph({alignment:AlignmentType.RIGHT,children:[new ImageRun({data:bytes,type,transformation:{width:76,height:76},altText:{title:'Profile photo',description:'Optional private-sector resume photo',name:'Profile photo'}})]});}
 const tableBorders={top:{style:'none',size:0,color:'FFFFFF'},bottom:s.decoration?{style:'single',size:12,color:s.decoration}:{style:'none',size:0,color:'FFFFFF'},left:{style:'none',size:0,color:'FFFFFF'},right:{style:'none',size:0,color:'FFFFFF'},insideHorizontal:{style:'none',size:0,color:'FFFFFF'},insideVertical:{style:'none',size:0,color:'FFFFFF'}};
 if(head.length||portrait){
  if(portrait){const fill=s.header==='band'?s.color:s.header==='card'?'EEF2F5':'FFFFFF';children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:[new TableRow({children:[new TableCell({width:{size:85,type:WidthType.PERCENTAGE},shading:{fill},children:head}),new TableCell({width:{size:15,type:WidthType.PERCENTAGE},shading:{fill},children:[portrait]})]})]}));}
  else if(['band','card'].includes(s.header))children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:[new TableRow({children:[new TableCell({shading:{fill:s.header==='band'?s.color:'EEF2F5'},margins:{top:160,right:160,bottom:160,left:160},children:head})]})]}));
  else children.push(...head);
 }
 if(parts.layout==='single')children.push(...parts.main.map(n=>paragraph(n)));
 else{
  const main=new TableCell({width:{size:71,type:WidthType.PERCENTAGE},margins:{left:parts.layout==='left'?220:0,right:parts.layout==='right'?220:0},children:parts.main.map(n=>paragraph(n))});
  const side=new TableCell({width:{size:29,type:WidthType.PERCENTAGE},children:parts.side.map(n=>paragraph(n))});
  children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:tableBorders,rows:[new TableRow({children:parts.layout==='left'?[side,main]:[main,side]})]}));
 }
 const footer=new Footer({children:[new Paragraph({children:[new TextRun({text:(model.title||'')+'   ',font,size:16,color:'666666'}),new TextRun({children:[PageNumber.CURRENT,' / ',PageNumber.TOTAL_PAGES],font,size:16,color:'666666'})]})]});
 const m=s.margins,document=new Document({title:model.title?`${model.title} — Resume`:'Resume',creator:'VCP Resume',styles:{default:{document:{run:{font,size:s.fontSize*2}}}},sections:[{properties:{page:{size:{width:Math.round(page.width*20),height:Math.round(page.height*20)},margin:{top:m.top*20,right:m.right*20,bottom:m.bottom*20,left:m.left*20}}},footers:{default:footer},children}]});
 return Packer.toBlob(document);
}
export function exportFilename(model,extension){const title=(model.title||'resume').normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/giu,'-').replace(/^-|-$/gu,'').slice(0,65)||'resume';return `${title.toLowerCase()}-${model.design}-${model.arrangement}.${extension}`;}
