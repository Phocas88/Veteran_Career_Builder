// Generate the /helpvets hub + Food Banks + Shelters pages from the existing
// veteran-homeless-assistance.html shell (keeps the site nav/footer/styles/Scout).
import fs from 'fs';

const SRC = 'veteran-homeless-assistance.html';
const base = fs.readFileSync(SRC, 'utf8');

const HERO_RE = /<div id="main-content" class="hero">[\s\S]*?<\/p>\s*<\/div>/;
const wrapStart = base.indexOf('<div class="wrap">');
const mainEnd = base.indexOf('</main>') + '</main>'.length;
const BEFORE = base.slice(0, wrapStart); // head + crisis banner + hero
const AFTER = base.slice(mainEnd);        // </div> (wrap) + footer + scripts

function hero(badge, h1, p) {
  return '<div id="main-content" class="hero">' +
    '<div class="hero-badge">' + badge + '</div>' +
    '<h1>' + h1 + '</h1>' +
    '<p>' + p + '</p></div>';
}
function sidebar(opts, extra) {
  const links = opts.map((o) => '<a href="#' + o.id + '" class="sb-link">' + o.label + '</a>').join('');
  const sel = opts.map((o) => '<option value="' + o.id + '">' + o.label + '</option>').join('');
  return '<aside class="sidebar"><div class="sb-box"><div class="sb-title">Quick Navigation</div>' +
    '<select class="sb-select" onchange="if(this.value)document.getElementById(this.value).scrollIntoView({behavior:\'smooth\',block:\'start\'});this.selectedIndex=0;">' +
    '<option value="">Jump to section…</option>' + sel + '</select>' + links + '</div>' +
    '<div class="sb-box" style="background:linear-gradient(135deg,#b91c1c,#dc2626);border-color:#b91c1c;">' +
    '<div class="sb-title" style="color:#fff;border-bottom-color:rgba(255,255,255,.3);">Crisis Numbers</div>' +
    '<div style="font-size:.78rem;color:#fff;line-height:1.6;">' +
    '<strong style="color:#fde68a;">Homeless Veterans:</strong><br><a href="tel:18774243838" style="color:#fff;text-decoration:none;font-weight:700;">1-877-424-3838</a><br><br>' +
    '<strong style="color:#fde68a;">Veterans Crisis Line:</strong><br><a href="tel:988" style="color:#fff;text-decoration:none;font-weight:700;">988 (press 1)</a><br><br>' +
    '<strong style="color:#fde68a;">National Hunger Hotline:</strong><br><a href="tel:18663483663" style="color:#fff;text-decoration:none;font-weight:700;">1-866-348-6479</a>' +
    '</div></div>' + (extra || '') + '</aside>';
}

