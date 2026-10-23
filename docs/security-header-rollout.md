# Website security headers

GitHub Pages serves VeteranCareerPath.com today. It cannot attach the response
headers from firebase.json. Firebase Hosting already receives the same built site
and is the destination for the header-protected custom domain.

The build now adds an enforced HTML CSP baseline (objects blocked, same-origin
base URLs, HTTPS upgrades) and a referrer policy to every full HTML page. These
protections also work while DNS still points to GitHub Pages. Framing protection,
HSTS and nosniff require real HTTP response headers and are supplied by Firebase.

Firebase additionally enforces frame-ancestors 'self'. The fuller script/resource
allowlist remains Report-Only to avoid breaking existing sign-in, Stripe, analytics
and file-import integrations without a production resource inventory.

## Finish the custom-domain connection

The October 23 deploy was rejected by Google Service Usage: the existing Firebase
deployment service account has Hosting permissions, but lacks
`serviceusage.services.get`. In Google Cloud IAM for project
`veteran-career-builder`, grant that existing service account **Service Usage
Viewer** (`roles/serviceusage.serviceUsageViewer`), then rerun the failed Firebase
deployment job. Do not create another key or grant Owner/Editor to work around it.

Account: `firebase-adminsdk-fbsvc@veteran-career-builder.iam.gserviceaccount.com`.

IAM: https://console.cloud.google.com/iam-admin/iam?project=veteran-career-builder

The public HTTP proof files are present in the Pages artifact, but live checks
return 404 for the ACME challenge paths. Use DNS verification instead of relying
on those files. They are public domain proofs, not API keys.

Add these **TXT** records in GoDaddy, leaving website routing and email records
unchanged. These are the actual Firebase certificate values observed on October
23, 2026. If Firebase later rotates a challenge, use the refreshed workflow summary.

| GoDaddy name | Type | Value |
| --- | --- | --- |
| `_acme-challenge` | TXT | `3NP0HZzACVEAnzTbxZemBZHTCMGTwQaN-6Et9lJ5M-g` |
| `_acme-challenge.www` | TXT | `3vvk9ofmr1xhxlzTjXadoxlQ33ufzv9L7YM8emdSzvY` |

Keep the existing `hosting-site=veteran-career-builder` TXT record.

After Firebase reports CERT_ACTIVE and HTTPS for both names is verified, its
required website routing records are:

| GoDaddy name | Type | Value |
| --- | --- | --- |
| `@` | A | `199.36.158.100` |
| `www` | CNAME | `veteran-career-builder.web.app` |

At that later cutover, replace the four GitHub Pages A records
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
and replace the current `www` CNAME `phocas88.github.io`. Preserve MX and unrelated
TXT/subdomain records. The required values come from Firebase's custom-domain API,
not a generic hosting-IP guess.

1. Open the **Prepare secure website domains** workflow in GitHub Actions. Its
   summary lists Firebase's actual ownership and certificate-verification records
   for veterancareerpath.com and www.veterancareerpath.com. The workflow reuses the
   existing Firebase deployment credential, prepares only these two domain
   resources and never edits DNS.
2. In GoDaddy DNS, add the ownership/certificate verification records shown there.
   Keep the current website A and www CNAME records until the certificate is ready.
   The DNS TXT certificate challenge is required for this rollout because the
   current Pages ACME URLs return 404.
3. Wait for **CERT_ACTIVE**, then verify HTTPS for each hostname against Firebase
   before switching traffic. A successful web.app check alone does not establish
   that the custom-domain certificate is ready.
4. Replace only the website routing records with the values Firebase supplies.
   Preserve MX, email-verification TXT and unrelated subdomain records. No registrar
   transfer or nameserver change is needed.
5. Verify the homepage, app.html and /resumereview/ over the real domain: CSP,
   X-Frame-Options, X-Content-Type-Options, Referrer-Policy and HSTS must be present.
   Check sign-in, existing purchases, imports, review and downloads. Do not create
   a second purchase to test a recovered build.

Until DNS is switched and HTTPS verified, report the domain-level header fix as
pending. The HTML baseline is useful but does not substitute for HTTP headers.

## Rollback

Keep a record of the prior GoDaddy website routing records before changing them.
If a routing problem occurs, restore those exact A/CNAME values. Keep the existing
GitHub Pages deployment and its certificate until the Firebase cutover is verified.
Do not remove the DNS ownership or certificate-verification records while Firebase
is hosting the domain; they may be needed for automatic renewal.
