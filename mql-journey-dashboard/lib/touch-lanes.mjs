function pathFromUrl(url) {
  if (!url?.trim()) return "(unknown page)";
  try {
    const u = new URL(url.trim());
    return u.pathname + (u.hash || "");
  } catch {
    return url.trim();
  }
}

function pathLaneLabel(path) {
  if (!path || path === "(unknown page)") return "Unknown page";
  return path;
}

function pathLaneKey(path) {
  return path || "(unknown page)";
}

function pctOnSpan(at, startMs, span) {
  const ms = new Date(at).getTime();
  return Math.min(100, Math.max(0, ((ms - startMs) / span) * 100));
}

function remapLanesToSpan(lanes, startMs, span, phase) {
  return (lanes ?? []).map((lane) => ({
    ...lane,
    phase,
    touches: (lane.touches ?? []).map((t) => ({
      ...t,
      pct: pctOnSpan(t.at, startMs, span),
      globalPct: pctOnSpan(t.at, startMs, span),
    })),
  }));
}

/** Flatten post-MQL visits into chronological page-view events. */
export function flattenPostMqlEvents(journey) {
  const events = [];
  for (const visit of journey?.visits ?? []) {
    for (const page of visit.pages ?? []) {
      events.push({
        at: page.viewedAt,
        path: page.path || "(unknown page)",
        title: page.title || "",
        url: page.url || null,
      });
    }
  }
  return events.sort((a, b) => new Date(a.at) - new Date(b.at));
}

/** Post-MQL touch lanes — one lane per page path the lead visited after MQL. */
export function buildPostMqlTouchLanes(journey) {
  const sorted = flattenPostMqlEvents(journey);
  if (!sorted.length) {
    return {
      touchLanes: [],
      eventCount: 0,
      spanStart: journey.mqlDate,
      spanEnd: journey.mqlDate,
    };
  }

  const startMs = new Date(journey.mqlDate).getTime();
  const endMs = new Date(sorted[sorted.length - 1].at).getTime();
  const span = Math.max(endMs - startMs, 1);
  const byPath = new Map();

  for (const ev of sorted) {
    const key = pathLaneKey(ev.path);
    const lane = byPath.get(key) ?? {
      source: key,
      medium: "",
      label: pathLaneLabel(ev.path),
      touches: [],
    };
    lane.touches.push({
      at: ev.at,
      pct: pctOnSpan(ev.at, startMs, span),
      path: ev.path,
      eventType: "Page view",
      action: ev.title || "",
      formCategory: "",
      campaign: "",
    });
    byPath.set(key, lane);
  }

  return {
    touchLanes: [...byPath.values()].sort((a, b) => b.touches.length - a.touches.length),
    eventCount: sorted.length,
    spanStart: journey.mqlDate,
    spanEnd: sorted[sorted.length - 1].at,
  };
}

/** Pre + post on one timeline with an MQL marker. */
export function buildFullFunnelTouchJourney(preJourney, postJourney) {
  const journeyStartAt = preJourney?.journeyStartAt ?? preJourney?.mqlDate;
  const mqlDate = preJourney?.mqlDate;
  const startMs = new Date(journeyStartAt).getTime();
  const mqlMs = new Date(mqlDate).getTime();
  const postEvents = flattenPostMqlEvents(postJourney);
  const endMs = postEvents.length
    ? Math.max(mqlMs, ...postEvents.map((e) => new Date(e.at).getTime()))
    : mqlMs;
  const span = Math.max(endMs - startMs, 1);
  const mqlPct = pctOnSpan(mqlDate, startMs, span);

  const preLanes = remapLanesToSpan(preJourney?.touchLanes, startMs, span, "pre");
  const postBuilt = postJourney ? buildPostMqlTouchLanes(postJourney) : { touchLanes: [] };
  const postLanes = remapLanesToSpan(postBuilt.touchLanes, startMs, span, "post");

  return {
    journeyStartAt,
    mqlDate,
    latestAt: new Date(endMs).toISOString(),
    mqlPct,
    preLanes,
    postLanes,
    preTouchCount: preJourney?.touchCount ?? 0,
    postTouchCount: postEvents.length,
    hasPostReturns: postEvents.length > 0,
  };
}

export { pathFromUrl };
