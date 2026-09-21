import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'vcp-mos-data.js'),'utf8'),sandbox);
const branches=sandbox.window.VCP_MOS;
const hubs={Army:'army-mos-careers.html',Marines:'marine-corps-mos-careers.html',Navy:'navy-rate-careers.html','Air Force':'air-force-afsc-careers.html','Coast Guard':'coast-guard-rating-careers.html','Space Force':'space-force-afsc-careers.html'};
const slug=code=>code.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const errors=[]; let expected=0;
for(const [branch,entries] of Object.entries(branches)){
  const hub=fs.readFileSync(path.join(root,hubs[branch]),'utf8');
  for(const entry of entries){
    expected++;
    const rel=`mos/${slug(entry.code)}.html`, full=path.join(root,rel), expectedHref=`https://veterancareerpath.com/${rel}`;
    if(!fs.existsSync(full)){errors.push(`missing ${rel}`);continue;}
    const html=fs.readFileSync(full,'utf8');
    for(const marker of ['Your rank changes the story','Build evidence','How to use this:']) if(!html.includes(marker)) errors.push(`${rel}: missing ${marker}`);
    if(!/Civilian jobs that match|Civilian careers that fit|directions worth exploring|directions to explore/.test(html)) errors.push(`${rel}: no jobs/directions section`);
    if(!/Why it fits:/.test(html)) errors.push(`${rel}: no 'why it fits' rationale`);
    if(/http-equiv="refresh"|noindex/i.test(html)) errors.push(`${rel}: still a redirect or noindex`);
    if(!hub.includes(expectedHref)) errors.push(`${hubs[branch]}: missing ${expectedHref}`);
  }
}
if(errors.length){console.error(errors.slice(0,50).join('\n'));throw new Error(`${errors.length} MOS guide validation errors`);}
console.log(`Validated ${expected} military job-code entries across ${Object.keys(branches).length} branch hubs.`);
