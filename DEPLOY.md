# Deploy the Lead Scoring Guide (GitHub Pages)

The live site is built from **`docs/`** (multi-page static site copied from `site/`).

## One-time setup on GitHub

1. Create a **new repository** on GitHub (e.g. `hibob-lead-scoring-guide`). It can be private if your org allows private Pages.
2. Push this folder to that repo (see commands below).
3. In the repo: **Settings → Pages**
   - **Build and deployment:** Source = **GitHub Actions**
4. After the first push to `main`, open **Actions** and confirm **Deploy to GitHub Pages** succeeded.

Your site will be at:

`https://shaiafriat-eng.github.io/lead-scoring/`

Repository: https://github.com/shaiafriat-eng/lead-scoring

## Push this project to GitHub

From `src/scoring-system`:

```bash
git init
git add .
git commit -m "Add lead scoring guide for GitHub Pages"
git branch -M main
git remote add origin https://github.com/shaiafriat-eng/lead-scoring.git
git push -u origin main
```

Replace `<ORG_OR_USER>` and `<REPO>` with your GitHub org/user and repository name.

## After you edit content

Rebuild the static site and sync before pushing:

```bash
npm run build:site    # or: node scripts/build-site.mjs
bash scripts/sync-docs.sh
git add docs/ site/
git commit -m "Update live site"
git push
```

GitHub Actions will redeploy automatically.

## Alternative (no Actions)

**Settings → Pages → Deploy from a branch → Branch `main` → Folder `/docs`**

Then run `bash scripts/sync-docs.sh` locally and push `docs/` — no workflow required.

## Internal-only note

Do not commit secrets. This site is static HTML; Miro/Google links are public URLs already in the page.
