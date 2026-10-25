// Deliberate public allowlist. Never serialize an entire profile or resume here.
const text=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):'';
const rows=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object').slice(0,30):[];
const lines=(...values)=>values.flatMap(v=>text(v,6000).split(/\n+/)).map(v=>v.replace(/^[•*\-\s]+/,'')).filter(Boolean).slice(0,16);
export function safeCvLink(value){try{const url=new URL(text(value,500));return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
export const cvDefaults=()=>({military:true,civilian:true,education:true,skills:true,certifications:true,languages:true,location:false,email:false,phone:false,linkedin:false,index:false});
export function profileToCv(p={}){
 return {name:text(p.name,120),headline:'',summary:text(p.summary,3000),location:[text(p.city,120),text(p.state,80),text(p.country,80)].filter(Boolean).join(', '),
 military:rows(p.roles).filter(e=>e.branch||e.title||e.mosTitle).map(e=>({branch:({army:'U.S. Army',navy:'U.S. Navy',marines:'U.S. Marine Corps',airforce:'U.S. Air Force',coastguard:'U.S. Coast Guard',spaceforce:'U.S. Space Force'})[e.branch]||text(e.branch,80),rank:text(e.rank,120),mosTitle:text(e.title||e.mosTitle,200),unit:text(e.organization,200),serviceType:text(e.component||e.serviceType,120),startDate:text(e.startDate,30),endDate:text(e.endDate,30),current:e.current===true,bullets:lines(e.duties,e.achievements)})),
 civilian:rows(p.jobs).filter(e=>e.jobTitle||e.employer).map(e=>({title:text(e.jobTitle,200),employer:text(e.employer,200),location:'',startDate:text(e.startDate,30),endDate:text(e.endDate,30),current:e.current===true,bullets:lines(e.duties,e.achievements)})),
 education:rows(p.educationEntries).filter(e=>e.institution||e.degree).map(e=>({degree:[text(e.degree,160),text(e.status,40)].filter(Boolean).join(' · '),field:text(e.field,200),institution:text(e.institution,200),year:text(e.year||e.endDate,30)})),
 skills:{technical:rows(p.skillsEntries).map(e=>text(e.name,120)).filter(Boolean).join(', '),leadership:'',certs:rows(p.certifications).map(e=>[text(e.name,150),text(e.issuer,120),text(e.status,40)].filter(Boolean).join(' — ')).filter(Boolean).join(', '),languages:rows(p.languages).map(e=>text(e.name,120)).filter(Boolean).join(', ')},
 contact:{email:text(p.email,254),phone:text(p.phone,60),linkedin:safeCvLink(p.linkedin)}};
}
export function selectCv(base={},options=cvDefaults(),fields={}){
 const contact={};for(const key of ['email','phone','linkedin'])if(options[key]&&base.contact?.[key])contact[key]=key==='linkedin'?safeCvLink(base.contact[key]):text(base.contact[key],254);
 return {source:'vcp-resume-program',published:true,noindex:!options.index,name:text(fields.name??base.name,120),headline:text(fields.headline??base.headline,200),summary:text(fields.summary??base.summary,3000),location:options.location?text(base.location,300):'',
 military:options.military?base.military||[]:[],civilian:options.civilian?base.civilian||[]:[],education:options.education?base.education||[]:[],
 skills:{technical:options.skills?text(base.skills?.technical,6000):'',leadership:options.skills?text(base.skills?.leadership,6000):'',certs:options.certifications?text(base.skills?.certs,6000):'',languages:options.languages?text(base.skills?.languages,6000):''},contact};
}
export function optionsFromCv(cv){return {...cvDefaults(),military:!!cv.military?.length,civilian:!!cv.civilian?.length,education:!!cv.education?.length,skills:!!(cv.skills?.technical||cv.skills?.leadership),certifications:!!cv.skills?.certs,languages:!!cv.skills?.languages,location:!!cv.location,email:!!cv.contact?.email,phone:!!cv.contact?.phone,linkedin:!!cv.contact?.linkedin,index:cv.noindex===false};}
export async function cvSlug(uid){if(typeof uid!=='string'||!uid)throw new Error('Sign in to publish a digital CV.');const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('vcp-resume-program:'+uid));return 'vcp-resume-'+Array.from(new Uint8Array(hash)).slice(0,16).map(n=>n.toString(16).padStart(2,'0')).join('');}
export const cvUrl=slug=>'https://profiles.veterancareerpath.com/veteran/'+encodeURIComponent(slug);
