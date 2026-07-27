/** Behavioral activity point weights from New Lead Scoring Doc. Shared by static site + React. */
export const ACTIVITY_WEIGHTS = [
  {
    points: 100,
    tag: "Immediate tier 1",
    activities: [
      { name: "Request a demo form", aliases: "demo request filled form" },
      { name: "Pricing form", aliases: "pricing page filled form" },
      { name: "Contact form with Contact Sales as reason", aliases: "contact sales form" },
      { name: "Demo or learn-more request on webinars", aliases: "webinar demo learn more" },
      { name: "Demo or learn-more request at events", aliases: "event demo learn more" },
    ],
  },
  {
    points: 50,
    tag: "Immediate tier 2",
    activities: [
      { name: "Watch a Demo form", aliases: "wad watch demo" },
      { name: "Product tour", aliases: "tour" },
      { name: "ROI Calculator", aliases: "roi" },
      { name: "Attended a HiBob / Community event", aliases: "hibob community event attendance" },
    ],
  },
  {
    points: 35,
    tag: "6Sense booth bonus",
    activities: [
      {
        name: "Booth attendee with demographic A + Decision/Purchase stage",
        aliases: "6sense booth a decision purchase bonus",
      },
    ],
  },
  {
    points: 30,
    tag: "",
    activities: [{ name: "Watched 20+ seconds of the demo video", aliases: "demo video watch" }],
  },
  {
    points: 25,
    tag: "",
    activities: [
      { name: "Pre-MQL bonus for visiting BOFU pages", aliases: "bofu pre-mql bonus" },
    ],
  },
  {
    points: 15,
    tag: "Once per day cap",
    activities: [
      { name: "BOFU page visit or BOFU link click", aliases: "bofu visit click" },
      { name: "Content / Newsletter / Webinar form", aliases: "content newsletter webinar form nurture" },
      { name: "Influenced by a content syndication (CPL) campaign", aliases: "cpl content syndication" },
      { name: "Downloaded a High Value Asset", aliases: "hva high value asset download" },
    ],
  },
  {
    points: 10,
    tag: "Once per day cap",
    activities: [
      { name: "MOFU page visit", aliases: "mofu visit" },
      { name: "Attended at least 10 minutes on a live webinar", aliases: "webinar live 10 minutes" },
    ],
  },
  {
    points: 5,
    tag: "Max 3×/month — cannot reach MQL alone",
    activities: [{ name: "Clicked any link in an email", aliases: "email click link" }],
  },
];

export function flattenActivityWeights(rows = ACTIVITY_WEIGHTS) {
  return rows.flatMap((row) =>
    row.activities.map((activity) => ({
      points: row.points,
      tag: row.tag,
      name: typeof activity === "string" ? activity : activity.name,
      aliases: typeof activity === "string" ? "" : activity.aliases || "",
    })),
  );
}
