// Vercel Serverless Function: /api/validate-code
// Deploy this to your vcp-proxy Vercel project
// Environment variable required: ACCESS_CODES (JSON string of code map)
//
// Example ACCESS_CODES env var:
// {"OWNER2025":0,"OWNER2026":0,"ALPHA30":1751241600000,"TAP2026":1767139200000}
//
// 0 = permanent, timestamp = expiry date in milliseconds

export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://veterancareerpath.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ valid: false, reason: "invalid" });
  }

  const c = code.trim().toUpperCase();

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
