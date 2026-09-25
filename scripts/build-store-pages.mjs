// Generates the store from data/store-products.json, reusing the site's current inlined
// nav + footer shell (extracted from contact.html):
//   store.html                 — catalog grid (a card per product, links to product pages)
//   store/<sku>.html           — a static product detail page per book (own meta/OG/schema)
//   store-download.html        — post-payment delivery page
// Re-run after adding a product or changing the nav:
//   node scripts/build-store-pages.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const BASE = 'https://veterancareerpath.com';

function slice(html, startMarker, endMarker, { includeEnd = false } = {}) {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error('marker not found: ' + startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error('end marker not found: ' + endMarker);
  return html.slice(start, includeEnd ? end + endMarker.length : end);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function abs(path) { return /^https?:/.test(path) ? path : BASE + path; }

const contact = await readFile(resolve(ROOT, 'contact.html'), 'utf8');
const navShell = slice(contact, '<style id="vcp-nav-css">', '<div class="page-header">');
const footer = slice(contact, '<footer style="background:#0d1f3c;padding:2.5rem 6%', '</footer>', { includeEnd: true });

const DISCLAIMER = `<div class="disclaimer">
  <div class="disclaimer-box">
    <strong style="color:var(--cream);">Not affiliated with any government agency.</strong> Veteran Career Path is an independent platform operated by StreamSync Solutions. We are not affiliated with, endorsed by, or connected to the U.S. Department of Defense, the Department of Veterans Affairs, or any branch of the U.S. Armed Forces. Handbooks are general career-transition guidance, not legal, tax, financial, or medical advice.
  </div>
</div>`;

const PAGE_CSS = `.vcp-skip-link{position:absolute;top:-100%;left:50%;transform:translateX(-50%);background:#f0c040;color:#0a1628;padding:.75rem 1.5rem;font-weight:700;font-size:.9rem;border-radius:0 0 8px 8px;z-index:99999;text-decoration:none;transition:top .2s;}.vcp-skip-link:focus{top:0;}
:root{--navy:#0d1f3c;--navy2:#1a3a6b;--gold:#c8a951;--gold2:#f0c040;--cream:#f5f0e8;--dim:#6a82a0;--white:#fff;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#050d18;color:var(--cream);min-height:100vh;}
img,video,iframe{max-width:100%;}
.page-header{background:linear-gradient(160deg,#0d1f3c,#080f1c);padding:4.5rem 8% 3.5rem;border-bottom:1px solid rgba(200,169,81,.1);text-align:center;}
.page-header .label{font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem;}
.page-header h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.6rem,6vw,4.2rem);letter-spacing:.04em;color:var(--white);margin-bottom:.75rem;}
.page-header p{font-family:'Source Serif 4',serif;font-size:1.05rem;font-style:italic;font-weight:300;color:rgba(245,240,232,.7);max-width:640px;margin:0 auto;line-height:1.7;}
.store-header{padding:3rem 8% 2.2rem;}

/* ── catalog grid ── */
.store-wrap{max-width:1080px;margin:0 auto;padding:2.5rem 6% 6rem;}
.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.5rem;}
.sc-card{display:flex;flex-direction:column;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .15s,border-color .15s,box-shadow .15s;}
.sc-card:hover{transform:translateY(-3px);border-color:rgba(200,169,81,.35);box-shadow:0 12px 32px rgba(0,0,0,.35);}
.sc-cover{background:#0b1524;border-bottom:1px solid rgba(255,255,255,.06);}
.sc-cover img{display:block;width:100%;height:auto;}
.sc-body{padding:1.1rem 1.15rem 1.2rem;display:flex;flex-direction:column;flex:1;}
.sc-title{font-family:'Bebas Neue',sans-serif;font-size:1.28rem;letter-spacing:.02em;color:var(--white);margin-bottom:.5rem;line-height:1.1;}
.sc-blurb{font-size:.83rem;line-height:1.55;color:rgba(245,240,232,.72);margin-bottom:1rem;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.sc-foot{display:flex;align-items:center;justify-content:space-between;}
.sc-price{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--gold2);letter-spacing:.02em;}
.sc-cta{font-size:.82rem;font-weight:600;color:var(--gold);}
.sc-card:hover .sc-cta{color:#fff;}
.store-empty{text-align:center;color:var(--dim);padding:3rem 1rem;font-size:.95rem;}

/* ── product detail ── */
.p-crumb{max-width:1000px;margin:0 auto;padding:1.4rem 6% 0;}
.p-crumb a{color:var(--dim);text-decoration:none;font-size:.85rem;}
.p-crumb a:hover{color:var(--cream);}
.p-wrap{max-width:1000px;margin:0 auto;padding:1.2rem 6% 6rem;}
.p-top{display:grid;grid-template-columns:1fr;gap:1.5rem;align-items:start;}
.p-cover{padding:0;border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;background:#0b1524;cursor:zoom-in;display:block;width:100%;max-width:300px;margin:0 auto;box-shadow:0 12px 40px rgba(0,0,0,.4);}
.p-cover img{display:block;width:100%;height:auto;}
.p-head{display:flex;flex-direction:column;}
.p-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.9rem,6vw,2.6rem);line-height:1.05;letter-spacing:.02em;color:var(--white);margin-bottom:.6rem;}
.p-sub{font-size:.95rem;line-height:1.6;color:rgba(245,240,232,.8);margin-bottom:1rem;}
.p-meta{font-size:1rem;color:var(--cream);margin-bottom:1rem;}
.p-meta strong{color:var(--gold2);font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:.02em;}
.p-buy{background:linear-gradient(135deg,var(--gold2),#e0a820);color:var(--navy);font-family:'DM Sans',sans-serif;font-weight:700;font-size:1.02rem;padding:.85rem 1.6rem;border:none;border-radius:10px;cursor:pointer;box-shadow:0 4px 20px rgba(200,169,81,.25);transition:transform .15s,box-shadow .15s,opacity .15s;align-self:flex-start;}
.p-buy:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(200,169,81,.35);}
.p-buy:disabled{opacity:.6;cursor:wait;transform:none;}
.p-samplelink{margin-top:.8rem;font-size:.85rem;color:var(--gold);text-decoration:none;}
.p-samplelink:hover{text-decoration:underline;}
.p-microtrust{margin-top:1rem;font-size:.74rem;color:var(--dim);}
.p-block{margin-top:2.75rem;}
.p-block h2{font-family:'Bebas Neue',sans-serif;font-size:1.55rem;letter-spacing:.04em;color:var(--white);margin-bottom:1rem;}
.p-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.9rem;}
.p-thumb{padding:0;border:1px solid rgba(255,255,255,.1);border-radius:8px;overflow:hidden;background:#0b1524;cursor:zoom-in;}
.p-thumb img{display:block;width:100%;height:auto;}
.p-thumb:hover{border-color:rgba(200,169,81,.4);}
.p-thumbs-note{margin-top:.6rem;font-size:.76rem;color:var(--dim);}
.p-inside-meta{font-size:.76rem;color:var(--gold);letter-spacing:.03em;margin-bottom:.9rem;text-transform:uppercase;font-weight:600;}
.p-inside-list{list-style:none;display:grid;gap:.6rem;}
.p-inside-list li{position:relative;padding-left:1.5rem;font-size:.9rem;line-height:1.6;color:rgba(245,240,232,.85);}
.p-inside-list li::before{content:'✓';position:absolute;left:0;color:var(--gold2);font-weight:700;}
.p-how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;}
.p-how-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:1.1rem;}
.p-how-ic{font-size:1.4rem;margin-bottom:.4rem;}
.p-how-t{font-weight:600;color:var(--white);font-size:.9rem;margin-bottom:.3rem;}
.p-how-b{font-size:.82rem;line-height:1.55;color:rgba(245,240,232,.72);}
.p-how-b a{color:var(--gold);}
.p-buy-row{display:flex;align-items:center;gap:1.1rem;margin-top:1.75rem;flex-wrap:wrap;}
.p-buy-price{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:var(--gold2);letter-spacing:.02em;}
.store-fineprint{max-width:720px;margin:3rem auto 0;text-align:center;font-size:.78rem;color:var(--dim);line-height:1.7;padding-right:3.5rem;}
.store-fineprint a{color:var(--gold);}

@media(min-width:720px){
  .p-top{grid-template-columns:300px 1fr;gap:2.5rem;}
  .p-cover{margin:0;}
}

/* keep the floating back-to-top clear of the fine print */
.vcp-back-to-top{bottom:150px!important;}

/* ── lightbox ── */
.lb{position:fixed;inset:0;background:rgba(5,10,20,.94);z-index:99998;display:none;align-items:center;justify-content:center;padding:2.5rem 1rem;}
.lb.open{display:flex;}
.lb-fig{margin:0;max-width:900px;max-height:100%;display:flex;flex-direction:column;align-items:center;gap:.6rem;overflow:auto;}
.lb-img{max-width:100%;max-height:82vh;border-radius:6px;box-shadow:0 12px 48px rgba(0,0,0,.6);background:#fff;}
.lb-cap{color:rgba(245,240,232,.75);font-size:.82rem;text-align:center;}
.lb-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:1.1rem;cursor:pointer;z-index:2;}
.lb-close:hover{background:rgba(255,255,255,.2);}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:1.6rem;line-height:1;cursor:pointer;z-index:2;}
.lb-nav:hover{background:rgba(255,255,255,.2);}
.lb-prev{left:1rem;}.lb-next{right:1rem;}
@media(max-width:520px){.lb-nav{width:38px;height:38px;font-size:1.3rem;}.lb-prev{left:.3rem;}.lb-next{right:.3rem;}}

/* ── download page ── */
.dl-wrap{max-width:1000px;margin:0 auto;padding:2.5rem 6% 6rem;}
.dl-card{max-width:560px;margin:0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2.75rem 2rem;text-align:center;}
.dl-card.ok{border-color:rgba(74,222,128,.3);}
.dl-card.err{border-color:rgba(240,192,64,.3);}
.dl-icon{font-size:3rem;margin-bottom:1rem;}
.dl-status{color:var(--dim);font-size:.95rem;}
.dl-h{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.03em;color:var(--white);margin-bottom:.5rem;}
.dl-sub{font-size:.95rem;color:rgba(245,240,232,.75);line-height:1.6;margin-bottom:1.6rem;}
.dl-btn{display:inline-block;background:linear-gradient(135deg,var(--gold2),#e0a820);color:var(--navy);font-weight:700;font-size:1rem;padding:.85rem 2rem;border-radius:10px;text-decoration:none;box-shadow:0 4px 20px rgba(200,169,81,.25);transition:transform .15s,box-shadow .15s;}
.dl-btn:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(200,169,81,.35);}
.dl-btn.ghost{background:transparent;color:var(--cream);border:1px solid rgba(255,255,255,.2);box-shadow:none;}
.dl-tip{font-size:.78rem;color:var(--dim);line-height:1.6;margin-top:1.25rem;}
.dl-tip a{color:var(--gold);}

.disclaimer{max-width:900px;margin:0 auto;padding:0 8% 4rem;}
.disclaimer-box{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:1.25rem 1.5rem;font-size:.78rem;color:var(--dim);line-height:1.7;}
@media(max-width:560px){.store-header{padding:2.2rem 6% 1.6rem;}.store-fineprint{padding-right:3.5rem;}}`;

function pageHTML({ title, description, canonical, robots, ogImage, jsonLd, bodyContent, extraScript }) {
  const trailing = [
    extraScript || '',
    '<script src="/vcp-components.js"></script>',
    '<script defer src="/vcp-scout.js"></script>',
    '<script defer src="/vcp-errors.js"></script>',
  ].filter(Boolean).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${esc(description)}">${robots ? `\n<meta name="robots" content="${robots}">` : ''}
<title>${esc(title)}</title>
<link rel="icon" type="image/png" sizes="32x32" href="https://veterancareerpath.com/img/optimized/logo-96.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
<meta property="og:type" content="${jsonLd ? 'product' : 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">${ogImage ? `\n<meta property="og:image" content="${esc(ogImage)}">` : ''}
<style>${PAGE_CSS}</style>
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/vcp-styles.css">${jsonLd ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>

${navShell}
${bodyContent}

${DISCLAIMER}

${footer}

${trailing}
</body>
</html>
`;
}

// ── catalog card ──
function catalogCard(p) {
  return `<a class="sc-card" href="/store/${esc(p.sku)}.html">
    <div class="sc-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)} cover" loading="lazy"></div>
    <div class="sc-body">
      <h2 class="sc-title">${esc(p.title)}</h2>
      <p class="sc-blurb">${esc(p.subcopy)}</p>
      <div class="sc-foot"><span class="sc-price">${esc(p.price)}</span><span class="sc-cta">View details →</span></div>
    </div>
  </a>`;
}

// ── product detail body ──
function howCard(icon, title, body) {
  return `<div class="p-how-card"><div class="p-how-ic">${icon}</div><div class="p-how-t">${title}</div><div class="p-how-b">${body}</div></div>`;
}
function productBody(p) {
  const samples = Array.isArray(p.samples) ? p.samples : [];
  const thumbs = samples.map(function (s) {
    return `<button class="p-thumb" type="button" data-lb data-cap="${esc(s.caption || '')}"><img src="${esc(s.src)}" alt="${esc(s.caption || 'Sample page')}" loading="lazy"></button>`;
  }).join('\n        ');
  const inside = (p.whatsInside || []).map(function (x) { return `<li>${esc(x)}</li>`; }).join('\n          ');
  const pagesLine = p.pages ? (p.pages + '-page workbook · ') : '';
  return `<nav class="p-crumb"><a href="/store.html">‹ Back to Store</a></nav>

<main id="main-content" class="p-wrap">
  <article class="product">
    <div class="p-top">
      <button class="p-cover" type="button" data-lb data-cap="${esc(p.title)} — cover" aria-label="View cover larger">
        <img src="${esc(p.cover)}" alt="${esc(p.title)} cover">
      </button>
      <div class="p-head">
        <h1 class="p-title">${esc(p.title)}</h1>
        <p class="p-sub">${esc(p.subcopy)}</p>
        <div class="p-meta">${esc(p.format || 'PDF download')} · <strong>${esc(p.price)}</strong></div>
        <button class="p-buy" type="button" data-sku="${esc(p.sku)}">Buy &amp; Download</button>
        <a class="p-samplelink" href="#samples">See sample pages ↓</a>
        <div class="p-microtrust">🔒 Secure Stripe checkout · Instant download · Yours to keep</div>
      </div>
    </div>

    <section id="samples" class="p-block p-samples">
      <h2>See inside</h2>
      <div class="p-thumbs">
        ${thumbs}
      </div>
      <p class="p-thumbs-note">Tap any page to enlarge.</p>
    </section>

    <section class="p-block p-inside">
      <h2>What's inside</h2>
      <p class="p-inside-meta">${pagesLine}instant PDF · covers 11A · 11B · 11C · 11Z</p>
      <ul class="p-inside-list">
          ${inside}
      </ul>
    </section>

    <section class="p-block p-how">
      <h2>How it works</h2>
      <div class="p-how-grid">
        ${howCard('🔒', 'Secure checkout', 'Payment is handled by Stripe. No card details ever touch this site.')}
        ${howCard('⚡', 'Instant delivery', 'Your PDF downloads on the confirmation page the moment payment clears — no waiting on email.')}
        ${howCard('♾️', 'Yours to keep', 'Re-download from the confirmation page for 60 days, on any device.')}
        ${howCard('💬', 'Need help?', 'Any trouble with a download? <a href="/contact.html">Contact us</a> and we&rsquo;ll send it directly.')}
      </div>
      <div class="p-buy-row"><span class="p-buy-price">${esc(p.price)}</span><button class="p-buy" type="button" data-sku="${esc(p.sku)}">Buy &amp; Download</button></div>
    </section>
  </article>

  <p class="store-fineprint">Digital download delivered instantly as a PDF. Because files are delivered immediately, sales are final — but if a download ever fails, <a href="/contact.html">contact us</a> and we'll make it right.</p>
</main>`;
}

// ── build ──
const products = JSON.parse(await readFile(resolve(ROOT, 'data/store-products.json'), 'utf8'));

// Catalog
const cards = products.length
  ? `<div class="sc-grid">\n    ${products.map(catalogCard).join('\n    ')}\n  </div>`
  : `<div class="store-empty">New field guides are on the way. Check back soon.</div>`;
const catalogBody = `<div class="page-header store-header">
  <div class="label">Veteran Career Path Store</div>
  <h1>Career Field Guides &amp; Handbooks</h1>
</div>

<main id="main-content" class="store-wrap">
  ${cards}
  <p class="store-fineprint">Every product is a digital download delivered instantly as a PDF. Because files are delivered immediately, sales are final — but if a download ever fails, <a href="/contact.html">contact us</a> and we'll make it right.</p>
</main>`;

await writeFile(resolve(ROOT, 'store.html'), pageHTML({
  title: 'Store — Veteran Career Path Field Guides & Handbooks',
  description: 'MOS-specific career handbooks and workbooks for veterans. Translate your military experience into a civilian résumé, compare career paths, and practice interviews. Instant PDF download.',
  canonical: BASE + '/store.html',
  bodyContent: catalogBody,
}));

// Product pages
await mkdir(resolve(ROOT, 'store'), { recursive: true });
for (const p of products) {
  const url = BASE + '/store/' + p.sku + '.html';
  const priceNum = String(p.price).replace(/[^0-9.]/g, '') || '0';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.title, image: abs(p.cover), description: p.subcopy,
    brand: { '@type': 'Brand', name: 'Veteran Career Path' },
    offers: { '@type': 'Offer', price: priceNum, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url },
  };
  await writeFile(resolve(ROOT, 'store', p.sku + '.html'), pageHTML({
    title: p.title + ' — Veteran Career Path',
    description: p.subcopy,
    canonical: url,
    ogImage: abs(p.cover),
    jsonLd,
    bodyContent: productBody(p),
    extraScript: '<script src="/assets/js/store-product.js"></script>',
  }));
}

// Download page
const downloadBody = `<div class="page-header store-header">
  <div class="label">Order Complete</div>
  <h1>Your Download</h1>
</div>

<main id="main-content" class="dl-wrap">
  <div id="dl-card" class="dl-card">
    <div class="dl-status">Verifying your purchase…</div>
  </div>
</main>`;
await writeFile(resolve(ROOT, 'store-download.html'), pageHTML({
  title: 'Your Download — Veteran Career Path',
  description: 'Download your Veteran Career Path handbook.',
  canonical: BASE + '/store-download.html',
  robots: 'noindex, nofollow',
  bodyContent: downloadBody,
  extraScript: '<script src="/assets/js/store-download.js"></script>',
}));

console.log('Generated store.html (catalog), ' + products.length + ' product page(s), and store-download.html');
