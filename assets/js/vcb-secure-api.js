(function () {
  'use strict';

  const SESSION_KEY = 'vcb_server_session';
  const CLOCK_SKEW_MS = 30_000;

  function proxyBase() {
    const configured = String(window.VCB_PROXY_URL || '').trim().replace(/\/+$/, '');
    if (!configured) return '';
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

  window.VCBSecureApi = Object.freeze({
    isConfigured: () => Boolean(proxyBase()),
    validateCode,
    verifySubscription,
    ensureSession,
    callClaude,
    clearSession,
  });
})();
