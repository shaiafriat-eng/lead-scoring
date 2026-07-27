/** Behavioral score reduction rules (Marketo Behavioral Score Calculation). */
export const SCORE_REDUCTION_RULES = [
  {
    id: "blacklisted-country",
    scenario: "Blacklisted country",
    points: 0,
    why: "The person or account is in a restricted / high-risk country. Engagement should not keep the lead above MQL thresholds.",
  },
  {
    id: "not-relevant",
    scenario: "Not Relevant",
    points: 0,
    why: "The Salesforce account is marked Not Relevant. Sales should not work the lead, so behavioral points are cleared.",
  },
  {
    id: "unsubscribe",
    scenario: "Unsubscribe",
    points: 0,
    why: "The person opted out of email. Continuing to score engagement would misrepresent intent and risk compliance issues.",
  },
  {
    id: "nurture",
    scenario: "Nurture",
    points: null,
    why: "Sales parked the lead in Nurture. The reduced score depends on the nurture reason:",
    reasons: [
      {
        reason: "Migration",
        points: 10,
        why: "The account is mid-migration / not ready to buy now — keep a low residual score so they are not auto-MQLd again immediately.",
      },
      {
        reason: "Unresponsive",
        points: 10,
        why: "The lead stopped responding. Score is reduced so they fall out of active MQL priority until they re-engage.",
      },
      {
        reason: "Changes in personnel",
        points: 20,
        why: "The buying contact changed. Keep a modest score so the account can resurface when a new stakeholder engages.",
      },
      {
        reason: "No internal capacity",
        points: 20,
        why: "Timing is wrong (no bandwidth to evaluate). Keep a modest score rather than wiping intent entirely.",
      },
    ],
  },
];
