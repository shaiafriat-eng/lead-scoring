import fs from "node:fs/promises";
import crypto from "node:crypto";
import {
  accountDisplayName,
  domainFromEmail,
  faviconUrlForDomain,
  initialsForAccount,
  logoUrlForDomain,
} from "./account-logo.mjs";

/** Parse one CSV line respecting quoted fields. */
function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function pathFromUrl(url) {
  if (!url?.trim()) return "(unknown page)";
  try {
    const u = new URL(url.trim());
    return u.pathname + (u.hash || "");
  } catch {
    return url.trim();
  }
}

function titleFromPath(pathStr) {
  if (!pathStr || pathStr === "(unknown page)") return "Unknown page";
  const slug = pathStr.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop();
  if (!slug) return "Home";
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\.[a-z]+$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mqlId(email, mqlDate) {
  const key = `${email.toLowerCase()}|${mqlDate}`;
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 12);
}

function truthy(value) {
  return String(value ?? "").trim().toUpperCase() === "TRUE";
}

function sourceKey(source, medium) {
  const s = (source || "").trim().toLowerCase() || "(direct)";
  const m = (medium || "").trim().toLowerCase() || "(none)";
  return `${s}|${m}`;
}

function sourceLabel(source, medium) {
  const s = (source || "").trim() || "Direct";
  const m = (medium || "").trim();
  return m ? `${s} / ${m}` : s;
}

