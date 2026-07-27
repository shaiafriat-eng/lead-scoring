#!/usr/bin/env bash
# Build an offline HTML package for stakeholders without GitHub access.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/share"
STAGE="$OUT_DIR/HiBob-Lead-Scoring-Guide"
ZIP_NAME="HiBob-Lead-Scoring-Guide.zip"
DOWNLOADS="${HOME}/Downloads/${ZIP_NAME}"

export PATH="/Users/shai.afriat/.local/share/cursor-agent/versions/2026.06.03-0bbb28e:/opt/homebrew/bin:/usr/local/bin:${PATH}"

bash "$ROOT/scripts/sync-docs.sh"

rm -rf "$OUT_DIR"
mkdir -p "$STAGE"
cp -R "$ROOT/docs/lead-scoring-guide/." "$STAGE/"

cat > "$STAGE/START-HERE.html" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=index.html" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HiBob Lead Scoring Guide</title>
  <style>
    body { font-family: Lato, system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1.25rem; color: #3a3a37; line-height: 1.55; }
    a { color: #ee164f; font-weight: 700; }
  </style>
</head>
<body>
  <h1>HiBob Lead Scoring Guide</h1>
  <p>If this page doesn’t open automatically, click <a href="index.html">Open the guide</a>.</p>
  <p>Works offline — no GitHub account needed. Keep this whole folder together when sharing.</p>
</body>
</html>
EOF

cat > "$STAGE/HOW-TO-SHARE.txt" <<'EOF'
HiBob Lead Scoring Guide — offline HTML package
===============================================

Open the guide
--------------
1. Unzip this folder (if you received a ZIP).
2. Double-click START-HERE.html
   (or open index.html)

No GitHub login required. Works in Chrome, Safari, Edge, or Firefox.

Sharing
-------
Send the entire folder or the ZIP file.
Do not send only one HTML page — CSS, JS, and images must stay in the same folder.
EOF

cd "$OUT_DIR"
zip -r -q "$ZIP_NAME" "HiBob-Lead-Scoring-Guide"
cp "$OUT_DIR/$ZIP_NAME" "$DOWNLOADS"

echo "Shareable package ready:"
echo "  $DOWNLOADS"
echo "  $OUT_DIR/$ZIP_NAME"
echo "Unzipped preview: $STAGE/START-HERE.html"
