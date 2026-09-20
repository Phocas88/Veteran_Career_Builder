# VeteranCareerPath.com — Engineering Handoff

> Purpose: everything a new agent/developer needs to continue this project. Read this
> top-to-bottom before touching anything. Companion doc: `BUILD.md` (build details).

---

## 1. What this is

**VeteranCareerPath.com** — a veteran career-transition platform (~800 static HTML pages
of free resources + a paid React "career tools" app + a public "digital CV" feature).
Founder/owner: **Ruben Mendoza** (`mendozaarmytransition@gmail.com`). Goal: be the most
respected veteran resource site and get **AdSense-approved** (was rejected once for
"low value content" — since remediated).

Owner is a Flutter/Firebase dev on **Windows**. Secrets/API keys must **never** be pasted
in chat — they go into Vercel/Firebase env directly by the owner.

---

## 2. Repositories & local paths

| Repo | Local path | Hosts | Deploy |
|------|-----------|-------|--------|
| `Phocas88/Veteran_Career_Builder` | `C:\dev\Veteran_Career_Builder` | the site (GitHub Pages) | push to `main` → GitHub Actions → Pages |
| `Phocas88/vcp-proxy` | `C:\dev\vcp-proxy` | backend (Vercel) | push to `main` → Vercel auto-deploy |

**Live host is GitHub Pages** (not Firebase Hosting, despite `firebase.json`). Custom
domain `veterancareerpath.com` via `CNAME` file + GoDaddy DNS.
⚠️ Because it's GitHub Pages, **`firebase.json` security headers/CSP are INERT** on the
live site. Only caching applies (`max-age=600`, no per-asset hashing by default).

---

## 3. Architecture (the mental model)

```
Browser ──► veterancareerpath.com (GitHub Pages: static HTML + app.html + app.bundle.js)
   │                                   │
   │  Firebase JS SDK (compat 10.7.0)  │  fetch() with JWT Bearer
   ▼                                   ▼
Firebase (project: veteran-career-builder)     vcp-proxy.vercel.app  (backend, CommonJS)
  • Auth (email/pw + Google)                     /api/claude            (Anthropic proxy)
  • Firestore (profiles, publicProfiles, ...)    /api/verify-subscription (Stripe entitlement → JWT)
                                                 /api/validate-code     (access codes → JWT)
                                                 /api/usajobs           (USAJOBS live feed, public)
                                                 /veteran/:slug         (public profile SSR)
                                                        │
Stripe (live acct_1TDAAvEYZOEiIlw4) ◄──────────────────┘  ($15/mo + one-time)
profiles.veterancareerpath.com ──► Vercel (serves vcp-proxy; branded public-profile URLs)
```

- **Nav/footer are INLINED** across ~800 HTML pages (not a shared partial). Site-wide
  nav/footer/analytics changes require a **script** that edits every file. Shared JS
  behaviors live in `vcp-components.js`, `vcp-scout.js`, `vcp-cookie-consent.js`, etc.
- The React app is a single file `app.js` (~4,900 lines, JSX) compiled to `app.bundle.js`.

---

## 4. Environments & secrets (never paste values in chat)

**Firebase web config** (public, already in `app.html`): project `veteran-career-builder`,
apiKey `AIzaSyDEh2Aivj4q8hVITI60fLZz8uCyP6UV7Os` (embeddable/public — safe), authDomain
`veteran-career-builder.firebaseapp.com`, senderId `664123627374`.

**vcp-proxy env vars (Vercel dashboard)** — REQUIRED; if any drop, endpoints return
HTTP 500 and login / "already subscribed" unlock / code redemption / all AI tools break:
- `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `ACCESS_CODES`, `VCB_SESSION_SECRET`, `USAJOBS_API_KEY`
- Optional: `PROXY_API_KEY`, `OWNER_EMAILS` (comma list; defaults to owner email in code),
  `FIREBASE_API_KEY` (defaults to the public key in code), `USAJOBS_USER_AGENT`.
- Health check: `curl` `/api/validate-code` with a junk code → 500 = env missing, 200 = healthy.

**Firebase Admin service-account key**: JSON in `C:\Users\vince\Downloads\` (filename
`veteran-career-builder-firebase-adminsdk-*.json`). Gitignored pattern. Used for admin
scripts + deploying Firestore rules. Set `GOOGLE_APPLICATION_CREDENTIALS` to its path.
It's a full-admin credential — keep out of the repo; owner should store it deliberately.

**Stripe**: live account `acct_1TDAAvEYZOEiIlw4` ("Veteran To Civilian Career Builder").
Price `price_1TG4XnEYZOEiIlw4uCGchemq` ($15/mo), product `prod_UBqoP1tchr6MRV`. There's a
`$15` one-time option too. **Stripe MCP is READ-ONLY** (writes 403) — cancel/refund in the
Dashboard.

---

## 5. Build & deploy workflow  ⚠️ READ THIS

The app is `app.js` (JSX) → `app.bundle.js` (esbuild 0.28.2, pinned). **Never edit
`app.bundle.js` by hand.**

```
# after editing app.js:
npm run build      # esbuild app.js -> app.bundle.js, THEN stamps app.html with a
                   # content hash: <script src="/app.bundle.js?v=HASH">  (cache-busting)
