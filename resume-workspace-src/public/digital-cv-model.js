import {cleanPublicCv,cvSkillGroups,cvCredentialEntries,cvListItems} from './cv-content.js?v=20261030-skill-quality';
import {cleanResumeText,splitResumeSections,flowParagraphs} from './resume-text.js?v=20261028-guided';
import {safeProfilePhoto} from './profile-media.js?v=20261026-career-tools';
import {parseProfileResume} from './profile-import-model.js?v=20261028-guided';
// Deliberate public allowlist. Never serialize an entire profile or resume here.
const text=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):'';
const rows=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object').slice(0,30):[];
const lines=(...values)=>values.flatMap(v=>text(v,6000).split(/\n+/)).map(v=>v.replace(/^[•*\-\s]+/,'')).filter(Boolean);
function profileSkills(p){
 const entries=(Array.isArray(p.skillsEntries)?p.skillsEntries:[]).slice(0,150),categories={Technical:'Core skills',Leadership:'Leadership skills',Communication:'Communication & collaboration',Operations:'Operations',Other:'Additional skills'},groups=[];
 for(const entry of entries){const name=text(entry.name,250);if(!name)continue;const title=categories[entry.category]||'Core skills';let group=groups.find(g=>g.title===title);if(!group){group={title,items:[]};groups.push(group);}group.items.push(name);}
 return groups.map(group=>group.title+': '+group.items.join(', ')).join('\n')||text(p.skills,6000);
}
export function safeCvLink(value){try{const raw=text(value,500),url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i.test(raw)?'https://'+raw:raw);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export const cvDefaults=()=>({military:true,civilian:true,education:true,skills:true,certifications:true,languages:true,training:true,projects:true,location:false,email:false,phone:false,linkedin:false,portfolio:false,github:false,website:false,photo:false,index:false});
export function profileToCv(p={}){
 return cleanPublicCv({photo:safeProfilePhoto(p.photo),name:text(p.name,120),headline:'',summary:flowParagraphs(cleanResumeText(text(p.summary,3000),p.name)),location:[text(p.city,120),text(p.state,80),text(p.country,80)].filter(Boolean).join(', '),
 military:rows(p.roles).filter(e=>e.branch||e.title||e.mosTitle).map(e=>({branch:({army:'U.S. Army',navy:'U.S. Navy',marines:'U.S. Marine Corps',airforce:'U.S. Air Force',coastguard:'U.S. Coast Guard',spaceforce:'U.S. Space Force'})[e.branch]||text(e.branch,80),rank:text(e.rank,120),mosTitle:text(e.title||e.mosTitle,200),unit:text(e.organization,200),serviceType:text(e.component||e.serviceType,120),startDate:text(e.startDate,30),endDate:text(e.endDate,30),dateText:text(e.dates,100),current:e.current===true,bullets:lines(e.duties,e.achievements)})),
 civilian:rows(p.jobs).filter(e=>e.jobTitle||e.employer).map(e=>({title:text(e.jobTitle,200),employer:text(e.employer,200),location:'',startDate:text(e.startDate,30),endDate:text(e.endDate,30),dateText:text(e.dates,100),current:e.current===true,bullets:lines(e.duties,e.achievements)})),
 education:rows(p.educationEntries?.length?p.educationEntries:typeof p.education==='string'&&p.education.trim()?parseProfileResume('EDUCATION\n'+p.education).data.educationEntries:[]).filter(e=>e.institution||e.degree).map(e=>({degree:text(e.degree,6000),status:text(e.status,60),field:text(e.field,6000),institution:text(e.institution,6000),year:text(e.year||e.endDate,100)})),
 training:rows(p.training).filter(e=>e.name).map(e=>({name:text(e.name,200),institution:text(e.institution,200),date:text(e.date||e.endDate,60),status:text(e.status,60)})),
 projects:rows(p.projects).filter(e=>e.name).map(e=>({name:text(e.name,200),title:text(e.title,200),startDate:text(e.startDate,30),endDate:text(e.endDate,30),dateText:text(e.dates,100),current:e.current===true,bullets:lines(e.duties,e.achievements)})),
 skills:{technical:profileSkills(p),leadership:'',certs:rows(p.certifications).map(e=>[text(e.name,150),text(e.issuer,120),text(e.status,40)].filter(Boolean).join(' — ')).filter(Boolean).join('\n'),languages:rows(p.languages).map(e=>text(e.name,120)).filter(Boolean).join(', ')},
 contact:{email:text(p.email,254),phone:text(p.phone,60),linkedin:safeCvLink(p.linkedin),portfolio:safeCvLink(p.portfolio),github:safeCvLink(p.github),website:safeCvLink(p.website)}});
}
export function resumeToCv(resume){
 const {data}=parseProfileResume(cleanResumeText(resume));
 return profileToCv({...data.personal,...Object.fromEntries(Object.entries(data).filter(([key])=>key!=='personal'))});
}
export function selectCv(base={},options=cvDefaults(),fields={}){
 base=cleanPublicCv({...base,name:fields.name??base.name,headline:fields.headline??base.headline,summary:fields.summary??base.summary});
 const contact={};for(const key of ['email','phone','linkedin','portfolio','github','website'])if(options[key]&&base.contact?.[key])contact[key]=['linkedin','portfolio','github','website'].includes(key)?safeCvLink(base.contact[key]):text(base.contact[key],254);
 return {source:'vcp-resume-program',published:true,photo:options.photo?safeProfilePhoto(base.photo):'',noindex:!options.index,name:text(fields.name??base.name,120),headline:text(fields.headline??base.headline,200),summary:text(base.summary,3000),location:options.location?text(base.location,300):'',
 training:options.training?base.training||[]:[],projects:options.projects?base.projects||[]:[],
 military:options.military?base.military||[]:[],civilian:options.civilian?base.civilian||[]:[],education:options.education?(base.education||[]).filter(e=>e.institution?.trim()||e.degree?.trim()||e.field?.trim()):[],
 skills:{technical:options.skills?text(base.skills?.technical,6000):'',leadership:options.skills?text(base.skills?.leadership,6000):'',certs:options.certifications?text(base.skills?.certs,6000):'',languages:options.languages?text(base.skills?.languages,6000):''},contact};
}
export function optionsFromCv(cv){return {...cvDefaults(),military:!!cv.military?.length,civilian:!!cv.civilian?.length,education:!!cv.education?.length,training:!!cv.training?.length,projects:!!cv.projects?.length,skills:!!(cv.skills?.technical||cv.skills?.leadership),certifications:!!cv.skills?.certs,languages:!!cv.skills?.languages,location:!!cv.location,email:!!cv.contact?.email,phone:!!cv.contact?.phone,linkedin:!!cv.contact?.linkedin,portfolio:!!cv.contact?.portfolio,github:!!cv.contact?.github,website:!!cv.contact?.website,photo:!!safeProfilePhoto(cv.photo),index:cv.noindex===false};}
export async function cvSlug(uid){if(typeof uid!=='string'||!uid)throw new Error('Sign in to publish a digital CV.');const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('vcp-resume-program:'+uid));return 'vcp-resume-'+Array.from(new Uint8Array(hash)).slice(0,16).map(n=>n.toString(16).padStart(2,'0')).join('');}
export const cvUrl=slug=>'https://profiles.veterancareerpath.com/veteran/'+encodeURIComponent(slug);

export function cvSectionCounts(cv={}){return {military:cv.military?.length||0,civilian:cv.civilian?.length||0,education:cv.education?.length||0,skills:cvSkillGroups(cv.skills?.technical,cv.skills?.leadership).reduce((sum,group)=>sum+group.items.length,0),certifications:cvCredentialEntries(cv.skills?.certs).length,languages:cvListItems(cv.skills?.languages).length};}

export function normalizePublishedCv(cv){return cleanPublicCv(cv);}
