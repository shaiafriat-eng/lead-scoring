# Deploy the Lead Scoring Guide (GitHub Pages)

The live site is built from **`docs/`** (multi-page static site copied from `site/`).

## One-time setup on GitHub

**Private repos** may require org-level GitHub Pages access (e.g. GitHub Enterprise for private org repos). Confirm with your org admin if Pages is not available in **Settings → Pages**.

1. Open **Settings → Pages → Build and deployment:**
   - **Fastest:** Source = **Deploy from a branch** → Branch **main** → Folder **/docs** → **Save**
   - **Or:** Source = **GitHub Actions** → enable the workflow (uses `deploy-pages.yml`)
2. Push `main` (see below). If using Actions, confirm **Deploy to GitHub Pages** is green under **Actions**.

Your site will be at:

`https://hibobio.github.io/marketing-ops-general/`

Repository: https://github.com/hibobio/marketing-ops-general

## Push this project to GitHub

From `src/scoring-system`:

```bash
git remote add hibobio https://github.com/hibobio/marketing-ops-general.git
git push -u hibobio main
```

Or use the helper script:

```bash
bash scripts/push-github.sh
```

## After you edit content

Rebuild the static site and sync before pushing:

```bash
npm run build:site    # or: node scripts/build-site.mjs
bash scripts/sync-docs.sh
git add docs/ site/
git commit -m "Update live site"
git push hibobio main
```

GitHub Actions will redeploy automatically when Pages source is set to **GitHub Actions**.

## Alternative (no Actions)

**Settings → Pages → Deploy from a branch → Branch `main` → Folder `/docs`**

Then run `bash scripts/sync-docs.sh` locally and push `docs/` — no workflow required.

## Internal-only note

Do not commit secrets. This site is static HTML; Miro/Google links are public URLs already in the page.
