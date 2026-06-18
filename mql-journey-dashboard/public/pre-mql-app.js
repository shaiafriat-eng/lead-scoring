import { initKpiTooltips } from "/shared/kpi-tooltip.mjs";
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

const SOURCE_COLORS = {
  bing: "#008272",
  google: "#4285f4",
  linkedin: "#0a66c2",
  facebook: "#1877f2",
  email: "#fa8c16",
  organic: "#52c41a",
  direct: "#8c8c8c",
  "(direct)": "#8c8c8c",
};

const state = {
  accounts: [],
  summary: null,
  selectedId: null,
  journey: null,
  search: "",
  filter: null,
  dimension: {
    source: "",
    segment: "",
    status: "",
    form: "",
    country: "",
    owner: "",
    scoreGrade: "",
    campaign: "",
  },
  mqlDateFrom: "",
  mqlDateTo: "",
  insightsExpanded: {
    source: false,
    form: false,
    status: false,
  },
  showAllTimeline: false,
  kpiValidation: null,
  testLeadExclusions: null,
};

const els = {
  statMqls: document.getElementById("statMqls"),
  statTouches: document.getElementById("statTouches"),
  statOffered: document.getElementById("statOffered"),
  statBookedAfterOffer: document.getElementById("statBookedAfterOffer"),
  statBookedAfterOfferFoot: document.getElementById("statBookedAfterOfferFoot"),
  statOfferedNotBooked: document.getElementById("statOfferedNotBooked"),
  statConciergeDisqualified: document.getElementById("statConciergeDisqualified"),
  statBookingCancelled: document.getElementById("statBookingCancelled"),
  statOfferedFoot: document.getElementById("statOfferedFoot"),
  statDiscovery: document.getElementById("statDiscovery"),
  listMeta: document.getElementById("listMeta"),
  accountList: document.getElementById("accountList"),
  search: document.getElementById("search"),
  graphEmpty: document.getElementById("graphEmpty"),
  graphContent: document.getElementById("graphContent"),
  graphSubtitle: document.getElementById("graphSubtitle"),
  accountHeader: document.getElementById("accountHeader"),
  leadMeta: document.getElementById("leadMeta"),
  touchLanes: document.getElementById("touchLanes"),
  laneTooltip: document.getElementById("laneTooltip"),
  milestones: document.getElementById("milestones"),
  journeyOutcome: document.getElementById("journeyOutcome"),
  journeyInsight: document.getElementById("journeyInsight"),
  journeyInsightBullets: document.getElementById("journeyInsightBullets"),
  mqlMarkerDate: document.getElementById("mqlMarkerDate"),
  sourceListMore: document.getElementById("sourceListMore"),
  formCategoryListMore: document.getElementById("formCategoryListMore"),
  statusListMore: document.getElementById("statusListMore"),
  timelineEmpty: document.getElementById("timelineEmpty"),
  timeline: document.getElementById("timeline"),
  timelineToggle: document.getElementById("timelineToggle"),
  sourceList: document.getElementById("sourceList"),
  formCategoryList: document.getElementById("formCategoryList"),
  statusList: document.getElementById("statusList"),
  insightsFilterNote: document.getElementById("insightsFilterNote"),
  filterSource: document.getElementById("filterSource"),
  filterSegment: document.getElementById("filterSegment"),
  filterStatus: document.getElementById("filterStatus"),
  filterForm: document.getElementById("filterForm"),
  filterCountry: document.getElementById("filterCountry"),
  filterOwner: document.getElementById("filterOwner"),
  filterScore: document.getElementById("filterScore"),
  filterCampaign: document.getElementById("filterCampaign"),
  filterMqlFrom: document.getElementById("filterMqlFrom"),
  filterMqlTo: document.getElementById("filterMqlTo"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  kpiValidationNotes: document.getElementById("kpiValidationNotes"),
  kpiValidationTable: document.querySelector("#kpiValidationTable tbody"),
  cpKpiValidationNotes: document.getElementById("cpKpiValidationNotes"),
  cpFieldSemanticsTable: document.querySelector("#cpFieldSemanticsTable tbody"),
  kpiValidationSamples: document.querySelector("#kpiValidationSamples tbody"),
  valBookedWithoutOffer: document.getElementById("valBookedWithoutOffer"),
  valCpUnmatched: document.getElementById("valCpUnmatched"),
  validationToggle: document.getElementById("validationToggle"),
  validationPanel: document.getElementById("validationPanel"),
  testLeadExclusionNotes: document.getElementById("testLeadExclusionNotes"),
  testLeadImpactTable: document.querySelector("#testLeadImpactTable tbody"),
  testLeadReasonTable: document.querySelector("#testLeadReasonTable tbody"),
  testLeadSamplesTable: document.querySelector("#testLeadSamplesTable tbody"),
  validationScoreNotes: document.getElementById("validationScoreNotes"),
};

function colorForSource(source) {
  const key = (source || "(direct)").toLowerCase();
  return SOURCE_COLORS[key] ?? "#e2004f";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoMarkup(item, className = "account-logo") {
  if (item.logoUrl) {
    return `<img
      class="${className}"
      src="${escapeHtml(item.logoUrl)}"
      alt=""
      loading="lazy"
      data-favicon="${escapeHtml(item.faviconUrl || "")}"
      data-initials="${escapeHtml(item.initials || "?")}"
    />`;
  }
  return `<span class="${className} initials">${escapeHtml(item.initials || "?")}</span>`;
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
      span.className = img.className + " initials";
      span.textContent = img.dataset.initials || "?";
      img.replaceWith(span);
    });
  });
}

function touchEventLabel(t) {
  return t.eventType?.trim() || t.action?.trim() || "Event";
}

