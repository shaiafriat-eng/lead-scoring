/** Join pre-MQL accounts with post-MQL return-visit data by email (server-side only). */

import { accountGroupKey } from "./account-logo.mjs";
import { regionFromCountry } from "./post-mql-region.mjs";
import { scoreMqlOutreach } from "./outreach-priority.mjs";

const OUTREACH_THRESHOLD = 55;

const HIGH_INTENT_FRAGMENTS = [
  "pricing",
  "book-a-demo",
  "book-demo",
  "free-trial",
  "/demo",
];

export function pathIsHighIntent(path) {
  const p = (path || "").toLowerCase();
  return HIGH_INTENT_FRAGMENTS.some((frag) => p.includes(frag));
}

export function pathCategory(path) {
  const p = (path || "").toLowerCase();
  if (/pricing|plans|price/.test(p)) return "pricing";
  if (/demo|book-a-demo|book-demo/.test(p)) return "demo";
  if (/trial|free-trial/.test(p)) return "trial";
  if (/product|platform|features|solutions/.test(p)) return "product";
  if (/blog|resources|guide|ebook|webinar/.test(p)) return "content";
  if (/careers|jobs/.test(p)) return "careers";
  return "other";
}

export function postMqlByEmail(journeys) {
  const map = new Map();
  for (const m of journeys) {
    if (m.email) map.set(m.email.toLowerCase(), m);
  }
  return map;
}

export function postHasReturns(post) {
  return (post?.visits?.length ?? 0) > 0;
}

/** All pre-MQL journeys grouped under one account row. */
export function journeysForAccount(account, preJourneys) {
  const key = accountGroupKey(account.accountName, account.logoDomain ?? null);
  return preJourneys.filter(
    (j) => accountGroupKey(j.mainAccountName, j.logoDomain ?? null) === key,
  );
}

function postEnrichment(post) {
  const visits = post?.visits ?? [];
  const lastReturn =
    visits.length > 0
      ? visits.reduce((latest, v) =>
          new Date(v.returnedAt) > new Date(latest) ? v.returnedAt : latest,
        visits[0].returnedAt)
      : null;

  let highIntentReturn = false;
  const pageCategories = new Set();
  for (const visit of visits) {
    for (const page of visit.pages ?? []) {
      if (pathIsHighIntent(page.path)) highIntentReturn = true;
      pageCategories.add(pathCategory(page.path));
    }
  }

  const outreach = post ? scoreMqlOutreach(post) : null;

  return {
    returnVisitCount: visits.length,
    returnPageViewCount: post?.returnPageViewCount ?? 0,
    lastReturn,
    hasPostMqlReturns: visits.length > 0,
    highIntentReturn,
    pageCategories: [...pageCategories],
    priorityScore: outreach?.priorityScore ?? 0,
    outreachTier: outreach?.tier ?? "none",
    outreachReasons: outreach?.reasons ?? [],
    highIntentPages: outreach?.highIntentPages ?? [],
  };
}

function pickBestRepresentative(returningPairs) {
  return returningPairs.slice().sort((a, b) => {
    const scoreA = scoreMqlOutreach(a.post)?.priorityScore ?? 0;
    const scoreB = scoreMqlOutreach(b.post)?.priorityScore ?? 0;
    const outreachA = scoreA >= OUTREACH_THRESHOLD;
    const outreachB = scoreB >= OUTREACH_THRESHOLD;
    if (outreachA !== outreachB) return outreachB ? 1 : -1;

    const hiA = postEnrichment(a.post).highIntentReturn;
    const hiB = postEnrichment(b.post).highIntentReturn;
    if (hiA !== hiB) return hiB ? 1 : -1;

    const viewsA = a.post?.returnPageViewCount ?? 0;
    const viewsB = b.post?.returnPageViewCount ?? 0;
    if (viewsA !== viewsB) return viewsB - viewsA;

    return (b.pre?.touchCount ?? 0) - (a.pre?.touchCount ?? 0);
  })[0];
}

/**
 * Resolve primary vs representative contact and account-level post-MQL aggregates.
 * Full Funnel uses any-contact account logic for hasPostMqlReturns; representative
 * contact is used for journey display (strongest full-funnel signal).
 */
