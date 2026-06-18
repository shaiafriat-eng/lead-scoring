import {
  renderFullFunnelTouchLanes,
  wireLaneTooltips,
} from "/shared/touch-lanes-ui.mjs";
import { initFullFunnelKpiTooltips } from "/shared/full-funnel-kpi-tooltip.mjs";
import {
  formatFitScore,
  formatIntentScore,
  scorePairInline,
  scoreCoverageStats,
  FIT_SCORE_TOOLTIP,
  INTENT_SCORE_TOOLTIP,
  FIT_SCORE_LABEL,
  INTENT_SCORE_LABEL,
} from "/shared/score-labels.mjs";

const OUTREACH_THRESHOLD = 55;
const HIGH_INTENT_FRAGMENTS = ["pricing", "book-a-demo", "book-demo", "free-trial", "/demo"];

const els = {
  headerStats: document.getElementById("headerStats"),
  statAccounts: document.getElementById("statAccounts"),
  statBecameMql: document.getElementById("statBecameMql"),
  statReturns: document.getElementById("statReturns"),
  statReturnRate: document.getElementById("statReturnRate"),
  statAvgPre: document.getElementById("statAvgPre"),
  statAvgPost: document.getElementById("statAvgPost"),
  kpiCountNote: document.getElementById("kpiCountNote"),
  listMeta: document.getElementById("listMeta"),
  accountList: document.getElementById("accountList"),
  search: document.getElementById("search"),
  listFilterBanner: document.getElementById("listFilterBanner"),
  listFilterLabel: document.getElementById("listFilterLabel"),
  listFilterClear: document.getElementById("listFilterClear"),
  journeyEmpty: document.getElementById("journeyEmpty"),
  journeyContent: document.getElementById("journeyContent"),
  journeySubtitle: document.getElementById("journeySubtitle"),
  journeyPills: document.getElementById("journeyPills"),
  accountHeader: document.getElementById("accountHeader"),
  summaryCards: document.getElementById("summaryCards"),
  preZoneSub: document.getElementById("preZoneSub"),
  postZoneLabel: document.getElementById("postZoneLabel"),
  postZoneSub: document.getElementById("postZoneSub"),
  mqlPillarDate: document.getElementById("mqlPillarDate"),
  preTouchLanes: document.getElementById("preTouchLanes"),
  postTouchLanes: document.getElementById("postTouchLanes"),
  postZoneEmpty: document.getElementById("postZoneEmpty"),
  laneTooltip: document.getElementById("laneTooltip"),
  journeyInsight: document.getElementById("journeyInsight"),
  journeyOutcome: document.getElementById("journeyOutcome"),
  journeyInsightBullets: document.getElementById("journeyInsightBullets"),
  preTimeline: document.getElementById("preTimeline"),
  postTimeline: document.getElementById("postTimeline"),
  accountInsightSub: document.getElementById("accountInsightSub"),
  accountInsightPills: document.getElementById("accountInsightPills"),
  accountInsightsEmpty: document.getElementById("accountInsightsEmpty"),
  accountInsightsContent: document.getElementById("accountInsightsContent"),
  preSourceList: document.getElementById("preSourceList"),
  preSourceListMore: document.getElementById("preSourceListMore"),
  postPageList: document.getElementById("postPageList"),
  postPageListMore: document.getElementById("postPageListMore"),
  leadStatusList: document.getElementById("leadStatusList"),
  leadStatusListMore: document.getElementById("leadStatusListMore"),
  regionList: document.getElementById("regionList"),
  regionListMore: document.getElementById("regionListMore"),
  segmentList: document.getElementById("segmentList"),
  segmentListMore: document.getElementById("segmentListMore"),
  ownerList: document.getElementById("ownerList"),
  ownerListMore: document.getElementById("ownerListMore"),
  outreachList: document.getElementById("outreachList"),
  outreachListMore: document.getElementById("outreachListMore"),
  insightsFilterNote: document.getElementById("insightsFilterNote"),
  filterRegion: document.getElementById("filterRegion"),
  filterSegment: document.getElementById("filterSegment"),
  filterStatus: document.getElementById("filterStatus"),
  filterOwner: document.getElementById("filterOwner"),
  filterScore: document.getElementById("filterScore"),
  filterSource: document.getElementById("filterSource"),
  filterPage: document.getElementById("filterPage"),
  filterMqlFrom: document.getElementById("filterMqlFrom"),
  filterMqlTo: document.getElementById("filterMqlTo"),
  regionFilterChip: document.getElementById("regionFilterChip"),
  regionChipLabel: document.getElementById("regionChipLabel"),
  regionChipClear: document.getElementById("regionChipClear"),
  regionFilterTip: document.getElementById("regionFilterTip"),
  filterAudienceBar: document.getElementById("filterAudienceBar"),
  filterAudienceSummary: document.getElementById("filterAudienceSummary"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  validationToggle: document.getElementById("validationToggle"),
  validationPanel: document.getElementById("validationPanel"),
  validationCalcNotes: document.getElementById("validationCalcNotes"),
  validationOutreachNotes: document.getElementById("validationOutreachNotes"),
  validationRegionNotes: document.getElementById("validationRegionNotes"),
  validationEntityLevel: document.getElementById("validationEntityLevel"),
  validationFilterDebug: document.getElementById("validationFilterDebug"),
  validationScoreNotes: document.getElementById("validationScoreNotes"),
  validationReturnFilterNotes: document.getElementById("validationReturnFilterNotes"),
};

const state = {
  accounts: [],
  selectedId: null,
  summary: null,
  breakdowns: {
    preSource: [],
    postPages: [],
    leadStatus: [],
    region: [],
    segment: [],
    owner: [],
    outreach: [],
  },
  regionMeta: null,
  outreachAssumptions: [],
  entityValidation: null,
  listFilter: null,
  chipFilters: new Set(),
  filters: {
    region: "",
    segment: "",
    status: "",
    owner: "",
    score: "",
    source: "",
    page: "",
    mqlFrom: "",
    mqlTo: "",
  },
  insightsExpanded: {
    preSource: false,
    postPages: false,
    status: false,
    region: false,
    segment: false,
    owner: false,
    outreach: false,
  },
};

let hideTooltips = () => {};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNum(value, decimals = 0) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatDateShort(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function displayMeta(value) {
  const v = value == null ? "" : String(value).trim();
  return v || "—";
}

function isPresentValue(value) {
  if (value == null || value === undefined) return false;
  const s = String(value).trim();
  if (!s || s === "—" || s === "undefined" || s === "null") return false;
  if (s === "Unknown region" || s === "(unknown)" || s === "Unknown") return false;
  return true;
}

function accountRegion(a) {
  const v = String(a?.region ?? "").trim();
  return v || "Unknown region";
}

function pathIsHighIntent(path) {
  const p = (path || "").toLowerCase();
  return HIGH_INTENT_FRAGMENTS.some((frag) => p.includes(frag));
}

function isDiscoveryStatus(status) {
  return (status || "").trim() === "Discovery Call";
}

function hasPricingCategory(a) {
  return (a.pageCategories ?? []).includes("pricing");
}

function normalizeFilterValue(value) {
  return String(value ?? "").trim();
}

function dateInRange(iso, from, to) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (t > end.getTime()) return false;
  }
  return true;
}

