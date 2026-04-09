/* ═══════════════════════════════════════════════════════════════════════════
   VCP COMPONENTS v1.0 — Veteran Career Path
   Shared JavaScript for animations, scroll reveals, and interactive features
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── SCROLL REVEAL (Intersection Observer) ──────────────────────────── */
  function initScrollReveal() {
    var selectors = '.vcp-fade-in, .vcp-fade-in-left, .vcp-fade-in-right, .vcp-scale-in';
    var elements = document.querySelectorAll(selectors);
    if (!elements.length) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(function (el) { el.classList.add('vcp-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('vcp-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ── SMOOTH SCROLL for anchor links ─────────────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ── COUNTER ANIMATION for stats ────────────────────────────────────── */
  function initCounters() {
    var counters = document.querySelectorAll('[data-vcp-count]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-vcp-count'), 10);
        var suffix = el.getAttribute('data-vcp-suffix') || '';
        var prefix = el.getAttribute('data-vcp-prefix') || '';
        var duration = 1500;
        var start = 0;
        var startTime = null;

        function animate(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          // Ease out cubic
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.floor(eased * target);
          el.textContent = prefix + current.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(animate);
          else el.textContent = prefix + target.toLocaleString() + suffix;
        }

        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ── PARALLAX SUBTLE (for hero backgrounds) ─────────────────────────── */
  function initParallax() {
    var elements = document.querySelectorAll('[data-vcp-parallax]');
    if (!elements.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.pageYOffset;
          elements.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-vcp-parallax')) || 0.3;
            var rect = el.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              el.style.transform = 'translateY(' + (scrollY * speed * -0.15) + 'px)';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── HOVER TILT EFFECT (subtle 3D on cards) ─────────────────────────── */
  function initTilt() {
    var cards = document.querySelectorAll('[data-vcp-tilt]');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return; // Skip on touch devices

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(800px) rotateY(' + (x * 4) + 'deg) rotateX(' + (y * -4) + 'deg) translateY(-3px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ── BACK TO TOP BUTTON ─────────────────────────────────────────────── */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'vcp-back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.style.cssText = 'position:fixed;bottom:2rem;right:2rem;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#c8960a,#e8aa10);color:#0a1628;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(200,150,10,.3);opacity:0;transform:translateY(20px);transition:all .3s cubic-bezier(.4,0,.2,1);z-index:1000;';
    document.body.appendChild(btn);

    var visible = false;
    window.addEventListener('scroll', function () {
      var shouldShow = window.pageYOffset > 400;
      if (shouldShow !== visible) {
        visible = shouldShow;
        btn.style.opacity = visible ? '1' : '0';
        btn.style.transform = visible ? 'translateY(0)' : 'translateY(20px)';
        btn.style.pointerEvents = visible ? 'auto' : 'none';
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── ACTIVE NAV HIGHLIGHT ───────────────────────────────────────────── */
  function initActiveNav() {
    var path = window.location.pathname;
    var links = document.querySelectorAll('.vcp-desk > a, .vcp-mob a');
    links.forEach(function (link) {
      try {
        var href = new URL(link.href).pathname;
        if (href === path && href !== '/') {
          link.style.color = '#f0c040';
          link.style.borderBottomColor = 'rgba(240,192,64,.6)';
        }
      } catch (e) {}
    });
  }

  /* ── ADD vcp-enhanced CLASS TO BODY ──────────────────────────────────── */
  function enhanceBody() {
    document.body.classList.add('vcp-enhanced');
  }

  /* ── MY ACCOUNT LINK (inject into any nav that doesn't have it) ────── */
  function initAccountLink() {
    // Skip on app.html (has its own profile UI)
    if (window.location.pathname.indexOf('app.html') > -1) return;
    // Look for desktop nav (.vcp-desk) or simple nav links
    var desk = document.querySelector('.vcp-desk');
    if (desk && !desk.querySelector('.vcp-account-link')) {
      var link = document.createElement('a');
      link.href = 'https://veterancareerpath.com/app.html#profile';
      link.className = 'vcp-account-link';
      link.style.cssText = 'display:flex;align-items:center;gap:.3rem;padding:0 .5rem;color:rgba(192,216,240,.6);text-decoration:none;font-size:.72rem;font-weight:500;white-space:nowrap;flex-shrink:0;';
      link.textContent = '\uD83D\uDC64 My Account';
      desk.appendChild(link);
    }
    // Also add to mobile menu if it exists
    var mob = document.querySelector('.vcp-mob');
    if (mob && !mob.querySelector('.vcp-account-link')) {
      var mlink = document.createElement('a');
      mlink.href = 'https://veterancareerpath.com/app.html#profile';
      mlink.className = 'vcp-account-link';
      mlink.textContent = '\uD83D\uDC64 My Account';
      mob.appendChild(mlink);
    }
  }

  /* ── AI TOOLS QUICK-NAV DRAWER ───────────────────────────────────────── */
  function initToolsDrawer() {
    // Only show on AI tool pages
    var toolPages = [
      'tools-job-match', 'tools-cert-advisor', 'tools-interview-simulator',
      'tools-federal-resume', 'tools-linkedin-builder', 'tools-salary-negotiator',
      'tools-job-tracker', 'clearance-job-match', 'dd214-decoder',
      'federal-resume-builder-ai', 'linkedin-profile-rewriter',
      'salary-negotiation-roleplay', 'transition-timeline-planner',
      'va-claim-builder', 'va-home-loan-analyzer', 'veteran-business-funding',
      'mos-career-translator', 'career-assessment-full', 'veteran-career-test'
    ];
    var path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '');
    var isToolPage = false;
    for (var i = 0; i < toolPages.length; i++) {
      if (path === toolPages[i] || path.indexOf(toolPages[i]) > -1) { isToolPage = true; break; }
    }
    if (!isToolPage) return;

    var tools = [
      { icon: '\uD83D\uDCC4', name: 'AI Resume Builder', url: '/app.html' },
      { icon: '\uD83C\uDFAF', name: 'Job Match Analyzer', url: '/tools-job-match.html' },
      { icon: '\uD83D\uDCBC', name: 'Federal Resume', url: '/tools-federal-resume.html' },
      { icon: '\uD83C\uDFA4', name: 'Interview Simulator', url: '/tools-interview-simulator.html' },
      { icon: '\uD83D\uDD17', name: 'LinkedIn Optimizer', url: '/tools-linkedin-builder.html' },
      { icon: '\uD83D\uDCB0', name: 'Salary Negotiator', url: '/tools-salary-negotiator.html' },
      { icon: '\uD83D\uDCCA', name: 'Certification Advisor', url: '/tools-cert-advisor.html' },
      { icon: '\uD83D\uDD04', name: 'MOS Translator', url: '/mos-career-translator.html' },
      { icon: '\uD83D\uDCCB', name: 'DD-214 Decoder', url: '/dd214-decoder.html' },
      { icon: '\uD83D\uDD10', name: 'Clearance Job Match', url: '/clearance-job-match.html' },
      { icon: '\uD83C\uDFE0', name: 'VA Loan Analyzer', url: '/va-home-loan-analyzer.html' },
      { icon: '\uD83C\uDFE5', name: 'VA Claim Builder', url: '/va-claim-builder.html' },
      { icon: '\uD83D\uDCC5', name: 'Transition Planner', url: '/transition-timeline-planner.html' },
      { icon: '\uD83D\uDCDD', name: 'LinkedIn Rewriter', url: '/linkedin-profile-rewriter.html' },
      { icon: '\uD83D\uDCB5', name: 'Salary Roleplay', url: '/salary-negotiation-roleplay.html' },
      { icon: '\uD83D\uDCBC', name: 'Business Funding', url: '/veteran-business-funding.html' },
      { icon: '\uD83D\uDCCB', name: 'Job Tracker', url: '/tools-job-tracker.html' },
      { icon: '\uD83D\uDC64', name: 'My Profile', url: '/app.html#profile' }
    ];

    // Build drawer HTML
    var drawerEl = document.createElement('div');
    drawerEl.id = 'vcp-tools-drawer';
    drawerEl.style.cssText = 'position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:1500;';

    // Toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'vcp-tools-toggle';
    toggleBtn.innerHTML = '\u{1F6E0}\uFE0F';
    toggleBtn.title = 'AI Tools';
    toggleBtn.style.cssText = 'position:absolute;right:0;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:8px 0 0 8px;background:linear-gradient(135deg,#1a3a6b,#1e4a8a);border:1px solid rgba(240,192,64,.3);border-right:none;color:#f0c040;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:-2px 0 12px rgba(0,0,0,.3);transition:all .2s;';
    drawerEl.appendChild(toggleBtn);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'vcp-tools-panel';
    panel.style.cssText = 'position:absolute;right:40px;top:50%;transform:translateY(-50%);width:220px;max-height:70vh;overflow-y:auto;background:#0d1a2d;border:1px solid rgba(240,192,64,.2);border-radius:10px 0 0 10px;box-shadow:-4px 0 20px rgba(0,0,0,.4);display:none;';

    var header = '<div style="padding:.6rem .8rem;border-bottom:1px solid rgba(240,192,64,.15);font-family:Bebas Neue,sans-serif;font-size:.8rem;letter-spacing:.1em;color:#f0c040;">AI Tools</div>';
    var links = '';
    for (var j = 0; j < tools.length; j++) {
      var t = tools[j];
      var isCurrent = window.location.pathname.indexOf(t.url.replace('.html','').replace('#profile','')) > -1 && t.url !== '/app.html#profile' && t.url !== '/app.html';
      var activeStyle = isCurrent ? 'background:rgba(240,192,64,.1);color:#f0c040;font-weight:600;' : '';
      links += '<a href="' + t.url + '" style="display:flex;align-items:center;gap:.5rem;padding:.45rem .8rem;color:rgba(192,216,240,.7);text-decoration:none;font-size:.78rem;border-bottom:1px solid rgba(255,255,255,.03);transition:background .1s;' + activeStyle + '" onmouseover="this.style.background=\'rgba(255,255,255,.06)\'" onmouseout="this.style.background=\'' + (isCurrent ? 'rgba(240,192,64,.1)' : 'none') + '\'">' + t.icon + ' ' + t.name + '</a>';
    }
    panel.innerHTML = header + links;
    drawerEl.appendChild(panel);

    document.body.appendChild(drawerEl);

    var open = false;
    toggleBtn.addEventListener('click', function () {
      open = !open;
      panel.style.display = open ? 'block' : 'none';
      toggleBtn.style.background = open ? 'linear-gradient(135deg,#c8960a,#e8aa10)' : 'linear-gradient(135deg,#1a3a6b,#1e4a8a)';
      toggleBtn.style.color = open ? '#0a1628' : '#f0c040';
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (open && !drawerEl.contains(e.target)) {
        open = false;
        panel.style.display = 'none';
        toggleBtn.style.background = 'linear-gradient(135deg,#1a3a6b,#1e4a8a)';
        toggleBtn.style.color = '#f0c040';
      }
    });
  }

  /* ── UNIFORM NAV — upgrade old navs to consistent style ─────────────── */
  function initUniformNav() {
    // Skip app.html (has its own nav) and pages with the full mega menu
    if (window.location.pathname.indexOf('app.html') > -1) return;
    if (document.querySelector('.vcp-nav')) return; // already has mega menu nav

    // Find any existing nav element
    var oldNav = document.querySelector('nav');
    if (!oldNav) return;

    // Build uniform nav
    var nav = document.createElement('nav');
    nav.style.cssText = 'background:#08111e;padding:0 4%;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:2000;border-bottom:1px solid rgba(240,192,64,.15);height:56px;gap:.5rem;';

    nav.innerHTML = '<a href="https://veterancareerpath.com" style="display:flex;align-items:center;gap:.55rem;text-decoration:none;flex-shrink:0;">'
      + '<img src="https://veterancareerpath.com/logo.png" alt="Veteran Career Path" width="28" height="28" style="object-fit:contain;">'
      + '<span style="font-family:Bebas Neue,sans-serif;font-size:.9rem;letter-spacing:.12em;color:#f0c040;">Veteran Career Path</span></a>'
      + '<div class="vcp-uni-links" style="display:flex;align-items:center;gap:.7rem;overflow:hidden;flex-wrap:nowrap;">'
      + '<a href="/career-assessment-full.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">PathFinder™ Pro</a>'
      + '<a href="/military-transition-guide.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">Transition</a>'
      + '<a href="/army-mos-careers.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">MOS Guides</a>'
      + '<a href="/va-disability-rating-schedule.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">VA Benefits</a>'
      + '<a href="/federal-jobs-search.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">Job Search</a>'
      + '<a href="/veteran-discounts.html" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">Discounts</a>'
      + '<a href="/blog/" style="color:rgba(192,216,240,.55);text-decoration:none;font-size:.72rem;white-space:nowrap;">Blog</a>'
      + '<a href="/app.html" style="background:linear-gradient(135deg,#c8960a,#e8aa10);color:#0a1628;font-weight:700;font-size:.72rem;padding:.3rem .7rem;border-radius:6px;text-decoration:none;white-space:nowrap;flex-shrink:0;">AI Tools — $15/mo</a>'
      + '</div>';

    // Add mobile CSS
    var style = document.createElement('style');
    style.textContent = '@media(max-width:768px){.vcp-uni-links a:not(:last-child){display:none!important;}}';
    document.head.appendChild(style);

    // Also remove any old mobile menu
    var oldMob = document.querySelector('.mobile-menu,.mmenu');
    if (oldMob) oldMob.remove();
    var oldHam = document.querySelector('.hamburger');
    if (oldHam) oldHam.remove();

    // Replace old nav
    oldNav.parentNode.replaceChild(nav, oldNav);
  }

  /* ── MEGA MENU COLLAPSIBLE SECTIONS ──────────────────────────────── */
  function initMegaCollapse() {
    var labels = document.querySelectorAll('.vcp-mega-section-label');
    labels.forEach(function(label) {
      // Skip labels that are already featured/always-open (first in each column)
      if (!label.getAttribute('data-toggle')) {
        label.setAttribute('data-toggle', '1');
      }
      label.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('sec-open');
      });
    });
  }

  /* ── INIT ALL ───────────────────────────────────────────────────────── */
  function init() {
    enhanceBody();
    initUniformNav();
    initMegaCollapse();
    initScrollReveal();
    initSmoothScroll();
    initCounters();
    initParallax();
    initTilt();
    initBackToTop();
    initActiveNav();
    initAccountLink();
    initToolsDrawer();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
