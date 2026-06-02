#!/usr/bin/env bash
# Push to https://github.com/shaiafriat-eng/lead-scoring and trigger Pages deploy
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="https://github.com/shaiafriat-eng/lead-scoring.git"
GH_BIN="$(command -v gh || true)"

if [[ -z "${GITHUB_TOKEN:-}" && -f "$ROOT/.github-token" ]]; then
  GITHUB_TOKEN="$(cat "$ROOT/.github-token")"
  export GITHUB_TOKEN
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  if [[ -z "$GH_BIN" ]]; then
    echo "Install gh CLI or set PATH to include gh."
    exit 1
  fi
  echo "$GITHUB_TOKEN" | "$GH_BIN" auth login --with-token
fi

bash "$ROOT/scripts/sync-docs.sh"
git add docs/
git diff --cached --quiet || git commit -m "Sync docs for GitHub Pages"

git remote set-url origin "$REMOTE"
git push -u origin main

echo ""
echo "Done. Enable Pages: repo Settings → Pages → Source: GitHub Actions"
echo "Live URL: https://shaiafriat-eng.github.io/lead-scoring/"
