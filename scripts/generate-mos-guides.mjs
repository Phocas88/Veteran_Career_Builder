import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_CSV = process.argv[2];
const CROSSWALK_JSON = path.join(ROOT, 'mos-crosswalk-data.json');
const SERVICE = { Army:'A', 'Air Force':'F', Navy:'N', Marines:'M', 'Coast Guard':'C', 'Space Force':'S' };
const HUB = { Army:'army-mos-careers.html', 'Air Force':'air-force-afsc-careers.html', Navy:'navy-rate-careers.html', Marines:'marine-corps-mos-careers.html', 'Coast Guard':'coast-guard-rating-careers.html', 'Space Force':'space-force-afsc-careers.html' };
const EMBLEM = { Army:'army', Navy:'navy', 'Air Force':'airforce', Marines:'marines', 'Coast Guard':'coastguard', 'Space Force':'spaceforce' };

const sandbox = { window:{} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'vcp-mos-data.js'), 'utf8'), sandbox);
const codesByBranch = sandbox.window.VCP_MOS;

function parseCsv(text) {
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){ if(c==='"'&&text[i+1]==='"'){field+='"';i++;} else if(c==='"') quoted=false; else field+=c; }
    else if(c==='"') quoted=true;
    else if(c===','){row.push(field);field='';}
    else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  const head=rows.shift(); return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]||''])));
}

