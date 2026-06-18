/**
 * Chili Piper–validated KPI definitions for the Pre-MQL Journey dashboard.
 */
export const CP_KPI_DEFINITIONS = [
  {
    kpi: "MQL contacts",
    source: "postmql.csv → loadPreMqlJourneysFromCsv",
    matchingKey: "hash(MQL_EMAIL + DATE_MQL)",
    timestampRule: "N/A",
    includedStatuses: "≥1 PRE_MQL_EVENT_TIMESTAMP row",
    excludedStatuses: "Rows missing email or MQL date",
    filter: "Full dataset; sidebar filters do not change KPI row",
  },
  {
    kpi: "Calendar presented / Offer tracked",
    source: "Chili Piper concierge log (Meeting_new.csv export, MCP-validated schema)",
    matchingKey: "guest email = MQL_EMAIL (lowercase)",
    timestampRule: "CONCIERGE_TRIGGERED_AT between journey start and DATE_MQL (inclusive)",
    includedStatuses:
      "Meeting Not Scheduled, Meeting Scheduled, Cancelled, Scheduling Meeting (calendar shown)",
    excludedStatuses: "Disqualified, Failed, sessions outside journey window",
    filter: "Unique MQL contact with ≥1 calendar-presented CP session in window",
  },
  {
    kpi: "Booked after presented",
    source: "Chili Piper concierge log — Meeting Scheduled status",
    matchingKey: "guest email = MQL_EMAIL",
    timestampRule:
      "earliest bookedAt ≥ earliest calendar-presented timestamp, same journey window",
    includedStatuses: "Meeting Scheduled",
    excludedStatuses:
      "Meeting Not Scheduled only, Disqualified, Cancelled without prior schedule in window",
    filter: "Calendar presented AND meeting booked with validated timestamp order",
  },
  {
    kpi: "Booked without presented",
    source: "Chili Piper concierge log",
    matchingKey: "guest email = MQL_EMAIL",
    timestampRule: "bookedAt in journey window; no calendar-presented session in window",
    includedStatuses: "Meeting Scheduled without prior calendar-presented session",
    excludedStatuses: "N/A",
    filter: "Meeting booked in CP with no calendar-presented CP session in window",
  },
  {
    kpi: "Offered but not booked",
    source: "Chili Piper concierge log",
    matchingKey: "guest email = MQL_EMAIL",
    timestampRule: "calendar-presented timestamp in journey window; no Meeting Scheduled",
    includedStatuses: "Meeting Not Scheduled, Cancelled (no schedule), Scheduling Meeting",
    excludedStatuses: "Meeting Scheduled, Disqualified-only",
    filter: "Calendar presented with no CP booking in window",
  },
  {
    kpi: "Concierge disqualified",
    source: "Chili Piper concierge log",
    matchingKey: "guest email = MQL_EMAIL",
    timestampRule: "Disqualified session in journey window",
    includedStatuses: "Disqualified",
    excludedStatuses: "Sessions with calendar presented in same window",
    filter: "Disqualified with no calendar presented in window",
  },
  {
    kpi: "Booking cancelled",
    source: "Chili Piper concierge log",
    matchingKey: "guest email = MQL_EMAIL",
    timestampRule: "Cancelled session in journey window",
    includedStatuses: "Cancelled",
    excludedStatuses: "N/A",
    filter: "Any Cancelled CP session in journey window (may overlap other buckets)",
  },
  {
    kpi: "Discovery Call",
    source: "postmql.csv LEAD_STATUS (latest on journey)",
    matchingKey: "MQL journey",
    timestampRule: "N/A",
    includedStatuses: "LEAD_STATUS matches /discovery\\s*call/i",
    excludedStatuses: "Other lead statuses",
    filter: "Current lead status field",
  },
  {
    kpi: "Avg pre-MQL touches",
    source: "postmql.csv event rows",
    matchingKey: "MQL journey",
    timestampRule: "PRE_MQL_EVENT_TIMESTAMP before DATE_MQL",
    includedStatuses: "All pre-MQL event rows",
    excludedStatuses: "N/A",
    filter: "sum(touchCount) / total MQL contacts",
  },
];

export const CSV_FIELD_SEMANTICS = [
  {
    field: "WAS_MEETING_OFFERED",
    meaning:
      "Concierge calendar was presented (includes timed-out and scheduled outcomes). Maps to CP statuses with calendar shown.",
    cpSource: "Concierge log — calendar-presented statuses",
    caveats: "OR-stamped across event rows; does not prove booking order.",
  },
  {
    field: "IS_MEETING_BOOKED",
    meaning:
      "NOT a reliable 'meeting scheduled' flag. Set TRUE on Disqualified, TimedOut, and Cancelled rows — not only Meeting Scheduled.",
    cpSource: "Use CP status = Meeting Scheduled instead",
    caveats:
      "3,452 CSV TRUE vs 1,309 CP Meeting Scheduled in journey window. Do not use for funnel KPIs.",
  },
  {
    field: "MEETING_OFFER_RESULT",
    meaning:
      "MeetingOfferScheduledLogResult = scheduled via concierge. MeetingOfferTimedOutResult = calendar shown, guest did not book.",
    cpSource: "Concierge log status + offer result",
    caveats: "TimedOut result does not mean booked.",
  },
  {
    field: "CONCIERGE_STATUS",
    meaning:
      "Terminal concierge session status: Scheduled, TimedOut, Disqualified, Cancelled, InProgress.",
    cpSource: "Chili Piper concierge log status field",
    caveats: "Mirrors CP; IS_MEETING_BOOKED can still be TRUE when status is TimedOut/Disqualified.",
  },
  {
    field: "CONCIERGE_TRIGGERED_AT",
    meaning: "Timestamp when the concierge session started (offer/booking attempt).",
    cpSource: "Chili Piper concierge log triggeredAt / export Date column",
    caveats: "Use for journey window matching with journey start → MQL date.",
  },
  {
    field: "MQL_EMAIL",
    meaning: "Primary match key to Chili Piper guest email.",
    cpSource: "concierge log guestEmail / Guest Email",
    caveats: "Secondary keys (CRM ID) available on CP export but not joined in this dataset.",
  },
  {
    field: "DATE_MQL",
    meaning: "MQL conversion timestamp — end of pre-MQL journey window.",
    cpSource: "N/A",
    caveats: "CP events after MQL date are excluded from pre-MQL KPIs.",
  },
  {
    field: "PRE_MQL_EVENT_TIMESTAMP",
    meaning: "Website touch timestamp before MQL.",
    cpSource: "N/A",
    caveats: "First touch defines journey start for CP window matching.",
  },
];

