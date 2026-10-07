// Build the single "At Risk Vets" hub at /helpvets with the food-bank + shelter
// finders inline (no extra navigation) + crisis hotlines, from the existing
// veteran-homeless-assistance.html shell. The old food/shelters sub-pages become
// redirects to the relevant section on the hub.
import fs from 'fs';

const SRC = 'veteran-homeless-assistance.html';
// Rebuild the shell from the published hub if the source was already turned into a redirect.
let base = fs.readFileSync('helpvets/index.html', 'utf8');
if (base.length < 5000) base = fs.readFileSync(SRC, 'utf8');

// ── Finder + card helpers (match the page's dark locator look) ──
function card(icon, title, desc, links) {
  const btns = links.map((l) => '<a href="' + l.u + '" target="_blank" rel="noopener" style="display:block;padding:.5rem .7rem;background:#f0f5fb;border:1px solid #d9e5f6;border-radius:7px;color:#1a3a6b;text-decoration:none;font-size:.8rem;font-weight:600;text-align:center;">' + l.t + ' &rarr;</a>').join('');
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1rem;margin-bottom:.85rem;">' +
    '<div style="font-weight:700;color:#12294d;font-size:.98rem;margin-bottom:.2rem;">' + icon + ' ' + title + '</div>' +
    (desc ? '<div style="font-size:.85rem;color:#5a6b82;margin-bottom:.7rem;line-height:1.5;">' + desc + '</div>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;">' + btns + '</div></div>';
}
function finderSection(id, emoji, title, desc, inputId, resultsId, fn, cards) {
  return '<div class="sc" id="' + id + '" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:1.25rem;box-shadow:0 1px 6px rgba(26,58,107,.05);overflow:hidden;">' +
    '<div style="background:linear-gradient(135deg,#0a1628,#1a3a6b);padding:1.5rem;">' +
    '<h2 style="margin:0 0 .35rem;font-family:\'Bebas Neue\',sans-serif;font-size:1.4rem;letter-spacing:.06em;color:#f0c040;">' + emoji + ' ' + title + '</h2>' +
    '<p style="font-size:.88rem;color:rgba(192,216,240,.7);margin:0 0 1rem;line-height:1.6;">' + desc + '</p>' +
    '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">' +
    '<input type="text" id="' + inputId + '" placeholder="ZIP code, or city &amp; state (e.g. Austin, TX)" maxlength="60" style="flex:1;min-width:140px;border:2px solid rgba(240,192,64,.3);border-radius:8px;padding:.7rem 1rem;font-size:1rem;font-family:inherit;background:rgba(255,255,255,.08);color:#fff;outline:none;">' +
    '<button onclick="' + fn + '()" style="padding:.7rem 1.5rem;background:linear-gradient(135deg,#c8960a,#e8aa10);border:none;border-radius:8px;font-weight:700;font-size:.95rem;color:#0a1628;cursor:pointer;font-family:inherit;white-space:nowrap;">Find Now</button></div>' +
    '<div id="' + resultsId + '" style="display:none;margin-top:1rem;"></div></div>' +
    '<div style="padding:1.25rem;">' + cards + '</div></div>';
}

// ── CRISIS section (prominent, on-page) ──
const crisisSection =
  '<div class="sc" id="sec-crisis" style="background:linear-gradient(135deg,#b91c1c,#dc2626);border-radius:12px;margin-bottom:1.25rem;box-shadow:0 4px 18px rgba(185,28,28,.25);overflow:hidden;">' +
  '<div style="padding:1.3rem 1.5rem;">' +
  '<h2 style="margin:0 0 .3rem;font-family:\'Bebas Neue\',sans-serif;font-size:1.5rem;letter-spacing:.05em;color:#fff;">&#128222; Crisis Hotlines &mdash; Free &amp; 24/7</h2>' +
  '<p style="margin:0 0 1rem;color:#fde8e8;font-size:.88rem;line-height:1.55;">If you are a veteran in crisis, at risk of losing housing, or just need someone now &mdash; you are not alone. These lines are free, confidential, and open around the clock.</p>' +
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.6rem;">' +
  '<a href="tel:18774243838" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:.75rem 1rem;color:#fff;text-decoration:none;display:block;"><div style="font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#fde68a;">Homeless Veterans</div><div style="font-weight:800;font-size:1.05rem;">1-877-4AID-VET</div><div style="font-size:.72rem;opacity:.85;">1-877-424-3838</div></a>' +
  '<a href="tel:988" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:.75rem 1rem;color:#fff;text-decoration:none;display:block;"><div style="font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#fde68a;">Veterans Crisis Line</div><div style="font-weight:800;font-size:1.05rem;">988, then press 1</div><div style="font-size:.72rem;opacity:.85;">or text 838255</div></a>' +
  '<a href="tel:211" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:.75rem 1rem;color:#fff;text-decoration:none;display:block;"><div style="font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#fde68a;">Local Help (Any Need)</div><div style="font-weight:800;font-size:1.05rem;">Dial 211</div><div style="font-size:.72rem;opacity:.85;">shelter, food, bills, more</div></a>' +
  '<a href="tel:18663483663" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:.75rem 1rem;color:#fff;text-decoration:none;display:block;"><div style="font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#fde68a;">National Hunger Hotline</div><div style="font-weight:800;font-size:1.05rem;">1-866-348-6479</div><div style="font-size:.72rem;opacity:.85;">find food near you</div></a>' +
  '</div></div></div>';

// ── FOOD finder (inline) ──
const foodCards =
  card('&#127970;', 'Food Banks vs. Pantries', 'A <b>food bank</b> supplies hundreds of local <b>pantries</b> and meal programs. You pick up food from a pantry near you &mdash; usually free, with no income proof required. Feeding America covers every U.S. county.', [{ t: 'Find your food bank (Feeding America)', u: 'https://www.feedingamerica.org/find-your-local-foodbank' }, { t: 'Search pantries (FoodPantries.org)', u: 'https://www.foodpantries.org/' }]) +
  card('&#128722;', 'Food Benefits (SNAP &amp; WIC)', 'Monthly money to buy groceries. Many veterans and military families qualify, including those working.', [{ t: 'Apply for SNAP', u: 'https://www.fns.usda.gov/snap/state-directory' }, { t: 'WIC (moms &amp; kids)', u: 'https://www.fns.usda.gov/wic/apply' }]);
const foodFinderJS =
  '<script>function findFood(){var raw=document.getElementById("food-finder-input").value.trim();if(raw.length<3){alert("Please enter your ZIP code, or city and state.");return;}' +
  'var q=encodeURIComponent(raw);var r=document.getElementById("food-results");r.style.display="block";' +
  'function cardH(icon,title,links){var h=\'<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:.75rem .9rem;margin-bottom:.55rem;"><div style="font-weight:700;color:#fff;font-size:.88rem;margin-bottom:.5rem;">\'+icon+" "+title+\'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">\';links.forEach(function(l){h+=\'<a href="\'+l.u+\'" target="_blank" rel="noopener" style="display:block;padding:.45rem .65rem;background:rgba(26,58,107,.4);border:1px solid rgba(26,58,107,.3);border-radius:6px;color:rgba(192,216,240,.85);text-decoration:none;font-size:.78rem;font-weight:500;text-align:center;">\'+l.t+" \\u2192</a>";});return h+"</div></div>";}' +
  'var html=\'<div style="font-weight:700;color:#f0c040;font-size:1rem;margin-bottom:.6rem;font-family:Bebas Neue,sans-serif;letter-spacing:.06em;">Food Help Near \'+raw.replace(/</g,"&lt;")+"</div>";' +
  'html+=cardH("\\uD83C\\uDF7D\\uFE0F","Food banks &amp; pantries",[{t:"Feeding America",u:"https://www.feedingamerica.org/find-your-local-foodbank"},{t:"FoodPantries.org",u:"https://www.foodpantries.org/"},{t:"FindHelp pantries",u:"https://www.findhelp.org/food/food-pantry-near-me?postal="+q},{t:"AmpleHarvest",u:"https://ampleharvest.org/find-pantry/"}]);' +
  'html+=cardH("\\uD83D\\uDCB3","Food benefits & more",[{t:"Apply for SNAP",u:"https://www.fns.usda.gov/snap/state-directory"},{t:"WIC",u:"https://www.fns.usda.gov/wic/apply"},{t:"All food help (FindHelp)",u:"https://www.findhelp.org/food?postal="+q},{t:"Call 211",u:"https://www.211.org/"}]);' +
  'r.innerHTML=html;}document.getElementById("food-finder-input").addEventListener("keydown",function(e){if(e.key==="Enter")findFood();});</script>';
const foodSection = finderSection('sec-food', '&#127869;&#65039;', 'Find Food Banks &amp; Pantries Near You', 'Enter your ZIP code, or city and state, to find food banks, pantries, meal sites, and food benefits in your area. Most are free.', 'food-finder-input', 'food-results', 'findFood', foodCards) + foodFinderJS;

// ── SHELTER finder (inline) ──
const shelterCards =
  card('&#127968;', 'Emergency &amp; Transitional Shelter', 'Emergency shelters give you a safe bed tonight. Transitional housing gives veterans up to 24 months of housing plus support (VA Grant &amp; Per Diem funds many veteran beds).', [{ t: 'HUD Find Shelter', u: 'https://www.hud.gov/findshelter' }, { t: 'VA Grant &amp; Per Diem', u: 'https://www.va.gov/homeless/gpd.asp' }]) +
  card('&#128273;', 'Vouchers &amp; Rapid Re-Housing', 'HUD-VASH pairs a housing voucher with VA case management. SSVF offers rapid re-housing and helps prevent eviction. Both are veteran-specific and free.', [{ t: 'HUD-VASH &amp; SSVF', u: 'https://www.va.gov/homeless/' }, { t: 'Prevent eviction (SSVF)', u: 'https://www.va.gov/homeless/ssvf/' }]);
const shelterFinderJS =
  '<script>function findShelter(){var raw=document.getElementById("shelter-finder-input").value.trim();if(raw.length<3){alert("Please enter your ZIP code, or city and state.");return;}' +
  'var q=encodeURIComponent(raw);var r=document.getElementById("shelter-results");r.style.display="block";' +
  'function cardH(icon,title,links){var h=\'<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:.75rem .9rem;margin-bottom:.55rem;"><div style="font-weight:700;color:#fff;font-size:.88rem;margin-bottom:.5rem;">\'+icon+" "+title+\'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">\';links.forEach(function(l){h+=\'<a href="\'+l.u+\'" target="_blank" rel="noopener" style="display:block;padding:.45rem .65rem;background:rgba(26,58,107,.4);border:1px solid rgba(26,58,107,.3);border-radius:6px;color:rgba(192,216,240,.85);text-decoration:none;font-size:.78rem;font-weight:500;text-align:center;">\'+l.t+" \\u2192</a>";});return h+"</div></div>";}' +
  'var html=\'<div style="font-weight:700;color:#f0c040;font-size:1rem;margin-bottom:.6rem;font-family:Bebas Neue,sans-serif;letter-spacing:.06em;">Shelters & Housing Near \'+raw.replace(/</g,"&lt;")+"</div>";' +
  'html+=cardH("\\uD83C\\uDFE0","Shelter & housing lists",[{t:"HUD Find Shelter",u:"https://www.hud.gov/findshelter"},{t:"Homeless Shelter Directory",u:"https://www.homelessshelterdirectory.org/"},{t:"Shelter Listings",u:"https://www.shelterlistings.org/"},{t:"FindHelp shelter",u:"https://www.findhelp.org/housing/emergency-shelter-near-me?postal="+q}]);' +
  'html+=cardH("\\uD83C\\uDF96\\uFE0F","VA housing for veterans",[{t:"VA homeless services",u:"https://www.va.gov/find-locations/?facilityType=health&serviceType=homeless&address="+q},{t:"Call 1-877-4AID-VET",u:"tel:18774243838"},{t:"HUD-VASH & SSVF",u:"https://www.va.gov/homeless/"},{t:"Grant & Per Diem",u:"https://www.va.gov/homeless/gpd.asp"}]);' +
  'r.innerHTML=html;}document.getElementById("shelter-finder-input").addEventListener("keydown",function(e){if(e.key==="Enter")findShelter();});</script>';
const shelterSection = finderSection('sec-shelter', '&#127968;', 'Find Shelters &amp; Housing Near You', 'Enter your ZIP code, or city and state, to find emergency shelters, transitional housing, and VA housing programs in your area.', 'shelter-finder-input', 'shelter-results', 'findShelter', shelterCards) + shelterFinderJS;

// ── Build the consolidated hub ──
const TITLE = 'At Risk Vets | Help With Housing, Food & Crisis Support';
const DESC = 'Help for veterans who are homeless or at risk: find shelters, food banks, and VA housing near you by ZIP or city, plus free 24/7 crisis hotlines (1-877-4AID-VET, 988, 211). You are not alone.';

let hub = base
  .replace(/https:\/\/veterancareerpath\.com\/veteran-homeless-assistance\.html/g, 'https://veterancareerpath.com/helpvets')
  .replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + DESC + '">')
  .replace(/<meta property="og:description" content="[^"]*">/g, '<meta property="og:description" content="' + DESC + '">')
  .replace(/<meta name="twitter:description" content="[^"]*">/g, '<meta name="twitter:description" content="' + DESC + '">')
  .replace(/<meta property="og:title" content="[^"]*">/g, '<meta property="og:title" content="' + TITLE + '">')
  // empathetic hero
  .replace(/<div id="main-content" class="hero">[\s\S]*?<\/p>\s*<\/div>/,
    '<div id="main-content" class="hero">' +
    '<div class="hero-badge">You Are Not Alone &middot; Housing &middot; Food &middot; Crisis Support</div>' +
    '<h1>At Risk <em>Vets</em></h1>' +
    '<p>Help for veterans who are homeless, facing eviction, or just going through a rough stretch. Find shelters, food, and VA support near you, and reach a real person any time, day or night. Everything here is free.</p></div>');

