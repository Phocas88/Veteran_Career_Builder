import {navigateApp} from './helpers/workspace.mjs';
import {test,expect} from '@playwright/test';
import {agreeCloudSaving,selectProfileSection,installAccount} from './helpers/workspace.mjs';
async function library(page,account='none'){
 await installAccount(page,account);await page.goto('/');if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();await navigateApp(page,'library');await page.locator('[data-library-branch="army"]').click();await page.locator('#library-choose-specialty').click();await page.locator('#library-change-filters').evaluate(n=>n.open=true);await expect(page.locator('#library-results .library-result').first()).toBeVisible();
}
test('service library includes all website branches, qualifications, conflict flags and branch-correct guide links',async({page})=>{
 const calls=[];page.on('request',r=>{if(r.url().includes('/api/claude'))calls.push(r.postDataJSON());});await library(page);
 const r=await page.request.get('/service-library-data.json'),data=await r.json();expect(Object.keys(data.branches)).toHaveLength(6);
 for(const branch of Object.keys(data.branches))for(const kind of ['specialty','qualification','designator'])expect(data.entries.some(e=>e.branch===branch&&e.kind===kind)).toBe(true);
 expect(data.entries.find(e=>e.branch==='navy'&&e.kind==='specialty'&&e.code==='BM').guide).toMatch(/\/mos\/navy-bm.html$/);
 expect(data.entries.find(e=>e.branch==='coastguard'&&e.kind==='specialty'&&e.code==='BM').guide).toMatch(/\/mos\/bm.html$/);
 expect(data.entries.some(e=>e.kind==='qualification'&&e.ambiguous)).toBe(true);await expect(page.locator('#career-storage')).toBeHidden();
 await page.locator('#library-search').fill('92Y');await expect(page.locator('#library-results')).toContainText('Supply');expect(calls.some(c=>['purchase','run','career'].includes(c.action))).toBe(false);
});
test('verified library selection adds only the chosen service fields and saves only on explicit account action',async({page})=>{
 await library(page,'registered');await page.locator('#library-search').fill('92Y');await page.locator('#library-results .library-result').first().click();await expect(page.locator('#library-apply')).toBeDisabled();
 await page.locator('#library-reference-details').evaluate(n=>n.open=true);await expect(page.locator('#library-detail-body')).toContainText('Civilian directions');await page.locator('#library-reference-details').evaluate(n=>n.open=false);
 await page.locator('#library-confirm').check();await page.locator('#library-apply').click();await expect(page.locator('#library-status')).toContainText('Added to your draft');expect(await page.evaluate(()=>window.__writes)).toEqual([]);
 await page.locator('#library-view-profile').click();await expect(page.locator('[data-career-panel="profile"]')).toBeVisible();const values=await page.locator('#service-roles > fieldset').first().locator(':scope > label > [data-key]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.key,n.value])));expect(values.code).toBe('92Y');expect(values.duties).toBe('');expect(values.achievements).toBe('');
 await agreeCloudSaving(page);await page.locator('#profile-save-bottom').click();await expect(page.locator('#career-status')).toContainText('profile saved');const writes=await page.evaluate(()=>window.__writes);expect(writes).toHaveLength(1);expect(writes[0].data.background.roles[0].code).toBe('92Y');
});
test('qualifications stay branch-specific, additions remain in profile and empty search offers manual entry',async({page})=>{
 await library(page);await page.locator('#library-branch').selectOption('navy');await page.locator('#library-kind').selectOption('qualification');await expect(page.locator('#library-kind')).toHaveValue('qualification');await expect(page.locator('#library-count')).toContainText('Navy');
 const label=await page.locator('#library-results .library-result').first().textContent();expect(label).toContain('Navy');await page.locator('#library-results .library-result').first().click();await page.locator('#library-confirm').check();await page.locator('#library-apply').click();await page.locator('#library-view-profile').click();
 expect(await page.locator('#service-roles [data-key="branch"]').first().inputValue()).toBe('navy');await navigateApp(page,'library');await page.locator('#library-search').fill('no such qualification xyz');await expect(page.locator('#library-empty')).toBeVisible();await page.locator('#library-manual').click();await expect(page.locator('[data-career-panel="profile"]')).toBeVisible();
});
test('grouped menus and paginated references fit a narrow phone and clear private selections on account switch',async({page})=>{
 await page.setViewportSize({width:360,height:800});const errors=[];page.on('pageerror',e=>errors.push(e.message));await library(page,'registered');await expect(page.locator('.app-nav [data-app-route]:visible')).toHaveCount(9);await expect(page.locator('#library-results .library-result')).toHaveCount(20);await page.locator('#library-more').click();await expect(page.locator('#library-results .library-result')).toHaveCount(40);
 expect(await page.locator('#career-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);await page.locator('#library-search').fill('92Y');await page.locator('#library-results .library-result').first().click();await page.locator('#library-use-title').fill('Private draft description');await page.evaluate(()=>window.__switchAuth('other-account'));await expect(page.locator('#career-dialog')).not.toBeVisible();expect(await page.locator('#library-use-title').inputValue()).toBe('');expect(errors).toEqual([]);
});
