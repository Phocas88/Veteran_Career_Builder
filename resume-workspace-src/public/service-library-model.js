import {normalizeProfile,branches} from './veteran-profile.js?v=20261026-career-tools';
import {fullCodeMatchesBase} from './service-codes.js?v=20261025-standalone-app';
const compact=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function searchServiceLibrary(data,{branch='',kind='specialty',query=''}={}){
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean),codeQuery=compact(query);
 return data.entries.filter(e=>(!branch||e.branch===branch)&&e.kind===kind&&(!terms.length||compact(e.code).includes(codeQuery)||terms.every(t=>(e.code+' '+e.title+' '+(data.branches[e.branch]?.name||'')+' '+(e.paths||[]).map(p=>p.name).join(' ')).toLowerCase().includes(t))));
}
// Only the code and chosen label become profile facts. General career guidance
// must never become the user's duties, skills, credentials or achievements.
export function addReferenceToProfile(input,entry,target='new'){
 const profile=normalizeProfile(input);
 if(!Object.hasOwn(branches,entry.branch)||!['specialty','qualification','designator'].includes(entry.kind)||typeof entry.code!=='string'||!entry.code.trim()||typeof entry.title!=='string'||!entry.title.trim())throw new Error('Choose a library reference.');
 let role;
 if(target==='new'){
  const empty=profile.roles.find(r=>!r.branch&&!r.code&&!r.title&&!r.duties&&!r.achievements&&!r.startDate&&!r.endDate&&Object.values(r).every(v=>Array.isArray(v)?v.length===0:typeof v==='boolean'?!v:!v));
  if(empty){role=empty;role.branch=entry.branch;}
  else{
  if(profile.roles.length>=12)throw new Error('Your profile already has 12 service experiences. Choose an existing matching experience.');
  role=normalizeProfile({roles:[{branch:entry.branch}]}).roles[0];profile.roles.push(role);
  }
 }else{
  const index=Number(target);if(!/^\d+$/.test(String(target))||!Number.isInteger(index)||!profile.roles[index])throw new Error('Choose the service experience to update.');
  role=profile.roles[index];if(role.branch!==entry.branch)throw new Error('This reference belongs to a different branch. Choose a matching service experience or create a new one.');
 }
 if(entry.kind==='specialty'){
  if(!role.fullCode&&role.code!==entry.code&&fullCodeMatchesBase(role.code,entry.code))role.fullCode=role.code;
  if(!fullCodeMatchesBase(role.fullCode,entry.code)){role.fullCode='';role.skillLevel='';}
  role.code=entry.code;role.mosTitle=entry.title;
 }else{
  const key=entry.kind==='qualification'?'asi':'sqi';
  if(role[key].some(q=>q.code.toLowerCase()===entry.code.toLowerCase()))throw new Error('This code is already on that experience. Review its existing description in your career profile instead of adding it twice.');
  if(role[key].length>=12)throw new Error('This experience already has 12 entries in this category. Review them in your career profile.');
  role[key].push({code:entry.code,desc:entry.title});
 }
 return profile;
}
