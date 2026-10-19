import {test,expect} from '@playwright/test';
import {installAccount,start,checkout,agreements,paidResponse} from './helpers/workspace.mjs';
import {fixtureResume,fixtureReview} from './helpers/review-fixture.mjs';

test('an uploaded resume with padded job details uses its upfront payment for review and retry',async({page})=>{
 await installAccount(page,'registered');const actions=[];let runs=0;
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{
  const body=route.request().postDataJSON();actions.push(body);
  if(body.action==='run'&&++runs===1)return route.fulfill({status:503,json:{error:'AI temporarily unavailable. Retry this paid build.',errorCode:'AI_UNAVAILABLE'}});
  return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review:fixtureReview}:{builds:[]})});
 });
 await start(page);await page.locator('#resume-upload-mode').click();
 await page.locator('#resume-file').setInputFiles({name:'resume.txt',mimeType:'text/plain',buffer:Buffer.from(fixtureResume+'\n')});
 await expect(page.locator('#resume-input')).toHaveValue(fixtureResume);
 await page.locator('#next-job').click();
 await page.locator('#target-role').fill(' Operations Coordinator ');
 await page.locator('#job-description').fill('\n Coordinate schedules and inventory. \n');
 await page.locator('.optional-details > summary').click();await page.locator('#additional-details').fill('\n Verified hours per week: 40. \n');
 await page.locator('#next-checkout').click();await agreements(page);await page.locator('#review-button').click();
 await expect(page.locator('#error-banner')).toContainText('Retry this paid build');
 await expect(page.locator('#flow-payment')).toBeHidden();await expect(page.locator('#review-button')).toContainText('already paid');
 await page.locator('#review-button').click();await expect(page.locator('#review-results')).toBeVisible();
 expect(actions.filter(b=>b.action==='purchase')).toHaveLength(1);expect(actions.filter(b=>b.action==='bind')).toHaveLength(1);
 const purchaseId=actions.find(b=>b.action==='bind').buildId;
 expect(actions.filter(b=>b.action==='run').map(b=>b.buildId)).toEqual([purchaseId,purchaseId]);
 await expect(page.locator('#flow-payment')).toBeHidden();
});

test('changing a bound draft does not discard payment or silently open another checkout',async({page})=>{
 await installAccount(page,'registered');const actions=[];let runs=0;
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{
  const body=route.request().postDataJSON();actions.push(body.action);
  if(body.action==='run'&&++runs===1)return route.fulfill({status:503,json:{error:'Retry this paid build.',errorCode:'AI_UNAVAILABLE'}});
  return route.fulfill({json:paidResponse(body)||(body.action==='run'?{review:fixtureReview}:{builds:[]})});
 });
 await start(page);await page.locator('#resume-input').fill(fixtureResume);await checkout(page);await agreements(page);await page.locator('#review-button').click();
 await expect(page.locator('#error-banner')).toContainText('Retry this paid build');
 await page.locator('#checkout-back').click();await page.locator('#target-role').fill('A different job');await page.locator('#next-checkout').click();await page.locator('#review-button').click();
 await expect(page.locator('#error-banner')).toContainText('linked to the resume and job details');await expect(page.locator('#flow-payment')).toBeHidden();
 await page.locator('#checkout-back').click();await page.locator('#target-role').fill('');await page.locator('#next-checkout').click();await page.locator('#review-button').click();
 await expect(page.locator('#review-results')).toBeVisible();expect(actions.filter(a=>a==='purchase')).toHaveLength(1);expect(actions.filter(a=>a==='bind')).toHaveLength(1);expect(runs).toBe(2);
});
