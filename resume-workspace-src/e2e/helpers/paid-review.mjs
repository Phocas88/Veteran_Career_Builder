import { checkout, agreements, paidResponse } from './workspace.mjs';
export async function openFixtureReview(page, resume, review) {
 await page.route('https://vcp-proxy.vercel.app/api/claude',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:paidResponse(body)|| (body.action==='list'?{builds:[]}:{review})});});
 await page.locator('#resume-input').fill(resume);await checkout(page);await agreements(page);await page.locator('#review-button').click();await page.locator('#review-results').waitFor();
}
