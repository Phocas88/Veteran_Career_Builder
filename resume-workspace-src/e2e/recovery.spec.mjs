import {test,expect} from '@playwright/test';
import {installAccount,start,checkout,agreements} from './helpers/workspace.mjs';
import {fixtureResume,fixtureReview} from './helpers/review-fixture.mjs';
const id='e'.repeat(64),review={...fixtureReview,revisedResume:fixtureResume,rewriteNotes:[]};

async function uploadedResume(page,respond){
 await installAccount(page,'registered');await start(page);
 await page.route('https://vcp-proxy.vercel.app/api/claude',respond);
 await page.locator('#resume-upload-mode').click();
 await page.locator('#resume-file').setInputFiles({name:'resume.txt',mimeType:'text/plain',buffer:Buffer.from(fixtureResume)});
 await expect(page.locator('#resume-input')).toHaveValue(fixtureResume);
 await checkout(page);await agreements(page);await page.locator('#review-button').click();
}

test('an uploaded resume recovers after a lost review connection, with one run and no second checkout',async({page})=>{
 const actions=[];let reads=0;
 await uploadedResume(page,async route=>{
  const body=route.request().postDataJSON();actions.push(body.action);
  if(body.action==='run'){expect(body.keepAlive).toBe(true);return route.abort('connectionreset');}
  return route.fulfill({json:body.action==='prepare'?{id,status:'paid'}:body.action==='get'?(++reads===1?{id,status:'running'}:{id,status:'complete',review}):{builds:[]}});
 });
 await expect(page.locator('#loading-message')).toContainText('Reconnecting');
 await expect(page.locator('#review-results')).toBeVisible();
 expect(actions.filter(a=>a==='run')).toHaveLength(1);expect(actions.filter(a=>a==='prepare')).toHaveLength(1);
 await expect(page.locator('#error-banner')).toBeHidden();
});

test('a streamed provider error remains actionable instead of becoming Failed to fetch',async({page})=>{
 await uploadedResume(page,async route=>{
  const body=route.request().postDataJSON();
  return route.fulfill({contentType:'application/json',body:body.action==='run'?' \n'+JSON.stringify({httpStatus:503,error:'AI connection could not authenticate. Support code: AI_AUTHENTICATION.',errorCode:'AI_AUTHENTICATION'}):JSON.stringify(body.action==='prepare'?{id,status:'paid'}:{builds:[]})});
 });
 await expect(page.locator('#error-banner')).toContainText('AI_AUTHENTICATION');
 await expect(page.locator('#review-results')).toBeHidden();
});

test('cancel stops recovery and prevents a late saved result from being applied',async({page})=>{
 let reads=0;
 await uploadedResume(page,async route=>{
  const body=route.request().postDataJSON();
  if(body.action==='run')return route.abort('connectionreset');
  if(body.action==='get')reads++;
  return route.fulfill({json:body.action==='prepare'?{id,status:'paid'}:body.action==='get'?{id,status:'running'}:{builds:[]}});
 });
 await expect.poll(()=>reads).toBe(1);
 await page.locator('#cancel-review').click();
 await expect(page.locator('#loading')).toBeHidden();
 await expect(page.locator('#review-results')).toBeHidden();
 await page.waitForTimeout(3300);expect(reads).toBe(1);
});
