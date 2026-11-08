# Repository review and inline job questions

## Implemented result

Job match previously displayed follow-up questions as read-only text and sent users back to Resume review to answer them. Questions now have answer fields beside the requirement. Supported requirements retain their quoted evidence. Blank answers are optional and do not become experience.

The user gathers answers, explicitly agrees to AI processing and chooses **Review updated wording**. The proposed resume appears on the same Job match screen, with an editable text field and a comparison to the submitted resume. The editor's existing text remains unchanged until **Use this resume & choose a design**. That action leads into the existing design/save/download flow. It does not create another checkout. Existing unsent Resume review answers join the same included update, so switching to Job match does not silently discard them.

Answers remain private in this tab before submission and survive navigation between tools. A failed update keeps them available for retry. Account changes clear them and discard late responses. A response for an older open resume cannot attach to a newly opened purchase. Changed job details are detected before sending answers for the original comparison.

The public landing page, navigation, current paper/olive/brass theme, $1.99 resume price, $1 cover-letter price, $1 additional-design price, approved public CV design and install identity are preserved. No extra payment prompt or mandatory cover-letter step is added.

## References actually reviewed

| Reference and pinned source | Material reviewed | Application to Veteran Resumes |
|---|---|---|
| [Reactive Resume](https://github.com/reactive-resume/reactive-resume/tree/d065a9f76538afda5da5de9374da2ed51f96c1e4) | README, `docs/guides/tailoring-a-resume-for-a-job.mdx`, and `apps/web/src/features/resume/editor/check/job-match.tsx` | Keep posting context and related actions together; distinguish missing text from confirmed experience; preserve the source while tailoring. Our implementation asks for actual duties rather than copying missing posting terms into a resume. |
| [Impeccable](https://github.com/pbakaus/impeccable/tree/687bc381bc9091bf252c0a05303640561014a425) | `SKILL.md` and Operate, Clarify and Craft floor guidance in `.agents/skills/impeccable/reference/` | Familiar form controls, persistent labels, optional-field instructions, visible progress/outcomes, explicit action labels, inline error recovery, keyboard focus and responsive composition. The existing visual identity is retained. |
| [Cloudflare Security Audit](https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8) | README and `skills/security-audit/SKILL.md`, guidance mode | Scope the changed trust boundary, distinguish source evidence from tested behavior, use synthetic principals and record limits. The server binds answers to a current owned comparison and keeps requirement/question text out of applicant facts. This is a focused change review, not the full six-phase audit harness. |

These were source/design references. No third-party application code, agent runtime, hook or installer was copied into the product. Impeccable's launcher was unavailable; existing product context, current CSS and the guidance above were read directly. No `PRODUCT.md` or `DESIGN.md` previously existed. No approval-bypass launcher was executed.

The existing **docx** and **PDF.js** packages continue to produce and verify exports. O*NET services and questions were not added, consistent with the owner's earlier instruction. The original VCP occupation catalog remains. Other repositories from the Master Report remain candidates for a specific demonstrated need rather than automatic dependencies.

## Server boundary

The existing purchased `refine` action accepts canonical `job-<index>` answer IDs. It checks the authenticated owner's comparison, current revision and proof version, unsupported requirement status, and exact stored requirement/question text. Client-supplied question text does not authorize a new question. Stale, changed, supported or unknown questions are rejected. Another owner's build remains unavailable.

Only the applicant's answer becomes verified detail. The job requirement and generated question stay separate in private recovery metadata. Negative or skipped reporting answers do not add weekly reporting. Existing numeric/factual validation, bounded repair, answer/detail limits, single included update, payment checks and recoverability remain in force. Source history and other purchased resumes are preserved.

## Verification

- Complete backend suite: **210 passed**. Three new real-handler tests cover owned/current questions, stale or altered metadata, supported/invented/noncanonical IDs, another owner, negative/blank answers, one purchase and unchanged master history.
- Website build: **130 workspace unit checks**, existing route/site checks, self-hosted import/export assets and 24 actual template previews built successfully.
- Selected Chromium suite: **13 passed**, including the four new inline-question journeys plus career and finished-resume regressions. Cases include consent/no automatic submission, answer retention across navigation, keyboard submission, same-screen editable proposal, 360/1280-width overflow checks, retry without checkout, account changes and existing Review answers joining the update.
- Updated normal-entry acceptance: both synthetic Army 88M applicants pass landing → workspace → source/target → comparison → review/design → saved PDF/DOCX/TXT downloads. B answers the reporting question inline, remains on Job match to inspect/edit the proposal, then explicitly applies it. A leaves reporting unanswered and does not acquire it.
- PDF.js verifies text, duty reading order, actual page size and text bounds. Word contains native editable text without read-only protection. Both applicants retain their source duties, master history is unchanged, and a different synthetic owner receives 404 for private resume/template access.

The browser uses actual program handlers and controlled provider/Stripe responses with synthetic accounts and in-memory records. No live AI calls, actual charges or production test records are created. This establishes integration behavior, not live-model quality, a complete security audit or announcement-specific federal acceptance.

```sh
# Backend
npm ci --no-audit --no-fund
npm test

# Frontend repository root
node scripts/build-resume-website.mjs

# Frontend workspace
npx playwright test --config=playwright.career.config.mjs \
  job-clarifications.spec.mjs career.spec.mjs finished-resumes.spec.mjs

# Frontend repository root; backend checkout at the pinned feature commit
AUDIT_BACKEND_ROOT=/path/to/vcp-proxy AUDIT_OUTPUT=/tmp/job-match-proof \
  node resume-workspace-src/scripts/audit-88m.mjs
```

The isolated test machine initially lacked Python/browser system libraries; official packages resolved that setup failure. Browser testing then found that the local server's explicit public-file allowlist lacked the new module. Adding only that public route fixed workspace loading; the subsequent 13-test run and normal-entry export runs passed. These initial failures are not counted as passing checks.

## Changed files

Frontend repository:

- `resume-workspace-src/public/job-clarifications.js` — inline answers, private tab state, explicit update, proposal/edit/use, recovery and context checks.
- `resume-workspace-src/public/career-tools.js` — integrate questions and use clearer comparison actions.
- `resume-workspace-src/public/payments.js` — application type in context and late-response build guard.
- `resume-workspace-src/public/workspace.js` — wire staged and explicitly applied reviews.
- `resume-workspace-src/public/app.js` — stage a new review without navigating, include unsent answers and apply an accepted draft into Design.
- `resume-workspace-src/public/index.html` — labeled controls, consent, status/error and proposal sections.
- `resume-workspace-src/public/cozy.css` — existing-theme field/preview spacing and focus scroll margins.
- `resume-workspace-src/server.mjs` — allow the new public module through the local server.
- `resume-workspace-src/e2e/job-clarifications.spec.mjs` — four new browser journeys.
- `resume-workspace-src/playwright.career.config.mjs` — include those journeys in existing CI.
- `resume-workspace-src/scripts/audit-88m.mjs` — B now answers inline before the real export checks.
- `.github/workflows/evidence-acceptance.yml` — pin the tested backend feature commit.
- `docs/repository-review-and-job-questions.md` — this reference and verification record.

Backend repository:

- `api/_lib/resume-program.js`
- `test/job-clarifications.test.js`
- `.github/workflows/career-exploration.yml`
- `docs/job-clarification-verification.md`
