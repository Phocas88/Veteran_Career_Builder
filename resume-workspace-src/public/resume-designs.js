// Original layouts. A template changes presentation, never the applicant's facts.
const base={fontSize:10.5,lineHeight:1.12,nameSize:23,headingSize:11,sectionGap:11,paragraphGap:4,margin:44,color:'182C43',alignment:'left',font:'Roboto',layout:'single',header:'rule',category:'simple',description:'Simple, single-column layout'};
const d=(name,description,settings={})=>({...base,name,description,...settings});
const federal=(name,description,settings={})=>d(name,description,{federal:true,fontSize:10,lineHeight:1.12,nameSize:18,headingSize:14,sectionGap:10,paragraphGap:4,margin:36,color:'182C43',header:'plain',category:'federal',...settings});
export const designs={
 classic:d('Classic','Traditional, centered heading',{alignment:'center',color:'222222'}),
 modern:d('Modern','Contemporary teal rules',{color:'245B6A',nameSize:26,sectionGap:12}),
 compact:d('Compact','Concise spacing, clear hierarchy',{fontSize:10,lineHeight:1.08,nameSize:21,headingSize:10.5,sectionGap:8,paragraphGap:3,margin:38,color:'222222'}),
 federal:federal('Federal','USAJOBS · clear experience-first format'),
 executive:d('Executive','Strong navy heading band',{header:'band',nameSize:25,category:'professional'}),
 minimal:d('Minimal','Open space without decorative rules',{header:'plain',color:'333333',sectionGap:14,margin:50}),
 heritage:d('Heritage','Warm serif typography',{font:'SourceSerif',color:'68482D',nameSize:25,header:'rule',category:'professional'}),
 technical:d('Technical','Precise headings and compact details',{font:'Lato',color:'294D65',header:'bar',headingSize:12,sectionGap:10}),
 scholar:d('Scholar','Serif text with generous separation',{font:'SourceSerif',header:'plain',headingSize:12,sectionGap:15,margin:48,category:'professional'}),
 horizon:d('Horizon','Full-width heading, skills on the left',{layout:'left',header:'bar',color:'805A12',category:'designed'}),
 atlas:d('Atlas','Blue sidebar for supporting details',{layout:'left',header:'band',color:'244A70',font:'Lato',category:'designed'}),
 signal:d('Signal','Teal sidebar and crisp headings',{layout:'left',header:'rule',color:'245B6A',category:'designed'}),
 patriot:d('Patriot','Navy heading with restrained gold accents',{header:'band',color:'182C43',decoration:'9A7118',nameSize:26,category:'professional'}),
 leadership:d('Leadership','Experience leads, skills on the right',{layout:'right',header:'rule',color:'263D58',nameSize:25,category:'designed'}),
 consultant:d('Consultant','Serif details with a right-hand skills column',{layout:'right',font:'SourceSerif',header:'plain',color:'343A40',category:'designed'}),
 civic:d('Civic','Clean green section accents',{color:'28604A',header:'bar',font:'Lato',category:'professional'}),
 folio:d('Folio','Optional portrait with a compact sidebar',{layout:'right',header:'card',color:'62416A',category:'designed',photo:true}),
 graduate:d('Graduate','Friendly, clear headings for early careers',{color:'285A7A',font:'Lato',header:'bar',headingSize:12,category:'professional'}),
 industrial:d('Industrial','Strong heading bars and practical spacing',{header:'bar',color:'454D55',nameSize:26,headingSize:12,category:'professional'}),
 contemporary:d('Contemporary','Light heading panel with a modern hierarchy',{header:'card',color:'3F5269',sectionGap:13,category:'professional'}),
 manager:d('Manager','Serif heading and balanced experience layout',{font:'SourceSerif',header:'band',color:'263D58',nameSize:24,category:'professional'}),
 creative:d('Creative','Plum accents and supporting details on the left',{layout:'left',header:'card',color:'62416A',font:'Lato',category:'designed',photo:true}),
 'federal-concise':federal('Federal concise','USAJOBS · concise spacing, full required details',{font:'Lato',paragraphGap:3,sectionGap:9}),
 'federal-experience':federal('Federal experience','USAJOBS · larger body text and clear job headings',{fontSize:10.5,paragraphGap:4,sectionGap:11})
};
export const fontFamilies={Roboto:{name:'Roboto · clean sans serif',css:'ResumeSans,Arial,sans-serif',word:'Roboto'},Lato:{name:'Lato · humanist sans serif',css:'ResumeLato,Arial,sans-serif',word:'Lato'},SourceSerif:{name:'Source Serif · traditional serif',css:'ResumeSerif,Georgia,serif',word:'Source Serif 4'}};
export const accentColors={navy:'182C43',teal:'245B6A',slate:'454D55',green:'28604A',plum:'62416A',brown:'68482D',black:'222222'};
const bounded=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export function normalizeExportSettings(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 const out={};
 if(Object.hasOwn(fontFamilies,value.font))out.font=value.font;
 for(const [key,min,max]of [['fontSize',9,14],['headingSize',11,20],['nameSize',14,36],['lineHeight',1,1.6],['sectionGap',6,24],['paragraphGap',2,12]])if(value[key]!==undefined)out[key]=bounded(value[key],min,max,min);
 if([...Object.values(accentColors),...Object.values(designs).map(d=>d.color)].includes(value.color))out.color=value.color;
 if(['left','center','right'].includes(value.nameAlignment))out.nameAlignment=value.nameAlignment;
 if(['left','justify'].includes(value.textAlignment))out.textAlignment=value.textAlignment;
 if(value.margins&&typeof value.margins==='object'){out.margins={};for(const side of ['top','right','bottom','left'])out.margins[side]=bounded(value.margins[side],25,72,44);}
 if(Array.isArray(value.sectionOrder))out.sectionOrder=[...new Set(value.sectionOrder.filter(x=>typeof x==='string'&&/^section-[\w-]+$/.test(x)))].slice(0,50);
 if(value.headings&&typeof value.headings==='object'){out.headings={};for(const [key,title]of Object.entries(value.headings).slice(0,50))if(/^section-[\w-]+$/.test(key)&&typeof title==='string'&&title.trim())out.headings[key]=title.trim().replace(/[\r\n\t]/g,' ').slice(0,80);}
 if(Array.isArray(value.hiddenSections))out.hiddenSections=[...new Set(value.hiddenSections.filter(x=>typeof x==='string'&&/^section-[\w-]+$/.test(x)))].slice(0,50);
 if(typeof value.photo==='string'&&value.photo.length<=180000&&/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value.photo))out.photo=value.photo;
 return out;
}
export function resolveDesign(design,applicationType,settings){
 const federalMode=applicationType==='federal'||(Object.hasOwn(designs,design)&&designs[design].federal===true);
 const selected=Object.hasOwn(designs,design)?(federalMode&&!designs[design].federal?'federal':design):federalMode?'federal':'classic';
 const saved=normalizeExportSettings(settings),baseStyle=designs[selected];
 const style={...baseStyle,...Object.fromEntries(Object.entries(saved).filter(([key])=>['font','fontSize','headingSize','nameSize','lineHeight','sectionGap','paragraphGap','color'].includes(key))),alignment:saved.nameAlignment||baseStyle.alignment,textAlignment:saved.textAlignment||'left'};
 style.margins=saved.margins||Object.fromEntries(['top','right','bottom','left'].map(k=>[k,baseStyle.margin]));
 if(federalMode){style.font=style.font==='SourceSerif'?'Roboto':style.font;style.fontSize=Math.max(10,style.fontSize);style.headingSize=Math.max(14,style.headingSize);style.lineHeight=Math.max(1.1,style.lineHeight);style.margins=Object.fromEntries(Object.entries(style.margins).map(([key,v])=>[key,Math.max(36,v)]));style.layout='single';style.header='plain';style.alignment='left';style.textAlignment='left';style.color='182C43';}
 return {design:selected,style,federal:federalMode,settings:saved,photo:!federalMode&&baseStyle.photo?saved.photo:null};
}
