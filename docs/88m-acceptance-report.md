# Veteran Resumes: confirmed-duty acceptance report

## Outcome and test scope

The highest-impact reproduced problem was inaccurate military translation escaping validation. The original server accepted deliberately incorrect provider fixtures: an Army 88M code as evidence for software engineering, GCSS-Army use as implementation, and vehicle-status recording as weekly reporting. The change rejects those specific unsupported claims across career matching, job comparisons, resume rewrites and cover letters. Each career's actual supporting quotation is now visible without opening another disclosure. Website entry says **Get started** and **My workspace**, with website/account/shortcut language in the surrounding controls.

**These are labeled integration-fixture results, not observations or measurements of live AI output.** Chromium used the real public entry point for the baseline and the built website for the change. Requests passed through the actual backend program handlers and normalizers, with controlled AI/Stripe responses, synthetic identities and in-memory records. No production account, charge, resume or shared CV was created. The baseline deliberately returns invalid provider content so acceptance/rejection is observable rather than dependent on a particular model response.

Baseline source: frontend `1a5f90405f84f821361a33ccde0ab6c42cfd9a53`, backend `f276e4f906f188a3791b6274f4aba866d1474c42`. Backend change: [PR 56](https://github.com/Phocas88/vcp-proxy/pull/56), tested commit `e9f498887e71be843e1203fb8ddf57788e30b2e4`, merged commit `072180cdcf5d038f34b65b42fd0ec8cd8376cd26`. The tested and merged backend trees match.

## What the two applicants see

Both synthetic applicants supply Army and MOS 88M. Neither supplies rank, skill level or additional qualifications. Those remain separate, empty inputs; the test does not invent a rank or infer a skill level from one. Unknown/legacy-code handling and distinct additional-duty fields have separate regression coverage.

| Applicant | Confirmed history | Before, with the adversarial fixture | After, with the same fixture |
|---|---|---|---|
| A | `Drove convoy vehicles.` `Performed vehicle inspections before and after missions.` | Freight truck driver **and Software engineer**, the latter supported only by `Army | MOS 88M`. The invalid implementation/reporting draft was accepted. | **Freight truck driver**, citing `Drove convoy vehicles.` Both driving and inspections remain in the resume and all downloads. No civilian CDL, mechanic credential, reporting or implementation is inferred. |
| B | `Dispatched vehicles.` `Trained drivers.` `Recorded vehicle status in GCSS-Army.` | Transport dispatch coordinator, fleet operations coordinator, employee training specialist **and Software engineer**. The same invalid draft was accepted. | **Transport dispatch coordinator**, citing `Dispatched vehicles.` **Fleet operations coordinator**, citing `Recorded vehicle status in GCSS-Army.` **Employee training specialist**, labeled **Transferable skills**, citing `Trained drivers.` No software implementation or civilian instructor credential is inferred. |

The short profiles support fewer results than a full career history. The change does not pad the list to meet a target count. Career exploration still reads the complete original history and verified details, excludes the target role/posting, and supports categorized results and preparation checks.

The occupation source is the **original Veteran Career Path catalog**, not O*NET. There is no live O*NET integration in this service. No O*NET questions or API connection were added. Occupation descriptions explain possible work; the separate “From your background” quotation identifies the applicant-confirmed evidence.

Screenshots from the actual changed browser workflow, using the synthetic integrations described above:

[Applicant A career results](evidence/applicant-a-careers.jpg) · [Applicant B career results](evidence/applicant-b-careers.jpg)

Machine-readable recordings: [before](evidence/88m-before.json) and [after](evidence/88m-after.json), including career titles/evidence, requirement statuses, submitted/skipped/confirmed drafts, extracted export text and synthetic request sequences.

## Fleet-coordinator requirement comparison

The posting requests dispatching, driver training, GCSS-Army vehicle-status recording, weekly vehicle-availability reports and a current civilian CDL.

| Requirement | A after | B after |
|---|---|---|
| Dispatch vehicles | Not demonstrated | Supported: `Dispatched vehicles.` |
| Train drivers | Not demonstrated | Supported: `Trained drivers.` |
| Record status in GCSS-Army | Not demonstrated | Supported: `Recorded vehicle status in GCSS-Army.` |
| Prepare weekly availability reports | Needs detail | Needs detail |
| Current civilian CDL | Needs detail; ask type/current status | Needs detail; ask type/current status |

Before the change, the bad fixture labeled weekly reporting **Supported** for both. Afterward, both see: **“Did you prepare or export reports? What did you track, and who used it?”** Missing evidence is not represented as proof that someone lacks a qualification.

A skips the reporting answer; reporting stays out. B confirms: **“I exported vehicle-status data from GCSS-Army and prepared a weekly availability report for the dispatch team.”** The included Review clarification update then retains those exact facts in the draft and all downloads. It does not add a daily cadence, a metric, system implementation or a CDL. The original question by itself, a negative answer and a reporting course do not authorize reporting claims. Grammar-only edits preserve assistance with reports without promoting assistance to preparation.

The initial invalid rewrite receives the existing bounded repair within the same purchase. The browser record contains two simulated checkout sessions total, one per applicant; clarification and repair create no second checkout. Separate actual-handler tests create a second target and verify that editing/refining it preserves the master history and the earlier purchased application. The browser test also changes the applicant name's capitalization in the targeted draft, exports it, and verifies that the master is unchanged.

## Workflow and feature inventory

Checkout identity was verified through `vercel.json`, `scripts/build-resume-website.mjs`, the public routes and the existing workspace. Root is the public service website; `/app/` remains the internal workspace URL and install start URL. No hosting migration was introduced.

| Area | Existing behavior and verification | Status / remaining issue |
|---|---|---|
| Intake | `veteran-profile.js`, `profile-fields.js`, `profile-steps.js`, `profile-storage.js`: separate service/rank/specialty/full code/qualifier/duty inputs; PDF, Word, text upload and manual entry. Profile/import tests cover save/return and section confirmation. | Working for covered cases. Unknown/legacy codes can be retained as recorded; they do not prove duties. |
| Independent careers | `career-explorer.js` → `career-assess-saved`/`career-assess` → `career-saved.js`/`career-matches.js`; original VCP catalog. Existing saved resumes do not need another checkout for matching. | Working in fixture integration. Live provider breadth/quality is an outstanding check. O*NET connection absent. |
| Job tailoring | `career-tools.js` → `career` → `career-kit.js`; requirements have quoted evidence, specific questions or a not-demonstrated state. | Partial UX: job-comparison questions are still read-only there. Answers are entered in Review's guided clarification controls, as tested. Direct answers beside each comparison question remain an opportunity. |
| Generation | `app.js`/`build-recovery.js` → `bind`/`run`/`refine` → `resume-program.js` → `reviewWithRecovery`; original and verified details stay distinct from the posting. | Working for the tested paths. New safeguards are deliberately bounded, not general proof of every possible claim. |
| Editing and saving | Guided Review/Draft/Design, finished template entitlement, `template-finish`/`template-open`, My resumes and purchase recovery. | Working in actual-handler/browser fixtures. One saved design is included; another finished design remains $1. |
| Downloads | Existing `exports.js`, PDF exporter, DOCX exporter and TXT; selected version is used. | Both 88M journeys pass all three actual browser downloads. See export detail below. |
| Cover letters | Separate menu and $1 service, saved editing/recovery/download flow. `cover-letter-ai.js` now also rejects the bounded unsupported factual claims. | Existing tests pass. The new A/B browser journey exports resumes; cover-letter claim protection is covered by backend tests, not a new live letter generation. |
| Virtual CV | `digital-cv.js`/`digital-cv-model.js`, server public allowlist/rendering and explicit publication choices. Approved public layout is unchanged. | Existing synthetic-account tests check intended public fields, no private clearance/credential/supervisor fields, account changes and unpublished edits. No public production CV was published in this audit. |
| Federal mode | Already separate; current code checks month/year, hours per week and announcement-specific details, readable single-column US Letter, file size and rendered two-page ceiling. | Existing export regressions retained. This 88M task uses civilian documents; it is not a new federal-announcement certification or a fresh policy review. |
| Value before payment | Public full resume/letter examples, career exploration, service library and profile tools are discoverable. Resume generation retains the owner's existing upfront purchase rule. | Partial against the brief's suggested prepayment translation preview; pricing/payment policy was not changed. |

Selective references: the report's acceptance/debugging method was applied; the site's existing editor was reused. Existing **docx 9.12.0** and **PDF.js 6.4.299** handled editable Word and PDF verification. No unrelated agent framework, repository bundle or new dependency was installed.

## Browser, export and privacy verification

Normal entry tested: public landing → Get started/workspace → keyboard activation of Careers → saved original resume selection/consent → grouped career results → Home → upload selection → simulated verified checkout → actual text-file chooser → target posting → review → job comparison → Review clarification (B) → draft edit → finish → PDF/Word/TXT downloads. Baseline used the original live site's Open app link before the wording change. All AI/checkout responses and account records were controlled fixtures for both versions.

Both changed journeys have no browser page errors and fit phone width 390 and desktop width 1280. The existing browser suite additionally covers profile save/return, input corrections, manual paths, account switches, keyboard navigation, clearer import steps and public-CV privacy controls. A full-page screenshot can place the fixed bottom navigation across the image; this is a capture artifact, not an extra navigation panel in the page.

| Export check | A | B after confirmation |
|---|---|---|
| Actual downloaded PDF | 1 US Letter page (612 × 792 pt) | 1 US Letter page (612 × 792 pt) |
| Required duty reading order, extracted character offsets | 74, 97 | 74, 95, 112 |
| Bounds | Nonempty text stays inside tested page margins | Same |
| Word | Native editable `<w:t>` text, no read-only protection; all duties retained | Same, plus the exact confirmed weekly-report fact |
| TXT | Correct selected wording and all A duties; no reporting | Correct selected wording and B duties; confirmed report retained |

PDF.js extracts the PDF and verifies heading/name/contact → military history → duties in order. The real preview/export model supplies the selected document; no separate test renderer is substituted. Mammoth checks Word text and Python ZIP/XML checks native text runs and absence of document protection. PDF line wrapping may introduce a space at `vehicle- status`; no fact is lost. Files do not contain the invented implementation or current-CDL claim. These checks do not promise an ATS score or acceptance by an employer.

Synthetic ownership checks: changing the owner while reusing a private build identifier returns 404 for get/run/career/template operations; another owner's saved resume is unavailable. Public CV tests preserve chosen contact opt-ins and exclude private fields. No exposure was found in those covered cases. This is handler/browser fixture coverage, not a live two-account penetration test, Firestore-emulator run or comprehensive security audit.

## Commands and results

Run backend commands from `Phocas88/vcp-proxy`, frontend commands from this repository unless a working directory is given:

```sh
# Backend, complete checkout with dependencies (Node 22)
npm ci --no-audit --no-fund
npm test
# 207 passed; zero failures.

# Focused real-handler/evidence acceptance
node --test --test-isolation=none test/confirmed-facts.test.js test/88m-acceptance.test.js
# 15 passed; zero failures. --test-isolation=none is needed by the local execution environment.

# Frontend
npm ci --prefix resume-workspace-src --include=dev --no-audit --no-fund
node scripts/build-resume-website.mjs
# 130 workspace unit checks passed; self-hosted imports/exports/icons and 24 real template previews built.

cd resume-workspace-src
npx playwright install --with-deps chromium
npx playwright test --config=playwright.website.config.mjs
# 15 public-site browser tests passed.
npx playwright test --config=playwright.career.config.mjs
# Initial full run: 164 passed, two environment-sensitive failures (shared trace folder / render deadline).
# Re-run only those two in an isolated output folder with no competing browser suite:
npx playwright test --config=playwright.career.config.mjs studio.spec.mjs \
  --grep 'formatting, section renaming|multi-page designed' --output=/tmp/88m-studio-final-artifacts
# 2 passed; zero failures.
```

Reproduce the changed 88M journey from repository root with the backend checked out at the tested commit:

```sh
AUDIT_BACKEND_ROOT=/path/to/vcp-proxy AUDIT_OUTPUT=/tmp/veteranresumes-88m-proof \
  node resume-workspace-src/scripts/audit-88m.mjs
```

For the baseline, check out the pinned original backend, copy only `test/helpers/evidence-program.cjs` and `test/fixtures/88m-profiles.json` from the changed backend into it, and use `AUDIT_MODE=before`, `AUDIT_SITE=https://veteranresumes.com/`, that original `AUDIT_BACKEND_ROOT`, and a separate output directory. This preserves the original validators. Current public UI may differ from the captured baseline after deployment; the pinned source IDs above identify the original versions.

The new `.github/workflows/evidence-acceptance.yml` pins the tested backend, builds the website, repeats both changed normal-entry journeys and uploads screenshots/PDF/DOCX/TXT/JSON proof as a workflow artifact retained for 14 days. It uses no provider keys or payment credentials.

Initial checks found three existing frontend test failures from an overly strict reporting-assistance guard; that false positive was fixed and given a regression test before the successful build. An attempted full run in the partial local backend mirror also lacked existing files/dependencies; the complete isolated checkout's 207-test run and backend GitHub checks passed. Two concurrent browser runners also collided in their shared trace folder; a large-preview check exceeded its five-second readiness assertion under the competing load. The public suite passed all 15 checks after using a separate artifact directory; the two affected studio checks then both passed separately (21.5 seconds). These initial failures are not counted as successful checks.

## Exact changed files

Frontend repository (`Phocas88/Veteran_Career_Builder`):

- `resume-website-src/index.html` — service entry, website/account/shortcut wording; existing professional design retained.
- `resume-workspace-src/public/index.html` — consistent customer wording and navigation accessibility label.
- `resume-workspace-src/public/app-install.js` — shortcut confirmation wording; installation identity unchanged.
- `resume-workspace-src/public/career-explorer.js` — always-visible career reason and applicant quotation.
- `resume-workspace-src/lib/confirmed-facts.cjs` — byte-identical copy of the backend safeguard for the local writer.
- `resume-workspace-src/lib/review.mjs` — local writer uses the same bounded factual checks and guidance.
- `resume-workspace-src/test/confirmed-facts.test.mjs` — local-writer claim/confirmation regressions.
- `resume-workspace-src/package.json` — include the new unit tests; no dependency change.
- `resume-workspace-src/scripts/audit-88m.mjs` — real-handler browser acceptance and export verification.
- `.github/workflows/evidence-acceptance.yml` — repeatable, credential-free browser acceptance artifact.
- `docs/88m-acceptance-report.md` — this report.
- `docs/evidence/88m-before.json` and `docs/evidence/88m-after.json` — recorded synthetic results.
- `docs/evidence/applicant-a-careers.jpg` and `docs/evidence/applicant-b-careers.jpg` — actual after screenshots.

Backend repository (`Phocas88/vcp-proxy`):

- `api/_lib/confirmed-facts.js`
- `api/_lib/career-matches.js`
- `api/_lib/career-kit.js`
- `api/_lib/cover-letter-ai.js`
- `api/_lib/resume-workspace/review.mjs`
- `api/_lib/resume-program.js`
- `test/confirmed-facts.test.js`
- `test/88m-acceptance.test.js`
- `test/helpers/evidence-program.cjs`
- `test/fixtures/88m-profiles.json`
- `.github/workflows/career-exploration.yml`
- `docs/confirmed-facts-verification.md`

## Remaining limitations and preserved behavior

The safeguard recognizes specific observed claim promotions; it cannot establish universal semantic truth or verify an applicant's own assertions. Live model quality, account-provider sign-in, real checkout and production storage were not exercised with test identities. Existing repair is bounded; a persistently unfaithful provider response remains recoverable under the existing purchase rather than being displayed as an approved draft. New comparison/matching cache versions refresh older results; previously approved documents are not automatically rewritten.

Prices remain $1.99 for a resume, $1 for a cover letter and $1 for another finished design. Public CV layout, private storage boundaries, GA4 consent, landing-only ad placement, checkout recovery and PWA identity (`/index.html`, start `/app/`, root scope) are preserved. “Install app” appears only where it identifies the browser's actual native menu command.

The replacement logo is visible inline in the conversation, but its original image file was not present in the mounted attachments. The existing asset remains in place. Installing that exact artwork still needs its PNG/SVG file; no generated substitute was used.