function rankKind(title){
  if(/officer|commander|director/i.test(title)) return 'O';
  if(/warrant/i.test(title)) return 'W';
  return 'E';
}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function slug(code){return code.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

let official={}, rankTypeMap={};
if(SOURCE_CSV){
  const rows=parseCsv(fs.readFileSync(SOURCE_CSV,'utf8'));
  for(const [branch, entries] of Object.entries(codesByBranch)){
    for(const entry of entries){
      const key=`${branch}|${entry.code}`;
      const all=rows.filter(r=>r.SVC===SERVICE[branch]&&norm(r.MOC)===norm(entry.code));
      const titleKind=rankKind(entry.title);
      const mpcs=all.map(r=>r.MPC).filter(Boolean);
      // rank category (E/W/O): trust the title hint if the data agrees, else the most common MPC in the data
      const rt = mpcs.includes(titleKind) ? titleKind : (mpcs.slice().sort((a,b)=>mpcs.filter(x=>x===b).length-mpcs.filter(x=>x===a).length)[0] || titleKind);
      rankTypeMap[key]=rt;
      const scoped=all.filter(r=>r.MPC===rt), pool=scoped.length?scoped:all;
      const exact=pool.filter(r=>norm(r.MOC_TITLE)===norm(entry.title));
      const chosen=exact.length?exact:pool;
      const roles=[];
      for(const r of chosen) for(let i=1;i<=4;i++) if(r[`ONET${i}_TITLE`]&&!roles.some(x=>x.title===r[`ONET${i}_TITLE`])) roles.push({code:r[`ONET${i}`],title:r[`ONET${i}_TITLE`]});
      official[key]=roles.slice(0,8);
    }
  }
  fs.writeFileSync(CROSSWALK_JSON, JSON.stringify({source:'O*NET Military Occupational Classification Crosswalk, August 2024',generated:new Date().toISOString().slice(0,10),occupations:official,rankType:rankTypeMap},null,2)+'\n');
} else {
  const data=JSON.parse(fs.readFileSync(CROSSWALK_JSON,'utf8'));
  official=data.occupations; rankTypeMap=data.rankType||{};
}

const PATHS = {
  engineering:[
    ['Construction operations','Civilian','Field coordination, site preparation, materials, safety, and work sequencing.','OSHA 10/30; document project scope and equipment used.','veteran-construction-management-careers.html'],
    ['Heavy equipment operator','Civilian / public works','Vehicle and equipment operation transfers to earthmoving, utilities, roadwork, and site development.','State or employer equipment qualification; CDL can widen options.','veteran-construction-management-careers.html'],
    ['Surveying or GIS technician','Civilian / government','Reconnaissance, route analysis, terrain reading, measurements, and reporting support technical field work.','Learn civilian GIS/CAD tools; licensure is not implied.','veteran-data-analytics-careers.html'],
    ['Emergency management specialist','Federal / state / local','Risk assessment, contingency planning, team coordination, and operating under pressure support disaster work.','FEMA Independent Study courses; translate exercises into planning outcomes.','veteran-emergency-management-careers.html'],
    ['Safety coordinator','Civilian / federal contractor','Hazard recognition, controls, standards enforcement, and pre-operation checks are valuable safety experience.','OSHA credential; ASP/CSP requires separate eligibility.','veteran-construction-management-careers.html'],
    ['Project coordinator','Civilian / contractor','Planning people, equipment, timelines, reports, and mission requirements maps to project delivery.','CAPM or construction scheduling fundamentals can bridge terminology.','veteran-project-management-careers.html'],
    ['Explosives or blasting support','Civilian / government','Demolition planning and explosives safety may relate to regulated blasting, EOD support, mining, or public safety roles.','Civilian licensing, background checks, and employer-specific training are mandatory.','veteran-construction-management-careers.html']
  ],
  logistics:[
    ['Logistics coordinator','Civilian / contractor','Movement planning, accountability, dispatch, and mission deadlines map to logistics operations.','Document volume, routes, equipment, and readiness outcomes.','veteran-supply-chain-careers.html'],
    ['Fleet operations','Civilian / government','Vehicle readiness, inspections, scheduling, and operator discipline support fleet organizations.','CDL or fleet software training may be useful.','veteran-trucking-careers.html'],
    ['Supply chain analyst','Civilian','Inventory, demand, bottleneck, and readiness experience can support planning and analysis.','Excel, ERP, and data visualization skills widen access.','veteran-supply-chain-careers.html'],
    ['Warehouse or distribution lead','Civilian','Accountability, material handling, safety, and team tempo map to distribution centers.','Forklift and OSHA credentials may help.','veteran-supply-chain-careers.html'],
    ['Transportation specialist','Federal / state','Routing, compliance, documentation, and operational coordination map to public transportation roles.','Translate military vehicle classes and regulated cargo experience.','federal-jobs-search.html'],
    ['Operations supervisor','Civilian','NCO leadership, shift turnover, standards, and resource allocation support frontline operations leadership.','Lean or Six Sigma fundamentals can bridge vocabulary.','veteran-project-management-careers.html']
  ],
  mechanical:[
    ['Industrial maintenance technician','Civilian','Troubleshooting, preventive maintenance, technical manuals, and equipment readiness transfer directly.','Add civilian electrical, PLC, or OEM credentials as needed.','veteran-manufacturing-careers.html'],
    ['Quality inspector','Civilian / defense','Inspection discipline, specifications, documentation, and corrective action support quality functions.','ASQ or metrology training can strengthen the transition.','veteran-manufacturing-careers.html'],
    ['Field service technician','Civilian','Independent diagnostics, repair, customer communication, and travel readiness fit field service work.','Translate platforms into systems, tools, and fault-isolation methods.','veteran-manufacturing-careers.html'],
    ['Reliability or maintenance planner','Civilian','Readiness tracking, parts forecasting, work orders, and failure patterns map to reliability programs.','CMMS experience and planning credentials help.','veteran-manufacturing-careers.html'],
    ['Defense systems technician','Federal contractor','Platform knowledge, clearance eligibility, and technical maintenance support defense programs.','Search by system and subsystem—not only MOS title.','veteran-government-contractor-careers.html'],
    ['Production supervisor','Civilian','Senior maintainers often bring safety, throughput, training, and resource leadership.','Lean/Six Sigma can translate process-improvement experience.','veteran-manufacturing-careers.html']
  ],
  technology:[
    ['IT support or systems technician','Civilian / government','Troubleshooting, user support, configuration, and mission uptime map to technical operations.','CompTIA or vendor credentials can validate current skills.','veteran-cybersecurity-careers.html'],
    ['Cybersecurity analyst','Civilian / federal','Access control, communications security, monitoring, and incident discipline support cyber pathways.','Security+ is a common bridge; role eligibility varies.','veteran-cybersecurity-careers.html'],
    ['Network operations','Civilian / contractor','Connectivity, fault isolation, documentation, and uptime responsibilities map to NOC roles.','Document protocols, platforms, and scale.','veteran-cybersecurity-careers.html'],
    ['Technical project coordinator','Civilian','Change control, requirements, teams, and operational deadlines support project delivery.','CAPM, Agile, or ITIL vocabulary may help.','veteran-project-management-careers.html'],
    ['Data or operations analyst','Civilian / government','Logs, reporting, pattern recognition, and readiness metrics provide an analytics foundation.','Add Excel, SQL, and visualization skills.','veteran-data-analytics-careers.html'],
    ['Federal IT specialist','Federal','Military technical experience may support 2210-series roles when specialized-experience requirements are met.','Mirror the vacancy questionnaire and document scope precisely.','federal-jobs-search.html']
  ],
  operations:[
    ['Operations coordinator','Civilian / contractor','Planning, standards, communication, risk control, and mission execution map across industries.','Use quantified scope: people, assets, tempo, and outcomes.','veteran-project-management-careers.html'],
    ['Emergency management','Federal / state / local','Contingency planning and coordinated response translate beyond public safety.','FEMA coursework can add civilian terminology.','veteran-emergency-management-careers.html'],
    ['Training specialist','Civilian / government','Instruction, evaluation, qualification, and coaching support workforce development.','Document curriculum, audience size, and performance gains.','veteran-human-resources-careers.html'],
    ['Safety and compliance','Civilian','Standards enforcement, inspections, after-action review, and risk mitigation support compliance work.','Add industry-specific safety credentials.','veteran-manufacturing-careers.html'],
    ['Project coordinator','Civilian / government','Resource planning, briefings, dependencies, and deadlines map to project teams.','CAPM is an optional vocabulary bridge.','veteran-project-management-careers.html'],
    ['Federal program support','Federal','Staff work, records, coordination, and operational subject matter can map to many occupational series.','Target the specialized experience in each announcement.','federal-jobs-search.html']
  ],
  health:[
    ['Clinical / patient care support','Civilian healthcare','Patient care, assessment, and documentation transfer to clinical support roles.','Employer onboarding or certification; licensed roles require state licensure.','veteran-healthcare-careers.html'],
    ['Healthcare logistics / supply','Civilian healthcare','Medical supply and equipment handling support healthcare supply chains.','A supply or CRCST credential helps.','veteran-supply-chain-careers.html'],
    ['Health administration / operations','Civilian healthcare','Records, scheduling, and coordination support health-operations roles.','Highlight throughput and quality outcomes.','veteran-human-resources-careers.html'],
    ['Federal / VA health roles','Federal','Documented clinical experience supports federal health roles.','Target the specialized experience; licensure varies.','federal-jobs-search.html'],
    ['Training and instruction','Civilian / government','Clinical training experience supports workforce development.','Document curriculum and outcomes.','veteran-human-resources-careers.html']
  ],
  protective:[
    ['Law enforcement','Federal / state / local','Judgment, patrol, and investigation experience transfer to policing.','Academy / POST; background and fitness standards apply.','veteran-law-enforcement-careers.html'],
    ['Corporate security / loss prevention','Civilian','Security, investigations, and incident response support corporate security.','State licensing may apply; ASIS credentials help.','veteran-government-contractor-careers.html'],
    ['Corrections','State / federal','Detention and supervision experience map to corrections roles.','Academy/certification requirements apply.','veteran-law-enforcement-careers.html'],
    ['Emergency management','Federal / state / local','Incident response and coordination translate to disaster and EOC work.','FEMA Independent Study courses help.','veteran-emergency-management-careers.html'],
    ['Investigations / compliance','Civilian / government','Report writing and evidence discipline support investigations and compliance.','Document case types and outcomes.','veteran-human-resources-careers.html'],
    ['Federal protective / security roles','Federal','Security experience supports several federal series.','Target the specialized experience.','federal-jobs-search.html']
  ],
  business:[
    ['Business / operations analyst','Civilian','Records, reporting, and process discipline support analyst roles.','Add Excel/SQL and reporting skills.','veteran-data-analytics-careers.html'],
    ['Finance / accounting support','Civilian','Transaction processing and accountability support finance roles.','Add accounting fundamentals.','veteran-financial-services-careers.html'],
    ['HR / administrative coordinator','Civilian','Records and personnel actions support HR and admin roles.','SHRM-CP/PHR optional.','veteran-human-resources-careers.html'],
    ['Procurement / purchasing','Civilian / government','Requisition and vendor coordination support purchasing.','Purchasing fundamentals help.','veteran-supply-chain-careers.html'],
    ['Project coordinator','Civilian','Planning, budgets, and deadlines map to project teams.','CAPM is an optional bridge.','veteran-project-management-careers.html'],
    ['Federal business / admin roles','Federal','Administrative and business experience map to several series.','Target the specialized experience.','federal-jobs-search.html']
  ]
};

// Per-code human/researched overrides. Loaded from data/mos-curation.json so curation
// can scale independently of the generator (see that file's _meta for the schema).
const CURATED=(()=>{ try{ const j=JSON.parse(fs.readFileSync(path.join(ROOT,'data','mos-curation.json'),'utf8')); delete j._meta; return j; }catch(e){ console.warn('No mos-curation.json ('+e.message+') — using family fallback only.'); return {}; } })();
// O*NET occupation info {t:title, d:description}, keyed by O*NET-SOC code (direct + related jobs).
const OCC=(()=>{ try{ return JSON.parse(fs.readFileSync(path.join(ROOT,'data','onet-occupations.json'),'utf8')); }catch(e){ return {}; } })();
// O*NET "related occupations" for each direct-match SOC code → more close civilian jobs per MOS.
const RELATED=(()=>{ try{ return JSON.parse(fs.readFileSync(path.join(ROOT,'data','onet-related.json'),'utf8')); }catch(e){ return {}; } })();

function familyFor(title){
  const t=title.toLowerCase();
  if(/engineer|construction|bridge|survey|carpenter|electrician|plumb|utilities|pavement|equipment operator/.test(t)) return 'engineering';
  if(/transport|driver|logistic|supply|warehouse|cargo|freight|postal|storekeeper|traffic management/.test(t)) return 'logistics';
  if(/mechanic|maintenance|repair|machin|weld|fabricat|power|propulsion|ordnance|avionic|aircraft|vehicle|electronics/.test(t)) return 'mechanical';
  if(/cyber|computer|network|information|signal|communication|software|systems|radio|satellite|space|intelligence|crypt|data/.test(t)) return 'technology';
  return 'operations';
}
function experienceBands(branch, title, rt){
  rt = rt || rankKind(title);
  if(rt==='O') return [
    ['Junior officer (O-1–O-3)','Translate planning, technical judgment, briefings, team leadership, and the people and resources you were accountable for.'],
    ['Field-grade officer (O-4–O-5)','Emphasize programs, budgets, cross-functional organizations, policy, risk ownership, and measurable operational outcomes.'],
    ['Senior officer (O-6+)','Target director, program, operations, and public-sector leadership roles that match your actual scope.']
  ];
  if(rt==='W') return [
    ['Warrant Officer (WO1–CW2)','Lead with your technical specialty and hands-on expertise—the systems, platforms, and problems you personally own as a technical authority.'],
    ['Chief Warrant Officer (CW3–CW4)','Add technical leadership: advising commanders, managing complex systems or programs, integrating capabilities, and mentoring technicians.'],
    ['Senior Chief Warrant Officer (CW5)','Emphasize enterprise technical authority: strategy, standards, senior advising, and organization-wide technical leadership.']
  ];
  const naval=['Navy','Coast Guard'].includes(branch);
  const junior='E-1–E-4';
  const nco=naval?'E-5–E-6 / Petty Officer':'E-5–E-6 / NCO';
  const senior=naval?'E-7–E-9 / Chief':'E-7–E-9 / Senior NCO';
  return [
    [junior,'Lead with hands-on tasks, tools, equipment, qualifications, safety discipline, and the conditions in which you performed. Do not inflate supervisory scope.'],
    [nco,'Add team leadership, training, inspections, work allocation, quality control, readiness, and the people or assets you directly supervised.'],
    [senior,'Emphasize multi-team operations, schedules, resource forecasting, safety systems, policy enforcement, advising leaders, and organization-level results.']
  ];
}
function genericCapabilities(title,family){
  const common={engineering:['Technical problem solving','Field operations and site safety','Equipment and material coordination','Reconnaissance, measurement, and reporting','Working from plans and standards','Team execution under constraints'],logistics:['Movement and resource coordination','Accountability and documentation','Safety and compliance','Scheduling and prioritization','Equipment readiness','Cross-team communication'],mechanical:['Diagnostics and fault isolation','Preventive maintenance','Technical manuals and specifications','Tool and test-equipment use','Quality and safety controls','Equipment readiness reporting'],technology:['Technical troubleshooting','Configuration and documentation','Security and access discipline','System monitoring and continuity','User or mission support','Incident response and communication'],operations:['Planning and execution','Risk assessment','Standards and compliance','Team communication','Training and evaluation','Resource accountability'],health:['Patient and clinical support','Assessment and documentation','Safety and infection control','Medication or treatment support','Records and accountability','Team-based care coordination'],protective:['Security and access control','Incident response and reporting','Investigations and documentation','Risk and threat assessment','De-escalation and sound judgment','Standards and compliance'],business:['Records and transaction processing','Accountability and auditing','Data entry and reporting','Policy and compliance','Client and customer support','Resource and budget coordination']};
  return (common[family]||common.operations).map(x=>`${x} in ${title.toLowerCase()} work`);
}
function hubCard(entry, href, count){
  return `<a class="mos-card" data-code="${esc(entry.code)}" data-title="${esc(entry.title)}" href="${href}" style="display:block;background:#fff;border:1px solid #dde3ec;border-radius:8px;padding:.85rem;text-decoration:none;transition:border-color .15s"><div style="font-family:Bebas Neue,sans-serif;font-size:1rem;letter-spacing:.08em;color:#1a3a6b">${esc(entry.code)}</div><div style="font-size:.78rem;color:#5a7090;margin-top:.2rem;line-height:1.4">${esc(entry.title)}</div><div class="career-dir" style="font-size:.72rem;color:#1a7a40;margin-top:.35rem;font-weight:600">→ Explore ${count} career directions</div></a>`;
}
// Data-driven baseline: map each code's OFFICIAL O*NET occupations (via SOC major
// group) to civilian career clusters, so non-curated pages still get code-specific
// directions instead of a keyword-picked family. Grounded in the crosswalk; honest.
const SOC_CLUSTER={
  '11':['Management & project leadership','veteran-project-management-careers.html'],
  '13':['Business & financial operations','veteran-financial-services-careers.html'],
  '15':['IT, cybersecurity & data','veteran-cybersecurity-careers.html'],
  '17':['Engineering & technical design','veteran-construction-management-careers.html'],
  '19':['Science & analysis','veteran-data-analytics-careers.html'],
  '21':['Community & social services','veteran-human-resources-careers.html'],
  '25':['Training & education','veteran-teaching-careers.html'],
  '27':['Media & communications','veteran-project-management-careers.html'],
  '29':['Healthcare (clinical)','veteran-healthcare-careers.html'],
  '31':['Healthcare support','veteran-healthcare-careers.html'],
  '33':['Protective & law enforcement','veteran-law-enforcement-careers.html'],
  '37':['Facilities & grounds','veteran-construction-management-careers.html'],
  '41':['Sales & client operations','veteran-financial-services-careers.html'],
  '43':['Administration & operations support','veteran-human-resources-careers.html'],
  '47':['Construction & skilled trades','veteran-construction-management-careers.html'],
  '49':['Maintenance, repair & installation','veteran-manufacturing-careers.html'],
  '51':['Manufacturing & production','veteran-manufacturing-careers.html'],
  '53':['Transportation & logistics','veteran-supply-chain-careers.html']
};
function clusterFor(code){
  const c=String(code||'');
  if(c.startsWith('49-3011')||c.startsWith('53-2')) return ['Aviation & aircraft','veteran-aviation-careers.html'];
  return SOC_CLUSTER[c.slice(0,2)]||null;
}
const SOC_FAMILY={'47':'engineering','17':'engineering','37':'engineering','45':'engineering','53':'logistics','49':'mechanical','51':'mechanical','15':'technology','27':'technology','29':'health','31':'health','33':'protective','13':'business','41':'business','43':'business'};
function familyFromRoles(roles){
  if(!roles||!roles.length) return null;
  const counts={};
  for(const r of roles){ const f=SOC_FAMILY[String(r.code||'').slice(0,2)]; if(f) counts[f]=(counts[f]||0)+1; }
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return top?top[0]:null;
}
function dataDrivenPaths(roles, title){
  if(!roles||!roles.length) return null;
  const seen=new Set(), out=[];
  for(const r of roles){
    const cl=clusterFor(r.code); if(!cl||seen.has(cl[1])) continue; seen.add(cl[1]);
    out.push([cl[0],'Civilian / government',`Official O*NET matches for this code include ${r.title} and related work in this field.`,'Confirm the specific role’s civilian license, certification, or education requirements—service alone does not grant them.',cl[1]]);
    if(out.length>=5) break;
  }
  if(!out.length) return null;
  out.push(['Federal & public-sector roles','Federal / state / local',`Your ${title.toLowerCase()} experience may meet the specialized-experience requirement for related occupational series.`,'Mirror the vacancy questionnaire and document scope precisely.','federal-jobs-search.html']);
  return out;
}
// Lead with code-specific (data-driven) directions, then pad with relevant family
// directions (skipping duplicate destinations) so every page shows real breadth.
function combinePaths(dd, fam){
  if(!dd) return fam;
  const pages=new Set(dd.map(p=>p[4])), out=dd.slice();
  for(const p of fam){ if(out.length>=6) break; if(!pages.has(p[4])){ out.push(p); pages.add(p[4]); } }
  return out;
}
function jobCard(r,kind,mosTitle){
  const cl=clusterFor(r.code), d=(OCC[r.code]||{}).d, mt=esc(mosTitle), clx=cl?esc(cl[0].toLowerCase()):'';
  const why = kind==='closest'
    ? (cl ? 'A direct Department of Labor match—your '+mt+' work maps straight onto the '+clx+' side of this role.'
          : 'A direct U.S. Department of Labor crosswalk match for your '+mt+' experience.')
    : (cl ? 'Closely related to your '+mt+' occupations on the '+clx+' side—a natural next step.'
          : 'Closely related to the civilian jobs your '+mt+' experience already matches.');
  return '<article class="'+kind+'"><h3>'+esc(r.title)+'</h3>'+
    (d?'<p class="entails">'+esc(d)+'</p>':'')+
    '<p class="why"><strong>Why it fits:</strong> '+why+'</p>'+
    '<div class="joblinks">'+(r.code?'<a href="https://www.onetonline.org/link/summary/'+esc(r.code)+'" rel="nofollow noopener" target="_blank">Pay, outlook &amp; training →</a>':'')+
    (cl?'<a href="/'+cl[1]+'">Explore '+esc(cl[0])+' careers →</a>':'')+'</div></article>';
}
function page(branch, entry){
  const key=`${branch}|${entry.code}`, curated=CURATED[key], roles=official[key]||[], civRoles=roles.filter(r=>!String(r.code||'').startsWith('55')), family=curated?.family||familyFromRoles(roles)||familyFor(entry.title), bands=curated?.bands||experienceBands(branch,entry.title,rankTypeMap[key]), introText=curated?.intro||(civRoles.length?`Your ${entry.title} experience maps to civilian jobs like ${civRoles.slice(0,2).map(r=>r.title).join(' and ')}—and well beyond. Explore the specific roles below, see what each pays and requires, and build from there.`:`Your ${entry.title} background is a portfolio of capabilities—not a sentence to one civilian job. Explore adjacent fields, government work, and new directions where your experience gives you a credible starting point.`);
  const citesHtml=(curated?.citations?.length)?`<section class="sources"><h2>Sources for this guide</h2><ul>${curated.citations.map(c=>`<li><a href="${esc(c.url)}" rel="nofollow noopener" target="_blank">${esc(c.label)}</a></li>`).join('')}</ul></section>`:'';
  // More close matches per code: direct crosswalk occupations (closest) + their O*NET related occupations.
  const relSeen=new Set(civRoles.map(r=>r.code)), relatedMatches=[];
  for(const r of civRoles){ for(const rc of (RELATED[r.code]||[])){ if(relSeen.has(rc)||relatedMatches.length>=6) continue; relSeen.add(rc); const info=OCC[rc]; if(info&&info.t) relatedMatches.push({code:rc,title:info.t}); } }
  const closestGrid=civRoles.length?`<h3 class="jobgroup">${civRoles.length>1?'Closest matches':'Closest match'}</h3><div class="jobs">${civRoles.map(r=>jobCard(r,'closest',entry.title)).join('')}</div>`:'';
  const relatedGrid=relatedMatches.length?`<h3 class="jobgroup">Related roles worth exploring</h3><div class="jobs">${relatedMatches.map(r=>jobCard(r,'related',entry.title)).join('')}</div>`:'';
  const jobsSection=civRoles.length?`<section><h2>Civilian jobs that match ${esc(entry.code)}</h2><p class="lede">These are the civilian jobs the U.S. Department of Labor maps to ${esc(entry.code)}${relatedMatches.length?', plus the roles most closely related to them':''}—ordered from the closest match. Think of them as a floor, not a ceiling: see what each role involves and pays, start where your ${esc(entry.title)} experience already fits, and build toward the rest.</p>${closestGrid}${relatedGrid}<p class="source">Source: <a href="https://www.onetcenter.org/crosswalks.html" rel="nofollow noopener" target="_blank">O*NET / DMDC Military Crosswalk</a> and O*NET related-occupations data, August 2024.</p></section>`:'';
  const dirPaths=curated?.paths||(civRoles.length?null:combinePaths(dataDrivenPaths(roles,entry.title),PATHS[family]));
  const dirSection=dirPaths?`<section><h2>${curated?.paths?'More directions worth exploring':dirPaths.length+' broader directions to explore'}</h2><p class="lede">${curated?.paths?'Adjacent and stretch fields where your experience gives you a credible starting point.':'Broader fields your experience can open, with honest credential notes.'}</p><div class="paths">${dirPaths.map((p,i)=>`<article><div class="path-head"><span>${String(i+1).padStart(2,'0')}</span><div><small>${esc(p[1])}</small><h3>${esc(p[0])}</h3></div></div><p>${esc(p[2])}</p><p class="bridge"><strong>Bridge:</strong> ${esc(p[3])}</p><a href="/${p[4]}">Explore this route →</a></article>`).join('')}</div></section>`:'';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(entry.code)} ${esc(entry.title)} Civilian Careers by Rank | Veteran Career Path</title><meta name="description" content="Explore civilian, federal, contractor, and training pathways for ${esc(branch)} ${esc(entry.code)} ${esc(entry.title)}, with different guidance for junior and senior experience."><link rel="canonical" href="https://veterancareerpath.com/mos/${slug(entry.code)}.html"><link rel="stylesheet" href="/vcp-styles.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${MOS_CSS}</style></head><body><nav><a href="/">Veteran Career Path</a><a href="/${HUB[branch]}">← ${esc(branch)} job codes</a></nav><header><img class="emblem" src="https://veterancareerpath.com/img/optimized/${EMBLEM[branch]}.webp" alt="${esc(branch)} emblem" loading="eager"><p class="eyebrow">${esc(branch)} · ${esc(entry.code)}</p><h1>${esc(entry.title)}</h1><p>${esc(introText)}</p></header><main>${jobsSection}<section><h2>Your rank changes the story</h2><p class="lede">Use the level that reflects what you actually did—not rank alone. Two people with the same code and very different experience should not submit the same résumé.</p><div class="bands">${bands.map(([name,text],i)=>`<article><span>0${i+1}</span><h3>${esc(name)}</h3><p>${esc(text)}</p></article>`).join('')}</div></section>${dirSection}<section><h2>Build evidence, not just a translated title</h2><div class="evidence"><div><h3>Hands-on scope</h3><p>List systems, tools, vehicles, environments, certifications, and recurring tasks.</p></div><div><h3>Leadership scope</h3><p>State people trained or supervised, asset value, work volume, readiness, safety, and quality outcomes.</p></div><div><h3>Credential gap</h3><p>Identify licenses, degrees, software, or civilian standards required before claiming the target role.</p></div><div><h3>Search wider</h3><p>Search by capabilities and equipment as well as by “${esc(entry.code)}” or “${esc(entry.title)}.”</p></div></div></section><p class="note"><strong>How to use this:</strong> Treat these as targets, not limits. Your exact duties depend on your assignments, so lead with what you actually did—and remember that regulated careers require their own license, certification, or degree.</p><div class="actions"><a href="/app.html">Build a capability-based résumé</a><a class="secondary" href="/federal-jobs-search.html">Search federal jobs</a></div>${citesHtml}</main><footer>Built for veterans who want more than a one-job crosswalk. · <a href="/contact.html">Suggest a correction or pathway</a></footer></body></html>`;
}

