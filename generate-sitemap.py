#!/usr/bin/env python3
"""Generate sitemap.xml with proper priorities and varied lastmod dates."""
import os
import glob
from datetime import datetime, timedelta
import hashlib

BASE_URL = "https://veterancareerpath.com"
OUTPUT = "sitemap.xml"

# Priority tiers
HIGH_PRIORITY = {
    "index.html": 1.0,
    "app.html": 0.9,
    "veteran-career-test.html": 0.9,
    "mos-career-translator.html": 0.9,
    "army-mos-careers.html": 0.9,
    "military-transition-guide.html": 0.9,
    "state-veteran-benefits.html": 0.9,
}

# Pages to EXCLUDE from sitemap
EXCLUDE = {
    "admin.html", "sitemap-visual.html", "_REDIRECT_TEMPLATE.html",
    "_email-signup-snippet.html", "vcp-mega-menu.html", "vcp-mega-nav.html",
    "terms-of-service.html", "free-assessment.html", "veteran-career-builder.html",
    "veteran-career-path-landing.html", "va-disability-benefits-calculator.html",
    "offline.html",
}

EXCLUDE_DIRS = {"affiliate", "training", ".firebase", ".claude", ".git", "api", "img"}


def get_priority(filepath):
    basename = os.path.basename(filepath)
    if basename in HIGH_PRIORITY:
        return HIGH_PRIORITY[basename]
    if "/mos/" in filepath.replace("\\", "/"):
        return 0.7
    if "veteran-benefits" in basename:
        return 0.8
    if basename.startswith("va-") or basename.startswith("gi-bill"):
        return 0.8
    if basename.startswith("tools-") or basename.startswith("scout-"):
        return 0.85
    if "/blog/" in filepath.replace("\\", "/"):
        return 0.6
    return 0.7


def get_changefreq(filepath):
    basename = os.path.basename(filepath)
    if basename == "index.html":
        return "weekly"
    if basename.startswith("tools-") or "calculator" in basename:
        return "monthly"
    if "/mos/" in filepath.replace("\\", "/"):
        return "monthly"
    return "monthly"


def get_lastmod(filepath):
    """Use file modification time for lastmod."""
    try:
        mtime = os.path.getmtime(filepath)
        return datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
    except OSError:
        return datetime.now().strftime("%Y-%m-%d")


def should_include(filepath):
    basename = os.path.basename(filepath)
    if basename in EXCLUDE:
        return False
    # Check directory exclusions
    parts = filepath.replace("\\", "/").split("/")
    for part in parts:
        if part in EXCLUDE_DIRS:
            return False
    return True


def filepath_to_url(filepath, root):
    rel = os.path.relpath(filepath, root).replace("\\", "/")
    if rel == "index.html":
        return BASE_URL + "/"
    return f"{BASE_URL}/{rel}"


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    html_files = glob.glob(os.path.join(root, "**", "*.html"), recursive=True)

    entries = []
    for f in sorted(html_files):
        if not should_include(f):
            continue
        url = filepath_to_url(f, root)
        entries.append({
            "loc": url,
            "lastmod": get_lastmod(f),
            "changefreq": get_changefreq(f),
            "priority": get_priority(f),
        })

    # Build XML
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for entry in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{entry['loc']}</loc>")
        lines.append(f"    <lastmod>{entry['lastmod']}</lastmod>")
        lines.append(f"    <changefreq>{entry['changefreq']}</changefreq>")
        lines.append(f"    <priority>{entry['priority']}</priority>")
        lines.append("  </url>")

    lines.append("</urlset>")

    output_path = os.path.join(root, OUTPUT)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Generated {OUTPUT} with {len(entries)} URLs")


if __name__ == "__main__":
    main()
