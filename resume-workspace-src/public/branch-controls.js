import {describeReference} from './service-descriptions.js?v=20261026-career-tools';
import { branchCatalog, additionalDuties } from './branch-catalog.js';
import {findSpecialty,fullCodeMatchesBase} from './service-codes.js?v=20261025-standalone-app';

const refreshers = new WeakMap();
const direct = (box, key) => box.querySelector(`:scope > label > [data-key="${key}"]`);
const changed = input => input.dispatchEvent(new Event('input', { bubbles: true }));
const catalogFor = service => branchCatalog[direct(service, 'branch').value];

function picker(box, kind, getLabel, getItems, onChoose) {
  const wrapper=document.createElement('div');wrapper.className='branch-picker';wrapper.dataset.picker=kind;
  const modes=document.createElement('div');modes.className='picker-modes';
  const browse=document.createElement('button'),manual=document.createElement('button');
  for(const b of [browse,manual]){b.type='button';b.className='button button-secondary';}
  browse.textContent='Find in library';manual.textContent='Enter my own';modes.append(browse,manual);
  const library=document.createElement('div');library.className='picker-library';
  const searchLabel=document.createElement('label'),searchCaption=document.createElement('span'),search=document.createElement('input');search.type='search';search.maxLength=120;search.placeholder='Search by code or name';search.dataset.librarySearch=kind;searchLabel.append(searchCaption,search);
  const label=document.createElement('label'),caption=document.createElement('span'),select=document.createElement('select');select.dataset.library=kind;label.append(caption,select);library.append(searchLabel,label);
  const status=document.createElement('p');status.className='picker-included';status.dataset.pickerIncluded=kind;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const explanation=document.createElement('p');explanation.className='picker-explanation';wrapper.append(modes,library,status,explanation);
  const fieldKeys=kind==='specialties'?['code','mosTitle']:kind==='position-ranks'?['rankAtRole']:kind==='history-ranks'?['rank','payGrade']:['qualifications','designators'].includes(kind)?['code','desc']:['name'];
  const fields=fieldKeys.map(key=>direct(box,key)).filter(Boolean);let manualMode=false;
  // Library search precedes its selected values, including the specialty code.
  box.insertBefore(wrapper,fields[0]?.closest('label')||box.querySelector(':scope > label'));
  function included(){
    const values=fields.map(f=>f.value.trim()).filter(Boolean);
    status.textContent=values.length?'✓ Included in this draft: '+values.join(' · '):'Nothing added yet. Choose an item, or use “Enter my own”.';
    status.classList.toggle('has-value',values.length>0);
    const explained=['specialties','qualifications','designators','additional-duties'].includes(kind);explanation.hidden=!explained||!values.length;explanation.textContent=explained&&values.length?describeReference({title:values.at(-1),kind:kind==='specialties'?'specialty':kind==='additional-duties'?'duty':'qualification'}):'';
    fields.forEach(field=>field.closest('label').hidden=!manualMode);
    browse.setAttribute('aria-pressed',String(!manualMode));manual.setAttribute('aria-pressed',String(manualMode));library.hidden=manualMode;
  }
  const render=()=>{
    const previous=select.value,title=getLabel();caption.textContent='Choose '+title.toLowerCase();searchCaption.textContent='Find '+title.toLowerCase();
    const items=getItems(),query=search.value.trim().toLowerCase();
    select.replaceChildren(new Option(items.length?'Choose an item — it is added to this draft':'Choose a branch first',''));
    for(const item of items)if((item.value+' '+item.label).toLowerCase().includes(query))select.add(new Option(item.label,item.value));
    if([...select.options].some(o=>o.value===previous))select.value=previous;
    select.disabled=search.disabled=!items.length;
    if(items.length&&select.options.length===1)select.options[0].textContent='No matches — try another search or enter your own';
    included();
  };
  browse.onclick=()=>{manualMode=false;included();search.focus({preventScroll:true});};
  manual.onclick=()=>{manualMode=true;included();fields[0]?.focus({preventScroll:true});};
  search.addEventListener('input',render);
  select.addEventListener('change',()=>{if(select.value){onChoose(select.value);included();changed(select);}});
  for(const field of fields)field.addEventListener('input',()=>{select.value='';included();});
  // Related fields (e.g. a full MOS) can fill the base code without a synthetic
  // input event. Always refresh the confirmation after the service input settles.
  box.addEventListener('input',()=>queueMicrotask(included));
  const refresh=()=>{search.value='';select.value='';render();};refreshers.set(box,refresh);refresh();
}

