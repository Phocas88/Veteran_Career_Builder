// Vercel Serverless Function: /api/validate-code
// Environment variable required: ACCESS_CODES (JSON string of code map)
//
// Example ACCESS_CODES env var:
// {"OWNER2025":0,"OWNER2026":0,"ALPHA30":1751241600000,"TAP2026":1767139200000}
//
// 0 = permanent, timestamp = expiry date in milliseconds

// In-memory rate limiter (resets per cold start, but effective per instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per minute per IP

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

export default function handler(req, res) {
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
    return res.status(429).json({ valid: false, reason: "rate_limited", retryAfter: 60 });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== "string" || code.length > 50) {
    return res.status(400).json({ valid: false, reason: "invalid" });
  }

  const c = code.trim().toUpperCase();

  // Reject obviously invalid codes (alphanumeric only, 4-30 chars)
  if (!/^[A-Z0-9]{4,30}$/.test(c)) {
    return res.status(200).json({ valid: false, reason: "invalid" });
  }

  // Load codes from environment variable (NOT client-side)
  let codesMap = {};
  try {
    codesMap = JSON.parse(process.env.ACCESS_CODES || "{}");
  } catch (e) {
    console.error("Failed to parse ACCESS_CODES env var:", e);
    return res.status(500).json({ valid: false, reason: "error" });
  }

  if (!(c in codesMap)) {
    return res.status(200).json({ valid: false, reason: "invalid" });
  }

  const expiry = codesMap[c];
  if (expiry === 0) {
    return res.status(200).json({ valid: true, reason: "permanent" });
  }
  if (Date.now() > expiry) {
    return res.status(200).json({ valid: false, reason: "expired" });
  }
  return res.status(200).json({ valid: true, reason: "timed", expiry });
}
