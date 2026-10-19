import {test,expect} from '@playwright/test';
import {installAccount,start,checkout,agreements,paidResponse} from './helpers/workspace.mjs';
import {fixtureResume,fixtureReview} from './helpers/review-fixture.mjs';
const review={...fixtureReview,revisedResume:fixtureResume,rewriteNotes:[],findings:[{priority:'High',title:'Work hours are missing',evidence:'Operations Coordinator',action:'How many verified hours per week did you work in this role?'}],nextSteps:['Which scheduling system did you use?']};

test('checkout comes before background entry and unpaid users cannot view or print a generated preview',async({page})=>{
 await installAccount(page,'registered');await page.goto('/');await page.locator('#choose-build').click();
 await expect(page.locator('#flow-payment')).toBeVisible();await expect(page.locator('#flow-build')).toBeHidden();await expect(page.locator('#purchase-start')).toContainText('$1.99');
 await page.locator('.mobile-nav [data-tab="export"]').click();await expect(page.locator('#flow-payment')).toBeVisible();
 await expect(page.locator('#export-preview')).toBeEmpty();await expect(page.locator('#pdf-pages')).toBeEmpty();await expect(page.locator('#download-pdf')).toBeDisabled();
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await expect(page.locator('#print-content')).toBeEmpty();
 await page.locator('#purchase-start').click();await expect(page.locator('#purchase-start-status')).toContainText('Agree');await expect(page.locator('#flow-build')).toBeHidden();
});

test('a verified upfront purchase unlocks the selected builder without sending resume data to checkout',async({page})=>{
 await installAccount(page,'registered');const requests=[];
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();requests.push(body);return route.fulfill({json:paidResponse(body)||{builds:[]}});});
 await start(page,'build');await expect(page.locator('#flow-build')).toBeVisible();
 const purchase=requests.find(b=>b.action==='purchase');expect(purchase.input).toBeUndefined();expect(purchase.resume).toBeUndefined();expect(purchase.entryMode).toBe('build');expect(requests.some(b=>b.action==='verify')).toBe(true);expect(requests.some(b=>b.action==='run')).toBe(false);
});

test('priority and next-step answers produce one included update, while comparison preserves the submitted resume',async({page})=>{
 await installAccount(page,'registered');await start(page);let updates=0;let submittedAnswers;
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{
  const body=route.request().postDataJSON();if(body.action==='refine'){updates++;submittedAnswers=body.answers;}
  const updated={...review,revisedResume:fixtureResume+'\nVerified hours per week: 40\nScheduling system: Team Calendar',submittedResume:fixtureResume,refinementCount:1};
  return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review}:body.action==='refine'?{review:updated}:{builds:[]})});
 });
 await page.locator('#resume-input').fill(fixtureResume);await checkout(page);await agreements(page);await page.locator('#review-button').click();
 await expect(page.locator('#review-results')).toBeVisible();await page.locator('.resume-comparison > summary').click();
 await expect(page.locator('#rewrite-original')).toHaveValue(fixtureResume);await expect(page.locator('#rewrite-proposed')).toHaveValue(fixtureResume);
 const colors=await page.locator('#rewrite-original').evaluate(el=>({ink:getComputedStyle(el).color,paper:getComputedStyle(el).backgroundColor}));expect(colors.ink).not.toBe(colors.paper);
 await page.locator('#answer-finding-0').fill('Operations Coordinator: 40 hours per week.');await page.locator('#answer-step-0').fill('Used Team Calendar for schedules.');
 await page.locator('#context-extra-0').fill('Operations Coordinator');await page.locator('#answer-extra-0').fill('Maintained a shared handover log.');
 await page.locator('#answers-consent').check();await page.locator('#apply-answers').click();
 await expect(page.locator('#rewrite-draft')).toHaveValue(/Verified hours per week: 40/);await expect(page.locator('#rewrite-original')).toHaveValue(fixtureResume);
 expect(updates).toBe(1);expect(submittedAnswers.map(x=>x.id)).toEqual(['finding-0','step-0','extra-0']);
 await expect(page.locator('#answers-status')).toContainText('has been used');await expect(page.locator('#apply-answers')).toBeDisabled();
});

test('federal selection immediately flags missing hours, contact and announcement details',async({page})=>{
 await installAccount(page,'registered');await start(page);await page.locator('#resume-input').fill(fixtureResume);await page.locator('#next-job').click();
 await page.locator('#application-type').selectOption('federal');await expect(page.locator('#federal-input-checks')).toBeVisible();
 await expect(page.locator('#federal-input-check-list')).toContainText('hours per week');await expect(page.locator('#federal-input-check-list')).toContainText('phone number');await expect(page.locator('#federal-input-check-list')).toContainText('announcement');
 await page.locator('#application-type').selectOption('private');await expect(page.locator('#federal-input-checks')).toBeHidden();
});

test('a purchase already used for a resume does not unlock a second new builder session',async({page})=>{
 await installAccount(page,'registered');await start(page);
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{const body=route.request().postDataJSON();return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review}:{builds:[]})});});
 await page.locator('#resume-input').fill(fixtureResume);await checkout(page);await agreements(page);await page.locator('#review-button').click();await expect(page.locator('#review-results')).toBeVisible();
 await page.locator('.steps [data-tab="resume"]').click();await page.locator('#checkout-back').click();await page.locator('#back-edit').click();await page.locator('#change-start').click();await page.locator('#choose-build').click();
 await expect(page.locator('#flow-payment')).toBeVisible();await expect(page.locator('#flow-build')).toBeHidden();await expect(page.locator('#purchase-start-status')).toContainText('new resume build');await expect(page.locator('#pdf-pages')).toBeEmpty();
});

test('desktop uses the website header and horizontal workspace navigation, with clear optional page-break help',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await installAccount(page,'registered');await start(page);
 await expect(page.locator('.sidebar')).toHaveCount(0);await expect(page.locator('.site-navigation')).toBeVisible();await expect(page.locator('.site-navigation > a').first()).toContainText('PathFinder');
 await page.locator('#resume-input').fill(fixtureResume);await page.locator('.steps [data-tab="export"]').click();await page.locator('.optional-page-breaks > summary').click();
 await expect(page.locator('.optional-page-breaks')).toContainText('Leave this alone to use automatic page breaks');await expect(page.locator('label[for="page-break-target"]')).toContainText('Move this section or job');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
