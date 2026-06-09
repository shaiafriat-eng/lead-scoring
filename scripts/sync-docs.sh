#!/usr/bin/env bash
# Build multi-page site and copy into docs/lead-scoring-guide/ for GitHub Pages
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_SLUG="lead-scoring-guide"

node "$ROOT/scripts/build-site.mjs"
rm -rf "$ROOT/docs"
mkdir -p "$ROOT/docs/$SITE_SLUG"
cp -R "$ROOT/site/." "$ROOT/docs/$SITE_SLUG/"
touch "$ROOT/docs/.nojekyll"
cat > "$ROOT/docs/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${SITE_SLUG}/" />
  <link rel="canonical" href="${SITE_SLUG}/" />
  <title>Redirecting to Lead Scoring Guide</title>
</head>
<body>
  <p><a href="${SITE_SLUG}/">HiBob Lead Scoring Guide</a></p>
</body>
</html>
EOF
echo "Built site/ and synced to docs/${SITE_SLUG}/ — ready to commit and push."
