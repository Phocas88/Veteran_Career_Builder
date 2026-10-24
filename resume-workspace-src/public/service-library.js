import {searchServiceLibrary,addReferenceToProfile} from './service-library-model.js?v=20261024-service-library';
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
const kindName={specialty:'Specialties',qualification:'Qualifications',designator:'Special qualifications / designators'};
export function initServiceLibrary(api){
 let data,loading,selected=null,limit=20,generation=0,initial=true,controller;
 const message=text=>{$('library-status').textContent=text;};
 function targets(){
  const select=$('library-target'),previous=select.value,profile=api.getProfile();
  select.replaceChildren(new Option('New service experience','new'));
  profile.roles.forEach((r,i)=>{if(r.branch===selected?.branch)select.add(new Option([r.title||r.mosTitle||r.code||'Service experience '+(i+1),r.startDate,r.endDate].filter(Boolean).join(' · '),String(i)));});
  select.value=previous!=='new'&&[...select.options].some(o=>o.value===previous)?previous:select.options[1]?.value||'new';
 }
 function hideDetail(){selected=null;$('library-detail').hidden=true;$('library-confirm').checked=false;$('library-apply').disabled=true;$('library-detail-body').replaceChildren();}
 function render(){
  if(!data)return;
  const branch=$('library-branch').value,kind=$('library-kind').value,query=$('library-search').value;
  const meta=data.branches[branch];
  $('library-kind').options[1].textContent=meta?.qualificationLabel||'Qualifications (ASI / NEC / branch identifiers)';
  $('library-kind').options[2].textContent=meta?.designatorLabel||'Special qualifications / designators';
  const found=searchServiceLibrary(data,{branch,kind,query});
  $('library-count').textContent=`${Math.min(limit,found.length)} of ${found.length} ${kindName[kind].toLowerCase()}${meta?' · '+meta.name:''}`;
  $('library-empty').hidden=found.length>0;$('library-more').hidden=found.length<=limit;
  $('library-results').replaceChildren(...found.slice(0,limit).map(entry=>{
   const li=el('li'),b=el('button',null,'library-result');b.type='button';
   b.append(el('span',entry.code,'library-code'),el('strong',entry.title),el('span',data.branches[entry.branch].name+' · '+(entry.ambiguous?'Multiple reference labels — verify yours':kindName[entry.kind]),'library-result-note'),el('span','View details →','library-result-link'));
   b.onclick=()=>show(entry);li.append(b);return li;
  }));
 }
 function linked(label,url){const a=el('a',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function show(entry){
  selected=entry;$('library-detail').hidden=false;$('library-reference-details').open=false;$('library-selected-title').textContent=entry.code+' · '+entry.title;
  $('library-selected-meta').textContent=data.branches[entry.branch].name+' · '+kindName[entry.kind];
  $('library-variant-note').hidden=!entry.ambiguous;
  $('library-variant-note').textContent='The website sources use more than one label for this code. Some names may be historical or inconsistent. Confirm the code and exact description in your own service records before adding it.';
  const body=$('library-detail-body');body.replaceChildren();
  if(entry.intro)body.append(el('p',entry.intro));
  if(entry.capabilities?.length){body.append(el('h5','Experience to reflect on'));const list=el('ul');for(const capability of entry.capabilities)list.append(el('li',capability));body.append(list,el('p','These are general reference topics. Describe only the duties and training you personally completed.'));}
  if(entry.paths?.length){body.append(el('h5','Civilian directions to explore'));for(const p of entry.paths){const card=el('article',null,'library-path');card.append(el('h6',p.name),el('p',p.why));if(p.bridge)card.append(el('p','What to check: '+p.bridge));if(p.url)card.append(linked('Explore this career guide',p.url));body.append(card);}}
  if(entry.crosswalk?.length){const details=el('details');details.append(el('summary','Related O*NET occupations'));const ul=el('ul');for(const o of entry.crosswalk)ul.append(el('li',o.title+' · '+o.code));details.append(ul,el('p',data.crosswalkSource+' · website snapshot '+data.crosswalkDate+'. A crosswalk does not establish individual qualifications.'));body.append(details);}
  const links=el('div',null,'career-actions');if(entry.guide)links.append(linked('Read the full website MOS guide',entry.guide));
  links.append(linked('Website special qualifications guide','https://veterancareerpath.com/military-special-qualifications-civilian-guide.html'));
  for(const source of entry.citations||[])links.append(linked(source.label,source.url));body.append(links,el('p','Reference: '+entry.sources.join(' · ')+(entry.reviewedAt?' · website review date '+entry.reviewedAt:'')+'. Codes and titles can change. Verify against your service records and current branch guidance.'));
  $('library-use-title').value=entry.title;$('library-confirm').checked=false;$('library-apply').disabled=true;targets();
  $('library-selected-title').focus({preventScroll:true});$('library-detail').scrollIntoView({block:'start',behavior:'instant'});
 }
 async function open(){
  if(initial){$('library-branch').value=api.getProfile().roles.find(r=>r.branch)?.branch||'army';initial=false;}
  if(data){render();return;}
  if(loading)return loading;
  const version=generation;controller=new AbortController();message('Loading the website service library…');$('library-retry').hidden=true;
  loading=(async()=>{
   try{const r=await fetch('./service-library-data.json?v=20261024-service-library',{signal:controller.signal});if(!r.ok)throw new Error();const next=await r.json();if(!Array.isArray(next.entries)||!next.branches)throw new Error();if(version!==generation)return;data=next;render();message('Browse freely. Adding an entry updates your draft profile only; saving to your account is a separate choice.');}
   catch(error){if(version===generation&&error.name!=='AbortError'){message('The library could not load. Your profile is unchanged. Try again or use the manual fields in your career profile.');$('library-retry').hidden=false;}}
   finally{if(version===generation)loading=null;}
  })();return loading;
 }
 const filter=()=>{limit=20;hideDetail();render();message('');};
 for(const id of ['library-branch','library-kind'])$(id).onchange=filter;
 $('library-search').oninput=filter;$('library-more').onclick=()=>{limit+=20;render();};$('library-retry').onclick=open;
 $('library-detail-back').onclick=()=>{hideDetail();$('library-results').scrollIntoView({block:'start'});$('library-search').focus({preventScroll:true});};
 $('library-confirm').onchange=()=>{$('library-apply').disabled=!$('library-confirm').checked;};
 $('library-apply').onclick=()=>{
  if(!selected||!$('library-confirm').checked)return;
  const title=$('library-use-title').value.trim();if(!title){message('Enter the verified description for this code.');$('library-use-title').focus();return;}
  const profile=api.getProfile(),target=$('library-target').value,role=target==='new'?null:profile.roles[Number(target)];
  if(selected.kind==='specialty'&&role&&(role.code||role.mosTitle)&&(role.code!==selected.code||role.mosTitle!==title)&&!confirm('Replace this experience’s specialty code and official specialty title? Your actual duty title, dates, responsibilities and achievements will stay in place.'))return;
  try{const next=addReferenceToProfile(profile,{...selected,title},target);api.applyProfile(next);message('Added to your draft career profile. Review the details there, then choose Save career profile to keep them in your account.');$('library-confirm').checked=false;$('library-apply').disabled=true;targets();$('library-view-profile').hidden=false;}
  catch(error){message(error.message);}
 };
 $('library-view-profile').onclick=()=>api.showProfile();$('library-manual').onclick=()=>api.showProfile();
 return {open,reset(){generation++;controller?.abort();loading=null;selected=null;initial=true;limit=20;$('library-search').value='';$('library-kind').value='specialty';$('library-target').replaceChildren();$('library-use-title').value='';$('library-view-profile').hidden=true;hideDetail();message('');}};
}
