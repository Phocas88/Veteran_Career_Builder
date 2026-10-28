import {showAppView} from './app-shell.js?v=20261028-guided';
import {initVaCalculator} from './va-calculator.js?v=20261028-va-pdf';
const $=id=>document.getElementById(id);
export function initAppResources(){
 const help=$('emergency-help-dialog');let restoreWelcome=false;const openHelp=()=>{restoreWelcome=$('welcome-dialog').open;if(restoreWelcome)$('welcome-dialog').close();help.showModal();};$('emergency-help-open').onclick=openHelp;$('welcome-help-open').onclick=openHelp;$('emergency-help-close').onclick=()=>help.close();help.addEventListener('close',()=>{if(restoreWelcome){restoreWelcome=false;$('welcome-dialog').showModal();}});
 for(const id of ['home-va-calculator','settings-va-calculator'])$(id).onclick=()=>showAppView('calculator');
 initVaCalculator();
}
