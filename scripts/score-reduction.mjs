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
    points: 0,
    why: "Sales parked the lead in Nurture. Behavioral score is reduced to 0 by default.",
    reasons: [
      {
        reason: "Migration",
        points: 10,
        why: "Mid-migration / not ready to buy — score is set to 10 so the lead is not auto-MQLd again immediately.",
      },
      {
        reason: "Unresponsive",
        points: 10,
        why: "Lead stopped responding — score is set to 10 until they re-engage.",
      },
      {
        reason: "Changes in personnel",
        points: 20,
        why: "Buying contact changed — score is set to 20 so the account can resurface with a new stakeholder.",
      },
      {
        reason: "No internal capacity",
        points: 20,
        why: "Timing is wrong (no bandwidth) — score is set to 20 rather than wiping intent entirely.",
      },
    ],
  },
];
