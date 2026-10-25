import {test,expect} from '@playwright/test';
import {installAccount,start} from './helpers/workspace.mjs';
const source='EXAMPLE TEMPLATE APPLICANT\nexample@example.com · 202-555-0144\n\nEXPERIENCE\nCoordinator | Example Employer | Jan 2020 – Dec 2024\nHours per week: 40\n• Maintained verified schedules and equipment records.\n\nEDUCATION\nExample College · Business Certificate · Completed 2019';
async function openStudio(page,type='private'){
 await installAccount(page,'registered');await start(page);await page.locator('#resume-input').fill(source);
 if(type!=='private'){await page.locator('#next-job').click();await page.locator('#application-type').selectOption(type);}
 await page.locator('.steps [data-tab="export"]').click();await page.locator('#template-library').evaluate(n=>n.open=true);
}
const radio=(page,key)=>page.locator('[name="resume-design"][value="'+key+'"]');
const choose=(page,key)=>radio(page,key).locator('..').click();
test('selecting federal keeps all themes browsable and repeatedly switching styles never traps the user',async({page})=>{
 await page.setViewportSize({width:360,height:800});const purchases=[];page.on('request',request=>{if(request.url().endsWith('/api/claude')&&request.postDataJSON()?.action==='purchase')purchases.push(request);});
 await openStudio(page);await choose(page,'federal');await expect(page.locator('#application-type')).toHaveValue('federal');await expect(page.locator('#template-category')).toHaveValue('');await expect(page.locator('#design-gallery > label:visible')).toHaveCount(24);
 for(const key of ['modern','classic','federal-experience','creative','federal-concise','modern']){await expect(radio(page,key)).toBeEnabled();await choose(page,key);await expect(radio(page,key)).toBeChecked();await expect(page.locator('#application-type')).toHaveValue(key.startsWith('federal')?'federal':'private');await expect(page.locator('#template-category')).toHaveValue('');}
 await expect(page.locator('#preview-label')).toContainText('Modern');await expect(page.locator('#resume-input')).toHaveValue(source);expect(purchases).toHaveLength(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('federal mode can preview other themes and explicitly apply one without changing the resume text',async({page})=>{
 await openStudio(page);await choose(page,'federal');await page.locator('[data-preview-template="modern"]').click();await expect(page.locator('#template-example-title')).toContainText('Modern');await expect(page.locator('#template-example-use')).toBeEnabled();await expect(page.locator('#template-example-use')).toContainText('switch to civilian');await expect(page.locator('#application-type')).toHaveValue('federal');await expect(radio(page,'federal')).toBeChecked();await page.locator('#template-example-use').click();await expect(radio(page,'modern')).toBeChecked();await expect(page.locator('#application-type')).toHaveValue('private');await expect(page.locator('#preview-label')).toContainText('Modern');
 await page.locator('[data-preview-template="federal"]').click();await expect(page.locator('#application-type')).toHaveValue('private');await page.locator('#template-example-use').click();await expect(page.locator('#application-type')).toHaveValue('federal');await page.locator('[data-studio-tab="format"]').click();await expect(page.locator('#resume-paper')).toBeDisabled();await expect(page.locator('#format-color')).toBeDisabled();await expect(page.locator('#resume-photo-input')).toBeDisabled();await expect(page.locator('#resume-input')).toHaveValue(source);
});
test('returning from federal restores state/local mode and leaves explicit gallery filters under user control',async({page})=>{
 await openStudio(page,'government');await choose(page,'federal');await expect(page.locator('#application-type')).toHaveValue('federal');await page.locator('#template-category').selectOption('photo');await expect(page.locator('#design-gallery > label:visible')).toHaveCount(2);await choose(page,'creative');await expect(page.locator('#application-type')).toHaveValue('government');await expect(page.locator('#template-category')).toHaveValue('photo');await expect(page.locator('#resume-photo-upload')).toBeEnabled();await page.locator('#template-category').selectOption('');await expect(page.locator('#design-gallery > label:visible')).toHaveCount(24);
});
