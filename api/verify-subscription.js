// Vercel Serverless Function: /api/verify-subscription
// Environment variable required: STRIPE_SECRET_KEY
//
// Verifies if an email has an active Stripe subscription.

// In-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 attempts per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// Basic email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    "https://veterancareerpath.com",
    "https://www.veterancareerpath.com"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limiting
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ active: false, error: "Too many requests. Try again in 60 seconds." });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    return res.status(400).json({ active: false, error: "Invalid email" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return res.status(500).json({ active: false, error: "Server configuration error" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Search for Stripe customer by email
    const customerResp = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(normalizedEmail)}&limit=1`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const customerData = await customerResp.json();

    if (!customerData.data || customerData.data.length === 0) {
      return res.status(200).json({ active: false });
    }

    const customerId = customerData.data[0].id;

    // Check for active subscriptions
    const subResp = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const subData = await subResp.json();

    if (subData.data && subData.data.length > 0) {
      const sub = subData.data[0];
      return res.status(200).json({
        active: true,
        plan: sub.items.data[0]?.price?.recurring?.interval || "monthly",
        expiry: sub.current_period_end * 1000,
      });
    }

    // Check for successful one-time payments matching VCP product
    const chargeResp = await fetch(
      `https://api.stripe.com/v1/charges?customer=${customerId}&limit=5`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const chargeData = await chargeResp.json();

    const successfulCharge = chargeData.data?.find(
      (c) => c.paid && !c.refunded && c.amount >= 900
    );

    if (successfulCharge) {
      // Grant 1 year from charge date, not from now
      const chargeDate = successfulCharge.created * 1000;
      const expiryDate = chargeDate + 365 * 24 * 60 * 60 * 1000;

      // Check if the charge-based access has expired
      if (Date.now() > expiryDate) {
        return res.status(200).json({ active: false });
      }

      return res.status(200).json({
        active: true,
        plan: "one-time",
        expiry: expiryDate,
      });
    }

    return res.status(200).json({ active: false });
  } catch (e) {
    console.error("Stripe verification error:", e);
    return res.status(500).json({ active: false, error: "Verification failed" });
  }
}
