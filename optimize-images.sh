#!/bin/bash
# Image Optimization Script for VCP
# Requires: ImageMagick (convert) or similar tool
# Run: bash optimize-images.sh
#
# The branch emblems (army.png, navy.png, etc.) are displayed at 48x48px
# but are 1-2.4MB each. This resizes them to reasonable dimensions and
# generates WebP versions for modern browsers.
#
# Install ImageMagick: winget install ImageMagick.ImageMagick
# Or on Mac: brew install imagemagick

echo "=== VCP Image Optimization ==="

# Branch emblems - max display size is ~80px, resize to 200px for retina
EMBLEMS="army.png navy.png marines.png airforce.png coastguard.png spaceforce.png"

for img in $EMBLEMS; do
  if [ -f "$img" ]; then
    echo "Optimizing $img..."
    # Create optimized PNG (200px for 2x retina at 96px display)
    convert "$img" -resize 200x200 -strip -quality 85 "img/${img%.png}-200.png" 2>/dev/null
    # Create WebP version
    convert "$img" -resize 200x200 -strip -quality 80 "img/${img%.png}-200.webp" 2>/dev/null
    echo "  -> img/${img%.png}-200.png + .webp"
  fi
done

# Logo - used at 28-48px, resize to 192px for retina + PWA icon
if [ -f "logo.png" ]; then
  echo "Optimizing logo.png..."
  convert logo.png -resize 192x192 -strip -quality 85 "img/logo-192.png" 2>/dev/null
  convert logo.png -resize 512x512 -strip -quality 85 "img/logo-512.png" 2>/dev/null
  convert logo.png -resize 192x192 -strip -quality 80 "img/logo-192.webp" 2>/dev/null
  echo "  -> img/logo-192.png, img/logo-512.png, img/logo-192.webp"
fi

echo ""
echo "=== Done! ==="
echo "Next steps:"
echo "1. Update HTML to reference img/*-200.png instead of root *.png"
echo "2. Add <picture> elements with WebP sources for modern browsers"
echo "3. Once verified, remove the massive root-level PNGs"
echo ""
echo "Example HTML:"
echo '<picture>'
echo '  <source srcset="/img/army-200.webp" type="image/webp">'
echo '  <img src="/img/army-200.png" alt="U.S. Army" width="48" height="48" loading="lazy">'
echo '</picture>'
