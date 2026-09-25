// Generates store.html and store-download.html by reusing the site's current inlined
// nav + footer shell (extracted from contact.html) and injecting store-specific content.
// Re-run after a site-wide nav change so the store pages stay in sync:
//   node scripts/build-store-pages.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');

function slice(html, startMarker, endMarker, { includeEnd = false } = {}) {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error('marker not found: ' + startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error('end marker not found: ' + endMarker);
  return html.slice(start, includeEnd ? end + endMarker.length : end);
}

const contact = await readFile(resolve(ROOT, 'contact.html'), 'utf8');
// Nav shell = nav CSS + skip link + nav bar + mega dropdown + mobile menu + nav JS.
const navShell = slice(contact, '<style id="vcp-nav-css">', '<div class="page-header">');
// Footer = the multi-column footer block.
const footer = slice(contact, '<footer style="background:#0d1f3c;padding:2.5rem 6%', '</footer>', { includeEnd: true });

const TRAILING_SCRIPTS = [
  '<script src="/vcp-components.js"></script>',
  '<script defer src="/vcp-scout.js"></script>',
  '<script defer src="/vcp-errors.js"></script>',
].join('\n');

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
.page-header p{font-family:'Source Serif 4',serif;font-size:1.05rem;font-style:italic;font-weight:300;color:rgba(245,240,232,.65);max-width:640px;margin:0 auto;line-height:1.7;}

.store-wrap{max-width:1080px;margin:0 auto;padding:3rem 8% 4rem;}
.store-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:1.25rem 2.25rem;margin-bottom:2.75rem;color:var(--dim);font-size:.82rem;}
.store-trust span{display:inline-flex;align-items:center;gap:.45rem;}
.store-trust b{color:var(--cream);font-weight:600;}

.store-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.75rem;}
.store-loading,.store-empty{grid-column:1/-1;text-align:center;color:var(--dim);padding:3rem 1rem;font-size:.95rem;}

.pc{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:transform .15s,border-color .15s,box-shadow .15s;}
.pc:hover{transform:translateY(-3px);border-color:rgba(200,169,81,.35);box-shadow:0 12px 32px rgba(0,0,0,.35);}
.pc-cover{position:relative;aspect-ratio:3/2;background:linear-gradient(150deg,var(--c1),var(--c2));padding:1.4rem 1.3rem;display:flex;flex-direction:column;justify-content:space-between;border-bottom:3px solid rgba(240,192,64,.5);}
.pc-kicker{font-size:.6rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7);}
.pc-title{font-family:'Bebas Neue',sans-serif;font-size:1.7rem;line-height:1.05;letter-spacing:.02em;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.35);}
.pc-branch{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.85);}
.pc-body{padding:1.4rem 1.35rem 1.5rem;display:flex;flex-direction:column;flex:1;}
.pc-name{font-family:'Bebas Neue',sans-serif;font-size:1.35rem;letter-spacing:.03em;color:var(--white);margin-bottom:.6rem;}
.pc-blurb{font-size:.86rem;line-height:1.65;color:rgba(245,240,232,.72);margin-bottom:1.2rem;flex:1;}
.pc-buy{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.7rem;}
.pc-price{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;letter-spacing:.02em;color:var(--gold2);}
.pc-btn{background:linear-gradient(135deg,var(--gold2),#e0a820);color:var(--navy);font-family:'DM Sans',sans-serif;font-weight:700;font-size:.9rem;padding:.7rem 1.25rem;border:none;border-radius:8px;cursor:pointer;transition:transform .15s,box-shadow .15s,opacity .15s;box-shadow:0 4px 18px rgba(200,169,81,.22);}
.pc-btn:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(200,169,81,.34);}
.pc-btn:disabled{opacity:.6;cursor:wait;transform:none;}
.pc-note{font-size:.72rem;color:var(--dim);}

.store-fineprint{max-width:760px;margin:3rem auto 0;text-align:center;font-size:.78rem;color:var(--dim);line-height:1.7;}
.store-fineprint a{color:var(--gold);}

/* Download page */
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

@media(max-width:560px){.store-grid{grid-template-columns:1fr;}.page-header{padding:3.5rem 6% 3rem;}}`;

function page({ title, description, canonical, bodyContent, script, robots }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">${robots ? `\n<meta name="robots" content="${robots}">` : ''}
<title>${title}</title>
<link rel="icon" type="image/png" sizes="32x32" href="https://veterancareerpath.com/img/optimized/logo-96.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style>
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/vcp-styles.css">
</head>
<body>

${navShell}
${bodyContent}

${DISCLAIMER}

${footer}

${script}
${TRAILING_SCRIPTS}
</body>
</html>
`;
}

const storeBody = `<div class="page-header">
  <div class="label">Veteran Career Path Store</div>
  <h1>Career Field Guides &amp; Handbooks</h1>
  <p>MOS-specific, veteran-written workbooks that translate your service into civilian résumés, interviews, and job offers. Instant PDF download — yours to keep.</p>
</div>

<main id="main-content" class="store-wrap">
  <div class="store-trust">
    <span>🔒 <b>Secure</b> Stripe checkout</span>
    <span>⚡ <b>Instant</b> PDF download</span>
    <span>♾️ <b>Yours to keep</b> — one-time purchase</span>
    <span>🎖️ Written <b>by veterans</b></span>
  </div>

  <div id="store-grid" class="store-grid" aria-live="polite">
    <div class="store-loading">Loading the shelf…</div>
  </div>

  <p class="store-fineprint">Every product is a digital download delivered instantly as a PDF. Because files are delivered immediately, sales are final — but if a download ever fails, <a href="/contact.html">contact us</a> and we'll make it right.</p>
</main>`;

const downloadBody = `<div class="page-header">
  <div class="label">Order Complete</div>
  <h1>Your Download</h1>
  <p>Thanks for supporting a veteran-built resource. Your handbook is ready below.</p>
</div>

<main id="main-content" class="store-wrap">
  <div id="dl-card" class="dl-card">
    <div class="dl-status">Verifying your purchase…</div>
  </div>
</main>`;

await writeFile(resolve(ROOT, 'store.html'), page({
  title: 'Store — Veteran Career Path Field Guides & Handbooks',
  description: 'Veteran-written, MOS-specific career handbooks and workbooks. Translate your military experience into civilian résumés, interviews, and job offers. Instant PDF download.',
  canonical: 'https://veterancareerpath.com/store.html',
  bodyContent: storeBody,
  script: '<script src="/assets/js/store.js"></script>',
}));

await writeFile(resolve(ROOT, 'store-download.html'), page({
  title: 'Your Download — Veteran Career Path',
  description: 'Download your Veteran Career Path handbook.',
  canonical: 'https://veterancareerpath.com/store-download.html',
  bodyContent: downloadBody,
  script: '<script src="/assets/js/store-download.js"></script>',
  robots: 'noindex, nofollow',
}));

console.log('Generated store.html and store-download.html');
