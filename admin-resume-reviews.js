// Resume Reviews — admin module (modular; loaded by admin.html).
// Requires a REAL Firebase admin user (custom claim admin===true) — the client PIN is not the
// authorization boundary. Uses realtime Firestore listeners for the queue and calls the
// admin-only vcp-proxy endpoints with a Firebase ID token. All client-supplied strings are
// rendered with textContent (never innerHTML) to prevent stored XSS.
(function () {
  'use strict';
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';

  var state = {
    initialized: false, ready: false, unsubQueue: null, unsubRuns: null,
    jobs: [], filter: 'all', searchTerm: '', alertedIds: {}, snapshotSeeded: false,
    desktopAlerts: false, openJobId: null, saveTimer: null, currentJob: null,
  };

  // ── small safe DOM helpers ──
  function node(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function root() { return document.getElementById('rr-root'); }

  // ── auth ──
  function currentUser() { return window.firebase && firebase.auth ? firebase.auth().currentUser : null; }
  async function idToken() {
    var u = currentUser();
    if (!u) return null;
    try { return await u.getIdToken(); } catch (_) { return null; }
  }
  async function isClaimAdmin() {
    var u = currentUser();
    if (!u || u.isAnonymous) return false;
    try { var r = await u.getIdTokenResult(); return r.claims && r.claims.admin === true; } catch (_) { return false; }
  }
  async function signInAdmin() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await firebase.auth().signInWithPopup(provider);
  }

  async function api(path, opts) {
    opts = opts || {};
    var tok = await idToken();
    if (!tok) throw new Error('not_signed_in');
    var headers = Object.assign({ Authorization: 'Bearer ' + tok }, opts.headers || {});
    if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    var res = await fetch(PROXY + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    var data = null; try { data = await res.json(); } catch (_) {}
    if (!res.ok) { var e = new Error((data && data.error) || 'request_failed'); e.status = res.status; throw e; }
    return data;
  }

  // ── entry point (called by admin.html when tab opens) ──
  window.rrOnTabOpen = function () {
    if (state.initialized) return;
    state.initialized = true;
    renderGate();
  };

  async function renderGate() {
    var r = root(); if (!r) return;
    clear(r);
    var admin = await isClaimAdmin();
    if (admin) { startQueue(); return; }
    var box = node('div', 'rr-gate');
    box.appendChild(node('h3', null, 'Admin sign-in required'));
    box.appendChild(node('p', null, 'Resume reviews contain client PII and uploaded resumes. Sign in with your authorized Google admin account to continue. (The PIN alone does not grant access to this data.)'));
    var btn = node('button', 'rr-gbtn', 'Sign in with Google (admin)');
    var err = node('div', 'err');
    btn.addEventListener('click', async function () {
      err.textContent = '';
      try {
        await signInAdmin();
        if (await isClaimAdmin()) { startQueue(); }
        else { err.textContent = 'This Google account is not an authorized admin.'; }
      } catch (e) { err.textContent = 'Sign-in failed or was cancelled.'; }
    });
    box.appendChild(btn); box.appendChild(err);
    r.appendChild(box);
  }

  // ── queue ──
  function startQueue() {
    state.ready = true;
    renderQueueShell();
    if (state.unsubQueue) return;
    var db = window.db;
    state.unsubQueue = db.collection('resumeReviewJobs').orderBy('createdAt', 'desc').limit(400)
      .onSnapshot(function (snap) {
        var jobs = snap.docs.map(function (d) { var o = d.data(); o.id = d.id; return o; });
        if (!state.snapshotSeeded) {
          jobs.forEach(function (j) { if (isNewPaid(j)) state.alertedIds[j.id] = 1; });
          state.snapshotSeeded = true;
        } else {
          jobs.forEach(function (j) { if (isNewPaid(j) && !state.alertedIds[j.id]) { state.alertedIds[j.id] = 1; announce(j); } });
        }
        state.jobs = jobs;
        updateStats();
        if (!state.openJobId) renderQueue();
        else refreshOpenJob();
      }, function (err) {
        var r = root(); clear(r); r.appendChild(node('div', 'rr-empty', 'Could not load the queue: ' + (err && err.code || 'permission error') + '. Confirm your account has the admin claim.'));
      });
  }

  function isNewPaid(j) { return j.status === 'new' && j.unread === true && (j.payment && j.payment.status === 'paid'); }
  function ms(t) { return t && t.toMillis ? t.toMillis() : (typeof t === 'number' ? t : 0); }
  function ago(millis) {
    if (!millis) return '';
    var s = Math.floor((Date.now() - millis) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  var STATUS_LABEL = { awaiting_payment: 'Awaiting Payment', new: 'New', in_review: 'In Review', needs_info: 'Needs Info', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };

  function updateStats() {
    var c = { new: 0, in_review: 0, ready: 0, total: 0 }, unread = 0;
    state.jobs.forEach(function (j) {
      if (j.serviceType && j.serviceType !== 'resume_review') return;
      if (j.status === 'awaiting_payment' || j.status === 'cancelled' || j.status === 'refunded') { /* not counted in total work */ }
      else c.total++;
      if (j.status === 'new') c.new++;
      if (j.status === 'in_review') c.in_review++;
      if (j.status === 'ready') c.ready++;
      if (j.unread && j.status === 'new') unread++;
    });
    setText('stat-rr-new', c.new);
    setText('stat-rr-sub', c.in_review + ' in review · ' + c.ready + ' ready · ' + c.total + ' total');
    var badge = document.getElementById('rr-tab-badge');
    if (badge) { badge.textContent = unread ? '(' + unread + ')' : ''; badge.style.display = unread ? 'inline' : 'none'; }
  }
  function setText(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  function renderQueueShell() {
    var r = root(); clear(r);
    var bar = node('div', 'rr-toolbar');
    var create = node('button', 'rr-btn primary', '+ Create Review Link'); create.addEventListener('click', openCreateModal);
    var search = node('input', 'rr-search'); search.type = 'search'; search.placeholder = 'Search name, MOS, target…';
    search.addEventListener('input', function () { state.searchTerm = search.value.toLowerCase(); renderQueue(); });
    var refresh = node('button', 'rr-btn', '↻ Refresh'); refresh.addEventListener('click', renderQueue);
    var alerts = node('button', 'rr-btn', '🔔 Enable Desktop Alerts'); alerts.id = 'rr-alerts-btn';
    alerts.addEventListener('click', enableDesktopAlerts);
    bar.appendChild(create); bar.appendChild(search); bar.appendChild(refresh); bar.appendChild(alerts);
    r.appendChild(bar);

    var chips = node('div', 'rr-filters');
    [['all', 'All'], ['new', 'New'], ['in_review', 'In Review'], ['needs_info', 'Needs Info'], ['ready', 'Ready'], ['delivered', 'Delivered'], ['awaiting_payment', 'Awaiting Payment']].forEach(function (f) {
      var c = node('button', 'rr-chip' + (state.filter === f[0] ? ' active' : ''), f[1]);
      c.dataset.f = f[0];
      c.addEventListener('click', function () { state.filter = f[0]; document.querySelectorAll('#rr-root .rr-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.f === f[0]); }); renderQueue(); });
      chips.appendChild(c);
    });
    r.appendChild(chips);
    var q = node('div', 'rr-queue'); q.id = 'rr-queue'; r.appendChild(q);
    renderQueue();
  }

  function getVisible() {
    var order = { new: 0, in_review: 1, needs_info: 2, ready: 3, awaiting_payment: 4, delivered: 5, cancelled: 6, refunded: 7 };
    var list = state.jobs.filter(function (j) {
      if (j.serviceType && j.serviceType !== 'resume_review') return false;
      if (state.filter !== 'all' && j.status !== state.filter) return false;
      if (state.searchTerm) {
        var hay = ((j.client && j.client.name) || '') + ' ' + ((j.military && j.military.mos) || '') + ' ' + ((j.military && j.military.branch) || '') + ' ' + ((j.career && j.career.primaryTarget) || '');
        if (hay.toLowerCase().indexOf(state.searchTerm) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var oa = order[a.status] != null ? order[a.status] : 9, ob = order[b.status] != null ? order[b.status] : 9;
      if (oa !== ob) return oa - ob;
      // NEW: oldest submitted first so paid clients aren't buried; others newest first.
      if (a.status === 'new') return ms(a.createdAt) - ms(b.createdAt);
      return ms(b.createdAt) - ms(a.createdAt);
    });
    return list;
  }

  function renderQueue() {
    var q = document.getElementById('rr-queue'); if (!q) return;
    clear(q);
    var list = getVisible();
    if (!list.length) { q.appendChild(node('div', 'rr-empty', 'No resume reviews in this view yet.')); return; }
    list.forEach(function (j) { q.appendChild(queueCard(j)); });
  }

  function queueCard(j) {
    var card = node('div', 'rr-card' + (j.unread && j.status === 'new' ? ' unread' : ''));
    var top = node('div', 'top');
    top.appendChild(node('span', 'rr-dot'));
    var badge = node('span', 'rr-badge b-' + j.status, STATUS_LABEL[j.status] || j.status);
    top.appendChild(badge);
    top.appendChild(node('span', 'rr-name', (j.client && j.client.name) || 'Unnamed client'));
    card.appendChild(top);

    var meta1 = node('div', 'rr-meta');
    var branch = (j.military && j.military.branch) || '—', mos = (j.military && j.military.mos) || '—';
    meta1.appendChild(document.createTextNode(branch + ' • ' + mos));
    card.appendChild(meta1);
    var meta2 = node('div', 'rr-meta');
    meta2.appendChild(document.createTextNode('Target: ' + ((j.career && j.career.primaryTarget) || '—')));
    card.appendChild(meta2);

    var meta3 = node('div', 'rr-meta');
    var pay = node('span', 'rr-pay ' + (j.payment && j.payment.status === 'paid' ? 'paid' : 'unpaid'), j.payment && j.payment.status === 'paid' ? ('Paid' + (j.payment.amount ? ' • $' + (j.payment.amount / 100).toFixed(2) : '')) : 'Unpaid');
    meta3.appendChild(pay);
    meta3.appendChild(node('span', 'sep', '·'));
    meta3.appendChild(document.createTextNode('Submitted ' + ago(ms(j.createdAt))));
    card.appendChild(meta3);

    var fname = (j.files && j.files[0] && j.files[0].filename) || '';
    if (fname) { var mf = node('div', 'rr-meta'); mf.appendChild(document.createTextNode('Resume: ' + fname)); card.appendChild(mf); }
    if (j.source) { var ms2 = node('div', 'rr-meta'); ms2.appendChild(document.createTextNode('Source: ' + j.source)); card.appendChild(ms2); }

    card.addEventListener('click', function () { openJob(j.id); });
    return card;
  }

  // ── alerts ──
  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      var ctx = new Ctx(); var o = ctx.createOscillator(); var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35); o.start(); o.stop(ctx.currentTime + 0.36);
    } catch (_) {}
  }
  function announce(j) {
    var name = (j.client && j.client.name) || 'New client';
    var sub = ((j.military && j.military.branch) || '') + ' ' + ((j.military && j.military.mos) || '');
    showToast('New Resume Review', name + ' • ' + sub.trim());
    beep();
    if (state.desktopAlerts && 'Notification' in window && Notification.permission === 'granted') {
      try {
        var n = new Notification('New Resume Review', { body: name + ' • ' + sub.trim(), tag: 'rr-' + j.id });
        n.onclick = function () { window.focus(); if (window.rrFocusTab) window.rrFocusTab(); openJob(j.id); n.close(); };
      } catch (_) {}
    }
  }
  function showToast(t, b) {
    var el = node('div', 'rr-toast');
    el.appendChild(node('div', 't', t)); el.appendChild(node('div', 'b', b));
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 6000);
  }
  function enableDesktopAlerts() {
    if (!('Notification' in window)) { showToast('Not supported', 'This browser has no desktop notifications.'); return; }
    Notification.requestPermission().then(function (p) {
      state.desktopAlerts = (p === 'granted');
      var btn = document.getElementById('rr-alerts-btn');
      if (btn) { btn.textContent = state.desktopAlerts ? '🔔 Desktop Alerts On' : '🔔 Enable Desktop Alerts'; btn.classList.toggle('on', state.desktopAlerts); }
    });
  }

  // ── create link modal ──
  function openCreateModal() {
    var bg = node('div', 'rr-modal-bg open'); bg.id = 'rr-create-modal';
    var m = node('div', 'rr-modal');
    m.appendChild(node('h3', null, 'Create Review Link'));
    function field(labelText, el) { m.appendChild(node('label', null, labelText)); m.appendChild(el); return el; }
    var name = field('Client name (optional)', node('input')); name.type = 'text'; name.maxLength = 120;
    var mos = field('MOS / Rate / AFSC (optional)', node('input')); mos.type = 'text'; mos.maxLength = 60;
    var source = field('Source', node('input')); source.type = 'text'; source.value = 'TikTok DM'; source.maxLength = 60;
    var note = field('Admin note (optional)', node('textarea')); note.maxLength = 1000;
    var exp = field('Expiration', node('select'));
    [['24', '24 hours'], ['72', '3 days'], ['168', '7 days'], ['336', '14 days']].forEach(function (o) { var op = node('option', null, o[1]); op.value = o[0]; exp.appendChild(op); });
    exp.value = '168';
    var result = node('div'); m.appendChild(result);
    var row = node('div', 'row');
    var createBtn = node('button', 'rr-btn primary', 'Create link');
    var closeBtn = node('button', 'rr-btn', 'Cancel');
    row.appendChild(createBtn); row.appendChild(closeBtn); m.appendChild(row);
    closeBtn.addEventListener('click', function () { bg.remove(); });
    bg.addEventListener('click', function (e) { if (e.target === bg) bg.remove(); });

    createBtn.addEventListener('click', async function () {
      createBtn.disabled = true; createBtn.textContent = 'Creating…';
      try {
        var d = await api('/api/review-invite', { method: 'POST', body: { action: 'create', clientName: name.value, mos: mos.value, source: source.value, adminNotes: note.value, expiresInHours: Number(exp.value) } });
        clear(result);
        result.appendChild(node('label', null, 'Private review link (shown once)'));
        var box = node('div', 'rr-linkbox', d.url); result.appendChild(box);
        clear(row);
        var copy = node('button', 'rr-btn primary', 'Copy link');
        copy.addEventListener('click', function () { navigator.clipboard && navigator.clipboard.writeText(d.url); copy.textContent = 'Copied ✓'; });
        var open = node('button', 'rr-btn', 'Open link'); open.addEventListener('click', function () { window.open(d.url, '_blank', 'noopener'); });
        var done = node('button', 'rr-btn', 'Done'); done.addEventListener('click', function () { bg.remove(); });
        row.appendChild(copy); row.appendChild(open); row.appendChild(done);
      } catch (e) {
        createBtn.disabled = false; createBtn.textContent = 'Create link';
        result.textContent = 'Could not create link (' + (e.message || 'error') + ').';
      }
    });

    bg.appendChild(m); document.body.appendChild(bg);
    name.focus();
  }

  // ── workspace ──
  function jobById(id) { for (var i = 0; i < state.jobs.length; i++) if (state.jobs[i].id === id) return state.jobs[i]; return null; }

  async function openJob(id) {
    state.openJobId = id;
    var job = jobById(id); if (!job) return;
    state.currentJob = job;
    renderWorkspace(job);
    // Mark read (does not change status).
    if (job.unread) { try { await api('/api/review-job?jobId=' + id, { method: 'PATCH', body: { unread: false } }); } catch (_) {} }
  }
  function refreshOpenJob() {
    if (!state.openJobId) return;
    var job = jobById(state.openJobId);
    if (job) { state.currentJob = job; } // live fields (status/payment) update; editor untouched to avoid clobbering typing
    // update status bar + queue-independent bits lightly
    var sb = document.getElementById('rr-statusbar'); if (sb && job) paintStatusBar(job);
  }

  function kv(parent, label, value) {
    if (value == null || value === '') return;
    var w = node('div', 'rr-kv'); w.appendChild(node('span', 'k', label)); w.appendChild(node('span', 'v', String(value)));
    parent.appendChild(w);
  }

  function renderWorkspace(job) {
    var r = root(); clear(r);
    var back = node('button', 'rr-ws-back', '‹ Back to queue');
    back.addEventListener('click', function () { state.openJobId = null; if (state.unsubRuns) { state.unsubRuns(); state.unsubRuns = null; } renderQueueShell(); });
    r.appendChild(back);

    // status bar
    var sb = node('div', 'rr-status-bar'); sb.id = 'rr-statusbar'; r.appendChild(sb);
    paintStatusBar(job);

    var ws = node('div', 'rr-ws');

    // LEFT — client file
    var left = node('div', 'rr-col');
    left.appendChild(node('h4', null, 'Client File'));
    var c = job.client || {}, m = job.military || {}, ca = job.career || {}, rq = job.reviewRequest || {};
    kv(left, 'Name', c.name); kv(left, 'Email', c.email); kv(left, 'Phone', c.phone);
    kv(left, 'Branch', m.branch); kv(left, 'MOS/Rate/AFSC', m.mos); kv(left, 'Rank/Grade', m.rank);
    kv(left, 'Years of service', m.yearsService); kv(left, 'Status', m.serviceStatus); kv(left, 'Clearance', m.clearance);
    kv(left, 'Certifications', m.certifications); kv(left, 'Education', m.education);
    kv(left, 'Additional experience', m.additionalExperience); kv(left, 'Awards/quals', m.awardsQualifications);
    kv(left, 'Target role', ca.primaryTarget); kv(left, 'Secondary target', ca.secondaryTarget);
    kv(left, 'Target industry', ca.industry); kv(left, 'Target company', ca.targetCompany);
    kv(left, 'Location / remote', ca.targetLocation || ca.remotePreference);
    kv(left, 'Job posting URL', ca.jobPostingUrl); kv(left, 'Requested help', rq.requestedHelp);
    kv(left, 'Client says missing', rq.missingInfo); kv(left, 'Client notes', rq.clientNotes);
    kv(left, 'Payment', job.payment && job.payment.status === 'paid' ? ('Paid' + (job.payment.amount ? ' $' + (job.payment.amount / 100).toFixed(2) : '')) : 'Unpaid');
    kv(left, 'Submitted', new Date(ms(job.createdAt)).toLocaleString());
    // files
    left.appendChild(node('h4', null, 'Uploaded Files'));
    (job.files || []).forEach(function (f) {
      var fr = node('div', 'rr-file');
      var meta = node('div'); meta.appendChild(node('div', null, f.filename)); meta.appendChild(node('div', 'rr-meta', (f.kind || '').toUpperCase() + ' · ' + Math.round((f.size || 0) / 1024) + ' KB'));
      var btns = node('div', 'fbtns');
      var prev = node('button', null, 'Preview'); prev.addEventListener('click', function () { openFile(job.id, f.fileId, 'preview'); });
      var dl = node('button', null, 'Download'); dl.addEventListener('click', function () { openFile(job.id, f.fileId, 'download', f.filename); });
      btns.appendChild(prev); btns.appendChild(dl);
      fr.appendChild(meta); fr.appendChild(btns); left.appendChild(fr);
    });
    ws.appendChild(left);

    // CENTER — AI tools
    var center = node('div', 'rr-col');
    center.appendChild(node('h4', null, 'AI Review Tools'));
    var extractBtn = node('button', 'rr-btn rr-extract', (job.extractedResumeText ? 'Re-extract Resume Text' : 'Extract Resume Text'));
    extractBtn.addEventListener('click', function () { doExtract(job, extractBtn); });
    center.appendChild(extractBtn);
    var aiStatus = node('div', 'rr-ai-status'); aiStatus.id = 'rr-ai-status'; center.appendChild(aiStatus);
    var tools = node('div', 'rr-tools');
    [['full_review', 'Full Resume Review'], ['translate', 'Military → Civilian'], ['rewrite_bullets', 'Rewrite Bullets'], ['summary', 'Professional Summary'], ['ats', 'ATS / Keyword'], ['career_fit', 'Career Fit'], ['missing_metrics', 'Missing Metrics'], ['target_job', 'Target This Job'], ['cert_gaps', 'Cert / Skill Gaps'], ['draft_feedback', 'Draft Client Feedback']]
      .forEach(function (t) { var b = node('button', 'rr-tool', t[1]); b.dataset.tool = t[0]; b.addEventListener('click', function () { runTool(job, t[0], t[1]); }); tools.appendChild(b); });
    center.appendChild(tools);
    // AI output area
    center.appendChild(node('h4', null, 'AI Output'));
    var out = node('div'); out.id = 'rr-ai-out-wrap'; center.appendChild(out);
    // AI history
    var hist = node('div', 'rr-hist'); hist.appendChild(node('h4', null, 'AI History')); var hl = node('div'); hl.id = 'rr-hist-list'; hist.appendChild(hl); center.appendChild(hist);
    ws.appendChild(center);

    // RIGHT — editable working review
    var right = node('div', 'rr-col');
    right.appendChild(node('h4', null, 'Working Review'));
    var ind = node('div', 'rr-save-ind', 'Saved'); ind.id = 'rr-save-ind'; right.appendChild(ind);
    var wr = job.workingReview || {};
    [['reviewerNotes', 'Reviewer Notes'], ['summaryFeedback', 'Summary Feedback'], ['priorityFixes', 'Priority Fixes'], ['bulletRewrites', 'Bullet Rewrites'], ['careerRecommendations', 'Career Recommendations'], ['questionsForClient', 'Questions for Client'], ['finalMessage', 'Final Message']]
      .forEach(function (f) {
        var wrap = node('div', 'rr-ed-field'); wrap.appendChild(node('label', null, f[1]));
        var ta = node('textarea'); ta.id = 'rr-wr-' + f[0]; ta.value = wr[f[0]] || '';
        ta.addEventListener('input', scheduleSave);
        wrap.appendChild(ta); right.appendChild(wrap);
      });
    var finalWrap = node('div', 'rr-ed-field'); finalWrap.appendChild(node('label', null, 'Final Review (delivered to client)'));
    var finalTa = node('textarea'); finalTa.id = 'rr-final'; finalTa.style.minHeight = '120px'; finalTa.value = job.finalReview || '';
    finalTa.addEventListener('input', scheduleSave); finalWrap.appendChild(finalTa); right.appendChild(finalWrap);
    ws.appendChild(right);

    r.appendChild(ws);

    // extracted text listener + ai history listener
    listenRuns(job.id);
  }

  function paintStatusBar(job) {
    var sb = document.getElementById('rr-statusbar'); if (!sb) return; clear(sb);
    var startBtn = node('button', 'rr-btn', 'Start Review');
    if (job.status === 'new') { startBtn.addEventListener('click', function () { setStatus(job.id, 'in_review'); }); sb.appendChild(startBtn); }
    [['in_review', 'In Review'], ['needs_info', 'Needs Info'], ['ready', 'Ready'], ['delivered', 'Delivered']].forEach(function (s) {
      var b = node('button', 'rr-sbtn' + (job.status === s[0] ? ' active' : ''), s[1]);
      b.addEventListener('click', function () { setStatus(job.id, s[0]); });
      sb.appendChild(b);
    });
    var ind = node('span', 'rr-save-ind', 'Status: ' + (STATUS_LABEL[job.status] || job.status)); sb.appendChild(ind);
  }

  async function setStatus(jobId, status) {
    try { await api('/api/review-job?jobId=' + jobId, { method: 'PATCH', body: { status: status } }); showToast('Status updated', STATUS_LABEL[status] || status); }
    catch (e) { showToast('Save failed', 'Could not update status.'); }
  }

  function scheduleSave() {
    var ind = document.getElementById('rr-save-ind'); if (ind) { ind.textContent = 'Saving…'; ind.className = 'rr-save-ind saving'; }
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveNow, 800);
  }
  async function saveNow() {
    if (!state.openJobId) return;
    var body = { workingReview: {}, finalReview: valOf('rr-final') };
    ['reviewerNotes', 'summaryFeedback', 'priorityFixes', 'bulletRewrites', 'careerRecommendations', 'questionsForClient', 'finalMessage'].forEach(function (k) { body.workingReview[k] = valOf('rr-wr-' + k); });
    try { await api('/api/review-job?jobId=' + state.openJobId, { method: 'PATCH', body: body }); setSave('Saved', 'saved'); }
    catch (e) { setSave('Save failed', 'failed'); }
  }
  function valOf(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function setSave(txt, cls) { var ind = document.getElementById('rr-save-ind'); if (ind) { ind.textContent = txt; ind.className = 'rr-save-ind ' + cls; } }

  // append helper used by AI output actions
  function appendToField(id, text) {
    var e = document.getElementById(id); if (!e) return;
    e.value = (e.value ? e.value + '\n\n' : '') + text; scheduleSave();
  }

  async function doExtract(job, btn) {
    var f = (job.files || [])[0]; if (!f) { showToast('No file', 'No uploaded resume to extract.'); return; }
    btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Extracting…';
    try { var d = await api('/api/review-extract', { method: 'POST', body: { jobId: job.id, fileId: f.fileId } }); job.extractedResumeText = d.text; showToast('Resume extracted', d.chars + ' characters'); btn.textContent = 'Re-extract Resume Text'; }
    catch (e) { showToast('Extract failed', e.message === 'extract_failed' ? 'Could not read that file.' : 'Error.'); btn.textContent = orig; }
    finally { btn.disabled = false; }
  }

  async function runTool(job, tool, label) {
    var st = document.getElementById('rr-ai-status'); if (st) st.textContent = 'Running ' + label + '…';
    document.querySelectorAll('#rr-root .rr-tool').forEach(function (b) { b.disabled = true; });
    try {
      var d = await api('/api/review-ai', { method: 'POST', body: { jobId: job.id, tool: tool } });
      if (st) st.textContent = '';
      renderAiOutput(tool, label, d.output);
    } catch (e) {
      if (st) st.textContent = 'AI run failed (' + (e.status || 'error') + '). It is saved in AI History.';
    } finally { document.querySelectorAll('#rr-root .rr-tool').forEach(function (b) { b.disabled = false; }); }
  }

  function renderAiOutput(tool, label, output) {
    var wrap = document.getElementById('rr-ai-out-wrap'); if (!wrap) return; clear(wrap);
    wrap.appendChild(node('div', 'rr-meta', label));
    if ((tool === 'rewrite_bullets' || tool === 'target_job')) {
      var pairs = tryParsePairs(output);
      if (pairs && pairs.length) { renderBeforeAfter(wrap, pairs); return; }
    }
    var box = node('div', 'rr-ai-out');
    // highlight [CLIENT METRIC NEEDED] safely
    output.split(/(\[CLIENT METRIC NEEDED\])/).forEach(function (seg) {
      if (seg === '[CLIENT METRIC NEEDED]') box.appendChild(node('span', 'metric', seg));
      else box.appendChild(document.createTextNode(seg));
    });
    wrap.appendChild(box);
    var actions = node('div', 'rr-out-actions');
    var copy = node('button', 'rr-btn', 'Copy'); copy.addEventListener('click', function () { navigator.clipboard && navigator.clipboard.writeText(output); copy.textContent = 'Copied ✓'; });
    var toNotes = node('button', 'rr-btn', '→ Reviewer Notes'); toNotes.addEventListener('click', function () { appendToField('rr-wr-reviewerNotes', output); });
    var toSummary = node('button', 'rr-btn', '→ Summary'); toSummary.addEventListener('click', function () { appendToField('rr-wr-summaryFeedback', output); });
    actions.appendChild(copy); actions.appendChild(toNotes); actions.appendChild(toSummary);
    wrap.appendChild(actions);
  }

  function tryParsePairs(output) {
    try {
      var t = output.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      var arr = JSON.parse(t);
      if (Array.isArray(arr)) return arr.filter(function (x) { return x && (x.original || x.suggested); });
    } catch (_) {}
    return null;
  }

  function renderBeforeAfter(wrap, pairs) {
    pairs.forEach(function (p) {
      var box = node('div', 'rr-ba');
      box.appendChild(node('div', 'orig', 'ORIGINAL: ' + (p.original || '(none)')));
      var ta = node('textarea', 'sug'); ta.value = p.suggested || '';
      box.appendChild(ta);
      var acts = node('div', 'rr-ba-actions');
      var acc = node('button', 'acc', 'Accept'); acc.addEventListener('click', function () { appendToField('rr-wr-bulletRewrites', '• ' + ta.value); acc.textContent = 'Accepted ✓'; });
      var rej = node('button', 'rej', 'Reject'); rej.addEventListener('click', function () { box.style.opacity = '.4'; });
      var cp = node('button', null, 'Copy'); cp.addEventListener('click', function () { navigator.clipboard && navigator.clipboard.writeText(ta.value); cp.textContent = 'Copied ✓'; });
      acts.appendChild(acc); acts.appendChild(rej); acts.appendChild(cp);
      box.appendChild(acts); wrap.appendChild(box);
    });
  }

  function listenRuns(jobId) {
    if (state.unsubRuns) { state.unsubRuns(); state.unsubRuns = null; }
    state.unsubRuns = window.db.collection('resumeReviewJobs').doc(jobId).collection('aiRuns').orderBy('createdAt', 'desc').limit(50)
      .onSnapshot(function (snap) {
        var hl = document.getElementById('rr-hist-list'); if (!hl) return; clear(hl);
        if (snap.empty) { hl.appendChild(node('div', 'rr-meta', 'No AI runs yet.')); return; }
        snap.forEach(function (d) {
          var r = d.data();
          var item = node('div', 'rr-hist-item');
          var lbl = node('div'); lbl.appendChild(document.createTextNode((r.tool || '') ));
          var when = r.createdAt && r.createdAt.toMillis ? ago(r.createdAt.toMillis()) : '';
          var right = node('div', r.status === 'success' ? 'ok' : 'er', (r.status === 'success' ? '✓ ' : '✕ ') + when);
          item.appendChild(lbl); item.appendChild(right);
          item.addEventListener('click', function () { if (r.status === 'success') renderAiOutput(r.tool, r.tool, r.output || ''); });
          hl.appendChild(item);
        });
      }, function () {});
  }

  async function openFile(jobId, fileId, mode, filename) {
    try {
      var tok = await idToken();
      var res = await fetch(PROXY + '/api/review-file?jobId=' + encodeURIComponent(jobId) + '&fileId=' + encodeURIComponent(fileId) + '&mode=' + mode, { headers: { Authorization: 'Bearer ' + tok } });
      if (!res.ok) { showToast('File error', 'Could not open file (' + res.status + ').'); return; }
      var blob = await res.blob();
      var url = URL.createObjectURL(blob);
      if (mode === 'download') { var a = document.createElement('a'); a.href = url; a.download = filename || 'resume'; document.body.appendChild(a); a.click(); a.remove(); }
      else { window.open(url, '_blank', 'noopener'); }
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) { showToast('File error', 'Could not open file.'); }
  }
})();
