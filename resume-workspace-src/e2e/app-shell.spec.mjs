import {test,expect} from '@playwright/test';
import {installAccount,selectProfileSection} from './helpers/workspace.mjs';
async function guestHome(page){await installAccount(page);await page.goto('/');await page.locator('#welcome-guest').click();}
const appRoute=(page,name)=>page.locator('[data-app-route="'+name+'"]');
test('compact home shows both starting choices on a narrow phone with a single app navigation',async({page})=>{
 await page.setViewportSize({width:360,height:800});await guestHome(page);
 await expect(page.locator('#home-panel')).toBeVisible();await expect(page.locator('.app-nav button')).toHaveCount(5);
 for(const id of ['choose-build','choose-import']){const b=await page.locator('#'+id).boundingBox();expect(b.y+b.height).toBeLessThan(700);expect(b.width).toBeGreaterThan(280);}
 await expect(page.locator('.app-price')).toContainText('$1.99');await expect(page.locator('#choose-import')).toContainText('PDF, Word (.docx) or text');
 await expect(page.locator('.site-navigation,.main-footer,.career-entry,.price-banner,.sidebar')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/app-home-mobile.png'});
});
test('primary destinations are normal screens and browser Back restores the last screen',async({page})=>{
 await guestHome(page);
 for(const [route,title,view] of [['profile','My profile','profile'],['applications','Applications','applications'],['library','Service library','library'],['resumes','My resumes','versions']]){
  await appRoute(page,route).click();await expect(page.locator('#career-title')).toHaveText(title);await expect(appRoute(page,route)).toHaveAttribute('aria-current','page');await expect(page.locator('#home-panel')).toBeHidden();await expect(page.locator('#document-workspace')).toBeHidden();await expect(page.locator('#career-dialog')).toBeVisible();await expect(page.locator('dialog#career-dialog')).toHaveCount(0);await expect(page).toHaveURL(new RegExp('#'+view+'$'));
 }
 await page.goBack();await expect(page.locator('#career-title')).toHaveText('Service library');await appRoute(page,'home').click();await expect(page.locator('#home-panel')).toBeVisible();await expect(page.locator('#career-dialog')).toBeHidden();
});
test('profile sections preserve service and contact entries across navigation without cloud writes',async({page})=>{
 await guestHome(page);await appRoute(page,'profile').click();await page.locator('#builder-name').fill('EXAMPLE VETERAN');
 await selectProfileSection(page,'roles');await expect(page.locator('#builder-personal')).toBeHidden();const role=page.locator('#service-roles > fieldset').first();await role.locator(':scope > label > [data-key="branch"]').selectOption('army');await role.locator(':scope > label > [data-key="fullCode"]').fill('88M02');
 await appRoute(page,'library').click();await appRoute(page,'profile').click();await expect(role.locator('[data-key="fullCode"]')).toHaveValue('88M02');await selectProfileSection(page,'personal');await expect(page.locator('#builder-name')).toHaveValue('EXAMPLE VETERAN');expect(await page.evaluate(()=>window.__writes)).toEqual([]);
 await page.screenshot({path:'/tmp/app-profile-mobile.png'});
});
test('new builds pay before entry and the unlocked workflow has no website marketing',async({page})=>{
 await guestHome(page);await page.locator('#choose-import').click();await expect(page.locator('#flow-payment')).toBeVisible();await expect(page.locator('#flow-edit')).toBeHidden();await expect(page.locator('#home-panel')).toBeHidden();await expect(page.locator('.steps')).toBeHidden();
 await page.locator('#upfront-consent').check();await page.locator('#purchase-start').click();await expect(page.locator('#flow-edit')).toBeVisible();await expect(page.locator('.steps')).toBeVisible();await expect(page.locator('#import-resume')).toBeVisible();
 await expect(page.locator('#file-help')).toContainText('.pdf');await expect(page.locator('#file-help')).toContainText('.docx');await expect(page.locator('#file-help')).toContainText('.txt');
 await expect(page.locator('#opsec-notice')).toBeVisible();await expect(page.locator('.home-how')).toBeHidden();await expect(page.locator('.app-price')).toBeHidden();
 await page.screenshot({path:'/tmp/app-import-mobile.png'});
});
test('settings keeps account, purchase, legal and storage controls out of the working screens',async({page})=>{
 await guestHome(page);await page.locator('#app-settings').click();await expect(page.locator('#settings-title')).toContainText('Settings');await expect(page.locator('#home-panel')).toBeHidden();
 for(const href of ['./privacy.html','./terms.html','./cookies.html'])await expect(page.locator('#settings-panel a[href="'+href+'"]').first()).toBeVisible();
 await page.locator('#cookie-settings').click();await expect(page.locator('#storage-dialog')).toBeVisible();await expect(page.locator('#storage-dialog')).toContainText('OpenAI and Anthropic');await page.locator('#storage-close').click();
 await page.locator('#settings-purchases').click();await expect(page.locator('#account-dialog')).toBeVisible();await expect(page.locator('#purchase-history')).toHaveAttribute('open','');
});
test('desktop has horizontal app navigation and direct Library links reopen correctly',async({page})=>{
 await installAccount(page,'registered');await page.setViewportSize({width:1440,height:960});await page.goto('/#library');await expect(page.locator('#career-title')).toHaveText('Service library');await expect(page.locator('#library-results .library-result').first()).toBeVisible();
 await expect(page.locator('.app-nav')).toBeVisible();const nav=await page.locator('.app-nav').boundingBox();expect(nav.width).toBe(1440);expect(nav.height).toBeLessThan(100);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/app-library-desktop.png'});
});

test('application entry opens on demand, can be cancelled, and does not save without an explicit action',async({page})=>{
 await guestHome(page);await appRoute(page,'applications').click();await expect(page.locator('#career-job-form')).toBeHidden();await page.locator('#career-job-new').click();await page.locator('[name="role"]').fill('Example role');await page.locator('#career-job-cancel').click();await expect(page.locator('#career-job-form')).toBeHidden();await page.locator('#career-job-new').click();await expect(page.locator('[name="role"]')).toHaveValue('');expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});
