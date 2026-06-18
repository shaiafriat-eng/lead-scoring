import { fetchGoogleSheetCsv } from "./fetch-google-sheet-csv.mjs";
import { fetchGoogleSheetGviz } from "./fetch-google-sheet-gviz.mjs";
import { parseEventsSheet } from "./parse-events-sheet.mjs";
import { computeLeadCalendarFunnel } from "./compute-lead-calendar-funnel.mjs";
import { indexChilipiperGuestSheet } from "./index-chilipiper-guest-sheet.mjs";

/**
 * @param {string} rootDir
 */
export function leadCalendarConfigFromEnv(rootDir) {
  return {
    spreadsheetId:
      process.env.LEAD_CALENDAR_SPREADSHEET_ID ??
      "1rIIWPylhVRQKRLBq6bo8tGzCO16xX4wkzwLRaLo9Nbs",
    submitSheet: process.env.LEAD_CALENDAR_SUBMIT_SHEET ?? "submit",
    cpGid: process.env.LEAD_CALENDAR_CP_GID ?? "1954341337",
    chilipiperSheet:
      process.env.LEAD_CALENDAR_CHILIPIPER_SHEET ?? "chilipiper",
    rootDir,
  };
}

async function fetchSubmitCsv(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Submit tab fetch failed (sheet=${sheetName}): ${res.status}`,
    );
  }
  return res.text();
}

/**
 * @param {ReturnType<typeof leadCalendarConfigFromEnv>} config
 */
export async function loadLeadCalendarFunnel(config) {
  const [submitCsv, cpCsv, chiliGviz] = await Promise.all([
    fetchSubmitCsv(config.spreadsheetId, config.submitSheet),
    fetchGoogleSheetCsv(config.spreadsheetId, config.cpGid),
    fetchGoogleSheetGviz(config.spreadsheetId, config.chilipiperSheet),
  ]);

  const submitParsed = parseEventsSheet(submitCsv);
  const cpParsed = parseEventsSheet(cpCsv);
  const chiliByEmail = indexChilipiperGuestSheet(chiliGviz.rows);
  const payload = computeLeadCalendarFunnel(
    submitParsed.rows,
    cpParsed.rows,
    chiliByEmail,
  );

  return {
    ...payload,
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "google-sheets",
      spreadsheetId: config.spreadsheetId,
      submitSheet: config.submitSheet,
      cpGid: config.cpGid,
      chilipiperSheet: config.chilipiperSheet,
      joinKeys: [
        "Unique EMAIL_FILLED (one lead per email)",
        "SESSION_ID (submit↔cp, merged per email)",
        "EMAIL_FILLED↔Guest Email (submit↔chilipiper)",
      ],
      dedupeBy: "email",
      chilipiperGuestRows: chiliGviz.rows.length,
      chilipiperUniqueEmails: chiliByEmail.size,
    },
  };
}

/** Remove emails before sending funnel rows to the browser. */
export function redactLeadCalendarPayload(payload) {
  if (!payload?.leads) return payload;
  payload.leads = payload.leads.map((l) => ({
    ...l,
    email: null,
    numberOfEmployees: l.numberOfEmployees,
  }));
  payload.meta = { ...payload.meta, piiRedacted: true };
  return payload;
}