// Remove the old cards that linked to separate pages (if present) and inject the
// crisis + food + shelter sections right at the top of the main content.
hub = hub.replace(/<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1\.5rem;">[\s\S]*?Find Food Banks[\s\S]*?<\/a>\s*<\/div>/, '');
hub = hub.replace('<main>\n', '<main>\n' + crisisSection + '\n' + shelterSection + '\n' + foodSection + '\n');

// Update the sidebar quick-nav to include the new sections.
hub = hub
  .replace('<option value="sec-national">National Programs</option>',
    '<option value="sec-crisis">Crisis Hotlines</option><option value="sec-shelter">Find Shelter</option><option value="sec-food">Find Food</option><option value="sec-national">National Programs</option>')
  .replace('<a href="#sec-national" class="sb-link">National Programs</a>',
    '<a href="#sec-crisis" class="sb-link">Crisis Hotlines</a><a href="#sec-shelter" class="sb-link">Find Shelter</a><a href="#sec-food" class="sb-link">Find Food</a><a href="#sec-national" class="sb-link">National Programs</a>');

fs.mkdirSync('helpvets', { recursive: true });
fs.writeFileSync('helpvets/index.html', hub);

// Old sub-pages -> redirect to the matching section on the hub.
function redirect(to) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<title>At Risk Vets | Veteran Career Path</title>' +
    '<link rel="canonical" href="https://veterancareerpath.com/helpvets">' +
    '<meta name="robots" content="noindex,follow">' +
    '<meta http-equiv="refresh" content="0; url=' + to + '">' +
    '<script>location.replace("' + to + '");</script></head>' +
    '<body>Moved to <a href="' + to + '">veterancareerpath.com/helpvets</a>.</body></html>';
}
fs.writeFileSync('helpvets/food.html', redirect('https://veterancareerpath.com/helpvets#sec-food'));
fs.writeFileSync('helpvets/shelters.html', redirect('https://veterancareerpath.com/helpvets#sec-shelter'));
fs.writeFileSync(SRC, redirect('https://veterancareerpath.com/helpvets'));

console.log('Built consolidated /helpvets ("At Risk Vets") with inline food + shelter finders + crisis; sub-pages redirect.');