function ensureSelectOption(select, value) {
  if (!select || !value) return;
  const exists = [...select.options].some((o) => o.value === value);
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  }
}

function readFiltersFromDom() {
  state.filters.region = normalizeFilterValue(els.filterRegion?.value);
  state.filters.segment = normalizeFilterValue(els.filterSegment?.value);
  state.filters.status = normalizeFilterValue(els.filterStatus?.value);
  state.filters.owner = normalizeFilterValue(els.filterOwner?.value);
  state.filters.score = normalizeFilterValue(els.filterScore?.value);
  state.filters.source = normalizeFilterValue(els.filterSource?.value);
  state.filters.page = normalizeFilterValue(els.filterPage?.value);
  state.filters.mqlFrom = normalizeFilterValue(els.filterMqlFrom?.value);
  state.filters.mqlTo = normalizeFilterValue(els.filterMqlTo?.value);
}

function syncSelectFilter(select, filterKey) {
  if (!select) return;
  const value = normalizeFilterValue(state.filters[filterKey]);
  if (value) ensureSelectOption(select, value);
  select.value = value;
  if (value && select.value !== value) {
    state.filters[filterKey] = "";
    select.value = "";
  } else {
    state.filters[filterKey] = normalizeFilterValue(select.value);
  }
}

function syncFiltersToDom() {
  syncSelectFilter(els.filterRegion, "region");
  syncSelectFilter(els.filterSegment, "segment");
  syncSelectFilter(els.filterStatus, "status");
  syncSelectFilter(els.filterOwner, "owner");
  syncSelectFilter(els.filterScore, "score");
  syncSelectFilter(els.filterSource, "source");
  syncSelectFilter(els.filterPage, "page");
  for (const [el, key] of [
    [els.filterMqlFrom, "mqlFrom"],
    [els.filterMqlTo, "mqlTo"],
  ]) {
    if (!el) continue;
    const value = normalizeFilterValue(state.filters[key]);
    el.value = value;
    state.filters[key] = value;
  }
}

function getDimensionFilters() {
  return { ...state.filters };
}

function passesDimensionFilters(a, dim) {
  if (dim.region && accountRegion(a) !== dim.region) return false;
  if (dim.segment && String(a.mainSegment ?? "").trim() !== dim.segment) return false;
  if (dim.status && String(a.leadStatus ?? "").trim() !== dim.status) return false;
  if (dim.owner && String(a.mainOwnerName ?? "").trim() !== dim.owner) return false;
  if (dim.source && String(a.primarySource ?? "").trim() !== dim.source) return false;
  if (dim.mqlFrom || dim.mqlTo) {
    if (!dateInRange(a.mqlDate, dim.mqlFrom, dim.mqlTo)) return false;
  }
  if (dim.score && (a.outreachTier ?? "none") !== dim.score) return false;
  if (dim.page && !(a.pageCategories ?? []).includes(dim.page)) return false;
  if (state.chipFilters.has("returns") && !a.hasPostMqlReturns) return false;
  if (state.chipFilters.has("outreach") && (a.priorityScore ?? 0) < OUTREACH_THRESHOLD) {
    return false;
  }
  if (state.chipFilters.has("high-intent") && !a.highIntentReturn) return false;
  return true;
}

function getFilteredAccounts() {
  const dim = getDimensionFilters();
  let list = state.accounts.filter((a) => passesDimensionFilters(a, dim));
  if (state.listFilter) {
    list = list.filter((a) => state.listFilter.accountIds.has(a.id));
  }
  const q = els.search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        (a.logoDomain && a.logoDomain.toLowerCase().includes(q)),
    );
  }
  return list;
}

function filteredIdSet() {
  return new Set(getFilteredAccounts().map((a) => a.id));
}

