import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_CSV = process.argv[2];
const CROSSWALK_JSON = path.join(ROOT, 'mos-crosswalk-data.json');
const SERVICE = { Army:'A', 'Air Force':'F', Navy:'N', Marines:'M', 'Coast Guard':'C', 'Space Force':'S' };
const HUB = { Army:'army-mos-careers.html', 'Air Force':'air-force-afsc-careers.html', Navy:'navy-rate-careers.html', Marines:'marine-corps-mos-careers.html', 'Coast Guard':'coast-guard-rating-careers.html', 'Space Force':'space-force-afsc-careers.html' };

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

let official={};
if(SOURCE_CSV){
  const rows=parseCsv(fs.readFileSync(SOURCE_CSV,'utf8'));
  for(const [branch, entries] of Object.entries(codesByBranch)){
    for(const entry of entries){
      const kind=rankKind(entry.title), candidates=rows.filter(r=>r.SVC===SERVICE[branch]&&norm(r.MOC)===norm(entry.code)&&(!r.MPC||r.MPC===kind));
      const exact=candidates.filter(r=>norm(r.MOC_TITLE)===norm(entry.title));
      const chosen=exact.length?exact:candidates;
      const roles=[];
      for(const r of chosen) for(let i=1;i<=4;i++) if(r[`ONET${i}_TITLE`]&&!roles.some(x=>x.title===r[`ONET${i}_TITLE`])) roles.push({code:r[`ONET${i}`],title:r[`ONET${i}_TITLE`]});
      official[`${branch}|${entry.code}`]=roles.slice(0,8);
    }
  }
  fs.writeFileSync(CROSSWALK_JSON, JSON.stringify({source:'O*NET Military Occupational Classification Crosswalk, August 2024',generated:new Date().toISOString().slice(0,10),occupations:official},null,2)+'\n');
} else {
  official=JSON.parse(fs.readFileSync(CROSSWALK_JSON,'utf8')).occupations;
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
  ]
};

// Per-code human/researched overrides. Loaded from data/mos-curation.json so curation
// can scale independently of the generator (see that file's _meta for the schema).
const CURATED=(()=>{ try{ const j=JSON.parse(fs.readFileSync(path.join(ROOT,'data','mos-curation.json'),'utf8')); delete j._meta; return j; }catch(e){ console.warn('No mos-curation.json ('+e.message+') — using family fallback only.'); return {}; } })();

