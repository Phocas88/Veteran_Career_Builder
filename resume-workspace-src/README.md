# Veteran Career Path resume workspace

Additive mobile resume workflow at `/resume-workspace/index.html`. Existing main
website navigation, accounts, pricing and AI tools continue to work.

Run `node scripts/build-resume-workspace.mjs` from the website root before
`node scripts/build-hosting.mjs`. CI does this in both quality and Firebase deploy jobs. GitHub Pages serves the custom domain, so the quality job also packages the complete built site for the Pages deployment job. This switches Pages from raw-branch publishing to an Actions artifact without changing DNS or the custom domain.
Generated vendor bundles and the output directory are not checked in. PDF.js
workers, CMaps, WebAssembly and fonts must remain in the published output.

Firebase uses the public web config already present in `app.html`. No Admin key
belongs in this frontend. Existing owner-only Firestore rules cover
`profiles/{uid}/resumes/{id}` and `profiles/{uid}.resumeWorkspaceProfile`.
The profile write merges only that new field, preserving existing profile data.
No rules are broadened and no public-profile documents are written.

On the company domain, the app calls the additional `workspace:true` mode of the
existing `vcp-proxy/api/claude` function. That mode requires both the existing
server-validated subscription/access-code token and a Firebase ID token verified
with revocation checking. The proxy needs its existing ANTHROPIC_API_KEY,
VCB_SESSION_SECRET and FIREBASE_SERVICE_ACCOUNT_JSON. No new key is required.
The backend uses server-owned instructions, structured tool output and an atomic
Firestore per-user quota (10 requests / 15 minutes). Its counter collection is
server-only under the existing default-deny rules.

The backend module copies `lib/review.mjs` and `public/corrections.js`; keep these
in sync with `vcp-proxy/api/_lib/resume-workspace/` when changing review behavior.
The additional mode lives in the existing function to respect Vercel Hobby
function-count limits. It requires 180 seconds maxDuration.

No automatic cloud saves; no analytics/advertising/social embeds. The local
draft checkbox, AI agreement, cloud storage agreement and explicit save actions
are separate controls. Account changes clear private workspace state. Exported
files and other device copies cannot be recalled. The supplemental privacy page
documents providers, retention, deletion, browser storage and support requests.
Review legal wording for business policy and jurisdiction-specific obligations.

Verification uses fictional resumes, stubbed providers and account fixtures.
Production provider quality, existing Google sign-in and full account deletion
processes remain dependent on the existing company services and support policy.