// Reusable section + card helpers (match the existing page look via inline styles).
function section(id, title, inner) {
  return '<div class="sc" id="' + id + '" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:1.25rem;box-shadow:0 1px 6px rgba(26,58,107,.05);overflow:hidden;">' +
    '<div style="background:linear-gradient(135deg,#0a1628,#1a3a6b);padding:.9rem 1.15rem;"><h2 style="margin:0;font-family:\'Bebas Neue\',sans-serif;font-size:1.15rem;letter-spacing:.07em;color:#f0c040;">' + title + '</h2></div>' +
    '<div style="padding:1.25rem;">' + inner + '</div></div>';
}
function card(title, desc, links) {
  const btns = links.map((l) => '<a href="' + l.url + '" target="_blank" rel="noopener" style="display:block;padding:.5rem .7rem;background:#f0f5fb;border:1px solid #d9e5f6;border-radius:7px;color:#1a3a6b;text-decoration:none;font-size:.8rem;font-weight:600;text-align:center;">' + l.text + ' →</a>').join('');
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1rem;margin-bottom:.85rem;">' +
    '<div style="font-weight:700;color:#12294d;font-size:.98rem;margin-bottom:.2rem;">' + title + '</div>' +
    (desc ? '<div style="font-size:.85rem;color:#5a6b82;margin-bottom:.7rem;line-height:1.5;">' + desc + '</div>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem;">' + btns + '</div></div>';
}
function locator(id, title, desc, resultsId, fnName) {
  return '<div class="zip-locator" id="' + id + '" style="background:linear-gradient(135deg,#0a1628,#1a3a6b);border-radius:14px;padding:2rem;margin-bottom:1.5rem;border:1px solid rgba(240,192,64,.2);">' +
    '<h3 style="font-family:\'Bebas Neue\',sans-serif;font-size:1.4rem;letter-spacing:.06em;color:#f0c040;margin-bottom:.35rem;">' + title + '</h3>' +
    '<p style="font-size:.88rem;color:rgba(192,216,240,.7);margin-bottom:1rem;line-height:1.6;">' + desc + '</p>' +
    '<div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;">' +
    '<input type="text" id="' + id + '-input" placeholder="ZIP code, or city & state (e.g. Austin, TX)" maxlength="60" style="flex:1;min-width:140px;border:2px solid rgba(240,192,64,.3);border-radius:8px;padding:.7rem 1rem;font-size:1rem;font-family:inherit;background:rgba(255,255,255,.08);color:#fff;outline:none;">' +
    '<button onclick="' + fnName + '()" style="padding:.7rem 1.5rem;background:linear-gradient(135deg,#c8960a,#e8aa10);border:none;border-radius:8px;font-weight:700;font-size:.95rem;color:#0a1628;cursor:pointer;font-family:inherit;white-space:nowrap;">Find Now</button></div>' +
    '<div id="' + resultsId + '" style="display:none;"></div></div>';
}
const backCard = (href, label) => '<a href="' + href + '" style="display:inline-block;margin-bottom:1rem;color:#1a3a6b;font-weight:600;text-decoration:none;font-size:.9rem;">&larr; ' + label + '</a>';

function page({ title, desc, canonical, badge, h1, heroP, sideOpts, main }) {
  let b = BEFORE
    .replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + desc + '">')
    .replace(/<meta property="og:description" content="[^"]*">/g, '<meta property="og:description" content="' + desc + '">')
    .replace(/<meta name="twitter:description" content="[^"]*">/g, '<meta name="twitter:description" content="' + desc + '">')
    .replace(/<meta property="og:title" content="[^"]*">/g, '<meta property="og:title" content="' + title + '">')
    .replace(/https:\/\/veterancareerpath\.com\/veteran-homeless-assistance\.html/g, canonical)
    .replace(HERO_RE, hero(badge, h1, heroP));
  return b + '<div class="wrap">' + sidebar(sideOpts) + '<main>' + main + '</main>' + AFTER;
}

fs.mkdirSync('helpvets', { recursive: true });

// ───────────────────────── HUB: /helpvets ─────────────────────────
// Keep the existing rich content; just re-point the canonical and add two
// prominent cards linking to the new Food Banks + Shelters finders.
const hubCards =
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">' +
  '<a href="https://veterancareerpath.com/helpvets/shelters.html" style="text-decoration:none;background:linear-gradient(135deg,#12294d,#1c3f74);border:1px solid rgba(240,192,64,.3);border-radius:12px;padding:1.25rem;color:#fff;display:block;">' +
  '<div style="font-size:1.6rem;margin-bottom:.3rem;">🏠</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.25rem;letter-spacing:.05em;color:#f0c040;">Find Emergency Shelters</div><div style="font-size:.82rem;color:rgba(192,216,240,.8);margin-top:.25rem;">Search real shelters & housing by ZIP, city, or state.</div></a>' +
  '<a href="https://veterancareerpath.com/helpvets/food.html" style="text-decoration:none;background:linear-gradient(135deg,#12294d,#1c3f74);border:1px solid rgba(240,192,64,.3);border-radius:12px;padding:1.25rem;color:#fff;display:block;">' +
  '<div style="font-size:1.6rem;margin-bottom:.3rem;">🍽️</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.25rem;letter-spacing:.05em;color:#f0c040;">Find Food Banks & Pantries</div><div style="font-size:.82rem;color:rgba(192,216,240,.8);margin-top:.25rem;">Search food banks, pantries & benefits by ZIP or city.</div></a>' +
  '</div>';
let hub = base
  .replace(/https:\/\/veterancareerpath\.com\/veteran-homeless-assistance\.html/g, 'https://veterancareerpath.com/helpvets')
  .replace('<main>\n', '<main>\n' + hubCards + '\n');
fs.writeFileSync('helpvets/index.html', hub);

