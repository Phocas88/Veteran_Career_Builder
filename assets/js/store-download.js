// Veteran Career Path store - post-payment delivery page.
// Reads session_id + sku from the URL, asks the proxy to verify the payment, and (only then)
// exposes the download. The proxy streams the PDF; no file URL is ever exposed here.
(function () {
  var PROXY = window.VCB_PROXY_URL || 'https://vcp-proxy.vercel.app';
  var card = document.getElementById('dl-card');
  if (!card) return;

  var params = new URLSearchParams(location.search);
  var sid = (params.get('session_id') || '').trim();
  var sku = (params.get('sku') || '').trim().toLowerCase();

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (!sid || !sku) {
    fail("We couldn't find your order details. If you were just charged, check your Stripe email receipt or contact support.");
    return;
  }

  var qs = 'session_id=' + encodeURIComponent(sid) + '&sku=' + encodeURIComponent(sku);
  var checkUrl = PROXY + '/api/store-download?check=1&' + qs;
  var dlUrl = PROXY + '/api/store-download?' + qs;

  fetch(checkUrl)
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (res.ok && res.d && res.d.ok) success(res.d.name, res.d.fileName);
      else fail("We couldn't verify this purchase yet. If you were charged, wait a moment and refresh this page, or contact support with your receipt.");
    })
    .catch(function () {
      fail('Something went wrong verifying your purchase. Please refresh, or contact support with your receipt.');
    });

  function success(name, fileName) {
    card.className = 'dl-card ok';
    card.innerHTML =
      '<div class="dl-icon">✅</div>' +
      '<h2 class="dl-h">Payment confirmed</h2>' +
      '<p class="dl-sub">Your copy of <strong>' + esc(name || 'your handbook') + '</strong> is ready.</p>' +
      '<a class="dl-btn" href="' + esc(dlUrl) + '" download>⬇ Download PDF</a>' +
      '<p class="dl-tip">This page keeps your download active for 60 days — bookmark it, or re-open it any time from your Stripe email receipt.</p>' +
      '<p class="dl-tip">Trouble downloading? <a href="/contact.html">Contact us</a> and we\'ll send it to you directly.</p>';
    // Kick off the download automatically for convenience.
    try {
      var a = document.createElement('a');
      a.href = dlUrl; if (fileName) a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (_) {}
  }

  function fail(msg) {
    card.className = 'dl-card err';
    card.innerHTML =
      '<div class="dl-icon">⚠️</div>' +
      '<h2 class="dl-h">Almost there</h2>' +
      '<p class="dl-sub">' + esc(msg) + '</p>' +
      '<a class="dl-btn ghost" href="/store.html">Back to the store</a>' +
      '<p class="dl-tip">Need a hand? <a href="/contact.html">Contact support</a> with your Stripe receipt and we\'ll fix it fast.</p>';
  }
})();
