import {
  cpSessionsInJourneyWindow,
  isCalendarPresentedStatus,
  isMeetingBookedStatus,
} from "./pre-mql-cp-guest-index.mjs";

function parseInstant(value) {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function earliestTimestamp(sessions, predicate) {
  const hits = sessions.filter(predicate).map((s) => parseInstant(s.triggeredAt)).filter(Boolean);
  if (!hits.length) return null;
  return new Date(Math.min(...hits.map((d) => d.getTime()))).toISOString();
}

/**
 * Classify one MQL journey against Chili Piper concierge sessions.
 * @param {object} journey
 * @param {Map<string, object[]>} guestIndex
 */
export function classifyJourneyCpMeeting(journey, guestIndex) {
  const sessions = cpSessionsInJourneyWindow(guestIndex, journey);
  const cpMatched = sessions.length > 0;

  const calendarSessions = sessions.filter((s) => s.calendarPresented);
  const bookedSessions = sessions.filter((s) => s.meetingBooked);
  const disqualifiedSessions = sessions.filter((s) => s.disqualified);
  const canceledSessions = sessions.filter((s) => s.canceled);

  const offerAt = earliestTimestamp(sessions, (s) => s.calendarPresented);
  const bookAt = earliestTimestamp(sessions, (s) => s.meetingBooked);

  const calendarPresented = calendarSessions.length > 0;
  const meetingBooked = bookedSessions.length > 0;
  const bookedAfterOffer =
    calendarPresented &&
    meetingBooked &&
    offerAt &&
    bookAt &&
    parseInstant(bookAt) >= parseInstant(offerAt);

  const offeredNotBooked = calendarPresented && !meetingBooked;
  const bookedWithoutOffer = meetingBooked && !calendarPresented;
  const conciergeDisqualified = disqualifiedSessions.length > 0 && !calendarPresented;
  const bookingCancelled = canceledSessions.length > 0;

  const primaryStatus =
    bookedSessions[0]?.mappedStatus ??
    calendarSessions[0]?.mappedStatus ??
    disqualifiedSessions[0]?.mappedStatus ??
    sessions[0]?.mappedStatus ??
    null;

  return {
    cpMatched,
    calendarPresented,
    meetingBooked,
    bookedAfterOffer,
    offeredNotBooked,
    bookedWithoutOffer,
    conciergeDisqualified,
    bookingCancelled,
    offerAt,
    bookAt,
    cpStatus: primaryStatus,
    cpSessionCount: sessions.length,
    timestampOrderValidated: Boolean(bookedAfterOffer),
  };
}

export function aggregatePreMqlMeetingKpis(journeys, guestIndex) {
  const counts = {
    mqlContacts: journeys.length,
    calendarPresented: 0,
    meetingBooked: 0,
    bookedAfterOffer: 0,
    bookedWithoutOffer: 0,
    offeredNotBooked: 0,
    conciergeDisqualified: 0,
    bookingCancelled: 0,
    cpMatched: 0,
    cpUnmatched: 0,
    csvOfferFlag: 0,
    csvBookFlag: 0,
  };

  const perJourney = [];

  for (const journey of journeys) {
    const cp = classifyJourneyCpMeeting(journey, guestIndex);
    perJourney.push({ journey, cp });

    if (journey.meetingOffered) counts.csvOfferFlag += 1;
    if (journey.meetingBooked) counts.csvBookFlag += 1;

    if (cp.cpMatched) counts.cpMatched += 1;
    else counts.cpUnmatched += 1;

    if (cp.calendarPresented) counts.calendarPresented += 1;
    if (cp.meetingBooked) counts.meetingBooked += 1;
    if (cp.bookedAfterOffer) counts.bookedAfterOffer += 1;
    if (cp.bookedWithoutOffer) counts.bookedWithoutOffer += 1;
    if (cp.offeredNotBooked) counts.offeredNotBooked += 1;
    if (cp.conciergeDisqualified) counts.conciergeDisqualified += 1;
    if (cp.bookingCancelled) counts.bookingCancelled += 1;
  }

  const bookAfterPresentRate =
    counts.calendarPresented > 0
      ? Math.round((counts.bookedAfterOffer / counts.calendarPresented) * 1000) / 10
      : null;

  return {
    counts,
    perJourney,
    timestampOrderValidated: counts.bookedAfterOffer > 0,
    bookAfterPresentRate,
  };
}

/** Enrich journey objects with CP meeting fields for filters and journey cards. */
export function enrichJourneysWithCpMeeting(journeys, guestIndex) {
  return journeys.map((journey) => {
    const cp = classifyJourneyCpMeeting(journey, guestIndex);
    return {
      ...journey,
      cpCalendarPresented: cp.calendarPresented,
      cpMeetingBooked: cp.meetingBooked,
      cpBookedAfterOffer: cp.bookedAfterOffer,
      cpOfferAt: cp.offerAt,
      cpBookAt: cp.bookAt,
      cpStatus: cp.cpStatus,
      cpMatched: cp.cpMatched,
      cpBookingCancelled: cp.bookingCancelled,
    };
  });
}

export function pickCpValidationSamples(perJourney, limit = 10) {
  const buckets = [
    (x) => x.cp.bookedAfterOffer,
    (x) => x.cp.offeredNotBooked,
    (x) => x.cp.bookedWithoutOffer,
    (x) => x.cp.conciergeDisqualified,
    (x) => !x.cp.cpMatched && x.journey.meetingBooked,
    (x) => !x.cp.cpMatched && !x.journey.meetingBooked,
  ];

  const picked = [];
  const seen = new Set();

  for (const pred of buckets) {
    for (const row of perJourney) {
      if (!pred(row)) continue;
      const key = row.journey.id;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(row);
      if (picked.length >= limit) return picked.map(toSampleRow);
    }
  }

  return picked.slice(0, limit).map(toSampleRow);
}

function toSampleRow({ journey: j, cp }) {
  return {
    email: j.email,
    account: j.mainAccountName,
    mqlDate: j.mqlDate,
    cpOfferAt: cp.offerAt,
    cpBookAt: cp.bookAt,
    cpStatus: cp.cpStatus,
    meetingOfferResult: j.meetingOfferResult || "",
    conciergeStatus: j.conciergeStatus || "",
    calendarPresented: cp.calendarPresented,
    meetingBooked: cp.meetingBooked,
    bookedAfterOffer: cp.bookedAfterOffer,
    bookedWithoutOffer: cp.bookedWithoutOffer,
    csvOfferFlag: j.meetingOffered,
    csvBookFlag: j.meetingBooked,
    cpMatched: cp.cpMatched,
  };
}
