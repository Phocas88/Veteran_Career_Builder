import {initUsageAnalytics,trackUsage} from './analytics.js?v=20261107-dedicated-ga4';
import {initWebsitePrivacy} from './website-ads.js?v=20261107-dedicated-ga4';
import {isAppInstalled} from './app-install.js?v=20261107-cozy';
import {appDestination} from './website-routing.mjs?v=20261107-cozy';

function initHeroCarousel(root){
 const slides=Array.from(root.querySelectorAll('[data-hero-slide]')),dots=Array.from(root.querySelectorAll('[data-hero-dot]'));
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),play=root.querySelector('[data-hero-play]'),status=root.querySelector('[data-hero-status]');
 let index=0,playing=!motion.matches,hovered=false,inView=true,start=null,suppressClickUntil=0,playChoice=null;
 function playback(value){
  playing=Boolean(value)&&!motion.matches;root.dataset.playing=String(playing);
  play.hidden=motion.matches;play.textContent=playing?'Pause Ⅱ':'Play ▷';play.setAttribute('aria-label',playing?'Pause template rotation':'Play template rotation');
  status.setAttribute('aria-live',playing?'off':'polite');
 }
 function show(value,manual=false){
  if(manual)playback(false);
  index=(value+slides.length)%slides.length;root.dataset.activeIndex=String(index);
  slides.forEach((slide,i)=>{
   const offset=(i-index+slides.length)%slides.length,active=offset===0;
   slide.dataset.position=active?'active':offset===1?'next':offset===slides.length-1?'previous':'hidden';
   slide.setAttribute('aria-hidden',String(!active));slide.inert=!active;slide.setAttribute('role','group');slide.setAttribute('aria-roledescription','slide');slide.setAttribute('aria-label',slide.dataset.templateName+', '+(i+1)+' of '+slides.length);
   slide.querySelector('button').tabIndex=active?0:-1;
  });
  dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
  root.querySelector('[data-hero-name]').textContent=slides[index].dataset.templateName;
  root.querySelector('[data-hero-detail]').textContent=slides[index].dataset.templateDetail;
 }
 root.querySelector('[data-hero-previous]').addEventListener('click',()=>show(index-1,true));
 root.querySelector('[data-hero-next]').addEventListener('click',()=>show(index+1,true));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i,true)));
 play.addEventListener('pointerdown',()=>{playChoice=!playing;});
 play.addEventListener('pointercancel',()=>{playChoice=null;});
 document.addEventListener('pointerup',event=>{if(!play.contains(event.target))playChoice=null;});
 play.addEventListener('click',()=>{const choice=playChoice??!playing;playChoice=null;playback(choice);});
 root.addEventListener('mouseenter',()=>{hovered=true;});root.addEventListener('mouseleave',()=>{hovered=false;});
 root.addEventListener('focusin',()=>playback(false));
 root.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowLeft'?-1:1),true);}
 });
 const stage=root.querySelector('.hero-stage');stage.style.touchAction='pan-y';
 stage.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')start={x:event.clientX,y:event.clientY};});
 stage.addEventListener('pointercancel',()=>{start=null;});
 stage.addEventListener('pointerup',event=>{
  if(!start)return;const x=event.clientX-start.x,y=event.clientY-start.y;start=null;
  if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.35){suppressClickUntil=Date.now()+400;event.preventDefault();show(index+(x<0?1:-1),true);}
 });
 root.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 motion.addEventListener('change',()=>playback(false));
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:.3}).observe(root);
 setInterval(()=>{if(playing&&!hovered&&inView&&document.visibilityState==='visible'&&!document.querySelector('dialog[open]'))show(index+1);},6500);
 playback(playing);show(0);
}

