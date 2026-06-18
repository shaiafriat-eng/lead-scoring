import {
  renderPostMqlTouchLanes,
  wirePostMqlLaneTooltips,
} from "/shared/touch-lanes-ui.mjs";
import { initPostMqlKpiTooltips } from "/shared/post-mql-kpi-tooltip.mjs";
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
const OUTREACH_VISIBLE_LIMIT = 25;
const HIGH_INTENT_FRAGMENTS = ["pricing", "book-a-demo", "book-demo", "free-trial", "/demo"];

const els = {
  mqlList: document.getElementById("mqlList"),
  search: document.getElementById("search"),
  listMeta: document.getElementById("listMeta"),
  journeyEmpty: document.getElementById("journeyEmpty"),
  journeyContent: document.getElementById("journeyContent"),
  leadHeader: document.getElementById("leadHeader"),
  summaryCards: document.getElementById("summaryCards"),
  touchJourneyHint: document.getElementById("touchJourneyHint"),
  journeyPriorityPills: document.getElementById("journeyPriorityPills"),
  postTouchLanes: document.getElementById("postTouchLanes"),
  postLaneTooltip: document.getElementById("postLaneTooltip"),
  chartLowActivityNote: document.getElementById("chartLowActivityNote"),
  mqlMarkerDate: document.getElementById("mqlMarkerDate"),
  latestMarker: document.getElementById("latestMarker"),
  latestMarkerDate: document.getElementById("latestMarkerDate"),
  latestRailLine: document.getElementById("latestRailLine"),
  journeyInsight: document.getElementById("journeyInsight"),
  journeyOutcome: document.getElementById("journeyOutcome"),
  journeyInsightBullets: document.getElementById("journeyInsightBullets"),
  timeline: document.getElementById("timeline"),
  timelineEmpty: document.getElementById("timelineEmpty"),
  headerStats: document.getElementById("headerStats"),
  statContacts: document.getElementById("statContacts"),
  statReturns: document.getElementById("statReturns"),
  statPageViews: document.getElementById("statPageViews"),
  statAvgReturns: document.getElementById("statAvgReturns"),
  statHighIntent: document.getElementById("statHighIntent"),
  statOutreach: document.getElementById("statOutreach"),
  topPagesList: document.getElementById("topPagesList"),
  topPagesListMore: document.getElementById("topPagesListMore"),
  leadStatusList: document.getElementById("leadStatusList"),
  leadStatusListMore: document.getElementById("leadStatusListMore"),
  segmentList: document.getElementById("segmentList"),
  segmentListMore: document.getElementById("segmentListMore"),
  regionList: document.getElementById("regionList"),
  regionListMore: document.getElementById("regionListMore"),
  ownerList: document.getElementById("ownerList"),
  ownerListMore: document.getElementById("ownerListMore"),
  highIntentPagesList: document.getElementById("highIntentPagesList"),
  highIntentPagesListMore: document.getElementById("highIntentPagesListMore"),
  outreachList: document.getElementById("outreachList"),
  outreachSummary: document.getElementById("outreachSummary"),
  outreachHelper: document.getElementById("outreachHelper"),
  outreachScrollCue: document.getElementById("outreachScrollCue"),
  outreachShowAll: document.getElementById("outreachShowAll"),
  insightsFilterNote: document.getElementById("insightsFilterNote"),
  pageFilterBanner: document.getElementById("pageFilterBanner"),
  pageFilterLabel: document.getElementById("pageFilterLabel"),
  pageFilterClear: document.getElementById("pageFilterClear"),
  filterStatus: document.getElementById("filterStatus"),
  filterRegion: document.getElementById("filterRegion"),
  filterSegment: document.getElementById("filterSegment"),
  filterOwner: document.getElementById("filterOwner"),
  filterScore: document.getElementById("filterScore"),
  filterPage: document.getElementById("filterPage"),
  filterMqlFrom: document.getElementById("filterMqlFrom"),
  filterMqlTo: document.getElementById("filterMqlTo"),
  filterReturnFrom: document.getElementById("filterReturnFrom"),
  filterReturnTo: document.getElementById("filterReturnTo"),
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
  validationFilterDebug: document.getElementById("validationFilterDebug"),
  validationScoreNotes: document.getElementById("validationScoreNotes"),
};

const state = {
  mqls: [],
  selectedId: null,
  topPages: [],
  breakdowns: { leadStatus: [], segment: [], owner: [], region: [] },
  regionMeta: null,
  outreachData: {
    immediate: [],
    mqlIds: [],
    assumptions: [],
    counts: { immediate: 0 },
    threshold: OUTREACH_THRESHOLD,
  },
  listFilter: null,
  chipFilters: new Set(),
  filters: {
    region: "",
    segment: "",
    status: "",
    owner: "",
    score: "",
    page: "",
    mqlFrom: "",
    mqlTo: "",
    returnFrom: "",
    returnTo: "",
  },
  outreachExpanded: false,
  insightsExpanded: {
    pages: false,
    highIntent: false,
    status: false,
    segment: false,
    region: false,
    owner: false,
  },
};

let hidePostLaneTooltips = () => {};

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

function emailDomain(email) {
  const parts = (email || "").split("@");
  return parts.length > 1 ? parts[1] : "";
}

function contactIdentityLine(mql) {
  const account = emailDomain(mql?.email);
  const parts = [];
  if (account) parts.push(account);
  if (mql?.region && mql.region !== "Unknown region") parts.push(mql.region);
  if (mql?.mainSegment) parts.push(displayMeta(mql.mainSegment));
  if (mql?.mainOwnerName) parts.push(`Owner: ${displayMeta(mql.mainOwnerName)}`);
  return parts.join(" · ");
}

function priorityLabel(mql) {
  const score = mql?.priorityScore ?? 0;
  if (score >= OUTREACH_THRESHOLD) return "Immediate";
  if (score >= 38) return "Soon";
  return "Watch";
}

function insightAction(score) {
  if (score >= 80) return "SDR follow-up today";
  if (score >= OUTREACH_THRESHOLD) return "prioritize outreach this week";
  return null;
}

function buildOutreachReasons(lead) {
  const reasons = [];
  if ((lead.returnVisitCount ?? 0) > 0) {
    const n = lead.returnVisitCount;
    reasons.push(`${n} return visit${n === 1 ? "" : "s"} after MQL`);
  }
  const intentPage = (lead.highIntentPages ?? [])[0];
  if (intentPage) {
    reasons.push(`Visited ${intentPage}`);
  } else if ((lead.reasons ?? []).some((r) => /high-intent/i.test(r))) {
    reasons.push("Visited high-intent pages");
  }
  if (lead.leadStatus) {
    reasons.push(`Current status: ${lead.leadStatus}`);
  }
  return reasons.slice(0, 3);
}

function pathIsHighIntent(path) {
  const p = (path || "").toLowerCase();
  return HIGH_INTENT_FRAGMENTS.some((frag) => p.includes(frag));
}

function scoreBand(m) {
  const s = m.priorityScore ?? 0;
  if (s >= OUTREACH_THRESHOLD) return "immediate";
  if (s >= 38) return "soon";
  return "watch";
}

function suggestedAction(score) {
  if (score >= 80) return "SDR follow-up today";
  if (score >= OUTREACH_THRESHOLD) return "Prioritize outreach this week";
  return "Monitor return activity";
}

