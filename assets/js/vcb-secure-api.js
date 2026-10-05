(function () {
  'use strict';

  const SESSION_KEY = 'vcb_server_session';
  const CLOCK_SKEW_MS = 30_000;

  function proxyBase() {
    const configured = String(window.VCB_PROXY_URL || '').trim().replace(/\/+$/, '');
    if (!configured) return 'https://vcp-proxy.vercel.app';
    return configured
      .replace(/\/api\/claude$/i, '')
      .replace(/\/claude$/i, '');
  }

  function endpoint(path) {
    const base = proxyBase();
    if (!base) throw new Error('AI service is not configured.');
    const prefix = /\/api$/i.test(base) ? base : `${base}/api`;
    return `${prefix}/${path.replace(/^\/+/, '')}`;
  }

  function saveSession(token, tokenExpiry) {
    if (!token) return;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token, expiry: Number(tokenExpiry) || 0 })
    );
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function readSession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
      if (!value.token) return null;
      if (value.expiry && value.expiry <= Date.now() + CLOCK_SKEW_MS) {
        clearSession();
        return null;
      }
      return value;
    } catch (_) {
      clearSession();
      return null;
    }
  }

  function readAccess() {
    try {
      return JSON.parse(localStorage.getItem('vcb_access') || '{}');
    } catch (_) {
      return {};
    }
  }

  async function post(path, body, options) {
    const response = await fetch(endpoint(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      const error = new Error(data.error || data.reason || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function validateCode(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return { valid: false, reason: 'invalid' };

    try {
      const data = await post('validate-code', { code: normalized });
      if (data.valid && data.token) {
        saveSession(data.token, data.tokenExpiry);
      }
      return data;
    } catch (error) {
      console.error('[VCB] Access-code validation failed:', error);
      return {
        valid: false,
        reason: error.status === 429 ? 'rate_limited' : 'error',
      };
    }
  }

  async function verifySubscription(input) {
    const body = {};
    if (input?.email) body.email = String(input.email).trim();
    if (input?.sessionId) body.sessionId = String(input.sessionId).trim();

    try {
      const data = await post('verify-subscription', body);
      if (data.active && data.token) {
        saveSession(data.token, data.tokenExpiry);
      }
      return data;
    } catch (error) {
      console.error('[VCB] Subscription verification failed:', error);
      return { active: false, error: error.message };
    }
  }

  async function ensureSession(forceRefresh) {
    if (!forceRefresh) {
      const existing = readSession();
      if (existing) return existing.token;
    }

    const access = readAccess();

    if (access.type === 'code' && access.code) {
      const result = await validateCode(access.code);
      if (result.valid && result.token) return result.token;
    }

    if (access.type === 'paid') {
      const result = await verifySubscription({
        sessionId: access.stripeSession || access.session,
        email: access.email,
      });
      if (result.active && result.token) {
        const merged = {
          ...access,
          serverValidated: true,
          plan: result.plan || access.plan,
          expiry: result.expiry || access.expiry,
        };
        localStorage.setItem('vcb_access', JSON.stringify(merged));
        return result.token;
      }
    }

    clearSession();
    throw new Error('PAYWALL: A valid subscription or access code is required.');
  }

  async function callClaude(prompt, system, maxTokens) {
    if (!proxyBase()) {
      throw new Error('AI service is not configured. The browser-side Anthropic fallback has been disabled.');
    }

    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: Math.min(Math.max(Number(maxTokens) || 2000, 1), 3000),
      messages: [{ role: 'user', content: String(prompt || '') }],
    };
    if (system) body.system = String(system);

    let token = await ensureSession(false);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const data = await post('claude', body, { token });
        return Array.isArray(data.content)
          ? data.content.map(block => block?.text || '').join('')
          : '';
      } catch (error) {
        if (error.status === 401 && attempt === 0) {
          clearSession();
          token = await ensureSession(true);
          continue;
        }
        throw error;
      }
    }

    throw new Error('AI service request failed.');
  }

  // Free preview generation for the Scout resume/cover-letter funnels. No session
  // token — the proxy runs a server-constrained, rate-limited path. `tool` is
  // 'resume' or 'cover'; `prompt` is the full prompt the page already builds.
  async function scoutGenerate(tool, prompt, maxTokens) {
    if (!proxyBase()) {
      throw new Error('AI service is not configured.');
    }
    const response = await fetch(endpoint('claude'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scout: tool,
        prompt: String(prompt || ''),
        max_tokens: Math.min(Math.max(Number(maxTokens) || 2000, 1), 3000),
      }),
    });
    let data = {};
    try { data = await response.json(); } catch (e) { data = {}; }
    if (!response.ok) {
      const err = new Error(data && data.error ? data.error : 'AI service request failed.');
      err.status = response.status;
      err.limit = data && data.limit;
      throw err;
    }
    // Returns { text, draftId, locked }. When enforcement is on, text is a
    // redacted teaser and draftId must be unlocked via scoutUnlock; when off
    // (legacy), text is the full content and draftId is null.
    return {
      text: Array.isArray(data.content) ? data.content.map(block => (block && block.text) || '').join('') : '',
      draftId: data.draftId || null,
      locked: !!data.locked,
    };
  }

  // Create a $5/$10 one-time Stripe Checkout Session to unlock a draft; returns the URL to redirect to.
  async function scoutCheckout(draft, tool) {
    const response = await fetch(endpoint('scout-checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: String(draft || ''), tool: tool === 'cover' ? 'cover' : 'resume' }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      const err = new Error((data && data.error) || 'checkout_failed');
      err.status = response.status;
      throw err;
    }
    return data.url;
  }

  // Release the FULL content for a draft after payment (session_id) or as a subscriber (token). Returns { full, tool }.
  async function scoutUnlock(draft, sessionId, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = { draft: String(draft || '') };
    if (sessionId) body.session_id = sessionId;
    const response = await fetch(endpoint('scout-unlock'), { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error((data && data.error) || 'unlock_failed');
      err.status = response.status;
      throw err;
    }
    return data;
  }

  window.VCBSecureApi = Object.freeze({
    isConfigured: () => Boolean(proxyBase()),
    validateCode,
    verifySubscription,
    ensureSession,
    callClaude,
    scoutGenerate,
    scoutCheckout,
    scoutUnlock,
    clearSession,
  });
})();
