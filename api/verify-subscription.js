// Vercel Serverless Function: /api/verify-subscription
// Deploy this to your vcp-proxy Vercel project
// Environment variable required: STRIPE_SECRET_KEY
//
// This endpoint verifies if an email has an active Stripe subscription.
// Called when users click "Already subscribed? Click here to unlock"

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://veterancareerpath.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ active: false, error: "Invalid email" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return res.status(500).json({ active: false, error: "Server configuration error" });
  }

  try {
    // Search for Stripe customer by email
    const customerResp = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email.trim().toLowerCase())}&limit=1`,
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
        sessionId: sub.id,
        plan: sub.items.data[0]?.price?.recurring?.interval || "monthly",
        expiry: sub.current_period_end * 1000, // Convert to ms
      });
    }

    // Check for successful one-time payments (payment links)
    const chargeResp = await fetch(
      `https://api.stripe.com/v1/charges?customer=${customerId}&limit=5`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const chargeData = await chargeResp.json();

    const successfulCharge = chargeData.data?.find(
      (c) => c.paid && !c.refunded && c.amount >= 900 // At least $9 charge
    );

    if (successfulCharge) {
      return res.status(200).json({
        active: true,
        sessionId: successfulCharge.id,
        plan: "one-time",
        expiry: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      });
    }

    return res.status(200).json({ active: false });
  } catch (e) {
    console.error("Stripe verification error:", e);
    return res.status(500).json({ active: false, error: "Verification failed" });
  }
}
