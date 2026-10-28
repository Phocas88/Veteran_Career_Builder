import { installAccount, start, unlockEntry } from './helpers/workspace.mjs';
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const fixture = name => fileURLToPath(new URL('./fixtures/' + name, import.meta.url));
async function upload(page, name) {
  if ((await page.locator('#resume-input').inputValue()).trim()) page.once('dialog', dialog => dialog.accept());
  await page.locator('#resume-file').setInputFiles(fixture(name));
}

test.beforeEach(async ({ page }) => { await installAccount(page); await start(page); });

for (const name of ['resume.pdf', 'resume.docx', 'resume.txt']) {
  test(`imports a real ${name} on a phone without uploading it for review`, async ({ page }) => {
    const reviewRequests = [];
    const errors = [];
    page.on('request', request => { if (request.url().includes('/api/review')) reviewRequests.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await upload(page, name);
    await expect(page.locator('#import-status')).toContainText(`Your file is ready: ${name}.`);
    await expect(page.locator('#resume-input')).toHaveValue(/ALEX MORGAN/);
    await expect(page.locator('#resume-input')).toHaveValue(/Managed weekly schedules/);
    await expect(page.locator('#review-button')).toBeEnabled();
    expect(reviewRequests).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const [name, expected] of [['scanned.pdf', 'No readable text'], ['locked.pdf', 'password protected'], ['damaged.pdf', 'could not read'], ['oversized.docx', 'too much text'], ['empty.txt', 'empty']]) {
  test(`${name} gives a useful error and preserves the existing draft`, async ({ page }) => {
    const original = 'MY EXISTING RESUME\nI supported operations, maintained records, and helped teams meet their schedules.';
    await page.locator('#resume-input').fill(original);
    await upload(page, name);
    await expect(page.locator('#error-message')).toContainText(expected);
    await expect(page.locator('#resume-input')).toHaveValue(original);
    await expect(page.locator('#import-resume')).toBeEnabled();
  });
}

test('an imported Word resume can be edited and downloaded as text', async ({ page }) => {
  await upload(page, 'resume.docx');
  await expect(page.locator('#import-status')).toContainText('Your file is ready: resume.docx.');
  const text = await page.locator('#resume-input').inputValue();
  await page.locator('#resume-input').fill(text + '\nAdditional verified skill: Excel');
  await page.locator('.steps [data-tab="export"]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#download-resume').click();
  const download = await pending;
  expect(await readFile(await download.path(), 'utf8')).toContain('Additional verified skill: Excel');
});

test('canceling replacement keeps the existing draft', async ({ page }) => {
  await page.locator('#resume-input').fill('Keep my current resume.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#resume-file').setInputFiles(fixture('resume.pdf'));
  await expect(page.locator('#resume-input')).toHaveValue('Keep my current resume.');
  await expect(page.locator('#import-status')).toBeHidden();
});


test('existing resume starts with a clear file choice without opening the keyboard',async({page})=>{
 await page.goto('/');if(await page.locator('#welcome-dialog').isVisible())await page.locator('#welcome-guest').click();await page.locator('#choose-import').click();await unlockEntry(page);
 await expect(page.locator('#import-resume')).toHaveText(/Import your resume/);await expect(page.locator('#import-resume')).toBeVisible();await expect(page.locator('#resume-text-editor')).toBeHidden();await expect(page.locator('#next-job')).toBeDisabled();
 expect(await page.evaluate(()=>document.activeElement.id)).not.toBe('resume-input');
 const chooser=page.waitForEvent('filechooser');await page.locator('#import-resume').click();await (await chooser).setFiles(fixture('resume.pdf'));
 await expect(page.locator('#resume-file-name')).toHaveText('resume.pdf');await expect(page.locator('#resume-text-editor')).toBeVisible();await expect(page.locator('#resume-upload-area')).toBeHidden();await expect(page.locator('#next-job')).toBeEnabled();
 await expect(page.locator('#resume-text-label')).toHaveText('Review & edit your resume text');
 const original=await page.locator('#resume-input').inputValue();page.once('dialog',d=>d.dismiss());const replacement=page.waitForEvent('filechooser');await page.locator('#replace-resume').click();await (await replacement).setFiles(fixture('resume.docx'));await expect(page.locator('#resume-input')).toHaveValue(original);await expect(page.locator('#resume-file-name')).toHaveText('resume.pdf');
});
test('paste and upload choices preserve entered text and use a readable mobile editor',async({page})=>{
 const original='ALEX EXAMPLE\nProfessional experience maintaining accurate records, coordinating supplies, and training team members.';
 await page.locator('#resume-input').fill(original);await page.locator('#resume-upload-mode').click();await expect(page.locator('#resume-input')).toHaveValue(original);await page.locator('#resume-paste-mode').click();await expect(page.locator('#resume-input')).toHaveValue(original);
 const type=await page.locator('#resume-input').evaluate(el=>({size:parseFloat(getComputedStyle(el).fontSize),line:parseFloat(getComputedStyle(el).lineHeight)}));expect(type.size).toBeGreaterThanOrEqual(16);expect(type.line/type.size).toBeLessThanOrEqual(1.7);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
