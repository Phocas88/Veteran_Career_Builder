(function () {
  'use strict';

  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var STORAGE_PREFIX = 'vcp_resume_pro_';
  var LATEST_KEY = 'vcp_resume_pro_latest';
  var DAY_MS = 24 * 60 * 60 * 1000;
  var state = null;
  var acronymData = [];

  function $(id) { return document.getElementById(id); }
  function values(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function makeDraftId() {
    if (window.crypto && window.crypto.randomUUID) return 'draft_' + window.crypto.randomUUID().replace(/-/g, '');
    return 'draft_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
  }
  function safeDraft(value) {
    value = String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    return value.length >= 8 ? value : '';
  }
  function storageKey(draft) { return STORAGE_PREFIX + draft; }
  function defaultState(draft) {
    return { draft: draft, intake: {}, confirmedSuggestions: [], report: null, sessionId: '', token: '', tokenExpiry: 0, paidUntil: 0, updatedAt: Date.now() };
  }
  function loadState(draft) {
    var parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(storageKey(draft)) || 'null'); } catch (_) {}
    if (!parsed || parsed.draft !== draft) return defaultState(draft);
    if (parsed.updatedAt && Date.now() - parsed.updatedAt > 7 * DAY_MS) {
      localStorage.removeItem(storageKey(draft));
      return defaultState(draft);
    }
    return Object.assign(defaultState(draft), parsed);
  }
  function saveState() {
    if (!state) return;
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(storageKey(state.draft), JSON.stringify(state));
      localStorage.setItem(LATEST_KEY, state.draft);
    } catch (_) {
      showStatus('Your browser could not save this draft. Keep this page open until you finish.', 'error');
    }
  }
  function showStatus(message, kind) {
    var box = $('rp-status');
    box.textContent = message;
    box.className = 'rp-status show' + (kind ? ' ' + kind : '');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearStatus() { $('rp-status').className = 'rp-status'; }
  function setBusy(show, message) {
    $('rp-busy').className = show ? 'rp-busy show' : 'rp-busy';
    if (message) $('rp-busy-text').textContent = message;
  }
  function text(id) { return ($(id).value || '').trim(); }
  function collectIntake() {
    var useClearance = $('rp-use-clearance').checked;
    return {
      branch: text('rp-branch'),
      component: text('rp-component'),
      jobCode: text('rp-code'),
      jobTitle: text('rp-job-title'),
      serviceStart: text('rp-start'),
      serviceEnd: text('rp-end'),
      rank: text('rp-rank'),
      dutyTitles: text('rp-duty-titles'),
      duties: text('rp-duties'),
      leadership: text('rp-leadership'),
      equipment: text('rp-equipment'),
      software: text('rp-software'),
      missions: text('rp-missions'),
      outcomes: text('rp-outcomes'),
      schools: text('rp-schools'),
      qualifiers: text('rp-qualifiers'),
      certifications: text('rp-certifications'),
      licenses: text('rp-licenses'),
      awards: text('rp-awards'),
      education: text('rp-education'),
      clearance: useClearance ? text('rp-clearance') : '',
      clearancePermission: useClearance,
      target: text('rp-target'),
      confirmedTranslations: state.confirmedSuggestions || []
    };
  }
  function restoreIntake(intake) {
    intake = intake || {};
    var map = {
      branch: 'rp-branch', component: 'rp-component', jobCode: 'rp-code', jobTitle: 'rp-job-title',
      serviceStart: 'rp-start', serviceEnd: 'rp-end', rank: 'rp-rank', dutyTitles: 'rp-duty-titles',
      duties: 'rp-duties', leadership: 'rp-leadership', equipment: 'rp-equipment', software: 'rp-software',
      missions: 'rp-missions', outcomes: 'rp-outcomes', schools: 'rp-schools', qualifiers: 'rp-qualifiers',
      certifications: 'rp-certifications', licenses: 'rp-licenses', awards: 'rp-awards', education: 'rp-education',
      clearance: 'rp-clearance', target: 'rp-target'
    };
    Object.keys(map).forEach(function (key) { if (intake[key] != null) $(map[key]).value = intake[key]; });
    $('rp-use-clearance').checked = Boolean(intake.clearancePermission);
  }
  function validateIntake(intake) {
    if (!intake.branch) return 'Choose your service branch.';
    if (!intake.jobCode && !intake.jobTitle) return 'Enter your MOS, AFSC, rating, or military job title.';
    if (!intake.duties) return 'Describe the duties you personally performed.';
    if (intake.duties.length < 35) return 'Add a little more detail about your actual duties so the report can stay specific and truthful.';
    return '';
  }
  function scanSuggestions(intake) {
    var haystack = Object.keys(intake).filter(function (key) { return typeof intake[key] === 'string'; }).map(function (key) { return intake[key]; }).join('\n').toLowerCase();
    return acronymData.filter(function (item) {
      if (item.branches && item.branches.length && item.branches.indexOf(intake.branch) < 0 && item.branches.indexOf('All') < 0) return false;
      return (item.aliases || [item.term]).some(function (alias) {
        var needle = String(alias || '').toLowerCase();
        if (!needle) return false;
        if (/^[a-z0-9-]{2,8}$/.test(needle)) return new RegExp('(^|[^a-z0-9])' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i').test(haystack);
        return haystack.indexOf(needle) >= 0;
      });
    }).slice(0, 18);
  }
  function renderSuggestions(items) {
    var wrap = $('rp-suggestions');
    wrap.replaceChildren();
    if (!items.length) {
      var empty = document.createElement('div'); empty.className = 'rp-empty';
      empty.textContent = 'No common acronyms were detected. That is fine; the generator will still translate the experience you confirmed.';
      wrap.appendChild(empty); return;
    }
    items.forEach(function (item, index) {
      var label = document.createElement('label'); label.className = 'rp-suggestion';
      var input = document.createElement('input'); input.type = 'checkbox'; input.checked = true; input.dataset.index = String(index);
      var copy = document.createElement('span');
      var title = document.createElement('strong'); title.textContent = item.term + ' - ' + item.meaning;
      var translation = document.createElement('span'); translation.textContent = 'Suggested civilian wording: ' + item.civilian;
      copy.append(title, translation); label.append(input, copy); wrap.appendChild(label);
    });
  }
  function addReviewBlock(parent, label, value) {
    if (!value) return;
    var block = document.createElement('div'); block.className = 'rp-review-block';
    var strong = document.createElement('strong'); strong.textContent = label;
    var span = document.createElement('span'); span.textContent = value;
    block.append(strong, span); parent.appendChild(block);
  }
  function renderReview(intake) {
    var grid = $('rp-review-grid'); grid.replaceChildren();
    addReviewBlock(grid, 'Service', [intake.branch, intake.component, intake.jobCode, intake.jobTitle].filter(Boolean).join(' - '));
    addReviewBlock(grid, 'Rank and dates', [intake.rank, intake.serviceStart && intake.serviceEnd ? intake.serviceStart + ' to ' + intake.serviceEnd : intake.serviceStart || intake.serviceEnd].filter(Boolean).join(' - '));
    addReviewBlock(grid, 'Duty titles', intake.dutyTitles);
    addReviewBlock(grid, 'Duties performed', intake.duties);
    addReviewBlock(grid, 'Leadership and scope', intake.leadership);
    addReviewBlock(grid, 'Equipment and software', [intake.equipment, intake.software].filter(Boolean).join('\n'));
    addReviewBlock(grid, 'Missions and outcomes', [intake.missions, intake.outcomes].filter(Boolean).join('\n'));
    addReviewBlock(grid, 'Training and credentials', [intake.schools, intake.qualifiers, intake.certifications, intake.licenses].filter(Boolean).join('\n'));
    addReviewBlock(grid, 'Awards and education', [intake.awards, intake.education].filter(Boolean).join('\n'));
    addReviewBlock(grid, 'Target role or posting', intake.target || 'Career discovery requested');
    addReviewBlock(grid, 'Clearance', intake.clearancePermission ? intake.clearance || 'Included, but no level entered' : 'Not included');
  }
  function reviewDraft() {
    clearStatus();
    var intake = collectIntake();
    var error = validateIntake(intake);
    if (error) { showStatus(error, 'error'); return; }
    state.intake = intake;
    var matches = scanSuggestions(intake);
    renderSuggestions(matches);
    $('rp-suggestions').dataset.items = JSON.stringify(matches);
    renderReview(intake);
    $('rp-review').className = 'rp-review show';
    values('.rp-progress span').forEach(function (el, i) { el.classList.toggle('active', i < 2); });
    saveState();
    $('rp-review').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function confirmedSuggestions() {
    var items = [];
    try { items = JSON.parse($('rp-suggestions').dataset.items || '[]'); } catch (_) {}
    return values('#rp-suggestions input:checked').map(function (input) {
      var item = items[Number(input.dataset.index)];
      return item ? { military: item.term + ' - ' + item.meaning, civilian: item.civilian } : null;
    }).filter(Boolean);
  }
  async function jsonFetch(url, options) {
    var response = await fetch(url, options);
    var data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      var error = new Error(data.detail || data.error || 'request_failed');
      error.code = data.error || 'request_failed'; error.status = response.status; throw error;
    }
    return data;
  }
  function userMessage(error) {
    var messages = {
      invalid_draft: 'This saved draft is invalid. Delete the local draft and start a new one.',
      checkout_failed: 'Stripe checkout could not be started. Please try again in a moment.',
      configuration_error: 'This tool is not fully configured yet. No charge was made.',
      rate_limited: 'Too many requests were made. Wait one minute, then try again.',
      report_ownership: 'This payment belongs to a different report draft.',
      payment_required: 'The paid session expired or could not be verified.',
      ai_error: 'The report service could not complete the request. Your payment and draft are still valid; try again.',
      ai_bad_format: 'The generated report needs another pass. Click regenerate to try again.',
      ai_unsourced: 'The generated report did not pass the source check. Click regenerate to try again.',
      generation_failed: 'The report could not be generated. Your paid draft is safe; try again.',
      verification_failed: 'Stripe could not verify the payment right now. Try again in a moment.'
    };
    return messages[error && error.code] || (error && error.message) || 'Something went wrong. Please try again.';
  }
  async function startCheckout() {
    if (!$('rp-accuracy').checked || !$('rp-privacy-ok').checked) {
      showStatus('Confirm the accuracy and privacy checkboxes before continuing to checkout.', 'error'); return;
    }
    state.confirmedSuggestions = confirmedSuggestions();
    state.intake = collectIntake();
    state.intake.confirmedTranslations = state.confirmedSuggestions;
    var error = validateIntake(state.intake);
    if (error) { showStatus(error, 'error'); return; }
    saveState();
    var button = $('rp-checkout-btn'); button.disabled = true;
    showStatus('Opening secure Stripe checkout...', '');
    try {
      var result = await jsonFetch(PROXY + '/api/resume-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: state.draft })
      });
      if (!result.url || !/^https:\/\/checkout\.stripe\.com\//.test(result.url)) throw new Error('Stripe returned an invalid checkout link.');
      window.location.assign(result.url);
    } catch (err) {
      button.disabled = false; showStatus(userMessage(err), 'error');
    }
  }
  async function getEntitlement(sessionId) {
    var result = await jsonFetch(PROXY + '/api/resume-entitlement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, draft: state.draft })
    });
    state.sessionId = sessionId; state.token = result.token; state.tokenExpiry = result.tokenExpiry || 0;
    state.paidUntil = Math.max(state.paidUntil || 0, Date.now() + DAY_MS);
    saveState(); return result.token;
  }
  async function validToken() {
    if (state.token && state.tokenExpiry > Date.now() + 30 * 1000) return state.token;
    if (!state.sessionId) throw Object.assign(new Error('payment_required'), { code: 'payment_required' });
    return getEntitlement(state.sessionId);
  }
  async function generateReport() {
    setBusy(true, 'Building your source-grounded resume and career report...');
    $('rp-output').className = 'rp-output'; clearStatus();
    try {
      var token = await validToken();
      var result = await jsonFetch(PROXY + '/api/resume-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ draft: state.draft, intake: state.intake })
      });
      state.report = result.report; state.generatedAt = Date.now(); saveState();
      renderReport(result.report);
      showStatus('Your report is ready. Every resume bullet includes the confirmed source used to create it.', 'success');
    } catch (err) {
      showStatus(userMessage(err), 'error');
      if (state.report) renderReport(state.report);
    } finally { setBusy(false); }
  }
  function editable(tag, value, className) {
    var el = document.createElement(tag); el.className = 'rp-editable' + (className ? ' ' + className : '');
    el.contentEditable = 'true'; el.spellcheck = true; el.textContent = value || ''; return el;
  }
  function section(title) {
    var wrap = document.createElement('section'); wrap.className = 'rp-edit-section';
    var heading = document.createElement('h3'); heading.textContent = title; wrap.appendChild(heading); return wrap;
  }
  function renderReport(report) {
    report = report || {};
    function asArray(value) { return Array.isArray(value) ? value : []; }
    var resume = $('rp-resume-output'); resume.replaceChildren();
    var summary = section('Professional Summary'); summary.appendChild(editable('div', report.summary)); resume.appendChild(summary);
    var titles = section('Civilian-Friendly Titles'); titles.appendChild(editable('div', asArray(report.titles).join(' | '))); resume.appendChild(titles);
    var skills = section('Transferable Skills'); var skillWrap = document.createElement('div'); skillWrap.className = 'rp-skills rp-editable'; skillWrap.contentEditable = 'true';
    asArray(report.skills).forEach(function (skill) { var span = document.createElement('span'); span.className = 'rp-skill'; span.textContent = skill; skillWrap.appendChild(span); }); skills.appendChild(skillWrap); resume.appendChild(skills);
    var bullets = section('Experience Bullets'); var list = document.createElement('ul'); list.className = 'rp-edit-list';
    asArray(report.bullets).forEach(function (bullet) {
      var li = document.createElement('li'); li.appendChild(editable('div', bullet.text));
      var source = document.createElement('span'); source.className = 'rp-source'; source.textContent = 'Source: ' + bullet.source; li.appendChild(source); list.appendChild(li);
    }); bullets.appendChild(list); resume.appendChild(bullets);
    var notes = section('Final Checks'); notes.appendChild(editable('div', report.notes || 'Review every statement and replace bracketed placeholders before applying.')); resume.appendChild(notes);

    var careers = $('rp-career-output'); careers.replaceChildren();
    asArray(report.careers).forEach(function (career) {
      var card = document.createElement('article'); card.className = 'rp-career';
      var h3 = editable('h3', career.title); card.appendChild(h3);
      var badge = document.createElement('span'); badge.className = 'rp-badge'; badge.textContent = career.readiness === 'now' ? 'Could pursue now' : 'Training likely needed'; card.appendChild(badge);
      [['Match', career.match], ['What transfers', career.transfers], ['Remaining gap', career.gap]].forEach(function (pair) {
        if (!pair[1]) return; var h4 = document.createElement('h4'); h4.textContent = pair[0]; card.appendChild(h4); card.appendChild(editable('p', pair[1]));
      });
      var req = career.requirements || {};
      ['required', 'preferred', 'optional'].forEach(function (kind) {
        if (!Array.isArray(req[kind]) || !req[kind].length) return;
        var h4 = document.createElement('h4'); h4.textContent = kind.charAt(0).toUpperCase() + kind.slice(1); card.appendChild(h4);
        var ul = document.createElement('ul'); req[kind].forEach(function (item) { var li = editable('li', item); ul.appendChild(li); }); card.appendChild(ul);
      });
      asArray(career.links).forEach(function (link) {
        try {
          var url = new URL(link.url); if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
          var a = document.createElement('a'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; a.textContent = (link.label || url.hostname) + ' \u2197'; card.appendChild(a);
        } catch (_) {}
      });
      careers.appendChild(card);
    });
    $('rp-output').className = 'rp-output show';
    values('.rp-progress span').forEach(function (el) { el.classList.add('active'); });
    $('rp-output').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function cleanText(element) { return (element && element.innerText || '').replace(/\n{3,}/g, '\n\n').trim(); }
  function download(name, content) {
    var blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function resumeText() {
    return 'ATS RESUME CONTENT\n\n' + cleanText($('rp-resume-header')) + '\n\n' + cleanText($('rp-resume-output')) + '\n\nReview every statement and replace bracketed placeholders before applying.\n';
  }
  function careerText() {
    var links = values('#rp-career-output a').map(function (link) { return link.textContent.replace(/\s*\u2197\s*$/, '') + ': ' + link.href; });
    return 'CAREER REPORT\n\n' + cleanText($('rp-career-output')) + (links.length ? '\n\nSOURCES\n' + links.join('\n') : '') + '\n\nCareer requirements can change. Verify licenses, education, and credentials with the linked official source.\n';
  }
  function deleteDraft() {
    if (!window.confirm('Delete this saved intake, payment-session reference, and generated report from this browser? This cannot be undone.')) return;
    localStorage.removeItem(storageKey(state.draft));
    if (localStorage.getItem(LATEST_KEY) === state.draft) localStorage.removeItem(LATEST_KEY);
    var url = new URL(window.location.href); url.search = ''; window.location.replace(url.toString());
  }
  async function handleReturn(params) {
    if (params.get('canceled') === '1') showStatus('Checkout was canceled. Your draft is still saved and no new report was generated.', '');
    var sessionId = String(params.get('session_id') || '');
    if (!sessionId) return;
    setBusy(true, 'Verifying payment with Stripe...');
    try {
      await getEntitlement(sessionId);
      var clean = new URL(window.location.href); clean.search = ''; window.history.replaceState({}, '', clean.toString());
      await generateReport();
    } catch (err) {
      showStatus(userMessage(err), 'error');
    } finally { setBusy(false); }
  }
  function bindEvents() {
    $('rp-review-btn').addEventListener('click', reviewDraft);
    $('rp-checkout-btn').addEventListener('click', startCheckout);
    $('rp-regenerate').addEventListener('click', generateReport);
    $('rp-download-resume').addEventListener('click', function () { download('veteran-ats-resume.txt', resumeText()); });
    $('rp-download-career').addEventListener('click', function () { download('veteran-career-report.txt', careerText()); });
    $('rp-print').addEventListener('click', function () { window.print(); });
    $('rp-delete').addEventListener('click', deleteDraft);
    $('rp-edit-intake').addEventListener('click', function () { $('rp-intake').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('rp-form').addEventListener('input', function () {
      state.confirmedSuggestions = [];
      state.intake = collectIntake();
      $('rp-review').className = 'rp-review';
      values('.rp-progress span').forEach(function (el, index) { el.classList.toggle('active', index === 0); });
      saveState();
    });
  }
  async function init() {
    var params = new URLSearchParams(window.location.search);
    var draft = safeDraft(params.get('draft'));
    if (!draft) {
      var latest = safeDraft(localStorage.getItem(LATEST_KEY));
      draft = latest || makeDraftId();
    }
    state = loadState(draft); restoreIntake(state.intake); bindEvents();
    try {
      var response = await fetch('/data/mil-acronyms.json', { cache: 'no-cache' });
      if (response.ok) acronymData = await response.json();
    } catch (_) {}
    if (state.report) renderReport(state.report);
    if (state.intake && Object.keys(state.intake).length) {
      showStatus(state.report ? 'Your saved report is open. You can edit or export it below.' : 'Your saved draft was restored from this browser.', 'success');
    }
    await handleReturn(params);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
