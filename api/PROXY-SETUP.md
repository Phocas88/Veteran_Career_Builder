# VCP Proxy Server-Side Security Setup

## Overview
The paywall has been hardened on the client side. To complete the security fix,
you need to deploy two new API endpoints to your Vercel proxy (`vcp-proxy`).

## Files to Deploy
Copy these files to your `vcp-proxy` Vercel project's `api/` directory:

1. `validate-code.js` — Server-side access code validation
2. `verify-subscription.js` — Stripe subscription verification

## Environment Variables Required
Set these in your Vercel project settings (Settings > Environment Variables):

### ACCESS_CODES
JSON string containing your access codes. Example:
```
{"OWNER2025":0,"OWNER2026":0,"ALPHA30":1751241600000,"BRAVO30":1751241600000,"TAP2026":1767139200000,"VSO2026":1767139200000}
```
- `0` = permanent access
- Timestamp = expiry in milliseconds (use Date.UTC() to calculate)

### STRIPE_SECRET_KEY
Your Stripe secret key (starts with `sk_live_` or `sk_test_`).
Get it from: https://dashboard.stripe.com/apikeys

## What Changed Client-Side (app.js)
1. Access codes removed from client JavaScript — now validated via `/api/validate-code`
2. "Already subscribed" email bypass now verifies against Stripe via `/api/verify-subscription`
3. `checkAccess()` now rejects `manual-verify` tokens (the old bypass method)
4. `callClaude()` now sends session/email/code headers to proxy for server-side validation
5. Admin panel requires `vcb_admin_verified` in localStorage (not just URL param)
6. PathFinder Pro admin bypass requires a long token (not the hardcoded word "pathfinder")

## Testing
After deploying the proxy endpoints:
1. Clear localStorage in browser DevTools
2. Try using AI tools without paying — should be blocked
3. Try entering a code — should validate against server
4. Try "Already subscribed" — should check Stripe
5. Subscribe via Stripe — should grant access with server-validated token
