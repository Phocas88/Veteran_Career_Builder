import {test,expect} from '@playwright/test';
import {installAccount,start,checkout,agreements,expandBackground,paidResponse,unlockEntry} from './helpers/workspace.mjs';
import {fileURLToPath} from 'node:url';
const resume='ALEX EXAMPLE\nMILITARY EXPERIENCE\nSupply specialist\nU.S. Navy\nMaintained accurate equipment records, coordinated deliveries and trained colleagues on inventory processes.';
const review={score:75,summary:'Use clearer civilian wording.',strengths:[],suggestions:[],findings:[],revisedResume:resume,rewriteNotes:[],nextSteps:[]};
test('first visit explains account benefits and offers sign-in or a usable guest path',async({page})=>{
 await installAccount(page);await page.goto('/');await expect(page.locator('#welcome-dialog')).toBeVisible();
 for(const text of ['Save the resume','update it or build another','any device','$1.99'])await expect(page.locator('#welcome-dialog')).toContainText(text);
 await page.locator('#welcome-guest').click();await expect(page.locator('#welcome-dialog')).not.toBeVisible();await expect(page.locator('#resume-start')).toBeVisible();await expect(page.locator('#account-label')).toHaveText('Save progress');
 await page.reload();await expect(page.locator('#welcome-dialog')).not.toBeVisible();
 expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});
test('account creation uses one clear form and returns users to their preserved draft',async({page})=>{
 await installAccount(page);await page.goto('/');await page.locator('#welcome-create').click();await expect(page.locator('#auth-title')).toHaveText('Create your free account');
 await page.locator('#auth-email').fill('fictional@example.com');await page.locator('#auth-password').fill('FixtureOnlyPassword123!');await page.locator('#account-terms').check();await page.locator('#auth-submit').click();await expect(page.locator('#account-label')).toHaveText('My resumes');await expect(page.locator('#welcome-dialog')).not.toBeVisible();
});
test('returning signed-in users bypass onboarding and can reopen their stored resume',async({page})=>{
 await installAccount(page,'registered');await start(page);await expect(page.locator('#account-label')).toHaveText('My resumes');await page.locator('#resume-input').fill(resume);await page.locator('#save-progress').click();await page.locator('#cloud-consent').check();await page.locator('#save-title').fill('My operations resume');await page.locator('#save-cloud').click();await expect(page.locator('#cloud-status')).toContainText('Resume saved');
 const writes=await page.evaluate(()=>window.__writes);expect(writes[0].path).toBe('profiles/veteran-a/resumeProgramResumes/saved-new');
 await page.locator('#account-close').click();await page.locator('#resume-input').fill('');await page.locator('#account-open').click();await page.locator('#saved-resumes button').filter({hasText:'Open'}).click();await expect(page.locator('#resume-input')).toHaveValue(resume);await expect(page.locator('#account-dialog')).not.toBeVisible();
});
test('guest checkout uses a private browser identity without requiring email signup or a membership',async({page})=>{
 await installAccount(page);const requests=[];await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();requests.push({body,headers:route.request().headers()});return route.fulfill({json:body.action==='guest'?{token:'fixture-custom-token'}:paidResponse(body)||(body.action==='run'?{review}:{builds:[]})});});
 await start(page);await page.locator('#resume-input').fill(resume);await checkout(page);await page.locator('#review-button').click();await expect(page.locator('#error-message')).toContainText('Agree to sending');expect(requests.filter(r=>r.body.action==='run')).toHaveLength(0);
 await page.locator('#ai-consent').check();await page.locator('#review-button').click();await expect(page.locator('#error-message')).toContainText('purchase recovery');
 await page.locator('#purchase-consent').check();await page.locator('#review-button').click();await expect(page.locator('#review-summary')).toHaveText(review.summary);
 expect(requests.filter(r=>r.body.action==='guest')).toHaveLength(1);const prepared=requests.find(r=>r.body.action==='purchase');expect(prepared.headers['x-vcp-firebase-token']).toBe('firebase-resumeGuest_fixture');expect(prepared.headers.authorization).toBeUndefined();expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});