function laneTooltipHtml(t, sourceLabel) {
  const lines = [
    `<div class="lane-tooltip-title">${escapeHtml(touchEventLabel(t))}</div>`,
    `<div class="lane-tooltip-time">${escapeHtml(fmtDate(t.at))}</div>`,
    `<div class="lane-tooltip-row"><span>Page</span><span>${escapeHtml(t.path)}</span></div>`,
    `<div class="lane-tooltip-row"><span>Source</span><span>${escapeHtml(sourceLabel)}</span></div>`,
  ];
  if (t.action?.trim() && t.eventType?.trim() && t.action !== t.eventType) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Action</span><span>${escapeHtml(t.action)}</span></div>`,
    );
  }
  if (t.formCategory) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Form</span><span>${escapeHtml(t.formCategory)}</span></div>`,
    );
  }
  if (t.campaign) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Campaign</span><span>${escapeHtml(t.campaign)}</span></div>`,
    );
  }
  return lines.join("");
}

function hideLaneTooltip() {
  els.laneTooltip.hidden = true;
}

function showLaneTooltip(dot) {
  const tip = els.laneTooltip;
  const d = dot.dataset;
  tip.innerHTML = laneTooltipHtml(
    {
      at: d.at,
      eventType: d.eventType,
      action: d.action,
      path: d.path,
      formCategory: d.formCategory,
      campaign: d.campaign,
    },
    d.sourceLabel || "",
  );
  tip.hidden = false;
  const rect = dot.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.top - tipRect.height - 10;
  left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
  if (top < 8) top = rect.bottom + 10;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function wireLaneTooltips() {
  els.touchLanes.querySelectorAll(".lane-dot").forEach((dot) => {
    if (dot.dataset.wired) return;
    dot.dataset.wired = "1";
    const activate = () => {
      showLaneTooltip(dot);
      dot.classList.add("active");
    };
    const deactivate = () => {
      hideLaneTooltip();
      dot.classList.remove("active");
    };
    dot.addEventListener("mouseenter", activate);
    dot.addEventListener("mouseleave", deactivate);
    dot.addEventListener("focus", activate);
    dot.addEventListener("blur", deactivate);
  });
}

function setFilter(next) {
  if (next === "all") {
    state.filter = null;
  } else {
    state.filter = state.filter === next ? null : next;
  }
  document.querySelectorAll(".filter-chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.filter === state.filter);
  });
  document.querySelectorAll(".kpi-filter-btn[data-filter]").forEach((btn) => {
    const key = btn.dataset.filter;
    const active =
      key === "all" ? state.filter === null : state.filter === key;
    btn.classList.toggle("is-active", active);
  });
  renderList();
  renderRankLists();
  syncClearFiltersBtn();
  const rows = filteredAccounts();
  if (rows.length > 0) {
    const stillVisible = rows.some((a) => a.id === state.selectedId);
    if (!stillVisible) selectAccount(rows[0].id);
  }
}

function updateListMeta() {
  const rows = filteredAccounts();
  const total = rows.length;
  let hint = "";
  if (total > 500) {
    hint = "First 500 shown. Search or filter to find more.";
  } else if (filtersActive() || state.search.trim()) {
    hint = "Use search or filters to refine results.";
  }
  els.listMeta.innerHTML = `
    <div class="sidebar-stats-count">${total.toLocaleString()} accounts</div>
    ${hint ? `<div class="sidebar-stats-hint">${hint}</div>` : ""}`;
}

function bumpAggregate(map, label, touchCount, accountCount = 1) {
  const existing = map.get(label) ?? {
    label,
    touchCount: 0,
    mqlCount: 0,
    count: 0,
  };
  existing.touchCount += touchCount ?? 0;
  existing.mqlCount += accountCount;
  existing.count += accountCount;
  map.set(label, existing);
}

function computeFilteredBreakdowns() {
  const rows = filteredAccounts();
  const bySource = new Map();
  const byForm = new Map();
  const byStatus = new Map();

  for (const a of rows) {
    bumpAggregate(bySource, a.primarySource || "Unknown", a.touchCount ?? 0);
    if (a.primaryFormCategory) {
      bumpAggregate(byForm, a.primaryFormCategory, a.touchCount ?? 0);
    }
    const status = a.leadStatus || "Unknown";
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
  }

  return {
    bySource: [...bySource.values()].sort((a, b) => b.touchCount - a.touchCount),
    byFormCategory: [...byForm.values()].sort((a, b) => b.touchCount - a.touchCount),
    byLeadStatus: [...byStatus.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function updateInsightsFilterNote() {
  const rows = filteredAccounts();
  const total = state.accounts.length;
  if (!els.insightsFilterNote) return;
  if (filtersActive() || state.search.trim()) {
    els.insightsFilterNote.textContent = `Based on current filters across ${rows.length.toLocaleString()} accounts`;
  } else {
    els.insightsFilterNote.textContent = `Based on current filters across ${total.toLocaleString()} accounts`;
  }
}

function filteredAccounts() {
  let rows = state.accounts;
  const q = state.search.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        (a.logoDomain && a.logoDomain.toLowerCase().includes(q)),
    );
  }
  if (state.filter === "offered") rows = rows.filter((a) => a.meetingOffered);
  if (state.filter === "booked") rows = rows.filter((a) => a.meetingBooked);
  if (state.filter === "discovery") rows = rows.filter((a) => a.discoveryCall);
  if (state.dimension.source) {
    rows = rows.filter((a) => a.primarySource === state.dimension.source);
  }
  if (state.dimension.segment) {
    rows = rows.filter((a) => (a.mainSegment || "Unknown") === state.dimension.segment);
  }
  if (state.dimension.status) {
    rows = rows.filter((a) => (a.leadStatus || "Unknown") === state.dimension.status);
  }
  if (state.dimension.form) {
    rows = rows.filter(
      (a) => (a.primaryFormCategory || "Unknown") === state.dimension.form,
    );
  }
  if (state.dimension.country) {
    rows = rows.filter(
      (a) => (a.country || "(unknown)") === state.dimension.country,
    );
  }
  if (state.dimension.owner) {
    rows = rows.filter(
      (a) => (a.mainOwnerName || "Unknown") === state.dimension.owner,
    );
  }
  if (state.dimension.scoreGrade) {
    rows = rows.filter(
      (a) => (a.scoreGrade || "Unknown") === state.dimension.scoreGrade,
    );
  }
  if (state.dimension.campaign) {
    rows = rows.filter(
      (a) => (a.primaryCampaign || "Unknown") === state.dimension.campaign,
    );
  }
  if (state.mqlDateFrom) {
    const from = new Date(state.mqlDateFrom);
    rows = rows.filter((a) => a.mqlDate && new Date(a.mqlDate) >= from);
  }
  if (state.mqlDateTo) {
    const to = new Date(state.mqlDateTo);
    to.setHours(23, 59, 59, 999);
    rows = rows.filter((a) => a.mqlDate && new Date(a.mqlDate) <= to);
  }
  return rows;
}

function filtersActive() {
  return (
    state.filter ||
    state.dimension.source ||
    state.dimension.segment ||
    state.dimension.status ||
    state.dimension.form ||
    state.dimension.country ||
    state.dimension.owner ||
    state.dimension.scoreGrade ||
    state.dimension.campaign ||
    state.mqlDateFrom ||
    state.mqlDateTo
  );
}

function syncClearFiltersBtn() {
  if (els.clearFiltersBtn) {
    els.clearFiltersBtn.hidden = !filtersActive();
  }
}

function uniqueAccountLabels(accounts, getter, unknown = "Unknown") {
  const counts = new Map();
  for (const a of accounts) {
    const label = getter(a)?.trim() || unknown;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
}

function populateFilterSelects() {
  const s = state.summary;
  if (!s) return;
  fillSelect(els.filterSource, "All sources", s.bySource.map((r) => r.label));
  fillSelect(els.filterSegment, "All segments", s.bySegment.map((r) => r.label));
  fillSelect(els.filterStatus, "All statuses", s.byLeadStatus.map((r) => r.label));
  fillSelect(
    els.filterForm,
    "All forms",
    (s.byFormCategory ?? []).map((r) => r.label),
  );
  fillSelect(
    els.filterCountry,
    "All countries",
    uniqueAccountLabels(state.accounts, (a) => a.country, "(unknown)"),
  );
  fillSelect(
    els.filterOwner,
    "All owners",
    uniqueAccountLabels(state.accounts, (a) => a.mainOwnerName),
  );
  fillSelect(
    els.filterScore,
    "All fit scores",
    uniqueAccountLabels(state.accounts, (a) => a.scoreGrade),
  );
  fillSelect(
    els.filterCampaign,
    "All campaigns",
    uniqueAccountLabels(state.accounts, (a) => a.primaryCampaign),
  );
  syncFilterFieldVisibility();
}

function fillSelect(el, allLabel, labels) {
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">${allLabel}</option>`;
  for (const label of labels) {
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    el.appendChild(opt);
  }
  if ([...el.options].some((o) => o.value === current)) el.value = current;
}

