import {normalizeJob,safeJobUrl} from './career-model.js?v=20261025-standalone-app';
const limit=1024*1024;
const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&(amp|lt|gt|quot|nbsp);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"',nbsp:' '})[k]).replace(/[ \t]+/g,' ').trim();
const first=value=>Array.isArray(value)?value[0]:value;
export function parsePosting(text,url=''){
 if(typeof text!=='string'||text.length>30000)throw new Error('Paste a posting of up to 30,000 characters.');
 let structured;try{const value=JSON.parse(text);const list=Array.isArray(value)?value:value['@graph']||[value];structured=list.find(v=>[v['@type']].flat().includes('JobPosting'));}catch{}
 const source=text.replace(/\r/g,'').trim(),lines=source.split('\n').map(s=>s.trim()).filter(Boolean);
 const labeled=labels=>{const re=new RegExp('^(?:'+labels+')\\s*[:\\t]\\s*(.+)$','i');for(const line of lines){const m=line.match(re);if(m)return m[1];}return '';};
 const combined=lines[0]?.match(/^(.{2,180}?)\s+at\s+(.{2,180})$/i);
 const link=safeJobUrl(url)||safeJobUrl(structured?.url)||safeJobUrl(source.match(/https?:\/\/[^\s<>"']+/)?.[0]||'');
 const employer=typeof structured?.hiringOrganization==='string'?structured.hiringOrganization:structured?.hiringOrganization?.name;
 const description=plain(structured?.description)||source;if(description.length>8000)throw new Error('This posting exceeds 8,000 characters. Shorten it to the relevant job requirements, then review again.');
 return normalizeJob({role:plain(structured?.title)||labeled('job title|position title|role|position')||combined?.[1]||'',company:plain(employer)||labeled('company|employer|organization|agency|department')||combined?.[2]||'',url:link,description,contact:labeled('recruiter|contact|hiring contact'),applicationType:/https?:\/\/(?:www\.)?usajobs\.gov\b/i.test(link)||/\b(?:GS-\d|federal government|USAJOBS)\b/i.test(source)?'federal':'private'});
}
export function csvRows(source){
 if(typeof source!=='string'||source.length>limit)throw new Error('Choose a CSV file up to 1 MB.');
 source=source.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<source.length;i++){
  const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell)quoted=!quoted;else cell+=c;}
  else if(c===','&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(s=>s.trim()))rows.push(row);row=[];cell='';}
  else cell+=c;
  if(rows.length>200)throw new Error('Import up to 200 applications at a time.');
 }
 if(quoted)throw new Error('The CSV has an unclosed quote. Export a fresh CSV and try again.');row.push(cell);if(row.some(s=>s.trim()))rows.push(row);return rows;
}
const aliases={role:['role','title','jobtitle','position','positiontitle'],company:['company','employer','organization','agency','department'],url:['url','link','joburl','postingurl','joblink'],description:['description','jobdescription','posting','jobposting'],status:['status','stage','applicationstatus'],appliedDate:['applieddate','dateapplied','applicationdate'],interviewDate:['interviewdate'],followUpDate:['followupdate'],contact:['contact','recruiter','hiringcontact'],notes:['notes','note'],applicationType:['applicationtype','type']};
export function parseApplicationCsv(source){
 const rows=csvRows(source),headers=rows.shift()?.map(s=>s.toLowerCase().replace(/[^a-z0-9]/g,''))||[];
 const map=Object.fromEntries(Object.entries(aliases).map(([field,names])=>[field,headers.findIndex(h=>names.includes(h))]));
 if(map.role<0||map.company<0)throw new Error('The CSV needs Job title and Company columns. Download the sample CSV to see supported columns.');
 if(!rows.length)throw new Error('The CSV has no application rows.');
 return rows.map((row,index)=>{const raw=Object.fromEntries(Object.entries(map).filter(([,i])=>i>=0).map(([k,i])=>[k,row[i]||'']));raw.status=({saved:'Saved',preparing:'Preparing',applied:'Applied',interview:'Interview',interviewing:'Interview',offer:'Offer',closed:'Closed',rejected:'Closed',withdrawn:'Closed'})[raw.status?.toLowerCase()]||'Saved';
 for(const key of ['appliedDate','interviewDate','followUpDate']){const match=raw[key]?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(match)raw[key]=match[3]+'-'+match[1].padStart(2,'0')+'-'+match[2].padStart(2,'0');}
 const job=normalizeJob(raw),warnings=[];for(const key of ['appliedDate','interviewDate','followUpDate'])if(raw[key]&&!job[key])warnings.push('A '+key.replace(/([A-Z])/g,' $1').toLowerCase()+' could not be read and will be left blank.');if(raw.url&&!job.url)warnings.push('The posting link is not a valid HTTP or HTTPS address and will be left blank.');for(const key of ['description','notes','role','company'])if(raw[key]&&raw[key].trim().length>job[key].length)warnings.push(key+' exceeds the supported length; review the shortened value.');
 return {row:index+2,selected:!warnings.length&&!!job.role&&!!job.company,job,warnings};});
}
export function applicationKey(job){return job.url?'url:'+job.url.replace(/\/$/,''):[job.company,job.role,job.appliedDate||''].map(v=>v.trim().toLowerCase()).join('|');}
export const applicationCsvExample='Job title,Company,URL,Status,Date applied,Contact,Notes\nOperations Coordinator,Example Company,https://example.com/jobs/123,Saved,,Recruiting team,"Review requirements, then apply"\n';
