const $ = (sel) => document.querySelector(sel);

let data = null;
const filters = {
  form: "",
  country: "",
  segment: "",
  status: "",
  chiliStatus: "",
  chiliMatched: "",
};
const LEADS_TABLE_LIMIT = 200;

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatRate = (rate) => (rate == null ? "—" : `${rate}%`);
const formatNum = (n) => (n == null ? "—" : n.toLocaleString());

function pct(n, d) {
  if (!d) return null;
  return Math.round((n / d) * 1000) / 10;
}

function statusLabel(status) {
  if (status === "booked") return "Booked";
  if (status === "not_booked") return "Did not book";
  return "No calendar";
}

function isChiliDisqualified(lead) {
  return (lead.chiliStatus || "").trim().toLowerCase() === "disqualified";
}

function applyFilters(leads) {
  return leads.filter((l) => {
    if (filters.form && l.form !== filters.form) return false;
    if (filters.country && l.country !== filters.country) return false;
    if (filters.segment && l.segment !== filters.segment) return false;
    if (filters.status && l.status !== filters.status) return false;
    if (filters.chiliStatus && l.chiliStatus !== filters.chiliStatus) return false;
    if (filters.chiliMatched === "yes" && !l.chiliMatched) return false;
    if (filters.chiliMatched === "no" && l.chiliMatched) return false;
    return true;
  });
}

function computeMetricsFromLeads(leads) {
  const leadsCount = leads.length;
  const presented = leads.filter((l) => l.sawCalendar).length;
  const booked = leads.filter((l) => l.booked).length;
  const notBooked = leads.filter((l) => l.status === "not_booked").length;
  const noCalendar = leads.filter((l) => l.status === "no_calendar").length;
  const chiliDisqualified = leads.filter((l) => isChiliDisqualified(l)).length;
  return {
    leads: leadsCount,
    presented,
    booked,
    notBooked,
    noCalendar,
    chiliDisqualified,
    rates: {
      presentedOfLeads: pct(presented, leadsCount),
      bookedOfLeads: pct(booked, leadsCount),
      bookedOfPresented: pct(booked, presented),
      notBookedOfPresented: pct(notBooked, presented),
    },
  };
}

function breakdownFromLeads(leads, keyFn, limit = 15) {
  const map = new Map();
  for (const l of leads) {
    const key = keyFn(l);
    const row = map.get(key) ?? {
      key,
      leads: 0,
      presented: 0,
      booked: 0,
      notBooked: 0,
      noCalendar: 0,
      chiliDisqualified: 0,
    };
    row.leads++;
    if (l.sawCalendar) row.presented++;
    if (l.booked) row.booked++;
    if (l.status === "not_booked") row.notBooked++;
    if (l.status === "no_calendar") row.noCalendar++;
    if (isChiliDisqualified(l)) row.chiliDisqualified++;
    map.set(key, row);
  }
  return [...map.values()]
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit)
    .map((r) => ({
      ...r,
      rates: { bookedOfPresented: pct(r.booked, r.presented) },
    }));
}

function filtersActive() {
  return Boolean(
    filters.form ||
      filters.country ||
      filters.segment ||
      filters.status ||
      filters.chiliStatus ||
      filters.chiliMatched,
  );
}

function fillSelect(el, options, allLabel) {
  const current = el.value;
  el.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>`;
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    el.appendChild(o);
  }
  if (options.includes(current)) el.value = current;
}

function renderFunnelBars(metrics) {
  const max = metrics.leads || 1;
  const steps = [
    { label: "Leads submitted", value: metrics.leads, cls: "" },
    { label: "Calendar presented", value: metrics.presented, cls: "" },
    { label: "Booked", value: metrics.booked, cls: "success" },
    { label: "Did not book", value: metrics.notBooked, cls: "warning" },
  ];
  $("#funnelBars").innerHTML = steps
    .map(
      (s) => `
    <div class="funnel-step">
      <span class="funnel-step-label">${escapeHtml(s.label)}</span>
      <div class="funnel-step-bar-wrap">
        <div class="funnel-step-bar ${s.cls}" style="width:${Math.max(2, (s.value / max) * 100)}%"></div>
      </div>
      <span class="funnel-step-pct">${formatNum(s.value)}</span>
    </div>`,
    )
    .join("");
}

function renderBreakdownTable(tbody, rows) {
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.key)}</td>
      <td class="num">${formatNum(r.leads)}</td>
      <td class="num">${formatNum(r.presented)}</td>
      <td class="num">${formatNum(r.booked)}</td>
      <td class="num">${formatNum(r.notBooked)}</td>
      <td class="num">${formatNum(r.chiliDisqualified)}</td>
      <td class="num">${formatRate(r.rates?.bookedOfPresented)}</td>
    </tr>`,
    )
    .join("");
}

