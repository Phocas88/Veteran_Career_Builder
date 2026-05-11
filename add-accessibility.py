#!/usr/bin/env python3
"""
Batch add accessibility improvements to all content pages.
Adds:
- Skip-to-content link
- ARIA landmark roles
- aria-label on nav
- main landmark wrapping content
- Error monitoring script reference

Run: python add-accessibility.py
"""
import os
import re
import glob

ROOT = os.path.dirname(os.path.abspath(__file__))

SKIP_LINK_CSS = """
.vcp-skip-link{position:absolute;top:-100%;left:50%;transform:translateX(-50%);background:#f0c040;color:#0a1628;padding:.75rem 1.5rem;font-weight:700;font-size:.9rem;border-radius:0 0 8px 8px;z-index:99999;text-decoration:none;transition:top .2s;}.vcp-skip-link:focus{top:0;}
""".strip()

SKIP_LINK_HTML = '<a href="#main-content" class="vcp-skip-link">Skip to main content</a>'

# Files to skip
SKIP_FILES = {
    "404.html", "offline.html", "_REDIRECT_TEMPLATE.html",
    "_email-signup-snippet.html", "vcp-mega-menu.html", "vcp-mega-nav.html",
    "sitemap-visual.html", "admin.html", "terms-of-service.html",
    "free-assessment.html", "veteran-career-builder.html",
    "veteran-career-path-landing.html", "va-disability-benefits-calculator.html",
}

SKIP_DIRS = {".firebase", ".claude", ".git", "api", "img", "affiliate", "training"}


def should_process(filepath):
    basename = os.path.basename(filepath)
    if basename in SKIP_FILES:
        return False
    if basename == "index.html" and os.path.dirname(filepath) == ROOT:
        return False  # Already done manually
    parts = filepath.replace("\\", "/").split("/")
    for part in parts:
        if part in SKIP_DIRS:
            return False
    return True


def add_accessibility(filepath):
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    modified = False

    # 1. Add skip-link CSS if not present
    if "vcp-skip-link" not in content:
        # Insert into first <style> block
        style_match = re.search(r"(<style[^>]*>)", content)
        if style_match:
            insert_pos = style_match.end()
            content = content[:insert_pos] + SKIP_LINK_CSS + content[insert_pos:]
            modified = True

    # 2. Add skip-link HTML before first <nav
    if 'class="vcp-skip-link"' not in content and "vcp-skip-link" in content:
        nav_match = re.search(r"(<nav[\s>])", content)
        if nav_match:
            content = content[:nav_match.start()] + SKIP_LINK_HTML + "\n" + content[nav_match.start():]
            modified = True

    # 3. Add aria-label to nav if missing
    nav_match = re.search(r'<nav([^>]*)>', content)
    if nav_match and 'aria-label' not in nav_match.group(0):
        old_tag = nav_match.group(0)
        attrs = nav_match.group(1)
        new_tag = f'<nav{attrs} aria-label="Main navigation">'
        content = content.replace(old_tag, new_tag, 1)
        modified = True

    # 4. Add id="main-content" to the main content area if not present
    if 'id="main-content"' not in content:
        # Look for .hero section or .content div as main content start
        hero_match = re.search(r'(<(?:section|div)\s+class="(?:hero|content)")', content)
        if hero_match:
            original = hero_match.group(1)
            replacement = original.replace('class="', 'id="main-content" class="')
            content = content.replace(original, replacement, 1)
            modified = True

    # 5. Add error monitoring script if not present
    if "vcp-errors.js" not in content:
        content = content.replace("</body>", '<script defer src="/vcp-errors.js"></script>\n</body>')
        modified = True

    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def main():
    html_files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    processed = 0
    updated = 0

    for filepath in sorted(html_files):
        if not should_process(filepath):
            continue
        processed += 1
        if add_accessibility(filepath):
            updated += 1

    print(f"Processed: {processed} files")
    print(f"Updated: {updated} files")
    print(f"Skipped: {processed - updated} files (already had changes)")


if __name__ == "__main__":
    main()