function formatFormCategory(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFormCategoryBreakdown(events) {
  const map = new Map();
  for (const e of events) {
    const label = formatFormCategory(e.formCategory);
    if (!label) continue;
    const existing = map.get(label) ?? {
      label,
      raw: e.formCategory,
      count: 0,
      firstAt: e.ts,
      lastAt: e.ts,
    };
    existing.count += 1;
    if (e.ts < existing.firstAt) existing.firstAt = e.ts;
    if (e.ts > existing.lastAt) existing.lastAt = e.ts;
    map.set(label, existing);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function parseTimestamp(value) {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function buildSourceBreakdown(events) {
  const map = new Map();
  for (const e of events) {
    const key = sourceKey(e.source, e.medium);
    const existing = map.get(key) ?? {
      source: e.source || "(direct)",
      medium: e.medium || "",
      label: sourceLabel(e.source, e.medium),
      count: 0,
      firstAt: e.ts,
      lastAt: e.ts,
    };
    existing.count += 1;
    if (e.ts < existing.firstAt) existing.firstAt = e.ts;
    if (e.ts > existing.lastAt) existing.lastAt = e.ts;
    map.set(key, existing);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function buildTimeline(events, meta) {
  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  if (sorted.length === 0) return [];

  const nodes = [];
  const first = sorted[0];
  nodes.push({
    type: "journey_start",
    at: first.ts,
    label: "Journey start",
    detail: titleFromPath(pathFromUrl(first.url)),
    source: first.source,
    medium: first.medium,
  });

  const seenSources = new Set([sourceKey(first.source, first.medium)]);
  for (const e of sorted) {
    const key = sourceKey(e.source, e.medium);
    if (seenSources.has(key)) continue;
    seenSources.add(key);
    nodes.push({
      type: "source_touch",
      at: e.ts,
      label: sourceLabel(e.source, e.medium),
      detail: "New acquisition source",
      source: e.source,
      medium: e.medium,
    });
  }

  const seenPaths = new Set();
  for (const e of sorted) {
    const isPage =
      /page\s*view/i.test(e.eventType || "") ||
      /page\s*view/i.test(e.calcEventType || "");
    if (!isPage) continue;
    const p = pathFromUrl(e.url);
    if (seenPaths.has(p) || seenPaths.size >= 10) continue;
    seenPaths.add(p);
    nodes.push({
      type: "page",
      at: e.ts,
      label: titleFromPath(p),
      detail: p,
      source: e.source,
      medium: e.medium,
    });
  }

  for (const e of sorted) {
    const hay = `${e.eventType ?? ""} ${e.action ?? ""}`.toLowerCase();
    if (!/conversion|submit|demo|contact|book/.test(hay)) continue;
    nodes.push({
      type: "conversion",
      at: e.ts,
      label: e.eventType?.trim() || e.action?.trim() || "Conversion",
      detail: pathFromUrl(e.url),
      source: e.source,
      medium: e.medium,
      formCategory: formatFormCategory(e.formCategory) || null,
    });
  }

  const seenFormCategories = new Set();
  for (const e of sorted) {
    const label = formatFormCategory(e.formCategory);
    if (!label || seenFormCategories.has(label)) continue;
    seenFormCategories.add(label);
    nodes.push({
      type: "form_category",
      at: e.ts,
      label: `Form · ${label}`,
      detail: pathFromUrl(e.url),
      source: e.source,
      medium: e.medium,
      formCategory: label,
    });
  }

  if (meta.meetingOffered) {
    nodes.push({
      type: "meeting_offered",
      at: meta.conciergeTriggeredAt || meta.mqlDate,
      label: "Meeting offered",
      detail: meta.meetingOfferResult || meta.conciergeStatus || "Offered",
    });
  }

  if (meta.meetingBooked) {
    nodes.push({
      type: "meeting_booked",
      at: meta.conciergeTriggeredAt || meta.mqlDate,
      label: "Meeting booked",
      detail: meta.conciergeStatus || "Booked",
    });
  }

  nodes.push({
    type: "mql",
    at: meta.mqlDate,
    label: "Became MQL",
    detail: accountDisplayName(meta.mainAccountName),
  });

  if (meta.leadStatus) {
    nodes.push({
      type: "lead_status",
      at: meta.mqlDate,
      label: meta.leadStatus,
      detail: "Current lead status",
    });
  }

  return nodes.sort((a, b) => new Date(a.at) - new Date(b.at));
}

function buildTouchLanes(events, journeyStartAt, mqlDate) {
  const startMs = new Date(journeyStartAt).getTime();
  const endMs = new Date(mqlDate).getTime();
  const span = Math.max(endMs - startMs, 1);
  const bySource = new Map();

  for (const e of events) {
    const key = sourceKey(e.source, e.medium);
    const lane = bySource.get(key) ?? {
      source: e.source || "(direct)",
      medium: e.medium || "",
      label: sourceLabel(e.source, e.medium),
      touches: [],
    };
    const ms = new Date(e.ts).getTime();
    lane.touches.push({
      at: e.ts,
      pct: Math.min(100, Math.max(0, ((ms - startMs) / span) * 100)),
      path: pathFromUrl(e.url),
      eventType: e.eventType || "",
      action: e.action || "",
      formCategory: formatFormCategory(e.formCategory) || "",
      campaign: e.campaign || "",
    });
    bySource.set(key, lane);
  }

  return [...bySource.values()].sort((a, b) => b.touches.length - a.touches.length);
}

function buildJourneyRecord(group) {
  const {
    email,
    userId,
    mqlDate,
    leadStatus,
    lastCombinedScore,
    mainSegment,
    mainOwnerName,
    mainAccountName,
    nurtureReason,
    meetingOffered,
    meetingBooked,
    meetingOfferResult,
    conciergeTriggeredAt,
    conciergeStatus,
    events,
  } = group;

  const sorted = [...events].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const journeyStartAt = sorted[0]?.ts ?? mqlDate;
  const daysToMql = sorted[0]?.daysBeforeMql ?? null;
  const logoDomain = domainFromEmail(email);
  const sourceBreakdown = buildSourceBreakdown(sorted);
  const formCategoryBreakdown = buildFormCategoryBreakdown(sorted);
  const meta = {
    email,
    mqlDate,
    leadStatus,
    mainAccountName,
    meetingOffered,
    meetingBooked,
    meetingOfferResult,
    conciergeTriggeredAt,
    conciergeStatus,
  };

  return {
    id: mqlId(email, mqlDate),
    email,
    userId,
    mqlDate,
    leadStatus,
    lastCombinedScore,
    mainSegment,
    mainOwnerName,
    mainAccountName,
    nurtureReason: nurtureReason || null,
    logoDomain,
    logoUrl: logoUrlForDomain(logoDomain),
    faviconUrl: faviconUrlForDomain(logoDomain),
    accountInitials: initialsForAccount(mainAccountName),
    journeyStartAt,
    daysToMql,
    touchCount: sorted.length,
    uniqueSourceCount: sourceBreakdown.length,
    primarySource: sourceBreakdown[0]?.label ?? "Unknown",
    primaryFormCategory: formCategoryBreakdown[0]?.label ?? null,
    primaryCampaign:
      sorted.map((e) => e.campaign?.trim()).find(Boolean) ?? null,
    formCategoryBreakdown,
    meetingOffered,
    meetingBooked,
    meetingOfferResult: meetingOfferResult || null,
    conciergeTriggeredAt,
    conciergeStatus: conciergeStatus || null,
    sourceBreakdown,
    timeline: buildTimeline(sorted, meta),
    touchLanes: buildTouchLanes(sorted, journeyStartAt, mqlDate),
    events: sorted.map((e) => ({
      at: e.ts,
      daysBeforeMql: e.daysBeforeMql,
      url: e.url,
      path: pathFromUrl(e.url),
      eventType: e.eventType,
      action: e.action,
      source: e.source,
      medium: e.medium,
      campaign: e.campaign,
      formCategory: formatFormCategory(e.formCategory) || null,
    })),
  };
}

/**
 * Load pre-MQL journey data from CSV (one row per event before MQL).
 */
export async function loadPreMqlJourneysFromCsv(csvPath) {
  const text = await fs.readFile(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const col = (name) => header.indexOf(name);

  const groups = new Map();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < header.length) continue;

    const email = row[col("MQL_EMAIL")]?.trim();
    const mqlDateRaw = row[col("DATE_MQL")]?.trim();
    if (!email || !mqlDateRaw) continue;

    const mqlDate = parseTimestamp(mqlDateRaw) ?? mqlDateRaw;
    const id = mqlId(email, mqlDateRaw);
    const ts =
      parseTimestamp(row[col("PRE_MQL_EVENT_TIMESTAMP")]) ??
      row[col("PRE_MQL_EVENT_TIMESTAMP")]?.trim();

    if (!ts) continue;

    let group = groups.get(id);
    if (!group) {
      group = {
        email,
        userId: row[col("MQL_USER_ID")]?.trim() || null,
        mqlDate,
        mqlDateRaw,
        leadStatus: row[col("LEAD_STATUS")]?.trim() || "",
        lastCombinedScore: row[col("LAST_COMBINED_SCORE")]?.trim() || "",
        mainSegment: row[col("MAIN_SEGMENT")]?.trim() || "",
        mainOwnerName: row[col("MAIN_OWNER_NAME")]?.trim() || "",
        mainAccountName: row[col("MAIN_ACCOUNT_NAME")]?.trim() || "",
        nurtureReason: row[col("CURR_NURTURING_REASON")]?.trim() || "",
        meetingOffered: false,
        meetingBooked: false,
        meetingOfferResult: "",
        conciergeTriggeredAt: null,
        conciergeStatus: "",
        events: [],
      };
      groups.set(id, group);
    }

    if (truthy(row[col("WAS_MEETING_OFFERED")])) group.meetingOffered = true;
    if (truthy(row[col("IS_MEETING_BOOKED")])) group.meetingBooked = true;
    const offerResult = row[col("MEETING_OFFER_RESULT")]?.trim();
    if (offerResult) group.meetingOfferResult = offerResult;
    const conciergeAt = parseTimestamp(row[col("CONCIERGE_TRIGGERED_AT")]);
    if (conciergeAt) group.conciergeTriggeredAt = conciergeAt;
    const conciergeStatus = row[col("CONCIERGE_STATUS")]?.trim();
    if (conciergeStatus) group.conciergeStatus = conciergeStatus;

    group.events.push({
      ts,
      daysBeforeMql: Number(row[col("DAYS_BEFORE_MQL")]) || null,
      url: row[col("PAGEVIEW_URL")]?.trim() || "",
      formCategory: row[col("CONTAINER_CATEGORY")]?.trim() || "",
      eventType: row[col("CALC_EVENT_TYPE")]?.trim() || "",
      action: row[col("ACTION")]?.trim() || "",
      source: row[col("UTM_SOURCE_FILLED")]?.trim() || "",
      medium: row[col("UTM_MEDIUM_FILLED")]?.trim() || "",
      campaign: row[col("UTM_CAMPAIGN")]?.trim() || "",
      matchType: row[col("WEB_MATCH_TYPE")]?.trim() || "",
    });
  }

  return [...groups.values()]
    .map(buildJourneyRecord)
    .sort((a, b) => b.touchCount - a.touchCount);
}

export function summarizePreMqlList(journey) {
  return {
    id: journey.id,
    email: journey.email,
    mqlDate: journey.mqlDate,
    leadStatus: journey.leadStatus,
    lastCombinedScore: journey.lastCombinedScore,
    mainSegment: journey.mainSegment,
    mainOwnerName: journey.mainOwnerName,
    mainAccountName: journey.mainAccountName,
    logoDomain: journey.logoDomain,
    logoUrl: journey.logoUrl,
    faviconUrl: journey.faviconUrl,
    accountInitials: journey.accountInitials,
    journeyStartAt: journey.journeyStartAt,
    daysToMql: journey.daysToMql,
    touchCount: journey.touchCount,
    uniqueSourceCount: journey.uniqueSourceCount,
    primarySource: journey.primarySource,
    primaryFormCategory: journey.primaryFormCategory,
    meetingOffered: journey.meetingOffered,
    meetingBooked: journey.meetingBooked,
    meetingOfferResult: journey.meetingOfferResult,
    cpCalendarPresented: journey.cpCalendarPresented ?? false,
    cpMeetingBooked: journey.cpMeetingBooked ?? false,
    cpBookedAfterOffer: journey.cpBookedAfterOffer ?? false,
  };
}
