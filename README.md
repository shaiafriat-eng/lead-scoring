# HiBob Lead Scoring — Internal Stakeholder Guide

**The ultimate guide to lead scoring at HiBob** — demographic fit (A–D) × behavioral engagement (1–4), MQL policy, and routing for Marketing, Sales, and RevOps.

Live site: https://hibobio.github.io/marketing-ops-general/lead-scoring-guide/

## Favicon

Lead scoring icon at `assets/favicon.png` (also in `public/` for the Vite dev server).

## Open the page (no install)

**Double-click:** [`OPEN-THIS-FILE.html`](./OPEN-THIS-FILE.html) — redirects to the multi-page site.

Or open the home page directly:

[`site/index.html`](./site/index.html)

See also [`HOW-TO-OPEN.txt`](./HOW-TO-OPEN.txt).

No Node required for the static site in `site/`.

## Site pages

| Page | File |
|------|------|
| Home | `site/index.html` (includes how it works + fit & behavior) |
| Scoring flow | `site/scoring-flow.html` |
| MQLing flow | `site/mqling-flow.html` |
| Matrix | `site/matrix.html` |
| MQL routing | `site/mql-routing.html` |
| Support and Trust | `site/guide.html` |

Content is generated from `scripts/build-site.mjs` (edit that script or the React source in `src/`, then rebuild).

```bash
npm run build:site      # writes site/*.html
npm run sync:pages      # copies site/ → docs/ for GitHub Pages
```

## Optional: developer mode (requires Node.js + npm)

```bash
cd src/scoring-system
npm install
npm run dev
```

Open `http://localhost:5173` — React app with the same pages via `react-router-dom`.

## Host live on GitHub Pages

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions.

Quick version: push to GitHub, enable **Pages → GitHub Actions**. The live site is served from `docs/` (built from `site/`).

```bash
npm run sync:pages   # after content changes
```

## Build for hosting (React / Vite)

```bash
npm run build
npm run preview
```

Static output is in `dist/`.

## MQL Journey Dashboard

The interactive MQL analytics dashboards live in [`mql-journey-dashboard/`](./mql-journey-dashboard/).

```bash
cd mql-journey-dashboard
cp .env.example .env   # optional: API tokens, CSV paths
npm install            # if you add dependencies later
node server.mjs
```

Open [http://localhost:3847](http://localhost:3847) — tabs include Pre-MQL Journey, Post-MQL Journey, Full Funnel, Meetings, and Lead→Calendar.

See [`mql-journey-dashboard/README.md`](./mql-journey-dashboard/README.md) for data setup and deployment notes.

## Brand

Styling follows [brand.hibob.com](https://brand.hibob.com/): Cherry Syrup, Cappuccino Foam, Black Coffee, Archivo Black (headlines), Domine (subheads), Lato (body). Official logotype in `assets/hibob-logo.svg`.

## Resources

- [Miro — lead scoring flow](https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622)
- Source PDFs: Lead Scoring cheat sheet, New Lead Scoring Doc, New MQL Strategy (March 2025)

## Structure

| Path | Purpose |
|------|---------|
| `site/` | Multi-page static HTML (primary for stakeholders) |
| `mql-journey-dashboard/` | MQL journey dashboards (Pre-MQL, Post-MQL, Full Funnel, Meetings, Lead→Calendar) |
| `scripts/build-site.mjs` | Generates `site/*.html` |
| `src/data/scoringContent.ts` | Copy, tables, FAQ — React content source |
| `src/components/` | Section components |
| `src/index.css` | HiBob brand tokens |

## Future enhancements

- Score lookup calculator (demographic + points → code)
- Link to live Marketo smart campaign / SF field API names when provided
- Changelog when MQL rules change
- Embedded Soft-lead → hand-raiser study metrics
