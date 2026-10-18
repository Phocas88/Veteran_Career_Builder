import { branches, normalizeProfile } from './veteran-profile.js';
import { personalFields, groups } from './profile-fields.js';
const $ = id => document.getElementById(id);
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
function readBox(box){const o={};for(const el of box.querySelectorAll(':scope > label > [data-key], :scope > .builder-grid > label > [data-key]'))o[el.dataset.key]=el.type==='checkbox'?el.checked:el.value;for(const nested of box.querySelectorAll(':scope > .builder-group'))o[nested.dataset.group]=readGroup(nested);return o;}
function readGroup(group){return [...group.querySelector(':scope > .builder-entries').children].map(readBox);}
function entry(group,spec,value={}){
 const entries=group.querySelector(':scope > .builder-entries');if(entries.children.length>=12)return;
 const box=document.createElement('fieldset');box.className='service-role';const legend=document.createElement('legend');legend.textContent=spec.add;box.append(legend);
 for(const f of spec.fields)box.append(control(f,value[f.key]));
 if(value.dates&&!value.startDate&&!value.endDate)box.append(control({key:'dates',label:'Previously saved dates (verify / split above)',type:'text'},value.dates));
 for(const [key,nested]of Object.entries(spec.nested||{}))box.append(makeGroup(key,nested,value[key]||[]));
 const current=box.querySelector(':scope > label > [data-key="current"]');const end=box.querySelector(':scope > label > [data-key="endDate"]');if(current&&end){const toggle=()=>{end.disabled=current.checked;};current.addEventListener('change',toggle);toggle();}
 const branch=box.querySelector('[data-key="branch"]');if(branch){const code=box.querySelector('[data-key="code"]');const update=()=>{code.parentElement.querySelector('span').textContent=branches[branch.value]?.code||'MOS / Rating / NEC / AFSC / SFSC';code.placeholder=branches[branch.value]?.example||'';};branch.addEventListener('change',update);update();}
 const rm=document.createElement('button');rm.type='button';rm.className='text-button danger';rm.textContent='Remove this '+spec.add;rm.onclick=()=>{box.remove();group.querySelector(':scope > button').disabled=false;group.dispatchEvent(new Event('input',{bubbles:true}));};box.append(rm);entries.append(box);group.querySelector(':scope > button').disabled=entries.children.length>=12;
}
function makeGroup(key,spec,values=[]){const group=document.createElement('section');group.className='builder-group';group.dataset.group=key;const heading=document.createElement('h3');heading.textContent=spec.title;const entries=document.createElement('div');entries.className='builder-entries';const add=document.createElement('button');add.type='button';add.className='button button-secondary';add.textContent='+ Add '+spec.add;add.onclick=()=>{entry(group,spec);group.dispatchEvent(new Event('input',{bubbles:true}));};group.append(heading,entries,add);for(const value of values)entry(group,spec,value);return group;}
export function fillBackground(input={}){const p=normalizeProfile(input);const root=$('background-fields');root.replaceChildren();const personal=document.createElement('fieldset');personal.className='service-role';personal.id='builder-personal';const legend=document.createElement('legend');legend.textContent='Personal & contact information';personal.append(legend);for(const f of personalFields){const label=control(f,p[f.key]);label.querySelector('[data-key]').id='builder-'+f.key;personal.append(label);}root.append(personal);for(const [key,spec]of Object.entries(groups)){const g=makeGroup(key,spec,p[key]);if(key==='roles'){g.querySelector('.builder-entries').id='service-roles';g.querySelector(':scope > button').id='add-service-role';if(!p.roles.length)entry(g,spec);}root.append(g);}for(const key of ['contact','civilian','education','skills'])if(p[key]){const label=control({key,label:'Previously saved '+key+' — retained for compatibility; move into the fields above when ready',type:'textarea'},p[key]);label.dataset.legacy=key;root.append(label);}}
export function readBackground(){const root=$('background-fields');const p=readBox($('builder-personal'));for(const g of root.querySelectorAll(':scope > .builder-group'))p[g.dataset.group]=readGroup(g);for(const label of root.querySelectorAll(':scope > label[data-legacy]'))p[label.dataset.legacy]=label.querySelector('[data-key]').value;return normalizeProfile(p);}