function familyFor(title){
  const t=title.toLowerCase();
  if(/engineer|construction|bridge|survey|carpenter|electrician|plumb|utilities|pavement|equipment operator/.test(t)) return 'engineering';
  if(/transport|driver|logistic|supply|warehouse|cargo|freight|postal|storekeeper|traffic management/.test(t)) return 'logistics';
  if(/mechanic|maintenance|repair|machin|weld|fabricat|power|propulsion|ordnance|avionic|aircraft|vehicle|electronics/.test(t)) return 'mechanical';
  if(/cyber|computer|network|information|signal|communication|software|systems|radio|satellite|space|intelligence|crypt|data/.test(t)) return 'technology';
  return 'operations';
}
function experienceBands(branch, title){
  const naval=['Navy','Coast Guard'].includes(branch);
  const junior=naval?'E-1–E-4':'E-1–E-4';
  const nco=naval?'E-5–E-6 / Petty Officer':'E-5–E-6 / NCO';
  const senior=naval?'E-7–E-9 / Chief':'E-7–E-9 / Senior NCO';
  if(rankKind(title)==='O') return [
    ['Junior officer','Translate planning, technical judgment, briefings, team leadership, and accountable resources. Avoid claiming licensed engineering unless you hold the required degree/license.'],
    ['Field-grade / senior officer','Emphasize programs, budgets, cross-functional organizations, policy, risk ownership, and measurable operational outcomes.'],
    ['Executive direction','Target director, program, operations, consulting, and public-sector leadership roles that match your actual scope.']
  ];
  return [
    [junior,'Lead with hands-on tasks, tools, equipment, qualifications, safety discipline, and the conditions in which you performed. Do not inflate supervisory scope.'],
    [nco,'Add team leadership, training, inspections, work allocation, quality control, readiness, and the people or assets you directly supervised.'],
    [senior,'Emphasize multi-team operations, schedules, resource forecasting, safety systems, policy enforcement, advising leaders, and organization-level results.']
  ];
}
function genericCapabilities(title,family){
  const common={engineering:['Technical problem solving','Field operations and site safety','Equipment and material coordination','Reconnaissance, measurement, and reporting','Working from plans and standards','Team execution under constraints'],logistics:['Movement and resource coordination','Accountability and documentation','Safety and compliance','Scheduling and prioritization','Equipment readiness','Cross-team communication'],mechanical:['Diagnostics and fault isolation','Preventive maintenance','Technical manuals and specifications','Tool and test-equipment use','Quality and safety controls','Equipment readiness reporting'],technology:['Technical troubleshooting','Configuration and documentation','Security and access discipline','System monitoring and continuity','User or mission support','Incident response and communication'],operations:['Planning and execution','Risk assessment','Standards and compliance','Team communication','Training and evaluation','Resource accountability']};
  return common[family].map(x=>`${x} in ${title.toLowerCase()} work`);
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
function page(branch, entry){
  const key=`${branch}|${entry.code}`, curated=CURATED[key], family=curated?.family||familyFor(entry.title), roles=official[key]||[], paths=curated?.paths||combinePaths(dataDrivenPaths(roles,entry.title),PATHS[family]), caps=curated?.capabilities||genericCapabilities(entry.title,family), bands=curated?.bands||experienceBands(branch,entry.title);
  const citesHtml=(curated?.citations?.length)?`<section class="sources"><h2>Sources for this guide</h2><ul>${curated.citations.map(c=>`<li><a href="${esc(c.url)}" rel="nofollow noopener" target="_blank">${esc(c.label)}</a></li>`).join('')}</ul></section>`:'';
  const direct=roles.length?roles.map(r=>`<li><strong>${esc(r.title)}</strong>${r.code?` <span class="soc">O*NET ${esc(r.code)}</span>`:''}</li>`).join(''):'<li>No single official civilian occupation captures this code. Use the capability-based pathways below and validate them against your actual assignments.</li>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(entry.code)} ${esc(entry.title)} Civilian Careers by Rank | Veteran Career Path</title><meta name="description" content="Explore civilian, federal, contractor, and training pathways for ${esc(branch)} ${esc(entry.code)} ${esc(entry.title)}, with different guidance for junior and senior experience."><link rel="canonical" href="https://veterancareerpath.com/mos/${slug(entry.code)}.html"><link rel="stylesheet" href="/vcp-styles.css"><style>${MOS_CSS}</style></head><body><nav><a href="/">Veteran Career Path</a><a href="/${HUB[branch]}">← ${esc(branch)} job codes</a></nav><header><p class="eyebrow">${esc(branch)} · ${esc(entry.code)}</p><h1>${esc(entry.title)}</h1><p>${esc(curated?.intro||`Your ${entry.title} background is a portfolio of capabilities—not a sentence to one civilian job. Explore direct matches, adjacent fields, government work, and new directions where your experience gives you a credible starting point.`)}</p><div class="chips">${caps.map(c=>`<span>${esc(c)}</span>`).join('')}</div></header><main><section><h2>Official civilian crosswalk starting points</h2><p class="lede">These are links from the U.S. Department of Labor O*NET military crosswalk. They are starting points, not the full value of your service.</p><ul class="official">${direct}</ul><p class="source">Source: <a href="https://www.onetcenter.org/crosswalks.html">O*NET Military Transition Search / DMDC crosswalk</a>, August 2024.</p></section><section><h2>Your rank changes the story</h2><p class="lede">Use the band that reflects what you actually did—not rank alone. An E-2 and an E-7 in the same code should not submit the same résumé.</p><div class="bands">${bands.map(([name,text],i)=>`<article><span>0${i+1}</span><h3>${esc(name)}</h3><p>${esc(text)}</p></article>`).join('')}</div></section><section><h2>${paths.length} directions worth exploring</h2><p class="lede">Some are direct transfers; others need civilian credentials. The point is to widen the map while staying honest about qualification gaps.</p><div class="paths">${paths.map((p,i)=>`<article><div class="path-head"><span>${String(i+1).padStart(2,'0')}</span><div><small>${esc(p[1])}</small><h3>${esc(p[0])}</h3></div></div><p>${esc(p[2])}</p><p class="bridge"><strong>Bridge:</strong> ${esc(p[3])}</p><a href="/${p[4]}">Explore this route →</a></article>`).join('')}</div></section><section><h2>Build evidence, not just a translated title</h2><div class="evidence"><div><h3>Hands-on scope</h3><p>List systems, tools, vehicles, environments, certifications, and recurring tasks.</p></div><div><h3>Leadership scope</h3><p>State people trained or supervised, asset value, work volume, readiness, safety, and quality outcomes.</p></div><div><h3>Credential gap</h3><p>Identify licenses, degrees, software, or civilian standards required before claiming the target role.</p></div><div><h3>Search wider</h3><p>Search by capabilities and equipment as well as by “${esc(entry.code)}” or “${esc(entry.title)}.”</p></div></div></section><aside><strong>Reality check:</strong> MOS, AFSC, rating, or rank never guarantees civilian qualification. Duties vary by unit and assignment; regulated professions require their own education, experience, exams, or licenses.</aside><div class="actions"><a href="/app.html">Build a capability-based résumé</a><a class="secondary" href="/federal-jobs-search.html">Search federal jobs</a></div>${citesHtml}</main><footer>Built for veterans who want more than a one-job crosswalk. · <a href="/contact.html">Suggest a correction or pathway</a></footer></body></html>`;
}

const MOS_CSS=`*{box-sizing:border-box}body{margin:0;font:16px/1.65 Inter,Arial,sans-serif;color:#24364a;background:#f4f7fa}nav{height:60px;padding:0 5%;display:flex;align-items:center;justify-content:space-between;background:#071424;color:#fff}nav a{color:#f0c040;text-decoration:none;font-weight:800}header{padding:4.5rem 6% 3.5rem;background:linear-gradient(150deg,#0a1d35,#204b80);color:#fff}header>*{max-width:980px;margin-left:auto;margin-right:auto}.eyebrow{color:#f0c040;font-size:.78rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{font-size:clamp(2.4rem,7vw,5rem);line-height:1;margin:.5rem auto 1rem}header>p:not(.eyebrow){font-size:1.12rem;color:#d6e6f5}.chips{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:1.3rem}.chips span{background:rgba(255,255,255,.09);border:1px solid rgba(240,192,64,.3);border-radius:999px;padding:.35rem .7rem;font-size:.78rem}main{max-width:1100px;margin:auto;padding:2.5rem 5% 4rem}section{margin-bottom:3rem}h2{font-size:clamp(1.55rem,4vw,2.2rem);color:#0d2746;margin-bottom:.4rem}.lede{color:#50657b;max-width:800px}.official{background:#fff;border-left:4px solid #c8960a;border-radius:8px;padding:1rem 1rem 1rem 2.2rem}.soc{font-size:.7rem;background:#e8eef5;padding:.15rem .4rem;border-radius:4px}.source{font-size:.78rem}.bands,.paths,.evidence{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.bands article,.paths article,.evidence div{background:#fff;border:1px solid #d6e0ea;border-radius:12px;padding:1.2rem}.bands article>span,.path-head>span{font-size:.74rem;font-weight:900;color:#b07a00}.bands h3,.paths h3,.evidence h3{margin:.2rem 0;color:#14375e}.path-head{display:flex;gap:.7rem}.path-head small{text-transform:uppercase;letter-spacing:.1em;color:#60768e}.bridge{background:#f1f6fb;padding:.65rem;border-radius:7px;font-size:.88rem}.paths a{font-weight:800;color:#155799}.paths article:first-child{border-color:#d5ad32;box-shadow:0 5px 18px rgba(181,128,0,.1)}aside{background:#fff5d5;border:1px solid #e3c768;border-radius:10px;padding:1rem 1.2rem}.actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}.actions a{background:#c8960a;color:#071424;text-decoration:none;font-weight:900;padding:.8rem 1rem;border-radius:8px}.actions .secondary{background:#173f6d;color:#fff}footer{background:#071424;color:#b9cde0;padding:2rem 5%;text-align:center}footer a{color:#f0c040}.sources ul{padding-left:1.1rem;color:#50657b}.sources li{margin:.35rem 0}.sources a{color:#155799;font-weight:700}@media(max-width:600px){nav{font-size:.8rem}header{padding:3rem 1rem}main{padding:1.5rem 1rem 3rem}.bands,.paths,.evidence{grid-template-columns:1fr}}`;

let made=0;
for(const [branch,entries] of Object.entries(codesByBranch)){
  for(const entry of entries){fs.writeFileSync(path.join(ROOT,'mos',`${slug(entry.code)}.html`),page(branch,entry));made++;}
  const hubPath=path.join(ROOT,HUB[branch]); let hub=fs.readFileSync(hubPath,'utf8');
  for(const entry of entries){
    const cur=CURATED[`${branch}|${entry.code}`], code=entry.code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), href=`https://veterancareerpath.com/mos/${slug(entry.code)}.html`, count=(cur?.paths||combinePaths(dataDrivenPaths(official[`${branch}|${entry.code}`]||[],entry.title),PATHS[cur?.family||familyFor(entry.title)])).length;
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