npm run build:check  # builds + `git diff --exit-code app.bundle.js app.html` (CI parity)
```
- **Commit `app.js` + `app.bundle.js` + `app.html` together** (the stamp changes app.html).
- CI (`.github/workflows/deploy.yml`) re-runs `npm run build` and fails if
  `app.bundle.js`/`app.html` are out of sync. esbuild is deterministic Windows↔Linux;
  `stamp-bundle.mjs` is idempotent, so CI stays green.
- `.gitattributes` LF-pins `app.bundle.js` (+ `app.js`) so hashes match across OSes.
- **Cache-busting** (PR #49): before this, deploys were served stale for 10+ min. Now the
  `?v=HASH` changes every build so browsers fetch fresh JS. app.html itself still has a
  ~10-min GitHub Pages cache (unavoidable), then picks up the new hash.

**Standard PR flow used in this project** (owner wants merged PRs, not direct-to-main):
```
git fetch origin main && git checkout -b <branch> origin/main
# edit, npm run build
git add app.js app.bundle.js app.html   # (+ other files)
git commit -m "..."   # end message with: Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
git push origin HEAD:<branch>
gh pr create --head <branch> --base main --title "..." --body "..."
gh pr merge <PR#> --squash --delete-branch
```
Use `export MSYS_NO_PATHCONV=1` in Git Bash for `git show origin/main:path` etc.
`vcp-proxy` is committed directly to `main` (solo repo, Vercel auto-deploys on push).

---

## 6. Key subsystems

### 6a. Access / paywall model
- **Server-enforced** (real gate): `vcp-proxy /api/verify-subscription` checks Stripe by
  email or stored session id → issues a signed JWT (`_lib/session.js`). `/api/claude`
  requires that Bearer token. So AI usage is truly gated server-side.
- **Client gate (UI only, bypassable)**: `checkAccess()` reads `localStorage.vcb_access`
  (must be `serverValidated:true`, Stripe-format id, not expired). `hasAccess` state
  drives the paywall UI. Restored on load by `restorePaidAccessFromProfile()` which calls
  verify-subscription with **both** email + stored id (PR #46).
- **Owner allowlist** (PR, verify-subscription.js): `OWNER_EMAILS` (default
  `mendozaarmytransition@gmail.com`) always get a full entitlement, independent of Stripe.
  Subject is `sub_owner<email>` so the client's format guards accept it.
- **Access codes**: `ACCESS_CODES` env (JSON map) validated by `/api/validate-code`.

### 6b. AI tools
- Main app: 16 AI tools across tabs. `callClaude(prompt, system, maxTokens)` → `/api/claude`.
  Proxy caps `max_tokens` at **3000** (`assets/js/vcb-secure-api.js` clamps client-side too).
- Standalone tool pages (`tools-*.html`) use `assets/js/ai-tool-shell.js` — a shared shell
  with a `#vcp-gate` paywall that hides `#tool-content` when unauthorized. 8/9 gate
  correctly. `va-claim-builder.html` was intentionally removed (see 6e).

### 6c. Public Veteran Profiles ("digital CV") — the big recent feature
Opt-in shareable profile a subscriber publishes to share on LinkedIn / with employers.
- **Data**: separate world-readable `publicProfiles/{slug}` Firestore collection holding
  ONLY sanitized, owner-chosen fields. **Never** disability rating or VA claim data.
