// Veteran Career Path — Client Career Journey portal.
// Loads a client's live hub from the portal token in ?token=, then renders their resume
// review + personalized resources. All server-supplied strings are placed via textContent /
// createElement only (never innerHTML) to prevent stored XSS. The server already enforces the
// 30-day window + archive; this page only renders what it returns.
(function () {
  'use strict';
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var params = new URLSearchParams(location.search);
  var token = (params.get('token') || '').trim();

  function $(id) { return document.getElementById(id); }
  function show(state) {
    ['loading', 'invalid', 'portal'].forEach(function (s) {
      var el = $('state-' + s); if (el) el.classList.toggle('active', s === state);
    });
    window.scrollTo(0, 0);
  }
  function node(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  function invalid(title, msg) {
    if (title) $('invalid-title').textContent = title;
    if (msg) $('invalid-msg').textContent = msg;
    show('invalid');
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    invalid('This journey link isn’t active', 'This link is invalid or incomplete. Reply to the message where you received it and we’ll send a fresh one.');
    return;
  }

  show('loading');
  fetch(PROXY + '/api/review-journey?token=' + encodeURIComponent(token), { method: 'GET' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.ok) {
        if (d && d.reason === 'expired') invalid('This journey link has expired', 'Your Career Journey hub is open for 30 days after your review is delivered. Reply to the message where you received this link and we can reactivate it.');
        else if (d && d.reason === 'archived') invalid('This journey has been archived', 'Your Career Journey hub has been closed. Reply to the message where you received this link if you need access again.');
        else invalid('This journey link isn’t active', 'This link is invalid or no longer available. Reply to the message where you received it and we’ll send a fresh one.');
        return;
      }
      renderPortal(d);
    })
    .catch(function () {
      invalid('We couldn’t load your journey', 'Something went wrong on our end. Please refresh in a moment, or reply to the message where you received this link.');
    });

  function renderPortal(d) {
    // Header
    var first = (d.firstName || '').trim();
    $('jy-welcome').textContent = first ? ('Welcome, ' + first) : 'Welcome';

    var goal = $('jy-goal');
    clear(goal);
    var role = (d.target && d.target.role) || '';
    if (role) {
      goal.appendChild(document.createTextNode('Your personalized next steps toward '));
      goal.appendChild(node('strong', null, role));
      var extra = [];
      if (d.target.industry && d.target.industry.toLowerCase() !== role.toLowerCase()) extra.push(d.target.industry);
      if (d.target.location) extra.push(d.target.location);
      goal.appendChild(document.createTextNode(extra.length ? (' · ' + extra.join(' · ')) : '.'));
    } else {
      goal.textContent = 'Your personalized career hub — your resume review plus curated next steps.';
    }

    // Days remaining chip
    if (d.portal && typeof d.portal.daysRemaining === 'number') {
      var chip = $('jy-days');
      var n = d.portal.daysRemaining;
      chip.textContent = n <= 0 ? 'Open today' : ('Open for ' + n + (n === 1 ? ' more day' : ' more days'));
      chip.hidden = false;
    }

    // Resume review CTA
    var reviewReady = d.review && d.review.available && ((d.review.sections && d.review.sections.length) || d.review.finalReview);
    var openBtn = $('jy-review-open');
    if (reviewReady) {
      openBtn.addEventListener('click', function () { openModal(d.review); });
    } else {
      openBtn.disabled = true;
      openBtn.textContent = 'Review in progress…';
      $('jy-review-desc').textContent = 'Your reviewer is putting the finishing touches on your resume review. Check back shortly — it will appear right here.';
    }

    // Resources
    var wrap = $('jy-resources');
    clear(wrap);
    (d.resources || []).forEach(function (group) {
      if (!group || !group.items || !group.items.length) return;
      var sec = node('section', 'jy-group');
      sec.appendChild(node('h2', 'jy-group-title', group.group));
      var cards = node('div', 'jy-cards');
      group.items.forEach(function (it) {
        if (!it || !it.url) return;
        var a = node('a', 'jy-rcard');
        a.href = it.url;
        if (it.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        var t = node('div', 't');
        t.appendChild(document.createTextNode(it.title || 'Resource'));
        if (it.external) t.appendChild(node('span', 'ext', '↗'));
        a.appendChild(t);
        if (it.desc) a.appendChild(node('div', 'd', it.desc));
        a.appendChild(node('div', 'go', 'Open →'));
        cards.appendChild(a);
      });
      sec.appendChild(cards);
      wrap.appendChild(sec);
    });

    // Expiry note
    if (d.portal && d.portal.expiresAt) {
      var dt = new Date(d.portal.expiresAt);
      $('jy-expiry-note').textContent = 'This hub stays available until ' + dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) + '. Bookmark it so you can come back to your next steps anytime.';
    }

    show('portal');
  }

  // ── Review modal ──
  function renderBlocks(container, body) {
    // Split free text into paragraphs / bullet lists, safely (textContent only).
    var blocks = String(body || '').split(/\n{2,}/);
    var ul = null;
    blocks.forEach(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      lines.forEach(function (line) {
        var isBullet = /^(•|\-|\*|‣|⁃|\d+[.)])\s+/.test(line);
        if (isBullet) {
          if (!ul) { ul = document.createElement('ul'); container.appendChild(ul); }
          ul.appendChild(node('li', null, line.replace(/^(•|\-|\*|‣|⁃|\d+[.)])\s+/, '')));
        } else {
          ul = null;
          container.appendChild(node('p', null, line));
        }
      });
      ul = null;
    });
  }

  function openModal(review) {
    var body = $('jy-modal-body');
    clear(body);
    var any = false;
    (review.sections || []).forEach(function (s) {
      if (!s || !s.body) return;
      any = true;
      var sec = node('section', 'jy-sec');
      sec.appendChild(node('h3', 'jy-sec-h', s.label || ''));
      renderBlocks(sec, s.body);
      body.appendChild(sec);
    });
    if (!any && review.finalReview) {
      any = true;
      var sec2 = node('section', 'jy-sec');
      renderBlocks(sec2, review.finalReview);
      body.appendChild(sec2);
    }
    if (!any) body.appendChild(node('div', 'jy-modal-empty', 'Your review will appear here as soon as your reviewer delivers it.'));

    var bg = $('jy-modal');
    bg.hidden = false;
    document.body.style.overflow = 'hidden';
    $('jy-modal-close').focus();
  }
  function closeModal() { $('jy-modal').hidden = true; document.body.style.overflow = ''; $('jy-review-open').focus(); }

  $('jy-modal-close').addEventListener('click', closeModal);
  $('jy-modal').addEventListener('click', function (e) { if (e.target === $('jy-modal')) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('jy-modal').hidden) closeModal(); });
  $('jy-print').addEventListener('click', function () { window.print(); });
})();
