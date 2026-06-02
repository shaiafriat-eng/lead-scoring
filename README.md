# HiBob Lead Scoring — Internal Stakeholder Guide

A responsive internal landing page explaining HiBob's two-dimensional lead scoring system (demographic A–D × behavioral 1–4), MQL policy, and interpretation guidance.

## Favicon

Lead scoring icon at `assets/favicon.png` (also in `public/` for the Vite dev server).

## Open the page (no install)

**Double-click:** [`OPEN-THIS-FILE.html`](./OPEN-THIS-FILE.html)

Or open in your browser:

`file:///Users/shai.afriat/Documents/Cursor/src/scoring-system/OPEN-THIS-FILE.html`

See also [`HOW-TO-OPEN.txt`](./HOW-TO-OPEN.txt).

There is no separate install file — the standalone HTML works without Node.

## Optional: developer mode (requires Node.js + npm)

```bash
cd src/scoring-system
npm install
npm run dev
```

Open `http://localhost:5173` (uses the React version in `src/`).

## Host live on GitHub Pages

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions.

Quick version: push this folder to a GitHub repo, enable **Pages → GitHub Actions**, and the site is served from `docs/index.html` (synced from `OPEN-THIS-FILE.html`).

```bash
bash scripts/sync-docs.sh   # after editing OPEN-THIS-FILE.html
```

## Build for hosting (React / Vite)

```bash
npm run build
npm run preview
```

Static output is in `dist/`.

## Brand

Styling follows [brand.hibob.com](https://brand.hibob.com/): Cherry Syrup, Cappuccino Foam, Black Coffee, Archivo Black (headlines), Domine (subheads), Lato (body). Official logotype in `assets/hibob-logo.svg`.

## Resources

- [Miro — lead scoring flow](https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622)
- Source PDFs: Lead Scoring cheat sheet, New Lead Scoring Doc, New MQL Strategy (March 2025)

## Structure

| Path | Purpose |
|------|---------|
| `src/data/scoringContent.ts` | Copy, tables, FAQ — single content source |
| `src/components/` | Section components |
| `src/index.css` | HiBob brand tokens (Cherry Syrup, Cappuccino Foam, etc.) |

## Future enhancements

- Score lookup calculator (demographic + points → code)
- Link to live Marketo smart campaign / SF field API names when provided
- Changelog when MQL rules change
- Embedded Soft-lead → hand-raiser study metrics