function filterBreakdownRows(items, allowedIds, limit = 20) {
  return items
    .map((item) => {
      const accountIds = (item.accountIds ?? []).filter((id) => allowedIds.has(id));
      return { ...item, accountIds, count: accountIds.length };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function filterPostPages(pages, allowedIds) {
  return pages
    .map((p) => {
      const accountIds = (p.accountIds ?? []).filter((id) => allowedIds.has(id));
      const views = accountIds.length
        ? Math.round((p.views * accountIds.length) / Math.max(p.accountIds.length, 1))
        : 0;
      return { ...p, accountIds, uniqueAccounts: accountIds.length, views: views || p.views };
    })
    .filter((p) => p.uniqueAccounts > 0)
    .sort((a, b) => b.views - a.views || b.uniqueAccounts - a.uniqueAccounts);
}

function logoMarkup(item, size = "lg") {
  const cls = size === "sm" ? "account-logo-sm" : "account-logo-lg";
  if (item.logoUrl) {
    return `<img
      class="account-logo ${cls}"
      src="${escapeHtml(item.logoUrl)}"
      alt=""
      loading="lazy"
      data-favicon="${escapeHtml(item.faviconUrl || "")}"
      data-initials="${escapeHtml(item.initials || "?")}"
    />`;
  }
  return `<span class="account-logo ${cls} initials">${escapeHtml(item.initials || "?")}</span>`;
}

function wireAccountLogos(root = document) {
  root.querySelectorAll("img.account-logo").forEach((img) => {
    if (img.dataset.wired) return;
    img.dataset.wired = "1";
    img.addEventListener("error", () => {
      const favicon = img.dataset.favicon;
      if (favicon && !img.dataset.triedFavicon) {
        img.dataset.triedFavicon = "1";
        img.src = favicon;
        return;
      }
      const span = document.createElement("span");
      span.className = `${img.className} initials`;
      span.textContent = img.dataset.initials || "?";
      img.replaceWith(span);
    });
  });
}

function buildAccountPills(a) {
  const pills = [];
  if (a.hasPostMqlReturns) {
    pills.push(`<span class="fullfunnel-pill fullfunnel-pill--returned">Returned</span>`);
  } else {
    pills.push(`<span class="fullfunnel-pill fullfunnel-pill--no-returns">No returns</span>`);
  }
  if (a.highIntentReturn) {
    pills.push(`<span class="fullfunnel-pill fullfunnel-pill--intent">High intent</span>`);
  }
  if ((a.priorityScore ?? 0) >= OUTREACH_THRESHOLD) {
    pills.push(`<span class="fullfunnel-pill fullfunnel-pill--outreach">Needs outreach</span>`);
  }
  if (isDiscoveryStatus(a.leadStatus) || a.discoveryCall) {
    pills.push(`<span class="fullfunnel-pill fullfunnel-pill--discovery">Discovery Call</span>`);
  }
  return pills.join("");
}

function buildStatusPills(insights, { compact = false } = {}) {
  const pills = [];
  const cls = compact ? "fullfunnel-pill" : "fullfunnel-journey-pill";
  if (insights.hasPostReturns) {
    pills.push(`<span class="${cls} fullfunnel-pill--returned">Returned post-MQL</span>`);
  } else {
    pills.push(`<span class="${cls} fullfunnel-pill--no-return">No post-MQL returns</span>`);
  }
  const score = insights.priorityScore ?? 0;
  if (score >= OUTREACH_THRESHOLD) {
    pills.push(
      `<span class="${cls} fullfunnel-pill--outreach">Needs outreach${compact ? "" : ` · ${escapeHtml(INTENT_SCORE_LABEL)} ${fmtNum(score)}`}</span>`,
    );
  }
  if (insights.highIntentReturn) {
    pills.push(`<span class="${cls} fullfunnel-pill--intent">High intent</span>`);
  }
  if (isDiscoveryStatus(insights.leadStatus)) {
    pills.push(`<span class="${cls} fullfunnel-pill--discovery">Discovery Call</span>`);
  }
  return pills.join("");
}

function buildJourneyPills(insights) {
  return buildStatusPills(insights);
}

function updateKpis() {
  const list = getFilteredAccounts();
  const returning = list.filter((a) => a.hasPostMqlReturns);
  const becameMql = list.reduce((n, a) => n + (a.mqlCount ?? 0), 0);
  const totalPre = list.reduce((n, a) => n + (a.touchCount ?? 0), 0);
  const totalPostViews = returning.reduce((n, a) => n + (a.returnPageViewCount ?? 0), 0);

  els.statAccounts.textContent = fmtNum(list.length);
  els.statBecameMql.textContent = fmtNum(becameMql);
  els.statReturns.textContent = fmtNum(returning.length);
  els.statReturnRate.textContent =
    list.length > 0 ? `${fmtNum((returning.length / list.length) * 100, 1)}%` : "—";
  els.statAvgPre.textContent =
    list.length > 0 ? fmtNum(totalPre / list.length, 1) : "—";
  els.statAvgPost.textContent =
    returning.length > 0 ? fmtNum(totalPostViews / returning.length, 1) : "—";
  els.headerStats.hidden = false;
  if (els.kpiCountNote) els.kpiCountNote.hidden = false;
}

function renderListMeta(filteredCount, dim) {
  if (!filteredCount) {
    els.listMeta.innerHTML =
      `<div class="sidebar-stats-hint">No accounts match the selected filters.</div>`;
    return;
  }
  const count = `${fmtNum(filteredCount)} account${filteredCount === 1 ? "" : "s"}`;
  const hintParts = [];
  if (dim.region) hintParts.push(`Region: ${dim.region}`);
  if (dim.segment) hintParts.push(`Segment: ${dim.segment}`);
  hintParts.push("Sorted by full-funnel activity");
  els.listMeta.innerHTML = `
    <div class="sidebar-stats-count">${escapeHtml(count)}</div>
    <div class="sidebar-stats-hint">${escapeHtml(hintParts.join(" · "))}</div>`;
}

function renderList() {
  const filtered = getFilteredAccounts();
  const dim = getDimensionFilters();
  renderListMeta(filtered.length, dim);

  if (!filtered.length) {
    els.accountList.innerHTML =
      `<li class="mql-list-empty-filter">No accounts match the selected filters.</li>`;
    return;
  }

  const sorted = [...filtered].sort(
    (a, b) =>
      (b.priorityScore ?? 0) - (a.priorityScore ?? 0) ||
      (b.returnVisitCount ?? 0) - (a.returnVisitCount ?? 0) ||
      (b.touchCount ?? 0) - (a.touchCount ?? 0),
  );

  els.accountList.innerHTML = sorted
    .slice(0, 500)
    .map((a) => {
      const regionPart =
        a.region && a.region !== "Unknown region" ? escapeHtml(a.region) : "—";
      const segmentPart = a.mainSegment ? escapeHtml(a.mainSegment) : "—";
      const scoreLine = scorePairInline(a.lastCombinedScore, a.priorityScore);
      const scoreRow = scoreLine
        ? `<span class="mql-item-row">${escapeHtml(scoreLine)}</span>`
        : "";
      return `
        <li>
          <button
            type="button"
            class="mql-item"
            role="option"
            aria-selected="${a.id === state.selectedId}"
            data-id="${escapeHtml(a.id)}"
          >
            <span class="mql-item-name">${escapeHtml(a.accountName)}</span>
            <span class="mql-item-row">${escapeHtml(a.logoDomain || "—")}</span>
            <span class="mql-item-row mql-item-stat">
              <strong>${a.touchCount ?? 0}</strong> pre-MQL touches · MQL ${formatDateShort(a.mqlDate)} · <strong>${a.returnVisitCount ?? 0}</strong> post return${(a.returnVisitCount ?? 0) === 1 ? "" : "s"}
            </span>
            <span class="mql-item-row">${escapeHtml(displayMeta(a.leadStatus))} · ${regionPart} · ${segmentPart}</span>
            ${scoreRow}
            <span class="fullfunnel-pills">${buildAccountPills(a)}</span>
          </button>
        </li>`;
    })
    .join("");

  els.accountList.querySelectorAll(".mql-item").forEach((btn) => {
    btn.addEventListener("click", () => selectAccount(btn.dataset.id));
  });
}

function renderMetaItem(label, value) {
  const display = value ?? "—";
  return `
    <div class="fullfunnel-detail-row">
      <span class="fullfunnel-detail-label">${escapeHtml(label)}</span>
      <span class="fullfunnel-detail-value" title="${escapeHtml(String(display))}">${escapeHtml(display)}</span>
    </div>`;
}

function renderMetaItemOptional(label, value, format = (v) => v) {
  if (value == null || value === undefined) return "";
  const display = format(value);
  if (!isPresentValue(display)) return "";
  return renderMetaItem(label, display);
}

function renderInsightSection(title, rows) {
  const items = rows.filter(Boolean).join("");
  if (!items) return "";
  return `
    <div class="fullfunnel-insight-section">
      <h3 class="fullfunnel-insight-section-title">${escapeHtml(title)}</h3>
      <div class="fullfunnel-insight-grid fullfunnel-insight-grid--single">${items}</div>
    </div>`;
}

function renderIntentScoreMetaRow(insights) {
  if (!insights.hasPostReturns) return "";
  const intent = formatIntentScore(insights.priorityScore);
  if (intent) {
    return renderMetaItem(INTENT_SCORE_LABEL, intent);
  }
  return renderMetaItem(INTENT_SCORE_LABEL, "Not available");
}

function renderAccountInsights(insights) {
  if (!insights) {
    els.accountInsightSub.textContent = "Select an account";
    els.accountInsightPills.innerHTML = "";
    els.accountInsightPills.hidden = true;
    els.accountInsightsEmpty.hidden = false;
    els.accountInsightsContent.hidden = true;
    els.accountInsightsContent.innerHTML = "";
    return;
  }

  els.accountInsightSub.textContent = insights.accountName ?? "Account journey";
  els.accountInsightPills.innerHTML = "";
  els.accountInsightPills.hidden = true;
  els.accountInsightsEmpty.hidden = true;
  els.accountInsightsContent.hidden = false;

  const statusPills = buildStatusPills(insights, { compact: true });
  const outreachTier =
    insights.outreachTier && insights.outreachTier !== "none"
      ? insights.outreachTier
      : null;

  const sections = [
    renderInsightSection("Journey summary", [
      renderMetaItemOptional("Pre-MQL touches", insights.preTouchCount, (v) => fmtNum(v)),
      renderMetaItemOptional("Days to MQL", insights.daysToMql, (v) => String(v)),
      renderMetaItemOptional("MQL date", insights.mqlDate, formatDateShort),
      renderMetaItemOptional("Lead status", insights.leadStatus, displayMeta),
    ]),
    renderInsightSection("Post-MQL behavior", [
      renderMetaItemOptional("Return visits", insights.postReturnVisits, (v) => fmtNum(v)),
      renderMetaItemOptional("Page views", insights.postPageViews, (v) => fmtNum(v)),
      insights.hasPostReturns
        ? renderMetaItemOptional(
            "Latest return",
            insights.lastReturn ?? insights.latestAt,
            formatDateShort,
          )
        : "",
      renderMetaItem("High intent", insights.highIntentReturn ? "Yes" : "No"),
      outreachTier ? renderMetaItem("Outreach tier", outreachTier) : "",
      renderIntentScoreMetaRow(insights),
    ]),
    renderInsightSection("Ownership", [
      renderMetaItemOptional("Owner", insights.owner, displayMeta),
      renderMetaItemOptional("Region", insights.region),
      renderMetaItemOptional("Segment", insights.segment, displayMeta),
      renderMetaItemOptional(FIT_SCORE_LABEL, insights.score, formatFitScore),
      renderMetaItemOptional("Country", insights.country),
    ]),
  ]
    .filter(Boolean)
    .join("");

  els.accountInsightsContent.innerHTML = `
    <div class="fullfunnel-account-insight-card">
      ${statusPills ? `<div class="fullfunnel-insight-status-pills">${statusPills}</div>` : ""}
      ${sections}
    </div>`;
}

function remapLanesForZone(lanes, mqlPct, phase) {
  const span = phase === "pre" ? Math.max(mqlPct, 1) : Math.max(100 - mqlPct, 1);
  const offset = phase === "pre" ? 0 : mqlPct;
  return (lanes ?? []).map((lane) => ({
    ...lane,
    phase,
    touches: (lane.touches ?? []).map((t) => {
      const global = t.globalPct ?? t.pct ?? 0;
      const phasePct = ((global - offset) / span) * 100;
      return {
        ...t,
        pct: Math.min(100, Math.max(0, phasePct)),
        globalPct: Math.min(100, Math.max(0, phasePct)),
      };
    }),
  }));
}

function renderSummaryCards(insights, account) {
  const fitScore = formatFitScore(insights.score);
  const intentScore = formatIntentScore(insights.priorityScore);
  const afterMqlRows = insights.hasPostReturns
    ? `
        <div><dt>Return visits</dt><dd>${fmtNum(insights.postReturnVisits)}</dd></div>
        <div><dt>Page views</dt><dd>${fmtNum(insights.postPageViews)}</dd></div>
        <div><dt>Latest return</dt><dd>${formatDateShort(insights.lastReturn ?? insights.latestAt)}</dd></div>
        ${
          intentScore
            ? `<div><dt>${escapeHtml(INTENT_SCORE_LABEL)}</dt><dd title="${escapeHtml(INTENT_SCORE_TOOLTIP)}">${escapeHtml(intentScore)}</dd></div>`
            : `<div><dt>${escapeHtml(INTENT_SCORE_LABEL)}</dt><dd>Not available</dd></div>`
        }
        <div><dt>Outreach priority</dt><dd>${escapeHtml(insights.recommendedAction ?? insights.outreachTier ?? "—")}</dd></div>`
    : `<div class="fullfunnel-summary-empty">No tracked post-MQL return activity in the current dataset.</div>`;

  els.summaryCards.innerHTML = `
    <div class="fullfunnel-summary-card">
      <h4>Before MQL</h4>
      <dl>
        <div><dt>First touch date</dt><dd>${formatDateShort(insights.journeyStartAt)}</dd></div>
        <div><dt>Pre-MQL touches</dt><dd>${fmtNum(insights.preTouchCount)}</dd></div>
        <div><dt>Primary source</dt><dd>${escapeHtml(displayMeta(insights.primarySource))}</dd></div>
      </dl>
    </div>
    <div class="fullfunnel-summary-card fullfunnel-summary-card--mql">
      <h4>Became MQL</h4>
      <dl>
        <div><dt>MQL date</dt><dd>${formatDateShort(insights.mqlDate)}</dd></div>
        <div><dt>Days to MQL</dt><dd>${escapeHtml(String(insights.daysToMql ?? "—"))}</dd></div>
        <div><dt>Lead status</dt><dd>${escapeHtml(displayMeta(insights.leadStatus))}</dd></div>
        ${
          fitScore
            ? `<div><dt>${escapeHtml(FIT_SCORE_LABEL)}</dt><dd title="${escapeHtml(FIT_SCORE_TOOLTIP)}">${escapeHtml(fitScore)}</dd></div>`
            : ""
        }
      </dl>
    </div>
    <div class="fullfunnel-summary-card">
      <h4>After MQL</h4>
      <dl>${afterMqlRows}</dl>
    </div>`;
}

function renderJourneyInsight(insights) {
  if (insights.hasPostReturns) {
    const visits = fmtNum(insights.postReturnVisits);
    const pages = fmtNum(insights.postPageViews);
    els.journeyOutcome.textContent = `This account became MQL after ${fmtNum(insights.preTouchCount)} pre-MQL touches, then returned ${visits} time${insights.postReturnVisits === 1 ? "" : "s"} and viewed ${pages} page${insights.postPageViews === 1 ? "" : "s"} after MQL.`;
  } else {
    els.journeyOutcome.textContent = `This account became MQL after ${fmtNum(insights.preTouchCount)} pre-MQL touches, but has no tracked post-MQL return activity in the current dataset.`;
  }

  const bullets = [];
  if (insights.representativeNote) {
    bullets.unshift(`<li>${escapeHtml(insights.representativeNote)}</li>`);
  }
  if (insights.primarySource) {
    bullets.push(`<li>Primary source: ${escapeHtml(insights.primarySource)}</li>`);
  }
  if (insights.highIntentReturn && insights.highIntentPages?.length) {
    bullets.push(
      `<li>High intent: visited ${escapeHtml(insights.highIntentPages[0])} after MQL</li>`,
    );
  }
  if (insights.recommendedAction) {
    bullets.push(`<li>Recommended action: ${escapeHtml(insights.recommendedAction)}</li>`);
  }
  if (insights.region || insights.segment) {
    const regionPart = insights.region ? escapeHtml(insights.region) : "—";
    const segmentPart = escapeHtml(displayMeta(insights.segment));
    bullets.push(`<li>Region: ${regionPart} · Segment: ${segmentPart}</li>`);
  }
  const scoreLine = scorePairInline(insights.score, insights.priorityScore);
  if (scoreLine) {
    bullets.push(`<li>${escapeHtml(scoreLine)}</li>`);
  }
  els.journeyInsightBullets.innerHTML = bullets.join("");
}

function renderJourney(data) {
  const pre = data.preMql;
  const post = data.postMql;
  const touch = data.touchJourney;
  const insights = data.insights;
  const account = data.account;

  if (!touch || !pre) {
    els.journeySubtitle.textContent = "Journey data unavailable for this account";
    return;
  }

  els.journeySubtitle.hidden = true;
  els.journeyEmpty.hidden = true;
  els.journeyContent.hidden = false;

  const pills = buildJourneyPills(insights);
  if (pills) {
    els.journeyPills.innerHTML = pills;
    els.journeyPills.hidden = false;
  } else {
    els.journeyPills.innerHTML = "";
    els.journeyPills.hidden = true;
  }

  const metaParts = [];
  if (insights.region && insights.region !== "Unknown region") {
    metaParts.push(insights.region);
  }
  if (insights.segment) metaParts.push(displayMeta(insights.segment));
  if (insights.owner) metaParts.push(`Owner: ${insights.owner}`);
  const scoreLine = scorePairInline(insights.score, insights.priorityScore);
  if (scoreLine) metaParts.push(scoreLine);

  els.accountHeader.innerHTML = `
    ${logoMarkup(account)}
    <div class="account-header-text">
      <h3 title="${escapeHtml(account.accountName)}">${escapeHtml(account.accountName)}</h3>
      ${account.logoDomain ? `<p class="account-domain" title="${escapeHtml(account.logoDomain)}">${escapeHtml(account.logoDomain)}</p>` : ""}
      ${metaParts.length ? `<p class="fullfunnel-lead-meta" title="${escapeHtml(metaParts.join(" · "))}">${escapeHtml(metaParts.join(" · "))}</p>` : ""}
      ${insights.representativeNote ? `<p class="fullfunnel-representative-note">${escapeHtml(insights.representativeNote)}</p>` : ""}
    </div>`;
  wireAccountLogos(els.accountHeader);

  renderSummaryCards(insights, account);
  els.mqlPillarDate.textContent = formatDateShort(insights.mqlDate);
  els.preZoneSub.textContent = `${insights.preTouchCount} touch${insights.preTouchCount === 1 ? "" : "es"}`;
  if (els.postZoneLabel) {
    els.postZoneLabel.textContent = insights.hasPostReturns ? "Post-MQL returns" : "After MQL";
  }
  els.postZoneSub.textContent = insights.hasPostReturns
    ? `${insights.postReturnVisits} return${insights.postReturnVisits === 1 ? "" : "s"} · ${insights.postPageViews} views`
    : "No tracked returns";

  const mqlPct = touch.mqlPct ?? 50;
  const preLanes = remapLanesForZone(touch.preLanes, mqlPct, "pre");
  const postLanes = remapLanesForZone(touch.postLanes, mqlPct, "post");

  renderFullFunnelTouchLanes(els.preTouchLanes, preLanes, {
    phase: "pre",
    pctKey: "globalPct",
    maxLanes: 10,
    emptyLabel: "No pre-MQL activity found for this contact/account.",
  });

  if (insights.hasPostReturns) {
    els.postZoneEmpty.hidden = true;
    els.postTouchLanes.hidden = false;
    renderFullFunnelTouchLanes(els.postTouchLanes, postLanes, {
      phase: "post",
      pctKey: "globalPct",
      maxLanes: 10,
      emptyLabel: "No post-MQL lanes could be built.",
    });
  } else {
    els.postTouchLanes.innerHTML = "";
    els.postTouchLanes.hidden = true;
    els.postZoneEmpty.hidden = false;
  }
  hideTooltips();
  hideTooltips = wireLaneTooltips(els.journeyContent, els.laneTooltip);

  renderJourneyInsight(insights);
  renderAccountInsights(insights);

  els.preTimeline.innerHTML = (pre.timeline ?? [])
    .map(
      (node) => `
      <li class="type-${escapeHtml(node.type)}">
        <div class="timeline-time">${formatDate(node.at)}</div>
        <div class="timeline-label">${escapeHtml(node.label)}</div>
        ${node.detail ? `<div class="timeline-detail">${escapeHtml(node.detail)}</div>` : ""}
      </li>`,
    )
    .join("");

  if (!post || !post.visits?.length) {
    els.postTimeline.innerHTML =
      `<p class="touch-journey-empty">No post-MQL return visits in dataset for this account.</p>`;
    return;
  }

  els.postTimeline.innerHTML = post.visits
    .map(
      (visit, i) => `
      <article class="visit">
        <span class="visit-dot" aria-hidden="true"></span>
        <div class="visit-header">
          <span class="visit-label">Return visit ${i + 1}</span>
          <time class="visit-time">${formatDate(visit.returnedAt)}</time>
        </div>
        <ul class="pages">${(visit.pages ?? [])
          .map(
            (p) => `
          <li class="page-row">
            <span class="page-path">${escapeHtml(p.path)}</span>
            <span class="page-time">${formatDate(p.viewedAt)}</span>
          </li>`,
          )
          .join("")}</ul>
      </article>`,
    )
    .join("");
}

function isFilterActive(kind, key) {
  const dim = getDimensionFilters();
  if (kind === "region") return dim.region === key;
  if (kind === "segment") return dim.segment === key;
  if (kind === "leadStatus") return dim.status === key;
  if (kind === "owner") return dim.owner === key;
  if (kind === "source") return dim.source === key;
  if (kind === "page") return dim.page === key;
  if (kind === "outreach") return state.listFilter?.kind === "outreach" && state.listFilter?.key === key;
  return state.listFilter?.kind === kind && state.listFilter?.key === key;
}

function renderInsightCard(container, moreBtn, expandKey, items, kind, totalAccounts, usePages = false) {
  if (!container) return;
  if (!items?.length) {
    container.innerHTML = `<div class="filter-insight-empty">No data for current filters</div>`;
    if (moreBtn) moreBtn.hidden = true;
    return;
  }

  const expanded = state.insightsExpanded[expandKey];
  const limit = expanded ? Math.min(items.length, 12) : 5;
  const visible = items.slice(0, limit);
  const maxVal = usePages ? (visible[0]?.views ?? 1) : (visible[0]?.count ?? 1);

  container.innerHTML = visible
    .map((item, i) => {
      const active = isFilterActive(kind, item.label || item.path) ? " is-filter-active" : "";
      const count = usePages ? item.uniqueAccounts : item.count;
      const pct = totalAccounts > 0 ? Math.round((count / totalAccounts) * 100) : 0;
      const barVal = usePages ? item.views : item.count;
      const barPct = maxVal > 0 ? (barVal / maxVal) * 100 : 0;
      const label = item.label || item.path;
      const countLabel = usePages
        ? `${fmtNum(item.views)} views · ${fmtNum(count)} account${count === 1 ? "" : "s"}`
        : `${fmtNum(count)} account${count === 1 ? "" : "s"}`;
      return `
        <button type="button" class="filter-insight-row${active}" data-kind="${escapeHtml(kind)}" data-key="${escapeHtml(label)}">
          <span class="filter-insight-rank">${i + 1}</span>
          <div class="filter-insight-main">
            <div class="filter-insight-row-head">
              <span class="filter-insight-name" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
              <span class="filter-insight-count">${countLabel}${pct > 0 ? ` · ${pct}%` : ""}</span>
            </div>
            <div class="filter-insight-bar" aria-hidden="true"><span style="width:${barPct.toFixed(1)}%"></span></div>
          </div>
        </button>`;
    })
    .join("");

  if (moreBtn) {
    moreBtn.hidden = items.length <= 5;
    moreBtn.textContent = expanded ? "Show less" : "View all";
    moreBtn.onclick = () => {
      state.insightsExpanded[expandKey] = !state.insightsExpanded[expandKey];
      renderInsights();
    };
  }

  container.querySelectorAll(".filter-insight-row").forEach((row) => {
    row.addEventListener("click", () => {
      const kindAttr = row.dataset.kind;
      const key = row.dataset.key;
      const match = items.find((x) => (x.label || x.path) === key);
      if (!match || !kindAttr) return;
      if (kindAttr === "page") {
        applyDimensionFilter("page", key);
      } else if (kindAttr === "outreach") {
        setListFilter(
          "outreach",
          key,
          `${fmtNum(match.count)} account${match.count === 1 ? "" : "s"} · ${key}`,
          match.accountIds,
        );
      } else if (["region", "segment", "leadStatus", "owner", "source"].includes(kindAttr)) {
        applyDimensionFilter(kindAttr, key);
      } else if (kindAttr === "postPages") {
        setListFilter(
          "postPages",
          key,
          `${fmtNum(match.uniqueAccounts)} account${match.uniqueAccounts === 1 ? "" : "s"} visited ${key}`,
          match.accountIds,
        );
      }
    });
  });
}

function renderInsights() {
  const allowed = filteredIdSet();
  const filtered = getFilteredAccounts();
  const totalAccounts = filtered.length;
  els.insightsFilterNote.textContent = `${fmtNum(totalAccounts)} account${totalAccounts === 1 ? "" : "s"} in current filter`;

  const postPages = filterPostPages(state.breakdowns.postPages, allowed);

  renderInsightCard(
    els.preSourceList,
    els.preSourceListMore,
    "preSource",
    filterBreakdownRows(state.breakdowns.preSource, allowed),
    "source",
    totalAccounts,
  );
  renderInsightCard(
    els.postPageList,
    els.postPageListMore,
    "postPages",
    postPages,
    "postPages",
    totalAccounts,
    true,
  );
  renderInsightCard(
    els.leadStatusList,
    els.leadStatusListMore,
    "status",
    filterBreakdownRows(state.breakdowns.leadStatus, allowed),
    "leadStatus",
    totalAccounts,
  );
  renderInsightCard(
    els.regionList,
    els.regionListMore,
    "region",
    filterBreakdownRows(state.breakdowns.region, allowed),
    "region",
    totalAccounts,
  );
  renderInsightCard(
    els.segmentList,
    els.segmentListMore,
    "segment",
    filterBreakdownRows(state.breakdowns.segment, allowed),
    "segment",
    totalAccounts,
  );
  renderInsightCard(
    els.ownerList,
    els.ownerListMore,
    "owner",
    filterBreakdownRows(state.breakdowns.owner, allowed),
    "owner",
    totalAccounts,
  );
  renderInsightCard(
    els.outreachList,
    els.outreachListMore,
    "outreach",
    filterBreakdownRows(state.breakdowns.outreach, allowed),
    "outreach",
    totalAccounts,
  );
}

function populateFilterOptions() {
  const statuses = new Set();
  const segments = new Set();
  const owners = new Set();
  const regions = new Set();
  const sources = new Set();
  const categories = new Set();

  for (const a of state.accounts) {
    if (a.leadStatus) statuses.add(String(a.leadStatus).trim());
    if (a.mainSegment) segments.add(String(a.mainSegment).trim());
    if (a.mainOwnerName) owners.add(String(a.mainOwnerName).trim());
    regions.add(accountRegion(a));
    if (a.primarySource) sources.add(String(a.primarySource).trim());
    for (const c of a.pageCategories ?? []) categories.add(c);
  }

  const fill = (select, values, allLabel) => {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${allLabel}</option>`;
    [...values].sort().forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    select.value = current;
  };

  fill(els.filterStatus, statuses, "All statuses");
  fill(els.filterSegment, segments, "All segments");
  fill(els.filterOwner, owners, "All owners");
  fill(els.filterRegion, regions, "All regions");
  fill(els.filterSource, sources, "All sources");
  fill(
    els.filterPage,
    categories,
    "All pages",
  );
}

function intentScoreBandLabel(band) {
  if (band === "immediate") return "Immediate outreach";
  if (band === "soon") return "Outreach soon";
  if (band === "watch") return "Watch";
  if (band === "none") return "No post-MQL returns";
  return band;
}

function syncChipFilterUi() {
  document.querySelectorAll(".filter-chip").forEach((btn) => {
    const key = btn.dataset.filter;
    btn.classList.toggle("active", state.chipFilters.has(key));
  });
  document.querySelectorAll(".kpi-filter-btn[data-chip-filter]").forEach((btn) => {
    btn.classList.toggle("is-active", state.chipFilters.has(btn.dataset.chipFilter));
  });
}

function toggleChipFilter(key) {
  if (state.chipFilters.has(key)) state.chipFilters.delete(key);
  else state.chipFilters.add(key);
  syncChipFilterUi();
  renderAll();
}

function updateRegionChip() {
  const region = normalizeFilterValue(state.filters.region);
  if (region) {
    els.regionFilterChip.hidden = false;
    els.regionChipLabel.textContent = region;
  } else {
    els.regionFilterChip.hidden = true;
  }
}

function updateFilterAudienceBar() {
  const dim = getDimensionFilters();
  const parts = [];
  if (dim.region) parts.push(`Region: ${dim.region}`);
  if (dim.segment) parts.push(`Segment: ${dim.segment}`);
  if (dim.status) parts.push(`Status: ${dim.status}`);
  if (dim.owner) parts.push(`Owner: ${dim.owner}`);
  if (dim.source) parts.push(`Source: ${dim.source}`);
  if (dim.page) parts.push(`Page: ${dim.page}`);
  if (dim.score) parts.push(`Intent score band: ${intentScoreBandLabel(dim.score)}`);
  if (dim.mqlFrom || dim.mqlTo) {
    parts.push(`MQL: ${dim.mqlFrom || "…"} – ${dim.mqlTo || "…"}`);
  }
  for (const chip of state.chipFilters) {
    if (chip === "returns") parts.push("Has post-MQL returns");
    if (chip === "outreach") parts.push("Needs outreach");
    if (chip === "high-intent") parts.push("High-intent only");
  }
  if (state.listFilter) parts.push(state.listFilter.label);

  const active = parts.length > 0;
  els.filterAudienceBar.hidden = !active;
  els.clearFiltersBtn.hidden = !active;
  els.filterAudienceSummary.textContent = active
    ? `Showing ${fmtNum(getFilteredAccounts().length)} accounts · ${parts.join(" · ")}`
    : "";
}

function clearAllFilters() {
  state.filters = {
    region: "",
    segment: "",
    status: "",
    owner: "",
    score: "",
    source: "",
    page: "",
    mqlFrom: "",
    mqlTo: "",
  };
  state.chipFilters.clear();
  state.listFilter = null;
  els.listFilterBanner.hidden = true;
  syncChipFilterUi();
  syncFiltersToDom();
  updateRegionChip();
  renderAll();
}

function applyDimensionFilter(kind, key) {
  clearListFilter({ rerender: false });
  const value = normalizeFilterValue(key);
  if (kind === "region") state.filters.region = value;
  else if (kind === "segment") state.filters.segment = value;
  else if (kind === "leadStatus") state.filters.status = value;
  else if (kind === "owner") state.filters.owner = value;
  else if (kind === "source") state.filters.source = value;
  else if (kind === "page") state.filters.page = value;
  syncFiltersToDom();
  updateRegionChip();
  renderAll();
}

function setListFilter(kind, key, bannerText, accountIds) {
  state.listFilter = {
    kind,
    key,
    label: bannerText,
    accountIds: new Set(accountIds),
  };
  els.search.value = "";
  els.listFilterLabel.textContent = bannerText;
  els.listFilterBanner.hidden = false;
  renderAll();
  if (accountIds.length > 0) selectAccount(accountIds[0]);
}

function clearListFilter({ rerender = true } = {}) {
  state.listFilter = null;
  els.listFilterBanner.hidden = true;
  if (rerender) renderAll();
}

function renderValidation() {
  els.validationCalcNotes.innerHTML = [
    "Accounts are grouped from pre-MQL journeys by company/domain.",
    "Accounts returned post-MQL = any MQL contact on the account with tracked post-MQL website activity.",
    "Selected journey shows the contact with the strongest full-funnel signal (outreach → high intent → page views → pre-MQL touches).",
    "Pre-MQL touches count website events before MQL date.",
    "Post-MQL page views count events after MQL date (30-minute session gap).",
    "Return rate = accounts returned post-MQL ÷ accounts with pre-MQL data.",
    "Avg post-MQL views is calculated among returning accounts only.",
  ]
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  els.validationOutreachNotes.innerHTML = (state.outreachAssumptions.length
    ? state.outreachAssumptions
    : [
        "Recency, engagement, intent pages, lead status, and score tier contribute to priority score.",
        "Priority score ≥ 55 = needs outreach (analyst rule of thumb).",
      ]
  )
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  const meta = state.regionMeta;
  if (meta) {
    els.validationRegionNotes.innerHTML = `
      <p><strong>Method:</strong> ${escapeHtml(meta.method ?? "derived")}</p>
      <p>${escapeHtml(meta.mappingNote ?? "")}</p>
      <p>Unknown regions: ${fmtNum(meta.unknownCount ?? 0)}</p>`;
  } else {
    els.validationRegionNotes.innerHTML =
      `<p>Region derived from country mapping via primary contact email.</p>`;
  }

  const dim = getDimensionFilters();
  const filtered = getFilteredAccounts();
  els.validationFilterDebug.innerHTML = `
    <p>Total accounts loaded: ${fmtNum(state.accounts.length)}</p>
    <p>Filtered accounts: ${fmtNum(filtered.length)}</p>
    <p>Active filters: ${escapeHtml(JSON.stringify(dim))}</p>
    <p>Chip filters: ${escapeHtml([...state.chipFilters].join(", ") || "none")}</p>
    <p>Filtered KPIs preserve entity level: Post-MQL tab = contact-level; Full Funnel = account-level (any-contact logic).</p>`;

  const ev = state.entityValidation;
  if (ev && els.validationEntityLevel) {
    els.validationEntityLevel.innerHTML = `
      <table class="validation-entity-table">
        <tbody>
          <tr><th scope="row">MQL contacts (pre-MQL export)</th><td>${fmtNum(ev.mqlContacts)}</td></tr>
          <tr><th scope="row">Returning MQL contacts (post-MQL export)</th><td>${fmtNum(ev.returningMqlContacts)}</td></tr>
          <tr><th scope="row">Accounts returned post-MQL (any contact)</th><td>${fmtNum(ev.returningAccountsAnyContact ?? ev.returningAccounts)}</td></tr>
          <tr><th scope="row">Accounts returned post-MQL (primary contact only)</th><td>${fmtNum(ev.returningAccountsPrimary ?? 0)}</td></tr>
          <tr><th scope="row">Contacts without tracked post-MQL returns</th><td>${fmtNum(ev.contactsWithoutTrackedReturns)}</td></tr>
          <tr><th scope="row">Contacts not in post-MQL export</th><td>${fmtNum(ev.contactsNotInPostMqlExport)}</td></tr>
          <tr><th scope="row">Accounts without tracked post-MQL returns</th><td>${fmtNum(ev.accountsWithoutTrackedReturns)}</td></tr>
          <tr><th scope="row">Returning contacts − returning accounts gap</th><td>${fmtNum(ev.gapContactsMinusAccounts)}</td></tr>
        </tbody>
      </table>
      <p class="validation-entity-note">Full Funnel KPI uses any-contact account logic. Primary-contact-only count is kept for validation. Post-MQL tab counts contacts; Full Funnel counts accounts. ${fmtNum(ev.returningContactsNotInPreExport)} returning contacts in the post-MQL export are not in the pre-MQL export.</p>
      <ul class="validation-notes-list">${(ev.notes ?? [])
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("")}</ul>`;
  }

  renderScoreValidationNotes();
  renderReturnFilterValidationNotes();
}

function renderScoreValidationNotes() {
  if (!els.validationScoreNotes) return;
  const stats = scoreCoverageStats(state.accounts);
  els.validationScoreNotes.innerHTML = `
    <p><strong>${escapeHtml(FIT_SCORE_LABEL)}</strong> — source field <code>lastCombinedScore</code> on account/journey (e.g. A1, B1, C1). ${escapeHtml(FIT_SCORE_TOOLTIP)}</p>
    <p><strong>${escapeHtml(INTENT_SCORE_LABEL)}</strong> — calculated field <code>priorityScore</code> from post-MQL outreach scoring (max across account contacts). ${escapeHtml(INTENT_SCORE_TOOLTIP)}</p>
    <table class="validation-entity-table">
      <tbody>
        <tr><th scope="row">Accounts in list</th><td>${fmtNum(stats.total)}</td></tr>
        <tr><th scope="row">With fit score</th><td>${fmtNum(stats.withFit)}</td></tr>
        <tr><th scope="row">Missing fit score</th><td>${fmtNum(stats.missingFit)}</td></tr>
        <tr><th scope="row">With intent score</th><td>${fmtNum(stats.withIntent)}</td></tr>
        <tr><th scope="row">Missing intent score</th><td>${fmtNum(stats.missingIntent)}</td></tr>
        <tr><th scope="row">With both scores</th><td>${fmtNum(stats.withBoth)}</td></tr>
      </tbody>
    </table>`;
}

function renderReturnFilterValidationNotes() {
  if (!els.validationReturnFilterNotes) return;
  const total = state.accounts.length;
  const withReturns = state.accounts.filter((a) => a.hasPostMqlReturns).length;
  const without = total - withReturns;
  const filtered = getFilteredAccounts();
  const filteredWithReturns = filtered.filter((a) => a.hasPostMqlReturns).length;
  const chipActive = state.chipFilters.has("returns");
  const kpiButtonsActive = document.querySelectorAll(
    ".kpi-filter-btn[data-chip-filter='returns'].is-active",
  ).length;
  els.validationReturnFilterNotes.innerHTML = `
    <table class="validation-entity-table">
      <tbody>
        <tr><th scope="row">Total accounts</th><td>${fmtNum(total)}</td></tr>
        <tr><th scope="row">With tracked post-MQL returns</th><td>${fmtNum(withReturns)}</td></tr>
        <tr><th scope="row">Without tracked post-MQL returns</th><td>${fmtNum(without)}</td></tr>
        <tr><th scope="row">Filtered accounts (current view)</th><td>${fmtNum(filtered.length)}</td></tr>
        <tr><th scope="row">Filtered with returns</th><td>${fmtNum(filteredWithReturns)}</td></tr>
        <tr><th scope="row">"Has post-MQL returns" chip active</th><td>${chipActive ? "Yes" : "No"}</td></tr>
        <tr><th scope="row">Return KPI buttons active</th><td>${kpiButtonsActive > 0 ? `Yes (${kpiButtonsActive} button${kpiButtonsActive === 1 ? "" : "s"})` : "No"}</td></tr>
        <tr><th scope="row">KPI click syncs with chip</th><td>${chipActive === (kpiButtonsActive > 0) ? "Confirmed" : "Mismatch — refresh or toggle filter"}</td></tr>
      </tbody>
    </table>
    <p>Clicking <strong>Accounts returned post-MQL</strong> or <strong>Post-MQL return rate</strong> toggles the same <code>returns</code> chip filter as <strong>Has post-MQL returns</strong>.</p>`;
}

function regionFilterTooltip() {
  const derived =
    "Region is derived from country mapping because no native Region field exists in the source CSV. Use with Segment to create regional manager views.";
  const direct =
    "Filter accounts by sales/marketing region. Use with Segment to create regional manager views.";
  const meta = state.regionMeta;
  if (!meta) return derived;
  if (meta.method === "derived" || meta.method === "mixed") return derived;
  return direct;
}

function renderAll() {
  updateKpis();
  renderList();
  renderInsights();
  updateFilterAudienceBar();
  syncChipFilterUi();
  renderValidation();

  const filtered = getFilteredAccounts();
  if (state.selectedId && !filtered.some((a) => a.id === state.selectedId)) {
    state.selectedId = null;
    els.journeyEmpty.hidden = false;
    els.journeyEmpty.textContent =
      "Selected account is not in the current filter. Pick an account from the list.";
    els.journeyContent.hidden = true;
    els.journeySubtitle.textContent = "Select an account to view the full journey";
    renderAccountInsights(null);
  } else if (!state.selectedId) {
    els.journeyEmpty.hidden = false;
    els.journeyContent.hidden = true;
  }
}

async function loadApi(url) {
  try {
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: {
        error: "Cannot reach the dashboard server",
        hint: "Run `node server.mjs` inside mql-journey-dashboard, then open http://localhost:3847/full-funnel.html",
        detail: String(err.message ?? err),
      },
    };
  }
}

function showLoadError(message, hint) {
  els.listMeta.innerHTML = `<div class="sidebar-stats-hint">${escapeHtml(message)}</div>`;
  els.journeySubtitle.textContent = hint || message;
  els.journeyEmpty.hidden = false;
  els.journeyEmpty.innerHTML = `
    <p><strong>${escapeHtml(message)}</strong></p>
    ${hint ? `<p>${escapeHtml(hint)}</p>` : ""}
    <p class="touch-journey-empty">From the project folder: <code>node server.mjs</code> · then reload this page.</p>`;
  els.journeyContent.hidden = true;
}

async function selectAccount(id) {
  state.selectedId = id;
  renderList();
  els.journeyEmpty.hidden = false;
  els.journeyContent.hidden = true;
  hideTooltips();
  renderAccountInsights(null);

  try {
    const res = await fetch(`/api/full-funnel/accounts/${encodeURIComponent(id)}/journey`);
    if (!res.ok) throw new Error("Failed to load");
    renderJourney(await res.json());
  } catch {
    els.journeySubtitle.textContent = "Failed to load journey for this account";
    els.journeyEmpty.hidden = false;
    els.journeyEmpty.textContent = "Could not load journey data. Try another account or refresh.";
    els.journeyContent.hidden = true;
  }
}

async function init() {
  initFullFunnelKpiTooltips(document);

  const [accountsRes, breakdownsRes, metaRes, outreachRes, entityRes] = await Promise.all([
    loadApi("/api/full-funnel/accounts"),
    loadApi("/api/full-funnel/breakdowns"),
    loadApi("/api/full-funnel/meta"),
    loadApi("/api/outreach-priority?limit=1"),
    loadApi("/api/full-funnel/entity-validation"),
  ]);

  if (!accountsRes.ok) {
    const err = accountsRes.body?.error ?? "Failed to load accounts";
    const hint =
      accountsRes.body?.hint ??
      (accountsRes.status === 0
        ? "The API server is not running."
        : `Server returned HTTP ${accountsRes.status}.`);
    showLoadError(err, hint);
    return;
  }

  state.accounts = accountsRes.body.accounts ?? [];
  if (breakdownsRes.ok) state.breakdowns = breakdownsRes.body;
  if (outreachRes.ok) state.outreachAssumptions = outreachRes.body.assumptions ?? [];
  if (entityRes.ok) state.entityValidation = entityRes.body;

  const apiMeta = await loadApi("/api/meta");
  if (apiMeta.ok) state.regionMeta = apiMeta.body.regionMeta ?? null;
  if (els.regionFilterTip) {
    const tip = regionFilterTooltip();
    els.regionFilterTip.title = tip;
    els.regionFilterTip.setAttribute("aria-label", tip);
  }

  populateFilterOptions();
  renderAll();

  if (state.accounts.length > 0) {
    await selectAccount(state.accounts[0].id);
  } else {
    showLoadError(
      "No accounts in pre-MQL data",
      metaRes.body?.preMqlError ?? "Check PRE_MQL_CSV in .env",
    );
  }
}

els.search.addEventListener("input", renderAll);

[
  els.filterRegion,
  els.filterSegment,
  els.filterStatus,
  els.filterOwner,
  els.filterScore,
  els.filterSource,
  els.filterPage,
  els.filterMqlFrom,
  els.filterMqlTo,
].forEach((el) => {
  el?.addEventListener("change", () => {
    readFiltersFromDom();
    clearListFilter({ rerender: false });
    updateRegionChip();
    renderAll();
  });
});

document.querySelectorAll(".filter-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleChipFilter(btn.dataset.filter);
  });
});

document.querySelectorAll(".kpi-filter-btn[data-chip-filter]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (e.target.closest(".kpi-info-btn")) return;
    toggleChipFilter(btn.dataset.chipFilter);
  });
});

els.clearFiltersBtn?.addEventListener("click", clearAllFilters);
els.regionChipClear?.addEventListener("click", () => {
  state.filters.region = "";
  syncFiltersToDom();
  updateRegionChip();
  renderAll();
});
els.listFilterClear?.addEventListener("click", () => clearListFilter());

els.validationToggle?.addEventListener("click", () => {
  const open = els.validationPanel.hidden;
  els.validationPanel.hidden = !open;
  els.validationToggle.setAttribute("aria-expanded", String(open));
});

init();
