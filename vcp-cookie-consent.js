/* Veteran Career Path — cookie consent banner + Google Consent Mode v2.
 * Categories: Essential (always on), Analytics (GA4), Advertising (future AdSense).
 * Choice persisted in localStorage 'vcb_cookie_consent'; re-openable via
 * window.openCookieSettings(). The consent DEFAULT (deny until choice) is set inline
 * in each page's gtag snippet; this file collects the choice and calls consent 'update'.
 */
(function () {
  var KEY = 'vcb_cookie_consent';
  var GOLD = '#f0c040', NAVY = '#0a1628';

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }

  function apply(c) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: c.analytics ? 'granted' : 'denied',
        ad_storage: c.ads ? 'granted' : 'denied',
        ad_user_data: c.ads ? 'granted' : 'denied',
        ad_personalization: c.ads ? 'granted' : 'denied'
      });
    }
  }

  function save(c) {
    c.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    apply(c);
  }

  function el(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function remove() { var b = document.getElementById('vcb-cc'); if (b) b.parentNode.removeChild(b); }

  function render(existing) {
    remove();
    var saved = existing || { analytics: true, ads: true };
    var wrap = el('div', 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:' + NAVY +
      ';color:#e8eef7;border-top:2px solid ' + GOLD + ';box-shadow:0 -6px 24px rgba(0,0,0,.4);font-family:\'DM Sans\',Inter,Arial,sans-serif;');
    wrap.id = 'vcb-cc';
    var inner = el('div', 'max-width:1000px;margin:0 auto;padding:1rem 1.2rem;');

    var msg = el('div', 'font-size:.86rem;line-height:1.55;margin-bottom:.8rem;',
      '<strong style="color:' + GOLD + '">We value your privacy.</strong> We use essential cookies to keep you signed in, and—with your permission—analytics to measure traffic and cookies to support advertising. You choose what to allow. See our <a href="/privacy-policy.html" style="color:' + GOLD + ';">Privacy Policy</a>.');

    // Customize panel (hidden until "Customize")
    var panel = el('div', 'display:none;margin:.4rem 0 .9rem;border-top:1px solid rgba(255,255,255,.12);padding-top:.7rem;');
    function row(title, desc, checked, disabled, id) {
      var r = el('label', 'display:flex;gap:.7rem;align-items:flex-start;padding:.45rem 0;cursor:' + (disabled ? 'default' : 'pointer') + ';');
      var cb = el('input');
      cb.type = 'checkbox'; cb.checked = checked; cb.disabled = !!disabled; cb.id = id;
      cb.style.cssText = 'margin-top:.25rem;width:16px;height:16px;accent-color:' + GOLD + ';';
      var t = el('div', '', '<div style="font-weight:600;font-size:.84rem">' + title + (disabled ? ' <span style=\"color:' + GOLD + ';font-weight:400\">(always on)</span>' : '') + '</div><div style="font-size:.76rem;color:#a9bcd6;line-height:1.45">' + desc + '</div>');
      r.appendChild(cb); r.appendChild(t); return r;
    }
    panel.appendChild(row('Essential', 'Sign-in, session, and security. Required for the site to work.', true, true, 'vcb-cc-ess'));
    panel.appendChild(row('Analytics', 'Google Analytics — anonymous traffic measurement to improve the site.', saved.analytics !== false, false, 'vcb-cc-an'));
    panel.appendChild(row('Advertising', 'Cookies that support relevant ads and measure their performance.', saved.ads !== false, false, 'vcb-cc-ad'));

    var btns = el('div', 'display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;');
    function button(label, primary, ghost) {
      var b = el('button', 'font:inherit;font-size:.82rem;font-weight:700;padding:.55rem 1.1rem;border-radius:8px;cursor:pointer;border:1px solid ' +
        (primary ? GOLD : 'rgba(255,255,255,.35)') + ';' + (primary ? 'background:' + GOLD + ';color:' + NAVY + ';' : 'background:transparent;color:#e8eef7;'), label);
      return b;
    }
    var accept = button('Accept all', true);
    var reject = button('Reject non-essential', false);
    var custom = button('Customize', false);
    var savePref = button('Save choices', true); savePref.style.display = 'none';

    accept.onclick = function () { save({ analytics: true, ads: true }); remove(); };
    reject.onclick = function () { save({ analytics: false, ads: false }); remove(); };
    custom.onclick = function () {
      var open = panel.style.display === 'block';
      panel.style.display = open ? 'none' : 'block';
      savePref.style.display = open ? 'none' : 'inline-block';
    };
    savePref.onclick = function () {
      save({ analytics: document.getElementById('vcb-cc-an').checked, ads: document.getElementById('vcb-cc-ad').checked });
      remove();
    };

    [accept, reject, custom, savePref].forEach(function (b) { btns.appendChild(b); });
    inner.appendChild(msg); inner.appendChild(panel); inner.appendChild(btns);
    wrap.appendChild(inner);
    (document.body || document.documentElement).appendChild(wrap);
  }

  // Footer "Cookie Preferences" link so users can change their mind anytime.
  function addFooterLink() {
    var f = document.querySelector('footer');
    if (!f || document.getElementById('vcb-cc-link')) return;
    var a = el('a', 'color:inherit;opacity:.7;text-decoration:underline;cursor:pointer;font-size:.72rem;display:inline-block;margin-top:.4rem;', 'Cookie Preferences');
    a.id = 'vcb-cc-link'; a.href = 'javascript:void(0)';
    a.onclick = function () { render(load() || undefined); };
    f.appendChild(a);
  }

  window.openCookieSettings = function () { render(load() || undefined); };

  function init() {
    var c = load();
    if (c) apply(c); else render();   // show banner only on first visit / no stored choice
    addFooterLink();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
