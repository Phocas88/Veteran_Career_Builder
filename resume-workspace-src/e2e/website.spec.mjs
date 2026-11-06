import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {installAccount} from './helpers/workspace.mjs';
const screenshots='/tmp/veteran-resumes-website-previews';
test.beforeAll(async()=>mkdir(screenshots,{recursive:true}));
async function prepare(page,kind='none',options={}){await installAccount(page,kind,options);await page.route('**/api/resume-analytics',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated test collector</title>'}));}
async function enter(page){await expect(page.locator('body')).toHaveAttribute('data-workspace-ready','true');if(await page.locator('#usage-analytics-notice').isVisible())await page.locator('[data-analytics-choice=deny]').first().click();if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();}

test('the public landing page displays complete fictional examples with privacy choice before any analytics',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});const hits=[],errors=[];page.on('request',r=>{if(/resume-analytics|google-analytics|googletagmanager/.test(r.url()))hits.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:360,height:800});await page.goto('/');await expect(page.locator('#usage-analytics-notice')).toBeVisible();expect(hits).toEqual([]);await page.locator('[data-analytics-choice=deny]').click();
 await expect(page.locator('h1')).toContainText('Your experience.');await expect(page.locator('.site-header .site-brand')).toContainText('Veteran Resumes');await expect(page.locator('.site-header .site-brand img')).toHaveAttribute('src','/brand.svg');
 await expect(page.locator('.sample-card')).toHaveCount(4);for(const image of await page.locator('.sample-card img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>=816)).toBe(true);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:screenshots+'/landing-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:screenshots+'/landing-desktop.png',fullPage:true});
});
test('landing start choices pass through account entry to the existing payment step without purchasing automatically',async({page})=>{
 await prepare(page);const purchases=[];page.on('request',r=>{try{if(r.postDataJSON()?.action==='purchase')purchases.push(r.url());}catch{}});
 await page.goto('/');await page.getByRole('link',{name:'Create my resume',exact:true}).click();await enter(page);
 await expect(page.locator('#flow-payment')).toBeVisible();await expect(page.locator('#purchase-path')).toContainText('Build a new resume');await expect(page.locator('#upfront-consent')).not.toBeChecked();expect(purchases).toEqual([]);expect(new URL(page.url()).pathname).toBe('/app/');
});
test('upload entry is explicit and saved work is not discarded by a start shortcut',async({page})=>{
 await prepare(page);await page.goto('/app/?start=upload');await enter(page);await expect(page.locator('#purchase-path')).toContainText('Improve an existing resume');await expect(page.locator('#flow-payment')).toBeVisible();
});
test('document examples filter, open at a readable size and link to real PDFs',async({page})=>{
 await prepare(page);await page.goto('/');await page.locator('[data-sample-filter=letter]').click();await expect(page.locator('.sample-card:visible')).toHaveCount(1);
 const button=page.locator('[data-example=cover-letter]');await button.click();await expect(page.locator('#example-dialog')).toBeVisible();await expect(page.locator('#example-image')).toHaveAttribute('src','/site-examples/cover-letter.png');
 const pdf=await page.request.get('/site-examples/cover-letter.pdf');expect(pdf.ok()).toBe(true);expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');await page.screenshot({path:screenshots+'/cover-letter-example.png'});
 await page.keyboard.press('Escape');await expect(button).toBeFocused();
});
test('the renamed workspace uses warm readable controls and all direct tool destinations on a small phone',async({page})=>{
 await prepare(page,'registered');await page.setViewportSize({width:320,height:800});await page.goto('/app/');await enter(page);
 await expect(page.locator('.app-brand')).toContainText('Veteran Resumes');await expect(page.locator('.app-brand')).toContainText('by Veteran Career Path');await expect(page.locator('body')).toHaveCSS('background-color','rgb(23, 22, 18)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.app-nav>button')).toHaveCount(9);await page.screenshot({path:screenshots+'/workspace-small-phone.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:screenshots+'/workspace-desktop.png',fullPage:true});
});
test('legacy checkout links reach the authenticated app with the original recovery identifier',async({page})=>{
 await prepare(page,'registered');const id='c'.repeat(64),recovered=[];page.on('request',r=>{try{const body=r.postDataJSON();if(body?.buildId===id)recovered.push(body.action);}catch{}});
 await page.goto('/?build='+id+'&template=modern&checkout=success');await expect(page).toHaveURL(/\/app\//);await expect.poll(()=>recovered.length).toBeGreaterThan(0);await expect(page.locator('#home-title')).toHaveCount(1);
});
test('installation keeps the existing app identity and launches directly into the workspace',async({page})=>{
 await prepare(page);const response=await page.request.get('/manifest.webmanifest'),manifest=await response.json();expect(manifest.id).toBe('/index.html');expect(manifest.start_url).toBe('/app/');expect(manifest.name).toBe('Veteran Resumes by Veteran Career Path');
 await page.addInitScript(()=>{const match=window.matchMedia.bind(window);window.matchMedia=query=>query.includes('display-mode: standalone')?{matches:true,media:query,addEventListener(){},removeEventListener(){}}:match(query);});
 await page.goto('/');await expect(page).toHaveURL(/\/app\//);await enter(page);await expect(page.locator('.app-brand')).toContainText('Veteran Resumes');
});