const MOS_CSS=`*{box-sizing:border-box}body{margin:0;font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1e2a3a;background:#eef2f7;line-height:1.6;-webkit-font-smoothing:antialiased}a{color:#12305e}nav{height:56px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;background:#0a1628;color:#fff;position:sticky;top:0;z-index:10}nav a{color:#f0c040;text-decoration:none;font-weight:700;font-size:.88rem}header{position:relative;overflow:hidden;padding:4rem 6% 3.4rem;color:#fff;text-align:center;background:radial-gradient(900px 380px at 50% -25%,#24457a,transparent),linear-gradient(140deg,#0a1628,#12294f 62%,#183c6e)}header:after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#f0c040,#e0a92e)}header>*{max-width:1000px;margin-left:auto;margin-right:auto;position:relative}.emblem{width:66px;height:66px;object-fit:contain;display:block;margin:0 auto .7rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,.45))}.eyebrow{color:#f4cf6a;font-size:.75rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}h1{font-family:"Bebas Neue",sans-serif;font-size:clamp(2.8rem,7vw,5rem);line-height:.98;letter-spacing:.02em;margin:.4rem auto .8rem}header>p:not(.eyebrow){font-size:1.1rem;color:#cfe0f5;max-width:780px}.chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.4rem;justify-content:center}.chips span{background:rgba(240,192,64,.1);border:1px solid rgba(240,192,64,.35);color:#f6e8c6;border-radius:999px;padding:.4rem .85rem;font-size:.8rem;font-weight:500}main{max-width:1040px;margin:0 auto;padding:2.4rem 5% 3rem}section{margin-bottom:2.6rem}h2{font-family:"Bebas Neue",sans-serif;letter-spacing:.03em;font-size:1.75rem;color:#12294f;margin:0 0 .3rem;padding-left:.7rem;border-left:4px solid #e0a92e}.lede{color:#54657c;max-width:820px;margin:.2rem 0 1.2rem}.official{list-style:none;padding:0;margin:0;display:grid;gap:.6rem}.official li{background:#fff;border:1px solid #e2eaf4;border-left:4px solid #c8960a;border-radius:10px;padding:.8rem 1rem;font-weight:600;color:#17263a;box-shadow:0 2px 10px rgba(12,26,48,.05)}.soc{font-size:.68rem;font-weight:600;background:#eef3f9;color:#3a5070;padding:.15rem .45rem;border-radius:5px;margin-left:.4rem}.source{font-size:.8rem;color:#6a7c92;margin-top:.9rem}.bands,.paths,.evidence{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.1rem}.bands article,.evidence div,.paths article{background:#fff;border:1px solid #e4ebf3;border-radius:14px;padding:1.3rem;box-shadow:0 3px 14px rgba(12,26,48,.05)}.bands article{border-top:3px solid #12294f}.bands article>span,.path-head>span{font-family:"Bebas Neue",sans-serif;font-size:1.3rem;color:#c8960a;letter-spacing:.04em}.bands h3,.paths h3,.evidence h3{margin:.25rem 0;color:#12294f;font-size:1.05rem}.bands p,.evidence p,.paths article>p{color:#4a5a70;font-size:.92rem}.paths article{display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s,border-color .15s}.paths article:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(12,26,48,.11);border-color:#cdd9ea}.path-head{display:flex;gap:.7rem;align-items:baseline}.path-head small{text-transform:uppercase;letter-spacing:.08em;color:#7086a0;font-size:.68rem;font-weight:700}.bridge{background:#f2f6fb;border:1px solid #e3edf7;padding:.6rem .7rem;border-radius:8px;font-size:.85rem;color:#33455e;margin-top:auto}.paths a{font-weight:700;color:#155799;text-decoration:none;margin-top:.7rem;display:inline-block}.paths a:hover{text-decoration:underline}.paths article:first-child{border:1.5px solid #e0a92e;box-shadow:0 8px 24px rgba(224,169,46,.14)}.evidence h3{font-size:1rem}.jobs{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.1rem}.jobs article{background:#fff;border:1px solid #e4ebf3;border-top:3px solid #c8960a;border-radius:14px;padding:1.2rem;box-shadow:0 3px 14px rgba(12,26,48,.05);transition:transform .15s,box-shadow .15s}.jobs article:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(12,26,48,.12)}.jobs h3{margin:.1rem 0 .3rem;color:#12294f;font-size:1.05rem;line-height:1.3}.jobgroup{font-family:Inter,sans-serif;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a6a12;margin:1.4rem 0 .7rem;padding:0}.jobgroup:first-of-type{margin-top:.4rem}.jobs article.related{border-top-color:#9fb4d0}.entails{color:#48586e;font-size:.9rem;line-height:1.5;margin:.3rem 0 .4rem}.why{font-size:.85rem;color:#5a6b82;margin:.2rem 0 .6rem;line-height:1.5}.why strong{color:#12294f}.joblinks{display:flex;flex-direction:column;gap:.4rem;margin-top:.6rem}.joblinks a{font-weight:700;color:#155799;text-decoration:none;font-size:.9rem}.joblinks a:hover{text-decoration:underline}.note{color:#6a7c92;font-size:.84rem;line-height:1.6;margin:0 0 2.4rem;padding:.9rem 1.1rem;background:#f5f7fb;border:1px solid #e6ecf4;border-left:4px solid #a9c0dd;border-radius:10px}.note strong{color:#3f5573}.actions{display:flex;flex-wrap:wrap;gap:.7rem}.actions a{background:linear-gradient(135deg,#f4cf6a,#e0a92e);color:#0a1628;text-decoration:none;font-weight:700;padding:.85rem 1.35rem;border-radius:10px;box-shadow:0 5px 16px rgba(224,169,46,.3)}.actions .secondary{background:#12294f;color:#fff;box-shadow:none}.sources ul{padding-left:1.1rem;color:#54657c}.sources li{margin:.35rem 0}.sources a{color:#155799;font-weight:600}footer{background:#0a1628;color:#a9bcd6;padding:2rem 6%;text-align:center;font-size:.85rem}footer a{color:#f0c040}@media(max-width:600px){header{padding:3rem 1rem 2.6rem}main{padding:1.6rem 1rem 2.5rem}.bands,.paths,.evidence{grid-template-columns:1fr}}`;