function meaningfulLabels(labels, skip = []) {
  const skipSet = new Set(skip);
  return (labels ?? []).filter((label) => label && !skipSet.has(label));
}

function syncFilterFieldVisibility() {
  const specs = [
    {
      el: els.filterSource,
      labels: state.summary?.bySource?.map((r) => r.label) ?? [],
    },
    {
      el: els.filterSegment,
      labels: state.summary?.bySegment?.map((r) => r.label) ?? [],
    },
    {
      el: els.filterStatus,
      labels: state.summary?.byLeadStatus?.map((r) => r.label) ?? [],
    },
    {
      el: els.filterForm,
      labels: (state.summary?.byFormCategory ?? []).map((r) => r.label),
    },
    {
      el: els.filterCountry,
      labels: uniqueAccountLabels(state.accounts, (a) => a.country, "(unknown)"),
      skip: ["(unknown)"],
    },
    {
      el: els.filterOwner,
      labels: uniqueAccountLabels(state.accounts, (a) => a.mainOwnerName),
      skip: ["Unknown"],
    },
    {
      el: els.filterScore,
      labels: uniqueAccountLabels(state.accounts, (a) => a.scoreGrade),
      skip: ["Unknown"],
    },
    {
      el: els.filterCampaign,
      labels: uniqueAccountLabels(state.accounts, (a) => a.primaryCampaign),
      skip: ["Unknown"],
    },
  ];

  for (const { el, labels, skip = [] } of specs) {
    const field = el?.closest(".filter-field");
    if (!field) continue;
    const usable = meaningfulLabels(labels, skip);
    field.hidden = usable.length === 0;
    if (usable.length === 0) {
      el.value = "";
      const key = el.id.replace(/^filter/, "").replace(/^Mql/, "mql");
      // map element id to dimension key
      const map = {
        filterSource: "source",
        filterSegment: "segment",
        filterStatus: "status",
        filterForm: "form",
        filterCountry: "country",
        filterOwner: "owner",
        filterScore: "scoreGrade",
        filterCampaign: "campaign",
      };
      if (map[el.id]) state.dimension[map[el.id]] = "";
    }
  }
}

function clearDimensionFilters() {
  state.dimension = {
    source: "",
    segment: "",
    status: "",
    form: "",
    country: "",
    owner: "",
    scoreGrade: "",
    campaign: "",
  };
  state.mqlDateFrom = "";
  state.mqlDateTo = "";
  if (els.filterSource) els.filterSource.value = "";
  if (els.filterSegment) els.filterSegment.value = "";
  if (els.filterStatus) els.filterStatus.value = "";
  if (els.filterForm) els.filterForm.value = "";
  if (els.filterCountry) els.filterCountry.value = "";
  if (els.filterOwner) els.filterOwner.value = "";
  if (els.filterScore) els.filterScore.value = "";
  if (els.filterCampaign) els.filterCampaign.value = "";
  if (els.filterMqlFrom) els.filterMqlFrom.value = "";
  if (els.filterMqlTo) els.filterMqlTo.value = "";
}

function clearAllFilters() {
  state.filter = null;
  clearDimensionFilters();
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  document.querySelectorAll(".kpi-filter-btn[data-filter]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.filter === "all");
  });
  renderList();
  renderRankLists();
  syncClearFiltersBtn();
  const rows = filteredAccounts();
  if (rows.length > 0) {
    const stillVisible = rows.some((a) => a.id === state.selectedId);
    if (!stillVisible) selectAccount(rows[0].id);
  }
}

function resolveBookingKpis(summary, validation) {
  const v = validation?.counts;
  const offered = summary.meetingOfferedCount ?? v?.calendarPresented ?? 0;
  const bookedAfterOffer =
    summary.meetingBookedAfterOfferCount ?? v?.bookedAfterOffer ?? 0;
  const bookedWithoutOffer =
    summary.bookedWithoutOfferCount ?? v?.bookedWithoutOffer ?? 0;
  const offeredNotBooked =
    summary.offeredNotBookedCount ?? v?.offeredNotBooked ?? 0;
  const bookPct =
    summary.bookAfterPresentRate ??
    summary.offerToBookRate ??
    (offered > 0 ? Math.round((bookedAfterOffer / offered) * 1000) / 10 : null);
  return {
    offered,
    bookedAfterOffer,
    bookedWithoutOffer,
    offeredNotBooked,
    bookPct,
    timestampValidated: summary.timestampOrderValidated ?? validation?.timestampOrderValidated ?? false,
  };
}

function renderSummary() {
  const s = state.summary;
  if (!s) return;
  const booking = resolveBookingKpis(s, state.kpiValidation);

  els.statMqls.textContent = s.totalMqls.toLocaleString();
  els.statTouches.textContent = s.avgTouchesBeforeMql.toLocaleString();
  els.statOffered.textContent = booking.offered.toLocaleString();
  if (els.statBookedAfterOffer) {
    els.statBookedAfterOffer.textContent =
      booking.bookedAfterOffer.toLocaleString();
  }
  els.statDiscovery.textContent = s.discoveryCallCount.toLocaleString();

  const offerPct =
    s.totalMqls > 0
      ? Math.round((booking.offered / s.totalMqls) * 100)
      : 0;

  if (els.statOfferedFoot) {
    els.statOfferedFoot.textContent = `${offerPct}% of MQL contacts`;
  }
  if (els.statBookedAfterOfferFoot) {
    els.statBookedAfterOfferFoot.textContent =
      booking.offered > 0 && booking.bookPct != null
        ? `${booking.bookPct}% of calendar presented`
        : "No calendar presentations in CP window";
  }
  if (els.statOfferedNotBooked) {
    els.statOfferedNotBooked.textContent =
      booking.offeredNotBooked.toLocaleString();
  }
  const v = state.kpiValidation?.counts;
  const disq = s.conciergeDisqualifiedCount ?? v?.conciergeDisqualified ?? 0;
  const cancelled = s.bookingCancelledCount ?? v?.bookingCancelled ?? 0;
  const cpUnmatched = s.cpUnmatchedCount ?? v?.cpUnmatched ?? 0;
  const bookedWithoutOffer = booking.bookedWithoutOffer ?? s.bookedWithoutOfferCount ?? 0;
  if (els.statConciergeDisqualified) {
    els.statConciergeDisqualified.textContent = disq.toLocaleString();
  }
  if (els.statBookingCancelled) {
    els.statBookingCancelled.textContent = cancelled.toLocaleString();
  }
  if (els.valBookedWithoutOffer) {
    els.valBookedWithoutOffer.textContent = bookedWithoutOffer.toLocaleString();
  }
  if (els.valCpUnmatched) {
    els.valCpUnmatched.textContent = cpUnmatched.toLocaleString();
  }

  populateFilterSelects();
  renderRankLists();
}