function priorityClass(score) {
  if (score >= 80) return "priority-high";
  if (score >= OUTREACH_THRESHOLD) return "priority-medium";
  return "priority-normal";
}

function isDiscoveryStatus(status) {
  return (status || "").trim() === "Discovery Call";
}

function hasPricingCategory(m) {
  return (m.pageCategories ?? []).includes("pricing");
}

function duplicateEmailMap(mqls) {
  const byEmail = new Map();
  for (const m of mqls) {
    const key = (m.email || "").toLowerCase();
    if (!byEmail.has(key)) byEmail.set(key, []);
    byEmail.get(key).push(m.id);
  }
  const dupes = new Set();
  for (const ids of byEmail.values()) {
    if (ids.length > 1) ids.forEach((id) => dupes.add(id));
  }
  return dupes;
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

function normalizeFilterValue(value) {
  const v = String(value ?? "").trim();
  return v;
}

function contactRegion(m) {
  const v = String(m?.region ?? "").trim();
  return v || "Unknown region";
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
  state.filters.page = normalizeFilterValue(els.filterPage?.value);
  state.filters.mqlFrom = normalizeFilterValue(els.filterMqlFrom?.value);
  state.filters.mqlTo = normalizeFilterValue(els.filterMqlTo?.value);
  state.filters.returnFrom = normalizeFilterValue(els.filterReturnFrom?.value);
  state.filters.returnTo = normalizeFilterValue(els.filterReturnTo?.value);
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
  syncSelectFilter(els.filterPage, "page");
  const datePairs = [
    [els.filterMqlFrom, "mqlFrom"],
    [els.filterMqlTo, "mqlTo"],
    [els.filterReturnFrom, "returnFrom"],
    [els.filterReturnTo, "returnTo"],
  ];
  for (const [el, key] of datePairs) {
    if (!el) continue;
    const value = normalizeFilterValue(state.filters[key]);
    el.value = value;
    state.filters[key] = value;
  }
}

function getDimensionFilters() {
  return {
    region: normalizeFilterValue(state.filters.region),
    segment: normalizeFilterValue(state.filters.segment),
    status: normalizeFilterValue(state.filters.status),
    owner: normalizeFilterValue(state.filters.owner),
    score: normalizeFilterValue(state.filters.score),
    page: normalizeFilterValue(state.filters.page),
    mqlFrom: normalizeFilterValue(state.filters.mqlFrom),
    mqlTo: normalizeFilterValue(state.filters.mqlTo),
    returnFrom: normalizeFilterValue(state.filters.returnFrom),
    returnTo: normalizeFilterValue(state.filters.returnTo),
  };
}

function passesDimensionFilters(m, dim) {
  if (dim.region && contactRegion(m) !== dim.region) return false;
  if (dim.segment && String(m.mainSegment ?? "").trim() !== dim.segment) return false;
  if (dim.status && String(m.leadStatus ?? "").trim() !== dim.status) return false;
  if (dim.owner && String(m.mainOwnerName ?? "").trim() !== dim.owner) return false;
  if (dim.mqlFrom || dim.mqlTo) {
    if (!dateInRange(m.mqlDate, dim.mqlFrom, dim.mqlTo)) return false;
  }
  if (dim.returnFrom || dim.returnTo) {
    if (!dateInRange(m.lastReturn, dim.returnFrom, dim.returnTo)) return false;
  }
  if (dim.score) {
    const band = scoreBand(m);
    if (dim.score !== band) return false;
  }
  if (dim.page) {
    if (!(m.pageCategories ?? []).includes(dim.page)) return false;
  }
  if (state.chipFilters.has("high-intent") && !m.highIntentReturn) return false;
  if (state.chipFilters.has("outreach") && (m.priorityScore ?? 0) < OUTREACH_THRESHOLD) {
    return false;
  }
  if (state.chipFilters.has("returned") && (m.returnVisitCount ?? 0) === 0) {
    return false;
  }
  return true;
}

function getFilteredMqls() {
  const dim = getDimensionFilters();
  let list = state.mqls.filter((m) => passesDimensionFilters(m, dim));
  if (state.listFilter) {
    list = list.filter((m) => state.listFilter.mqlIds.has(m.id));
  }
  const q = els.search.value.trim().toLowerCase();
  if (q) list = list.filter((m) => m.email.toLowerCase().includes(q));
  return list;
}

function filteredIdSet() {
  return new Set(getFilteredMqls().map((m) => m.id));
}

function filterBreakdownRows(items, allowedIds, limit = 20) {
  return items
    .map((item) => {
      const mqlIds = (item.mqlIds ?? []).filter((id) => allowedIds.has(id));
      return { ...item, mqlIds, count: mqlIds.length };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function filterTopPages(pages, allowedIds) {
  return pages
    .map((p) => {
      const mqlIds = (p.mqlIds ?? []).filter((id) => allowedIds.has(id));
      const views = mqlIds.length
        ? Math.round((p.views * mqlIds.length) / Math.max(p.mqlIds.length, 1))
        : 0;
      return {
        ...p,
        mqlIds,
        uniqueMqls: mqlIds.length,
        views: views || p.views,
      };
    })
    .filter((p) => p.uniqueMqls > 0)
    .sort((a, b) => b.views - a.views || b.uniqueMqls - a.uniqueMqls);
}

function filterHighIntentPages(pages, allowedIds) {
  return filterTopPages(pages, allowedIds).filter((p) => pathIsHighIntent(p.path));
}

function renderPostMqlInsightCard(container, moreBtn, expandKey, items, kind, totalContacts) {
  if (!container) return;
  if (!items?.length) {
    container.innerHTML = `<div class="filter-insight-empty">No data for current filters</div>`;
    if (moreBtn) moreBtn.hidden = true;
    return;
  }

  const expanded = state.insightsExpanded[expandKey];
  const limit = expanded ? Math.min(items.length, 12) : 5;
  const visible = items.slice(0, limit);
  const maxCount = visible[0]?.count ?? 1;

  container.innerHTML = visible
    .map((item, i) => {
      const active = isInsightRowActive(kind, item.label) ? " is-filter-active" : "";
      const pct =
        totalContacts > 0 ? Math.round((item.count / totalContacts) * 100) : 0;
      const barPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      return `
        <button
          type="button"
          class="filter-insight-row${active}"
          data-kind="${escapeHtml(kind)}"
          data-key="${escapeHtml(item.label)}"
        >
          <span class="filter-insight-rank">${i + 1}</span>
          <div class="filter-insight-main">
            <div class="filter-insight-row-head">
              <span class="filter-insight-name" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
              <span class="filter-insight-count">${fmtNum(item.count)} contact${item.count === 1 ? "" : "s"}${pct > 0 ? ` · ${pct}%` : ""}</span>
            </div>
            <div class="filter-insight-bar" aria-hidden="true">
              <span style="width:${barPct.toFixed(1)}%"></span>
            </div>
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
      const match = items.find((x) => x.label === key);
      if (match && kindAttr) {
        if (kindAttr === "page") {
          setListFilter(
            kindAttr,
            key,
            `${fmtNum(match.count)} contact${match.count === 1 ? "" : "s"} · ${key}`,
            match.mqlIds,
          );
        } else {
          applyDimensionFilter(kindAttr, key);
        }
      }
    });
  });
}

function renderPostMqlPagesCard(container, moreBtn, expandKey, pages, totalContacts) {
  if (!container) return;
  if (!pages?.length) {
    container.innerHTML = `<div class="filter-insight-empty">No page views for current filters</div>`;
    if (moreBtn) moreBtn.hidden = true;
    return;
  }

  const expanded = state.insightsExpanded[expandKey];
  const limit = expanded ? Math.min(pages.length, 12) : 5;
  const visible = pages.slice(0, limit);
  const maxViews = visible[0]?.views ?? 1;

  container.innerHTML = visible
    .map((p, i) => {
      const active = isFilterActive("page", p.path) ? " is-filter-active" : "";
      const pct =
        totalContacts > 0 ? Math.round((p.uniqueMqls / totalContacts) * 100) : 0;
      const barPct = maxViews > 0 ? (p.views / maxViews) * 100 : 0;
      const label = p.title && p.title !== p.path ? p.title : p.path;
      return `
        <button
          type="button"
          class="filter-insight-row${active}"
          data-path="${escapeHtml(p.path)}"
        >
          <span class="filter-insight-rank">${i + 1}</span>
          <div class="filter-insight-main">
            <div class="filter-insight-row-head">
              <span class="filter-insight-name" title="${escapeHtml(p.path)}">${escapeHtml(label)}</span>
              <span class="filter-insight-count">${fmtNum(p.views)} views · ${fmtNum(p.uniqueMqls)} contact${p.uniqueMqls === 1 ? "" : "s"}${pct > 0 ? ` · ${pct}%` : ""}</span>
            </div>
            <div class="filter-insight-bar" aria-hidden="true">
              <span style="width:${barPct.toFixed(1)}%"></span>
            </div>
          </div>
        </button>`;
    })
    .join("");

  if (moreBtn) {
    moreBtn.hidden = pages.length <= 5;
    moreBtn.textContent = expanded ? "Show less" : "View all";
    moreBtn.onclick = () => {
      state.insightsExpanded[expandKey] = !state.insightsExpanded[expandKey];
      renderInsights();
    };
  }

  container.querySelectorAll(".filter-insight-row").forEach((row) => {
    row.addEventListener("click", () => {
      const path = row.dataset.path;
      const page = pages.find((p) => p.path === path);
      if (page) {
        setListFilter(
          "page",
          path,
          `${fmtNum(page.uniqueMqls)} contact${page.uniqueMqls === 1 ? "" : "s"} visited ${path}`,
          page.mqlIds,
        );
      }
    });
  });
}

function updateKpis() {
  const list = getFilteredMqls();
  const returningContacts = list.filter((m) => (m.returnVisitCount ?? 0) > 0);
  const totalReturns = list.reduce((n, m) => n + (m.returnVisitCount ?? 0), 0);
  const totalPageViews = list.reduce((n, m) => n + (m.returnPageViewCount ?? 0), 0);
  const highIntent = list.filter((m) => m.highIntentReturn).length;
  const immediate = list.filter((m) => (m.priorityScore ?? 0) >= OUTREACH_THRESHOLD).length;

  els.statContacts.textContent = fmtNum(returningContacts.length);
  els.statReturns.textContent = fmtNum(totalReturns);
  els.statPageViews.textContent = fmtNum(totalPageViews);
  els.statAvgReturns.textContent =
    returningContacts.length > 0
      ? fmtNum(totalReturns / returningContacts.length, 1)
      : "—";
  els.statHighIntent.textContent = fmtNum(highIntent);
  els.statOutreach.textContent = fmtNum(immediate);
  els.headerStats.hidden = false;
}

function buildContactPills(m) {
  const pills = [];
  if (m.highIntentReturn) pills.push(`<span class="postmql-pill postmql-pill--intent">High intent</span>`);
  if (isDiscoveryStatus(m.leadStatus)) {
    pills.push(`<span class="postmql-pill postmql-pill--discovery">Discovery Call</span>`);
  }
  if (hasPricingCategory(m)) {
    pills.push(`<span class="postmql-pill postmql-pill--pricing">Pricing visit</span>`);
  }
  if ((m.priorityScore ?? 0) >= OUTREACH_THRESHOLD) {
    pills.push(`<span class="postmql-pill postmql-pill--outreach">Needs outreach</span>`);
  }
  if (!pills.length && (m.returnVisitCount ?? 0) === 0) {
    pills.push(`<span class="postmql-pill postmql-pill--neutral">No returns yet</span>`);
  }
  return pills.join("");
}

function buildJourneyPriorityPills(mql) {
  if (!mql) return "";
  const pills = [];
  const score = mql.priorityScore ?? 0;
  if (score >= OUTREACH_THRESHOLD) {
    pills.push(
      `<span class="postmql-journey-pill postmql-journey-pill--outreach">${escapeHtml(priorityLabel(mql))} · ${escapeHtml(INTENT_SCORE_LABEL)} ${fmtNum(score)}</span>`,
    );
  } else if (score >= 38) {
    pills.push(
      `<span class="postmql-journey-pill">${escapeHtml(priorityLabel(mql))} · ${escapeHtml(INTENT_SCORE_LABEL)} ${fmtNum(score)}</span>`,
    );
  }
  if (mql.highIntentReturn) {
    pills.push(`<span class="postmql-journey-pill postmql-journey-pill--intent">High intent</span>`);
  }
  return pills.join("");
}

function updateJourneyPriorityPills(mql) {
  if (!els.journeyPriorityPills) return;
  const html = buildJourneyPriorityPills(mql);
  if (html) {
    els.journeyPriorityPills.innerHTML = html;
    els.journeyPriorityPills.hidden = false;
  } else {
    els.journeyPriorityPills.innerHTML = "";
    els.journeyPriorityPills.hidden = true;
  }
}

function renderListMeta(filteredCount, dim) {
  if (!filteredCount) {
    els.listMeta.innerHTML =
      `<div class="sidebar-stats-hint">No returning MQL contacts match the selected filters.</div>`;
    return;
  }
  const count = `${fmtNum(filteredCount)} contact${filteredCount === 1 ? "" : "s"}`;
  const hintParts = [];
  if (dim.region) hintParts.push(`Region: ${dim.region}`);
  if (dim.segment) hintParts.push(`Segment: ${dim.segment}`);
  hintParts.push("Sorted by return activity");
  els.listMeta.innerHTML = `
    <div class="sidebar-stats-count">${escapeHtml(count)}</div>
    <div class="sidebar-stats-hint">${escapeHtml(hintParts.join(" · "))}</div>`;
}

function renderList() {
  const filtered = getFilteredMqls();
  const dim = getDimensionFilters();
  const dupes = duplicateEmailMap(state.mqls);

  renderListMeta(filtered.length, dim);

  if (!filtered.length) {
    els.mqlList.innerHTML =
      `<li class="mql-list-empty-filter">No returning MQL contacts match the selected filters.</li>`;
    return;
  }

  const sorted = [...filtered].sort(
    (a, b) =>
      (b.priorityScore ?? 0) - (a.priorityScore ?? 0) ||
      (b.returnVisitCount ?? 0) - (a.returnVisitCount ?? 0) ||
      new Date(b.mqlDate) - new Date(a.mqlDate),
  );

  els.mqlList.innerHTML = sorted
    .map((m) => {
      const dupNote = dupes.has(m.id)
        ? `<span class="postmql-dup-note">Multiple MQL journeys</span>`
        : "";
      const ownerPart = m.mainOwnerName
        ? `Owner: ${displayMeta(m.mainOwnerName)}`
        : "";
      const metaParts = [];
      const scoreLine = scorePairInline(m.lastCombinedScore, m.priorityScore);
      if (scoreLine) metaParts.push(scoreLine);
      metaParts.push(displayMeta(m.leadStatus));
      if (ownerPart) metaParts.push(ownerPart);
      return `
        <li>
          <button
            type="button"
            class="mql-item"
            role="option"
            aria-selected="${m.id === state.selectedId}"
            data-id="${escapeHtml(m.id)}"
            title="${escapeHtml(m.email)}"
          >
            <span class="mql-item-email" title="${escapeHtml(m.email)}">${escapeHtml(m.email)}</span>
            <span class="mql-item-row mql-item-stat">
              MQL ${formatDateShort(m.mqlDate)} · ${m.returnVisitCount ?? 0} return${(m.returnVisitCount ?? 0) === 1 ? "" : "s"}
            </span>
            <span class="mql-item-row">
              ${escapeHtml(metaParts.join(" · "))}
            </span>
            <span class="postmql-pills">${buildContactPills(m)}</span>
            ${dupNote}
          </button>
        </li>`;
    })
    .join("");

  els.mqlList.querySelectorAll(".mql-item").forEach((btn) => {
    btn.addEventListener("click", () => selectMql(btn.dataset.id));
  });
}

function renderSummaryCards(mql, journey, visits) {
  const highestIntent = findHighestIntentPage(journey);
  const intentReason =
    mql.highIntentReturn && highestIntent
      ? `Visited ${highestIntent}`
      : null;
  const intentScore = formatIntentScore(mql.priorityScore);
  const fitScore = formatFitScore(mql.lastCombinedScore);

  els.summaryCards.innerHTML = `
    <div class="postmql-summary-card">
      <h4>MQL start</h4>
      <dl>
        <div><dt>MQL date</dt><dd>${formatDateShort(journey.mqlDate)}</dd></div>
        <div><dt>Lead status</dt><dd>${escapeHtml(displayMeta(mql.leadStatus))}</dd></div>
      </dl>
    </div>
    <div class="postmql-summary-card">
      <h4>Post-MQL activity</h4>
      <dl>
        <div><dt>Return visits</dt><dd>${fmtNum(visits.length)}</dd></div>
        <div><dt>Page views</dt><dd>${fmtNum(journey.returnPageViewCount ?? 0)}</dd></div>
        <div><dt>Latest return</dt><dd>${mql.lastReturn ? formatDateShort(mql.lastReturn) : "—"}</dd></div>
      </dl>
    </div>
    <div class="postmql-summary-card postmql-summary-card--intent">
      <h4>Intent signal</h4>
      <dl>
        <div><dt>Priority</dt><dd>${escapeHtml(priorityLabel(mql))}</dd></div>
        ${
          intentScore
            ? `<div><dt>${escapeHtml(INTENT_SCORE_LABEL)}</dt><dd class="score-value" title="${escapeHtml(INTENT_SCORE_TOOLTIP)}">${escapeHtml(intentScore)}</dd></div>`
            : ""
        }
        ${
          intentReason
            ? `<div class="postmql-summary-reason"><dt>Reason</dt><dd class="intent-reason">${escapeHtml(intentReason)}</dd></div>`
            : `<div class="postmql-summary-reason postmql-summary-reason--empty" aria-hidden="true"><dt>Reason</dt><dd>—</dd></div>`
        }
        ${
          fitScore
            ? `<div><dt>${escapeHtml(FIT_SCORE_LABEL)}</dt><dd title="${escapeHtml(FIT_SCORE_TOOLTIP)}">${escapeHtml(fitScore)}</dd></div>`
            : ""
        }
      </dl>
    </div>`;
}

function findHighestIntentPage(journey) {
  let best = null;
  for (const visit of journey.visits ?? []) {
    for (const page of visit.pages ?? []) {
      if (pathIsHighIntent(page.path)) {
        const label = page.title?.trim() || page.path;
        if (!best) best = label;
      }
    }
  }
  if (best) return best;
  const lanes = journey.touchLanes ?? [];
  if (lanes.length) return lanes[0].label || lanes[0].source;
  return null;
}

function renderJourneyInsight(mql, journey, visits) {
  const pageViews = journey.returnPageViewCount ?? 0;
  const uniquePages = journey.touchLanes?.length ?? 0;
  const bullets = [];

  if (visits.length > 0) {
    els.journeyOutcome.textContent = `After becoming MQL, this contact returned ${fmtNum(visits.length)} time${visits.length === 1 ? "" : "s"} and viewed ${fmtNum(pageViews)} page${pageViews === 1 ? "" : "s"} across ${fmtNum(uniquePages)} URL${uniquePages === 1 ? "" : "s"}.`;
  } else {
    els.journeyOutcome.textContent = `This contact became MQL on ${formatDateShort(journey.mqlDate)} but has not returned to the website yet.`;
  }

  const intentPage = findHighestIntentPage(journey);
  if (intentPage && mql.highIntentReturn) {
    bullets.push(`<li>High intent: visited ${escapeHtml(intentPage)} after MQL</li>`);
  }
  if (visits.length >= 2) {
    bullets.push(`<li>Repeated engagement: ${visits.length} return visits after MQL</li>`);
  } else if (visits.length === 1) {
    bullets.push(`<li>Return engagement: 1 post-MQL session recorded</li>`);
  }
  if (mql.lastReturn) {
    bullets.push(`<li>Latest return: ${escapeHtml(formatDateShort(mql.lastReturn))}</li>`);
  }
  const action = insightAction(mql.priorityScore ?? 0);
  if (action) {
    bullets.push(`<li>Recommended action: ${escapeHtml(action)}</li>`);
  }
  if (mql.leadStatus) {
    bullets.push(`<li>Current status: ${escapeHtml(displayMeta(mql.leadStatus))}</li>`);
  }
  const scoreLine = scorePairInline(mql.lastCombinedScore, mql.priorityScore);
  if (scoreLine) {
    bullets.push(`<li>${escapeHtml(scoreLine)}</li>`);
  }

  els.journeyInsightBullets.innerHTML = bullets.join("");
  els.journeyInsight.hidden = bullets.length === 0 && visits.length === 0;
}

function renderTimeline(visits, highlightPath) {
  if (!visits.length) {
    els.timeline.hidden = true;
    els.timelineEmpty.hidden = false;
    els.timelineEmpty.textContent =
      "No return visits recorded after MQL for this contact.";
    return;
  }

  els.timeline.hidden = false;
  els.timelineEmpty.hidden = true;

  els.timeline.innerHTML = visits
    .map((visit, i) => {
      const pages = visit.pages ?? [];
      const topPage =
        pages.find((p) => pathIsHighIntent(p.path)) ||
        pages[0];
      const topLabel = topPage
        ? topPage.title?.trim() || topPage.path
        : "—";
      const pageRows = pages
        .map((p) => {
          const hit = highlightPath && p.path === highlightPath;
          return `<li class="${hit ? "page-row-highlight" : ""}">
            <span class="page-path">${escapeHtml(p.path)}</span>
            <span class="page-time">${formatDate(p.viewedAt)}</span>
          </li>`;
        })
        .join("");

      return `
        <article class="postmql-visit" data-visit="${i}">
          <div class="postmql-visit-headline">Return visit ${i + 1} · ${fmtNum(pages.length)} page${pages.length === 1 ? "" : "s"} · ${formatDateShort(visit.returnedAt)}</div>
          <div class="postmql-visit-signal">Top signal: ${escapeHtml(topLabel)}</div>
          <button type="button" class="postmql-visit-toggle" data-visit-toggle="${i}">Show pages</button>
          <ul class="postmql-visit-pages" id="visitPages-${i}">${pageRows}</ul>
        </article>`;
    })
    .join("");

  els.timeline.querySelectorAll("[data-visit-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.visitToggle;
      const list = document.getElementById(`visitPages-${idx}`);
      const open = list?.classList.toggle("is-open");
      btn.textContent = open ? "Hide pages" : "Show pages";
    });
  });
}

function renderOutreachQueue() {
  const allowed = filteredIdSet();
  const { threshold } = state.outreachData;
  let queue = state.outreachData.immediate.filter((l) => allowed.has(l.id));
  queue = queue.sort((a, b) => b.priorityScore - a.priorityScore);

  const totalImmediate = state.mqls.filter(
    (m) => allowed.has(m.id) && (m.priorityScore ?? 0) >= threshold,
  ).length;

  els.outreachSummary.textContent = `${fmtNum(totalImmediate)} contact${totalImmediate === 1 ? "" : "s"} showing strong post-MQL intent`;
  els.outreachHelper.textContent = `${INTENT_SCORE_LABEL} ≥ ${threshold} · Sorted by priority`;

  const displayLimit = state.outreachExpanded
    ? queue.length
    : Math.min(OUTREACH_VISIBLE_LIMIT, queue.length);
  const shown = queue.slice(0, displayLimit);

  if (!shown.length) {
    els.outreachList.innerHTML =
      `<p class="premql-empty">No contacts in the outreach queue for current filters.</p>`;
    els.outreachShowAll.hidden = true;
    if (els.outreachScrollCue) {
      els.outreachScrollCue.textContent = "";
      els.outreachScrollCue.hidden = true;
    }
    return;
  }

  if (els.outreachScrollCue) {
    els.outreachScrollCue.textContent = `Showing top ${fmtNum(shown.length)} of ${fmtNum(totalImmediate)}`;
    els.outreachScrollCue.hidden = false;
  }

  els.outreachList.innerHTML = shown
    .map((lead) => {
      const reasons = buildOutreachReasons(lead)
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join("");
      const account = emailDomain(lead.email);
      const mqlMeta = state.mqls.find((m) => m.id === lead.id);
      const region = mqlMeta?.region;
      const regionPill =
        region && region !== "Unknown region"
          ? `<span class="postmql-pill postmql-pill--region">${escapeHtml(region)}</span>`
          : "";
      const metaLines = [];
      if (account) {
        metaLines.push(
          `<span class="postmql-outreach-meta-line" title="Account: ${escapeHtml(account)}">Account: ${escapeHtml(account)}</span>`,
        );
      }
      if (regionPill) {
        metaLines.push(`<span class="postmql-outreach-meta-line postmql-outreach-meta-pills">${regionPill}</span>`);
      }
      if (lead.mainOwnerName) {
        metaLines.push(
          `<span class="postmql-outreach-meta-line">Owner: ${escapeHtml(displayMeta(lead.mainOwnerName))}</span>`,
        );
      }
      const fitScore = formatFitScore(lead.lastCombinedScore);
      if (fitScore) {
        metaLines.push(
          `<span class="postmql-outreach-meta-line" title="${escapeHtml(FIT_SCORE_TOOLTIP)}">${escapeHtml(FIT_SCORE_LABEL)}: ${escapeHtml(fitScore)}</span>`,
        );
      }
      const selected = state.selectedId === lead.id;
      return `
        <button
          type="button"
          class="postmql-outreach-card ${priorityClass(lead.priorityScore)}${selected ? " is-selected" : ""}"
          data-id="${escapeHtml(lead.id)}"
        >
          <div class="postmql-outreach-card-head">
            <span class="postmql-outreach-email" title="${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</span>
            <span class="postmql-outreach-score" title="${escapeHtml(INTENT_SCORE_TOOLTIP)}">${escapeHtml(INTENT_SCORE_LABEL)}: ${fmtNum(lead.priorityScore)}</span>
          </div>
          ${metaLines.length ? `<div class="postmql-outreach-meta">${metaLines.join("")}</div>` : ""}
          <ul class="postmql-outreach-reasons">${reasons}</ul>
          <div class="postmql-outreach-action">Suggested: ${escapeHtml(suggestedAction(lead.priorityScore))}</div>
        </button>`;
    })
    .join("");

  els.outreachList.querySelectorAll(".postmql-outreach-card").forEach((btn) => {
    btn.addEventListener("click", () => selectMql(btn.dataset.id));
  });

  els.outreachShowAll.hidden = queue.length <= OUTREACH_VISIBLE_LIMIT;
  els.outreachShowAll.textContent = `Show all ${fmtNum(totalImmediate)}`;
}

function isFilterActive(kind, key) {
  return state.listFilter?.kind === kind && state.listFilter?.key === key;
}

function isDimensionFilterActive(kind, key) {
  const dim = getDimensionFilters();
  if (kind === "region") return dim.region === key;
  if (kind === "segment") return dim.segment === key;
  if (kind === "leadStatus") return dim.status === key;
  if (kind === "owner") return dim.owner === key;
  return false;
}

function isInsightRowActive(kind, key) {
  if (kind === "page") return isFilterActive("page", key);
  return isDimensionFilterActive(kind, key);
}

function applyDimensionFilter(kind, key) {
  clearListFilter({ rerender: false });
  const value = normalizeFilterValue(key);
  if (kind === "region") state.filters.region = value;
  else if (kind === "segment") state.filters.segment = value;
  else if (kind === "leadStatus") state.filters.status = value;
  else if (kind === "owner") state.filters.owner = value;
  syncFiltersToDom();
  updateRegionChip();
  renderAll();
}

function setListFilter(kind, key, bannerText, mqlIds) {
  state.listFilter = {
    kind,
    key,
    label: bannerText,
    mqlIds: new Set(mqlIds),
  };
  els.search.value = "";
  els.pageFilterLabel.textContent = bannerText;
  els.pageFilterBanner.hidden = false;
  renderAll();
  if (mqlIds.length > 0) selectMql(mqlIds[0]);
}

function clearListFilter({ rerender = true } = {}) {
  state.listFilter = null;
  els.pageFilterBanner.hidden = true;
  if (rerender) renderAll();
}

function onDimensionFilterChange() {
  readFiltersFromDom();
  clearListFilter({ rerender: false });
  updateRegionChip();
  renderAll();
}

function renderInsights() {
  const allowed = filteredIdSet();
  const filtered = getFilteredMqls();
  const totalContacts = filtered.length;
  els.insightsFilterNote.textContent = `${fmtNum(totalContacts)} contact${totalContacts === 1 ? "" : "s"} in current filter`;

  renderPostMqlPagesCard(
    els.topPagesList,
    els.topPagesListMore,
    "pages",
    filterTopPages(state.topPages, allowed),
    totalContacts,
  );
  renderPostMqlPagesCard(
    els.highIntentPagesList,
    els.highIntentPagesListMore,
    "highIntent",
    filterHighIntentPages(state.topPages, allowed),
    totalContacts,
  );
  renderPostMqlInsightCard(
    els.leadStatusList,
    els.leadStatusListMore,
    "status",
    filterBreakdownRows(state.breakdowns.leadStatus, allowed),
    "leadStatus",
    totalContacts,
  );
  renderPostMqlInsightCard(
    els.segmentList,
    els.segmentListMore,
    "segment",
    filterBreakdownRows(state.breakdowns.segment, allowed),
    "segment",
    totalContacts,
  );
  renderPostMqlInsightCard(
    els.regionList,
    els.regionListMore,
    "region",
    filterBreakdownRows(state.breakdowns.region, allowed),
    "region",
    totalContacts,
  );
  renderPostMqlInsightCard(
    els.ownerList,
    els.ownerListMore,
    "owner",
    filterBreakdownRows(state.breakdowns.owner, allowed),
    "owner",
    totalContacts,
  );
}

function populateFilterOptions() {
  const statuses = new Set();
  const segments = new Set();
  const owners = new Set();
  const regions = new Set();
  const categories = new Set();
  for (const m of state.mqls) {
    if (m.leadStatus) statuses.add(String(m.leadStatus).trim());
    if (m.mainSegment) segments.add(String(m.mainSegment).trim());
    if (m.mainOwnerName) owners.add(String(m.mainOwnerName).trim());
    if (m.region) regions.add(contactRegion(m));
    for (const c of m.pageCategories ?? []) categories.add(c);
  }

  const fill = (select, values, allLabel) => {
    const current = select === els.filterRegion
      ? state.filters.region
      : select === els.filterSegment
        ? state.filters.segment
        : select === els.filterStatus
          ? state.filters.status
          : select === els.filterOwner
            ? state.filters.owner
            : select === els.filterPage
              ? state.filters.page
              : select.value;
    select.innerHTML = `<option value="">${allLabel}</option>`;
    for (const v of values) {
      if (!v || v === "—") continue;
      select.innerHTML += `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`;
    }
    if (current) ensureSelectOption(select, current);
    select.value = current || "";
  };

  const regionOrder = [
    "United States",
    "Canada",
    "LATAM",
    "UKI & ROW",
    "NEB / Iberia",
    "DACH",
    "IL & CEE",
    "APJ",
    "Unknown region",
  ];
  const orderedRegions = regionOrder.filter((r) => regions.has(r));
  for (const r of [...regions].sort()) {
    if (!orderedRegions.includes(r)) orderedRegions.push(r);
  }
  fill(els.filterRegion, orderedRegions, "All regions");
  fill(els.filterStatus, [...statuses].sort(), "All statuses");
  fill(els.filterSegment, [...segments].sort(), "All segments");
  fill(els.filterOwner, [...owners].sort(), "All owners");
  fill(els.filterPage, [...categories].sort(), "All pages");

  const scoreOpts = [
    ["", "All intent scores"],
    ["immediate", "Immediate (≥55)"],
    ["soon", "Soon (38–54)"],
    ["watch", "Watch (<38)"],
  ];
  els.filterScore.innerHTML = scoreOpts
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("");
  els.filterScore.value = state.filters.score || "";
  syncFiltersToDom();
}

function renderValidation() {
  const calcNotes = [
    "Post-MQL contacts are MQL journeys with return visit tracking in the export.",
    "Return visits are grouped into sessions using a 30-minute inactivity gap.",
    "Page views count only events after the MQL timestamp.",
    "High-intent pages match pricing, demo, trial, or /demo URL patterns.",
    `Dataset: ${fmtNum(state.mqls.length)} contacts loaded from CSV export.`,
  ];
  if (
    state.regionMeta?.method === "derived" ||
    state.regionMeta?.method === "mixed"
  ) {
    calcNotes.push(
      "Region is derived from country mapping because no native Region field exists in the source CSV.",
    );
  }
  els.validationCalcNotes.innerHTML = calcNotes
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join("");

  els.validationOutreachNotes.innerHTML = (state.outreachData.assumptions ?? [])
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  renderRegionValidation();
  renderFilterDebug();
  renderScoreValidationNotes();
}

function renderScoreValidationNotes() {
  if (!els.validationScoreNotes) return;
  const stats = scoreCoverageStats(state.mqls);
  els.validationScoreNotes.innerHTML = `
    <p><strong>${escapeHtml(FIT_SCORE_LABEL)}</strong> — source field <code>lastCombinedScore</code> (e.g. A1, B1, C1). ${escapeHtml(FIT_SCORE_TOOLTIP)}</p>
    <p><strong>${escapeHtml(INTENT_SCORE_LABEL)}</strong> — calculated field <code>priorityScore</code> from post-MQL outreach scoring. ${escapeHtml(INTENT_SCORE_TOOLTIP)}</p>
    <table class="validation-entity-table">
      <tbody>
        <tr><th scope="row">Contacts in list</th><td>${fmtNum(stats.total)}</td></tr>
        <tr><th scope="row">With fit score</th><td>${fmtNum(stats.withFit)}</td></tr>
        <tr><th scope="row">Missing fit score</th><td>${fmtNum(stats.missingFit)}</td></tr>
        <tr><th scope="row">With intent score</th><td>${fmtNum(stats.withIntent)}</td></tr>
        <tr><th scope="row">Missing intent score</th><td>${fmtNum(stats.missingIntent)}</td></tr>
        <tr><th scope="row">With both scores</th><td>${fmtNum(stats.withBoth)}</td></tr>
      </tbody>
    </table>`;
}

function regionFilterTooltip() {
  const derived =
    "Region is derived from country mapping because no native Region field exists in the source CSV. Use with Segment to create regional manager views.";
  const direct =
    "Filter returning MQL contacts by sales/marketing region. Use with Segment to create regional manager views.";
  const meta = state.regionMeta;
  if (!meta) return derived;
  if (meta.method === "derived" || meta.method === "mixed") return derived;
  return direct;
}

function scoreBandLabel(band) {
  if (band === "immediate") return "Immediate (≥55)";
  if (band === "soon") return "Soon (38–54)";
  if (band === "watch") return "Watch (<38)";
  return band;
}

function hasActiveFilters() {
  const dim = getDimensionFilters();
  return (
    Object.values(dim).some(Boolean) ||
    state.chipFilters.size > 0 ||
    !!state.listFilter
  );
}

function activeFilterSummaryParts(dim = getDimensionFilters()) {
  const parts = [];
  if (dim.region) parts.push(`Region = ${dim.region}`);
  if (dim.segment) parts.push(`Segment = ${dim.segment}`);
  if (dim.status) parts.push(`Lead status = ${dim.status}`);
  if (dim.owner) parts.push(`Owner = ${dim.owner}`);
  if (dim.score) parts.push(`Intent score band = ${scoreBandLabel(dim.score)}`);
  if (dim.page) parts.push(`Page category = ${dim.page}`);
  if (dim.mqlFrom || dim.mqlTo) {
    parts.push(`MQL date = ${dim.mqlFrom || "…"} – ${dim.mqlTo || "…"}`);
  }
  if (dim.returnFrom || dim.returnTo) {
    parts.push(`Latest return = ${dim.returnFrom || "…"} – ${dim.returnTo || "…"}`);
  }
  if (state.chipFilters.has("high-intent")) parts.push("High-intent only");
  if (state.chipFilters.has("outreach")) parts.push("Needs outreach");
  if (state.chipFilters.has("returned")) parts.push("Has returns");
  if (state.listFilter?.kind === "page" && normalizeFilterValue(state.listFilter.key)) {
    parts.push(`Page = ${state.listFilter.key}`);
  } else if (state.listFilter?.kind === "outreach") {
    parts.push("Outreach queue filter");
  } else if (normalizeFilterValue(state.listFilter?.label)) {
    parts.push(state.listFilter.label);
  }
  return parts;
}

function describeActiveFilters(dim) {
  const parts = activeFilterSummaryParts(dim);
  return parts.length ? parts.join(" · ") : "None";
}

function updateFilterAudienceSummary() {
  const parts = activeFilterSummaryParts();
  const active = parts.length > 0;
  const text = active ? `Viewing filtered audience: ${parts.join(" · ")}` : "";

  if (els.filterAudienceBar) {
    els.filterAudienceBar.hidden = !active;
    els.filterAudienceBar.classList.toggle("is-active", active);
  }
  if (els.filterAudienceSummary) {
    els.filterAudienceSummary.textContent = text;
    els.filterAudienceSummary.hidden = !active;
  }
  if (els.clearFiltersBtn) {
    els.clearFiltersBtn.hidden = !active;
  }
}

function topGlobalContactId() {
  const sorted = [...state.mqls].sort(
    (a, b) =>
      (b.priorityScore ?? 0) - (a.priorityScore ?? 0) ||
      (b.returnVisitCount ?? 0) - (a.returnVisitCount ?? 0) ||
      new Date(b.mqlDate) - new Date(a.mqlDate),
  );
  return sorted[0]?.id ?? null;
}

function renderFilterDebug() {
  if (!els.validationFilterDebug) return;
  const dim = getDimensionFilters();
  const filtered = getFilteredMqls();
  const byRegion = new Map();
  for (const m of filtered) {
    const label = contactRegion(m);
    byRegion.set(label, (byRegion.get(label) ?? 0) + 1);
  }
  const regionRows = [...byRegion.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `<tr><td>${escapeHtml(label)}</td><td>${fmtNum(count)}</td></tr>`)
    .join("");
  const samples = filtered
    .slice(0, 5)
    .map(
      (m) =>
        `<li>${escapeHtml(m.email)} · ${escapeHtml(contactRegion(m))}${m.mainSegment ? ` · ${escapeHtml(m.mainSegment)}` : ""}</li>`,
    )
    .join("");

  els.validationFilterDebug.innerHTML = `
    <ul class="validation-notes-list">
      <li><strong>Active filters:</strong> ${escapeHtml(describeActiveFilters(dim))}</li>
      <li><strong>Unfiltered contact count:</strong> ${fmtNum(state.mqls.length)}</li>
      <li><strong>Filtered contact count:</strong> ${fmtNum(filtered.length)}</li>
    </ul>
    <p class="validation-table-title">Filtered count by region</p>
    <table class="validation-table">
      <thead><tr><th>Region</th><th>Contacts</th></tr></thead>
      <tbody>${regionRows || `<tr><td colspan="2">No contacts</td></tr>`}</tbody>
    </table>
    <p class="validation-table-title">Sample filtered contacts (up to 5)</p>
    <ul class="validation-notes-list">${samples || "<li>No contacts match filters</li>"}</ul>`;
}

function renderRegionValidation() {
  if (!els.validationRegionNotes) return;
  const meta = state.regionMeta;
  if (!meta) {
    els.validationRegionNotes.innerHTML =
      `<p class="validation-empty">Region metadata not available.</p>`;
    return;
  }

  const methodLabel =
    meta.method === "direct"
      ? "Direct (from export column)"
      : meta.method === "mixed"
        ? "Mixed (export column + country derivation)"
        : "Derived (from country mapping)";

  const countRows = (meta.countsByRegion ?? [])
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td>${fmtNum(row.count)}</td></tr>`,
    )
    .join("");

  const sampleRows = (meta.unknownSamples ?? [])
    .map(
      (s) =>
        `<li>${escapeHtml(s.email)}${s.country ? ` · country: ${escapeHtml(s.country)}` : ""}${s.segment ? ` · ${escapeHtml(s.segment)}` : ""}</li>`,
    )
    .join("");

  els.validationRegionNotes.innerHTML = `
    <ul class="validation-notes-list">
      <li><strong>Source field:</strong> ${escapeHtml(meta.sourceField)}</li>
      <li><strong>Region type:</strong> ${escapeHtml(methodLabel)}</li>
      <li>${escapeHtml(meta.mappingNote)}</li>
      <li><strong>Missing / unknown region:</strong> ${fmtNum(meta.unknownCount ?? 0)} contact${(meta.unknownCount ?? 0) === 1 ? "" : "s"}</li>
    </ul>
    <p class="validation-table-title">Contacts per region</p>
    <table class="validation-table">
      <thead><tr><th>Region</th><th>Contacts</th></tr></thead>
      <tbody>${countRows || `<tr><td colspan="2">No data</td></tr>`}</tbody>
    </table>
    ${
      sampleRows
        ? `<p class="validation-table-title">Sample records with unknown region</p><ul class="validation-notes-list">${sampleRows}</ul>`
        : ""
    }`;
}

function updateRegionChip() {
  const region = normalizeFilterValue(state.filters.region);
  if (!els.regionFilterChip) return;
  if (region) {
    if (els.regionChipLabel) els.regionChipLabel.textContent = region;
    els.regionFilterChip.hidden = false;
  } else {
    state.filters.region = "";
    if (els.regionChipLabel) els.regionChipLabel.textContent = "";
    els.regionFilterChip.hidden = true;
  }
}

function setRegionFilter(value) {
  state.filters.region = normalizeFilterValue(value);
  syncFiltersToDom();
  updateRegionChip();
  clearListFilter({ rerender: false });
  renderAll();
}

function renderAll() {
  updateKpis();
  updateRegionChip();
  updateFilterAudienceSummary();
  renderFilterDebug();
  const filtered = getFilteredMqls();
  const prevSelected = state.selectedId;
  if (state.selectedId && !filtered.some((m) => m.id === state.selectedId)) {
    state.selectedId = filtered[0]?.id ?? null;
  }
  renderList();
  renderInsights();
  renderOutreachQueue();
  if (!state.selectedId) {
    clearJourneyView();
  } else if (state.selectedId !== prevSelected) {
    selectMql(state.selectedId);
  }
}

function clearAllFilters() {
  for (const key of Object.keys(state.filters)) state.filters[key] = "";
  syncFiltersToDom();
  state.chipFilters.clear();
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  state.listFilter = null;
  els.pageFilterBanner.hidden = true;
  updateRegionChip();
  updateFilterAudienceSummary();
  state.selectedId = topGlobalContactId();
  renderAll();
  if (state.selectedId) selectMql(state.selectedId);
  else clearJourneyView();
}

async function fetchMeta() {
  const res = await fetch("/api/meta");
  if (!res.ok) throw new Error("Failed to load metadata");
  return res.json();
}

async function fetchMqls() {
  const res = await fetch("/api/mqls");
  if (!res.ok) throw new Error("Failed to load MQLs");
  return res.json();
}

async function fetchJourney(id) {
  const res = await fetch(`/api/mqls/${encodeURIComponent(id)}/journey`);
  if (!res.ok) throw new Error("Failed to load journey");
  return res.json();
}

async function fetchTopPages() {
  const res = await fetch("/api/top-pages?limit=30");
  if (!res.ok) throw new Error("Failed to load top pages");
  return res.json();
}

async function fetchBreakdowns() {
  const res = await fetch("/api/breakdowns?limit=20");
  if (!res.ok) throw new Error("Failed to load breakdowns");
  return res.json();
}

async function fetchOutreachPriority() {
  const res = await fetch("/api/outreach-priority?limit=200");
  if (!res.ok) throw new Error("Failed to load outreach priority");
  return res.json();
}

function clearJourneyView() {
  els.journeyEmpty.hidden = false;
  els.journeyContent.hidden = true;
  els.timelineEmpty.hidden = false;
  els.timeline.hidden = true;
  els.timeline.innerHTML = "";
  if (els.chartLowActivityNote) els.chartLowActivityNote.hidden = true;
  if (els.latestMarker) els.latestMarker.hidden = true;
  if (els.latestRailLine) els.latestRailLine.hidden = true;
  updateJourneyPriorityPills(null);
  hidePostLaneTooltips();
}

async function selectMql(id) {
  state.selectedId = id;
  renderList();
  renderOutreachQueue();
  hidePostLaneTooltips();

  const mql = state.mqls.find((m) => m.id === id);
  els.journeyContent.hidden = true;
  els.journeyEmpty.hidden = false;
  els.timeline.hidden = true;
  els.timelineEmpty.hidden = false;
  els.timelineEmpty.textContent = "Loading journey…";

  try {
    const journey = await fetchJourney(id);
    const visits = journey.visits ?? [];
    const pageViews = journey.returnPageViewCount ?? 0;
    const uniquePages = journey.touchLanes?.length ?? 0;

    els.journeyEmpty.hidden = true;
    els.journeyContent.hidden = false;

    els.touchJourneyHint.textContent = `${fmtNum(pageViews)} page view${pageViews === 1 ? "" : "s"} · ${fmtNum(uniquePages)} page${uniquePages === 1 ? "" : "s"} · ${fmtNum(visits.length)} return visit${visits.length === 1 ? "" : "s"}`;

    updateJourneyPriorityPills(mql);

    const identity = contactIdentityLine(mql);
    els.leadHeader.innerHTML = `
      <div>
        <h3>${escapeHtml(mql?.email ?? id)}</h3>
        ${identity ? `<p class="postmql-lead-identity">${escapeHtml(identity)}</p>` : ""}
      </div>`;

    renderSummaryCards(mql, journey, visits);
    renderJourneyInsight(mql, journey, visits);

    els.mqlMarkerDate.textContent = formatDateShort(journey.mqlDate);

    if (visits.length === 1) {
      els.chartLowActivityNote.hidden = false;
      els.chartLowActivityNote.textContent =
        "Limited post-MQL activity: 1 return visit after MQL.";
    } else {
      els.chartLowActivityNote.hidden = true;
    }

    if (journey.touchLanes?.length) {
      renderPostMqlTouchLanes(els.postTouchLanes, journey.touchLanes, {
        maxLanes: 12,
        emptyLabel: "No page visits to show.",
      });
      hidePostLaneTooltips = wirePostMqlLaneTooltips(
        els.journeyContent,
        els.postLaneTooltip,
      );
    } else {
      els.postTouchLanes.innerHTML =
        `<p class="touch-journey-empty">No post-MQL return page views recorded yet.</p>`;
    }

    if (mql?.lastReturn) {
      els.latestMarker.hidden = false;
      els.latestMarkerDate.textContent = formatDateShort(mql.lastReturn);
      if (els.latestRailLine) els.latestRailLine.hidden = false;
    } else {
      els.latestMarker.hidden = true;
      if (els.latestRailLine) els.latestRailLine.hidden = true;
    }

    const highlightPath =
      state.listFilter?.kind === "page" ? state.listFilter.key : null;
    renderTimeline(visits, highlightPath);
  } catch (err) {
    clearJourneyView();
    els.timelineEmpty.hidden = false;
    els.timelineEmpty.textContent = err.message;
    els.touchJourneyHint.textContent = "Failed to load journey";
  }
}

async function init() {
  initPostMqlKpiTooltips();
  els.mqlList.innerHTML = `<li class="loading">Loading…</li>`;

  els.validationToggle?.addEventListener("click", () => {
    const open = els.validationPanel.hidden;
    els.validationPanel.hidden = !open;
    els.validationToggle.setAttribute("aria-expanded", String(open));
  });

  try {
    const [meta, mqlData, topPages, breakdowns, outreach] = await Promise.all([
      fetchMeta(),
      fetchMqls(),
      fetchTopPages(),
      fetchBreakdowns(),
      fetchOutreachPriority(),
    ]);
    state.regionMeta = meta.regionMeta ?? null;
    state.mqls = mqlData;
    state.topPages = topPages;
    state.breakdowns = breakdowns;
    state.outreachData = outreach;
    if (els.regionFilterTip) {
      const tip = regionFilterTooltip();
      els.regionFilterTip.title = tip;
      els.regionFilterTip.setAttribute("aria-label", tip);
    }
    populateFilterOptions();
    readFiltersFromDom();
    syncFiltersToDom();
    updateRegionChip();
    updateFilterAudienceSummary();
    renderValidation();
    renderAll();
    if (state.mqls.length > 0) await selectMql(state.mqls[0].id);
  } catch (err) {
    els.mqlList.innerHTML = `<li class="error">${escapeHtml(err.message)}</li>`;
  }
}

els.search.addEventListener("input", () => renderList());
els.pageFilterClear.addEventListener("click", clearListFilter);
els.clearFiltersBtn.addEventListener("click", clearAllFilters);
els.regionChipClear?.addEventListener("click", () => setRegionFilter(""));

[
  els.filterRegion,
  els.filterStatus,
  els.filterSegment,
  els.filterOwner,
  els.filterScore,
  els.filterPage,
  els.filterMqlFrom,
  els.filterMqlTo,
  els.filterReturnFrom,
  els.filterReturnTo,
].forEach((el) => {
  el?.addEventListener("change", onDimensionFilterChange);
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const key = chip.dataset.filter;
    if (state.chipFilters.has(key)) {
      state.chipFilters.delete(key);
      chip.classList.remove("active");
    } else {
      state.chipFilters.add(key);
      chip.classList.add("active");
    }
    renderAll();
  });
});

els.outreachShowAll.addEventListener("click", () => {
  state.outreachExpanded = true;
  const ids = state.mqls
    .filter((m) => filteredIdSet().has(m.id) && (m.priorityScore ?? 0) >= OUTREACH_THRESHOLD)
    .map((m) => m.id);
  setListFilter(
    "outreach",
    "queue",
    `${ids.length} contacts — immediate outreach queue`,
    ids,
  );
});

init();
