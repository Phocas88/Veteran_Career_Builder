import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {installAccount,navigateApp} from './helpers/workspace.mjs';
const screenshots='/tmp/veteran-resumes-website-previews';
test.beforeAll(async()=>mkdir(screenshots,{recursive:true}));
async function prepare(page,kind='none',options={}){await installAccount(page,kind,options);await page.route('**/api/resume-analytics',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated test collector</title>'}));}
async function enter(page){await expect(page.locator('body')).toHaveAttribute('data-workspace-ready','true');if(await page.locator('#usage-analytics-notice').isVisible())await page.locator('[data-analytics-choice=deny]').first().click();if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();}

test('the public landing page shows full templates and client-ready copy with privacy choice before analytics',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});const hits=[],errors=[];page.on('request',r=>{if(/resume-analytics|google-analytics|googletagmanager/.test(r.url()))hits.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:360,height:800});await page.goto('/');await expect(page.locator('#usage-analytics-notice')).toBeVisible();expect(hits).toEqual([]);await page.locator('[data-analytics-choice=deny]').click();
 await expect(page.locator('h1')).toContainText('Your experience.');await expect(page.locator('.site-header .site-brand')).toContainText('Veteran Resumes');await expect(page.locator('.site-header .site-brand img')).toHaveAttribute('src','/brand.svg');
 await expect(page.locator('.sample-card')).toHaveCount(8);for(const image of await page.locator('.sample-card img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>=816)).toBe(true);}
 await expect(page.locator('main')).not.toContainText(/\b(?:demo|fictional)\b/i);await expect(page.locator('[data-hero-play]')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.evaluate(()=>{document.getElementById('template-rail').scrollLeft=0;scrollTo(0,0);});await page.screenshot({path:screenshots+'/landing-mobile.png',fullPage:true});
 await page.locator('.hero-showcase').screenshot({path:screenshots+'/carousel-mobile.jpg',type:'jpeg',quality:85});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:screenshots+'/landing-desktop.png',fullPage:true});
 await page.screenshot({path:screenshots+'/hero-desktop.jpg',type:'jpeg',quality:85});await page.locator('#examples').screenshot({path:screenshots+'/templates-desktop.jpg',type:'jpeg',quality:85});
});
test('landing start choices pass through account entry to the existing payment step without purchasing automatically',async({page})=>{
 await prepare(page);const purchases=[];page.on('request',r=>{try{if(r.postDataJSON()?.action==='purchase')purchases.push(r.url());}catch{}});
 await page.goto('/');await page.locator('.hero').getByRole('link',{name:'Create my resume',exact:true}).click();await enter(page);
 await expect(page.locator('#flow-payment')).toBeVisible();await expect(page.locator('#purchase-path')).toContainText('Build a new resume');await expect(page.locator('#upfront-consent')).not.toBeChecked();expect(purchases).toEqual([]);expect(new URL(page.url()).pathname).toBe('/app/');
});
test('upload entry is explicit and saved work is not discarded by a start shortcut',async({page})=>{
 await prepare(page);await page.goto('/app/?start=upload');await enter(page);await expect(page.locator('#purchase-path')).toContainText('Improve an existing resume');await expect(page.locator('#flow-payment')).toBeVisible();
});
test('document examples filter, open at a readable size and link to real PDFs',async({page})=>{
 await prepare(page);await page.goto('/');await page.locator('[data-sample-filter=letter]').click();await expect(page.locator('.sample-card:visible')).toHaveCount(1);
 const button=page.locator('.sample-card [data-example=cover-letter]');await button.click();await expect(page.locator('#example-dialog')).toBeVisible();await expect(page.locator('#example-image')).toHaveAttribute('src','/site-examples/cover-letter.png');
 const pdf=await page.request.get('/site-examples/cover-letter.pdf');expect(pdf.ok()).toBe(true);expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');await page.screenshot({path:screenshots+'/cover-letter-example.png'});
 await page.keyboard.press('Escape');await expect(button).toBeFocused();
});

