import {
  accountDisplayName,
  accountGroupId,
  accountGroupKey,
  faviconUrlForDomain,
  initialsForAccount,
  logoUrlForDomain,
  pickBestDomain,
} from "./account-logo.mjs";

/**
 * Group individual MQL journeys into account-level rows for the dashboard.
 */
export function groupJourneysByAccount(journeys) {
  const groups = new Map();

  for (const journey of journeys) {
    const domain = journey.logoDomain ?? null;
    const key = accountGroupKey(journey.mainAccountName, domain);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        id: accountGroupId(key),
        accountName: accountDisplayName(journey.mainAccountName),
        emails: new Set(),
        journeys: [],
      };
      groups.set(key, group);
    }
    group.emails.add(journey.email);
    group.journeys.push(journey);
  }

  return [...groups.values()]
    .map((group) => {
      const journeysSorted = [...group.journeys].sort(
        (a, b) => b.touchCount - a.touchCount,
      );
      const primary = journeysSorted[0];
      const logoDomain = pickBestDomain([...group.emails]);
      const meetingOffered = group.journeys.some(
        (j) => j.cpCalendarPresented ?? j.meetingOffered,
      );
      const meetingBooked = group.journeys.some(
        (j) => j.cpMeetingBooked ?? j.meetingBooked,
      );
      const discoveryCall = group.journeys.some((j) =>
        /discovery\s*call/i.test(j.leadStatus || ""),
      );
      const touchCount = group.journeys.reduce((sum, j) => sum + j.touchCount, 0);
      const latestMql = group.journeys.reduce((latest, j) =>
        !latest || new Date(j.mqlDate) > new Date(latest) ? j.mqlDate : latest,
      null);

      return {
        id: group.id,
        accountName: group.accountName,
        logoDomain,
        logoUrl: logoUrlForDomain(logoDomain),
        faviconUrl: faviconUrlForDomain(logoDomain),
        initials: initialsForAccount(group.accountName),
        mqlCount: group.journeys.length,
        touchCount,
        uniqueSourceCount: primary.uniqueSourceCount,
        primarySource: primary.primarySource,
        journeyStartAt: primary.journeyStartAt,
        mqlDate: latestMql,
        daysToMql: primary.daysToMql,
        leadStatus: primary.leadStatus,
        lastCombinedScore: primary.lastCombinedScore,
        mainSegment: primary.mainSegment,
        mainOwnerName: primary.mainOwnerName,
        meetingOffered,
        meetingBooked,
        meetingOfferResult: primary.meetingOfferResult,
        primaryFormCategory: primary.primaryFormCategory,
        discoveryCall,
        primaryJourneyId: primary.id,
      };
    })
    .sort((a, b) => b.touchCount - a.touchCount);
}

export function summarizePreMqlAccount(account) {
  return {
    id: account.id,
    accountName: account.accountName,
    logoDomain: account.logoDomain,
    logoUrl: account.logoUrl,
    faviconUrl: account.faviconUrl,
    initials: account.initials,
    mqlCount: account.mqlCount,
    touchCount: account.touchCount,
    uniqueSourceCount: account.uniqueSourceCount,
    primarySource: account.primarySource,
    primaryFormCategory: account.primaryFormCategory,
    journeyStartAt: account.journeyStartAt,
    mqlDate: account.mqlDate,
    daysToMql: account.daysToMql,
    leadStatus: account.leadStatus,
    lastCombinedScore: account.lastCombinedScore,
    mainSegment: account.mainSegment,
    mainOwnerName: account.mainOwnerName,
    meetingOffered: account.meetingOffered,
    meetingBooked: account.meetingBooked,
    meetingOfferResult: account.meetingOfferResult,
    discoveryCall: account.discoveryCall,
    primaryJourneyId: account.primaryJourneyId,
    country: account.country ?? null,
    scoreGrade: account.scoreGrade ?? null,
    primaryCampaign: account.primaryCampaign ?? null,
  };
}

export function accountJourneyPayload(account, journey) {
  const { email: _email, ...journeyPublic } = journey;
  return {
    ...journeyPublic,
    account: {
      id: account.id,
      accountName: account.accountName,
      logoDomain: account.logoDomain,
      logoUrl: account.logoUrl,
      faviconUrl: account.faviconUrl,
      initials: account.initials,
      mqlCount: account.mqlCount,
      country: account.country ?? null,
    },
  };
}
