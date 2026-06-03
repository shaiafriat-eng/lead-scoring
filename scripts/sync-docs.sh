#!/usr/bin/env bash
# Build multi-page site and copy into docs/ for GitHub Pages
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/scripts/build-site.mjs"
rm -rf "$ROOT/docs"
mkdir -p "$ROOT/docs"
cp -R "$ROOT/site/." "$ROOT/docs/"
touch "$ROOT/docs/.nojekyll"
echo "Built site/ and synced to docs/ — ready to commit and push."