test('featured templates support keyboard navigation, photo previews and reduced motion',async({page})=>{
 await prepare(page);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:950});await page.goto('/');
 const hero=page.locator('[data-hero-carousel]');await expect(hero).toHaveAttribute('data-active-index','0');await hero.locator('[data-hero-next]').click();
 await expect(hero.locator('[data-hero-name]')).toHaveText('Folio');await expect(hero.locator('.hero-slide[aria-hidden=false]')).toHaveCount(1);await expect(hero.locator('[data-hero-play]')).toBeHidden();
 const portrait=hero.locator('.hero-slide[aria-hidden=false] button');await portrait.click();await expect(page.locator('#example-dialog-title')).toHaveText('Folio resume');await expect(page.locator('#example-image')).toHaveAttribute('src','/site-examples/resume-folio.png');
 await page.keyboard.press('Escape');await expect(portrait).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(hero.locator('[data-hero-name]')).toHaveText('Modern');
 await hero.locator('[data-hero-dot="3"]').click();await expect(hero.locator('[data-hero-name]')).toHaveText('Federal experience');
 await hero.locator('.hero-slide[aria-hidden=false] button').click();const info=await (await page.request.get('/site-examples/manifest.json')).json(),federal=info.examples.find(item=>item.key==='resume-federal-experience');
 expect(federal.photo).toBe(false);expect(federal.pages).toBeLessThanOrEqual(2);await expect(page.locator('#example-pages img')).toHaveCount(federal.pages);
});