// ───────────────────────── FOOD BANKS ─────────────────────────
const foodFinderJS =
  '<script>function findFood(){var raw=document.getElementById("food-finder-input").value.trim();if(raw.length<3){alert("Please enter your ZIP code, or city and state.");return;}' +
  'var q=encodeURIComponent(raw);var r=document.getElementById("food-results");r.style.display="block";' +
  'function cardH(icon,title,desc,links){var h=\'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.85rem 1rem;margin-bottom:.65rem;"><div style="font-weight:700;color:#fff;font-size:.92rem;margin-bottom:.25rem;">\'+icon+" "+title+\'</div><div style="font-size:.8rem;color:rgba(192,216,240,.5);margin-bottom:.6rem;">\'+desc+\'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">\';links.forEach(function(l){h+=\'<a href="\'+l.u+\'" target="_blank" rel="noopener" style="display:block;padding:.45rem .65rem;background:rgba(26,58,107,.4);border:1px solid rgba(26,58,107,.3);border-radius:6px;color:rgba(192,216,240,.85);text-decoration:none;font-size:.78rem;font-weight:500;text-align:center;">\'+l.t+" \\u2192</a>";});return h+"</div></div>";}' +
  'var html=\'<div style="font-weight:700;color:#f0c040;font-size:1.05rem;margin-bottom:.75rem;font-family:Bebas Neue,sans-serif;letter-spacing:.06em;">Food Help Near \'+raw.replace(/</g,"&lt;")+"</div>";' +
  'html+=cardH("\\uD83C\\uDF7D\\uFE0F","Food Banks & Pantries (search & lists)","Find real pantries and food banks near you.",[{t:"Feeding America Food Bank",u:"https://www.feedingamerica.org/find-your-local-foodbank"},{t:"FoodPantries.org",u:"https://www.foodpantries.org/"},{t:"FindHelp, Food Pantries",u:"https://www.findhelp.org/food/food-pantry-near-me?postal="+q},{t:"AmpleHarvest Pantries",u:"https://ampleharvest.org/find-pantry/"}]);' +
  'html+=cardH("\\uD83D\\uDCDE","Call for Food Help","Free, confidential, 24/7.",[{t:"Dial 211",u:"https://www.211.org/"},{t:"USDA Hunger Hotline 1-866-348-6479",u:"tel:18663483663"},{t:"WhyHunger 1-800-548-6479",u:"tel:18005486479"},{t:"MilitaryOneSource",u:"https://www.militaryonesource.mil/"}]);' +
  'html+=cardH("\\uD83D\\uDCB3","Food Benefits (SNAP, WIC)","Monthly help to buy groceries. Veterans and families often qualify.",[{t:"Apply for SNAP",u:"https://www.fns.usda.gov/snap/state-directory"},{t:"WIC (moms & kids)",u:"https://www.fns.usda.gov/wic/apply"},{t:"FindHelp, All Food Help",u:"https://www.findhelp.org/food?postal="+q},{t:"211, Food Assistance",u:"https://www.211.org/"}]);' +
  'r.innerHTML=html;}document.getElementById("food-finder-input").addEventListener("keydown",function(e){if(e.key==="Enter")findFood();});</script>';

const foodMain =
  backCard('https://veterancareerpath.com/helpvets', 'Back to Help for Veterans') +
  '<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.25rem;"><strong style="color:#b91c1c;">Need food today?</strong> Dial <a href="tel:211" style="color:#b91c1c;font-weight:700;">211</a> or call the USDA National Hunger Hotline at <a href="tel:18663483663" style="color:#b91c1c;font-weight:700;">1-866-348-6479</a> (Mon–Fri). They connect you to the nearest open food bank, pantry, or meal site.</div>' +
  locator('food-finder', 'Find Food Banks & Pantries Near You', 'Enter your ZIP code, or your city and state, to find food banks, pantries, meal sites, and food benefits in your area.', 'food-results', 'findFood') +
  section('sec-foodbanks', 'How to Get Food Help', card('🏦 Food Banks vs. Pantries', 'A <b>food bank</b> is a large warehouse that supplies hundreds of local <b>pantries</b> and meal programs. You pick up food from a pantry near you, usually free and with no income proof required. Feeding America runs a network of 200+ food banks covering every U.S. county.', [{ text: 'Find your food bank (Feeding America)', url: 'https://www.feedingamerica.org/find-your-local-foodbank' }, { text: 'Search pantries (FoodPantries.org)', url: 'https://www.foodpantries.org/' }])) +
  section('sec-benefits', 'Food Benefit Programs', card('🛒 SNAP (Food Stamps)', 'Monthly money on a card to buy groceries. Many veterans and military families qualify, including those working. There is no limit on how long you can receive it if you remain eligible.', [{ text: 'Apply in your state', url: 'https://www.fns.usda.gov/snap/state-directory' }, { text: 'Check if you qualify', url: 'https://www.fns.usda.gov/snap/recipient/eligibility' }]) +
    card('👶 WIC + Child Nutrition', 'Food, formula, and nutrition help for pregnant/postpartum moms and kids under 5, plus free school and summer meals for children.', [{ text: 'Apply for WIC', url: 'https://www.fns.usda.gov/wic/apply' }, { text: 'Summer & school meals', url: 'https://www.fns.usda.gov/meals4kids' }])) +
  section('sec-vet-food', 'For Veterans Specifically', card('🎖️ Veteran Food Resources', 'Many VA Medical Centers screen for food insecurity and connect veterans to help. MilitaryOneSource and local VSOs can also point you to emergency food and financial aid.', [{ text: 'VA homeless & social work', url: 'https://www.va.gov/find-locations/?facilityType=health&serviceType=homeless' }, { text: 'MilitaryOneSource', url: 'https://www.militaryonesource.mil/' }, { text: 'All local help (FindHelp)', url: 'https://www.findhelp.org/' }, { text: 'Full Help for Vets hub', url: 'https://veterancareerpath.com/helpvets' }])) +
  foodFinderJS;

