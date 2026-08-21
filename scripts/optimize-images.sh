#!/bin/bash
# Optimize images in public/images/
# Run: ./scripts/optimize-images.sh

set -e

IMAGES_DIR="public/images"

echo "==> Optimizing SVGs..."
find "$IMAGES_DIR" -name "*.svg" -type f | while read -r file; do
  original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  
  # Remove metadata, comments, editor data, and empty groups
  sed -i '' \
    -e '/<!--.*-->/d' \
    -e '/<metadata[\s\S]*<\/metadata>/d' \
    -e '/<sodipodi:namedview/d' \
    -e '/<inkscape:.*\/>/d' \
    -e 's/inkscape:[^"]*="[^"]*"//g' \
    -e 's/sodipodi:[^"]*="[^"]*"//g' \
    -e 's/serif:[^"]*="[^"]*"//g' \
    -e 's/ns0:[^"]*="[^"]*"//g' \
    -e 's/ns1:[^"]*="[^"]*"//g' \
    "$file" 2>/dev/null || true
  
  new_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  saved=$(( (original_size - new_size) * 100 / original_size ))
  echo "  $file: ${original_size} -> ${new_size} (-${saved}%)"
done

echo ""
echo "==> Image optimization complete!"
echo "    Run 'npm run build' to rebuild with optimized images."
