import {parsePosting,parseApplicationCsv,applicationKey,applicationCsvExample} from './application-import-model.js?v=20261026-career-tools';
import {importResumeFile} from './imports.js';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
export function initApplicationImport(api){
 let rows=[],generation=0,fileRevision=0,busy=false;const message=text=>$('application-import-status').textContent=text;
 function setBusy(value){busy=value;for(const control of $('application-import-panel').querySelectorAll('input,textarea,button'))if(control.id!=='application-import-close')control.disabled=value;for(const id of ['application-import-save','application-import-save-top'])$(id).textContent=value?'Importing…':'Import selected';$('application-import-save').setAttribute('aria-busy',String(value));}
 function mode(csv){const status=$('application-import-status');if(csv)$('application-csv-preview').prepend(status);else $('application-import-status-slot').append(status);$('application-posting-fields').hidden=csv;$('application-import-parse').hidden=csv;$('application-import-posting-mode').hidden=!csv;$('application-csv-preview').hidden=!csv||!rows.length;}
 $('application-import-posting-mode').onclick=()=>{mode(false);message('Paste the full job posting, then review the suggested fields.');$('application-import-text').focus();};
 function open(){const panel=$('application-import-panel');panel.hidden=false;panel.scrollIntoView({block:'start',behavior:'instant'});$('application-import-text').focus({preventScroll:true});}
 function render(){
  $('application-csv-preview').hidden=!rows.length;$('application-csv-rows').replaceChildren(...rows.map(item=>{
   const row=el('div');row.className='application-import-row';const select=el('input');select.type='checkbox';select.checked=item.selected;select.setAttribute('aria-label','Import CSV row '+item.row);select.onchange=()=>item.selected=select.checked;
   row.append(select);if(item.warnings?.length){const warning=el('p','Check before selecting this row: '+item.warnings.join(' '));warning.className='application-import-warning';row.append(warning);}for(const key of ['role','company']){const label=el('label',key==='role'?'Job title':'Company'),input=el('input');input.value=item.job[key];input.maxLength=200;input.oninput=()=>item.job[key]=input.value;label.append(input);row.append(label);}const details=el('details'),summary=el('summary','Review other imported fields');details.append(summary);for(const [key,label]of [['url','Posting link'],['status','Status'],['appliedDate','Date applied'],['interviewDate','Interview date'],['followUpDate','Follow-up date'],['contact','Contact'],['notes','Notes'],['description','Job description']])if(item.job[key])details.append(el('p',label+': '+item.job[key]));row.append(details);return row;
  }));
 }
 $('application-import-open').onclick=open;$('application-import-close').onclick=()=>{$('application-import-panel').hidden=true;};
 $('application-import-parse').onclick=()=>{try{const text=$('application-import-text').value;if(!text.trim()){message('Paste the full job posting first. If you only have a link, open it and copy the job description.');return;}api.review(parsePosting(text,$('application-import-url').value));$('application-import-panel').hidden=true;message('');}catch(error){message(error.message);}};
 $('application-import-upload').onclick=()=>$('application-import-file').click();
 $('application-import-file').onchange=async event=>{
  const file=event.target.files?.[0],token=generation,owner=api.user()?.uid,fileToken=++fileRevision;if(!file)return;if(busy){event.target.value='';return;}message('Reading your file on this device…');
  try{if(/\.csv$/i.test(file.name)){if(file.size>1024*1024)throw new Error('Choose a CSV file up to 1 MB.');const next=parseApplicationCsv(await file.text());if(token!==generation||owner!==api.user()?.uid||fileToken!==fileRevision)return;rows=next;render();mode(true);$('application-csv-preview').scrollIntoView({block:'start',behavior:'instant'});message('Review the rows below. Nothing is saved until you choose Import selected.');}
   else{const result=await importResumeFile(file);if(token!==generation||owner!==api.user()?.uid||fileToken!==fileRevision)return;mode(false);$('application-import-text').value=result.slice(0,30000);message('Posting read. Choose Review suggested fields to check it before saving.');}
  }catch(error){if(token===generation&&fileToken===fileRevision)message(error.message||'The file could not be read. Paste the posting text instead.');}finally{event.target.value='';}
 };
 $('application-import-example').onclick=()=>{const url=URL.createObjectURL(new Blob([applicationCsvExample],{type:'text/csv;charset=utf-8'})),a=el('a');a.href=url;a.download='vcp-applications-example.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
 $('application-import-save').onclick=async()=>{
  if(busy)return;if(!$('application-import-consent').checked){message('Agree to private account storage before importing.');$('application-import-consent').focus();return;}
  if(!api.user()?.email){api.signIn();return;}
  const chosen=rows.filter(r=>r.selected);if(!chosen.length){message('Select at least one row.');return;}if(chosen.some(r=>!r.job.role.trim()||!r.job.company.trim())){message('Each selected row needs a job title and company.');return;}
  const token=generation,owner=api.user()?.uid;setBusy(true);message('Checking your saved applications, then importing the selected rows…');$('career-storage-consent').checked=true;
  let count=0,duplicates=0;
  try{const existing=await api.list();if(token!==generation||owner!==api.user()?.uid)return;const keys=new Set(existing.map(applicationKey));for(const item of chosen){if(token!==generation||owner!==api.user()?.uid)return;const key=applicationKey(item.job);if(keys.has(key)){item.selected=false;duplicates++;continue;}await api.save(item.job);if(token!==generation||owner!==api.user()?.uid)return;keys.add(key);item.selected=false;count++;if(count===1||count%10===0)message('Importing applications… '+count+' saved.');}await api.refresh();if(token!==generation)return;render();message(`${count} application${count===1?'':'s'} imported${duplicates?' · '+duplicates+' duplicate'+(duplicates===1?'':'s')+' skipped':''}. Your resume files and profile are unchanged.`);}
  catch(error){if(token===generation){render();message(`${count} saved. ${error.message||'Remaining rows could not save. Retry the selected rows; saved rows are not imported twice.'}`);}}
  finally{if(token===generation){setBusy(false);}}
 };
 $('application-import-save-top').onclick=()=>$('application-import-save').click();
 return {reset(){generation++;fileRevision++;rows=[];setBusy(false);$('application-import-panel').hidden=true;$('application-import-text').value='';$('application-import-url').value='';$('application-import-consent').checked=false;$('application-import-save').disabled=false;render();mode(false);message('');}};
}
