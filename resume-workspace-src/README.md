# Veteran Career Path independent resume program

The source builds into /resume-workspace for Firebase Hosting and the GitHub Pages artifact that serves veterancareerpath.com. Run node scripts/build-resume-workspace.mjs and node scripts/build-hosting.mjs from the repository root. Source, tests and server libraries are not copied into the public artifact.

Free program accounts use a named Firebase app session, independent of main-site subscription access. Authentication identities share the veteran-career-builder project, so existing emails sign in/reset instead of creating a duplicate identity. Program background and saved editor data use profiles/{uid}/resumeProgram/background and profiles/{uid}/resumeProgramResumes/{id}. Existing owner-only rules apply. Do not change billing entitlements in client-writable paths.

AI builds cost $1.99 USD through the existing Stripe account. The matching server implementation lives in Phocas88/vcp-proxy api/_lib/resume-program.js, dispatched through the existing /api/claude function with workspace:true. No additional Hobby function, Stripe subscription or new webhook is required. STRIPE_SECRET_KEY and FIREBASE_SERVICE_ACCOUNT_JSON are already provisioned. The configured production AI uses ANTHROPIC_API_KEY; optional OPENAI_API_KEY selects OpenAI. Both providers are disclosed where used. All keys remain server-side.

Private build records live under _privateResumeProgramUsers/{uid}/builds/{hash}, excluded from client access by existing default-deny rules. Checkout requires explicit recovery-storage agreement. The server binds input/context to owner, sets the price, verifies payment with Stripe directly, serializes executions with a lease, saves successful results and leaves failed builds retryable. Returning or refreshing never needs a second payment for that build. Purchase history can reopen/delete build input and result; minimal accounting records remain.

Structured military fields mirror the full app's service schema, including MOS roles, clearance opt-in/status, identifiers, additional duties, awards and deployments. Civilian jobs, education, certificates, training, skills, languages and projects are repeatable structured entries. Facts and credential status are never inferred. Legacy saved drafts remain readable.

Privacy, cookies and one-time purchase terms are in public/privacy.html, public/cookies.html and public/terms.html, with matching company policy supplements. Functional verification uses fictional data and fake payment/provider responses; real card payments are never made by tests.
