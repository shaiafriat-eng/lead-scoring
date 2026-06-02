# Deploy the Lead Scoring Guide (GitHub Pages)

The live site is built from **`docs/`** (copied from `OPEN-THIS-FILE.html`).

## One-time setup on GitHub

1. Create a **new repository** on GitHub (e.g. `hibob-lead-scoring-guide`). It can be private if your org allows private Pages.
2. Push this folder to that repo (see commands below).
3. In the repo: **Settings → Pages**
   - **Build and deployment:** Source = **GitHub Actions**
4. After the first push to `main`, open **Actions** and confirm **Deploy to GitHub Pages** succeeded.

Your site will be at:

`https://<your-org-or-username>.github.io/<repo-name>/`

Example: `https://acme-corp.github.io/hibob-lead-scoring-guide/`

## Push this project to GitHub

From `src/scoring-system`:

```bash
git init
git add .
git commit -m "Add lead scoring guide for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<ORG_OR_USER>/<REPO>.git
git push -u origin main
```

Replace `<ORG_OR_USER>` and `<REPO>` with your GitHub org/user and repository name.

## After you edit the HTML

Whenever you change `OPEN-THIS-FILE.html`, sync before pushing:

```bash
bash scripts/sync-docs.sh
git add docs/
git commit -m "Update live site"
git push
```

GitHub Actions will redeploy automatically.

## Alternative (no Actions)

**Settings → Pages → Deploy from a branch → Branch `main` → Folder `/docs`**

Then run `bash scripts/sync-docs.sh` locally and push `docs/` — no workflow required.

## Internal-only note

Do not commit secrets. This site is static HTML; Miro/Google links are public URLs already in the page.
