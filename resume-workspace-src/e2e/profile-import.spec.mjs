import {test,expect} from '@playwright/test';import {fileURLToPath} from 'node:url';
import {installAccount,start} from './helpers/workspace.mjs';
const fixture=name=>fileURLToPath(new URL('./fixtures/'+name,import.meta.url));
const path='profiles/veteran-a/resumeProgram/background';
const text=`ALEX IMPORT EXAMPLE
import@example.com
(555) 010-1234
Austin, TX
PROFESSIONAL SUMMARY
Verified operations professional.
MILITARY SERVICE
Transport Supervisor | U.S. Army | Jan 2018 – Present
Rank: SGT
Full MOS: 88M02
ASI: 8R
• Coordinated verified schedules.
CIVILIAN EXPERIENCE
Operations Analyst | Example Employer | Feb 2020 – March 2024
• Maintained accurate records.
EDUCATION
Bachelor of Science in Information Systems | Example University
Expected 2027
CERTIFICATIONS
Example Certificate | Example Institute | Expired
TRAINING
Example Course | Example School | Completed
SKILLS
Excel, Reporting
LANGUAGES
Spanish — Intermediate
PROJECTS & VOLUNTEERING
Community Project | Volunteer Coordinator | Jan 2023 – May 2024
• Organized deliveries.`;
const field=(page,key)=>page.locator('[data-pi-field="'+key+'"]').first();
async function profileFile(page,value=text){await page.locator('#career-home-open').click();await page.locator('.profile-import-entry').evaluate(n=>n.open=true);await page.locator('#profile-import-file').setInputFiles({name:'fictional-profile.txt',mimeType:'text/plain',buffer:Buffer.from(value)});await expect(page.locator('#profile-import-dialog')).toBeVisible();await expect(page.locator('#pi-review')).toBeVisible();}
for(const name of ['resume.pdf','resume.docx','resume.txt'])test(`a successful ${name} import offers an optional section review without changing the profile`,async({page})=>{
 await installAccount(page);await start(page);await page.locator('#resume-file').setInputFiles(fixture(name));await expect(page.locator('#resume-profile-offer')).toBeVisible();expect(await page.evaluate(()=>window.__writes)).toEqual([]);await expect(page.locator('#profile-import-dialog')).not.toBeVisible();await page.locator('#resume-profile-offer-open').click();await expect(page.locator('#pi-title')).toHaveText('Personal & contact');await expect(field(page,'name')).toHaveValue('ALEX MORGAN');await expect(page.locator('#pi-step option')).toHaveCount(9);await page.locator('#pi-close').click();await expect(page.locator('#resume-input')).toHaveValue(/ALEX MORGAN/);expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});
