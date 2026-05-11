// VCP Error Monitoring - Lightweight client-side error tracking
// Sends errors to GA4 as events so you can see them in Analytics > Events
(function() {
  'use strict';

  var MAX_ERRORS = 10; // Max errors to report per session
  var errorCount = 0;

  function reportError(type, message, source, line, col) {
    if (errorCount >= MAX_ERRORS) return;
    errorCount++;

    // Send to GA4 if available
    if (typeof gtag === 'function') {
      gtag('event', 'js_error', {
        error_type: type,
        error_message: (message || '').substring(0, 150),
        error_source: (source || '').split('/').pop(),
        error_line: line || 0,
        error_col: col || 0,
        page_url: window.location.pathname
      });
    }
  }

  // Global error handler
  window.addEventListener('error', function(e) {
    reportError(
      'uncaught',
      e.message,
      e.filename,
      e.lineno,
      e.colno
    );
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    var reason = e.reason;
    var message = reason instanceof Error ? reason.message : String(reason || 'Unknown');
    reportError('promise', message, '', 0, 0);
  });

  // Track critical resource failures (CSS, JS that fail to load)
  window.addEventListener('error', function(e) {
    var target = e.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      reportError(
        'resource',
        'Failed to load: ' + (target.src || target.href || 'unknown'),
        target.src || target.href,
        0, 0
      );
    }
  }, true); // Capture phase for resource errors

  // Performance monitoring - report slow page loads
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (!window.performance || !performance.getEntriesByType) return;
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.loadEventEnd > 5000 && typeof gtag === 'function') {
        gtag('event', 'slow_page_load', {
          load_time_ms: Math.round(nav.loadEventEnd),
          dom_ready_ms: Math.round(nav.domContentLoadedEventEnd),
          page_url: window.location.pathname
        });
      }
    }, 100);
  });
})();
