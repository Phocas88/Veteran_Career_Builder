import {showAppView} from './app-shell.js?v=20261028-guided';
import {initVaCalculator} from './va-calculator.js?v=20261028-va-pdf';
const $=id=>document.getElementById(id);
export function initAppResources(){
 const help=$('emergency-help-dialog');let restoreDialog=null;
 const openHelp=()=>{restoreDialog=['usage-analytics-notice','welcome-dialog'].map($).find(dialog=>dialog.open)||null;if(restoreDialog)restoreDialog.close();help.showModal();};
 for(const id of ['emergency-help-open','welcome-help-open','analytics-help-open'])$(id).onclick=openHelp;
 $('emergency-help-close').onclick=()=>help.close();help.addEventListener('close',()=>{const previous=restoreDialog;restoreDialog=null;if(previous&&!document.querySelector('dialog[open]'))previous.showModal();});
 for(const id of ['home-va-calculator','settings-va-calculator'])$(id).onclick=()=>showAppView('calculator');
 initVaCalculator();
}
