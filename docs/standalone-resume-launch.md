# Veteran Resumes: public website and workspace

The public site is `https://veteranresumes.com/`; its guided workspace is `/app/`. The root keeps compatibility assets for open editors and redirects recognized old purchase/deep links in `website-routing.mjs`. The PWA keeps its original `/index.html` identity and now starts at `/app/`. Account, guest, draft, analytics and payment identifiers remain unchanged on the same origin. No user documents are moved or deleted by the layout change.

Public sample PDFs and full-page PNGs come only from the reviewed fictional Alex Carter fixture and the application's actual exporters. `render-website-examples.mjs` checks the rendered content and page count. Native template previews still use the real renderer. `playwright.website.config.mjs` verifies the public gallery, consent, app entry, recovery links and installed launch; existing app journeys continue through the normal quality gate.

The app can be installed from its HTTPS website on supported phone and desktop browsers. The Install app control uses the browser's installation prompt when available and otherwise provides short Android, iPhone/iPad and computer instructions. No Android APK or store listing is included in this release.

The manifest, icons and worker use relative URLs. They work under `/resumereview/` today and `/` on a future app domain. Only public offline help, installation CSS and icons enter the worker cache. Private requests, payments, AI requests, account documents and analytics are not cached by the worker. Internet access is required for those services. The offline page explains how to reconnect.

## Prepare the separate website

After the normal workspace build, run `node scripts/build-standalone-resume.mjs`. It creates `/tmp/vcp-resume-standalone` containing the public app, bundled document engines, library data, fonts and install assets. The GitHub quality workflow uploads this as `vcp-resume-standalone`. The bundle excludes private source, secrets and account records.

When the final domain is owned and ready, set `VCP_APP_ORIGIN` to its exact HTTPS origin for this build. It sets the app canonical and completion-share links in the standalone copy. It does not buy or connect the domain, change DNS, authorize the host in Firebase or configure the backend.

## Launch checks after domain purchase

1. Connect the new domain to a separate frontend deployment, preserve existing mail/DNS records and verify HTTPS. Keep the old app accessible while checking the new host.
2. Retain the existing Firebase project and account UIDs so signed-in profiles, purchases and documents stay with their owners. Add the new host to Firebase Authentication's authorized domains and verify Google and email sign-in.
3. Add the exact new origin to the backend allowlists in `api/_lib/resume-program.js` and `api/claude.js`. Update `sitePath` for new-domain root checkout returns. Check cover-letter and additional-template checkout/recovery. Never enable wildcard origins or accept an arbitrary return URL from a request.
4. Add the new parent origin to the consented analytics bridge in `api/_lib/resume-analytics.js` and activity collector as needed; retain the same owner-selected analytics dashboard and privacy behavior.
5. Decide whether Virtual CV links keep the existing profiles host or receive their own verified app-domain route. Update public branding, support/legal links and social metadata after that decision.
6. Test guest and account purchases, a 100% discount, failed-build recovery, saved document download, cover letters, profile editing, Virtual CV updates and the install/offline flow on the new origin. Existing receipts and shared links must keep working.
7. Users must sign in again on the new origin. Device-only drafts and guest browser identity do not automatically transfer between domains. Provide an export/account-linking transition before redirecting the old app.

## Domain and launch status, November 6, 2026

The owner confirms purchasing `VeteranResumes.com`. Authoritative DNS is currently at GoDaddy (`ns47.domaincontrol.com` and `ns48.domaincontrol.com`). Connect only the apex and www website records returned for the new Vercel project; preserve mail and other DNS records. The original main website and app remain accessible while this separate deployment is checked.

The dedicated `veteran-resumes` Vercel project uses the repository's root `vercel.json`. It builds the library, document engines and full template examples, then packages only the public app into `resume-website` with canonical/share links pointing at `https://veteranresumes.com/`. It retains the existing account database and API. Adding DNS does not itself authorize Google sign-in: add `veteranresumes.com`, `www.veteranresumes.com` and the project's stable Vercel hostname to Firebase Authentication → Settings → Authorized domains. Keep the previous authorized hosts. Confirm any Google API-key referrer restrictions also accept the new site. Do not redirect the previous app until guest purchases and device-only drafts have a transition path.

This is not trademark clearance. Preliminary web searches did not verify a specific exact-name conflicting registration, and the interactive USPTO trademark database was not readable through the research tool. A clearance search should cover similar names for related resume/career services and software, federal pending/registered marks and earlier common-law uses. The proposed wording appears descriptive of the service and may be harder to protect exclusively; that is a preliminary assessment, not a legal opinion.

Sources: [USPTO comprehensive clearance guidance](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks), [USPTO trademark strength](https://www.uspto.gov/trademarks/basics/strong-trademarks), and [MDN installation guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