export function buildKpiValidation(
  journeys,
  summary,
  cpMeta = null,
  cpKpis = null,
  testLeadReport = null,
) {
  const cp = cpKpis?.counts ?? summary.cpMeeting ?? {};
  const timestampValidated = cpKpis?.timestampOrderValidated ?? false;

  const counts = {
    mqlContacts: journeys.length,
    calendarPresented: cp.calendarPresented ?? 0,
    meetingBooked: cp.meetingBooked ?? 0,
    bookedAfterOffer: cp.bookedAfterOffer ?? 0,
    bookedWithoutOffer: cp.bookedWithoutOffer ?? 0,
    offeredNotBooked: cp.offeredNotBooked ?? 0,
    conciergeDisqualified: cp.conciergeDisqualified ?? 0,
    bookingCancelled: cp.bookingCancelled ?? 0,
    cpMatched: cp.cpMatched ?? 0,
    cpUnmatched: cp.cpUnmatched ?? 0,
    csvOfferFlag: cp.csvOfferFlag ?? 0,
    csvBookFlag: cp.csvBookFlag ?? 0,
    discoveryCall: summary.discoveryCallCount ?? 0,
    avgTouches: summary.avgTouchesBeforeMql ?? 0,
    // legacy overlap for notes
    offeredOnly: cp.offeredNotBooked ?? 0,
    bookedOnly: cp.bookedWithoutOffer ?? 0,
    neither: (cp.cpUnmatched ?? 0) - (cp.csvOfferFlag ?? 0),
  };

  const countForKpi = (kpi) => {
    switch (kpi) {
      case "MQL contacts":
        return counts.mqlContacts;
      case "Calendar presented / Offer tracked":
        return counts.calendarPresented;
      case "Booked after presented":
        return counts.bookedAfterOffer;
      case "Booked without presented":
        return counts.bookedWithoutOffer;
      case "Offered but not booked":
        return counts.offeredNotBooked;
      case "Concierge disqualified":
        return counts.conciergeDisqualified;
      case "Booking cancelled":
        return counts.bookingCancelled;
      case "Discovery Call":
        return counts.discoveryCall;
      case "Avg pre-MQL touches":
        return counts.avgTouches;
      default:
        return 0;
    }
  };

  const definitions = CP_KPI_DEFINITIONS.map((def) => ({
    ...def,
    count: countForKpi(def.kpi),
  }));

  const samples = cpKpis?.samples ?? [];

  const notes = [
    "KPI row uses Chili Piper concierge log as source of truth (website log export / MCP schema).",
    testLeadReport?.totalExcludedLeads
      ? `Test/internal leads excluded: ${testLeadReport.totalExcludedLeads.toLocaleString()} contacts across ${testLeadReport.totalExcludedAccounts.toLocaleString()} accounts (see “View excluded test leads”).`
      : "Test/internal lead filter active; no exclusions in current dataset.",
    `CP match coverage: ${counts.cpMatched.toLocaleString()} of ${counts.mqlContacts.toLocaleString()} MQL contacts have ≥1 CP session between first touch and MQL date.`,
    `CSV IS_MEETING_BOOKED=TRUE on ${counts.csvBookFlag.toLocaleString()} contacts — inflated vs ${counts.meetingBooked.toLocaleString()} CP Meeting Scheduled in window. Do not use CSV booking flag for funnel KPIs.`,
    timestampValidated
      ? "Booked-after-presented uses validated timestamp order (bookedAt ≥ offerAt) for all counted contacts."
      : "Timestamp order could not be validated; booked-after-presented counts are zero.",
    cpMeta?.loadError
      ? `Chili Piper export warning: ${cpMeta.loadError}`
      : `Chili Piper data: ${cpMeta?.sessionCount?.toLocaleString() ?? "?"} sessions, ${cpMeta?.guestCount?.toLocaleString() ?? "?"} guest emails (${cpMeta?.schema ?? "unknown"} schema).`,
    "Sidebar MQL date filters affect the account list only, not the KPI row.",
  ];

  return {
    counts,
    definitions,
    samples,
    notes,
    csvFieldSemantics: CSV_FIELD_SEMANTICS,
    cpMeta,
    timestampOrderValidated: timestampValidated,
    bookAfterPresentRate: cpKpis?.bookAfterPresentRate ?? summary.bookAfterPresentRate ?? null,
    testLeadExclusions: testLeadReport
      ? {
          excludedLeads: testLeadReport.totalExcludedLeads,
          excludedAccounts: testLeadReport.totalExcludedAccounts,
          before: testLeadReport.before,
          after: testLeadReport.after,
        }
      : null,
  };
}
