import {test,expect} from '@playwright/test';
import {installAccount} from './helpers/workspace.mjs';
const pages=[['military-to-civilian-resume','Your military experience. A clear civilian resume.'],['federal-resume','A federal resume built around the announcement.'],['veteran-cover-letter','A cover letter that connects your experience to the job.']];

test('public guides are discoverable without JavaScript and expose only public canonical URLs',async({browser,request})=>{
 const sitemap=await (await request.get('/sitemap.xml')).text();expect(sitemap.match(/<loc>/g)).toHaveLength(4);expect(sitemap).not.toMatch(/\/app\/|build=|letter=/);
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:3100'}),page=await context.newPage();
 await page.goto('/');for(const[slug,heading]of pages){await page.locator('.guide-links a[href="/'+slug+'/"]').click();await expect(page.locator('h1')).toHaveText(heading);await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://veteranresumes.com/'+slug+'/');await expect(page.locator('.guide-article section')).toHaveCount(4);expect(sitemap).toContain('https://veteranresumes.com/'+slug+'/');await page.locator('.site-header .site-brand').click();}
 await context.close();
});

test('guide reading, examples, navigation and privacy work on phone and desktop',async({page,request})=>{
 const errors=[],ads=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/pagead2\.googlesyndication\.com/.test(r.url()))ads.push(r.url());});
 await page.goto('/military-to-civilian-resume/');await expect(page.locator('#usage-analytics-notice')).toBeVisible();await page.locator('#usage-analytics-notice [data-analytics-choice=deny]').click();
 for(const[slug,heading]of pages){await page.goto('/'+slug+'/');await expect(page.locator('h1')).toHaveText(heading);await expect(page.locator('#usage-analytics-notice')).toBeHidden();
  const contents=page.locator('.guide-contents a').last();await contents.click();expect(new URL(page.url()).pathname).toBe('/'+slug+'/');await expect(page.locator('.guide-article section:last-child h2')).toBeInViewport();
  const image=page.locator('.guide-hero img');await expect(image).toBeVisible();expect(await image.evaluate(n=>n.complete&&n.naturalWidth>0)).toBe(true);
  const pdf=await request.get(await page.locator('.guide-hero figure>a').getAttribute('href'));expect(pdf.ok()).toBe(true);expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');
  const graph=await page.locator('script[type="application/ld+json"]').allTextContents();const nodes=graph.flatMap(text=>JSON.parse(text)['@graph']);expect(nodes.find(n=>n['@type']==='Article').mainEntityOfPage).toBe('https://veteranresumes.com/'+slug+'/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:1280,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:390,height:844});
 }
 await page.locator('#privacy-options').click();await page.locator('#site-ads-choice').check();await page.locator('#site-privacy-save').click();await expect(page.locator('#website-adsense')).toHaveCount(0);expect(ads).toHaveLength(0);expect(errors).toEqual([]);
});

test('the cover letter guide leads directly to the separate letter service',async({page})=>{
 await installAccount(page,'none');await page.goto('/veteran-cover-letter/');await page.locator('.guide-hero a[href="/app/#letter"]').click();await expect(page).toHaveURL(/\/app\/#letter$/);await expect(page.locator('#career-title')).toHaveText('Cover Letters');await expect(page.locator('#letter-source-step')).toBeVisible();
});

