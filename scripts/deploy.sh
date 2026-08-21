#!/bin/bash
# Deploy script for Anza Connect frontend
# Usage: ./scripts/deploy.sh [test|live] [--skip-build]

set -e

ENV="${1:-test}"
SKIP_BUILD="${2:-}"

if [ "$ENV" = "live" ]; then
  REMOTE_PATH="/var/www/anzaweb"
  echo "Deploying to LIVE..."
elif [ "$ENV" = "test" ]; then
  REMOTE_PATH="/var/www/anzatestweb"
  echo "Deploying to TEST..."
else
  echo "Usage: $0 [test|live] [--skip-build]"
  exit 1
fi

# Step 1: Build (unless skipped)
if [ "$SKIP_BUILD" != "--skip-build" ]; then
  echo ""
  echo "==> Building..."
  npm run build
fi

# Step 2: Sync only changed files with rsync
echo ""
echo "==> Syncing to server..."
rsync -avz --delete \
  --progress \
  --stats \
  --timeout=30 \
  --exclude='.git' \
  --exclude='node_modules' \
  dist/ "anza:${REMOTE_PATH}/"

echo ""
echo "==> Deploy complete!"
echo "    Files uploaded: $(find dist -type f | wc -l)"
echo "    Total size: $(du -sh dist | cut -f1)"