test('creating an account from a guest keeps its identity and current resume',async({page})=>{
 await installAccount(page,'guest');await start(page);await page.locator('#resume-input').fill(resume);await page.locator('#account-open').click();await expect(page.locator('#auth-title')).toHaveText('Create your free account');await page.locator('#auth-email').fill('fictional-new@example.com');await page.locator('#auth-password').fill('FixtureOnlyPassword123!');await page.locator('#account-terms').check();await page.locator('#auth-submit').click();await expect(page.locator('#account-label')).toHaveText('My resumes');await expect(page.locator('#resume-input')).toHaveValue(resume);expect(await page.evaluate(()=>window.firebase.apps[0].auth().currentUser.uid)).toBe('resumeGuest_fixture');
});
test('account users can explicitly save the exact resume they submit for review',async({page})=>{
 await installAccount(page,'registered');await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review}:{builds:[]})});});await start(page);await page.locator('#resume-input').fill(resume);await checkout(page);await agreements(page);await page.locator('#save-submitted').check();await page.locator('#review-button').click();await expect(page.locator('#review-summary')).toHaveText(review.summary);const writes=await page.evaluate(()=>window.__writes);expect(writes).toHaveLength(1);expect(writes[0].data.content).toBe(resume);
});
test('successful checkout return verifies and builds automatically without a second payment or checkbox puzzle',async({page})=>{
 await installAccount(page,'registered');let calls=0;const id='c'.repeat(64);await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();if(body.action==='run')calls++;return route.fulfill({json:body.action==='list'?{builds:[]}:['get','verify'].includes(body.action)?{id,status:'paid',input:{resume},review:null}:{review}});});await page.goto('/?build='+id+'&checkout=success');await expect(page.locator('#review-summary')).toHaveText(review.summary);expect(calls).toBe(1);await expect(page.locator('#welcome-dialog')).not.toBeVisible();
});
test('checkout explains where to redeem a free code and history shows the verified discounted price',async({page})=>{
 await installAccount(page,'registered');
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();return route.fulfill({json:paidResponse(body)||{builds:[
  {id:'d'.repeat(64),createdAt:Date.now(),status:'complete',amount:0,discountAmount:199},
  {id:'e'.repeat(64),createdAt:Date.now(),status:'complete',amount:100,discountAmount:99},
  {id:'f'.repeat(64),createdAt:Date.now(),status:'complete',amount:199,discountAmount:0}
 ]}});} );
 await start(page);await page.locator('#resume-input').fill(resume);await checkout(page);
 await expect(page.locator('#checkout-promo-note')).toContainText('Add promotion code');
 await expect(page.locator('#checkout-promo-note')).toContainText('no card required');
 await page.locator('#account-open').click();await page.locator('#purchase-history').evaluate(el=>el.open=true);
 await expect(page.locator('#purchase-list li')).toHaveCount(3);
 await expect(page.locator('#purchase-list li').nth(0)).toContainText('Free · promo code');
 await expect(page.locator('#purchase-list li').nth(1)).toContainText('$1.00');
 await expect(page.locator('#purchase-list li').nth(2)).toContainText('$1.99');
});
test('a free checkout return builds automatically and restores the same result without purchasing twice',async({page})=>{
 await installAccount(page,'registered');let executions=0,prepares=0;const id='a'.repeat(64);
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();if(body.action==='prepare')prepares++;if(body.action==='run')executions++;return route.fulfill({json:body.action==='list'?{builds:[]} : ['get','verify'].includes(body.action)?{id,status:body.action==='verify'?'paid':'awaiting_payment',amount:0,discountAmount:199,input:{resume},review:null}:{id,review}});});
 await page.goto('/?build='+id+'&checkout=success');await expect(page.locator('#review-summary')).toHaveText(review.summary);
 expect(executions).toBe(1);expect(prepares).toBe(0);
});
test('switching accounts clears the previous resume, background and device copy',async({page})=>{
 await installAccount(page,'registered');await start(page,'build');await page.locator('#builder-name').fill('ALEX PRIVATE');await page.evaluate(async()=>{const {setFlow}=await import('/guided-flow.js?v=20261019-clarifications');setFlow('edit');});await page.locator('#resume-paste-mode').click();await page.locator('#resume-input').fill(resume);await page.locator('#remember-draft').check();await page.evaluate(()=>window.__switchAuth('veteran-b'));await expect(page.locator('#resume-input')).toHaveValue('');await expect(page.locator('#builder-name')).toHaveValue('');expect(await page.evaluate(()=>localStorage.getItem('resume-studio-draft-v1'))).toBeNull();
});
test('an import finishing after an account change cannot restore another account data',async({page})=>{
 await installAccount(page,'registered');await start(page);let begin,release;const started=new Promise(r=>begin=r),gate=new Promise(r=>release=r);await page.route('**/vendor/mammoth.mjs',async route=>{begin();await gate;await route.fulfill({response:await page.request.get('http://127.0.0.1:3000/vendor/mammoth.mjs')});});await page.locator('#resume-file').setInputFiles(fileURLToPath(new URL('./fixtures/resume.docx',import.meta.url)));await started;await page.evaluate(()=>window.__switchAuth('veteran-b'));release();await expect(page.locator('#import-resume')).toBeEnabled();await expect(page.locator('#resume-input')).toHaveValue('');
});
test('all branch-specific dropdowns and manual historical ranks remain usable in the guided builder',async({page})=>{
 const {branchCatalog}=await import('../public/branch-catalog.js');await installAccount(page);await start(page,'build');await page.locator('#builder-name').fill('ALEX FICTIONAL');const service=page.locator('#service-roles > fieldset').first();page.on('dialog',d=>d.accept());
 for(const [branch,catalog]of Object.entries(branchCatalog)){
  await service.locator('[data-key="branch"]').selectOption(branch);const rank=catalog.ranks.enlisted[1];await service.locator('[data-key="rank"]').selectOption(rank.abbr);await expect(service.locator('[data-key="payGrade"]')).toHaveValue(rank.grade);const specialty=catalog.specialties[0];await service.locator('[data-library="specialties"]').selectOption(specialty.code);await expect(service.locator('[data-key="mosTitle"]')).toHaveValue(specialty.title);
  const group=service.locator(':scope > [data-group="asi"]');if(!await group.evaluate(el=>el.open))await group.locator(':scope > summary').click();await group.locator(':scope > button').click();await group.locator('[data-library="qualifications"]').last().selectOption(catalog.qualifications.items[0].code);await expect(group.locator('[data-key="desc"]').last()).toHaveValue(catalog.qualifications.items[0].desc);
 }
 await service.locator('[data-key="rank"]').selectOption('__custom__');await service.locator('[data-rank-custom]').fill('Historical rank as recorded');await service.locator(':scope > label > [data-key="duties"]').fill('Maintained equipment records and trained colleagues.');await page.locator('#build-draft').click();await expect(page.locator('#resume-input')).toHaveValue(/Historical rank as recorded/);
});
test('the form reveals one coherent step at a time, with pricing and readable export choices',async({page})=>{
 await installAccount(page);await start(page);await expect(page.locator('#flow-edit')).toBeVisible();await expect(page.locator('#flow-job')).not.toBeVisible();await expect(page.locator('#final-build-step')).not.toBeVisible();await page.locator('#resume-input').fill(resume);await page.locator('#next-job').click();await expect(page.locator('#flow-edit')).not.toBeVisible();await expect(page.locator('#flow-job')).toBeVisible();await page.locator('#next-checkout').click();await expect(page.locator('#final-build-step')).toBeVisible();await expect(page.locator('#flow-job')).not.toBeVisible();await expect(page.locator('.price-banner')).toContainText('$1.99 / resume build');await expect(page.locator('#sample-top,#sample-empty')).toHaveCount(0);
 await page.locator('.mobile-nav [data-tab="export"]').click();const colors=await page.locator('.design-option strong').first().evaluate(el=>({ink:getComputedStyle(el).color,paper:getComputedStyle(el.closest('label')).backgroundColor}));expect(colors.ink).toBe('rgb(255, 255, 255)');expect(colors.paper).not.toBe('rgb(255, 255, 255)');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('remembered resumes restore only after the matching account signs in',async({page})=>{
 await installAccount(page,'registered');await page.addInitScript(()=>localStorage.setItem('resume-studio-draft-v1',JSON.stringify({ownerUid:'veteran-a',resume:'ALEX OWNED DRAFT\nVerified records and service experience.'})));await page.goto('/');await expect(page.locator('#resume-input')).toHaveValue('ALEX OWNED DRAFT\nVerified records and service experience.');await expect(page.locator('#flow-payment')).toBeVisible();
});
test('a remembered resume from another account is never displayed',async({page})=>{
 await installAccount(page,'registered');await page.addInitScript(()=>localStorage.setItem('resume-studio-draft-v1',JSON.stringify({ownerUid:'veteran-b',resume:'PRIVATE OTHER ACCOUNT'})));await page.goto('/');await expect(page.locator('#resume-input')).toHaveValue('');expect(await page.locator('body').textContent()).not.toContain('PRIVATE OTHER ACCOUNT');
});

test('builder shows icon category menus and keeps entered facts when sections close',async({page})=>{
 await installAccount(page);await page.goto('/');await page.locator('#welcome-guest').click();await page.locator('#choose-build').click();await unlockEntry(page);
 const categories=page.locator('#background-fields > .resume-category');await expect(categories).toHaveCount(9);
 expect(await categories.evaluateAll(nodes=>nodes.every(n=>!n.open))).toBe(true);expect(await page.evaluate(()=>document.activeElement.id)).not.toBe('builder-name');
 await expect(page.locator('#background-fields > .resume-category > summary > .category-icon > svg')).toHaveCount(9);await expect(page.locator('#background-fields .resume-category img')).toHaveCount(0);
 const personal=page.locator('#background-fields > .personal-category');await personal.locator(':scope > summary').click();await page.locator('#builder-name').fill('ALEX EXAMPLE');await personal.locator(':scope > summary').click();
 const serviceMenu=page.locator('#background-fields > [data-group="roles"]');await serviceMenu.locator(':scope > summary').click();const service=page.locator('#service-roles > fieldset').first();await service.locator('[data-key="branch"]').selectOption('army');await service.locator(':scope > label > [data-key="duties"]').fill('Maintained accurate equipment records and trained colleagues on inventory procedures.');
 for(const key of ['mosRoles','asi','sqi','additionalDuties','awards','deployments'])await expect(service.locator(':scope > [data-group="'+key+'"] > summary > .category-icon > svg')).toHaveCount(1);
 const positions=service.locator(':scope > [data-group="mosRoles"]');await positions.locator(':scope > summary').click();await positions.locator(':scope > button').click();await positions.locator('[data-key="title"]').fill('Warehouse team lead');await positions.locator(':scope > summary').click();await serviceMenu.locator(':scope > summary').click();
 await page.locator('#build-draft').click();await expect(page.locator('#resume-input')).toHaveValue(/ALEX EXAMPLE/);await expect(page.locator('#resume-input')).toHaveValue(/Warehouse team lead/);await expect(page.locator('#resume-input')).toHaveValue(/Maintained accurate equipment records/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
