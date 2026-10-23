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

1. Open the **Prepare secure website domains** workflow in GitHub Actions. Its
   summary lists Firebase's actual ownership and certificate-verification records
   for veterancareerpath.com and www.veterancareerpath.com. The workflow reuses the
   existing Firebase deployment credential, prepares only these two domain
   resources and never edits DNS.
2. In GoDaddy DNS, add the ownership/certificate verification records shown there.
   Keep the current website A and www CNAME records until the certificate is ready.
   If Firebase supplies an HTTP challenge, its exact path and public verification
   value are shown as an alternative to DNS certificate verification.
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
