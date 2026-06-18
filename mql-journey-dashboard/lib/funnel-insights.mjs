import { flattenPostMqlEvents } from "./touch-lanes.mjs";
import { pathIsHighIntent, buildFullFunnelAccounts, journeysForAccount } from "./full-funnel.mjs";

const OUTREACH_THRESHOLD = 55;

function topPagesFromPost(post) {
  const counts = new Map();
  for (const ev of flattenPostMqlEvents(post)) {
    const key = ev.path || "(unknown)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function recommendedAction(insights) {
  const score = insights.priorityScore ?? 0;
  if (score >= 80) return "SDR follow-up today";
  if (score >= OUTREACH_THRESHOLD) return "Prioritize outreach this week";
  if (insights.hasPostReturns && insights.highIntentReturn) {
    return "Monitor high-intent return activity";
  }
  if (insights.hasPostReturns) return "Monitor return activity";
  if ((insights.preTouchCount ?? 0) > 0) return "Nurture — no post-MQL returns yet";
  return "Review pre-MQL journey";
}

/** Per-account funnel insights for the full-funnel dashboard. */
export function computeAccountFunnelInsights(account, pre, post, touchJourney, enriched = null) {
  const postPages = topPagesFromPost(post);
  const outreach = enriched ?? {};
  const region = outreach.region ?? pre?.region ?? null;

  const insights = {
    accountName: account.accountName,
    logoDomain: account.logoDomain,
    country: account.country ?? null,
    region,
    preTouchCount: touchJourney?.preTouchCount ?? pre?.touchCount ?? 0,
    postPageViews:
      outreach.returnPageViewCount ?? touchJourney?.postTouchCount ?? 0,
    postReturnVisits: outreach.returnVisitCount ?? post?.visits?.length ?? 0,
    hasPostReturns:
      outreach.hasPostMqlReturns ?? Boolean(touchJourney?.hasPostReturns),
    daysToMql: pre?.daysToMql ?? null,
    primarySource: pre?.primarySource ?? account.primarySource ?? "Unknown",
    primaryFormCategory: pre?.primaryFormCategory ?? account.primaryFormCategory ?? null,
    segment: pre?.mainSegment ?? post?.mainSegment ?? account.mainSegment ?? null,
    owner: pre?.mainOwnerName ?? account.mainOwnerName ?? null,
    leadStatus: pre?.leadStatus ?? post?.leadStatus ?? account.leadStatus ?? null,
    score: pre?.lastCombinedScore ?? account.lastCombinedScore ?? null,
    meetingOffered: Boolean(pre?.meetingOffered ?? account.meetingOffered),
    meetingBooked: Boolean(pre?.meetingBooked ?? account.meetingBooked),
    meetingOfferResult: pre?.meetingOfferResult ?? account.meetingOfferResult ?? null,
    discoveryCall: Boolean(account.discoveryCall),
    preSources: (pre?.sourceBreakdown ?? []).slice(0, 8),
    postPages,
    mqlPct: touchJourney?.mqlPct ?? null,
    journeyStartAt: touchJourney?.journeyStartAt ?? pre?.journeyStartAt ?? null,
    mqlDate: touchJourney?.mqlDate ?? pre?.mqlDate ?? null,
    latestAt: touchJourney?.latestAt ?? null,
    priorityScore: outreach.priorityScore ?? 0,
    outreachTier: outreach.outreachTier ?? "none",
    highIntentReturn: Boolean(outreach.highIntentReturn),
    highIntentPages: outreach.highIntentPages ?? [],
    pageCategories: outreach.pageCategories ?? [],
    lastReturn: outreach.lastReturn ?? null,
    isRepresentativePrimary: enriched?.isRepresentativePrimary ?? true,
    representativeJourneyId: enriched?.representativeJourneyId ?? pre?.id ?? null,
  };

  if (!insights.isRepresentativePrimary && insights.hasPostReturns) {
    insights.representativeNote =
      "Post-MQL return activity came from another MQL contact on this account.";
  }

  insights.recommendedAction = recommendedAction(insights);
  return insights;
}

/** Aggregate KPIs for full-funnel header / insights. */
export function computeFullFunnelSummary(accounts, preJourneys, postJourneys) {
  const enriched = buildFullFunnelAccounts(accounts, preJourneys, postJourneys);
  const preById = new Map(preJourneys.map((j) => [j.id, j]));

  let withReturns = 0;
  let totalPreTouches = 0;
  let totalPostViews = 0;
  let becameMqlCount = 0;
  const bySegment = new Map();
  const byPreSource = new Map();

  for (const acc of enriched) {
    if (acc.hasPostMqlReturns) withReturns += 1;
    totalPreTouches += acc.touchCount ?? 0;
    becameMqlCount += acc.mqlCount ?? 0;
    totalPostViews += acc.returnPageViewCount ?? 0;

    const pre = preById.get(acc.representativeJourneyId ?? acc.primaryJourneyId);
    bump(bySegment, acc.mainSegment || "Unknown");
    if (pre?.primarySource ?? acc.primarySource) {
      bump(byPreSource, pre?.primarySource ?? acc.primarySource);
    }
  }

  return {
    accountCount: accounts.length,
    becameMqlCount,
    withPostReturns: withReturns,
    withoutPostReturns: accounts.length - withReturns,
    returnRate:
      accounts.length > 0
        ? Math.round((withReturns / accounts.length) * 1000) / 10
        : 0,
    avgPreTouches:
      accounts.length > 0
        ? Math.round((totalPreTouches / accounts.length) * 10) / 10
        : 0,
    avgPostPageViews:
      withReturns > 0 ? Math.round((totalPostViews / withReturns) * 10) / 10 : 0,
    bySegment: toSorted(bySegment).slice(0, 8),
    byPreSource: toSorted(byPreSource).slice(0, 8),
  };
}

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toSorted(map) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function bumpAccounts(map, label, accountId) {
  const key = label || "(empty)";
  if (!map.has(key)) map.set(key, { label: key, count: 0, accountIds: new Set() });
  const row = map.get(key);
  row.count += 1;
  row.accountIds.add(accountId);
}

function finalizeBreakdown(map, limit) {
  return [...map.values()]
    .map(({ label, count, accountIds }) => ({
      label,
      count,
      accountIds: [...accountIds],
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** Account-level breakdowns for filtered insights footer. */
export function computeFullFunnelBreakdowns(enrichedAccounts, preJourneys, postJourneys, limit = 12) {
  const preById = new Map(preJourneys.map((j) => [j.id, j]));
  const postByEmail = new Map();
  for (const p of postJourneys) {
    if (p.email) postByEmail.set(p.email.toLowerCase(), p);
  }

  const preSource = new Map();
  const postPages = new Map();
  const leadStatus = new Map();
  const region = new Map();
  const segment = new Map();
  const owner = new Map();
  const outreach = new Map();

  const tierLabel = {
    immediate: "Immediate outreach",
    soon: "Outreach soon",
    watch: "Watch",
    none: "No post-MQL returns",
  };

  for (const acc of enrichedAccounts) {
    const pre = preById.get(acc.representativeJourneyId ?? acc.primaryJourneyId);
    const accountJourneys = journeysForAccount(acc, preJourneys);

    bumpAccounts(leadStatus, acc.leadStatus ?? pre?.leadStatus, acc.id);
    bumpAccounts(region, acc.region ?? "Unknown region", acc.id);
    bumpAccounts(segment, acc.mainSegment ?? pre?.mainSegment, acc.id);
    bumpAccounts(owner, acc.mainOwnerName ?? pre?.mainOwnerName, acc.id);
    bumpAccounts(outreach, tierLabel[acc.outreachTier] ?? tierLabel.none, acc.id);

    if (pre?.sourceBreakdown?.length) {
      for (const src of pre.sourceBreakdown) {
        bumpAccounts(preSource, src.label, acc.id);
      }
    } else {
      bumpAccounts(preSource, acc.primarySource ?? "Unknown", acc.id);
    }

    for (const journey of accountJourneys) {
      const post = postByEmail.get(journey.email?.toLowerCase());
      for (const ev of flattenPostMqlEvents(post)) {
        const path = ev.path || "(unknown)";
        if (!postPages.has(path)) {
          postPages.set(path, { label: path, count: 0, views: 0, accountIds: new Set() });
        }
        const row = postPages.get(path);
        row.views += 1;
        row.accountIds.add(acc.id);
      }
    }
  }

  for (const row of postPages.values()) {
    row.count = row.accountIds.size;
  }

  const postPageRows = [...postPages.values()]
    .map(({ label, count, views, accountIds }) => ({
      label,
      path: label,
      count,
      views,
      accountIds: [...accountIds],
    }))
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, limit);

  const highIntentPages = postPageRows.filter((p) => pathIsHighIntent(p.path));

  return {
    preSource: finalizeBreakdown(preSource, limit),
    postPages: postPageRows,
    highIntentPages,
    leadStatus: finalizeBreakdown(leadStatus, limit),
    region: finalizeBreakdown(region, limit),
    segment: finalizeBreakdown(segment, limit),
    owner: finalizeBreakdown(owner, limit),
    outreach: finalizeBreakdown(outreach, limit),
  };
}