async function loadKpiValidation() {
  const validationRes = await fetch("/api/pre-mql/kpi-validation");
  if (!validationRes.ok) return null;
  return validationRes.json();
}

function fmtValidationCount(kpi, count) {
  if (kpi === "Avg pre-MQL touches") return Number(count).toLocaleString();
  return Number(count).toLocaleString();
}

function fmtCpTimestamp(iso) {
  if (!iso) return "—";
  return fmtShortDate(iso);
}

function renderKpiValidation(payload) {
  if (!payload) return;
  state.kpiValidation = payload;
  renderSummary();

  const c = payload.counts ?? {};
  if (els.kpiValidationNotes) {
    els.kpiValidationNotes.innerHTML = `
      <ul>
        ${(payload.notes ?? []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
      </ul>
      <p>CP overlap: calendar only ${(c.offeredOnly ?? 0).toLocaleString()} · booked without presented ${(c.bookedOnly ?? 0).toLocaleString()} · booked after presented ${(c.bookedAfterOffer ?? 0).toLocaleString()} · no CP match ${(c.cpUnmatched ?? 0).toLocaleString()}</p>`;
  }
  if (els.kpiValidationTable) {
    els.kpiValidationTable.innerHTML = (payload.definitions ?? [])
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.kpi)}</td>
          <td>${escapeHtml(row.source)}</td>
          <td>${escapeHtml(row.matchingKey)}</td>
          <td>${escapeHtml(row.timestampRule)}</td>
          <td>${escapeHtml(row.includedStatuses)}</td>
          <td>${escapeHtml(row.excludedStatuses)}</td>
          <td>${fmtValidationCount(row.kpi, row.count)}</td>
        </tr>`,
      )
      .join("");
  }
  if (els.cpKpiValidationNotes) {
    els.cpKpiValidationNotes.innerHTML = els.kpiValidationNotes?.innerHTML ?? "";
  }
  if (els.cpFieldSemanticsTable) {
    els.cpFieldSemanticsTable.innerHTML = (payload.csvFieldSemantics ?? [])
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.field)}</td>
          <td>${escapeHtml(row.meaning)}</td>
          <td>${escapeHtml(row.cpSource)}</td>
          <td>${escapeHtml(row.caveats)}</td>
        </tr>`,
      )
      .join("");
  }
  if (els.kpiValidationSamples) {
    els.kpiValidationSamples.innerHTML = (payload.samples ?? [])
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.account)}</td>
          <td>${escapeHtml(fmtShortDate(row.mqlDate))}</td>
          <td>${escapeHtml(fmtCpTimestamp(row.cpOfferAt))}</td>
          <td>${escapeHtml(fmtCpTimestamp(row.cpBookAt))}</td>
          <td>${escapeHtml(row.cpStatus || "—")}</td>
          <td>${escapeHtml(row.meetingOfferResult || "—")}</td>
          <td>${escapeHtml(row.conciergeStatus || "—")}</td>
          <td>${row.calendarPresented ? "Yes" : "No"}</td>
          <td>${row.meetingBooked ? "Yes" : "No"}</td>
          <td>${row.bookedAfterOffer ? "Yes" : "No"}</td>
          <td>${row.bookedWithoutOffer ? "Yes" : "No"}</td>
        </tr>`,
      )
      .join("");
  }
}

function renderTestLeadExclusions(report) {
  if (!report) return;
  state.testLeadExclusions = report;

  if (els.testLeadExclusionNotes) {
    const borderline = report.borderline ?? [];
    els.testLeadExclusionNotes.innerHTML = `
      <ul>
        <li><strong>${Number(report.totalExcludedLeads ?? 0).toLocaleString()}</strong> test/internal MQL contacts excluded</li>
        <li><strong>${Number(report.totalExcludedAccounts ?? 0).toLocaleString()}</strong> accounts fully or partially removed</li>
        <li><strong>${Number(report.totalKeptLeads ?? 0).toLocaleString()}</strong> contacts remain in dashboard calculations</li>
      </ul>
      ${
        borderline.length
          ? `<p class="test-lead-borderline-note"><strong>Borderline (kept):</strong> ${borderline
              .slice(0, 5)
              .map((b) => `${escapeHtml(b.email)} (${escapeHtml(b.weakSignals?.join("; ") ?? "")})`)
              .join("; ")}</p>`
          : ""
      }`;
  }

  const before = report.before ?? {};
  const after = report.after ?? {};
  const delta = report.delta ?? {};
  const impactRows = [
    ["MQL contacts", before.mqlContacts, after.mqlContacts, delta.mqlContacts],
    ["Calendar presented", before.calendarPresented, after.calendarPresented, delta.calendarPresented],
    ["Booked after calendar", before.bookedAfterOffer, after.bookedAfterOffer, delta.bookedAfterOffer],
    ["Discovery Call", before.discoveryCall, after.discoveryCall, delta.discoveryCall],
  ];

  if (els.testLeadImpactTable) {
    els.testLeadImpactTable.innerHTML = impactRows
      .map(
        ([label, b, a, d]) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${Number(b ?? 0).toLocaleString()}</td>
          <td>${Number(a ?? 0).toLocaleString()}</td>
          <td>${Number(d ?? 0).toLocaleString()}</td>
        </tr>`,
      )
      .join("");
  }

  if (els.testLeadReasonTable) {
    const reasons = report.topReasons ?? [];
    els.testLeadReasonTable.innerHTML = reasons
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.reason)}</td>
          <td>${Number(row.count).toLocaleString()}</td>
        </tr>`,
      )
      .join("");
  }

  if (els.testLeadSamplesTable) {
    els.testLeadSamplesTable.innerHTML = (report.samples ?? [])
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.account)}</td>
          <td>${escapeHtml(row.domain)}</td>
          <td>${escapeHtml(row.reason)}</td>
          <td>${escapeHtml(row.primarySource)}</td>
          <td>${escapeHtml(fmtShortDate(row.mqlDate))}</td>
          <td>${escapeHtml(row.cpStatus || row.leadStatus || "—")}</td>
        </tr>`,
      )
      .join("");
  }
}

