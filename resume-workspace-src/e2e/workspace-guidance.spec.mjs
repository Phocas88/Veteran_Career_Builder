import {test,expect} from '@playwright/test';
import {installAccount,start,agreements,paidResponse,navigateApp} from './helpers/workspace.mjs';

const resume='EXAMPLE VETERAN\nexample@example.com\nEXPERIENCE\nArmy motor transport operator\nDrove assigned convoy vehicles and completed vehicle inspections.\nWarehouse assistant | Example Employer | 2022 - 2025\nRecorded inventory and trained new colleagues.\nEDUCATION\nExample College | Bachelor of Science | 2021';
const review={score:78,summary:'Confirmed transport and inventory experience.',strengths:[],findings:[],nextSteps:[],suggestions:[],revisedResume:resume,rewriteNotes:[]};
async function setup(page){
 await installAccount(page,'registered');const requests=[];
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();requests.push(body);return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review}:{builds:[]})});});
 return requests;
}

test('Review recognizes existing text and continues to consent without another purchase or automatic AI request',async({page})=>{
 const requests=await setup(page);await start(page);
 await page.locator('.steps [data-tab=review]').click();await expect(page.locator('#review-heading')).toHaveText('Start with your resume');
 await page.locator('#review-start').click();await expect(page.locator('#home-panel')).toBeVisible();
 // Return to the already paid entry rather than starting a second resume.
 await page.locator('#home-continue').click();await page.locator('#resume-input').fill(resume);
 await page.locator('.steps [data-tab=review]').click();await expect(page.locator('#review-heading')).toHaveText('Your resume is ready for review');
 expect(requests.filter(r=>r.action==='run')).toHaveLength(0);
 await page.locator('#review-start').click();await expect(page.locator('#flow-job')).toBeVisible();await expect(page.locator('#resume-input')).toHaveValue(resume);
 await page.locator('#next-checkout').click();await expect(page.locator('#checkout-promo-note')).toBeHidden();await expect(page.locator('#ai-consent')).not.toBeChecked();
 expect(requests.filter(r=>r.action==='run')).toHaveLength(0);await agreements(page);await page.locator('#review-button').click();await expect(page.locator('#review-results')).toBeVisible();
 expect(requests.filter(r=>r.action==='purchase')).toHaveLength(1);expect(requests.filter(r=>r.action==='run')).toHaveLength(1);expect(requests.find(r=>r.action==='bind').input.resume).toBe(resume);
});

test('a short draft returns to editing instead of pretending a review can start',async({page})=>{
 const requests=await setup(page);await start(page);await page.locator('#resume-input').fill('EXAMPLE VETERAN');await page.locator('.steps [data-tab=review]').click();
 await expect(page.locator('#review-start')).toHaveText('Continue editing →');await page.locator('#review-start').click();await expect(page.locator('#flow-edit')).toBeVisible();await expect(page.locator('#resume-input')).toHaveValue('EXAMPLE VETERAN');
 expect(requests.filter(r=>r.action==='run')).toHaveLength(0);
});

test('Home resumes the design stage and then clearly reopens finished downloads',async({page})=>{
 const requests=await setup(page);await start(page);await page.locator('#resume-input').fill(resume);await page.locator('#manual-finish').click();
 await navigateApp(page,'home');await expect(page.locator('#home-continue')).toHaveText('Choose a design →');await page.locator('#home-continue').click();await expect(page.locator('#delivery-title')).toHaveText('Choose your design');
 await page.locator('#template-finish').click();await expect(page.locator('#delivery-title')).toHaveText('Your resume is ready');if(await page.locator('#completion-dialog').isVisible())await page.locator('#completion-close').click();
 await navigateApp(page,'home');await expect(page.locator('#home-continue')).toHaveText('Download resume →');await expect(page.locator('#home-current-note')).toContainText('finished resume is saved');await page.locator('#home-continue').click();
 await expect(page.locator('#delivery-title')).toHaveText('Your resume is ready');const download=page.waitForEvent('download');await page.locator('#download-pdf').click();expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
 await navigateApp(page,'resumes');await expect(page.locator('#resume-continue')).toHaveText('Download resume →');expect(requests.filter(r=>r.action==='purchase')).toHaveLength(1);expect(requests.filter(r=>r.action==='run')).toHaveLength(0);
});

test('every career tool has optional keyboard-accessible instructions matched to the current page',async({page})=>{
 await setup(page);await page.goto('/');
 for(const route of ['resumes','letter','digital-cv','profile','applications','careers','library']){
  await navigateApp(page,route);const help=page.locator('#career-page-help');await expect(help).not.toHaveAttribute('open','');await expect(help.locator('li')).toHaveCount(3);
  const summary=help.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(help).toHaveAttribute('open','');await expect(help.locator('li').first()).toBeVisible();
  if(route==='applications')await expect(page.locator('#career-title')).toHaveText('Job tracker');
  if(route==='digital-cv')await expect(help).toContainText('same link');
  if(route==='profile')await expect(help).toContainText('Save profile');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await navigateApp(page,'calculator');await page.locator('#calculator-panel .page-help summary').click();await expect(page.locator('#calculator-panel .page-help li').first()).toBeVisible();
});

test('urgent resources are clearly labelled and fit with all nine tools on a small phone',async({page})=>{
 await page.setViewportSize({width:320,height:740});await setup(page);await page.goto('/');const urgent=page.getByRole('button',{name:'Urgent help and crisis resources'});await expect(urgent).toHaveText('Urgent help');
 const box=await urgent.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.x+box.width).toBeLessThanOrEqual(320);
 await urgent.click();await expect(page.locator('#emergency-help-title')).toHaveText('Emergency help');await expect(page.locator('#emergency-help-dialog a[href="tel:988"]')).toBeVisible();await page.locator('#emergency-help-close').click();
 await expect(page.locator('.app-nav>button')).toHaveCount(9);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the current step is readable against its actual background',async({page})=>{
 await setup(page);await start(page);await page.locator('#resume-input').fill(resume);await page.locator('#next-job').click();await expect(page.locator('#flow-instruction')).toBeHidden();await expect(page.locator('#flow-progress')).toHaveText('Add job details');await expect(page.locator('.steps .current')).toContainText('Add your resume');
 const contrast=await page.locator('#flow-progress').evaluate(node=>{
  const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number),luminance=values=>values.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  let parent=node,bg;while(parent){const color=getComputedStyle(parent).backgroundColor;if(color!=='rgba(0, 0, 0, 0)'&&color!=='transparent'){bg=rgb(color);break;}parent=parent.parentElement;}
  const a=luminance(rgb(getComputedStyle(node).color)),b=luminance(bg||[255,255,255]);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });expect(contrast).toBeGreaterThanOrEqual(4.5);
});
