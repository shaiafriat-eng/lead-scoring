import fs from "node:fs/promises";
import path from "node:path";
import { parseCsvLine, splitCsvRows } from "./parse-csv-line.mjs";
import {
  classifyWebsiteLogStatus,
  isWebsiteMeetingsCsv,
} from "./parse-website-meetings-csv.mjs";
import { chilipiperExportPaths } from "./chilipiper-data-dir.mjs";
import { normalizeGuestEmail } from "./build-concierge-guest-index.mjs";

/** Statuses where Chili Piper presented a calendar / meeting picker. */
export const CP_CALENDAR_PRESENTED_STATUSES = new Set([
  "Meeting Not Scheduled",
  "Meeting Scheduled",
  "Cancelled",
  "Scheduling Meeting",
]);

/** MCP concierge-log terminal statuses mapped to website-log semantics. */
const MCP_STATUS_MAP = {
  TimedOut: "Meeting Not Scheduled",
  Scheduled: "Meeting Scheduled",
  Cancelled: "Cancelled",
  Disqualified: "Disqualified",
  InProgress: "Scheduling Meeting",
  Failed: "Failed",
};

export function mapCpSessionStatus(status) {
  const raw = String(status ?? "").trim();
  if (CP_CALENDAR_PRESENTED_STATUSES.has(raw) || raw === "Disqualified" || raw === "Failed") {
    return raw;
  }
  return MCP_STATUS_MAP[raw] ?? raw;
}

export function isCalendarPresentedStatus(status) {
  return CP_CALENDAR_PRESENTED_STATUSES.has(mapCpSessionStatus(status));
}

export function isMeetingBookedStatus(status) {
  return mapCpSessionStatus(status) === "Meeting Scheduled";
}

function parseInstant(value) {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function sessionFromWebsiteRow(fields, idx) {
  const email = normalizeGuestEmail(
    fields[idx["Guest Email"]] ?? fields[idx.Email] ?? "",
  );
  if (!email) return null;

  const status = (fields[idx.Status] ?? "").trim();
  const triggeredAt = (fields[idx.Date] ?? "").trim();
  if (!triggeredAt) return null;

  const flags = classifyWebsiteLogStatus(status);
  return {
    email,
    triggeredAt,
    status,
    mappedStatus: mapCpSessionStatus(status),
    calendarPresented: isCalendarPresentedStatus(status),
    meetingBooked: isMeetingBookedStatus(status),
    disqualified: flags.disqualified,
    canceled: flags.canceled,
    source: "chilipiper-export",
    meetingId: null,
    crmContactUrl: (fields[idx["CRM Record"]] ?? "").trim() || null,
  };
}

function sessionFromMcpLog(log) {
  const email = normalizeGuestEmail(log.guestEmail);
  if (!email) return null;
  const status = (log.status ?? "").trim();
  const triggeredAt = (log.triggeredAt ?? "").trim();
  if (!triggeredAt) return null;

  const mappedStatus = mapCpSessionStatus(status);
  const flags = classifyWebsiteLogStatus(mappedStatus);
  return {
    email,
    triggeredAt,
    status,
    mappedStatus,
    calendarPresented: isCalendarPresentedStatus(status),
    meetingBooked: isMeetingBookedStatus(status),
    disqualified: flags.disqualified,
    canceled: flags.canceled,
    source: "chilipiper-mcp",
    meetingId: log.meetingId ?? null,
    crmContactUrl: log.crmUrl ?? null,
  };
}

/**
 * Build guest email index from Chili Piper website log export (Meeting_new.csv).
 * @returns {Promise<{ index: Map<string, object[]>, meta: object }>}
 */
export async function loadPreMqlCpGuestIndex(dataDir, opts = {}) {
  const paths = await chilipiperExportPaths(dataDir);
  const index = new Map();
  const meta = {
    source: "chilipiper-export",
    files: [paths.meetings],
    sessionCount: 0,
    guestCount: 0,
    mcpSessionCount: 0,
    schema: null,
  };

  try {
    const csvText = await fs.readFile(paths.meetings, "utf8");
    const rows = splitCsvRows(csvText);
    if (rows.length >= 2) {
      const headers = parseCsvLine(rows[0]).map((h) => (h ?? "").trim());
      meta.schema = isWebsiteMeetingsCsv(headers) ? "website-log" : "unified";
      const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

      if (meta.schema === "website-log") {
        for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
          const fields = parseCsvLine(rows[rowIdx]);
          const session = sessionFromWebsiteRow(fields, idx);
          if (!session) continue;
          if (!index.has(session.email)) index.set(session.email, []);
          index.get(session.email).push(session);
          meta.sessionCount += 1;
        }
      }
    }
  } catch (err) {
    meta.loadError = String(err.message ?? err);
  }

  const mcpPath = opts.mcpLogsPath?.trim();
  if (mcpPath) {
    try {
      const raw = JSON.parse(await fs.readFile(mcpPath, "utf8"));
      const logs = Array.isArray(raw) ? raw : Object.values(raw).flat();
      for (const log of logs) {
        const session = sessionFromMcpLog(log);
        if (!session) continue;
        if (!index.has(session.email)) index.set(session.email, []);
        index.get(session.email).push(session);
        meta.mcpSessionCount += 1;
        meta.sessionCount += 1;
      }
      if (meta.mcpSessionCount > 0) {
        meta.files.push(mcpPath);
      }
    } catch {
      /* optional MCP cache */
    }
  }

  for (const sessions of index.values()) {
    sessions.sort((a, b) => a.triggeredAt.localeCompare(b.triggeredAt));
  }

  meta.guestCount = index.size;
  meta.loadedAt = new Date().toISOString();
  return { index, meta };
}

/** Sessions for one MQL journey: first touch through MQL date (inclusive). */
export function cpSessionsInJourneyWindow(guestIndex, journey) {
  const email = normalizeGuestEmail(journey.email);
  if (!email) return [];

  const start = parseInstant(journey.journeyStartAt);
  const end = parseInstant(journey.mqlDate);
  if (!start || !end) return [];

  return (guestIndex.get(email) ?? []).filter((session) => {
    const at = parseInstant(session.triggeredAt);
    return at && at >= start && at <= end;
  });
}
