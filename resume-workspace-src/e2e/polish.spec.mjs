import {installAccount,start,checkout,agreements,paidResponse} from './helpers/workspace.mjs';
import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

// Fictional resume, including PDF-style broken lines; never client content.
const original = `ALEX RIVERA
alex.rivera@example.com · (555) 010-1234 · Portland, OR

PROFESSIONAL SUMMARY
Experienced operations professional responsible for records and reporting.

EXPERIENCE
Inventory Manager — Systems & Analytics Jan 2025 – Present
Example Manufacturing — Portland, OR
• Responsible for leading weekly cycle counts and
analyzing material movement to identify
inventory discrepancies.
• Built Excel dashboards that helped teams plan
daily work and review operational results.

Operations Coordinator Aug 2020 – Dec 2024
Example Logistics — Portland, OR
• Maintained records and was assisting the team with
monthly reporting.
• Helped staff learn the scheduling system and answer questions.

SELECTED PROJECTS – ANALYTICS & SYSTEMS
• Built a reporting dashboard with verified inventory data.

CERTIFICATIONS & CLEARANCE
• Inactive Secret clearance

EDUCATION
Business Administration Diploma · Example College · 2019

SKILLS
Excel · Scheduling · Inventory reporting`;

const rewritten = original.replace('Experienced operations professional responsible for records and reporting.', 'Operations professional with experience in inventory reporting, cycle counts, scheduling, and team support.').replace('• Responsible for leading weekly cycle counts and\nanalyzing material movement to identify\ninventory discrepancies.', '• Led weekly cycle counts and analyzed material movement to identify inventory discrepancies.').replace('• Maintained records and was assisting the team with\nmonthly reporting.', '• Maintained records and assisted the team with monthly reporting.');

test.beforeEach(async ({page})=>{await installAccount(page,'registered');await start(page);});
async function mockReview(page,review,onInput=()=>{}){
 await page.route('https://vcp-proxy.vercel.app/api/claude',async route=>{const body=route.request().postDataJSON();if(body.action==='bind')onInput(body.input);await route.fulfill({json:paidResponse(body)||(body.action==='list'?{builds:[]}:{review})});});
}

test('full rewrite is editable, applied explicitly, exported, and undoable; federal context reaches the API', async ({ page }) => {
  let submitted;
  await mockReview(page, { score: 68, summary: 'Wrapped bullets and generic summary obscure the inventory evidence.', strengths: ['Relevant cycle-count experience'], suggestions: [], revisedResume: rewritten, rewriteNotes: ['Rewrote the summary and weak bullets without adding metrics.'], findings: [{ priority: 'High', title: 'Generic summary', evidence: 'Experienced operations professional', action: 'Lead with your documented inventory and reporting experience.' }], nextSteps: ['Confirm hours per week for federal applications.'] }, input=>submitted=input);
  await page.locator('#resume-input').fill(original);
  await page.locator('#next-job').click();
  await page.locator('#application-type').selectOption('federal');
  await page.locator('.optional-details summary').click();
  await page.locator('#additional-details').fill('Inventory Manager: 40 hours/week.');
  await page.locator('#next-checkout').click();await agreements(page);
  await page.locator('#review-button').click();
  await expect(page.locator('#review-findings')).toContainText('Generic summary');
  expect(submitted.applicationType).toBe('federal');
  expect(submitted.additionalDetails).toContain('40 hours/week');
  await expect(page.locator('#resume-input')).toHaveValue(original);
  await expect(page.locator('#rewrite-draft')).toHaveValue(rewritten);
  const approved = rewritten + '\nVerified additional skill: Recordkeeping';
  await page.locator('#rewrite-draft').fill(approved);
  await page.locator('#apply-rewrite').click();
  await expect(page.locator('#resume-input')).toHaveValue(approved);
  await expect(page.locator('#page-preview-status')).toContainText('PDF page preview');
  await expect(page.locator('#pdf-pages canvas')).toHaveCount(1);
  const pending = page.waitForEvent('download');
  await page.locator('#download-pdf').click();
  const downloaded = await pending;
  expect((await readFile(await downloaded.path())).subarray(0, 4).toString()).toBe('%PDF');
  await page.locator('#undo-last').click();
  await expect(page.locator('#resume-input')).toHaveValue(original);
});

