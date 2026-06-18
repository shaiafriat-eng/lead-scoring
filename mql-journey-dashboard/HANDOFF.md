# MQL Journey Dashboard — handoff

## Open in Cursor

1. Unzip this folder anywhere (e.g. `~/Projects/mql-journey-dashboard`).
2. In Cursor: **File → Open Folder** and select `mql-journey-dashboard`.
3. Copy `.env.example` to `.env` and fill in any Google Sheets / API keys you use (optional for local CSV-only mode).

## Run locally

```bash
cd mql-journey-dashboard
node server.mjs
```

Then open:

- Post-MQL journeys: http://localhost:3847/
- **Pre-MQL journey**: http://localhost:3847/pre-mql.html
- Meetings: http://localhost:3847/meetings.html
- Lead → calendar: http://localhost:3847/calendar-funnel.html
- Routing: http://localhost:3847/routing.html

## Data files

| File | Purpose |
|------|---------|
| `test.csv` | Post-MQL return visits (default `CSV_PATH`) |
| `data/postmql.csv` | Pre-MQL events before MQL (default `PRE_MQL_CSV`) |
| `data/chilipiper/` | Chili Piper exports for meetings/routing |

Override paths with env vars:

```bash
CSV_PATH=./test.csv PRE_MQL_CSV=./data/postmql.csv node server.mjs
```

## Regenerate large JSON caches

If `public/meetings-data.json` or `public/lead-calendar-data.json` are missing, start the server with `.env` configured — it rebuilds them on startup from Sheets or local CSVs.

## Notes

- `.env` is **not** included (secrets). Use `.env.example` as a template.
- `site/` static export is excluded; run `node scripts/build-static-site.mjs` if needed.