async function loadTestLeadExclusions() {
  const res = await fetch("/api/pre-mql/test-lead-exclusions");
  if (!res.ok) return null;
  return res.json();
}

function renderRankLists() {
  const breakdowns = computeFilteredBreakdowns();
  const rows = filteredAccounts();
  const totalAccounts = rows.length;
  updateInsightsFilterNote();
  renderInsightCard(
    els.sourceList,
    els.sourceListMore,
    "source",
    breakdowns.bySource.map((r) => ({
      label: r.label,
      count: r.mqlCount,
      filterKind: "source",
    })),
    totalAccounts,
  );
  renderInsightCard(
    els.formCategoryList,
    els.formCategoryListMore,
    "form",
    breakdowns.byFormCategory.map((r) => ({
      label: r.label,
      count: r.mqlCount,
      filterKind: "form",
    })),
    totalAccounts,
  );
  renderInsightCard(
    els.statusList,
    els.statusListMore,
    "status",
    breakdowns.byLeadStatus.map((r) => ({
      label: r.label,
      count: r.count,
      filterKind: "status",
    })),
    totalAccounts,
  );
}

function renderInsightCard(container, moreBtn, key, items, totalAccounts) {
  if (!container) return;
  if (!items?.length) {
    container.innerHTML = `<div class="filter-insight-empty">No data</div>`;
    if (moreBtn) moreBtn.hidden = true;
    return;
  }

  const expanded = state.insightsExpanded[key];
  const limit = expanded ? Math.min(items.length, 15) : 5;
  const visible = items.slice(0, limit);
  const maxCount = visible[0]?.count ?? 1;

  container.innerHTML = visible
    .map((item, i) => {
      const active =
        (item.filterKind === "source" && state.dimension.source === item.label) ||
        (item.filterKind === "form" && state.dimension.form === item.label) ||
        (item.filterKind === "status" && state.dimension.status === item.label);
      const pct =
        totalAccounts > 0
          ? Math.round((item.count / totalAccounts) * 100)
          : 0;
      const barPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      return `
        <button
          type="button"
          class="filter-insight-row${active ? " is-filter-active" : ""}"
          data-filter-kind="${item.filterKind}"
          data-filter-value="${escapeHtml(item.label)}"
        >
          <span class="filter-insight-rank">${i + 1}</span>
          <div class="filter-insight-main">
            <div class="filter-insight-row-head">
              <span class="filter-insight-name" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
              <span class="filter-insight-count">${item.count.toLocaleString()} accounts${pct > 0 ? ` · ${pct}%` : ""}</span>
            </div>
            <div class="filter-insight-bar" aria-hidden="true">
              <span style="width:${barPct.toFixed(1)}%"></span>
            </div>
          </div>
        </button>`;
    })
    .join("");

  if (moreBtn) {
    const hasMore = items.length > 5;
    moreBtn.hidden = !hasMore;
    moreBtn.textContent = expanded ? "Show less" : "View all";
    moreBtn.onclick = () => {
      state.insightsExpanded[key] = !state.insightsExpanded[key];
      renderRankLists();
    };
  }

  container.querySelectorAll(".filter-insight-row").forEach((row) => {
    row.addEventListener("click", () => applyInsightFilter(row));
  });
}

function applyInsightFilter(row) {
  const kind = row.dataset.filterKind;
  const value = row.dataset.filterValue;
  if (kind === "source") {
    state.dimension.source =
      state.dimension.source === value ? "" : value;
    if (els.filterSource) els.filterSource.value = state.dimension.source;
  } else if (kind === "form") {
    state.dimension.form = state.dimension.form === value ? "" : value;
    if (els.filterForm) els.filterForm.value = state.dimension.form;
  } else if (kind === "status") {
    state.dimension.status =
      state.dimension.status === value ? "" : value;
    if (els.filterStatus) els.filterStatus.value = state.dimension.status;
  }
  renderRankLists();
  renderList();
  syncClearFiltersBtn();
  const rows = filteredAccounts();
  if (rows.length > 0 && !rows.some((a) => a.id === state.selectedId)) {
    selectAccount(rows[0].id);
  }
}

function renderList() {
  const rows = filteredAccounts();
  updateListMeta();
  els.accountList.innerHTML = rows
    .slice(0, 500)
    .map((a) => {
      const badges = [];
      if (a.meetingBooked) badges.push('<span class="premql-badge badge-booked">Booked</span>');
      else if (a.meetingOffered) badges.push('<span class="premql-badge badge-offered">Presented</span>');
      if (a.discoveryCall) {
        badges.push('<span class="premql-badge badge-discovery">Discovery</span>');
      }
      const mqlLabel = a.mqlCount > 1 ? `${a.mqlCount} MQLs · ` : "";
      const formLabel = a.primaryFormCategory
        ? `${escapeHtml(a.primaryFormCategory)} · `
        : "";
      const fitScore = formatFitScore(a.lastCombinedScore);
      const fitPart = fitScore
        ? `<span class="mql-item-row account-fit-score">${escapeHtml(FIT_SCORE_LABEL)}: ${escapeHtml(fitScore)}</span>`
        : "";
      return `
        <li>
          <button type="button" class="mql-item account-item${a.id === state.selectedId ? " active" : ""}" data-id="${escapeHtml(a.id)}">
            ${logoMarkup(a, "account-logo account-logo-sm")}
            <span class="account-item-text">
              <span class="mql-email account-name">${escapeHtml(a.accountName)}</span>
              <span class="mql-meta">${mqlLabel}${formLabel}${escapeHtml(a.primarySource)} · ${a.touchCount} touches · ${fmtShortDate(a.mqlDate)}</span>
              ${fitPart}
              ${badges.length ? `<span class="account-badges">${badges.join("")}</span>` : ""}
            </span>
          </button>
        </li>`;
    })
    .join("");

  wireAccountLogos(els.accountList);
}

function sourceLabel(source, medium) {
  const s = (source || "(direct)").trim();
  const m = (medium || "").trim();
  return m ? `${s} / ${m}` : s;
}

function firstTouchSource(j) {
  const start = (j.timeline ?? []).find((n) => n.type === "journey_start");
  if (start?.source) return sourceLabel(start.source, start.medium);
  const lane = j.touchLanes?.[0];
  return lane?.label ?? "Unknown";
}

function renderDetailSection(title, items) {
  return `
    <section class="detail-section">
      <h4 class="detail-section-title">${escapeHtml(title)}</h4>
      <div class="detail-section-body">
        ${items.filter(Boolean).join("")}
      </div>
    </section>`;
}

