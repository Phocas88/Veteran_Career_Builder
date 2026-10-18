import { branchCatalog, additionalDuties } from './branch-catalog.js';

const refreshers = new WeakMap();
const direct = (box, key) => box.querySelector(`:scope > label > [data-key="${key}"]`);
const changed = input => input.dispatchEvent(new Event('input', { bubbles: true }));
const catalogFor = service => branchCatalog[direct(service, 'branch').value];

function picker(box, kind, getLabel, getItems, onChoose) {
  const wrapper = document.createElement('div');
  wrapper.className = 'branch-picker';
  const searchLabel = document.createElement('label');
  const searchCaption = document.createElement('span');
  const search = document.createElement('input'); search.type = 'search'; search.maxLength = 120;
  search.dataset.librarySearch = kind;
  searchLabel.append(searchCaption, search);
  const label = document.createElement('label');
  const caption = document.createElement('span');
  const select = document.createElement('select'); select.dataset.library = kind;
  label.append(caption, select); wrapper.append(searchLabel, label);
  const codeField = direct(box, 'code');
  if (kind === 'specialties' && codeField) codeField.closest('label').after(wrapper);
  else box.insertBefore(wrapper, box.querySelector(':scope > label'));
  const render = () => {
    const previous = select.value;
    const title = getLabel(); caption.textContent = title;
    searchCaption.textContent = 'Search ' + title.toLowerCase();
    select.replaceChildren(new Option('Choose from the list (or enter your own below)', ''));
    const query = search.value.trim().toLowerCase();
    for (const item of getItems()) if ((item.value + ' ' + item.label).toLowerCase().includes(query)) select.add(new Option(item.label, item.value));
    if ([...select.options].some(o => o.value === previous)) select.value = previous;
    const enabled = getItems().length > 0;
    select.disabled = !enabled; search.disabled = !enabled;
  };
  search.addEventListener('input', render);
  select.addEventListener('change', () => { if (select.value) { onChoose(select.value); changed(select); } });
  const refresh = () => { search.value = ''; select.value = ''; render(); };
  refreshers.set(box, refresh); refresh();
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
  }
}

export function wireServiceBranchChoices(service) {
  service.dataset.serviceRole = 'true';
  const branch = direct(service, 'branch'); const code = direct(service, 'code'); const title = direct(service, 'mosTitle');
  const refreshRank = rankDropdown(service);
  let previous = branch.value;
  let lastAutoTitle = '';
  picker(service, 'specialties', () => (catalogFor(service)?.name || 'Branch') + ' ' + ({army:'MOS',navy:'ratings / NEC',marines:'MOS',airforce:'AFSC',coastguard:'ratings',spaceforce:'SFSC / AFSC'}[branch.value] || 'specialty codes'),
    () => (catalogFor(service)?.specialties || []).map(v => ({ value: v.code, label: v.code + ' · ' + v.title })),
    value => { const item = catalogFor(service).specialties.find(v => v.code === value); code.value = item.code; title.value = item.title; lastAutoTitle = item.title; });
  code.addEventListener('input', () => {
    const match = catalogFor(service)?.specialties.find(v => v.code.toLowerCase() === code.value.trim().toLowerCase());
    if (match) { title.value = match.title; lastAutoTitle = match.title; }
    else if (lastAutoTitle && title.value === lastAutoTitle) { title.value = ''; lastAutoTitle = ''; }
  });
  const hint = document.createElement('p'); hint.className = 'branch-choice-note'; hint.textContent = 'Choose your branch to browse its ranks, specialties, qualifications and awards. Select only what you actually held. Unlisted and historical entries can be entered manually.';
  service.append(hint);
  const refresh = () => {
    code.closest('label').querySelector('span').textContent = ({army:'MOS',navy:'Rating / NEC',marines:'MOS',airforce:'AFSC',coastguard:'Rating',spaceforce:'SFSC / former AFSC'}[branch.value] || 'Specialty code');
    code.placeholder = branch.value ? 'Choose a code below or enter an unlisted code' : 'Choose a branch first';
    refreshRank(); refreshers.get(service)();
    for (const [key, titleKey] of [['asi', 'label'], ['sqi', 'sqiLabel']]) {
      const group = service.querySelector(`:scope > [data-group="${key}"]`);
      group.querySelector(':scope > h3').textContent = catalogFor(service)?.qualifications[titleKey] || (key === 'asi' ? 'Branch qualifications' : 'Branch designators');
    }
    for (const group of service.querySelectorAll(':scope > .builder-group')) {
      for (const entry of group.querySelector(':scope > .builder-entries').children) {
        wireNestedBranchChoices(entry, group.dataset.group, service); refreshers.get(entry)?.();
      }
    }
  };
  branch.addEventListener('change', () => {
    const specific = ['rank','payGrade','code','mosTitle'].some(k => direct(service, k).value) || ['asi','sqi','awards'].some(k => [...service.querySelectorAll(`:scope > [data-group="${k}"] [data-key]`)].some(el => el.value)) || [...service.querySelectorAll('[data-group="mosRoles"] [data-key="rankAtRole"]')].some(el => el.value);
    if (previous && previous !== branch.value && specific) {
      if (!confirm('Changing this branch clears its rank, pay grade, specialty, qualifications and awards. Your duties, dates and other experience stay in place. Continue?')) { branch.value = previous; return; }
      for (const key of ['rank','payGrade','code','mosTitle']) direct(service,key).value = '';
      service.querySelector('[data-rank-custom]').value = '';
      for (const key of ['asi','sqi','awards']) { const group=service.querySelector(`:scope > [data-group="${key}"]`); group.querySelector(':scope > .builder-entries').replaceChildren(); group.querySelector(':scope > button').disabled=false; }
      // Position titles/duties remain; a rank selected for the former branch must
      // be reconfirmed in the new branch rather than carried across services.
      for (const rank of service.querySelectorAll('[data-group="mosRoles"] [data-key="rankAtRole"]')) rank.value = '';
      lastAutoTitle = '';
    }
    previous = branch.value; refresh();
  });
  refresh();
}