test('approved fields update a private account section by section; skipped and unchecked fields stay unchanged',async({page,context})=>{
 await page.setViewportSize({width:360,height:800});await installAccount(page,'registered',{records:{[path]:{background:{name:'ORIGINAL EXAMPLE',phone:'Keep this phone',city:'Keep this city',jobs:[{jobTitle:'Operations Analyst',employer:'Example Employer',startDate:'2020-02',endDate:'2024-03',hours:'37.5',duties:'Old verified duty'}],roles:[{branch:'navy',title:'Keep service',includeClearance:true,clearanceLevel:'Secret'}]}}}});await page.goto('/');await profileFile(page);await expect(page.locator('.pi-existing').first()).toContainText('ORIGINAL EXAMPLE');await page.locator('[data-pi-use="phone"]').uncheck();await page.locator('[data-pi-use="city"]').uncheck();await page.locator('#pi-apply').click();await expect(page.locator('#pi-title')).toHaveText('Military service');let record=await page.evaluate(path=>window.__records[path],path);expect(record.background.name).toBe('ALEX IMPORT EXAMPLE');expect(record.background.phone).toBe('Keep this phone');expect(record.background.city).toBe('Keep this city');await page.locator('#pi-skip').click();await expect(page.locator('#pi-title')).toHaveText('Civilian & government jobs');await expect(page.locator('[data-pi-target]')).toHaveValue('0');await field(page,'duties').fill('Checked and edited duty.');await page.locator('#pi-apply').click();await expect(page.locator('#pi-title')).toHaveText('Education');record=await page.evaluate(path=>window.__records[path],path);expect(record.background.jobs).toHaveLength(1);expect(record.background.jobs[0].duties).toBe('Checked and edited duty.');expect(record.background.jobs[0].hours).toBe('37.5');expect(record.background.roles[0].branch).toBe('navy');expect(record.background.roles[0].clearanceLevel).toBe('Secret');await expect(field(page,'status')).toHaveValue('In progress');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/profile-import-mobile.png'});await page.locator('#pi-close').click();const later=await context.newPage();await installAccount(later,'registered',{records:{[path]:record}});await later.goto('/');await later.locator('#career-home-open').click();await expect(later.locator('#builder-name')).toHaveValue('ALEX IMPORT EXAMPLE');expect((await page.evaluate(()=>window.__writes)).every(w=>w.path===path)).toBe(true);
});
test('a failed save retains the approved section and retries without adding the same job twice',async({page})=>{
 await installAccount(page,'registered');await page.goto('/');await profileFile(page);await page.locator('#pi-step').selectOption('2');await page.evaluate(()=>window.__failProfileSave=true);await page.locator('#pi-apply').click();await expect(page.locator('#pi-save-retry')).toBeVisible();await expect(page.locator('#pi-status')).toContainText('account save did not finish');await expect(field(page,'jobTitle')).toBeDisabled();await page.evaluate(()=>window.__failProfileSave=false);await page.locator('#pi-save-retry').click();await expect(page.locator('#pi-title')).toHaveText('Education');const record=await page.evaluate(path=>window.__records[path],path);expect(record.background.jobs).toHaveLength(1);expect(record.background.jobs[0].jobTitle).toBe('Operations Analyst');expect(await page.evaluate(()=>window.__writes.length)).toBe(1);
});
test('guest imports stay in the session, corrections survive moving between sections, and account changes clear the source',async({page})=>{
 await installAccount(page,'guest');await page.goto('/');await profileFile(page);await field(page,'name').fill('CORRECTED EXAMPLE');await page.locator('#pi-step').selectOption('1');await page.locator('#pi-back').click();await expect(field(page,'name')).toHaveValue('CORRECTED EXAMPLE');await page.locator('#pi-apply').click();expect(await page.evaluate(()=>window.__writes)).toEqual([]);await page.locator('#pi-close').click();await expect(page.locator('#builder-name')).toHaveValue('CORRECTED EXAMPLE');await profileFile(page);await page.evaluate(()=>window.__switchAuth('different-owner'));await expect(page.locator('#profile-import-dialog')).not.toBeVisible();await expect(page.locator('#pi-source')).toBeEmpty();await expect(page.locator('#pi-entries')).toBeEmpty();expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});
test('service updates add verified qualifiers and retain rank-independent fields and existing qualifications',async({page})=>{
 await installAccount(page,'registered',{records:{[path]:{background:{roles:[{branch:'army',title:'Transport Supervisor',startDate:'2018-01',fullCode:'88M02',skillLevel:'Previously verified level',asi:[{code:'4A',desc:'Keep this qualification'}]}]}}}});await page.goto('/');await profileFile(page);await page.locator('#pi-step').selectOption('1');await expect(page.locator('[data-pi-target]')).toHaveValue('-1');await page.locator('[data-pi-target]').selectOption('0');await page.locator('#pi-apply').click();await expect(page.locator('#pi-title')).toHaveText('Civilian & government jobs');const record=await page.evaluate(path=>window.__records[path],path);expect(record.background.roles).toHaveLength(1);expect(record.background.roles[0].fullCode).toBe('88M02');expect(record.background.roles[0].skillLevel).toBe('Previously verified level');expect(record.background.roles[0].asi.map(x=>x.code)).toEqual(['4A','8R']);
});
