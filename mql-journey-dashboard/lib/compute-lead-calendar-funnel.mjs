import {
  chiliImpliesBooked,
  isChiliDisqualified,
  resolveCountry,
  resolveSegment,
} from "./index-chilipiper-guest-sheet.mjs";

/** @typedef {'booked' | 'not_booked' | 'no_calendar'} LeadStatus */
/** @typedef {'match' | 'cp_only' | 'chili_only' | 'mismatch' | 'none'} BookingReconcile */

/**
 * @param {import('./parse-events-sheet.mjs').EventRow} e
 */
export function cpEventFlags(e) {
  const sawCalendar =
    e.ACTION === "view" &&
    (e.SUBCONTAINER_TYPE === "cp" ||
      e.SUBCONTAINER_TITLE === "cp" ||
      e.ELEMENT_TYPE === "calendar");
  const booked = e.ACTION === "booked";
  return { sawCalendar, booked };
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow[]} cpRows
 */
export function indexCpBySession(cpRows) {
  /** @type {Map<string, { sawCalendar: boolean, booked: boolean }>} */
  const bySession = new Map();
  for (const e of cpRows) {
    const sid = e.SESSION_ID;
    if (!sid) continue;
    const cur = bySession.get(sid) ?? { sawCalendar: false, booked: false };
    const f = cpEventFlags(e);
    cur.sawCalendar = cur.sawCalendar || f.sawCalendar;
    cur.booked = cur.booked || f.booked;
    bySession.set(sid, cur);
  }
  return bySession;
}

export function normEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/** One lead key per person: email, else user id, else session. */
export function leadDedupeKey(row) {
  const email = normEmail(row.EMAIL_FILLED || row.EMAIL);
  if (email) return `email:${email}`;
  const userId = String(row.USER_ID ?? "").trim();
  if (userId) return `user:${userId}`;
  const sessionId = String(row.SESSION_ID ?? "").trim();
  if (sessionId) return `session:${sessionId}`;
  return "";
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow[]} submitRows
 */
export function groupSubmitRowsByLead(submitRows) {
  /** @type {Map<string, { rows: import('./parse-events-sheet.mjs').EventRow[], sessionIds: Set<string> }>} */
  const groups = new Map();
  for (const row of submitRows) {
    const key = leadDedupeKey(row);
    if (!key) continue;
    const g = groups.get(key) ?? { rows: [], sessionIds: new Set() };
    g.rows.push(row);
    if (row.SESSION_ID) g.sessionIds.add(row.SESSION_ID);
    groups.set(key, g);
  }
  return groups;
}

function mergeCpFlags(sessionIds, cpBySession) {
  let sawCalendar = false;
  let booked = false;
  for (const sid of sessionIds) {
    const cp = cpBySession.get(sid);
    if (!cp) continue;
    sawCalendar = sawCalendar || cp.sawCalendar;
    booked = booked || cp.booked;
  }
  return { sawCalendar, booked };
}

function pickLatestSubmitRow(rows) {
  return rows.reduce((best, row) => {
    if (!best) return row;
    return String(row.EVENT_TIMESTAMP || "") >
      String(best.EVENT_TIMESTAMP || "")
      ? row
      : best;
  }, /** @type {import('./parse-events-sheet.mjs').EventRow | null} */ (null));
}

function bookingReconcile(cpBooked, chili) {
  const chiliBooked = chiliImpliesBooked(chili);
  if (cpBooked && chiliBooked) return "match";
  if (cpBooked && !chili) return "cp_only";
  if (cpBooked && chili && !chiliBooked) return "mismatch";
  if (!cpBooked && chiliBooked) return "chili_only";
  return "none";
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow[]} submitRows
 * @param {Map<string, { sawCalendar: boolean, booked: boolean }>} cpBySession
 * @param {Map<string, import('./index-chilipiper-guest-sheet.mjs').ChiliGuestRow>} chiliByEmail
 */
