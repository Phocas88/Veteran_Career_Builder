import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.argv[2] || '.');
const appJsPath = path.join(repoRoot, 'app.js');
const appHtmlPath = path.join(repoRoot, 'app.html');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate ${label}`);
  }
  return source.slice(0, start) + replacement + '\n' + source.slice(end);
}

function replaceFunction(source, signatureText, replacement, label) {
  const start = source.indexOf(signatureText);
  if (start < 0) throw new Error(`Could not locate ${label}`);

  const openBrace = source.indexOf('{', start);
  if (openBrace < 0) throw new Error(`Could not locate opening brace for ${label}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openBrace; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(0, start) + replacement + source.slice(i + 1);
      }
    }
  }

  throw new Error(`Could not locate closing brace for ${label}`);
}

let appJs = read(appJsPath);

const apiReplacement = `// ── SECURE AI API ───────────────────────────────────────────────────────────
const PROXY_URL = window.VCB_PROXY_URL || "";

function isApiKeySet() {
  return Boolean(window.VCBSecureApi && window.VCBSecureApi.isConfigured());
}

function getStoredApiKey() {
  // Browser-side Anthropic keys are intentionally disabled.
  return "";
}

async function callClaude(prompt, system = "", maxTokens = 2000) {
  if (!window.VCBSecureApi) {
    throw new Error("AI security module failed to load.");
  }
  return window.VCBSecureApi.callClaude(prompt, system, maxTokens);
}`;

appJs = replaceBetween(
  appJs,
  '// ── API KEY CHECK',
  '// ── DATE PICKER COMPONENT',
  apiReplacement,
  'legacy API-key / callClaude block'
);

const codeValidationReplacement = `async function isCodeValid(code) {
  if (!window.VCBSecureApi) {
    return { valid: false, reason: "error" };
  }
  return window.VCBSecureApi.validateCode(code);
}`;

appJs = replaceFunction(
  appJs,
  'async function isCodeValid(code)',
  codeValidationReplacement,
  'isCodeValid'
);

write(appJsPath, appJs);

let appHtml = read(appHtmlPath);

// Browser metadata must never be treated as verified entitlement by UI checks.
appHtml = appHtml.replace(
  '(acc.type==="paid" && acc.stripeSession && acc.expiry>Date.now()) || (acc.type==="code" && acc.code);',
  '(acc.type==="paid" && acc.stripeSession && acc.expiry>Date.now() && acc.serverValidated===true) || (acc.type==="code" && acc.code && acc.serverValidated===true);'
);
appHtml = appHtml.replace(
  "_isSub = (_acc.type==='paid'&&_acc.stripeSession&&_acc.expiry>Date.now())||(_acc.type==='code'&&_acc.code);",
  "_isSub = (_acc.type==='paid'&&_acc.stripeSession&&_acc.expiry>Date.now()&&_acc.serverValidated===true)||(_acc.type==='code'&&_acc.code&&_acc.serverValidated===true);"
);

if (!appHtml.includes('/assets/js/vcb-secure-api.js')) {
  const insertionPoint = '<button id="admin-btn"';
  const index = appHtml.indexOf(insertionPoint);
  if (index < 0) throw new Error('Could not locate legacy admin panel');
  appHtml =
    appHtml.slice(0, index) +
    '<script src="/assets/js/vcb-secure-api.js"></script>\n  ' +
    appHtml.slice(index);
}

const legacyAdminStart = appHtml.indexOf('<button id="admin-btn"');
const reactScriptMarker = '<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"';
const reactStart = appHtml.indexOf(reactScriptMarker, legacyAdminStart);

if (legacyAdminStart < 0 || reactStart < 0) {
  throw new Error('Could not locate legacy admin/bootstrap block');
}

const safeBootstrap = `<script>
    // Remove credentials left behind by the legacy browser API-key admin panel.
    try {
      localStorage.removeItem("vcb_admin_key");
      sessionStorage.removeItem("vcb_admin_key");
      document.cookie = "vcb_ak=; Max-Age=0; path=/; SameSite=Lax";
    } catch (_) {}

    async function checkStripeReturn() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const success = params.get("stripe_success");

      if (success !== "1" || !sessionId) return;

      const result = window.VCBSecureApi
        ? await window.VCBSecureApi.verifySubscription({ sessionId })
        : { active: false };

      window.history.replaceState({}, document.title, window.location.pathname);

      if (!result.active) {
        console.error("Stripe checkout return could not be verified.");
        return;
      }

      localStorage.setItem("vcb_access", JSON.stringify({
        type: "paid",
        expiry: result.expiry,
        plan: result.plan || "monthly",
        session: sessionId,
        stripeSession: sessionId,
        serverValidated: true
      }));

      try {
        if (window.fbAuth && window.fbDb) {
          window.fbAuth.onAuthStateChanged(function(user) {
            if (user) {
              window.fbDb.collection("profiles").doc(user.uid).set({
                stripeSession: sessionId,
                accessExpiry: result.expiry,
                plan: result.plan || "monthly",
                updatedAt: Date.now()
              }, { merge: true });
            }
          });
        }
      } catch (error) {
        console.error("Could not persist Stripe access to profile:", error);
      }

      document.addEventListener("DOMContentLoaded", function() {
        const msg = document.createElement("div");
        msg.style.cssText = "position:fixed;top:0;left:0;right:0;background:#1a7a40;color:#fff;text-align:center;padding:1rem;font-weight:700;font-size:1rem;z-index:99999;";
        msg.textContent = "✓ Subscription confirmed! Loading your tools...";
        document.body.appendChild(msg);
        setTimeout(function() { window.location.reload(); }, 1200);
      });
    }

    checkStripeReturn();

    function hideLoading() {
      const el = document.getElementById("loading");
      if (el) {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.4s";
        setTimeout(function() { el.style.display = "none"; }, 400);
      }
    }

    window.onerror = function(msg, src, line) {
      const el = document.getElementById("loading");
      if (el) {
        el.innerHTML = '<div style="padding:2rem;max-width:560px;"><h2 style="color:#f0c040;font-family:Georgia,serif;margin-bottom:.75rem;">App Error</h2><div style="background:rgba(255,100,100,.15);border:1px solid rgba(255,100,100,.4);border-radius:4px;padding:.85rem;color:#ffc0c0;font-size:.85rem;font-family:monospace;word-break:break-all;">' + msg + ' (line ' + line + ')</div></div>';
      }
    };
  </script>
  `;

appHtml =
  appHtml.slice(0, legacyAdminStart) +
  safeBootstrap +
  appHtml.slice(reactStart);

const babelStartMarker = '<script type="text/babel" data-presets="react,env">';
const babelStart = appHtml.indexOf(babelStartMarker);
if (babelStart < 0) throw new Error('Could not locate inline Babel application');

const babelEnd = appHtml.indexOf('</script>', babelStart);
if (babelEnd < 0) throw new Error('Could not locate end of inline Babel application');

appHtml =
  appHtml.slice(0, babelStart) +
  '<script type="text/babel" data-presets="react,env" src="/app.js"></script>' +
  appHtml.slice(babelEnd + '</script>'.length);

write(appHtmlPath, appHtml);

console.log('Security refactor applied successfully:');
console.log(`- ${appJsPath}`);
console.log(`- ${appHtmlPath}`);
