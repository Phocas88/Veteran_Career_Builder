import {initUsageAnalytics} from './analytics.js?v=20261107-cozy';
import {isAppInstalled} from './app-install.js?v=20261107-cozy';
import {appDestination} from './website-routing.mjs?v=20261107-cozy';

const destination=appDestination(location.href,isAppInstalled());
if(destination)location.replace(destination);
else{
 initUsageAnalytics();
 // The install module auto-initializes when it finds its dialog.
 const menu=document.querySelector('.mobile-menu');
 menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
 document.getElementById('privacy-options').addEventListener('click',()=>{const dialog=document.getElementById('usage-analytics-notice');if(!dialog.open)dialog.showModal();document.getElementById('usage-analytics-title').focus();});
 const dialog=document.getElementById('example-dialog'),image=document.getElementById('example-image'),pdf=document.getElementById('example-pdf');
 const names={'resume-modern':'Modern civilian resume','resume-classic':'Classic civilian resume','resume-federal':'Federal resume','cover-letter':'Cover letter for Example Company'};
 let returnFocus;
 for(const button of document.querySelectorAll('[data-example]'))button.addEventListener('click',()=>{
  const key=button.dataset.example;if(!Object.hasOwn(names,key))return;
  returnFocus=button;image.src='/site-examples/'+key+'.png';image.alt='Fictional example: '+names[key];pdf.href='/site-examples/'+key+'.pdf';document.getElementById('example-dialog-title').textContent=names[key];dialog.showModal();
 });
 document.getElementById('example-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
 for(const button of document.querySelectorAll('[data-sample-filter]'))button.addEventListener('click',()=>{
  const kind=button.dataset.sampleFilter;
  for(const tab of document.querySelectorAll('[data-sample-filter]'))tab.setAttribute('aria-pressed',String(tab===button));
  for(const card of document.querySelectorAll('[data-sample-kind]'))card.hidden=kind!=='all'&&card.dataset.sampleKind!==kind;
 });
}
