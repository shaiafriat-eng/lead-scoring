import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadJourneysFromCsv } from "./lib/load-csv-journeys.mjs";
import { computeTopPages } from "./lib/top-pages.mjs";
import { computeAllBreakdowns } from "./lib/breakdown.mjs";
import {
  computeOutreachPriority,
  scoreMqlOutreach,
} from "./lib/outreach-priority.mjs";
import { loadRoutingFromFiles, fetchRoutingFromGoogle } from "./lib/load-routing-rules.mjs";
import {
  fetchRoutingFromApi,
  routingApiConfigFromEnv,
} from "./lib/fetch-routing-api.mjs";
import { buildRoutingFromChiliPiperFile } from "./lib/fetch-chilipiper-rules.mjs";
import {
  chilipiperDataDirFromEnv,
  chilipiperExportPaths,
} from "./lib/chilipiper-data-dir.mjs";
import {
  loadMeetings,
  meetingsConfigFromEnv,
} from "./lib/load-meetings.mjs";
import {
  leadCalendarConfigFromEnv,
  loadLeadCalendarFunnel,
  redactLeadCalendarPayload,
} from "./lib/load-lead-calendar-funnel.mjs";
import {
  loadPreMqlJourneysFromCsv,
  summarizePreMqlList,
} from "./lib/load-premql-journeys.mjs";
import { computePreMqlSummary } from "./lib/premql-summary.mjs";
import { buildKpiValidation } from "./lib/pre-mql-kpi-validation.mjs";
import { loadPreMqlCpGuestIndex } from "./lib/pre-mql-cp-guest-index.mjs";
import {
  aggregatePreMqlMeetingKpis,
  enrichJourneysWithCpMeeting,
  pickCpValidationSamples,
} from "./lib/pre-mql-meeting-kpis.mjs";
import {
  accountJourneyPayload,
  groupJourneysByAccount,
  summarizePreMqlAccount,
} from "./lib/group-premql-accounts.mjs";
import {
  buildFullFunnelAccounts,
  enrichFullFunnelAccount,
  postMqlByEmail,
  resolveAccountFunnelContacts,
} from "./lib/full-funnel.mjs";
import { buildEmailCountryIndex } from "./lib/email-country-index.mjs";
import { enrichPreMqlAccounts } from "./lib/enrich-premql-accounts.mjs";
import { enrichPostMqlJourneys } from "./lib/post-mql-region.mjs";
import { buildFullFunnelTouchJourney } from "./lib/touch-lanes.mjs";
import {
  computeAccountFunnelInsights,
  computeFullFunnelBreakdowns,
  computeFullFunnelSummary,
} from "./lib/funnel-insights.mjs";
import { computeEntityValidation } from "./lib/entity-validation.mjs";
import { loadTestLeadConfig } from "./lib/pre-mql-test-lead-config.mjs";
import {
  buildTestLeadExclusionReport,
  filterTestLeads,
  findBorderlineLeads,
} from "./lib/pre-mql-test-lead-filter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadDotEnv() {
  try {
    const text = await fs.readFile(path.join(__dirname, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    /* .env optional */
  }
}

await loadDotEnv();

const PORT = Number(process.env.PORT) || 3847;
const CSV_PATH =
  process.env.CSV_PATH ?? path.join(__dirname, "test.csv");
const PRE_MQL_CSV =
  process.env.PRE_MQL_CSV ?? path.join(__dirname, "data", "postmql.csv");
const ROUTING_CONCIERGE_CSV =
  process.env.ROUTING_CONCIERGE_CSV ??
  path.join(__dirname, "data", "routing-concierge.csv");
const ROUTING_OFFLINE_CSV =
  process.env.ROUTING_OFFLINE_CSV ??
  path.join(__dirname, "data", "routing-offline-distribution.csv");
const ROUTING_SPREADSHEET_ID = process.env.ROUTING_SPREADSHEET_ID ?? "";
const ROUTING_SOURCE =
  process.env.ROUTING_SOURCE ??
  (routingApiConfigFromEnv() ? "api" : "csv");
const ROUTING_API = routingApiConfigFromEnv();
const MEETINGS_CONFIG = meetingsConfigFromEnv(__dirname);
const LEAD_CALENDAR_CONFIG = leadCalendarConfigFromEnv(__dirname);
const CHILIPIPER_DATA_DIR = chilipiperDataDirFromEnv(__dirname);
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

let journeysCache = null;
let dataSource = "";
let journeysLoadError = null;
let preMqlCache = null;
let preMqlAccountsCache = null;
let preMqlDataSource = "";
let preMqlLoadError = null;
let preMqlCpGuestIndex = null;
let preMqlCpMeta = null;
let preMqlCpKpis = null;
let preMqlTestLeadReport = null;
const PRE_MQL_CP_MCP_LOGS =
  process.env.PRE_MQL_CP_MCP_LOGS ??
  path.join(__dirname, "..", "data", "weekly_bookings", "raw", "concierge-logs.json");
let routingCache = null;
let meetingsCache = null;
let meetingsLoadError = null;
let leadCalendarCache = null;
let leadCalendarLoadError = null;
let emailCountryIndex = null;
let postMqlRegionMeta = null;

async function mergeOfflineFromCsv(routing) {
  try {
    await fs.access(ROUTING_OFFLINE_CSV);
    const fromCsv = await loadRoutingFromFiles(
      ROUTING_CONCIERGE_CSV,
      ROUTING_OFFLINE_CSV,
    );
    routing.offline = fromCsv.offline;
    routing.meta.offlineSource = ROUTING_OFFLINE_CSV;
    routing.meta.offlinePodCount = fromCsv.offline.pods.length;
  } catch {
    /* offline CSV optional when using API */
  }
  return routing;
}

async function loadRouting(forceRefresh = false) {
  if (ROUTING_SOURCE === "chilipiper-file" || ROUTING_SOURCE === "chilipiper") {
    if (forceRefresh || !routingCache) {
      const paths = await chilipiperExportPaths(CHILIPIPER_DATA_DIR);
      const rulesPath = process.env.CHILIPIPER_RULES_JSON ?? paths.rules;
      routingCache = await buildRoutingFromChiliPiperFile(rulesPath);
    }
    return routingCache;
  }

  if (ROUTING_SOURCE === "api") {
    if (!ROUTING_API?.url) {
      throw new Error(
        "ROUTING_SOURCE=api but ROUTING_API_URL is not set. Add it to .env or the environment.",
      );
    }
    if (forceRefresh || !routingCache) {
      routingCache = await fetchRoutingFromApi(ROUTING_API);
      await mergeOfflineFromCsv(routingCache);
    }
    return routingCache;
  }

  if (ROUTING_SOURCE === "sheets" && ROUTING_SPREADSHEET_ID) {
    if (forceRefresh || !routingCache) {
      routingCache = await fetchRoutingFromGoogle(ROUTING_SPREADSHEET_ID);
    }
    return routingCache;
  }

  routingCache = await loadRoutingFromFiles(
    ROUTING_CONCIERGE_CSV,
    ROUTING_OFFLINE_CSV,
  );
  return routingCache;
}

async function loadMeetingsData(forceRefresh = false) {
  if (forceRefresh || !meetingsCache) {
    meetingsCache = await loadMeetings(MEETINGS_CONFIG, __dirname);
    meetingsLoadError = null;
  }
  return meetingsCache;
}

async function loadLeadCalendarData(forceRefresh = false) {
  if (forceRefresh || !leadCalendarCache) {
    leadCalendarCache = redactLeadCalendarPayload(
      await loadLeadCalendarFunnel(LEAD_CALENDAR_CONFIG),
    );
    leadCalendarLoadError = null;
  }
  return leadCalendarCache;
}

async function loadJourneys(forceRefresh = false) {
  if (!forceRefresh && journeysCache) return journeysCache;
  try {
    await fs.access(CSV_PATH);
    const raw = await loadJourneysFromCsv(CSV_PATH);
    const countryIndex = await getEmailCountryIndex();
    const { journeys, meta } = enrichPostMqlJourneys(raw, countryIndex);
    journeysCache = journeys;
    postMqlRegionMeta = meta;
    dataSource = CSV_PATH;
    journeysLoadError = null;
    return journeysCache;
  } catch (err) {
    journeysLoadError = String(err.message ?? err);
    if (err.code === "ENOENT") {
      journeysCache = [];
      postMqlRegionMeta = null;
      throw new Error(
        `Post-MQL CSV not found at ${CSV_PATH}. Set CSV_PATH or place test.csv in the project folder.`,
      );
    }
    throw err;
  }
}

async function ensureJourneys() {
  if (journeysCache) return journeysCache;
  try {
    return await loadJourneys();
  } catch (err) {
    console.warn(`Post-MQL journeys not loaded: ${err.message ?? err}`);
    journeysCache = journeysCache ?? [];
    return journeysCache;
  }
}

async function ensurePreMqlJourneys() {
  if (preMqlCache) return preMqlCache;
  try {
    return await loadPreMqlJourneys();
  } catch (err) {
    console.warn(`Pre-MQL journeys not loaded: ${err.message ?? err}`);
    preMqlCache = preMqlCache ?? [];
    preMqlAccountsCache = preMqlAccountsCache ?? [];
    return preMqlCache;
  }
}

async function getEmailCountryIndex() {
  if (!emailCountryIndex) {
    emailCountryIndex = await buildEmailCountryIndex(__dirname);
  }
  return emailCountryIndex;
}

async function loadPreMqlCpMeetingData(journeys, forceRefresh = false) {
  if (!forceRefresh && preMqlCpKpis && preMqlCpGuestIndex) {
    return {
      guestIndex: preMqlCpGuestIndex,
      meta: preMqlCpMeta,
      kpis: preMqlCpKpis,
    };
  }

  const { index, meta } = await loadPreMqlCpGuestIndex(CHILIPIPER_DATA_DIR, {
    mcpLogsPath: PRE_MQL_CP_MCP_LOGS,
  });
  const kpis = aggregatePreMqlMeetingKpis(journeys, index);
  kpis.samples = pickCpValidationSamples(kpis.perJourney, 10);
  preMqlCpGuestIndex = index;
  preMqlCpMeta = meta;
  preMqlCpKpis = kpis;
  return { guestIndex: index, meta, kpis };
}

async function loadPreMqlJourneys(forceRefresh = false) {
  if (!forceRefresh && preMqlCache) return preMqlCache;
  try {
    await fs.access(PRE_MQL_CSV);
    const rawJourneys = await loadPreMqlJourneysFromCsv(PRE_MQL_CSV);
    const testLeadConfig = await loadTestLeadConfig();
    const { kept, excluded, reasons } = filterTestLeads(rawJourneys, testLeadConfig);

    const { guestIndex } = await loadPreMqlCpMeetingData(kept, forceRefresh);
    const enrichedKept = enrichJourneysWithCpMeeting(kept, guestIndex);
    const enrichedAll = enrichJourneysWithCpMeeting(rawJourneys, guestIndex);
    const beforeCpKpis = aggregatePreMqlMeetingKpis(enrichedAll, guestIndex);
    const afterCpKpis = aggregatePreMqlMeetingKpis(enrichedKept, guestIndex);

    preMqlTestLeadReport = buildTestLeadExclusionReport({
      allJourneys: enrichedAll,
      kept: enrichedKept,
      excluded: enrichJourneysWithCpMeeting(excluded, guestIndex),
      reasons,
      beforeCpKpis,
      afterCpKpis,
      borderline: findBorderlineLeads(enrichedKept, testLeadConfig),
    });

    preMqlCache = enrichedKept;
    const countryIndex = await getEmailCountryIndex();
    preMqlAccountsCache = enrichPreMqlAccounts(
      groupJourneysByAccount(preMqlCache),
      preMqlCache,
      countryIndex,
    );
    preMqlDataSource = PRE_MQL_CSV;
    preMqlLoadError = null;
    return preMqlCache;
  } catch (err) {
    preMqlLoadError = String(err.message ?? err);
    if (err.code === "ENOENT") {
      preMqlCache = [];
      throw new Error(
        `Pre-MQL CSV not found at ${PRE_MQL_CSV}. Set PRE_MQL_CSV or place postmql.csv alongside the project.`,
      );
    }
    throw err;
  }
}

function pathIsHighIntent(path) {
  const p = (path || "").toLowerCase();
  return ["pricing", "book-a-demo", "book-demo", "free-trial", "/demo"].some(
    (frag) => p.includes(frag),
  );
}

function pathCategory(path) {
  const p = (path || "").toLowerCase();
  if (/pricing|plans|price/.test(p)) return "pricing";
  if (/demo|book-a-demo|book-demo/.test(p)) return "demo";
  if (/trial|free-trial/.test(p)) return "trial";
  if (/product|platform|features|solutions/.test(p)) return "product";
  if (/blog|resources|guide|ebook|webinar/.test(p)) return "content";
  if (/careers|jobs/.test(p)) return "careers";
  return "other";
}

function summarize(mql) {
  const visits = mql.visits ?? [];
  const lastReturn =
    visits.length > 0
      ? visits.reduce((latest, v) =>
          new Date(v.returnedAt) > new Date(latest) ? v.returnedAt : latest,
        visits[0].returnedAt)
      : null;
  let highIntentReturn = false;
  const pageCategories = new Set();
  for (const visit of visits) {
    for (const page of visit.pages ?? []) {
      if (pathIsHighIntent(page.path)) {
        highIntentReturn = true;
      }
      pageCategories.add(pathCategory(page.path));
    }
  }
  const outreach = scoreMqlOutreach(mql);
  return {
    id: mql.id,
    email: mql.email,
    mqlDate: mql.mqlDate,
    returnVisitCount: visits.length,
    returnPageViewCount: mql.returnPageViewCount ?? 0,
    lastReturn,
    leadStatus: mql.leadStatus ?? null,
    lastCombinedScore: mql.lastCombinedScore ?? null,
    mainSegment: mql.mainSegment ?? null,
    mainOwnerName: mql.mainOwnerName ?? null,
    nurtureReason: mql.nurtureReason ?? null,
    region: mql.region ?? null,
    country: mql.country ?? null,
    regionSource: mql.regionSource ?? null,
    highIntentReturn,
    pageCategories: [...pageCategories],
    priorityScore: outreach.priorityScore,
    outreachTier: outreach.tier,
    outreachReasons: outreach.reasons,
    highIntentPages: outreach.highIntentPages ?? [],
  };
}

function send(res, status, body, contentType = "application/json") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

async function serveStatic(urlPath, res) {
  const safe = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(PUBLIC_DIR, safe === "/" ? "index.html" : safe);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden", "text/plain");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] ?? "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/lead-calendar/meta") {
    send(
      res,
      200,
      JSON.stringify({
        spreadsheetId: LEAD_CALENDAR_CONFIG.spreadsheetId,
        submitSheet: LEAD_CALENDAR_CONFIG.submitSheet,
        cpGid: LEAD_CALENDAR_CONFIG.cpGid,
        chilipiperSheet: LEAD_CALENDAR_CONFIG.chilipiperSheet,
        joinKeys: ["SESSION_ID", "EMAIL_FILLED↔Guest Email"],
        lastError: leadCalendarLoadError,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/lead-calendar") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const payload = await loadLeadCalendarData(refresh);
      if (refresh) {
        await fs.writeFile(
          path.join(PUBLIC_DIR, "lead-calendar-data.json"),
          JSON.stringify(payload),
        );
      }
      send(res, 200, JSON.stringify(payload));
    } catch (err) {
      leadCalendarLoadError = String(err.message ?? err);
      send(res, 500, JSON.stringify({ error: leadCalendarLoadError }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/meetings/meta") {
    send(
      res,
      200,
      JSON.stringify({
        source: MEETINGS_CONFIG.source,
        spreadsheetId: MEETINGS_CONFIG.spreadsheetId || null,
        conciergeGid: MEETINGS_CONFIG.gids.concierge,
        handoffGid: MEETINGS_CONFIG.gids.handoff || null,
        conciergeCsv: MEETINGS_CONFIG.conciergeCsv,
        handoffCsv: MEETINGS_CONFIG.handoffCsv,
        chilipiperDir: CHILIPIPER_DATA_DIR,
        year: Number(process.env.CHILIPIPER_YEAR) || 2026,
        routingSource: ROUTING_SOURCE,
        hasRoutingApi: Boolean(ROUTING_API?.url),
        lastError: meetingsLoadError,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/meetings") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const payload = await loadMeetingsData(refresh);
      if (refresh) {
        await fs.writeFile(
          path.join(PUBLIC_DIR, "meetings-data.json"),
          JSON.stringify(payload),
        );
      }
      send(res, 200, JSON.stringify(payload));
    } catch (err) {
      meetingsLoadError = String(err.message ?? err);
      send(res, 500, JSON.stringify({ error: meetingsLoadError }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/routing/meta") {
    send(
      res,
      200,
      JSON.stringify({
        source: ROUTING_SOURCE,
        canRefresh:
          ROUTING_SOURCE === "api" ||
          ROUTING_SOURCE === "chilipiper-file" ||
          ROUTING_SOURCE === "chilipiper" ||
          (ROUTING_SOURCE === "sheets" && Boolean(ROUTING_SPREADSHEET_ID)),
        apiUrl: ROUTING_API?.url ?? null,
        spreadsheetId: ROUTING_SPREADSHEET_ID || null,
        conciergeCsv: ROUTING_CONCIERGE_CSV,
        offlineCsv: ROUTING_OFFLINE_CSV,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/routing") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const routing = routingCache ?? (await loadRouting(refresh));
      if (refresh) {
        routingCache = routing;
        await writeRoutingSnapshot(routing);
      }
      send(res, 200, JSON.stringify(routing));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/meta") {
    send(
      res,
      200,
      JSON.stringify({
        source: dataSource,
        mqlCount: journeysCache?.length ?? 0,
        regionMeta: postMqlRegionMeta,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/outreach-priority") {
    try {
      const journeys = journeysCache ?? (await loadJourneys());
      const limit = Math.min(
        500,
        Math.max(1, Number(url.searchParams.get("limit")) || 20),
      );
      send(res, 200, JSON.stringify(computeOutreachPriority(journeys, limit)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/breakdowns") {
    try {
      const journeys = journeysCache ?? (await loadJourneys());
      const limit = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("limit")) || 12),
      );
      send(res, 200, JSON.stringify(computeAllBreakdowns(journeys, limit)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/top-pages") {
    try {
      const journeys = journeysCache ?? (await loadJourneys());
      const limit = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("limit")) || 15),
      );
      send(res, 200, JSON.stringify(computeTopPages(journeys, limit)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/mqls") {
    try {
      const journeys = journeysCache ?? (await loadJourneys());
      send(res, 200, JSON.stringify(journeys.map(summarize)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/meta") {
    send(
      res,
      200,
      JSON.stringify({
        csvPath: PRE_MQL_CSV,
        dataSource: preMqlDataSource || null,
        mqlCount: preMqlCache?.length ?? 0,
        accountCount: preMqlAccountsCache?.length ?? 0,
        testLeadsExcluded: preMqlTestLeadReport?.totalExcludedLeads ?? 0,
        lastError: preMqlLoadError,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/summary") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const journeys = await loadPreMqlJourneys(refresh);
      const { kpis } = await loadPreMqlCpMeetingData(journeys, refresh);
      send(res, 200, JSON.stringify(computePreMqlSummary(journeys, kpis)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/kpi-validation") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const journeys = await loadPreMqlJourneys(refresh);
      const { meta, kpis } = await loadPreMqlCpMeetingData(journeys, refresh);
      const summary = computePreMqlSummary(journeys, kpis);
      send(
        res,
        200,
        JSON.stringify(
          buildKpiValidation(journeys, summary, meta, kpis, preMqlTestLeadReport),
        ),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/test-lead-exclusions") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      await loadPreMqlJourneys(refresh);
      send(
        res,
        200,
        JSON.stringify(preMqlTestLeadReport ?? { totalExcludedLeads: 0, samples: [] }),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/accounts") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const journeys = await loadPreMqlJourneys(refresh);
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(journeys);
      send(
        res,
        200,
        JSON.stringify({
          accounts: accounts.map(summarizePreMqlAccount),
          total: accounts.length,
        }),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/full-funnel/meta") {
    send(
      res,
      200,
      JSON.stringify({
        preMqlCsv: PRE_MQL_CSV,
        postMqlCsv: CSV_PATH,
        preMqlCount: preMqlCache?.length ?? 0,
        accountCount: preMqlAccountsCache?.length ?? 0,
        postMqlCount: journeysCache?.length ?? 0,
        preMqlError: preMqlLoadError,
        postMqlError: journeysLoadError,
        ready: Boolean(preMqlAccountsCache?.length),
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/full-funnel/accounts") {
    try {
      const preJourneys = await ensurePreMqlJourneys();
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(preJourneys);
      if (!accounts.length) {
        send(
          res,
          503,
          JSON.stringify({
            error: preMqlLoadError ?? "Pre-MQL data not loaded",
            hint: `Start the server from mql-journey-dashboard and set PRE_MQL_CSV in .env (current: ${PRE_MQL_CSV})`,
            accounts: [],
            total: 0,
          }),
        );
        return;
      }
      const postJourneys = await ensureJourneys();
      const merged = buildFullFunnelAccounts(accounts, preJourneys, postJourneys);
      send(res, 200, JSON.stringify({ accounts: merged, total: merged.length }));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/full-funnel/summary") {
    try {
      const preJourneys = await ensurePreMqlJourneys();
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(preJourneys);
      const postJourneys = await ensureJourneys();
      send(
        res,
        200,
        JSON.stringify(computeFullFunnelSummary(accounts, preJourneys, postJourneys)),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/full-funnel/entity-validation") {
    try {
      const preJourneys = await ensurePreMqlJourneys();
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(preJourneys);
      const postJourneys = await ensureJourneys();
      send(
        res,
        200,
        JSON.stringify(
          computeEntityValidation(preJourneys, postJourneys, accounts),
        ),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/full-funnel/breakdowns") {
    try {
      const preJourneys = await ensurePreMqlJourneys();
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(preJourneys);
      const postJourneys = await ensureJourneys();
      const enriched = buildFullFunnelAccounts(accounts, preJourneys, postJourneys);
      const limit = Math.min(
        50,
        Math.max(1, Number(url.searchParams.get("limit")) || 12),
      );
      send(
        res,
        200,
        JSON.stringify(
          computeFullFunnelBreakdowns(enriched, preJourneys, postJourneys, limit),
        ),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  const fullFunnelJourneyMatch = url.pathname.match(
    /^\/api\/full-funnel\/accounts\/([^/]+)\/journey$/,
  );
  if (req.method === "GET" && fullFunnelJourneyMatch) {
    try {
      const preJourneys = await ensurePreMqlJourneys();
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(preJourneys);
      const accountId = decodeURIComponent(fullFunnelJourneyMatch[1]);
      const account = accounts.find((a) => a.id === accountId);
      if (!account) {
        send(res, 404, JSON.stringify({ error: "Account not found" }));
        return;
      }
      const postJourneys = await ensureJourneys();
      const postMap = postMqlByEmail(postJourneys);
      const resolved = resolveAccountFunnelContacts(account, preJourneys, postMap);
      const pre = resolved.representativePre;
      if (!pre) {
        send(res, 404, JSON.stringify({ error: "Journey not found" }));
        return;
      }
      const post = resolved.representativePost;
      const touchJourney = buildFullFunnelTouchJourney(pre, post);
      const enriched = enrichFullFunnelAccount(account, resolved);
      const insights = computeAccountFunnelInsights(
        account,
        pre,
        post,
        touchJourney,
        enriched,
      );
      send(
        res,
        200,
        JSON.stringify({
          account: enriched,
          preMql: accountJourneyPayload(account, pre),
          postMql: post
            ? {
                id: post.id,
                mqlDate: post.mqlDate,
                returnVisitCount: post.visits?.length ?? 0,
                returnPageViewCount: post.returnPageViewCount ?? 0,
                touchLanes: post.touchLanes ?? [],
                visits: post.visits ?? [],
                leadStatus: post.leadStatus,
                mainSegment: post.mainSegment,
              }
            : null,
          touchJourney,
          insights,
        }),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  const preMqlAccountJourneyMatch = url.pathname.match(
    /^\/api\/pre-mql\/accounts\/([^/]+)\/journey$/,
  );
  if (req.method === "GET" && preMqlAccountJourneyMatch) {
    try {
      const journeys = preMqlCache ?? (await loadPreMqlJourneys());
      const accounts = preMqlAccountsCache ?? groupJourneysByAccount(journeys);
      const accountId = decodeURIComponent(preMqlAccountJourneyMatch[1]);
      const account = accounts.find((a) => a.id === accountId);
      if (!account) {
        send(res, 404, JSON.stringify({ error: "Account not found" }));
        return;
      }
      const journey = journeys.find((j) => j.id === account.primaryJourneyId);
      if (!journey) {
        send(res, 404, JSON.stringify({ error: "Journey not found" }));
        return;
      }
      send(res, 200, JSON.stringify(accountJourneyPayload(account, journey)));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pre-mql/mqls") {
    try {
      const refresh = url.searchParams.get("refresh") === "1";
      const journeys = await loadPreMqlJourneys(refresh);
      send(
        res,
        200,
        JSON.stringify({
          mqls: journeys.map(summarizePreMqlList),
          total: journeys.length,
        }),
      );
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  const preMqlJourneyMatch = url.pathname.match(
    /^\/api\/pre-mql\/mqls\/([^/]+)\/journey$/,
  );
  if (req.method === "GET" && preMqlJourneyMatch) {
    try {
      const journeys = preMqlCache ?? (await loadPreMqlJourneys());
      const mql = journeys.find(
        (j) => j.id === decodeURIComponent(preMqlJourneyMatch[1]),
      );
      if (!mql) {
        send(res, 404, JSON.stringify({ error: "MQL not found" }));
        return;
      }
      send(res, 200, JSON.stringify(mql));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  const journeyMatch = url.pathname.match(/^\/api\/mqls\/([^/]+)\/journey$/);
  if (req.method === "GET" && journeyMatch) {
    try {
      const journeys = journeysCache ?? (await loadJourneys());
      const mql = journeys.find((j) => j.id === decodeURIComponent(journeyMatch[1]));
      if (!mql) {
        send(res, 404, JSON.stringify({ error: "MQL not found" }));
        return;
      }
      send(res, 200, JSON.stringify(mql));
    } catch (err) {
      send(res, 500, JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  if (req.method === "GET") {
    await serveStatic(url.pathname, res);
    return;
  }

  send(res, 405, JSON.stringify({ error: "Method not allowed" }));
});

const ROUTING_JSON_PATH = path.join(PUBLIC_DIR, "routing-data.json");
const ROUTING_GAPS_PATH = path.join(PUBLIC_DIR, "routing-gaps.json");

async function writeRoutingSnapshot(routing) {
  await fs.writeFile(ROUTING_JSON_PATH, JSON.stringify(routing));
  if (routing.coverageGaps) {
    await fs.writeFile(ROUTING_GAPS_PATH, JSON.stringify(routing.coverageGaps));
  }
}

const journeys = await ensureJourneys();
const withReturns = journeys.filter((j) => j.visits.length > 0).length;

try {
  await loadPreMqlJourneys();
} catch (err) {
  preMqlLoadError = String(err.message ?? err);
  console.warn(`Pre-MQL data not loaded: ${preMqlLoadError}`);
}
const routing = await loadRouting().catch((err) => {
  console.warn(`Routing data not loaded: ${err.message ?? err}`);
  return routingCache ?? { pods: [], offline: { pods: [] }, meta: { error: String(err.message ?? err) } };
});
if (routing?.pods || routing?.offline) {
  await writeRoutingSnapshot(routing).catch((err) => {
    console.warn(`Routing snapshot not written: ${err.message ?? err}`);
  });
}

try {
  const meetings = await loadMeetingsData();
  await fs.writeFile(
    path.join(PUBLIC_DIR, "meetings-data.json"),
    JSON.stringify(meetings),
  );
  console.log(
    `Meetings: ${meetings.metrics.total} rows (${meetings.metrics.bookedLive} booked live, ${meetings.metrics.happened} held, ${meetings.metrics.handoffToAe} BDR→AE handoffs)`,
  );
} catch (err) {
  meetingsLoadError = String(err.message ?? err);
  console.warn(`Meetings data not loaded: ${meetingsLoadError}`);
}

try {
  const funnel = await loadLeadCalendarData();
  await fs.writeFile(
    path.join(PUBLIC_DIR, "lead-calendar-data.json"),
    JSON.stringify(funnel),
  );
  console.log(
    `Lead→calendar: ${funnel.metrics.leads} leads, ${funnel.metrics.presented} presented, ${funnel.metrics.booked} booked`,
  );
} catch (err) {
  leadCalendarLoadError = String(err.message ?? err);
  console.warn(`Lead calendar funnel not loaded: ${leadCalendarLoadError}`);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MQL Journey Dashboard → http://localhost:${PORT}`);
  console.log(`Meetings Dashboard → http://localhost:${PORT}/meetings.html`);
  console.log(
    `Lead→Calendar Funnel → http://localhost:${PORT}/calendar-funnel.html`,
  );
  console.log(`Routing Rules Dashboard → http://localhost:${PORT}/routing.html`);
  console.log(`Pre-MQL Journey → http://localhost:${PORT}/pre-mql.html`);
  console.log(`Full funnel → http://localhost:${PORT}/full-funnel.html`);
  console.log(`Loaded ${journeys.length} MQLs (${withReturns} with return visits) from CSV`);
  if (preMqlCache?.length) {
    loadPreMqlCpMeetingData(preMqlCache)
      .then(({ kpis }) => {
        const s = computePreMqlSummary(preMqlCache, kpis);
        console.log(
          `Pre-MQL: ${s.totalMqls} MQLs across ${preMqlAccountsCache?.length ?? 0} accounts, ${s.meetingOfferedCount} calendar presented, ${s.meetingBookedAfterOfferCount} booked after presented (${PRE_MQL_CSV})`,
        );
      })
      .catch(() => {
        const s = computePreMqlSummary(preMqlCache);
        console.log(
          `Pre-MQL: ${s.totalMqls} MQLs across ${preMqlAccountsCache?.length ?? 0} accounts (${PRE_MQL_CSV})`,
        );
      });
  }
  console.log(
    `Routing: ${routing.meta.conciergeRuleCount} Concierge rules, ${routing.meta.offlinePodCount} offline pods (source: ${routing.meta.source ?? ROUTING_SOURCE})`,
  );
});
