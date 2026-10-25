import {createResumeDocument,designs} from './exports.js?v=20261027-resume-studio';
import {renderPdfPages} from './page-preview.js?v=20261027-resume-studio';
const $=id=>document.getElementById(id);
export const exampleResume=`ALEX MORGAN
alex.morgan@example.com · 202-555-0142 · Richmond, VA

PROFESSIONAL SUMMARY
Operations professional and Army veteran with experience coordinating schedules, maintaining supply records and supporting team training. Brings clear communication, careful documentation and practical problem-solving to civilian operations roles.

EXPERIENCE
Operations Coordinator | Example Logistics Company | Jan 2022 – Present
Hours per week: 40
• Coordinate daily schedules and shipment records for a regional operations team.
• Maintain equipment and supply records, and prepare status reports for managers.
• Updated the team handover checklist to make outstanding work easier to track.

Supply Specialist | U.S. Army | Jun 2017 – Dec 2021
Hours per week: 40
• Maintained inventory records and supported routine equipment inspections.
• Helped new team members learn supply procedures and documentation standards.
• Coordinated with maintenance staff to track requests and follow up on open items.

EDUCATION
Example State College · Associate of Applied Science, Business · Completed May 2022

SKILLS
Inventory records · Excel · Scheduling · Team training · Operational reporting

CERTIFICATIONS
Example Professional Association · Operations Certificate · Completed Mar 2023

PROJECTS
Community Supply Drive · Volunteer Coordinator · Oct 2023
• Organized collection schedules and tracked donated supplies with a local team.`;
export function exampleModel(design,photo){return createResumeDocument(exampleResume,{design,applicationType:designs[design].federal?'federal':'private',paper:'letter',arrangement:'professional',exportSettings:photo?{photo}:{}});}
let headshot;
export async function examplePhoto(){
 if(!headshot)headshot=fetch(new URL('./example-headshot.jpg',import.meta.url)).then(async response=>{if(!response.ok)throw new Error('Example portrait unavailable');const blob=await response.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}).catch(error=>{headshot=null;throw error;});
 return headshot;
}

export function initTemplateExamples(api){
 let selected='classic',version=0;const dialog=$('template-example-dialog'),pages=$('template-example-pages');
 function zoom(value){$('template-example-zoom').value=value;pages.classList.toggle('full-size',value==='actual');}
 async function render(){const token=++version;const design=designs[selected];$('template-example-title').textContent=design.name+' · example resume';$('template-example-description').textContent=design.description+(design.photo?' · AI-generated example portrait · upload your own photo to use this design.':'');$('template-example-use').textContent='Use '+design.name;$('template-example-use').disabled=!api.canUse(selected);$('template-example-use').title=api.canUse(selected)?'':'Choose a federal template while preparing a federal application.';$('template-example-status').textContent='Preparing example pages…';pages.replaceChildren();try{const result=await renderPdfPages(pages,exampleModel(selected,design.photo?await examplePhoto():null),()=>token===version&&dialog.open);if(token===version)$('template-example-status').textContent=`Fictional example · ${result.pageCount} ${result.pageCount===1?'page':'pages'} · Your resume is unchanged`;}catch{if(token===version)$('template-example-status').textContent='The example could not load. Close and try again; your resume is unchanged.';}}
 function open(id){selected=id;zoom('fit');if(!dialog.open)dialog.showModal();render();}
 $('template-example-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{version++;pages.replaceChildren();});
 $('template-example-zoom').onchange=event=>zoom(event.target.value);
 for(const [id,delta]of [['template-example-prev',-1],['template-example-next',1]])$(id).onclick=()=>{const keys=Object.keys(designs);selected=keys[(keys.indexOf(selected)+delta+keys.length)%keys.length];render();};
 $('template-example-use').onclick=()=>{if(!api.canUse(selected))return;api.choose(selected);dialog.close();};
 return {open,reset(){version++;dialog.close();pages.replaceChildren();}};
}
