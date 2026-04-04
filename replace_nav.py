#!/usr/bin/env python3
"""
replace_nav.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Replaces the old VCP nav block with the new mega nav in all HTML files.

HOW TO USE:
  1. Put this file in the ROOT of your Veteran_Career_Builder repo
  2. Put vcp-mega-nav.html in the same folder
  3. Open a terminal in that folder and run:
       python3 replace_nav.py
  4. Review the summary, then:
       git add -A
       git commit -m "feat: replace nav with mega dropdown across all pages"
       git push

The script creates a backup of every file it modifies (.bak extension).
If anything looks wrong, restore with:
       python3 replace_nav.py --restore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import sys
import glob

# ── Config ────────────────────────────────────────────────────────────────────

# The nav replacement file (must be in the same directory as this script)
NAV_FILE = "vcp-mega-nav.html"

# Old nav: starts at this tag
# Note: uses *{ after the tag to avoid matching the comment in vcp-mega-nav.html
NAV_START_TAG = '<style id="vcp-nav-css">'
NAV_START_UNIQUE = '<style id="vcp-nav-css">\n*{box-sizing'  # unique to real tag, not comments

# Old nav: ends at this tag (the closing script tag of vcp-nav-js)
NAV_END_TAG   = '</script>'
NAV_END_AFTER = 'id="vcp-nav-js"'  # safety: only treat </script> as end if nav-js appeared

# Directories and file patterns to skip
SKIP_DIRS  = {'.git', 'node_modules', '__pycache__'}
SKIP_FILES = {'replace_nav.py', 'vcp-mega-nav.html'}

# ── Load new nav content ──────────────────────────────────────────────────────

script_dir = os.path.dirname(os.path.abspath(__file__))
nav_path   = os.path.join(script_dir, NAV_FILE)

if not os.path.exists(nav_path):
    print(f"❌  ERROR: {NAV_FILE} not found in {script_dir}")
    print(f"    Put vcp-mega-nav.html in the same folder as this script.")
    sys.exit(1)

with open(nav_path, "r", encoding="utf-8") as f:
    raw_nav = f.read()

# Strip the leading comment block — use only from <style id="vcp-nav-css"> onwards
nav_start_idx = raw_nav.find(NAV_START_TAG)
if nav_start_idx == -1:
    print(f"❌  ERROR: {NAV_FILE} doesn't contain '{NAV_START_TAG}'")
    sys.exit(1)

NEW_NAV = raw_nav[nav_start_idx:]   # the actual replacement block

# ── Restore mode ──────────────────────────────────────────────────────────────

if "--restore" in sys.argv:
    restored = 0
    for bak in glob.glob(os.path.join(script_dir, "**/*.bak"), recursive=True):
        original = bak[:-4]  # strip .bak
        os.replace(bak, original)
        print(f"  ↩️  Restored {os.path.relpath(original, script_dir)}")
        restored += 1
    print(f"\n✅  Restored {restored} files from backups.")
    sys.exit(0)

# ── Process HTML files ────────────────────────────────────────────────────────

def find_nav_block(content):
    """
    Returns (start, end) character indices of the old nav block,
    or (None, None) if not found.
    The block runs from <style id="vcp-nav-css"> through the </script>
    that closes <script id="vcp-nav-js">.
    """
    # Use the unique anchor (tag + first CSS line) to avoid false matches
    unique = NAV_START_UNIQUE
    start_inner = content.find(unique)
    if start_inner == -1:
        # Fallback: try just the tag (for pages that may format differently)
        start_inner = content.find(NAV_START_TAG + "\n*")
        if start_inner == -1:
            return None, None

    # Walk back to the actual tag start (always at start_inner for our cases)
    start = start_inner

    # Walk forward from start looking for </script> that follows vcp-nav-js
    search_from = start
    nav_js_seen = False

    while True:
        script_close = content.find("</script>", search_from)
        if script_close == -1:
            return None, None  # malformed — skip

        # Check if vcp-nav-js appeared between start and this </script>
        chunk = content[start:script_close]
        if NAV_END_AFTER in chunk:
            end = script_close + len("</script>")
            return start, end

        # Not found yet — keep searching
        search_from = script_close + 1

        # Safety: don't search more than 200KB past start
        if search_from - start > 200_000:
            return None, None


replaced  = 0
skipped   = 0
no_nav    = 0
errors    = []

html_files = []
for root, dirs, files in os.walk(script_dir):
    # Prune skip dirs in-place
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fname in files:
        if fname.endswith(".html") and fname not in SKIP_FILES:
            html_files.append(os.path.join(root, fname))

html_files.sort()
total = len(html_files)

print(f"🔍  Found {total} HTML files to check...\n")

for fpath in html_files:
    rel = os.path.relpath(fpath, script_dir)
    try:
        with open(fpath, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        start, end = find_nav_block(content)

        if start is None:
            no_nav += 1
            continue  # no old nav in this file

        new_content = content[:start] + NEW_NAV + content[end:]

        # Write backup
        bak_path = fpath + ".bak"
        with open(bak_path, "w", encoding="utf-8") as f:
            f.write(content)

        # Write updated file
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)

        replaced += 1
        print(f"  ✅  {rel}")

    except Exception as e:
        errors.append((rel, str(e)))
        print(f"  ❌  {rel}  →  {e}")

# ── Summary ───────────────────────────────────────────────────────────────────

print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Updated:      {replaced} files
⏭️   No nav found: {no_nav} files (skipped)
❌  Errors:       {len(errors)} files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

if errors:
    print("Files with errors:")
    for rel, err in errors:
        print(f"  {rel}: {err}")
    print()

if replaced > 0:
    print("Next steps:")
    print("  git add -A")
    print('  git commit -m "feat: replace nav with mega dropdown across all pages"')
    print("  git push")
    print()
    print("If something looks wrong, restore all files with:")
    print("  python3 replace_nav.py --restore")