function renderDetailRow(label, value) {
  return `
    <div class="detail-row">
      <span class="detail-row-label">${escapeHtml(label)}</span>
      <span class="detail-row-value">${escapeHtml(value ?? "—")}</span>
    </div>`;
}

function renderDetailRowOptional(label, value, format = (v) => v) {
  const display = format(value);
  if (display == null || display === "") return "";
  return renderDetailRow(label, display);
}

function meetingMilestonesFromJourney(j) {
  const cpKnown = typeof j.cpMatched === "boolean";
  if (!cpKnown) return [];

  const calendarPresented = j.cpCalendarPresented === true;
  const meetingBooked = j.cpMeetingBooked === true;
  const bookingCancelled = j.cpBookingCancelled === true;
  const items = [];

  if (calendarPresented && j.cpOfferAt) {
    items.push({
      type: "meeting_offered",
      at: j.cpOfferAt,
      label: "Calendar presented",
      detail: j.meetingOfferResult || "",
    });
  }

  if (meetingBooked && j.cpBookAt) {
    items.push({
      type: "meeting_booked",
      at: j.cpBookAt,
      label: bookingCancelled
        ? "Meeting scheduled, later cancelled"
        : "Meeting scheduled",
      detail: j.conciergeStatus || j.cpStatus || "",
    });
  } else if (bookingCancelled) {
    items.push({
      type: "meeting_cancelled",
      at: j.cpOfferAt || j.conciergeTriggeredAt || j.mqlDate,
      label: "Booking flow cancelled",
      detail: j.conciergeStatus || j.cpStatus || "",
    });
  }

  return items;
}

function meetingInsightBullet(j) {
  if (typeof j.cpMatched !== "boolean") return null;

  if (j.cpMeetingBooked) {
    return {
      text: "Calendar was shown before MQL and a meeting was scheduled.",
      highlight: true,
    };
  }
  if (j.cpCalendarPresented) {
    return {
      text: "Calendar was shown before MQL, but no meeting was scheduled in this journey.",
      highlight: false,
    };
  }
  if (!j.cpMatched) {
    return {
      text: "No Chili Piper calendar session was found in this journey.",
      highlight: false,
    };
  }
  return null;
}

function buildJourneyInsights(j) {
  const bullets = [];
  const avg = state.summary?.avgTouchesBeforeMql;

  const topLane = j.touchLanes?.[0];
  if (topLane?.label && topLane.touches?.length > 0) {
    bullets.push({
      text: `Most active source: ${topLane.label}, with ${topLane.touches.length.toLocaleString()} touches`,
      highlight: true,
    });
  }

  const meetingInsight = meetingInsightBullet(j);
  if (meetingInsight) bullets.push(meetingInsight);

  if (avg != null && j.touchCount && avg > 0) {
    const ratio = j.touchCount / avg;
    if (ratio >= 10) {
      bullets.push({
        text: `High-touch journey: ${Math.round(ratio).toLocaleString()}x higher than the average of ${Math.round(avg).toLocaleString()}`,
        highlight: true,
      });
    } else if (ratio >= 1.5) {
      bullets.push({
        text: `High-touch journey: significantly more touches than the average of ${Math.round(avg).toLocaleString()}`,
        highlight: true,
      });
    }
  }

  const preMqlEvents = (j.events ?? []).filter(
    (e) => e.at && j.mqlDate && new Date(e.at) <= new Date(j.mqlDate),
  );
  const lastEvent = preMqlEvents[preMqlEvents.length - 1];
  if (lastEvent?.source) {
    const src = sourceLabel(lastEvent.source, lastEvent.medium);
    bullets.push({
      text: `Conversion source: ${src} acquisition touch`,
      highlight: true,
    });
  }

  if (j.leadStatus) {
    bullets.push({
      text: `Current lead status: ${j.leadStatus}`,
      highlight: false,
    });
  }

  const fit = formatFitScore(j.lastCombinedScore);
  if (fit) {
    bullets.push({
      text: `${FIT_SCORE_LABEL}: ${fit}`,
      highlight: false,
    });
  }

  if (j.primarySource) {
    bullets.push({
      text: `Primary source: ${j.primarySource}`,
      highlight: false,
    });
  }

  const highlights = bullets.filter((b) => b.highlight);
  const rest = bullets.filter((b) => !b.highlight);
  const ordered = [...highlights, ...rest];
  const seen = new Set();
  const unique = [];
  for (const item of ordered) {
    if (seen.has(item.text)) continue;
    seen.add(item.text);
    unique.push(item);
    if (unique.length >= 4) break;
  }
  const clipped = unique.length >= 2 ? unique.slice(0, 4) : unique;
  if (clipped.length > 0) clipped[0].primary = true;
  return clipped;
}

function isPaidAcquisitionEvent(e) {
  const m = (e.medium || "").toLowerCase();
  const s = (e.source || "").toLowerCase();
  return (
    m.includes("cpc") ||
    m.includes("ppc") ||
    m.includes("paid") ||
    ((s === "google" || s === "bing" || s === "linkedin" || s === "facebook") && m)
  );
}

function isHighIntentPath(path) {
  const p = (path || "").toLowerCase();
  return (
    p.includes("pricing") ||
    p.includes("demo") ||
    p.includes("request") ||
    p.includes("book") ||
    p.includes("contact")
  );
}

