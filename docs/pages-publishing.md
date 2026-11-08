# Publish the generated resume app once

GitHub Pages must use **GitHub Actions** as its publishing source. The source branch does not include generated app dependencies. The automatic branch publisher can otherwise replace the built site on each main-branch commit until the custom build finishes.

In [repository Pages settings](https://github.com/Phocas88/Veteran_Career_Builder/settings/pages), set **Build and deployment → Source → GitHub Actions**. Keep the custom domain as VeteranCareerPath.com. This is a repository administration setting; the connected GitHub code tools cannot edit it. No DNS or Firebase changes are needed.

The `publish-pages` job checks this setting, deploys the tested `.firebase-public` artifact, then compares the exact current release files on VeteranCareerPath.com and VeteranResumes.com. Expected hashes are derived from the checked-out source and the same HTML transforms used by the builds. Changes to cache-version query strings or private function names do not require hand-editing this check. Old or missing assets still fail verification. Missing-token checks continue to protect billing, app reports, feedback and letter purchases.

`resumereview/analytics-guide.html` and its stylesheet are also committed so the owner guide stays available if a legacy publisher runs. The independent Firebase mirror job can fail without preventing GitHub Pages or Vercel publication; it is still checked and is not silently disabled.

## Firebase mirror publication

The workflow uses the existing `FIREBASE_SERVICE_ACCOUNT` repository secret for project/site `veteran-career-builder`. `scripts/check-firebase-hosting-access.mjs` checks Google authentication, the Hosting get/update permissions and access to the actual Hosting API before building the mirror. It logs only project/account identifiers and bounded permission results. It never prints the credential JSON, private key, assertion, access token or raw provider response, and it never changes IAM or enables APIs.

The initial read-only diagnosis accepted the key for `firebase-adminsdk-fbsvc@veteran-career-builder.iam.gserviceaccount.com`. Its Hosting permissions were present, but the Firebase CLI's Service Usage/API-key inspection rights were absent. The account cannot manage project IAM. A subsequent read-only request to the documented Hosting API returned HTTP 200 for the intended site with the same credential. No extra role or replacement key is needed for this publisher.

`scripts/deploy-firebase-hosting.mjs` uses Firebase's supported Hosting REST flow: create a version, populate all file hashes in batches of at most 1,000, upload the required gzip bytes, finalize, then create the live release. It preserves `firebase.json` headers, redirects, clean URLs and trailing-slash behavior. Unsupported future configuration fails explicitly. It uploads only `.firebase-public`, honors the dot-file ignore rule, rejects symlinks, limits concurrency and cleans task-owned compressed files on success or failure. Authentication goes only to pinned Google HTTPS endpoints; redirects are rejected. Failed uploads or finalization cannot release an incomplete version.

The Firebase job serializes live deployments independently of GitHub Pages. Its strict preflight must report `ready: true`, the actual release must succeed, and `scripts/verify-firebase-hosting.mjs` must match eight public files against the tested build and check the authentication-compatible security headers before the job passes. This does not change DNS, Firebase Authentication, databases or IAM. If Hosting itself denies access, the job fails with a bounded error; it is never marked green by suppressing the error.

References: [Firebase Hosting REST deployment guide](https://firebase.google.com/docs/hosting/api-deploy) and [ServingConfig schema](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions#ServingConfig).
