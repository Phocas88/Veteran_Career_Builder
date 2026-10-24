import {profileSteps} from './profile-steps.js?v=20261026-profile-setup';
import { wireServiceBranchChoices, wireNestedBranchChoices } from './branch-controls.js?v=20261025-standalone-app';
import { branches, normalizeProfile } from './veteran-profile.js?v=20261025-standalone-app';
import { personalFields, groups } from './profile-fields.js?v=20261025-standalone-app';
const $ = id => document.getElementById(id);
// Generic line icons describe resume sections; no military branch emblems.
const iconPaths = {
 personal:['M20 21v-2a6 6 0 0 0-12 0v2','M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
 roles:['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M8 12h8M8 16h6'],
 jobs:['M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2','M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z','M3 12a20 20 0 0 0 18 0M10 12v3h4v-3'],
 educationEntries:['M2 9 12 4l10 5-10 5z','M6 11v6c4 3 8 3 12 0v-6M22 9v8'],
 certifications:['M12 2 5 5v6c0 5 7 10 7 10s7-5 7-10V5z','m8 11 3 3 5-6'],
 training:['M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1'],
 skillsEntries:['m8 8-4 4 4 4m8-8 4 4-4 4M14 4l-4 16'],
 languages:['M21 11a8 8 0 0 1-8 8H6l-4 3V7a5 5 0 0 1 5-5h9a5 5 0 0 1 5 5z','M6 8h11M6 12h8'],
 projects:['M3 5h7l2 3h9v12H3z','m8 14 3 3 5-6'],
 mosRoles:['m12 3 9 5-9 5-9-5z','m3 12 9 5 9-5M3 16l9 5 9-5'],
 rankHistory:['m12 3 9 5-9 5-9-5z','m3 12 9 5 9-5M3 16l9 5 9-5'],
 asi:['M2 9 12 4l10 5-10 5z','M6 11v6c4 3 8 3 12 0v-6M22 9v8'],
 sqi:['M3 3h8l10 10-8 8L3 11z','M7 7h.01'],
 additionalDuties:['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z'],
 awards:['m8 3 4 7 4-7M5 3h4M15 3h4','M17 15a5 5 0 1 1-10 0 5 5 0 0 1 10 0','m12 12 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 14.3l2-.3z'],
 deployments:['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0','M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20'],
 chevron:['m9 5 7 7-7 7']
};
const categoryHints = {
 personal:'Your name, contact details and career goal',roles:'Branch, ranks, specialties and service history',jobs:'Employers, responsibilities and achievements',educationEntries:'Schools, degrees and relevant coursework',certifications:'Credentials, licenses and completion status',training:'PME, courses and professional development',skillsEntries:'Technical abilities, leadership and tools',languages:'Languages and verified proficiency',projects:'Projects, community service and results',rankHistory:'Ranks and pay grades you actually held, with dates',mosRoles:'Roles, dates and responsibilities',asi:'Skills, qualifications and identifiers',sqi:'Designators and specialty identifiers',additionalDuties:'Extra responsibilities you actually held',awards:'Recognition and verified achievements',deployments:'Dates and releasable experience only'
};
 const categoryTitles = {roles:'Service experience',jobs:'Civilian & government jobs',training:'Training & military schools',skillsEntries:'Skills & tools',projects:'Projects & volunteering'};
function icon(key) {
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [name,value]of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'}))svg.setAttribute(name,value);
 for(const d of iconPaths[key]||iconPaths.roles){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}return svg;
}
function categorySummary(key,title) {
 const summary=document.createElement('summary');summary.className='category-summary';
 const badge=document.createElement('span');badge.className='category-icon';badge.append(icon(key));
 const heading=document.createElement('h3');heading.textContent=categoryTitles[key]||title;
 const hint=document.createElement('span');hint.className='category-hint';hint.textContent=categoryHints[key]||'Add the details you want to include';
 const arrow=document.createElement('span');arrow.className='category-chevron';arrow.append(icon('chevron'));
 summary.append(badge,heading,hint,arrow);return summary;
}

function control(spec, value) {
 const label = document.createElement('label'); label.className='builder-field';
 const caption = document.createElement('span'); caption.textContent=spec.label;
 const select = spec.type === 'select' || spec.type === 'branch';
 const el=document.createElement(select?'select':spec.type==='textarea'?'textarea':'input'); el.dataset.key=spec.key;
 if(select){el.add(new Option('Choose (optional)',''));for(const [v,t] of (spec.type==='branch'?Object.entries(branches).map(([k,b])=>[k,b.name]):spec.options.map(v=>[v,v]))) el.add(new Option(t,v)); if(value&&!Array.from(el.options).some(o=>o.value===value)) el.add(new Option(value,value));}
 else if(spec.type!=='textarea') el.type=spec.type==='text'?'text':spec.type;
 if(spec.type==='checkbox'){el.checked=value===true;label.classList.add('builder-checkbox');}else el.value=value??'';
 if(!select&&spec.type!=='checkbox'){el.maxLength=spec.type==='textarea'?2400:250; if(spec.type==='number'){el.min='0';el.step='any';}}
 label.append(caption,el); return label;
}
function readBox(box){const o={};for(const el of box.querySelectorAll(':scope > label > [data-key], :scope > .builder-grid > label > [data-key]'))o[el.dataset.key]=el.type==='checkbox'?el.checked:el.value;for(const nested of box.querySelectorAll(':scope > .builder-group'))o[nested.dataset.group]=readGroup(nested);if(o.rank==='__custom__')o.rank=box.querySelector(':scope > label > [data-rank-custom]')?.value||'';return o;}
function readGroup(group){return [...group.querySelector(':scope > .builder-entries').children].map(readBox);}
function entry(group,spec,value={}){
 const entries=group.querySelector(':scope > .builder-entries');if(entries.children.length>=12)return;
 const box=document.createElement('fieldset');box.className='service-role';const legend=document.createElement('legend');legend.textContent=spec.add;box.append(legend);
 for(const f of spec.fields)box.append(control(f,value[f.key]));
 if(value.dates&&!value.startDate&&!value.endDate)box.append(control({key:'dates',label:'Previously saved dates (verify / split above)',type:'text'},value.dates));
 for(const [key,nested]of Object.entries(spec.nested||{}))box.append(makeGroup(key,nested,value[key]||[]));
 if(group.dataset.group==='roles'){
  const field=key=>box.querySelector(':scope > label > [data-key="'+key+'"]').closest('label');
  const heading=(text,before)=>{const h=document.createElement('h4');h.className='service-setup-heading';h.textContent=text;box.insertBefore(h,before);};
  heading('1 · Service, rank & dates',field('branch'));
  const anchor=field('code');
  for(const key of ['startDate','endDate','current'])box.insertBefore(field(key),anchor);
  const history=box.querySelector(':scope > [data-group="rankHistory"]');box.insertBefore(history,anchor);
  heading('2 · MOS or specialty',anchor);
  const experience=field('title');heading('3 · Additional qualifiers',experience);
  for(const key of ['asi','sqi'])box.insertBefore(box.querySelector(':scope > [data-group="'+key+'"]'),experience);
  heading('4 · Assignments, duties & results',experience);
 }
 const current=box.querySelector(':scope > label > [data-key="current"]');const end=box.querySelector(':scope > label > [data-key="endDate"]');if(current&&end){const toggle=()=>{end.disabled=current.checked;};current.addEventListener('change',toggle);toggle();}
 const rm=document.createElement('button');rm.type='button';rm.className='text-button danger';rm.textContent='Remove this '+spec.add;rm.onclick=()=>{box.remove();group.querySelector(':scope > button').disabled=false;group.dispatchEvent(new Event('input',{bubbles:true}));};box.append(rm);entries.append(box);group.querySelector(':scope > button').disabled=entries.children.length>=12;
 if(group.dataset.group==='roles')wireServiceBranchChoices(box);else{const service=group.closest('[data-service-role]');if(service)wireNestedBranchChoices(box,group.dataset.group,service);}
}
function makeGroup(key,spec,values=[]){const group=document.createElement('details');group.className='builder-group resume-category';group.open=false;group.dataset.group=key;const entries=document.createElement('div');entries.className='builder-entries';const add=document.createElement('button');add.type='button';add.className='button button-secondary';add.textContent='+ Add '+spec.add;add.onclick=()=>{entry(group,spec);group.dispatchEvent(new Event('input',{bubbles:true}));};const summary=categorySummary(key,spec.title);group.append(summary,entries,add);for(const value of values)entry(group,spec,value);return group;}
export function fillBackground(input={}){
 const root=$('background-fields'),previous=root.querySelector('[data-profile-section]')?.value||'personal',p=normalizeProfile(input);root.replaceChildren();
 const nav=document.createElement('div');nav.className='profile-section-bar';
 const label=document.createElement('label');label.textContent='Profile section';const select=document.createElement('select');select.dataset.profileSection='true';select.id='profile-section';select.setAttribute('aria-label','Profile section');
 const titles=Object.fromEntries(profileSteps.map(step=>[step.key,step.title]));
 for(const [key,title]of Object.entries(titles))select.add(new Option(title,key));label.append(select);nav.append(label);root.append(nav);
 const heading=document.createElement('h3');heading.className='profile-section-title';heading.tabIndex=-1;root.append(heading);
 const personal=document.createElement('fieldset');personal.className='service-role';personal.id='builder-personal';const legend=document.createElement('legend');legend.textContent='Personal & contact information';personal.append(legend);
 for(const f of personalFields){const label=control(f,p[f.key]);label.querySelector('[data-key]').id='builder-'+f.key;personal.append(label);}
 const personalCategory=document.createElement('details');personalCategory.className='resume-category personal-category';personalCategory.dataset.profileCategory='personal';personalCategory.append(categorySummary('personal','Personal & contact information'),personal);root.append(personalCategory);
 for(const [key,spec]of Object.entries(groups)){
  const g=makeGroup(key,spec,p[key]);g.dataset.profileCategory=key;if(key==='roles'){g.querySelector('.builder-entries').id='service-roles';g.querySelector(':scope > button').id='add-service-role';if(!p.roles.length)entry(g,spec);}root.append(g);
 }
 for(const key of ['contact','civilian','education','skills'])if(p[key]){const label=control({key,label:'Previously saved '+key+' — retained for compatibility; move into the fields above when ready',type:'textarea'},p[key]);label.dataset.legacy=key;root.append(label);}
 const actions=document.createElement('div');actions.className='profile-section-actions';const back=document.createElement('button'),next=document.createElement('button');for(const button of [back,next]){button.type='button';button.className='button button-secondary';}back.textContent='Previous section';next.textContent='Next section →';actions.append(back,next);root.append(actions);
 const keys=Object.keys(titles);function show(focus=false){for(const category of root.querySelectorAll(':scope > [data-profile-category]')){category.hidden=category.dataset.profileCategory!==select.value;category.open=!category.hidden;}heading.textContent=titles[select.value];const index=keys.indexOf(select.value);back.disabled=index===0;next.disabled=index===keys.length-1;if(focus){heading.focus({preventScroll:true});nav.scrollIntoView({block:'start'});}document.dispatchEvent(new CustomEvent('profile:section-changed',{detail:{section:select.value}}));}
 select.value=keys.includes(previous)?previous:'personal';select.onchange=()=>show(true);back.onclick=()=>{select.value=keys[Math.max(0,keys.indexOf(select.value)-1)];show(true);};next.onclick=()=>{select.value=keys[Math.min(keys.length-1,keys.indexOf(select.value)+1)];show(true);};show();document.dispatchEvent(new Event('profile:rendered'));
}
export function readBackground(){const root=$('background-fields');const p=readBox($('builder-personal'));for(const g of root.querySelectorAll(':scope > .builder-group'))p[g.dataset.group]=readGroup(g);for(const label of root.querySelectorAll(':scope > label[data-legacy]'))p[label.dataset.legacy]=label.querySelector('[data-key]').value;return normalizeProfile(p);}

export const getProfileSection=()=>document.querySelector('[data-profile-section]')?.value||'personal';
export function selectProfileSection(section){const select=document.querySelector('[data-profile-section]');if(select&&[...select.options].some(o=>o.value===section)){select.value=section;select.onchange();}}