fs.writeFileSync('helpvets/food.html', page({
  title: 'Food Banks & Food Assistance for Veterans | Find Help Near You',
  desc: 'Find food banks, pantries, meal sites, and food benefits (SNAP, WIC) for veterans by ZIP code or city. Plus the USDA National Hunger Hotline and veteran food resources.',
  canonical: 'https://veterancareerpath.com/helpvets/food.html',
  badge: 'Food Banks · Pantries · SNAP · Meal Sites',
  h1: 'Food Banks &amp; <em>Food Assistance</em>',
  heroP: 'Find real food banks, pantries, meal sites, and food benefits near you. Most are free, and many require no income proof. No veteran should go hungry.',
  sideOpts: [{ id: 'food-finder', label: 'Find Food Near You' }, { id: 'sec-foodbanks', label: 'How to Get Food' }, { id: 'sec-benefits', label: 'Food Benefits' }, { id: 'sec-vet-food', label: 'For Veterans' }],
  main: foodMain,
}));

// ───────────────────────── SHELTERS ─────────────────────────
const shelterFinderJS =
  '<script>function findShelter(){var raw=document.getElementById("shelter-finder-input").value.trim();if(raw.length<3){alert("Please enter your ZIP code, or city and state.");return;}' +
  'var q=encodeURIComponent(raw);var r=document.getElementById("shelter-results");r.style.display="block";' +
  'function cardH(icon,title,desc,links){var h=\'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.85rem 1rem;margin-bottom:.65rem;"><div style="font-weight:700;color:#fff;font-size:.92rem;margin-bottom:.25rem;">\'+icon+" "+title+\'</div><div style="font-size:.8rem;color:rgba(192,216,240,.5);margin-bottom:.6rem;">\'+desc+\'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">\';links.forEach(function(l){h+=\'<a href="\'+l.u+\'" target="_blank" rel="noopener" style="display:block;padding:.45rem .65rem;background:rgba(26,58,107,.4);border:1px solid rgba(26,58,107,.3);border-radius:6px;color:rgba(192,216,240,.85);text-decoration:none;font-size:.78rem;font-weight:500;text-align:center;">\'+l.t+" \\u2192</a>";});return h+"</div></div>";}' +
  'var html=\'<div style="font-weight:700;color:#f0c040;font-size:1.05rem;margin-bottom:.75rem;font-family:Bebas Neue,sans-serif;letter-spacing:.06em;">Shelters & Housing Near \'+raw.replace(/</g,"&lt;")+"</div>";' +
  'html+=cardH("\\uD83C\\uDFE0","Shelter & Housing Lists","Find real emergency shelters and transitional housing near you.",[{t:"HUD Find Shelter",u:"https://www.hud.gov/findshelter"},{t:"Homeless Shelter Directory",u:"https://www.homelessshelterdirectory.org/"},{t:"Shelter Listings",u:"https://www.shelterlistings.org/"},{t:"FindHelp, Emergency Shelter",u:"https://www.findhelp.org/housing/emergency-shelter-near-me?postal="+q}]);' +
  'html+=cardH("\\uD83C\\uDF96\\uFE0F","VA Housing for Veterans","VA programs and case managers that get veterans off the street.",[{t:"VA Homeless Programs (nearby)",u:"https://www.va.gov/find-locations/?facilityType=health&serviceType=homeless&address="+q},{t:"Call 1-877-4AID-VET",u:"tel:18774243838"},{t:"HUD-VASH & SSVF info",u:"https://www.va.gov/homeless/"},{t:"Grant & Per Diem",u:"https://www.va.gov/homeless/gpd.asp"}]);' +
  'html+=cardH("\\uD83D\\uDCDE","Call for a Bed Tonight","24/7. They know what is open right now near you.",[{t:"Dial 211",u:"https://www.211.org/"},{t:"Homeless Veterans 1-877-424-3838",u:"tel:18774243838"},{t:"Veterans Crisis Line 988",u:"tel:988"},{t:"Salvation Army",u:"https://www.salvationarmyusa.org/usn/provide-shelter/"}]);' +
  'r.innerHTML=html;}document.getElementById("shelter-finder-input").addEventListener("keydown",function(e){if(e.key==="Enter")findShelter();});</script>';

