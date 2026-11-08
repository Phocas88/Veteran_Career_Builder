# Publish the generated resume app once

GitHub Pages must use **GitHub Actions** as its publishing source. The source branch does not include generated app dependencies. The automatic branch publisher can otherwise replace the built site on each main-branch commit until the custom build finishes.

In [repository Pages settings](https://github.com/Phocas88/Veteran_Career_Builder/settings/pages), set **Build and deployment → Source → GitHub Actions**. Keep the custom domain as VeteranCareerPath.com. This is a repository administration setting; the connected GitHub code tools cannot edit it. No DNS or Firebase changes are needed.

The `publish-pages` job checks this setting, deploys the tested `.firebase-public` artifact, then compares the exact current release files on VeteranCareerPath.com and VeteranResumes.com. Expected hashes are derived from the checked-out source and the same HTML transforms used by the builds. Changes to cache-version query strings or private function names do not require hand-editing this check. Old or missing assets still fail verification. Missing-token checks continue to protect billing, app reports, feedback and letter purchases.

`resumereview/analytics-guide.html` and its stylesheet are also committed so the owner guide stays available if a legacy publisher runs. The independent Firebase mirror job can fail without preventing GitHub Pages or Vercel publication; it is still checked and is not silently disabled.

## Firebase mirror permissions

The workflow uses the existing `FIREBASE_SERVICE_ACCOUNT` repository secret for project `veteran-career-builder`. `scripts/check-firebase-hosting-access.mjs` checks Google authentication, the needed Hosting/service-inspection/API-key read permissions and whether the Hosting API is enabled before building the mirror. It logs only project/account identifiers and bounded permission results. It never prints the credential JSON, private key, assertion, access token or raw provider response, and it never changes IAM or enables APIs.

The initial read-only diagnosis accepted the key for `firebase-adminsdk-fbsvc@veteran-career-builder.iam.gserviceaccount.com`. Its Hosting permissions were present. `serviceusage.services.get` and API-key list access were absent, and it could not manage project IAM.

In [Google Cloud IAM for this project](https://console.cloud.google.com/iam-admin/iam?project=veteran-career-builder), a project owner should keep the account's existing roles and add **Service Usage Viewer** (`roles/serviceusage.serviceUsageViewer`) and **API Keys Viewer** (`roles/serviceusage.apiKeysViewer`). The former covers the observed service-inspection denial; the latter is documented by the Firebase deploy action for CLI deployments. Do not grant Owner or Editor to repair these read permissions. No new service-account key is needed.

After the role change, rerun the Firebase deployment job. The strict preflight must report `ready: true`, and the actual Firebase deployment must succeed before calling the mirror repaired. An unknown or disabled API state does not pass. If Google's account permissions cannot be changed by the connected credentials, the owner action remains explicit.

References: [Firebase action service-account setup](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md) and [Google Service Usage roles](https://docs.cloud.google.com/iam/docs/roles-permissions/serviceusage).
