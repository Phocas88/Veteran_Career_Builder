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

  /* ── INIT ALL ───────────────────────────────────────────────────────── */
  function init() {
    enhanceBody();
    initScrollReveal();
    initSmoothScroll();
    initCounters();
    initParallax();
    initTilt();
    initBackToTop();
    initActiveNav();
    initAccountLink();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
