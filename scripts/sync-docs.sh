#!/usr/bin/env bash
# Copy standalone HTML + assets into docs/ for GitHub Pages
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/docs/assets"
cp "$ROOT/OPEN-THIS-FILE.html" "$ROOT/docs/index.html"
cp -R "$ROOT/assets/"* "$ROOT/docs/assets/" 2>/dev/null || true
touch "$ROOT/docs/.nojekyll"
echo "Synced to docs/ — ready to commit and push."