export function resolveAccountFunnelContacts(account, preJourneys, postMap) {
  const journeys = journeysForAccount(account, preJourneys);
  const primary =
    preJourneys.find((j) => j.id === account.primaryJourneyId) ?? journeys[0] ?? null;

  const returningPairs = journeys
    .map((pre) => ({ pre, post: postMap.get(pre.email?.toLowerCase()) ?? null }))
    .filter(({ post }) => postHasReturns(post));

  const hasPostMqlReturns = returningPairs.length > 0;

  let representativePre = primary;
  let representativePost = primary?.email
    ? postMap.get(primary.email.toLowerCase()) ?? null
    : null;

  if (hasPostMqlReturns) {
    const best = pickBestRepresentative(returningPairs);
    representativePre = best.pre;
    representativePost = best.post;
  }

  const isRepresentativePrimary = representativePre?.id === primary?.id;

  let totalReturnVisits = 0;
  let totalReturnPageViews = 0;
  let anyHighIntent = false;
  let maxPriorityScore = 0;
  let bestOutreachTier = "none";
  const pageCategories = new Set();
  let lastReturn = null;
  const highIntentPages = new Set();

  for (const { post } of returningPairs) {
    const pe = postEnrichment(post);
    totalReturnVisits += pe.returnVisitCount;
    totalReturnPageViews += pe.returnPageViewCount;
    if (pe.highIntentReturn) anyHighIntent = true;
    if (pe.priorityScore > maxPriorityScore) {
      maxPriorityScore = pe.priorityScore;
      bestOutreachTier = pe.outreachTier;
    }
    for (const c of pe.pageCategories) pageCategories.add(c);
    for (const p of pe.highIntentPages ?? []) highIntentPages.add(p);
    if (
      pe.lastReturn &&
      (!lastReturn || new Date(pe.lastReturn) > new Date(lastReturn))
    ) {
      lastReturn = pe.lastReturn;
    }
  }

  const repPe = postEnrichment(representativePost);

  return {
    primary,
    representativePre,
    representativePost,
    isRepresentativePrimary,
    hasPostMqlReturns,
    totalReturnVisits,
    totalReturnPageViews,
    anyHighIntent,
    maxPriorityScore,
    bestOutreachTier: hasPostMqlReturns ? bestOutreachTier : "none",
    pageCategories: [...pageCategories],
    lastReturn,
    highIntentPages: [...highIntentPages],
    repPe,
  };
}

export function accountRegion(account, post) {
  if (post?.region?.trim()) return post.region;
  return regionFromCountry(account.country);
}

/** Enrich a grouped pre-MQL account with any-contact post-MQL metrics. */
export function enrichFullFunnelAccount(account, resolved) {
  const pre = resolved.representativePre;
  const post = resolved.representativePost;
  const region = accountRegion(account, post);

  return {
    id: account.id,
    accountName: account.accountName,
    logoDomain: account.logoDomain,
    logoUrl: account.logoUrl,
    faviconUrl: account.faviconUrl,
    initials: account.initials,
    mqlCount: account.mqlCount,
    touchCount: account.touchCount,
    primarySource: pre?.primarySource ?? account.primarySource ?? "Unknown",
    mainSegment: pre?.mainSegment ?? account.mainSegment ?? "",
    leadStatus: pre?.leadStatus ?? account.leadStatus ?? "",
    lastCombinedScore: pre?.lastCombinedScore ?? account.lastCombinedScore ?? null,
    mainOwnerName: pre?.mainOwnerName ?? account.mainOwnerName ?? null,
    primaryFormCategory: pre?.primaryFormCategory ?? account.primaryFormCategory ?? "",
    mqlDate: account.mqlDate,
    meetingOffered: account.meetingOffered,
    meetingBooked: account.meetingBooked,
    discoveryCall: account.discoveryCall,
    primaryJourneyId: account.primaryJourneyId,
    representativeJourneyId: pre?.id ?? account.primaryJourneyId,
    isRepresentativePrimary: resolved.isRepresentativePrimary,
    country: account.country ?? null,
    region,
    postMqlId: post?.id ?? null,
    returnVisitCount: resolved.totalReturnVisits,
    returnPageViewCount: resolved.totalReturnPageViews,
    lastReturn: resolved.lastReturn,
    hasPostMqlReturns: resolved.hasPostMqlReturns,
    highIntentReturn: resolved.anyHighIntent,
    pageCategories: resolved.pageCategories,
    priorityScore: resolved.maxPriorityScore,
    outreachTier: resolved.bestOutreachTier,
    outreachReasons: resolved.repPe.outreachReasons ?? [],
    highIntentPages: resolved.highIntentPages,
  };
}

export function buildFullFunnelAccounts(preAccounts, preJourneys, postMqlSummaries) {
  const postMap = postMqlByEmail(postMqlSummaries);

  return preAccounts.map((account) => {
    const resolved = resolveAccountFunnelContacts(account, preJourneys, postMap);
    return enrichFullFunnelAccount(account, resolved);
  });
}

export function summarizeFullFunnelAccount(account, postMap, preJourneys) {
  const resolved = resolveAccountFunnelContacts(account, preJourneys, postMap);
  return enrichFullFunnelAccount(account, resolved);
}
