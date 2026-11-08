// Installation is optional and starts only after the user presses Install app.
export const isAppInstalled=(win=window,nav=navigator)=>nav.standalone===true||['standalone','fullscreen','minimal-ui'].some(mode=>win.matchMedia?.('(display-mode: '+mode+')').matches);
export function initAppInstall({win=window,nav=navigator,doc=document,moduleUrl=import.meta.url}={}){
 let deferred=null,installed=isAppInstalled(win,nav),busy=false,returnFocus;
 const dialog=doc.getElementById('app-install-dialog'),status=doc.getElementById('app-install-status');
 const buttons=[...doc.querySelectorAll('[data-install-app]')],panels=[...doc.querySelectorAll('[data-install-available]')];
 const render=()=>{installed=installed||isAppInstalled(win,nav);for(const panel of panels)panel.hidden=installed;for(const button of buttons)button.disabled=busy;};
 const manual=button=>{returnFocus=button;if(!dialog.open)dialog.showModal();};
 async function install(event){
  if(busy||installed)return;
  const button=event.currentTarget;if(!deferred){manual(button);return;}
  const prompt=deferred;deferred=null;busy=true;render();
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice?.outcome==='accepted')status.textContent='Follow your browser to add the Veteran Resumes shortcut.';else status.textContent='You can install later from this button or your browser’s menu.';}
  catch{manual(button);}
  finally{busy=false;render();}
 }
 for(const button of buttons)button.addEventListener('click',install);
 doc.getElementById('app-install-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>returnFocus?.focus());
 win.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;render();});
 win.addEventListener('appinstalled',()=>{installed=true;deferred=null;status.textContent='App installed. Open Veteran Resumes from your device’s apps.';if(dialog.open)dialog.close();render();});
 win.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',render);
 render();
 // Cache only the public offline help and installation assets. The worker does
 // not cache resume content, private requests, sign-in, analytics or checkout.
 if('serviceWorker' in nav){
  const worker=new URL('./app-worker.js',moduleUrl),scope=new URL('./',moduleUrl);
  nav.serviceWorker.register(worker.href,{scope:scope.pathname,updateViaCache:'none'}).catch(()=>{/* Browser-menu installation remains available when supported. */});
 }
 return {refresh:render};
}
if(typeof document!=='undefined'&&document.getElementById('app-install-dialog'))initAppInstall();