- **In-app UI**: `PublicProfileCard` in `app.js`, on the **Saved Work** tab (tab 5).
  Auto-builds from the user's Service Record: "What to include" section toggles (Military
  N roles / Civilian N jobs / Education / Skills, on by default with counts); "Contact &
  visibility" toggles (location/email/phone/linkedin/noindex, OFF by default); headline &
  summary auto-generated (editable in a collapse). Publish/Update/Unpublish/Copy.
  `slug = kebab(name)-<last5 of uid>`. Bullets pull duties, `_operations/_improvement/
  _communication/_compliance`, deployments, additionalDuties, awards (PR #50/#51).
- **Rendering**: `vcp-proxy/api/veteran/[slug].js` server-renders the page (real OG
  preview cards) — reads the public doc via **Firestore REST + public API key** (no
  service account). Hero uses the **branch emblem** (`SITE/img/optimized/<branch>.webp`),
  timeline experience, skill chips, footer CTA. Edge cache 60s (fast unpublish).
- **Firestore rule** (`firestore.rules`): `publicProfiles/{slug}` read: if true; create/
  update/delete only by owner uid. **Must be deployed** (see 6f).
- **Branded URL**: `profiles.veterancareerpath.com` → Vercel. GoDaddy CNAME `profiles`
  → `4c3d63967a165a11.vercel-dns-017.com` (project-specific value). **Do NOT** use
  Vercel's "nameserver" option — it would move ALL DNS off GoDaddy and break the apex.
  `PublicProfileCard`'s `BASE` const = `https://profiles.veterancareerpath.com/veteran/`.

### 6d. Cookie consent (PR #42)
`vcp-cookie-consent.js` banner (Essential always-on / Analytics / Advertising toggles,
Accept all / Reject / Customize, re-openable via footer "Cookie Preferences"). **Google
Consent Mode v2** default-deny snippet injected inline before the GA (`G-CMFKLT321J`)
tag on all **224** analytics pages. Required before AdSense serves in EEA/UK.

### 6e. VA claim tool — REMOVED (legal) (PR #42)
`va-claim-builder.html` was abandoned (VA claim prep is legally restricted to accredited
reps — 38 U.S.C. §5901/§5904). All 222 links removed, dropped from sitemap, page →
noindex redirect to `va-disability-rating-schedule.html` (the calculators are kept).
**Do not re-add any claim-building tool.** Education-only + "find an accredited rep" is OK.

### 6f. Firestore data model + rules
- `profiles/{uid}` (owner-isolated) — `personal`, `milExperiences[]`, `civExperiences[]`,
  `education[]`, `skills{}`, `target{}`, `serviceRecords[]`, plus `stripeSession`,
  `accessExpiry`, `plan`. Subcollections: `resumes`, `coverLetters`, `emails`, `scores`.
- `publicProfiles/{slug}` — public read, owner write (see 6c).
- `email_subscribers` — anon create, admin read/update/delete.
- Legacy community collections (`stories`, `successStories`, `salaries`, `salaryData`) —
  admin-only.
- **Deploy rules**: `GOOGLE_APPLICATION_CREDENTIALS=<key> firebase deploy --only
  firestore:rules --project veteran-career-builder` (the admin-SDK SA can deploy rules).
  Rules do NOT auto-deploy with the site.

### 6g. MOS consolidation (PRs #34–35, done)
561 thin `/mos/*.html` → ~1KB noindex redirect stubs → 18 civilian career-cluster pages
(`veteran-*-careers.html`). 6 branch hubs (`army-mos-careers.html` etc.) route 595 MOS
cards to clusters. Sitemap 768→207 URLs. Classifier: `scratchpad/mos_classify.py`.

---

## 7. Admin scripts (`scripts/`, need firebase-admin + GOOGLE_APPLICATION_CREDENTIALS)

- `find-user-data.mjs <email>` — find all Firebase accounts for an email, report which
  holds data, write a JSON backup to `./data-backups/` (gitignored; contains PII).
- `merge-user-data.mjs <src> <tgt> [--apply]` — additive, dry-run-by-default account merge.
- `scan-profiles.mjs [terms...]` — list all profiles, highlight matches.
- `audit-subscriber-resumes.mjs <emails...>` — per-email: account? inputs? saved resumes?
- `export-profile.mjs <backup.json> <out.md>` — render a backup into a clean Markdown CV.
- `set-admin-claim.mjs <uid|email>` — grant `admin:true` custom claim.
- `stamp-bundle.mjs` — build step; cache-busts app.html (don't run manually).
- Run: `npm i firebase-admin` (dev only; NOT in package.json — keep CI lean).
- `scripts/build-hosting.mjs` runs in CI (see deploy.yml).

---

## 8. Recent work log (this engagement)

| PR | What |
|----|------|
| #34–35 | MOS consolidation (branch hubs → clusters; thin pages → redirect stubs) |
| #36 | app.js bug audit — 9 correctness fixes (exp.currently, split, token cap, formatGuide, etc.) |
| #37/#38 | Firebase user-data recovery + subscriber-audit admin scripts |
| #39 | Honest copy — removed false "free"/"free trial" claims on paid tools |
| #40 | Require sign-in before the Service Record builder (tab 0) |
| #41 | Stop defaulting new profiles to Army / Active Duty (empty + "Select…") |
| #42 | Compliance — removed VA claim tool; added cookie consent + Consent Mode v2 |
| #43/#44 | Public profiles — Firestore rules + in-app publish UI |
| #45 | Gate all tabs behind sign-in; branded profile URL; mobile cookie banner |
| #46 | Restore paid access reliably (send email+sessionId; clear sub-check cache) |
| #47 | Clear profile fields when session lost (fix "half signed in") |
| #48 | Redesign public-profile card (auto-fill + readable contrast) |
| #49 | Cache-bust app.bundle.js (stop stale JS after deploys) |
| #50/#51 | Public profile includes duties/deployments/awards + clean bullet parsing |
| #52/#53 | Public-profile card: persist published state; fix mount-timing race |
| vcp-proxy | `/veteran/:slug` SSR endpoint + redesign (emblem hero, chips, timeline); owner allowlist |

Also: refunded/cancelled duplicate subscriptions for a customer (Miguel Figueroa,
`gforceangel@yahoo.com` — 3 accidental subs cancelled, 1 kept); confirmed subscriber
resume-data status; deployed Firestore rules; set up the `profiles.` subdomain.

---

## 9. Known issues / gotchas

- **AVG antivirus** on the owner's PC does local **HTTPS MITM**, which breaks Firebase
  auth persistence (login drops on refresh) and can block gstatic/googleapis. **Desktop-
  only** — mobile works fine. Fix = AVG Web Shield exceptions for `veterancareerpath.com`,
  `*.googleapis.com`, `*.gstatic.com`, `*.firebaseapp.com`. Not a code bug.
- **GitHub Pages** ignores `firebase.json` headers/CSP (inert). Caching is `max-age=600`.
- **DNS at GoDaddy**: apex → GitHub Pages IPs `185.199.108–111.153`; `profiles` subdomain
  → Vercel CNAME. **Keep GoDaddy "Domain Forwarding" OFF** (it injected parking IPs and
  caused an outage before). Never use Vercel's nameserver option for a subdomain.
- **Public profiles are snapshots** — after editing the Service Record, the user must
  **re-publish** to refresh the live page (privacy-by-design; the SSR endpoint only reads
  the sanitized public doc, never the private profile).
- **Firestore rules don't auto-deploy** with the site — deploy manually (6f).

---

## 10. Pending / TODO

- **AdSense re-review**: resubmit sitemap in Search Console; wait ~1–2 weeks; then request
  AdSense review. Cookie consent (Consent Mode v2) is now in place as a prerequisite.
- Owner may want profile polish: **awards as gold medal chips**, section reordering, cover
  banner, optional photo upload.
- Owner's 2nd military role (IT Specialist) has no `duties` filled — data, not code.
- `set-admin-claim.mjs` — owner can grant themselves `admin:true` if needed for admin UI.
- Consider user-scoping `localStorage` keys (`vcb_jobs`/`vcb_timeline`/`vcb_saved_paths`)
  — currently not per-user (cross-user bleed on shared devices). Flagged, not fixed.

---

## 11. How to do common things

- **Change the React app**: edit `app.js` → `npm run build` → commit `app.js` +
  `app.bundle.js` + `app.html` → PR.
- **Change the public-profile page design**: edit `vcp-proxy/api/veteran/[slug].js` →
  `node --check` → commit/push to vcp-proxy `main` (auto-deploys).
- **Site-wide HTML change** (nav/footer/meta): write a Python script over `*.html`
  (see `scratchpad/` patterns) since markup is inlined everywhere.
- **Deploy Firestore rules**: `GOOGLE_APPLICATION_CREDENTIALS=<key> firebase deploy
  --only firestore:rules --project veteran-career-builder`.
- **Diagnose "logged out / no access"**: curl `/api/validate-code` (500=env missing);
  check `verify-subscription` returns `active:true` for the email; confirm `vcb_access`
  in localStorage; on desktop suspect AVG.

---

## 12. Key file map

```
Veteran_Career_Builder/
  app.html                     # React app shell (Firebase init, gtag, loads app.bundle.js?v=)
  app.js                       # the app (JSX, ~4900 lines) — EDIT THIS
  app.bundle.js                # esbuild output — generated, don't hand-edit
  firestore.rules              # Firestore security rules (deploy manually)
  firebase.json                # INERT on GitHub Pages (headers ignored)
  generate-sitemap.py          # sitemap (excludes mos/)
  vcp-cookie-consent.js        # cookie banner + Consent Mode v2
  vcp-components.js, vcp-scout.js, assets/js/ai-tool-shell.js, assets/js/vcb-secure-api.js
  scripts/                     # admin + build scripts (see §7)
  data-backups/                # gitignored — user PII backups
  .github/workflows/deploy.yml # CI: build + drift check + Pages deploy
  BUILD.md, HANDOFF.md         # docs

vcp-proxy/
  api/claude.js, verify-subscription.js, validate-code.js, usajobs.js
  api/veteran/[slug].js        # public profile SSR
  api/_lib/session.js          # JWT signing/verify
  vercel.json                  # function config + /veteran/:slug rewrite
```

---

_Last updated: 2026-09-19. Current bundle stamp: `app.bundle.js?v=136f6a96cd`. Latest PR: #53._