const shelterMain =
  backCard('https://veterancareerpath.com/helpvets', 'Back to Help for Veterans') +
  '<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.25rem;"><strong style="color:#b91c1c;">Need a bed tonight?</strong> Call the National Call Center for Homeless Veterans at <a href="tel:18774243838" style="color:#b91c1c;font-weight:700;">1-877-424-3838</a> or dial <a href="tel:211" style="color:#b91c1c;font-weight:700;">211</a>. Both are free, 24/7, and will find the nearest open shelter.</div>' +
  locator('shelter-finder', 'Find Shelters & Housing Near You', 'Enter your ZIP code, or your city and state, to find emergency shelters, transitional housing, and VA housing programs in your area.', 'shelter-results', 'findShelter') +
  section('sec-types', 'Types of Housing Help', card('🏠 Emergency & Transitional Shelter', 'Emergency shelters give you a safe bed tonight. Transitional housing gives veterans up to 24 months of housing plus support to get back on their feet (the VA Grant & Per Diem program funds many beds reserved for veterans).', [{ text: 'HUD Find Shelter', url: 'https://www.hud.gov/findshelter' }, { text: 'VA Grant & Per Diem', url: 'https://www.va.gov/homeless/gpd.asp' }]) +
    card('🔑 Housing Vouchers & Rapid Re-Housing', 'HUD-VASH combines a Section 8 housing voucher with VA case management. SSVF offers rapid re-housing and help preventing eviction. Both are veteran-specific and free.', [{ text: 'HUD-VASH & SSVF', url: 'https://www.va.gov/homeless/' }, { text: 'Prevent eviction (SSVF)', url: 'https://www.va.gov/homeless/ssvf/' }])) +
  section('sec-va-housing', 'VA Housing Programs', card('🎖️ Start With the VA', 'If you are a veteran at risk of or experiencing homelessness, the VA has dedicated case managers. Call 1-877-4AID-VET any time, or use the locator to find VA homeless services near you.', [{ text: 'VA homeless services nearby', url: 'https://www.va.gov/find-locations/?facilityType=health&serviceType=homeless' }, { text: 'VA Homeless Programs', url: 'https://www.va.gov/homeless/' }, { text: 'Full Help for Vets hub', url: 'https://veterancareerpath.com/helpvets' }, { text: 'Find food banks too', url: 'https://veterancareerpath.com/helpvets/food.html' }])) +
  shelterFinderJS;

fs.writeFileSync('helpvets/shelters.html', page({
  title: 'Homeless Shelters for Veterans | Find Shelter Near You by ZIP or City',
  desc: 'Find emergency homeless shelters, transitional housing, and VA housing programs (HUD-VASH, SSVF) for veterans by ZIP code, city, or state. Free 24/7 homeless veteran hotline 1-877-4AID-VET.',
  canonical: 'https://veterancareerpath.com/helpvets/shelters.html',
  badge: 'Shelters · Transitional Housing · HUD-VASH · SSVF',
  h1: 'Homeless Shelters <em>for Veterans</em>',
  heroP: 'Find real emergency shelters, transitional housing, and veteran-specific VA housing programs near you. Call 1-877-4AID-VET any time for a bed tonight.',
  sideOpts: [{ id: 'shelter-finder', label: 'Find Shelter Near You' }, { id: 'sec-types', label: 'Types of Help' }, { id: 'sec-va-housing', label: 'VA Housing' }],
  main: shelterMain,
}));

// ───────────────────────── REDIRECT the old URL ─────────────────────────
const redirect = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
  '<title>Help for Homeless Veterans | Veteran Career Path</title>' +
  '<link rel="canonical" href="https://veterancareerpath.com/helpvets">' +
  '<meta name="robots" content="noindex,follow">' +
  '<meta http-equiv="refresh" content="0; url=https://veterancareerpath.com/helpvets">' +
  '<script>location.replace("https://veterancareerpath.com/helpvets");</script></head>' +
  '<body>Moved to <a href="https://veterancareerpath.com/helpvets">veterancareerpath.com/helpvets</a>.</body></html>';
fs.writeFileSync(SRC, redirect);

console.log('Built helpvets/index.html, helpvets/food.html, helpvets/shelters.html, and redirect stub.');
