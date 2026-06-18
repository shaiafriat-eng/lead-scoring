/**
 * Aggregate KPIs and breakdowns for the pre-MQL journey dashboard.
 */
export function computePreMqlSummary(journeys, cpKpis = null) {
  const totalMqls = journeys.length;
  let discoveryCallCount = 0;
  let totalDaysToMql = 0;
  let daysCount = 0;
  let totalTouches = 0;

  const bySource = new Map();
  const byLeadStatus = new Map();
  const byOfferResult = new Map();
  const bySegment = new Map();
  const byFormCategory = new Map();

  for (const j of journeys) {
    if (/discovery\s*call/i.test(j.leadStatus || "")) discoveryCallCount += 1;

    if (j.daysToMql != null && !Number.isNaN(j.daysToMql)) {
      totalDaysToMql += j.daysToMql;
      daysCount += 1;
    }
    totalTouches += j.touchCount;

    bump(byLeadStatus, j.leadStatus || "Unknown");
    bump(bySegment, j.mainSegment || "Unknown");

    if (j.meetingOffered && j.meetingOfferResult) {
      bump(byOfferResult, j.meetingOfferResult);
    }

    for (const fc of j.formCategoryBreakdown ?? []) {
      const existing = byFormCategory.get(fc.label) ?? {
        label: fc.label,
        touchCount: 0,
        mqlCount: 0,
      };
      existing.touchCount += fc.count;
      existing.mqlCount += 1;
      byFormCategory.set(fc.label, existing);
    }

    for (const s of j.sourceBreakdown) {
      const existing = bySource.get(s.label) ?? {
        label: s.label,
        source: s.source,
        medium: s.medium,
        touchCount: 0,
        mqlCount: 0,
      };
      existing.touchCount += s.count;
      existing.mqlCount += 1;
      bySource.set(s.label, existing);
    }
  }

  const cp = cpKpis?.counts ?? {};
  const meetingOfferedCount = cp.calendarPresented ?? 0;
  const meetingBookedCount = cp.meetingBooked ?? 0;
  const meetingBookedAfterOfferCount = cp.bookedAfterOffer ?? 0;
  const bookedWithoutOfferCount = cp.bookedWithoutOffer ?? 0;
  const offeredNotBooked = cp.offeredNotBooked ?? 0;

  return {
    totalMqls,
    totalTouches,
    avgTouchesBeforeMql:
      totalMqls > 0 ? Math.round((totalTouches / totalMqls) * 10) / 10 : 0,
    avgDaysToMql:
      daysCount > 0 ? Math.round((totalDaysToMql / daysCount) * 10) / 10 : null,
    meetingOfferedCount,
    meetingBookedAfterOfferCount,
    meetingBookedCount,
    offeredNotBooked,
    offerToBookRate:
      meetingOfferedCount > 0
        ? Math.round(
            (meetingBookedAfterOfferCount / meetingOfferedCount) * 1000,
          ) / 10
        : null,
    bookAfterPresentRate: cpKpis?.bookAfterPresentRate ?? null,
    bookedWithoutOfferCount,
    offeredNotBookedCount: offeredNotBooked,
    conciergeDisqualifiedCount: cp.conciergeDisqualified ?? 0,
    bookingCancelledCount: cp.bookingCancelled ?? 0,
    cpMatchedCount: cp.cpMatched ?? 0,
    cpUnmatchedCount: cp.cpUnmatched ?? 0,
    csvBookFlagCount: cp.csvBookFlag ?? 0,
    timestampOrderValidated: cpKpis?.timestampOrderValidated ?? false,
    cpMeeting: cp,
    discoveryCallCount,
    bySource: [...bySource.values()]
      .sort((a, b) => b.touchCount - a.touchCount)
      .slice(0, 20),
    byLeadStatus: toSortedList(byLeadStatus),
    bySegment: toSortedList(bySegment).slice(0, 15),
    byOfferResult: toSortedList(byOfferResult),
    byFormCategory: [...byFormCategory.values()]
      .sort((a, b) => b.touchCount - a.touchCount)
      .slice(0, 15),
  };
}

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toSortedList(map) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
