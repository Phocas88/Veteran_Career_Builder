// Professional (civilian) Resume Review — client intake logic.
// Flow: validate invite token -> prefill -> (on submit) upload file -> create intake job ->
// start Stripe Checkout. Payment is verified server-side by the webhook; this page never
// claims payment. Shares the vcp-proxy /api/review-* endpoints with the veteran track; the
// invite carries track='civilian', so the backend stores a civilian background{} and uses the
// civilian AI prompts. Client input is only ever placed via .value / .textContent (no innerHTML).
(function () {
  'use strict';
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var params = new URLSearchParams(location.search);
  // Default to the permanent public self-serve invite (reusable) when none in the URL.
  var PUBLIC_REVIEW_TOKEN = 'e8e07e99471a0e5c8b85da4ea34f3dbaadf9b4d250639c12e9304f377455ef40';
  var token = (params.get('token') || '').trim() || PUBLIC_REVIEW_TOKEN;
  var paid = params.get('paid') === '1';
  var canceled = params.get('canceled') === '1';

  var MAX_BYTES = 10 * 1024 * 1024;
  var ALLOWED_EXT = ['pdf', 'docx', 'txt'];

  function $(id) { return document.getElementById(id); }
  function show(state) {
    ['loading', 'invalid', 'form', 'success', 'canceled'].forEach(function (s) {
      var el = $('state-' + s); if (el) el.classList.toggle('active', s === state);
    });
    window.scrollTo(0, 0);
  }
  function showErr(msg) { var e = $('rr-err'); e.textContent = msg; e.classList.add('show'); }
  function clearErr() { var e = $('rr-err'); e.textContent = ''; e.classList.remove('show'); }

  // ── Terminal states first ──
  if (paid) {
    var em = '';
    try { em = sessionStorage.getItem('rr_email') || ''; } catch (_) {}
    if (em) $('success-email').textContent = em;
    try { sessionStorage.removeItem('rr_email'); sessionStorage.removeItem('rr_job'); } catch (_) {}
    show('success');
    return;
  }
  if (canceled) {
    show('canceled');
    var storedJob = '';
    try { storedJob = sessionStorage.getItem('rr_job') || ''; } catch (_) {}
    var retry = $('rr-retry');
    if (storedJob) {
      retry.addEventListener('click', function () { startCheckout(storedJob, retry); });
    } else { retry.style.display = 'none'; }
    return;
  }
  if (!token) { show('invalid'); return; }

  // ── Validate the invite ──
  show('loading');
  fetch(PROXY + '/api/review-invite-validate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token }),
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d || !d.valid) {
      if (d && d.expired) { $('invalid-title').textContent = 'This link has expired'; $('invalid-msg').textContent = 'Your resume-review link is no longer valid. Reply to the message where you received it and we’ll send a fresh one.'; }
      else if (d && d.used) { $('invalid-title').textContent = 'This link was already used'; $('invalid-msg').textContent = 'This resume-review link has already been submitted. If you need help, reply to the message where you received it.'; }
      show('invalid'); return;
    }
    if (d.prefill && d.prefill.name) $('f-name').value = d.prefill.name;
    show('form');
  }).catch(function () { show('invalid'); });

  // ── File selection ──
  var selectedFile = null;
  var drop = $('rr-drop'), fileInput = $('rr-file'), chip = $('rr-file-chip'), fileNameEl = $('rr-file-name');
  if (drop) {
    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  }
  if (fileInput) fileInput.addEventListener('change', function () { setFile(fileInput.files && fileInput.files[0]); });
  var clearBtn = $('rr-file-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () { selectedFile = null; fileInput.value = ''; chip.classList.remove('show'); });

  function extOf(name) { var m = /\.([A-Za-z0-9]+)$/.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function setFile(f) {
    clearErr();
    if (!f) return;
    var ext = extOf(f.name);
    if (ALLOWED_EXT.indexOf(ext) === -1) { showErr('Please upload a PDF, DOCX, or TXT file.'); return; }
    if (f.size > MAX_BYTES) { showErr('That file is larger than 10 MB. Please upload a smaller file.'); return; }
    if (f.size === 0) { showErr('That file appears to be empty.'); return; }
    selectedFile = f;
    fileNameEl.textContent = f.name + ' (' + Math.round(f.size / 1024) + ' KB)';
    chip.classList.add('show');
  }

  // ── Submit ──
  var form = $('rr-form');
  if (form) form.addEventListener('submit', onSubmit);

  function required(id) { var el = $(id); return el && el.value.trim(); }

  async function onSubmit(e) {
    e.preventDefault();
    clearErr();
    var missing = [];
    [['f-name', 'Full name'], ['f-email', 'Email'], ['f-status', 'Current status'],
     ['f-title', 'Most recent job title'], ['f-years', 'Years of experience'],
     ['f-target', 'Primary target'], ['f-industry', 'Target industry'], ['f-help', 'What you want help with']
    ].forEach(function (p) { if (!required(p[0])) missing.push(p[1]); });
    if (!required('f-loc') && !$('f-remote').value) missing.push('Location or remote preference');
    if (missing.length) { showErr('Please complete: ' + missing.join(', ') + '.'); return; }
    var email = $('f-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showErr('Please enter a valid email address.'); return; }
    if (!selectedFile) { showErr('Please upload your current resume (PDF, DOCX, or TXT).'); return; }
    if (!$('c-emp').checked || !$('c-ai').checked) { showErr('Please check both acknowledgement boxes to continue.'); return; }

    var btn = $('rr-submit');
    btn.disabled = true; btn.textContent = 'Uploading your resume…';
    try {
      // 1) Upload the file (raw binary; server validates type/size and stores it privately).
      var upUrl = PROXY + '/api/review-upload?token=' + encodeURIComponent(token) + '&filename=' + encodeURIComponent(selectedFile.name);
      var upRes = await fetch(upUrl, { method: 'POST', headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' }, body: selectedFile });
      var up = await upRes.json().catch(function () { return {}; });
      if (!upRes.ok || !up.fileId) throw new Error(up.error === 'file_too_large' ? 'Your file is larger than 10 MB.' : (up.error === 'invalid_file' ? 'That file type could not be accepted. Use PDF, DOCX, or TXT.' : 'Upload failed. Please try again.'));

      // 2) Create the intake job. (Track is taken from the invite server-side.)
      btn.textContent = 'Saving your intake…';
      var payload = {
        token: token,
        fileIds: [up.fileId],
        consentEmployment: $('c-emp').checked,
        consentAI: $('c-ai').checked,
        fullName: $('f-name').value, email: email, phone: $('f-phone').value,
        employmentStatus: $('f-status').value, currentTitle: $('f-title').value,
        yearsExperience: $('f-years').value, careerLevel: $('f-level').value,
        currentEmployer: $('f-employer').value, currentField: $('f-field').value,
        certifications: $('f-certs').value, education: $('f-edu').value,
        keySkills: $('f-skills').value, additionalExperience: $('f-addl').value,
        primaryTarget: $('f-target').value, secondaryTarget: $('f-target2').value,
        industry: $('f-industry').value, targetCompany: $('f-company').value,
        targetLocation: $('f-loc').value, remotePreference: $('f-remote').value,
        jobPostingUrl: $('f-joburl').value, jobDescription: $('f-jd').value,
        requestedHelp: $('f-help').value, missingInfo: $('f-missing').value, clientNotes: $('f-notes').value,
      };
      var subRes = await fetch(PROXY + '/api/review-submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      var sub = await subRes.json().catch(function () { return {}; });
      if (!subRes.ok || !sub.jobId) {
        if (sub.error === 'missing_fields') throw new Error('Please complete: ' + (sub.missing || []).join(', ') + '.');
        if (sub.error === 'invalid_invite') throw new Error('This review link is no longer valid. Ask us for a fresh link.');
        throw new Error('We couldn’t save your intake. Please try again.');
      }

      // Stash for success/cancel pages (same-tab only).
      try { sessionStorage.setItem('rr_email', email); sessionStorage.setItem('rr_job', sub.jobId); } catch (_) {}

      // 3) Go to Stripe.
      btn.textContent = 'Opening secure checkout…';
      await startCheckout(sub.jobId, btn);
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Continue to secure payment — $9.99';
      showErr((err && err.message) || 'Something went wrong. Please try again.');
    }
  }

  async function startCheckout(jobId, btn) {
    try {
      var res = await fetch(PROXY + '/api/review-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: jobId }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || !d.url || !/^https:\/\/checkout\.stripe\.com\//.test(d.url)) throw new Error('Checkout could not start. Please try again in a moment.');
      window.location.assign(d.url);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Complete payment — $9.99'; }
      showErr((err && err.message) || 'Checkout could not start.');
      throw err;
    }
  }
})();
