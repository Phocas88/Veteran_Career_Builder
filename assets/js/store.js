// Veteran Career Path store front. Renders each product from /data/store-products.json as a
// mobile-first product page: cover + title + price + Buy near the top, then sample pages,
// what's inside, and delivery details below. Starts a Stripe Checkout Session on Buy.
(function () {
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var root = document.getElementById('store-root');
  if (!root) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  fetch('/data/store-products.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () {
      root.innerHTML = '<div class="store-empty">The store is briefly unavailable. Please refresh in a moment.</div>';
    });

  var allImages = []; // flat list for the lightbox

  function render(products) {
    if (!Array.isArray(products) || !products.length) {
      root.innerHTML = '<div class="store-empty">New field guides are on the way. Check back soon.</div>';
      return;
    }
    root.innerHTML = products.map(productHTML).join('');
    buildLightbox();
  }

  function productHTML(p) {
    var samples = Array.isArray(p.samples) ? p.samples : [];
    // Cover + samples all open in the lightbox.
    var gallery = [{ src: p.cover, caption: p.title + ' — cover' }].concat(samples);
    var startIndex = allImages.length;
    allImages = allImages.concat(gallery);

    var thumbs = gallery.map(function (g, i) {
      return '<button class="p-thumb" type="button" data-lb="' + (startIndex + i) + '">' +
        '<img src="' + esc(g.src) + '" alt="' + esc(g.caption || 'Sample page') + '" loading="lazy">' +
        '</button>';
    }).join('');

    var inside = (p.whatsInside || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var pagesLine = p.pages ? (p.pages + '-page workbook · ') : '';

    return '<article class="product">' +
      '<div class="p-top">' +
        '<button class="p-cover" type="button" data-lb="' + startIndex + '" aria-label="View cover larger">' +
          '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + ' cover">' +
        '</button>' +
        '<div class="p-head">' +
          '<h1 class="p-title">' + esc(p.title) + '</h1>' +
          '<p class="p-sub">' + esc(p.subcopy) + '</p>' +
          '<div class="p-meta">' + esc(p.format || 'PDF download') + ' · <strong>' + esc(p.price) + '</strong></div>' +
          '<button class="p-buy" type="button" data-sku="' + esc(p.sku) + '">Buy &amp; Download</button>' +
          '<a class="p-samplelink" href="#samples">See sample pages ↓</a>' +
          '<div class="p-microtrust">🔒 Secure Stripe checkout · Instant download · Yours to keep</div>' +
        '</div>' +
      '</div>' +

      '<section id="samples" class="p-block p-samples">' +
        '<h2>See inside</h2>' +
        '<div class="p-thumbs">' + thumbs + '</div>' +
        '<p class="p-thumbs-note">Tap any page to enlarge.</p>' +
      '</section>' +

      '<section class="p-block p-inside">' +
        '<h2>What\'s inside</h2>' +
        '<p class="p-inside-meta">' + pagesLine + 'instant PDF · covers 11A · 11B · 11C · 11Z</p>' +
        '<ul class="p-inside-list">' + inside + '</ul>' +
      '</section>' +

      '<section class="p-block p-how">' +
        '<h2>How it works</h2>' +
        '<div class="p-how-grid">' +
          howCard('🔒', 'Secure checkout', 'Payment is handled by Stripe. No card details ever touch this site.') +
          howCard('⚡', 'Instant delivery', 'Your PDF downloads on the confirmation page the moment payment clears — no waiting on email.') +
          howCard('♾️', 'Yours to keep', 'Re-download from the confirmation page for 60 days, on any device.') +
          howCard('💬', 'Need help?', 'Any trouble with a download? <a href="/contact.html">Contact us</a> and we\'ll send it directly.') +
        '</div>' +
        '<div class="p-buy-row"><span class="p-buy-price">' + esc(p.price) + '</span>' +
          '<button class="p-buy" type="button" data-sku="' + esc(p.sku) + '">Buy &amp; Download</button></div>' +
      '</section>' +
    '</article>';
  }

  function howCard(icon, title, body) {
    return '<div class="p-how-card"><div class="p-how-ic">' + icon + '</div>' +
      '<div class="p-how-t">' + title + '</div><div class="p-how-b">' + body + '</div></div>';
  }

  // ── Buy ──────────────────────────────────────────────────────────────────
  root.addEventListener('click', function (e) {
    var buy = e.target.closest && e.target.closest('.p-buy');
    if (buy) { startCheckout(buy.getAttribute('data-sku'), buy); return; }
    var thumb = e.target.closest && e.target.closest('[data-lb]');
    if (thumb) { openLightbox(Number(thumb.getAttribute('data-lb'))); }
  });

  async function startCheckout(sku, btn) {
    if (!sku) return;
    var original = btn.textContent;
    // Disable every Buy button while a checkout is opening.
    var buttons = root.querySelectorAll('.p-buy');
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

  // ── Lightbox ─────────────────────────────────────────────────────────────
  var lb, lbImg, lbCap, lbIndex = 0;
  function buildLightbox() {
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
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }
  function openLightbox(i) { lbIndex = i; show(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeLightbox() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function step(d) { lbIndex = (lbIndex + d + allImages.length) % allImages.length; show(); }
  function show() {
    var g = allImages[lbIndex]; if (!g) return;
    lbImg.src = g.src; lbImg.alt = g.caption || '';
    lbCap.textContent = g.caption || '';
  }
})();
