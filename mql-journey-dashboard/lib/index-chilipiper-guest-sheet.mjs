/** @typedef {{ guestEmail: string, email: string, status: string, numberOfEmployees: string, country: string, date: string, raw: Record<string, string> }} ChiliGuestRow */

const STATUS_RANK = {
  "Meeting Scheduled": 5,
  "Scheduling Meeting": 4,
  "Meeting Not Scheduled": 3,
  Disqualified: 2,
  Cancelled: 1,
};

function normEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function pickBetterRow(current, candidate) {
  if (!current) return candidate;
  const curDate = String(current.date || "");
  const candDate = String(candidate.date || "");
  if (candDate > curDate) return candidate;
  if (candDate < curDate) return current;
  const curRank = STATUS_RANK[current.status] ?? 0;
  const candRank = STATUS_RANK[candidate.status] ?? 0;
  return candRank >= curRank ? candidate : current;
}

/**
 * @param {Record<string, string>} row raw gviz row (human column labels)
 * @returns {ChiliGuestRow | null}
 */
function normalizeChiliRow(row) {
  const guestEmail = normEmail(row["Guest Email"] || row["GUEST EMAIL"]);
  const email = normEmail(row.Email || row.EMAIL);
  const key = guestEmail || email;
  if (!key) return null;
  return {
    guestEmail: guestEmail || email,
    email: email || guestEmail,
    status: (row.Status || row.STATUS || "").trim(),
    numberOfEmployees: (
      row["Number of Employees"] ||
      row.NUMBER_OF_EMPLOYEES ||
      ""
    ).trim(),
    country: (row.Country || row.COUNTRY || "").trim(),
    date: (row.Date || row.DATE || "").trim(),
    raw: row,
  };
}

/**
 * One row per guest email (latest Date, then strongest status).
 * @param {Record<string, string>[]} rows
 * @returns {Map<string, ChiliGuestRow>}
 */
export function indexChilipiperGuestSheet(rows) {
  /** @type {Map<string, ChiliGuestRow>} */
  const byEmail = new Map();
  for (const raw of rows) {
    const normalized = normalizeChiliRow(raw);
    if (!normalized) continue;
    const keys = new Set([normalized.guestEmail, normalized.email].filter(Boolean));
    for (const key of keys) {
      byEmail.set(key, pickBetterRow(byEmail.get(key), normalized));
    }
  }
  return byEmail;
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow} submitRow
 * @param {ChiliGuestRow | undefined} chili
 */
export function resolveSegment(submitRow, chili) {
  const fromForm = (
    submitRow.SEGMENT_NAME_FILLED ||
    submitRow.SEGMENT_NAME ||
    ""
  ).trim();
  if (fromForm) {
    return { segment: fromForm, segmentSource: "form" };
  }
  const emp = chili?.numberOfEmployees?.trim();
  if (emp) {
    return { segment: emp, segmentSource: "chilipiper_employees" };
  }
  return { segment: "(unknown)", segmentSource: "none" };
}

/**
 * @param {import('./parse-events-sheet.mjs').EventRow} submitRow
 * @param {ChiliGuestRow | undefined} chili
 */
export function resolveCountry(submitRow, chili) {
  const fromForm = (
    submitRow.USER_COUNTRY_FILLED ||
    submitRow.USER_COUNTRY ||
    ""
  ).trim();
  if (fromForm) return fromForm;
  return chili?.country?.trim() || "(unknown)";
}

/** @param {ChiliGuestRow | undefined} chili */
export function chiliImpliesBooked(chili) {
  const s = (chili?.status || "").toLowerCase();
  return s === "meeting scheduled" || s === "scheduling meeting";
}

/** @param {{ chiliStatus?: string | null }} lead */
export function isChiliDisqualified(lead) {
  return (lead.chiliStatus || "").trim().toLowerCase() === "disqualified";
}