function renderEnrichment(enrichment, filteredCount) {
  const row = $("#enrichmentRow");
  const stats = $("#enrichmentStats");
  if (!enrichment) {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  const r = enrichment.bookingReconcile ?? {};
  stats.innerHTML = [
    `<span class="enrichment-stat">Chili Piper matched: <strong>${formatNum(enrichment.chiliMatched)}</strong> (${formatRate(enrichment.chiliMatchRate)})</span>`,
    `<span class="enrichment-stat">Segment from employees: <strong>${formatNum(enrichment.segmentFromEmployees)}</strong></span>`,
    `<span class="enrichment-stat">Booking aligned: <strong>${formatNum(r.match)}</strong></span>`,
    `<span class="enrichment-stat">CP booked, Chili differs: <strong>${formatNum(r.mismatch)}</strong></span>`,
    `<span class="enrichment-stat">Chili scheduled, no CP book: <strong>${formatNum(r.chili_only)}</strong></span>`,
    `<span class="enrichment-stat">Showing: <strong>${formatNum(filteredCount)}</strong> unique emails</span>`,
  ].join("");
}

function segmentCell(l) {
  const seg = escapeHtml(l.segment);
  if (l.segmentSource === "chilipiper_employees") {
    return `${seg}<span class="segment-from-employees">from # employees</span>`;
  }
  return seg;
}

function renderLeadsTable(leads) {
  const slice = leads.slice(0, LEADS_TABLE_LIMIT);
  const tbody = $("#leadsTable tbody");
  tbody.innerHTML = slice
    .map((l) => {
      const submitted = l.submittedAt
        ? new Intl.DateTimeFormat(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(l.submittedAt.replace(" ", "T")))
        : "—";
      const chili = l.chiliStatus
        ? `<span class="chili-pill" title="${escapeHtml(l.chiliStatus)}">${escapeHtml(l.chiliStatus)}</span>`
        : `<span class="chili-pill missing">—</span>`;
      return `
    <tr>
      <td>${escapeHtml(submitted)}</td>
      <td>${escapeHtml(l.form)}</td>
      <td>${escapeHtml(l.country)}</td>
      <td>${segmentCell(l)}</td>
      <td><span class="status-pill ${escapeHtml(l.status)}">${escapeHtml(statusLabel(l.status))}</span></td>
      <td>${chili}</td>
      <td class="session-id" title="${escapeHtml(l.sessionId)}">${escapeHtml(l.sessionId.slice(0, 8))}…</td>
    </tr>`;
    })
    .join("");
  $("#leadsCount").textContent = `${leads.length.toLocaleString()} unique emails`;
  $("#leadsFoot").textContent =
    leads.length > LEADS_TABLE_LIMIT
      ? `Showing first ${LEADS_TABLE_LIMIT} of ${leads.length.toLocaleString()} · one lead per email · no emails in browser`
      : `${leads.length.toLocaleString()} unique emails · one lead per email · no emails in browser`;
}

function render() {
  if (!data) return;
  const filtered = applyFilters(data.leads);
  const metrics = computeMetricsFromLeads(filtered);

  $("#kpiLeads").textContent = formatNum(metrics.leads);
  $("#kpiPresented").textContent = formatNum(metrics.presented);
  $("#kpiPresentedFoot").textContent = `${formatRate(metrics.rates.presentedOfLeads)} of leads`;
  $("#kpiBooked").textContent = formatNum(metrics.booked);
  $("#kpiBookedFoot").textContent = `${formatRate(metrics.rates.bookedOfLeads)} of leads · ${formatRate(metrics.rates.bookedOfPresented)} of presented`;
  $("#kpiNotBooked").textContent = formatNum(metrics.notBooked);
  $("#kpiNotBookedFoot").textContent = `${formatRate(metrics.rates.notBookedOfPresented)} of presented`;
  $("#kpiNoCalendar").textContent = formatNum(metrics.noCalendar);
  $("#kpiNoCalendarFoot").textContent =
    metrics.leads > 0
      ? `${formatRate(pct(metrics.noCalendar, metrics.leads))} of leads`
      : "—";

  renderEnrichment(data.enrichment, filtered.length);
  renderFunnelBars(metrics);
  renderBreakdownTable(
    $("#tableByForm tbody"),
    breakdownFromLeads(filtered, (l) => l.form),
  );
  renderBreakdownTable(
    $("#tableByCountry tbody"),
    breakdownFromLeads(filtered, (l) => l.country),
  );
  renderBreakdownTable(
    $("#tableByChiliStatus tbody"),
    breakdownFromLeads(
      filtered.filter((l) => l.chiliStatus),
      (l) => l.chiliStatus,
    ),
  );
  renderBreakdownTable(
    $("#tableBySegment tbody"),
    breakdownFromLeads(filtered, (l) => l.segment),
  );
  renderLeadsTable(filtered);

  const summary = $("#filterSummary");
  const clearBtn = $("#clearFiltersBtn");
  if (filtersActive()) {
    summary.hidden = false;
    clearBtn.hidden = false;
    summary.textContent = `Filtered: ${filtered.length.toLocaleString()} of ${data.leads.length.toLocaleString()} unique emails`;
  } else {
    summary.hidden = true;
    clearBtn.hidden = true;
  }
}

async function load(refresh = false) {
  $("#metaLine").textContent = "Loading…";
  const url = refresh ? "/api/lead-calendar?refresh=1" : "/api/lead-calendar";
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  data = await res.json();
  const fetched = data.meta?.fetchedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.meta.fetchedAt))
    : "";
  $("#metaLine").textContent = `submit + cp + chilipiper tabs · updated ${fetched}`;
  if (data.meta?.spreadsheetId) {
    $("#sheetLink").href = `https://docs.google.com/spreadsheets/d/${data.meta.spreadsheetId}/edit`;
  }
  fillSelect($("#filterForm"), data.filterOptions?.forms ?? [], "All forms");
  fillSelect($("#filterCountry"), data.filterOptions?.countries ?? [], "All countries");
  fillSelect($("#filterSegment"), data.filterOptions?.segments ?? [], "All segments");
  fillSelect(
    $("#filterChiliStatus"),
    data.filterOptions?.chiliStatuses ?? [],
    "All statuses",
  );
  render();
}

function bindFilters() {
  for (const [id, key] of [
    ["#filterForm", "form"],
    ["#filterCountry", "country"],
    ["#filterSegment", "segment"],
    ["#filterStatus", "status"],
    ["#filterChiliStatus", "chiliStatus"],
    ["#filterChiliMatched", "chiliMatched"],
  ]) {
    $(id).addEventListener("change", (e) => {
      filters[key] = e.target.value;
      render();
    });
  }
  $("#clearFiltersBtn").addEventListener("click", () => {
    Object.keys(filters).forEach((k) => {
      filters[k] = "";
    });
    $("#filterForm").value = "";
    $("#filterCountry").value = "";
    $("#filterSegment").value = "";
    $("#filterStatus").value = "";
    $("#filterChiliStatus").value = "";
    $("#filterChiliMatched").value = "";
    render();
  });
}

$("#refreshBtn").addEventListener("click", async () => {
  $("#refreshBtn").disabled = true;
  try {
    await load(true);
  } catch (err) {
    alert(err.message);
  } finally {
    $("#refreshBtn").disabled = false;
  }
});

bindFilters();
load().catch((err) => {
  $("#metaLine").textContent = `Error: ${err.message}`;
});
