#!/bin/bash
# generate-redirects.sh
# Run this from inside your Veteran_Career_Builder repo directory.
# It replaces each duplicate MOS page with a proper canonical redirect.
# Usage: bash generate-redirects.sh

BASE="https://veterancareerpath.com"

redirect() {
  local FILE=$1
  local TARGET=$2
  cat > "$FILE" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Redirecting...</title>
<meta http-equiv="refresh" content="0; url=${TARGET}">
<link rel="canonical" href="${TARGET}">
<script>window.location.replace("${TARGET}");<\/script>
</head>
<body><p>Redirecting... <a href="${TARGET}">Click here</a></p></body>
</html>
EOF
  echo "✅ Redirected $FILE → $TARGET"
}

# ── Army duplicates ────────────────────────────────────────────────────────────
redirect "11b_seo.html"         "$BASE/mos/army-11b-infantry-careers.html"
redirect "11b_rebuilt.html"     "$BASE/mos/army-11b-infantry-careers.html"
redirect "25b_seo.html"         "$BASE/mos/army-25b-it-specialist-careers.html"
redirect "25b_rebuilt.html"     "$BASE/mos/army-25b-it-specialist-careers.html"
redirect "68w_seo.html"         "$BASE/mos/army-68w-medic-careers.html"
redirect "68w_rebuilt.html"     "$BASE/mos/army-68w-medic-careers.html"
redirect "68w_seo_fixed.html"   "$BASE/mos/army-68w-medic-careers.html"
redirect "35f_rebuilt.html"     "$BASE/mos/army-35f-intelligence-careers.html"
redirect "88m_rebuilt.html"     "$BASE/mos/army-88m-transport-careers.html"

# ── Marine Corps duplicates ────────────────────────────────────────────────────
redirect "0311_seo.html"        "$BASE/mos/marine-0311-rifleman-careers.html"
redirect "0311_rebuilt.html"    "$BASE/mos/marine-0311-rifleman-careers.html"

# ── Navy duplicates ────────────────────────────────────────────────────────────
redirect "ctn_seo.html"         "$BASE/mos/navy-ctn-intelligence-careers.html"
redirect "ctn_rebuilt.html"     "$BASE/mos/navy-ctn-intelligence-careers.html"
redirect "hm_seo.html"          "$BASE/mos/navy-hm-corpsman-careers.html"
redirect "hm_rebuilt.html"      "$BASE/mos/navy-hm-corpsman-careers.html"
redirect "so_rebuilt.html"      "$BASE/mos/navy-so-seal-careers.html"

# ── Air Force duplicates ───────────────────────────────────────────────────────
redirect "3d0x2_seo.html"       "$BASE/mos/af-3d0x2-cyber-careers.html"
redirect "3d0x2_rebuilt.html"   "$BASE/mos/af-3d0x2-cyber-careers.html"
redirect "1t2x1_rebuilt.html"   "$BASE/mos/af-1t2x1-survival-careers.html"

echo ""
echo "Done! Now:"
echo "1. git add -A"
echo "2. git commit -m 'Fix: redirect duplicate MOS pages to canonical URLs'"
echo "3. git push"
