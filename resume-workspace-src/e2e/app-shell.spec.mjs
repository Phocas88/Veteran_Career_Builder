import {navigateApp} from './helpers/workspace.mjs';
import {test,expect} from '@playwright/test';
import {installAccount,selectProfileSection} from './helpers/workspace.mjs';
async function guestHome(page){await installAccount(page);await page.goto('/');await page.locator('#welcome-guest').click();}
const appRoute=(page,name)=>page.locator('[data-app-route="'+name+'"]');
test('compact home shows both starting choices on a narrow phone with a single app navigation',async({page})=>{
 await page.setViewportSize({width:360,height:800});await guestHome(page);
 await expect(page.locator('#home-panel')).toBeVisible();await expect(page.locator('.app-nav button:visible')).toHaveCount(9);
 for(const id of ['choose-build','choose-import']){const b=await page.locator('#'+id).boundingBox();expect(b.y+b.height).toBeLessThan(700);expect(b.width).toBeGreaterThan(280);}
 await expect(page.locator('.app-price')).toContainText('$1.99');await expect(page.locator('#choose-import')).toContainText('PDF, Word (.docx) or TXT');
 await expect(page.locator('.site-navigation,.main-footer,.career-entry,.price-banner,.sidebar')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/app-home-mobile.png'});
});
test('primary destinations are normal screens and browser Back restores the last screen',async({page})=>{
 await guestHome(page);
 for(const [route,title,view] of [['digital-cv','Virtual CV','digital-cv'],['profile','My profile','profile'],['applications','Applications','applications'],['library','Service library','library'],['resumes','My resumes','versions']]){
  await navigateApp(page,route);await expect(page.locator('#career-title')).toHaveText(title);await expect(appRoute(page,route)).toHaveAttribute('aria-current','page');await expect(page.locator('#home-panel')).toBeHidden();await expect(page.locator('#document-workspace')).toBeHidden();await expect(page.locator('#career-dialog')).toBeVisible();await expect(page.locator('dialog#career-dialog')).toHaveCount(0);await expect(page).toHaveURL(new RegExp('#'+view+'$'));
 }
 await page.goBack();await expect(page.locator('#career-title')).toHaveText('Service library');await navigateApp(page,'home');await expect(page.locator('#home-panel')).toBeVisible();await expect(page.locator('#career-dialog')).toBeHidden();
});
test('profile sections preserve service and contact entries across navigation without cloud writes',async({page})=>{
 await guestHome(page);await navigateApp(page,'profile');await page.locator('#builder-name').fill('EXAMPLE VETERAN');
 await selectProfileSection(page,'roles');await expect(page.locator('#builder-personal')).toBeHidden();const role=page.locator('#service-roles > fieldset').first();await role.locator(':scope > label > [data-key="branch"]').selectOption('army');await role.locator(':scope > label > [data-key="fullCode"]').fill('88M02');
 await navigateApp(page,'library');await navigateApp(page,'profile');await expect(role.locator('[data-key="fullCode"]')).toHaveValue('88M02');await selectProfileSection(page,'personal');await expect(page.locator('#builder-name')).toHaveValue('EXAMPLE VETERAN');expect(await page.evaluate(()=>window.__writes)).toEqual([]);
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
 await installAccount(page,'registered');await page.setViewportSize({width:1440,height:960});await page.goto('/#library');await expect(page.locator('#career-title')).toHaveText('Service library');await expect(page.locator('[data-library-stage="branch"]')).toBeVisible();await page.locator('[data-library-branch="army"]').click();await page.locator('#library-choose-specialty').click();await expect(page.locator('#library-results .library-result').first()).toBeVisible();
 await expect(page.locator('.app-nav')).toBeVisible();const nav=await page.locator('.app-nav').boundingBox();expect(nav.width).toBe(1440);expect(nav.height).toBeLessThan(100);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/app-library-desktop.png'});
});

test('application entry opens on demand, can be cancelled, and does not save without an explicit action',async({page})=>{
 await guestHome(page);await navigateApp(page,'applications');await expect(page.locator('#career-job-form')).toBeHidden();await page.locator('#career-job-new').click();await page.locator('[name="role"]').fill('Example role');await page.locator('#career-job-cancel').click();await expect(page.locator('#career-job-form')).toBeHidden();await page.locator('#career-job-new').click();await expect(page.locator('[name="role"]')).toHaveValue('');expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});

test('all nine tool icons remain visible and tappable on a small phone',async({page})=>{
 await page.setViewportSize({width:320,height:740});await guestHome(page);
 for(const button of await page.locator('.app-nav>button').all()){const b=await button.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(320);}
 await navigateApp(page,'digital-cv');await expect(appRoute(page,'digital-cv')).toHaveAttribute('aria-current','page');await expect(appRoute(page,'profile')).not.toHaveAttribute('aria-current','page');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/vcp-ux-previews/virtual-cv-menu-phone.png'});
});

test('privacy and security is available before sign-in, from home and from settings without losing the workspace',async({page})=>{
 await page.setViewportSize({width:360,height:800});await installAccount(page);await page.goto('/');await expect(page.locator('#welcome-dialog')).toBeVisible();
 const [info]=await Promise.all([page.waitForEvent('popup'),page.locator('.welcome-privacy a').click()]);
 await expect(info).toHaveURL(/\/security\.html$/);await expect(info.locator('h1')).toContainText('Your information.');await expect(info.locator('.trust-facts')).toBeVisible();await expect(info.locator('a[href*=server-side-encryption]')).toBeVisible();
 await info.getByText('How I delete or export my information',{exact:true}).click();await expect(info.locator('details[open]')).toContainText('My resumes → Delete resume');await expect(info.locator('details[open]')).toContainText('Virtual CV → Unpublish');expect(await info.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await info.screenshot({path:'/tmp/vcp-ux-previews/privacy-security-phone.png',fullPage:true});await info.close();
 await expect(page.locator('#welcome-dialog')).toBeVisible();await page.locator('#welcome-guest').click();await expect(page.locator('#home-privacy')).toBeVisible();expect(await page.evaluate(()=>window.__writes)).toEqual([]);
 await page.locator('#app-settings').click();const [settingsInfo]=await Promise.all([page.waitForEvent('popup'),page.locator('#settings-security-link').click()]);await expect(settingsInfo.locator('h1')).toContainText('Your information.');await settingsInfo.close();await expect(page.locator('#settings-title')).toBeVisible();expect(await page.evaluate(()=>window.__writes)).toEqual([]);
});

test('every main tool has its own visible labeled icon and opens directly on phones and desktop',async({page})=>{
 await guestHome(page);
 const routes=[['home','Home','home'],['resumes','My resumes','versions'],['letter','Cover letters','letter'],['digital-cv','Virtual CV','digital-cv'],['profile','Profile','profile'],['applications','Job tracker','applications'],['careers','Careers','careers'],['library','Library','library'],['calculator','VA calculator','calculator']];
 for(const width of [320,360,390,768,1440]){
  await page.setViewportSize({width,height:width===1440?960:800});await expect(page.locator('.app-nav>button:visible')).toHaveCount(9);await expect(page.locator('#app-menu-open,#app-menu-dialog')).toHaveCount(0);
  const nav=await page.locator('.app-nav').boundingBox();expect(nav.width).toBe(width);expect(nav.height).toBeLessThan(width<=760?170:100);
  for(const [route,label,view]of routes){const button=page.locator('.app-nav').getByRole('button',{name:label,exact:true});await expect(button).toBeVisible();await expect(button.locator('svg')).toHaveCount(1);const bounds=await button.boundingBox();expect(bounds.width).toBeGreaterThanOrEqual(44);expect(bounds.height).toBeGreaterThanOrEqual(44);expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(width===1440?960:800);await button.click();await expect(page.locator('body')).toHaveAttribute('data-app-view',view);await expect(button).toHaveAttribute('aria-current','page');await expect(page.locator('.app-nav [aria-current=page]')).toHaveCount(1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await navigateApp(page,'digital-cv');await expect(page.locator('#career-title')).toBeFocused();await page.screenshot({path:'/tmp/vcp-ux-previews/direct-icons-cv-phone.png'});await page.setViewportSize({width:1440,height:960});await navigateApp(page,'library');await page.screenshot({path:'/tmp/vcp-ux-previews/direct-icons-library-desktop.png'});
});
test('resizing preserves the screen, its active icon and unsaved work without moving controls',async({page})=>{
 await guestHome(page);await navigateApp(page,'profile');await page.locator('#builder-name').fill('EXAMPLE UNSAVED PROFILE');
 for(const width of [1440,320,768,390]){await page.setViewportSize({width,height:844});await expect(appRoute(page,'profile')).toHaveAttribute('aria-current','page');await expect(page.locator('#builder-name')).toHaveValue('EXAMPLE UNSAVED PROFILE');await expect(page.locator('.app-nav>button:visible')).toHaveCount(9);await expect(page.locator('#app-menu-open')).toHaveCount(0);}
 expect(await page.evaluate(()=>window.__writes)).toEqual([]);await navigateApp(page,'library');await page.goBack();await expect(page.locator('#builder-name')).toHaveValue('EXAMPLE UNSAVED PROFILE');await expect(appRoute(page,'profile')).toHaveAttribute('aria-current','page');
});
test('larger text and landscape retain readable icons and keep final controls above the navigation',async({page})=>{
 await guestHome(page);await page.setViewportSize({width:360,height:800});await page.addStyleTag({content:'.standalone-app .app-nav>button>span{font-size:17px!important}'});await navigateApp(page,'profile');
 await expect.poll(()=>page.evaluate(()=>Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-nav-height')))).toBeGreaterThan(140);await page.locator('#profile-use-bottom').scrollIntoViewIfNeeded();const action=await page.locator('#profile-use-bottom').boundingBox(),nav=await page.locator('.app-nav').boundingBox();expect(action.y+action.height).toBeLessThanOrEqual(nav.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:667,height:375});await expect(page.locator('.app-nav>button:visible')).toHaveCount(9);await expect.poll(async()=>Math.ceil((await page.locator('.app-nav').boundingBox()).height)).toBeLessThan(110);await navigateApp(page,'calculator');await expect(page.locator('#calculator-title')).toBeVisible();
});
