# Veteran Resumes workspace usability review

Reviewed 8 November 2026 against frontend `693ae3864bd315749ef70df73fc9b0e9daa9d406` and unchanged backend `0c7274bf1b438c5ad434427f47fb1f115f6d5bb8`.

## Outcome

The workspace has a consistent visual theme and separate, labelled tools. Its main problems were unclear transitions and terminology. A person could enter a resume, open Review and be told to add it again. After finishing, Home offered only “Continue.” The changes address those states and provide optional instructions without adding another onboarding dialog.

## Verified changes

| Priority | Before | After |
| --- | --- | --- |
| High | Review displayed “Your review will appear here” and “Add your resume” with a complete resume already in the editor. | It recognizes the text and offers “Continue to review.” The action opens optional job details and the existing consent step. No automatic AI request or second purchase occurs. Short drafts return to editing; an empty draft returns to the starting choices. |
| High | Home and the open-document row in My resumes offered a generic “Continue.” The continuation code did not retain the unfinished design screen. | Labels reflect the actual state: Continue resume, Continue review, Choose a design or Download resume. The selected design stage resumes, and finished work opens its download screen. |
| Medium | The job screen showed both the main three-stage journey and “Step 2 of 3” inside its first stage, plus repeated optional-job instructions. | The main journey retains its numbering. The inner status names the task, “Add job details,” and the repeated paragraph is hidden. OPSEC, application type and federal readiness controls remain available. |
| Medium | A surviving black-theme rule rendered progress text gold on cream: RGB(239,198,75) on RGB(247,243,233), approximately 1.47:1 contrast at 12px. | A targeted theme rule makes this text RGB(98,94,82), 14px, with more than 4.5:1 contrast against the actual background. |
| Medium | Instructions were scattered across long forms, making the route from starting to saving hard to reconstruct. | Each career tool has a collapsed “How to use this page” guide with three relevant steps. Home explains creation and saving; the calculator explains rates, awarded percentages and estimates. Guides use native keyboard-accessible disclosure controls. |
| Medium | The menu said “Virtual CV” and “Job tracker,” while document actions said “digital CV” and the tracker opened a heading called “Applications.” | Workspace actions consistently use “Virtual CV”; the tracker heading matches its menu label. Existing internal routes and the public CV design are preserved. |
| Medium | The header’s visible “Help” button opened emergency resources, which could be mistaken for instructions about using the service. | It says “Urgent help,” with an accessible name identifying crisis resources. All existing crisis, housing, hunger and local-help links remain intact. |

The old second job-screen heading is already hidden in the rendered interface. It was not counted as a visible duplicate or redesigned based only on source text. The later checkout’s promo paragraph is also already hidden: both comparison journeys used exactly one resume purchase, so this review did not introduce a billing change.

## Screen and workflow coverage

- Public, signed-out production entry on a 390px phone: real workspace initialization, privacy choice, guest entry, navigation and layout. Backend actions were intercepted to prevent production writes. No production AI request, purchase or user record was created.
- Synthetic signed-in comparison: upload/paste entry, Review with existing text, optional job details, consent, revised text, design, finish/save, downloads and return to Home.
- All nine persistent tools: Home, My resumes, Cover letters, Virtual CV, Profile, Job tracker, Careers, Library and VA calculator. Settings and urgent resources were inspected separately.
- Phone and desktop first-screen inspection, with small-phone checks at 320px, standard phone at 390px and desktop at 1280px. Navigation labels, focus, keyboard disclosures, horizontal overflow and reachable actions were checked. All nine individual tool icons remain available.
- Existing automated workflows cover profile persistence and import confirmation, resume uploads and deletion, career results, military library selection, cover-letter purchase/edit/save/download, Virtual CV section confirmation and publishing, free coupons, purchase recovery, additional-design ownership, privacy preferences and sign-in integration boundaries.
- Both 88M acceptance applicants continue through the normal website entry with real program handlers and controlled AI/payment responses. Confirmed duties, inline clarification, source preservation, saved exports and owner checks remain covered. These fixtures establish application integration, not live-model quality.

## Verification

The six new behavioral browser tests check contextual Review entry, short-draft recovery, design and download continuation, keyboard page instructions, small-phone urgent resources and measured progress contrast. They run in the existing full career-browser CI suite.

Reproduction commands, from the frontend repository root:

```sh
node scripts/build-resume-website.mjs
cd resume-workspace-src
npx playwright test --config=playwright.career.config.mjs
npx playwright test --config=playwright.website.config.mjs
cd ..
AUDIT_BACKEND_ROOT=/path/to/vcp-proxy AUDIT_OUTPUT=/tmp/workspace-ux-88m \
  node resume-workspace-src/scripts/audit-88m.mjs
```

Final test counts and production verification are recorded in the release receipt accompanying this report.

## Exact files changed

- `resume-workspace-src/public/app.js`: contextual Review entry, task-aware continuation and shared module versions.
- `resume-workspace-src/public/app-shell.js`: clear Home/My resumes continuation labels refreshed on navigation.
- `resume-workspace-src/public/workspace.js`: connect continuation status to the shell; consistent module versions.
- `resume-workspace-src/public/guided-flow.js`: one numbered journey and less repeated job-screen instruction.
- `resume-workspace-src/public/index.html`: labelled Review action, optional guides, urgent-help label and consistent Virtual CV copy.
- `resume-workspace-src/public/cozy.css`: restrained guide styling, urgent-button wrapping and readable progress text.
- `resume-workspace-src/public/career-tools.js`: task-specific guides and matching menu/action terminology.
- `resume-workspace-src/public/digital-cv.js`: consistent Virtual CV messages and actions in the workspace.
- `resume-workspace-src/public/app-resources.js`: use the same shell-module version as the other entry points.
- `resume-workspace-src/e2e/workspace-guidance.spec.mjs`: six behavioral regression journeys.
- `resume-workspace-src/e2e/app-shell.spec.mjs`: expect the tracker heading to match its menu label.
- `resume-workspace-src/playwright.career.config.mjs`: include the new journeys in existing CI.
- `docs/workspace-usability-review.md`: this review and its verification scope.

## Practical limits and next evaluation

This is a rendered heuristic review and automated workflow verification, not a study involving older veterans or a comprehensive accessibility audit. Real Google sign-in, actual Stripe charges and live AI output were not exercised. The two-row mobile navigation is busy, but preserves the owner's explicit requirement for individual labelled icons.

The most useful next evaluation is to observe first-time veterans complete three tasks without coaching: upload and download a resume, update a profile from an upload, and publish an updated Virtual CV. Include participants with limited technical experience. Record where they hesitate and whether they can identify what is saved privately versus publicly shared.
