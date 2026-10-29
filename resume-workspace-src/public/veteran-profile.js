import {safeProfilePhoto} from './profile-media.js?v=20261026-career-tools';
import { personalFields, groups } from './profile-fields.js?v=20261026-career-tools';
export const branches = {
  army: { name: 'U.S. Army', code: 'MOS', example: '92Y' },
  navy: { name: 'U.S. Navy', code: 'Rating / NEC', example: 'LS / NEC, if applicable' },
  marines: { name: 'U.S. Marine Corps', code: 'MOS', example: '3043' },
  airforce: { name: 'U.S. Air Force', code: 'AFSC', example: '2S0X1' },
  coastguard: { name: 'U.S. Coast Guard', code: 'Rating', example: 'SK' },
  spaceforce: { name: 'U.S. Space Force', code: 'SFSC / former AFSC', example: 'Your specialty code' }
};
export const components = ['Active duty', 'Reserve', 'National Guard', 'Active Guard Reserve (AGR)'];
const clean = (value, max = 2400) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function normalizeEntry(value, spec) {
 value = value && typeof value === 'object' ? value : {};
 const out = Object.fromEntries(spec.fields.map(f => [f.key, f.type === 'checkbox' ? value[f.key] === true : clean(value[f.key], f.type === 'textarea' ? 2400 : 250)]));
 for (const [key,nested] of Object.entries(spec.nested || {})) out[key] = normalizeEntries(value[key], nested);
 if (value.dates) out.dates = clean(value.dates,100);
 return out;
}
function normalizeEntries(value, spec) {
 // Legacy awards/deployments were strings; retain them as explicitly entered facts.
 if (typeof value === 'string' && value.trim()) value=[{name:value}];
 return (Array.isArray(value) ? value : []).slice(0,12).map(v => normalizeEntry(typeof v === 'string' ? {name:v} : v,spec));
}
export function normalizeProfile(input = {}) {
 const p={schemaVersion:3,...Object.fromEntries(personalFields.map(f=>[f.key,f.type==='photo'?safeProfilePhoto(input[f.key]):clean(input[f.key],f.type==='textarea'?2400:250)]))};
 for (const [key,spec] of Object.entries(groups)) p[key]=normalizeEntries(input[key],spec);
 for(const role of p.roles){if(!Object.hasOwn(branches,role.branch))role.branch='';if(!components.includes(role.component))role.component='';}
 for(const [key,max] of [['contact',500],['civilian',4000],['education',2000],['skills',1800]])p[key]=clean(input[key],max);
 return p;
}
const join = (...v) => v.filter(Boolean).join(' · ');
const dates = r => [r.startDate,r.current?'Present':r.endDate].filter(Boolean).join(' – ') || r.dates || '';
function clearance(r){return r.includeClearance && r.clearanceLevel && r.clearanceLevel!=='None' ? join('Clearance: '+r.clearanceLevel,'Status: '+(r.clearanceStatus||'Unknown'),r.sciAccess&&'SCI access (verified)',r.polygraph&&r.polygraph!=='None'&&r.polygraph) : '';}
function extras(r){return [r.hours&&'Hours per week: '+r.hours,r.duties,r.achievements,r.tools&&'Tools / systems: '+r.tools,r.teamSize&&'Team supervised: '+r.teamSize,r.budget&&'Budget / assets: '+r.budget,clearance(r)].filter(Boolean);}
function serviceLines(r){return [
 join(r.title||r.mosTitle,dates(r)),join(branches[r.branch]?.name,r.component,r.serviceType,r.organization,r.location),join(r.rank&&'Military rank: '+r.rank,r.payGrade&&'Pay grade: '+r.payGrade,r.code&&(branches[r.branch]?.code||'Specialty code')+': '+r.code,r.fullCode&&'Full specialty code (as recorded): '+r.fullCode,r.skillLevel&&'Skill level / specialty grade (as recorded): '+r.skillLevel,r.mosTitle,r.tos&&'Time in service: '+r.tos),...extras(r),
 ...r.rankHistory.filter(x=>x.rank||x.payGrade).map(x=>join(x.rank&&'Rank history: '+x.rank,x.payGrade&&'Pay grade: '+x.payGrade,dates(x))),
 ...r.mosRoles.filter(hasText).map(x=>join('Position: '+x.title,x.rankAtRole,[x.fromYear,x.toYear].filter(Boolean).join(' – '),x.keyDuty,x.achievements)),
 ...['asi','sqi'].flatMap(k=>r[k].filter(hasText).map(x=>join(k==='asi'?'Additional qualification':'Special designator',x.code,x.desc))),
 ...r.additionalDuties.filter(hasText).map(x=>join('Additional duty: '+x.name,dates(x),x.duties)),
 ...r.awards.filter(hasText).map(x=>join('Award: '+x.name,x.date,x.reason)),...r.deployments.filter(hasText).map(x=>join('Deployment / operation: '+x.name,x.location,dates(x),x.duties))
 ].filter(Boolean);}