test('real PDF preview has page boundaries, manual breaks, complete bullets, and structured job headers', async ({ page }) => {
  await page.locator('#resume-input').fill(original);
  await page.locator('.mobile-nav [data-tab="export"]').click();
  await expect(page.locator('#page-preview-status')).toContainText('1 page');
  await expect(page.locator('#export-preview .resume-job')).toHaveCount(2);
  await expect(page.locator('#export-preview .resume-heading')).toContainText(['PROFESSIONAL SUMMARY', 'EXPERIENCE', 'SELECTED PROJECTS', 'CERTIFICATIONS & CLEARANCE', 'EDUCATION', 'SKILLS']);
  await expect(page.locator('#export-preview .resume-bullet').first()).toContainText('weekly cycle counts and analyzing material movement to identify inventory discrepancies.');
  await expect(page.locator('#pdf-pages canvas')).toHaveCount(1);
  await page.locator('.optional-page-breaks > summary').click();
  const option = await page.locator('#page-break-target option').filter({ hasText: 'Operations Coordinator' }).getAttribute('value');
  await page.locator('#page-break-target').selectOption(option);
  await page.locator('#add-page-break').click();
  await expect(page.locator('#page-preview-status')).toContainText('2 pages');
  await expect(page.locator('#pdf-pages canvas')).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const data = await page.locator('#pdf-pages canvas').nth(i).evaluate(canvas => canvas.toDataURL('image/jpeg', 0.5).split(',')[1]);
    await writeFile(`test-results/polish-page-${i + 1}.jpg`, Buffer.from(data, 'base64'));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/paged-resume-mobile.jpg', type: 'jpeg', quality: 55, fullPage: true });
});

test('federal overflow warns and blocks PDF export instead of hiding content', async ({ page }) => {
  const long = original.replace('• Helped staff', Array.from({ length: 100 }, (_, i) => `• Verified duty ${i + 1}: maintained accurate records and provided regular reporting to the operations team.`).join('\n') + '\n• Helped staff');
  let downloads = 0; page.on('download', () => downloads++);
  await page.locator('#resume-input').fill(long);
  await page.locator('#next-job').click();
  await page.locator('#application-type').selectOption('federal');
  await page.locator('.mobile-nav [data-tab="export"]').click();
  await expect(page.locator('#page-limit-warning')).toContainText('two pages');
  await expect(page.locator('#federal-check-list')).toContainText('hours per week');
  await page.locator('#download-pdf').click();
  await expect(page.locator('#error-message')).toContainText('Nothing has been cut');
  await expect(page.locator('#resume-input')).toHaveValue(long);
  expect(downloads).toBe(0);
});

test('editing application context invalidates an old rewrite and state/local has no federal page cap', async ({ page }) => {
  await mockReview(page, { score: 70, summary: 'Specific feedback.', strengths: [], suggestions: [], revisedResume: rewritten, rewriteNotes: [], findings: [], nextSteps: [] });
  await page.locator('#resume-input').fill(original);
  await page.locator('#next-job').click();
  await page.locator('#application-type').selectOption('government');
  await page.locator('#next-checkout').click();await agreements(page);
  await page.locator('#review-button').click();
  await expect(page.locator('#apply-rewrite')).toBeEnabled();
  await page.locator('.mobile-nav [data-tab="resume"]').click();
  await page.locator('#checkout-back').click();
  await page.locator('.optional-details summary').click();
  await page.locator('#additional-details').fill('Changed verified details.');
  await page.locator('.mobile-nav [data-tab="review"]').click();
  await expect(page.locator('#apply-rewrite')).toBeDisabled();
  await page.locator('.mobile-nav [data-tab="export"]').click();
  await expect(page.locator('#federal-checks')).toBeHidden();
});
