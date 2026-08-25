# VCP Proxy Server-Side Security Setup

## Required Vercel environment variables

Set these on the `Phocas88/vcp-proxy` Vercel project for Production and Preview:

- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `ACCESS_CODES`
- `VCB_SESSION_SECRET`

`VCB_SESSION_SECRET` must be a random secret of at least 32 characters. A 64-byte random value is recommended.

Optional:

- `VCB_SESSION_TTL_SECONDS` defaults to 7200 seconds and is capped at 24 hours.
- `ONE_TIME_EXPIRY_DAYS` defaults to 365 days.
- `ANTHROPIC_ALLOWED_MODELS` is a comma-separated model allowlist. If omitted, only `claude-haiku-4-5-20251001` is allowed.

## Important

`PROXY_API_KEY` is no longer used as a browser-shared secret. Do not place a Vercel proxy secret, Anthropic key, or Stripe secret in `app.js`, `app.html`, localStorage, sessionStorage, cookies, or Firebase-hosted files.

## Authentication flow

1. `/api/validate-code` validates an access code server-side.
2. `/api/verify-subscription` validates a Stripe checkout session or subscriber email server-side.
3. Either endpoint returns a short-lived HMAC-signed VCP session token after entitlement is verified.
4. The browser stores only that short-lived token in `sessionStorage`.
5. `/api/claude` requires and validates the signed token before it sends any request to Anthropic.
6. `/api/claude` restricts models and caps `max_tokens`.

## Deployment order

Deploy `vcp-proxy` first. Then deploy `Veteran_Career_Builder`.

If the main site is deployed first, AI requests will fail securely until the proxy supports signed sessions.

## Verification

After deployment:

1. Clear `vcb_access`, `vcb_server_session`, and any old `vcb_admin_key` browser storage.
2. Confirm `/api/claude` returns HTTP 401 without a VCP signed session.
3. Validate a real access code and confirm a token is returned.
4. Complete a Stripe test checkout and confirm the checkout session is verified server-side.
5. Confirm AI works only after one of those entitlement checks.
6. Confirm entering a fake `stripe_success=1&session_id=...` URL does not grant access.
