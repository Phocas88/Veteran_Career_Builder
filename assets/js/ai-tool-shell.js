(function () {
  'use strict';

  window.VCB_PROXY_URL = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';

  var state = { authorized: false, initializing: false };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyInline(text) {
    return String(text || '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<span class="res-bold">$1</span>')
      .replace(/\*(.+?)\*/g, '<span class="res-em">$1</span>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function renderMarkdown(text) {
    var lines = escapeHtml(text).split('\n');
    var html = '';
    var inList = false;
    var inNumList = false;

    function closeLists() {
      if (inList) { html += '</div>'; inList = false; }
      if (inNumList) { html += '</div>'; inNumList = false; }
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) {
        closeLists();
        html += '<div style="height:.5rem"></div>';
        return;
      }

      if (/^#{1,3}\s+/.test(trimmed)) {
        closeLists();
        html += '<div class="res-h">' + applyInline(trimmed.replace(/^#{1, 3}\s+/, '')) + '</div>';
        return;
      }

      if (/^\d+[.).]\s+/.test(trimmed)) {
        if (inList) { html += '</div>'; inList = false; }
        if (!inNumList) { html += '<div class="res-num-list">'; inNumList = true; }
        html += '<div class="res-li" style="border-left-color:#1a7a40;">' + applyInline(trimmed.replace(/^\d+[.).]\s+/, '')) + '</div>';
        return;
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        if (inNumList) { html += '</div>'; inNumList = false; }
        if (!inList) { html += '<div class="res-list">'; inList = true; }
        html += '<div class="res-li">' + applyInline(trimmed.replace(/^[-*•]\s+/, '')) + '</div>';
        return;
      }

      closeLists();
      html += '<p>' + applyInline(trimmed) + '</p>';
    });

    closeLists();
    return html;
  }

  function getProfile() {
    try { return JSON.parse(localStorage.getItem('vcb_profile') || 'null'); } catch (_) { return null; }
  }

  function profileContext() {
    var d = getProfile();
    if (!d) return 'Veteran seeking civilian career transition.';
    var p = d.personal || {};
    var t = d.target || {};
    var sk = d.skills || {};
    var milExps = d.milExperiences || d.experiences || [];
    var civExps = d.civExperiences || d.civilianExperiences || [];
    var lines = [];

    if (p.name) lines.push('Name: ' + p.name);

    if (milExps.length) {
      lines.push('\n=== MILITARY EXPERIENCE (' + milExps.length + ' position' + (milExps.length > 1 ? 's' : '') + ') ===');
      milExps.forEach(function (ex, i) {
        lines.push('\nMilitary Position ' + (i + 1) + ':');
        if (ex.branch) lines.push('  Branch: ' + ex.branch);
        if (ex.rank) lines.push('  Rank: ' + ex.rank);
        if (ex.mos) lines.push('  MOS/Rate/AFSC: ' + ex.mos + (ex.mosTitle ? ' (' + ex.mosTitle + ')' : ''));
        if (ex.unit) lines.push('  Unit: ' + ex.unit);
        if (ex.tos) lines.push('  Time in Service: ' + ex.tos);
        if (ex.clearanceLevel && ex.clearanceLevel !== 'None') lines.push('  Clearance: ' + ex.clearanceLevel);
        if (ex.duties) lines.push('  Key Duties: ' + String(ex.duties).slice(0, 400));
        if (ex.awards && ex.awards.length) lines.push('  Awards: ' + (Array.isArray(ex.awards) ? ex.awards.join(', ') : ex.awards));
        if (ex.startDate || ex.endDate) lines.push('  Dates: ' + (ex.startDate || '') + ' to ' + (ex.endDate || 'Present'));
      });
    }

    if (civExps.length) {
      lines.push('\n=== CIVILIAN / FEDERAL EXPERIENCE (' + civExps.length + ' position' + (civExps.length > 1 ? 's' : '') + ') ===');
      civExps.forEach(function (ex, i) {
        lines.push('\nCivilian Position ' + (i + 1) + ':');
        if (ex.title || ex.jobTitle) lines.push('  Title: ' + (ex.title || ex.jobTitle));
        if (ex.company || ex.employer) lines.push('  Employer: ' + (ex.company || ex.employer));
        if (ex.duties || ex.description) lines.push('  Duties: ' + String(ex.duties || ex.description || '').slice(0, 300));
        if (ex.startDate || ex.endDate) lines.push('  Dates: ' + (ex.startDate || '') + ' to ' + (ex.endDate || 'Present'));
      });
    }

    if (sk.technical) lines.push('\nTechnical Skills: ' + sk.technical);
    if (sk.leadership) lines.push('Leadership Skills: ' + sk.leadership);
    if (sk.languages) lines.push('Languages: ' + sk.languages);
    if (sk.certs) lines.push('Certifications: ' + sk.certs);
    if (t.title || t.industry) lines.push('\nTarget Role: ' + (t.title || '') + (t.industry ? ' | ' + t.industry : ''));

    return lines.join('\n') || 'Veteran seeking civilian career transition.';
  }

  function val(id) {
    var element = document.getElementById(id);
    return element ? String(element.value || '').trim() : '';
  }

  function setHtml(id, html) {
    var element = document.getElementById(id);
    if (element) element.innerHTML = html;
  }

  function showGate() {
    var gate = document.getElementById('vcp-gate');
    var tool = document.getElementById('tool-content');
    if (gate) gate.style.display = 'block';
    if (tool) tool.style.display = 'none';
  }

  function showTool() {
    var gate = document.getElementById('vcp-gate');
    var tool = document.getElementById('tool-content');
    if (gate) gate.style.display = 'none';
    if (tool) tool.style.display = 'block';

    var d = getProfile();
    var ex = (d && (d.milExperiences || d.experiences || [])[0]) || {};
    var p = (d && d.personal) || {};
    var banner = document.getElementById('profile-banner');
    var name = document.getElementById('pb-name');
    if (banner && (p.name || ex.branch)) {
      banner.style.display = 'flex';
      if (name) name.textContent = (p.name || 'Veteran') + (ex.branch ? ' | ' + ex.branch : '') + (ex.rank ? ' ' + ex.rank : '') + (ex.mos ? ' | ' + ex.mos : '');
    }
    if (typeof window.autofillFromProfile === 'function') window.autofillFromProfile();
  }

  async function authorizeFromStoredAccess() {
    if (!window.VCBSecureApi) throw new Error('Secure API client unavailable.');
    await window.VCBSecureApi.ensureSession(false);
    state.authorized = true;
    showTool();
    return true;
  }

  async function tryManualUnlock() {
    var entry = window.prompt('Enter your subscriber email or access code:');
    if (!entry) return false;
    var result;
    if (entry.indexOf('@') >= 0) {
      result = await window.VCBSecureApi.verifySubscription({ email: entry.trim().toLowerCase() });
      if (!result.active) throw new Error('No active subscription was verified for that email.');
      localStorage.setItem('vcb_access', JSON.stringify({
        type: 'paid',
        email: entry.trim().toLowerCase(),
        stripeSession: result.sessionId || '',
        expiry: result.expiry || Date.now() + 30 * 864e5,
        plan: result.plan || 'monthly',
        serverValidated: true
      }));
    } else {
      result = await window.VCBSecureApi.validateCode(entry);
      if (!result.valid) throw new Error('That access code could not be verified.');
      localStorage.setItem('vcb_access', JSON.stringify({
        type: 'code',
        code: entry.trim().toUpperCase(),
        expiry: result.expiry || Date.now() + 30 * 864e5,
        serverValidated: true
      }));
    }
    state.authorized = true;
    showTool();
    return true;
  }

  function renderError(target, message) {
    if (!target) return;
    target.innerHTML = '<div style="color:#ff8080;padding:1rem;border:1px solid rgba(255,100,100,.3);border-radius:8px;">' +
      escapeHtml(message || 'AI request failed. Verify your subscription or access code and try again.') +
      '</div>';
  }

  async function callClaude(prompt, system, opts) {
    opts = opts || {};
    var btn = opts.btn ? document.getElementById(opts.btn) : null;
    var out = opts.result ? document.getElementById(opts.result) : null;
    var target = out && out.querySelector ? (out.querySelector('.result-text') || out) : out;
    var label = opts.btnLabel || (btn ? btn.innerHTML : '');
    var maxTokens = opts.maxTokens || 1800;

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating...'; }
    if (out) out.style.display = 'block';
    if (target) target.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analyzing your background...</p></div>';

    try {
      var text = await window.VCBSecureApi.callClaude(prompt, system, maxTokens);
      if (!text) throw new Error('Empty response from AI service.');
      if (target) target.innerHTML = renderMarkdown(text);
      return text;
    } catch (error) {
      renderError(target, error && error.message);
      return null;
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
    }
  }

  async function init() {
    if (state.initializing || state.authorized) return;
    state.initializing = true;
    showGate();
    try {
      await authorizeFromStoredAccess();
    } catch (_) {
      showGate();
    } finally {
      state.initializing = false;
    }
  }

  window.VCBAiTool = Object.freeze({
    checkAccess: function () { return state.authorized; },
    init: init,
    tryManualUnlock: tryManualUnlock,
    callClaude: callClaude,
    renderMarkdown: renderMarkdown,
    profileContext: profileContext,
    getProfile: getProfile,
    val: val,
    setHtml: setHtml
  });

  window.checkAccess = window.checkAccess || function () { return state.authorized; };
  window.getProfile = window.getProfile || getProfile;
  window.profileContext = window.profileContext || profileContext;
  window.buildProfileContext = window.buildProfileContext || profileContext;
  window.buildPromptContext = window.buildPromptContext || profileContext;
  window.getProfileContext = window.getProfileContext || profileContext;
  window.val = window.val || val;
  window.setHtml = window.setHtml || setHtml;
  window.renderMarkdown = window.renderMarkdown || renderMarkdown;
  window.applyInline = window.applyInline || applyInline;
  window.callClaude = window.callClaude || callClaude;
  window.showGate = window.showGate || showGate;
  window.showTool = window.showTool || showTool;
  window.tryManualUnlock = window.tryManualUnlock || tryManualUnlock;

  document.addEventListener('DOMContentLoaded', init);
})();
