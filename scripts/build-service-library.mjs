import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {branchCatalog,additionalDuties} from '../resume-workspace-src/public/branch-catalog.js';
import {guideReference} from './service-library-content.mjs';

// Rebuild from the website's own reference sources, rather than maintaining a
// second handwritten MOS/qualification list inside the resume program.
const root=fileURLToPath(new URL('../',import.meta.url));
const context={window:{}};
for(const file of ['app-data.js','vcp-mos-data.js','vcp-military-data.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{timeout:3000});
const curation=JSON.parse(fs.readFileSync(path.join(root,'data/mos-curation.json'),'utf8'));
const crosswalk=JSON.parse(fs.readFileSync(path.join(root,'mos-crosswalk-data.json'),'utf8'));
const names={army:'Army',navy:'Navy',marines:'Marines',airforce:'Air Force',coastguard:'Coast Guard',spaceforce:'Space Force'};
const aliases={'Marine Corps':'marines',Marines:'marines',Army:'army',Navy:'navy','Air Force':'airforce','Coast Guard':'coastguard','Space Force':'spaceforce'};
const slugPrefix={'navy|BM':'navy-','navy|DC':'navy-','navy|EM':'navy-','navy|ET':'navy-','navy|GM':'navy-','navy|MU':'navy-','navy|OS':'navy-','navy|PS':'navy-','navy|YN':'navy-','coastguard|IT':'coast-guard-'};
const text=(v,max=1600)=>typeof v==='string'?v.trim().slice(0,max):'';
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
const internal=v=>typeof v==='string'&&/^[a-z0-9-]+\.html$/.test(v)&&fs.existsSync(path.join(root,v))?'https://veterancareerpath.com/'+v:'';
const entries=new Map();
const guideCache=new Map();
function add(branch,kind,code,title,source){
 code=text(code,120).toUpperCase();title=text(title,250);if(!code||!title||!names[branch])return;
 const key=[branch,kind,code,title.toLowerCase()].join('|');
 if(entries.has(key)){const e=entries.get(key);if(!e.sources.includes(source))e.sources.push(source);return;}
 const entry={id:key,branch,kind,code,title,sources:[source],ambiguous:false};
 if(kind==='specialty'){
  const key=names[branch]+'|'+code,curated=curation[key]||{};
  entry.intro=text(curated.intro,1800);entry.capabilities=(curated.capabilities||[]).slice(0,8).map(v=>text(v,400));
  entry.paths=(curated.paths||[]).slice(0,7).map(v=>({name:text(v[0],200),sector:text(v[1],100),why:text(v[2],1000),bridge:text(v[3],1000),url:internal(v[4])}));
  entry.citations=(curated.citations||[]).map(v=>({label:text(v.label,200),url:safeUrl(v.url)})).filter(v=>v.url).slice(0,8);
  entry.reviewedAt=text(curated.reviewedAt,30);
  // Keep military occupations (55-xxxx) distinct from civilian career options.
  entry.crosswalk=(crosswalk.occupations[key]||[]).filter(v=>!v.code.startsWith('55-')).slice(0,10).map(v=>({code:text(v.code,30),title:text(v.title,250)}));
  const slug=(slugPrefix[branch+'|'+code]||'')+code.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const guidePath=path.join(root,'mos',slug+'.html');
  entry.guide=fs.existsSync(guidePath)?'https://veterancareerpath.com/mos/'+slug+'.html':'';
  if(entry.guide){
   if(!guideCache.has(guidePath))guideCache.set(guidePath,guideReference(fs.readFileSync(guidePath,'utf8')));
   const guide=guideCache.get(guidePath);
   if(aliases[guide.branch]!==branch||guide.code.toUpperCase()!==code)entry.guide='';
   else{
    if(!entry.intro)entry.intro=text(guide.intro,1800);
    if(!entry.paths.length)entry.paths=guide.paths.slice(0,7).map(v=>({name:text(v.name,200),sector:text(v.sector,100),why:text(v.why,1000),bridge:text(v.bridge,1000),url:internal(v.href.replace(/^\//,''))}));
    if(!entry.citations.length)entry.citations=guide.citations.slice(0,8).map(v=>({label:text(v.label,200),url:safeUrl(v.url)})).filter(v=>v.url);
   }
  }
 }
 entries.set(key,entry);
}
for(const [branch,catalog]of Object.entries(branchCatalog)){
 for(const entry of catalog.specialties)add(branch,'specialty',entry.code,entry.title,'Resume branch catalog');
 for(const entry of catalog.qualifications.items)add(branch,'qualification',entry.code,entry.desc,'Website app-data.js');
 for(const entry of catalog.qualifications.sqi)add(branch,'designator',entry.code,entry.desc,'Website app-data.js');
}
for(const [name,items]of Object.entries(context.window.VCP_MOS))for(const entry of items)add(aliases[name],'specialty',entry.code,entry.title,'Website MOS library');
for(const [code,entry]of Object.entries(context.MOS_DATA))add(aliases[entry.branch],'specialty',code,entry.title,'Website app-data.js');
for(const [name,catalog]of Object.entries(context.window.VCP_MIL.SPECIAL_QUALS)){
 for(const entry of catalog.items)add(aliases[name],'qualification',entry.code,entry.title,'Website military reference');
 for(const entry of catalog.sqiItems||[])add(aliases[name],'designator',entry.code,entry.title,'Website military reference');
}
const byCode=new Map();
for(const e of entries.values()){const k=[e.branch,e.kind,e.code].join('|');if(!byCode.has(k))byCode.set(k,[]);byCode.get(k).push(e);}
for(const variants of byCode.values())if(variants.length>1)for(const e of variants)e.ambiguous=true;
const result={source:'Veteran Career Path website reference libraries',crosswalkSource:crosswalk.source,crosswalkDate:crosswalk.generated,
 branches:Object.fromEntries(Object.entries(branchCatalog).map(([key,c])=>[key,{name:c.name,qualificationLabel:c.qualifications.label,designatorLabel:c.qualifications.sqiLabel}])),
 entries:[...entries.values()].sort((a,b)=>a.branch.localeCompare(b.branch)||a.kind.localeCompare(b.kind)||a.code.localeCompare(b.code,undefined,{numeric:true})||a.title.localeCompare(b.title)),additionalDuties};
const dest=path.join(root,'resume-workspace-src/public/service-library-data.json');
fs.writeFileSync(dest,JSON.stringify(result));
console.log(`Built service library: ${result.entries.length} references across ${Object.keys(result.branches).length} branches; conflicting labels remain marked for verification.`);
