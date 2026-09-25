// Veteran Career Path store — product detail page behavior.
// The page HTML is static (generated). This only wires up: (1) Buy → Stripe Checkout,
// and (2) a lightbox for the cover + sample thumbnails ([data-lb] elements).
(function () {
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));

  document.addEventListener('click', function (e) {
    var buy = e.target.closest && e.target.closest('.p-buy');
    if (buy) { startCheckout(buy.getAttribute('data-sku'), buy); return; }
    var lbEl = e.target.closest && e.target.closest('[data-lb]');
    if (lbEl) { openLightbox(items.indexOf(lbEl)); }
  });

  async function startCheckout(sku, btn) {
    if (!sku) return;
    var original = btn.textContent;
    var buttons = document.querySelectorAll('.p-buy');
    buttons.forEach(function (b) { b.disabled = true; });
    btn.textContent = 'Opening checkout…';
    try {
      var r = await fetch(PROXY + '/api/store-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: sku })
      });
      var data = {}; try { data = await r.json(); } catch (_) {}
      if (!r.ok || !data.url || !/^https:\/\/checkout\.stripe\.com\//.test(data.url)) {
        throw new Error(data.error || 'checkout_failed');
      }
      window.location.assign(data.url);
    } catch (err) {
      buttons.forEach(function (b) { b.disabled = false; });
      btn.textContent = original;
      alert('Sorry — checkout could not start right now. Please try again in a moment.');
    }
  }

  // ── Lightbox ───────────────────────────────────────────────────────────────
  var lb, lbImg, lbCap, lbIndex = 0;
  function gallery(i) {
    var el = items[i]; if (!el) return null;
    var img = el.querySelector('img');
    return { src: (img && (img.currentSrc || img.src)) || '', cap: el.getAttribute('data-cap') || (img && img.alt) || '' };
  }
  function build() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb-nav lb-prev" aria-label="Previous">‹</button>' +
      '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-nav lb-next" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.lb-img');
    lbCap = lb.querySelector('.lb-cap');
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }
  function openLightbox(i) { if (i < 0) return; build(); lbIndex = i; show(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function step(d) { lbIndex = (lbIndex + d + items.length) % items.length; show(); }
  function show() { var g = gallery(lbIndex); if (!g) return; lbImg.src = g.src; lbImg.alt = g.cap; lbCap.textContent = g.cap; }
})();