function rankDropdown(service) {
  const old = direct(service, 'rank'); const initial = old.value;
  const select = document.createElement('select'); select.dataset.key = 'rank';
  old.replaceWith(select);
  const customLabel = document.createElement('label'); customLabel.className = 'builder-field';
  const caption = document.createElement('span'); caption.textContent = 'Unlisted / historical rank (as held)';
  const custom = document.createElement('input'); custom.dataset.rankCustom = 'true'; custom.maxLength = 250;
  customLabel.append(caption, custom); select.closest('label').after(customLabel);
  let first = true;
  const refresh = () => {
    const value = first ? initial : select.value === '__custom__' ? custom.value : select.value; first = false;
    select.replaceChildren(new Option('Choose a rank (optional)', ''));
    const catalog = catalogFor(service);
    for (const [key, label] of [['enlisted', 'Enlisted'], ['warrant', 'Warrant officers'], ['officer', 'Officers']]) {
      if (!catalog?.ranks[key]?.length) continue;
      const group = document.createElement('optgroup'); group.label = label;
      for (const r of catalog.ranks[key]) group.append(new Option(`${r.grade} · ${r.title} (${r.abbr})`, r.abbr));
      select.append(group);
    }
    select.add(new Option('Other / historical rank — enter below', '__custom__'));
    if (value && ![...select.options].some(o => o.value === value)) { custom.value = value; select.value = '__custom__'; }
    else select.value = value;
    customLabel.hidden = select.value !== '__custom__';
    select.disabled = !catalog;
  };
  select.addEventListener('change', () => {
    customLabel.hidden = select.value !== '__custom__';
    const rank = Object.values(catalogFor(service)?.ranks || {}).flat().find(r => r.abbr === select.value);
    if (rank) { direct(service, 'payGrade').value = rank.grade; changed(select); }
    else if (select.value === '__custom__') custom.focus();
  });
  return refresh;
}

export function wireNestedBranchChoices(box, key, service) {
  if (refreshers.has(box)) return;
  const catalog = () => catalogFor(service);
  if (key === 'asi' || key === 'sqi') {
    const kind = key === 'asi' ? 'qualifications' : 'designators';
    picker(box, kind, () => catalog()?.qualifications[key === 'asi' ? 'label' : 'sqiLabel'] || 'Branch qualifications',
      () => (catalog()?.qualifications[key === 'asi' ? 'items' : 'sqi'] || []).map(v => ({ value: v.code, label: v.code + ' · ' + v.desc })),
      value => { const item = catalog().qualifications[key === 'asi' ? 'items' : 'sqi'].find(v => v.code === value); direct(box, 'code').value = item.code; direct(box, 'desc').value = item.desc; });
  } else if (key === 'awards') {
    picker(box, 'awards', () => (catalog()?.name || 'Branch') + ' awards & shared decorations',
      () => (catalog()?.awards || []).map(v => ({ value: v, label: v })), value => { direct(box, 'name').value = value; });
  } else if (key === 'additionalDuties') {
    picker(box, 'additional-duties', () => 'Additional duty titles', () => additionalDuties.map(v => ({ value: v, label: v })), value => { direct(box, 'name').value = value; });
  } else if (key === 'mosRoles') {
    const input = direct(box, 'rankAtRole');
    // The position's rank is independent of current/separation rank. Selection
    // never copies a current rank into earlier positions automatically.
    picker(box, 'position-ranks', () => (catalog()?.name || 'Branch') + ' rank for this position',
      () => Object.values(catalog()?.ranks || {}).flat().map(r => ({ value: r.abbr, label: `${r.grade} · ${r.title} (${r.abbr})` })), value => { input.value = value; });
  } else if(key==='rankHistory'){
    picker(box,'history-ranks',()=>(catalog()?.name||'Branch')+' rank held',
      ()=>Object.values(catalog()?.ranks||{}).flat().map(r=>({value:r.abbr,label:`${r.grade} · ${r.title} (${r.abbr})`})),
      value=>{const rank=Object.values(catalog()?.ranks||{}).flat().find(r=>r.abbr===value);direct(box,'rank').value=rank.abbr;direct(box,'payGrade').value=rank.grade;});
  }
}