function renderTimeline(j) {
  if (!els.timeline) return;
  const allEvents = [...(j.events ?? [])].sort((a, b) => new Date(a.at) - new Date(b.at));
  const eventCount = allEvents.length;

  if (els.timelineToggle) {
    els.timelineToggle.hidden = eventCount === 0;
    els.timelineToggle.textContent = state.showAllTimeline
      ? "Show key milestones"
      : `Show all ${eventCount.toLocaleString()} events`;
  }

  const first = allEvents[0];
  const firstHighIntent = allEvents.find((e) => isHighIntentPath(e.path) || e.formCategory);
  const firstPaid = allEvents.find((e) => isPaidAcquisitionEvent(e));

  const t = j.timeline ?? [];
  const meetingMilestones = meetingMilestonesFromJourney(j);
  const mqlNode = t.find((n) => n.type === "mql") ?? { at: j.mqlDate, label: "Became MQL" };
  const statusNode = [...t].reverse().find((n) => n.type === "lead_status");

  const milestones = [];
  if (first?.at) milestones.push({ type: "early", at: first.at, label: "First touch", detail: first.path || "" });
  if (firstHighIntent?.at) milestones.push({ type: "high_intent", at: firstHighIntent.at, label: "First high‑intent page view", detail: firstHighIntent.path || "" });
  if (firstPaid?.at) milestones.push({ type: "acquisition", at: firstPaid.at, label: "First paid acquisition touch", detail: sourceLabel(firstPaid.source, firstPaid.medium) });
  milestones.push(...meetingMilestones);
  if (mqlNode?.at) milestones.push({ type: "mql", at: mqlNode.at, label: "Became MQL", detail: "" });
  if (statusNode?.label) milestones.push({ type: "current_status", at: statusNode.at, label: "Current lead status", detail: statusNode.detail || statusNode.label });

  const groups = [];
  if (!state.showAllTimeline) {
    const firstEng = milestones.filter((m) => m.type === "early" || m.type === "acquisition");
    const webIntent = milestones.filter((m) => m.type === "high_intent");
    const meeting = milestones.filter(
      (m) =>
        m.type === "meeting_offered" ||
        m.type === "meeting_booked" ||
        m.type === "meeting_cancelled",
    );
    const conv = milestones.filter((m) => m.type === "mql" || m.type === "current_status");
    if (firstEng.length) groups.push({ title: "First engagement", items: firstEng });
    if (webIntent.length) groups.push({ title: "Website intent", items: webIntent });
    if (meeting.length) groups.push({ title: "Meeting activity", items: meeting });
    if (conv.length) groups.push({ title: "MQL conversion", items: conv });
  } else {
    const early = [];
    const intent = [];
    for (const e of allEvents) {
      const type = isPaidAcquisitionEvent(e) ? "acquisition" : isHighIntentPath(e.path) || e.formCategory ? "high_intent" : "early";
      const item = {
        type,
        at: e.at,
        label: e.eventType?.trim() || e.action?.trim() || "Touch",
        detail: e.path || sourceLabel(e.source, e.medium),
      };
      if (type === "high_intent" || type === "acquisition") intent.push(item);
      else early.push(item);
    }
    const meeting = [...meetingMilestones];
    const conv = [];
    if (mqlNode?.at) conv.push({ type: "mql", at: mqlNode.at, label: "Became MQL", detail: "" });
    if (statusNode?.label) conv.push({ type: "current_status", at: statusNode.at, label: "Current lead status", detail: statusNode.detail || statusNode.label });

    if (early.length) groups.push({ title: "First engagement", items: early });
    if (intent.length) groups.push({ title: "Website intent", items: intent });
    if (meeting.length) groups.push({ title: "Meeting activity", items: meeting });
    if (conv.length) groups.push({ title: "MQL conversion", items: conv });
  }

  els.timeline.innerHTML = groups
    .map(
      (g) => `
      <section class="timeline-group">
        <h4 class="timeline-group-title">${escapeHtml(g.title)}</h4>
        <div class="timeline-items">
          ${g.items
            .map(
              (node) => `
            <div class="timeline-item type-${escapeHtml(node.type)}">
              <div class="timeline-time">${fmtDate(node.at)}</div>
              <div class="timeline-label">${escapeHtml(node.label)}</div>
              ${node.detail ? `<div class="timeline-detail">${escapeHtml(node.detail)}</div>` : ""}
            </div>`,
            )
            .join("")}
        </div>
      </section>`,
    )
    .join("");
}

function renderJourney() {
  const j = state.journey;
  hideLaneTooltip();
  if (!j) {
    els.graphEmpty.hidden = false;
    els.graphContent.hidden = true;
    els.timelineEmpty.hidden = false;
    els.timeline.hidden = true;
    if (els.journeyInsight) els.journeyInsight.hidden = true;
    return;
  }

  const account = j.account ?? {};
  els.graphEmpty.hidden = true;
  els.graphContent.hidden = false;
  els.timelineEmpty.hidden = true;
  els.timeline.hidden = false;

  const mqlContacts = account.mqlCount ?? 1;
  const mqlContactLabel =
    mqlContacts === 1 ? "1 MQL contact" : `${mqlContacts} MQL contacts`;
  els.graphSubtitle.textContent = `${j.touchCount.toLocaleString()} pre-MQL touches · ${j.uniqueSourceCount} sources · ${mqlContactLabel}`;

  els.accountHeader.innerHTML = `
    ${logoMarkup(account, "account-logo account-logo-lg")}
    <div class="account-header-text">
      <h3>${escapeHtml(account.accountName || j.mainAccountName)}</h3>
      ${account.logoDomain ? `<p class="account-domain">${escapeHtml(account.logoDomain)}</p>` : ""}
    </div>`;
  wireAccountLogos(els.accountHeader);

  els.leadMeta.innerHTML = [
    renderDetailSection("Started", [
      renderDetailRow("First touch", fmtDate(j.journeyStartAt)),
      renderDetailRow("First source", firstTouchSource(j)),
    ]),
    renderDetailSection("Converted", [
      renderDetailRow("MQL date", fmtDate(j.mqlDate)),
      renderDetailRow(
        "Days to MQL",
        j.daysToMql != null ? String(j.daysToMql) : "—",
      ),
    ]),
    renderDetailSection("Current status", [
      renderDetailRow("Lead status", j.leadStatus),
      renderDetailRow("Owner", j.mainOwnerName),
      renderDetailRowOptional(FIT_SCORE_LABEL, j.lastCombinedScore, formatFitScore),
    ]),
  ].join("");

  if (els.mqlMarkerDate) {
    els.mqlMarkerDate.textContent = fmtShortDate(j.mqlDate);
    els.mqlMarkerDate.dateTime = j.mqlDate;
  }

  const lanes = j.touchLanes.slice(0, 8);
  els.touchLanes.innerHTML = lanes
    .map((lane) => {
      const color = colorForSource(lane.source);
      const dots = lane.touches
        .map((t) => {
          const label = touchEventLabel(t);
          return `<button
            type="button"
            class="lane-dot"
            style="left:${t.pct.toFixed(1)}%;background:${color}"
            data-at="${escapeHtml(t.at)}"
            data-event-type="${escapeHtml(t.eventType)}"
            data-action="${escapeHtml(t.action)}"
            data-path="${escapeHtml(t.path)}"
            data-form-category="${escapeHtml(t.formCategory)}"
            data-campaign="${escapeHtml(t.campaign)}"
            data-source-label="${escapeHtml(lane.label)}"
            aria-label="${escapeHtml(label)} on ${escapeHtml(t.path)}"
          ></button>`;
        })
        .join("");
      return `
        <div class="premql-lane">
          <span class="lane-label" title="${escapeHtml(lane.label)}">${escapeHtml(lane.label)}</span>
          <div class="lane-track">${dots}</div>
        </div>`;
    })
    .join("");
  wireLaneTooltips();

  const pills = [];
  if (j.cpCalendarPresented) {
    pills.push(
      `<span class="milestone-pill offered">Calendar presented${j.meetingOfferResult ? ` · ${escapeHtml(j.meetingOfferResult)}` : ""}</span>`,
    );
  }
  if (j.cpMeetingBooked) {
    const bookedLabel = j.cpBookingCancelled
      ? "Meeting scheduled, later cancelled"
      : "Meeting scheduled";
    pills.push(`<span class="milestone-pill booked">${escapeHtml(bookedLabel)}</span>`);
  } else if (j.cpBookingCancelled) {
    pills.push(`<span class="milestone-pill cancelled">Booking flow cancelled</span>`);
  }
  pills.push(`<span class="milestone-pill mql">Became MQL · ${fmtShortDate(j.mqlDate)}</span>`);
  if (j.leadStatus) {
    pills.push(
      `<span class="milestone-pill status">Status · ${escapeHtml(j.leadStatus)}</span>`,
    );
  }
  els.milestones.innerHTML = pills.join("");

  const daysLabel =
    j.daysToMql != null
      ? `${j.daysToMql} day${j.daysToMql === 1 ? "" : "s"}`
      : "an unknown period";
  const outcomeText = `Became MQL on ${fmtShortDate(j.mqlDate)} after ${daysLabel} and ${j.touchCount.toLocaleString()} pre-MQL touches.`;
  if (els.journeyOutcome) els.journeyOutcome.textContent = outcomeText;

  const insights = buildJourneyInsights(j);
  if (els.journeyInsightBullets) {
    els.journeyInsightBullets.innerHTML = insights
      .map(
        (item) =>
          `<li class="${[
            item.highlight ? "is-highlight" : "",
            item.primary ? "is-primary" : "",
          ]
            .filter(Boolean)
            .join(" ")}">${escapeHtml(item.text)}</li>`,
      )
      .join("");
  }
  if (els.journeyInsight) els.journeyInsight.hidden = false;

  renderTimeline(j);
}

