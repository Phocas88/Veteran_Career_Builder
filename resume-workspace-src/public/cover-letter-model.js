const text=value=>typeof value==='string'?value.trim():'';
export function letterJobUrl(value){try{const u=new URL(text(value));return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&u.href.length<=2000?u.href:'';}catch{return '';}}
export function letterSource(item){const buildId=item?.buildId||item?.workspace?.buildId,design=item?.design||item?.workspace?.design;return item?.finished&&/^[a-f0-9]{64}$/.test(buildId||'')&&/^[a-z][a-z-]{0,50}$/.test(design||'')?{buildId,design}:null;}
function dateValue(value){if(value&&typeof value==='object'&&Number.isFinite(value.seconds))value=value.seconds*1000;const date=value===undefined||value===null||value===''?null:new Date(value);return date&&!Number.isNaN(date.valueOf())?date:null;}
export function letterDetails(row){
 const parts=text(row.title).split(' · '),company=text(row.company)||text(row.input?.company)||(parts.length>1?parts.at(-1):''),role=text(row.role)||text(row.input?.role)||(parts.length>1?parts.slice(0,-1).join(' · '):text(row.title))||'Cover Letter';
 const created=dateValue(row.createdAt),saved=dateValue(row.updatedAt),date=row.kind==='paid'?created||saved:saved||created;
 return {...row,company,role,companyLabel:company||'Other Saved Letters',dateValue:date?.valueOf()||0,dateLabel:date?((row.kind==='paid'&&created?'Created ':'Saved ')+new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(date)):'Date Not Recorded',jobUrl:letterJobUrl(row.jobUrl||row.input?.jobUrl)};
}
export function groupLetters(rows=[]){
 const groups=new Map();for(const item of rows){const row=letterDetails(item),key=row.company.toLocaleLowerCase();if(!groups.has(key))groups.set(key,{company:row.companyLabel,known:!!row.company,letters:[]});groups.get(key).letters.push(row);}
 return [...groups.values()].sort((a,b)=>Number(b.known)-Number(a.known)||a.company.localeCompare(b.company,undefined,{sensitivity:'base'})).map(group=>({...group,letters:group.letters.sort((a,b)=>b.dateValue-a.dateValue||a.role.localeCompare(b.role))}));
}
export function letterFileName(row={}){const d=letterDetails(row),slug=v=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65);return ['cover-letter',slug(d.company),slug(d.role),d.dateValue?new Date(d.dateValue).toISOString().slice(0,10):''].filter(Boolean).join('-');}
