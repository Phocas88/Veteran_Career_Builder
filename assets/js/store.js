// Veteran Career Path store front. Renders product cards from /data/store-products.json
// and starts a Stripe Checkout Session via the proxy when a Buy button is clicked.
(function () {
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var grid = document.getElementById('store-grid');
  if (!grid) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  fetch('/data/store-products.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () {
      grid.innerHTML = '<div class="store-empty">The store is briefly unavailable. Please refresh in a moment.</div>';
    });

  function render(products) {
    if (!Array.isArray(products) || !products.length) {
      grid.innerHTML = '<div class="store-empty">New field guides are on the way. Check back soon.</div>';
      return;
    }
    grid.innerHTML = products.map(card).join('');
  }

  function card(p) {
    var cover =
      '<div class="pc-cover" style="--c1:' + esc(p.color1 || '#1a3a6b') + ';--c2:' + esc(p.color2 || '#0d1f3c') + '">' +
        '<span class="pc-kicker">Veteran Career Path</span>' +
        '<span class="pc-title">' + esc(p.coverTitle || p.title) + '</span>' +
        '<span class="pc-branch">' + esc(p.branch || 'Field Guide') + '</span>' +
      '</div>';
    return '<article class="pc">' + cover +
      '<div class="pc-body">' +
        '<h2 class="pc-name">' + esc(p.title) + '</h2>' +
        '<p class="pc-blurb">' + esc(p.blurb) + '</p>' +
        '<div class="pc-buy">' +
          '<span class="pc-price">' + esc(p.price) + '</span>' +
          '<button class="pc-btn" type="button" data-sku="' + esc(p.sku) + '">Buy &amp; Download</button>' +
        '</div>' +
        '<div class="pc-note">🔒 Secure Stripe checkout · Instant PDF · One-time purchase</div>' +
      '</div></article>';
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.pc-btn');
    if (btn) buy(btn.getAttribute('data-sku'), btn);
  });

  async function buy(sku, btn) {
    if (!sku) return;
    var original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Opening checkout…';
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
      btn.disabled = false; btn.textContent = original;
      alert('Sorry — checkout could not start right now. Please try again in a moment.');
    }
  }
})();