const hasText=entry=>Object.values(entry).some(value=>typeof value==='string'&&value.trim());
const hasServiceWork=r=>r.duties||r.achievements||r.mosRoles.some(x=>x.keyDuty||x.achievements)||r.additionalDuties.some(x=>x.duties)||r.deployments.some(x=>x.duties);
export function profileToResume(input) {
 const p=normalizeProfile(input); const sections=[p.name,join(p.email,p.phone,join(p.city,p.state,p.country),p.linkedin,p.portfolio,p.github,p.website,p.contact),p.summary&&'PROFESSIONAL SUMMARY\n'+p.summary];
 const military=p.roles.map(r=>{const lines=serviceLines(r);if(lines.length&&!r.branch)throw new Error('Choose a branch for each service experience.');return lines.join('\n');}).filter(Boolean);
 if(military.length)sections.push('MILITARY EXPERIENCE\n'+military.join('\n\n'));
 const civilian=p.jobs.filter(r=>r.employer||r.jobTitle||r.duties||r.achievements).map(r=>[join(r.jobTitle,dates(r)),join(r.employer,r.type,r.city,r.state,r.country),join(r.series&&'Federal series: '+r.series,r.grade&&'Pay plan / grade: '+r.grade),...extras(r),r.reasonLeaving&&'Reason for leaving: '+r.reasonLeaving,r.includeSupervisor&&join(r.supervisor&&'Supervisor: '+r.supervisor,r.supervisorPhone,r.contactPermission&&'Contact permission: '+r.contactPermission)].filter(Boolean).join('\n'));
 if(civilian.length||p.civilian)sections.push('CIVILIAN EXPERIENCE\n'+[civilian.join('\n\n'),p.civilian].filter(Boolean).join('\n\n'));
 const edu=p.educationEntries.filter(x=>x.institution||x.degree).map(x=>[join(x.degree,x.field,x.minor&&'Minor: '+x.minor),join(x.institution,x.city,x.state,x.country),join(x.status,dates(x)||x.year,x.gpa&&'GPA: '+x.gpa+(x.gpaScale?'/'+x.gpaScale:''),x.credits&&x.credits+' '+x.creditType+' credits'),x.honors,x.coursework&&'Coursework: '+x.coursework,x.pme&&'Military schools / PME: '+x.pme].filter(Boolean).join('\n'));
 if(edu.length||p.education)sections.push('EDUCATION\n'+[...edu,p.education].filter(Boolean).join('\n\n'));
 const certs=p.certifications.filter(x=>x.name).map(x=>join(x.name,x.issuer,x.status,x.issued&&'Issued: '+x.issued,x.noExpiry?'No expiry':x.expires&&'Expires: '+x.expires,x.jurisdiction,x.credentialId,x.url));
 if(certs.length)sections.push('LICENSES & CERTIFICATIONS\n'+certs.join('\n'));
 const training=p.training.filter(x=>x.name).map(x=>join(x.name,x.institution,x.date,x.status,x.hours&&x.hours+' training hours',x.skills));if(training.length)sections.push('PROFESSIONAL TRAINING\n'+training.join('\n'));
 const skills=p.skillsEntries.filter(x=>x.name).map(x=>join(x.name,x.category,x.proficiency,x.evidence));if(skills.length||p.skills)sections.push('SKILLS\n'+[...skills,p.skills].filter(Boolean).join('\n'));
 const languages=p.languages.filter(x=>x.name).map(x=>join(x.name,x.speaking&&'Speaking: '+x.speaking,x.reading&&'Reading: '+x.reading,x.writing&&'Writing: '+x.writing,x.test));if(languages.length)sections.push('LANGUAGES\n'+languages.join('\n'));
 const projects=p.projects.filter(x=>x.name||x.title||x.duties||x.achievements).map(x=>[join(x.name,x.title,dates(x)),x.duties,x.achievements,x.url].filter(Boolean).join('\n'));if(projects.length)sections.push('PROJECTS & VOLUNTEERING\n'+projects.join('\n\n'));
 const resume=sections.filter(Boolean).join('\n\n');
 if(!p.name||!p.roles.some(hasServiceWork)&&!p.jobs.some(r=>r.duties||r.achievements)&&!p.civilian&&!p.projects.some(r=>r.duties))throw new Error('Add your name and actual duties or civilian experience before building your draft.');
 if(resume.length>20000)throw new Error('Your background exceeds the 20,000-character AI draft limit. Your fields are unchanged. Save your background, then shorten details to the experience relevant to this application.');
 return resume;
}
export function profileFromWebsite(data={}){
 if(data.resumeWorkspaceProfile)return normalizeProfile(data.resumeWorkspaceProfile);
 const personal=data.personal||{};
 const findBranch=value=>!value?'':Object.keys(branches).find(k=>(branches[k].name+k).toLowerCase().includes(String(value||'').toLowerCase().replace(/^u\.?s\.?\s*/i,'')))||'';
 const text=v=>typeof v==='string'?v:Array.isArray(v)?v.filter(x=>typeof x==='string').join('\n'):'';
 return normalizeProfile({...personal,city:personal.city||personal.location,roles:(data.milExperiences||data.experiences||[]).map(r=>({...r,branch:findBranch(r.branch),component:r.component||({ 'Active Duty':'Active duty' }[r.serviceType]||r.serviceType),code:r.mos||r.afsc||r.rating,title:r.dutyTitle||r.jobTitle||r.title||r.mosTitle,organization:r.unit,location:r.location,duties:text(r.duties||r.description||r.achievements)})),jobs:data.civExperiences,educationEntries:data.education,skills:typeof data.skills==='string'?data.skills:Object.values(data.skills||{}).map(text).filter(Boolean).join('\n')});
}