export function buildLeadsFromSubmit(submitRows, cpBySession, chiliByEmail) {
  const groups = groupSubmitRowsByLead(submitRows);
  const leads = [];

  for (const [dedupeKey, { rows, sessionIds }] of groups) {
    const row = pickLatestSubmitRow(rows);
    if (!row) continue;

    const cp = mergeCpFlags(sessionIds, cpBySession);
    const emailKey = normEmail(row.EMAIL_FILLED || row.EMAIL);
    const chili = emailKey ? chiliByEmail.get(emailKey) : undefined;
    const { segment, segmentSource } = resolveSegment(row, chili);
    const country = resolveCountry(row, chili);

    /** @type {LeadStatus} */
    let status = "no_calendar";
    if (cp.sawCalendar && cp.booked) status = "booked";
    else if (cp.sawCalendar && !cp.booked) status = "not_booked";
    else if (!cp.sawCalendar) status = "no_calendar";

    const sessionIdList = [...sessionIds];
    leads.push({
      dedupeKey,
      emailKey: emailKey || null,
      sessionId: sessionIdList[0] || "",
      sessionCount: sessionIdList.length,
      submissionCount: rows.length,
      userId: row.USER_ID || "",
      form: row.CONTAINER_SUBCATEGORY || "(unknown)",
      country,
      segment,
      segmentSource,
      submittedAt: row.EVENT_TIMESTAMP || "",
      status,
      sawCalendar: cp.sawCalendar,
      booked: cp.booked,
      chiliMatched: Boolean(chili),
      chiliStatus: chili?.status || null,
      numberOfEmployees: chili?.numberOfEmployees || null,
      bookingReconcile: bookingReconcile(cp.booked, chili),
    });
  }

  return leads;
}

function pct(n, d) {
  if (!d) return null;
  return Math.round((n / d) * 1000) / 10;
}

/**
 * @param {ReturnType<typeof buildLeadsFromSubmit>} leads
 */
export function summarizeFunnel(leads) {
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
      chiliDisqualifiedOfLeads: pct(chiliDisqualified, leadsCount),
    },
  };
}

/**
 * @param {ReturnType<typeof buildLeadsFromSubmit>} leads
 * @param {(l: typeof leads[0]) => string} keyFn
 * @param {number} limit
 */
function breakdown(leads, keyFn, limit = 15) {
  /** @type {Map<string, { key: string, leads: number, presented: number, booked: number, notBooked: number, noCalendar: number, chiliDisqualified: number }>} */
  const map = new Map();
  for (const l of leads) {
    const key = keyFn(l) || "(unknown)";
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
      rates: {
        presentedOfLeads: pct(r.presented, r.leads),
        bookedOfPresented: pct(r.booked, r.presented),
        chiliDisqualifiedOfLeads: pct(r.chiliDisqualified, r.leads),
      },
    }));
}

function summarizeEnrichment(leads) {
  const chiliMatched = leads.filter((l) => l.chiliMatched).length;
  const segmentFromEmployees = leads.filter(
    (l) => l.segmentSource === "chilipiper_employees",
  ).length;
  const reconcile = {
    match: 0,
    cp_only: 0,
    chili_only: 0,
    mismatch: 0,
    none: 0,
  };
  for (const l of leads) {
    reconcile[l.bookingReconcile] = (reconcile[l.bookingReconcile] || 0) + 1;
  }
  return {
    chiliMatched,
    chiliMatchRate: pct(chiliMatched, leads.length),
    segmentFromEmployees,
    bookingReconcile: reconcile,
  };
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow[]} submitRows
 * @param {import('./parse-events-sheet.mjs').EventRow[]} cpRows
 * @param {Map<string, import('./index-chilipiper-guest-sheet.mjs').ChiliGuestRow>} [chiliByEmail]
 */
export function computeLeadCalendarFunnel(submitRows, cpRows, chiliByEmail = new Map()) {
  const cpBySession = indexCpBySession(cpRows);
  const leads = buildLeadsFromSubmit(submitRows, cpBySession, chiliByEmail);
  const metrics = summarizeFunnel(leads);
  const enrichment = summarizeEnrichment(leads);

  const forms = [...new Set(leads.map((l) => l.form))].sort();
  const countries = [...new Set(leads.map((l) => l.country))].sort();
  const segments = [...new Set(leads.map((l) => l.segment))].sort();
  const chiliStatuses = [
    ...new Set(leads.map((l) => l.chiliStatus).filter(Boolean)),
  ].sort();

  return {
    metrics,
    enrichment,
    leads,
    breakdowns: {
      byForm: breakdown(leads, (l) => l.form),
      byCountry: breakdown(leads, (l) => l.country),
      bySegment: breakdown(leads, (l) => l.segment),
      byChiliStatus: breakdown(
        leads.filter((l) => l.chiliStatus),
        (l) => l.chiliStatus,
      ),
    },
    filterOptions: { forms, countries, segments, chiliStatuses },
    sheets: {
      submitRowCount: submitRows.length,
      cpRowCount: cpRows.length,
      chilipiperRowCount: chiliByEmail.size,
      uniqueSubmitSessions: new Set(
        submitRows.map((r) => r.SESSION_ID).filter(Boolean),
      ).size,
      uniqueLeads: leads.length,
      dedupeBy: "email",
      cpSessionsIndexed: cpBySession.size,
    },
  };
}
