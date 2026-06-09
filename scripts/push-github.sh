#!/usr/bin/env bash
# Push to https://github.com/hibobio/marketing-ops-general and trigger Pages deploy
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="https://github.com/hibobio/marketing-ops-general.git"
REMOTE_NAME="${GITHUB_REMOTE:-hibobio}"
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

if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote add "$REMOTE_NAME" "$REMOTE"
else
  git remote set-url "$REMOTE_NAME" "$REMOTE"
fi
git push -u "$REMOTE_NAME" main

echo ""
echo "Done. Enable Pages: repo Settings → Pages → Source: GitHub Actions (or branch main /docs)"
echo "Live URL: https://hibobio.github.io/marketing-ops-general/lead-scoring-guide/"