function initTemplateRail(){
 const rail=document.getElementById('template-rail'),cards=Array.from(rail.querySelectorAll('.sample-card'));
 const previous=document.querySelector('[data-rail-previous]'),next=document.querySelector('[data-rail-next]'),status=document.querySelector('[data-rail-status]');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let pending=false;
 const visible=()=>cards.filter(card=>!card.hidden);
 function update(){
  pending=false;const active=visible(),bounds=rail.getBoundingClientRect();
  const shown=active.map((card,index)=>({index,bounds:card.getBoundingClientRect()})).filter(row=>Math.min(bounds.right,row.bounds.right)-Math.max(bounds.left,row.bounds.left)>Math.min(row.bounds.width*.45,80));
  previous.disabled=rail.scrollLeft<3;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;
  const text=shown.length?(shown[0].index+1)+(shown.length>1?'–'+(shown.at(-1).index+1):'')+' of '+active.length:active.length+' layouts';
  if(status.textContent!==text)status.textContent=text;
 }
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};
 function move(direction){
  const card=visible()[0];if(!card)return;
  rail.scrollBy({left:direction*(card.getBoundingClientRect().width+parseFloat(getComputedStyle(rail).columnGap)),behavior:motion.matches?'auto':'smooth'});
 }
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 rail.addEventListener('scroll',schedule,{passive:true});
 rail.addEventListener('keydown',event=>{
  if(event.target!==rail)return;
  if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
   event.preventDefault();
   if(event.key==='Home'||event.key==='End')rail.scrollTo({left:event.key==='Home'?0:rail.scrollWidth,behavior:motion.matches?'auto':'smooth'});
   else move(event.key==='ArrowLeft'?-1:1);
  }
 });
 for(const button of document.querySelectorAll('[data-sample-filter]'))button.addEventListener('click',()=>{
  const kind=button.dataset.sampleFilter;
  for(const tab of document.querySelectorAll('[data-sample-filter]'))tab.setAttribute('aria-pressed',String(tab===button));
  cards.forEach(card=>{card.hidden=kind==='all'?false:kind==='photo'?card.dataset.photo!=='true':kind==='resume'?card.dataset.category!=='civilian':card.dataset.category!==kind;});
  rail.dataset.filter=kind;rail.scrollTo({left:0,behavior:'auto'});schedule();
 });
 if('ResizeObserver' in window)new ResizeObserver(schedule).observe(rail);
 window.addEventListener('resize',schedule);schedule();
}

const destination=appDestination(location.href,isAppInstalled());
if(destination)location.replace(destination);
else{
 initUsageAnalytics();initWebsitePrivacy();
 document.addEventListener('click',event=>{
  const target=event.target.closest('a,button');if(!target)return;
  let action;
  if(target.hasAttribute('data-example'))action='example';
  else if(target.hasAttribute('data-install-app'))action='install_app';
  else if(target.tagName==='A'){const href=target.getAttribute('href')||'';if(href.startsWith('/app/?start=build'))action='start_resume';else if(href.startsWith('/app/?start=upload'))action='upload_resume';else if(href==='/app/#letter')action='cover_letter';else if(href==='/app/')action='open_app';}
  if(action)trackUsage('vcp_resume_website_action',{action});
 });
 const menu=document.querySelector('.mobile-menu');
 menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
 document.getElementById('privacy-options').addEventListener('click',()=>{
  const dialog=document.getElementById('usage-analytics-notice');if(!dialog.open)dialog.showModal();document.getElementById('usage-analytics-title').focus();
 });
 initHeroCarousel(document.querySelector('[data-hero-carousel]'));initTemplateRail();
 const dialog=document.getElementById('example-dialog'),image=document.getElementById('example-image'),pdf=document.getElementById('example-pdf'),pages=document.getElementById('example-pages');
 const names={'resume-modern':'Modern resume','resume-executive':'Executive resume','resume-folio':'Folio resume','resume-classic':'Classic resume','resume-creative':'Creative resume','resume-federal':'Federal resume','resume-federal-experience':'Federal experience resume','cover-letter':'Cover letter'};
 let returnFocus,renderVersion=0,manifest;
 const getManifest=()=>manifest??=fetch('/site-examples/manifest.json').then(response=>response.ok?response.json():null).catch(()=>null);
 for(const button of document.querySelectorAll('[data-example]'))button.addEventListener('click',async()=>{
  const key=button.dataset.example;if(!Object.hasOwn(names,key))return;
  const token=++renderVersion;returnFocus=button;
  for(const extra of pages.querySelectorAll('[data-additional-page]'))extra.remove();
  image.src='/site-examples/'+key+'.png';image.alt=names[key]+', page 1';pdf.href='/site-examples/'+key+'.pdf';
  document.getElementById('example-dialog-title').textContent=names[key];dialog.showModal();
  const info=(await getManifest())?.examples?.find(item=>item.key===key);
  if(token!==renderVersion||!dialog.open)return;
  for(let page=2;page<=Math.min(2,info?.pages||1);page++){
   const img=document.createElement('img');img.dataset.additionalPage=String(page);img.src='/site-examples/'+key+'-'+page+'.png';img.alt=names[key]+', page '+page;img.width=816;img.height=1056;img.loading='lazy';pages.append(img);
  }
 });
 document.getElementById('example-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{renderVersion++;returnFocus?.focus({preventScroll:true});});
}