async function selectAccount(id) {
  state.selectedId = id;
  renderList();
  try {
    const res = await fetch(`/api/pre-mql/accounts/${encodeURIComponent(id)}/journey`);
    if (!res.ok) throw new Error("Journey not found");
    state.journey = await res.json();
    renderJourney();
  } catch (err) {
    state.journey = null;
    renderJourney();
    console.error(err);
  }
}

function renderScoreValidationNotes() {
  if (!els.validationScoreNotes) return;
  const stats = scoreCoverageStats(state.accounts);
  const n = (v) => Number(v).toLocaleString();
  const intentNote =
    stats.withIntent > 0
      ? `${n(stats.withIntent)} with intent score (unusual on pre-MQL).`
      : "Intent score is N/A on pre-MQL unless enriched from post-MQL data.";
  els.validationScoreNotes.innerHTML = `
    <p><strong>${escapeHtml(FIT_SCORE_LABEL)}</strong> — source field <code>lastCombinedScore</code> (e.g. A1, B1, C1). ${escapeHtml(FIT_SCORE_TOOLTIP)}</p>
    <p><strong>${escapeHtml(INTENT_SCORE_LABEL)}</strong> — ${escapeHtml(intentNote)}</p>
    <table class="validation-entity-table">
      <tbody>
        <tr><th scope="row">Accounts in list</th><td>${n(stats.total)}</td></tr>
        <tr><th scope="row">With fit score</th><td>${n(stats.withFit)}</td></tr>
        <tr><th scope="row">Missing fit score</th><td>${n(stats.missingFit)}</td></tr>
        <tr><th scope="row">With intent score</th><td>${n(stats.withIntent)}</td></tr>
        <tr><th scope="row">Missing intent score</th><td>${n(stats.missingIntent)}</td></tr>
      </tbody>
    </table>`;
}

function wireValidationToggle() {
  const btn = els.validationToggle;
  const panel = els.validationPanel;
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    btn.classList.toggle("is-open", opening);
    btn.setAttribute("aria-expanded", String(opening));
  });
}

async function init() {
  initKpiTooltips(document.querySelector(".premql-app") ?? document);
  wireValidationToggle();

  const [summaryRes, accountsRes, validationRes, exclusionsRes] = await Promise.all([
    fetch("/api/pre-mql/summary"),
    fetch("/api/pre-mql/accounts"),
    fetch("/api/pre-mql/kpi-validation"),
    fetch("/api/pre-mql/test-lead-exclusions"),
  ]);
  if (!summaryRes.ok || !accountsRes.ok) {
    els.listMeta.textContent = "Failed to load pre-MQL data. Is postmql.csv configured?";
    return;
  }
  state.summary = await summaryRes.json();
  if (validationRes.ok) {
    state.kpiValidation = await validationRes.json();
  } else {
    state.kpiValidation = await loadKpiValidation();
  }
  if (state.kpiValidation) {
    renderKpiValidation(state.kpiValidation);
  }
  if (exclusionsRes.ok) {
    renderTestLeadExclusions(await exclusionsRes.json());
  } else {
    const exclusions = await loadTestLeadExclusions();
    if (exclusions) renderTestLeadExclusions(exclusions);
  }
  const payload = await accountsRes.json();
  state.accounts = payload.accounts ?? [];
  renderScoreValidationNotes();
  if (!state.kpiValidation) renderSummary();
  setFilter("all");
  if (state.accounts.length > 0) {
    await selectAccount(state.accounts[0].id);
  }
}

els.search.addEventListener("input", () => {
  state.search = els.search.value;
  renderList();
  renderRankLists();
});

els.accountList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-id]");
  if (!btn) return;
  selectAccount(btn.dataset.id);
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    setFilter(chip.dataset.filter);
  });
});

document.querySelectorAll(".kpi-filter-btn[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setFilter(btn.dataset.filter);
  });
});

for (const [key, el] of [
  ["source", els.filterSource],
  ["segment", els.filterSegment],
  ["status", els.filterStatus],
  ["form", els.filterForm],
  ["country", els.filterCountry],
  ["owner", els.filterOwner],
  ["scoreGrade", els.filterScore],
  ["campaign", els.filterCampaign],
]) {
  el?.addEventListener("change", () => {
    state.dimension[key] = el.value;
    renderRankLists();
    renderList();
    syncClearFiltersBtn();
    const rows = filteredAccounts();
    if (rows.length > 0 && !rows.some((a) => a.id === state.selectedId)) {
      selectAccount(rows[0].id);
    }
  });
}

for (const [key, el] of [
  ["mqlDateFrom", els.filterMqlFrom],
  ["mqlDateTo", els.filterMqlTo],
]) {
  el?.addEventListener("change", () => {
    state[key] = el.value;
    renderList();
    renderRankLists();
    syncClearFiltersBtn();
    const rows = filteredAccounts();
    if (rows.length > 0 && !rows.some((a) => a.id === state.selectedId)) {
      selectAccount(rows[0].id);
    }
  });
}

els.clearFiltersBtn?.addEventListener("click", clearAllFilters);

els.timelineToggle?.addEventListener("click", () => {
  state.showAllTimeline = !state.showAllTimeline;
  if (state.journey) renderTimeline(state.journey);
});

init();