export function wireServiceBranchChoices(service) {
  service.dataset.serviceRole = 'true';
  const branch = direct(service, 'branch'); const code = direct(service, 'code'); const title = direct(service, 'mosTitle');
  const fullCode=direct(service,'fullCode'),skillLevel=direct(service,'skillLevel');
  const refreshRank = rankDropdown(service);
  let previous = branch.value;
  let lastAutoTitle = '';
  picker(service, 'specialties', () => (catalogFor(service)?.name || 'Branch') + ' ' + ({army:'MOS',navy:'ratings / NEC',marines:'MOS',airforce:'AFSC',coastguard:'ratings',spaceforce:'SFSC / AFSC'}[branch.value] || 'specialty codes'),
    () => (catalogFor(service)?.specialties || []).map(v => ({ value: v.code, label: v.code + ' · ' + v.title })),
    value => {
      const item=catalogFor(service).specialties.find(v=>v.code===value);
      if(fullCode.value&&!fullCodeMatchesBase(fullCode.value,item.code)){
        if(!confirm('Changing the base specialty clears the full specialty code and skill level for this experience. Your rank, dates, duties and other qualifications stay in place. Continue?')){refreshers.get(service)();return;}
        fullCode.value='';skillLevel.value='';
      }
      code.value=item.code;title.value=item.title;lastAutoTitle=item.title;updateFullCodeHint();
    });
  code.addEventListener('input', () => {
    const match=findSpecialty(catalogFor(service),code.value,branch.value);
    if (match) { title.value = match.title; lastAutoTitle = match.title; }
    else if (lastAutoTitle && title.value === lastAutoTitle) { title.value = ''; lastAutoTitle = ''; }
  });
  fullCode.addEventListener('input',()=>{
    const match=findSpecialty(catalogFor(service),fullCode.value,branch.value);
    // Lookup the title/family only. Never derive a grade, skill level, SQI or ASI.
    if(match&&!code.value.trim()){code.value=match.code;if(!title.value.trim()){title.value=match.title;lastAutoTitle=match.title;}}
    updateFullCodeHint();
  });
  const fullHint=document.createElement('small');fullHint.className='full-specialty-help';fullHint.dataset.fullCodeHelp='true';fullCode.closest('label').append(fullHint);
  function updateFullCodeHint(){
    fullHint.textContent=fullCode.value&&!fullCodeMatchesBase(fullCode.value,code.value)?'Check that the base and full specialty codes refer to the same specialty. Your values are unchanged.':branch.value==='army'?'Copy the full code from your service records. For example, 88M02 stays exactly as entered; rank does not determine its skill level or qualifiers.':'Copy the full specialty code from your service records. Skill levels and qualifiers are recorded separately and are never guessed from rank.';
  }
  code.addEventListener('input',updateFullCodeHint);
  // Older saved profiles may have kept a full Army MOS in the single code field.
  const legacy=findSpecialty(catalogFor(service),code.value,branch.value);
  if(legacy&&legacy.code.toUpperCase()!==code.value.trim().toUpperCase()&&!fullCode.value){fullCode.value=code.value;code.value=legacy.code;if(!title.value)title.value=legacy.title;}
  const hint = document.createElement('p'); hint.className = 'branch-choice-note'; hint.textContent = 'Set up each service experience: choose your branch and rank, select your MOS or specialty, then add the qualifications you actually held. Use separate experiences for other services or specialties. Historical and unlisted entries can be entered manually.';
  service.append(hint);
  const refresh = () => {
    code.closest('label').querySelector('span').textContent = ({army:'Base MOS',navy:'Rating / specialty',marines:'MOS',airforce:'Base AFSC',coastguard:'Rating',spaceforce:'SFSC / former AFSC'}[branch.value] || 'Base specialty code');
    fullCode.closest('label').querySelector('span').textContent=({army:'Full MOS code / grade (as recorded, e.g. 88M02)',airforce:'Full AFSC, including skill level / shredout (as recorded)',spaceforce:'Full SFSC / AFSC (as recorded)',navy:'Full rating / specialty code (as recorded)',coastguard:'Full rating / specialty code (as recorded)',marines:'Full MOS code (as recorded)'}[branch.value]||'Full specialty code (as recorded)');
    fullCode.placeholder=branch.value==='army'?'e.g. 88M02 — exactly as recorded':'Copy the full code from your service records';
    skillLevel.closest('label').querySelector('span').textContent=branch.value==='army'?'MOS skill level (as recorded, optional)':'Skill / qualification level (as recorded, optional)';
    updateFullCodeHint();
    code.placeholder = branch.value ? 'Selected code, or enter your own' : 'Choose a branch first';
    refreshRank(); refreshers.get(service)();
    for (const [key, titleKey] of [['asi', 'label'], ['sqi', 'sqiLabel']]) {
      const group = service.querySelector(`:scope > [data-group="${key}"]`);
      group.querySelector(':scope > summary > h3, :scope > h3').textContent = catalogFor(service)?.qualifications[titleKey] || (key === 'asi' ? 'Branch qualifications' : 'Branch designators');
    }
    for (const group of service.querySelectorAll(':scope > .builder-group')) {
      for (const entry of group.querySelector(':scope > .builder-entries').children) {
        wireNestedBranchChoices(entry, group.dataset.group, service); refreshers.get(entry)?.();
      }
    }
  };
  branch.addEventListener('change', () => {
    const specific = ['rank','payGrade','code','mosTitle','fullCode','skillLevel'].some(k => direct(service, k).value) || ['asi','sqi','awards','rankHistory'].some(k => [...service.querySelectorAll(`:scope > [data-group="${k}"] [data-key]`)].some(el => el.value)) || [...service.querySelectorAll('[data-group="mosRoles"] [data-key="rankAtRole"]')].some(el => el.value);
    if (previous && previous !== branch.value && specific) {
      if (!confirm('Changing this branch clears branch-specific ranks, pay grades, specialty codes, qualifications and awards. Rank-history dates, duties and other experience stay in place. Continue?')) { branch.value = previous; return; }
      for (const key of ['rank','payGrade','code','mosTitle','fullCode','skillLevel']) direct(service,key).value = '';
      service.querySelector('[data-rank-custom]').value = '';
      for (const key of ['asi','sqi','awards']) { const group=service.querySelector(`:scope > [data-group="${key}"]`); group.querySelector(':scope > .builder-entries').replaceChildren(); group.querySelector(':scope > button').disabled=false; }
      // Position titles/duties remain; a rank selected for the former branch must
      // be reconfirmed in the new branch rather than carried across services.
      for (const rank of service.querySelectorAll('[data-group="mosRoles"] [data-key="rankAtRole"]')) rank.value = '';
      for(const field of service.querySelectorAll('[data-group="rankHistory"] [data-key="rank"], [data-group="rankHistory"] [data-key="payGrade"]'))field.value='';
      lastAutoTitle = '';
    }
    previous = branch.value; refresh();
  });
  refresh();
}