let made=0;
for(const [branch,entries] of Object.entries(codesByBranch)){
  for(const entry of entries){fs.writeFileSync(path.join(ROOT,'mos',`${slug(entry.code)}.html`),page(branch,entry));made++;}
  const hubPath=path.join(ROOT,HUB[branch]); let hub=fs.readFileSync(hubPath,'utf8');
  for(const entry of entries){
    const cur=CURATED[`${branch}|${entry.code}`], code=entry.code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), href=`https://veterancareerpath.com/mos/${slug(entry.code)}.html`, count=cur?.paths?.length||((official[`${branch}|${entry.code}`]||[]).filter(r=>!String(r.code||'').startsWith('55')).length||combinePaths(dataDrivenPaths(official[`${branch}|${entry.code}`]||[],entry.title),PATHS[cur?.family||familyFromRoles(official[`${branch}|${entry.code}`]||[])||familyFor(entry.title)]).length);
    const re=new RegExp(`(<a class="mos-card" data-code="${code}"[^>]*href=")[^"]+("[^>]*>[\\s\\S]*?<div class="career-dir"[^>]*>)[\\s\\S]*?(</div></a>)`);
    hub=hub.replace(re,`$1${href}$2→ Explore ${count} career directions$3`);
    if(!hub.includes(href)){
      const gridEnd=hub.match(/\r?\n  <\/div>\r?\n  <div style="background:linear-gradient/);
      const at=gridEnd?.index ?? -1;
      if(at<0) throw new Error(`Could not insert missing ${branch} ${entry.code} card`);
      hub=hub.slice(0,at)+hubCard(entry,href,count)+hub.slice(at);
    }
  }
  fs.writeFileSync(hubPath,hub);
}
console.log(`Generated ${made} rank-aware military job-code guides and updated six branch hubs.`);