test('template filters reveal federal and portrait formats and the rail remains usable on small screens',async({page})=>{
 await prepare(page);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.locator('[data-sample-filter=federal]').click();await expect(page.locator('.sample-card:visible')).toHaveCount(2);await expect(page.locator('.sample-card:visible').first()).toHaveAttribute('data-category','federal');
 await page.locator('#examples').screenshot({path:screenshots+'/templates-federal-phone.jpg',type:'jpeg',quality:85});
 await page.locator('[data-sample-filter=photo]').click();await expect(page.locator('.sample-card:visible')).toHaveCount(2);for(const card of await page.locator('.sample-card:visible').all())await expect(card).toHaveAttribute('data-photo','true');
 const rail=page.locator('#template-rail');await page.locator('[data-rail-next]').click();await expect.poll(()=>rail.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);
 await rail.focus();await page.keyboard.press('Home');await expect.poll(()=>rail.evaluate(node=>node.scrollLeft)).toBe(0);await page.keyboard.press('End');await expect(page.locator('[data-rail-next]')).toBeDisabled();
 await page.locator('#examples').screenshot({path:screenshots+'/templates-portrait-phone.jpg',type:'jpeg',quality:85});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('automatic rotation waits for privacy choice and can be paused without starting again',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1280,height:950});await page.clock.install();await page.goto('/');
 const hero=page.locator('[data-hero-carousel]');await expect(page.locator('#usage-analytics-notice')).toBeVisible();await page.clock.fastForward(13500);await expect(hero).toHaveAttribute('data-active-index','0');
 await page.locator('[data-analytics-choice=deny]').click();await page.mouse.move(0,0);await page.clock.fastForward(6600);await expect(hero).toHaveAttribute('data-active-index','1');
 await hero.locator('[data-hero-play]').click();await expect(hero).toHaveAttribute('data-playing','false');await page.mouse.move(0,0);await page.clock.fastForward(13500);await expect(hero).toHaveAttribute('data-active-index','1');
});
test('the workspace matches the public website and keeps every tool reachable on phones and desktop',async({page})=>{
 await prepare(page,'registered');await page.setViewportSize({width:320,height:800});await page.goto('/app/');await enter(page);
 await expect(page.locator('.app-brand')).toContainText('Veteran Resumes');await expect(page.locator('.app-brand')).toContainText('by Veteran Career Path');await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 243, 233)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.app-nav>button')).toHaveCount(9);await page.screenshot({path:screenshots+'/workspace-small-phone.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>scrollTo(0,0));
 const header=await page.locator('.app-topbar').boundingBox(),nav=await page.locator('.app-nav').boundingBox(),heading=await page.locator('#home-title').boundingBox();
 expect(nav.y).toBeGreaterThanOrEqual(header.y+header.height-1);expect(heading.y).toBeGreaterThan(nav.y+nav.height);
 await page.screenshot({path:screenshots+'/workspace-desktop.png',fullPage:true});
});
test('profile, library, cover letters and calculator retain readable controls in the shared theme',async({page})=>{
 await prepare(page,'registered');await page.goto('/app/');await enter(page);
 for(const route of ['profile','library','letter','calculator']){
  await navigateApp(page,route);await page.evaluate(()=>scrollTo(0,0));
  await expect(page.locator('body')).toHaveAttribute('data-app-view',route);
  if(route==='library'){await page.locator('[data-library-branch="army"]').click();await page.locator('#library-choose-specialty').click();}
  const field=page.locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):visible,select:visible,textarea:visible').first();
  await expect(field).toBeVisible();await expect(field).toHaveCSS('color','rgb(38, 39, 32)');await expect(field).toHaveCSS('background-color','rgb(255, 254, 249)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:screenshots+'/workspace-'+route+'-phone.png'});
 }
 await page.locator('#app-settings').click();await page.locator('#settings-account').click();await expect(page.locator('#account-dialog')).toBeVisible();await expect(page.locator('#account-data>summary')).toHaveCSS('color','rgb(80, 96, 69)');await page.screenshot({path:screenshots+'/workspace-account-phone.png'});
});
test('legacy checkout links reach the authenticated app with the original recovery identifier',async({page})=>{
 await prepare(page,'registered');const id='c'.repeat(64),recovered=[];page.on('request',r=>{try{const body=r.postDataJSON();if(body?.buildId===id)recovered.push(body.action);}catch{}});
 await page.goto('/?build='+id+'&template=modern&checkout=success');await expect(page).toHaveURL(/\/app\//);await expect.poll(()=>recovered.length).toBeGreaterThan(0);await expect(page.locator('#home-title')).toHaveCount(1);
});
test('installation keeps the existing identity, launches into the workspace and displays its logo offline',async({page,context})=>{
 await prepare(page);const response=await page.request.get('/manifest.webmanifest'),manifest=await response.json();expect(manifest.id).toBe('/index.html');expect(manifest.start_url).toBe('/app/');expect(manifest.name).toBe('Veteran Resumes by Veteran Career Path');
 await page.addInitScript(()=>{const match=window.matchMedia.bind(window);window.matchMedia=query=>query.includes('display-mode: standalone')?{matches:true,media:query,addEventListener(){},removeEventListener(){}}:match(query);});
 await page.goto('/');await expect(page).toHaveURL(/\/app\//);await enter(page);await expect(page.locator('.app-brand')).toContainText('Veteran Resumes');
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await context.setOffline(true);
 try{await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Let’s get you reconnected.'})).toBeVisible();await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 243, 233)');await expect.poll(()=>page.locator('.offline-card img').evaluate(img=>img.complete&&img.naturalWidth===192)).toBe(true);await page.screenshot({path:screenshots+'/installed-vcp-logo-offline.png'});}finally{await context.setOffline(false);}
});

const adsChoice='veteran_resumes_advertising_choice_v1';
async function advertisingFixture(page){const hits=[];await page.route('https://pagead2.googlesyndication.com/**',route=>{hits.push(route.request().url());return route.fulfill({contentType:'text/javascript',body:'window.__websiteAdvertisingFixture=true;'});});return hits;}
test('AdSense verification is public and ads require an independent opt-in without entering the app',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});const ads=await advertisingFixture(page),analytics=[];page.on('request',request=>{if(request.url().includes('/api/resume-analytics'))analytics.push(request.url());});
 const authorization=await page.request.get('/ads.txt');expect(authorization.ok()).toBe(true);expect(await authorization.text()).toContain('google.com, pub-4999040528510137, DIRECT, f08c47fec0942fa0');
 await page.goto('/');await expect(page.locator('meta[name=google-adsense-account]')).toHaveAttribute('content','ca-pub-4999040528510137');await expect(page.locator('#usage-analytics-notice')).toBeVisible();expect(ads).toEqual([]);expect(analytics).toEqual([]);
 await page.locator('#site-ads-choice').check();await page.locator('#site-privacy-save').click();await expect.poll(()=>ads.length).toBe(1);expect(analytics).toEqual([]);
 await page.locator('.site-footer a[href="/app/"]').click();await enter(page);await expect(page.locator('#home-panel')).toBeVisible();await expect(page.locator('#website-adsense,meta[name=google-adsense-account]')).toHaveCount(0);expect(ads).toHaveLength(1);
});
test('website analytics measures only approved website actions when advertising is declined',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});const ads=await advertisingFixture(page);await page.addInitScript(()=>{window.__websitePackets=[];addEventListener('message',event=>{if(event.origin==='https://vcp-proxy.vercel.app'&&event.data.websiteProbe)window.__websitePackets.push(event.data.packet);});});
 await page.route('**/api/resume-analytics*',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><script>addEventListener('message',event=>{if(event.data.type==='hello')parent.postMessage({protocol:'vcp-resume-analytics-v1',type:'ready'},event.origin);else parent.postMessage({websiteProbe:true,packet:event.data},event.origin);});</script>`}));
 await page.goto('/?email=PRIVATE_QUERY&utm_source=linkedin');await page.locator('#site-analytics-choice').check();await page.locator('#site-privacy-save').click();await expect(page.locator('#usage-analytics-frame')).toHaveCount(1);
 await page.locator('[data-example=resume-modern]').first().click();await expect.poll(()=>page.evaluate(()=>window.__websitePackets.some(item=>item.name==='vcp_resume_website_action'&&item.params.action==='example'&&item.screen==='website'))).toBe(true);
 const packets=await page.evaluate(()=>window.__websitePackets);expect(packets.find(item=>item.type==='configure').screen).toBe('website');expect(JSON.stringify(packets)).not.toContain('PRIVATE_QUERY');expect(ads).toEqual([]);
});
test('browser privacy signals override saved advertising permission and leave both choices optional',async({page})=>{
 await prepare(page);const ads=await advertisingFixture(page);await page.addInitScript(key=>{localStorage.setItem(key,JSON.stringify({version:1,enabled:true,updatedAt:Date.now()}));Object.defineProperty(navigator,'globalPrivacyControl',{configurable:true,get:()=>true});},adsChoice);
 await page.goto('/');await page.locator('#privacy-options').click();await expect(page.locator('#site-ads-choice')).toBeDisabled();await expect(page.locator('#site-analytics-choice')).toBeDisabled();await expect(page.locator('#site-privacy-signal')).toBeVisible();await expect(page.locator('#usage-analytics-frame')).toHaveCount(0);expect(ads).toEqual([]);
});
test('withdrawing advertising reloads only the public page and stops the ad tag from restarting',async({page})=>{
 await prepare(page,'none',{privacyPrompt:true});const ads=await advertisingFixture(page);await page.goto('/');await page.locator('#site-ads-choice').check();await page.locator('#site-privacy-save').click();await expect.poll(()=>ads.length).toBe(1);
 await page.locator('#privacy-options').click();await page.locator('#site-ads-choice').uncheck();await Promise.all([page.waitForEvent('load'),page.locator('#site-privacy-save').click()]);await expect(page.locator('#website-adsense')).toHaveCount(0);expect(ads).toHaveLength(1);expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).enabled,adsChoice)).toBe(false);
});
