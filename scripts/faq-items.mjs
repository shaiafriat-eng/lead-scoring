/** Shared FAQ copy for React app and static site build. */
export const MQL_POINT_THRESHOLD = 100;

export const FAQ_ITEMS = [
  {
    q: "What is lead scoring?",
    a: "A structured way to rank leads by fit (demographic A–D) and engagement (behavioral 1–4) so Marketing and Sales prioritize outreach and MQL routing based on expected conversion—not a single point total alone.",
  },
  {
    q: "What is the MQL point threshold?",
    a: `Leads typically need ${MQL_POINT_THRESHOLD}+ points in the Behavioral Score Calculation field to reach MQL-eligible engagement tiers, combined with demographic grade and channel-specific auto-MQL rules.`,
  },
  {
    q: "How is the behavioral score calculated?",
    a: "Activities earn points in Marketo (Behavioral Score Calculation field). Point totals map to tiers: 100+ → 1, 50–99 → 2, 15–49 → 3, 0–14 → 4. Scores update as people engage.",
  },
  {
    q: "Can email clicks alone create an MQL?",
    a: `No. Email link clicks (+5, max 3× per month) cannot reach the ${MQL_POINT_THRESHOLD}-point MQL threshold by themselves.`,
  },
  {
    q: "Why wasn't my lead MQL'd?",
    a: "Common blockers: grade D or junk/DQ flags, points below 100 without a qualifying channel combo, activity-based paths limited to A1/B1 only, WAD exclusions (e.g. D3), excluded sources (ROI calculator, New Movers asset), or booth rules (only A + Decision/Purchase bonus). See Why not MQL. If you still believe the lead should have MQL'd, follow Manual MQL review.",
  },
  {
    q: "How do I request a manual MQL review?",
    a: "Run the self-check in Why not MQL, gather lead IDs, scores, source, and recent activities, then submit to Marketing Ops / RevOps via your team’s standard intake. See the Manual MQL review section for the full checklist and outcomes.",
  },
  {
    q: "How are junk or fake leads identified?",
    a: "Leads are screened for test/fake data, invalid emails, QA/UAT records, restricted countries, failed qualification, and low-quality email signals—with exceptions for approved domains and reviewed records.",
  },
  {
    q: "Why didn't every ICP booth attendee become an MQL?",
    a: "After a 2023 pilot overload, only top booth attendees qualify: demographic A plus 6Sense Decision/Purchase stage receive a +35 bonus (with attendance points) to surface the top ~5% of booth traffic.",
  },
  {
    q: "Why does ICP sometimes show FALSE for new contacts?",
    a: "Salesforce ICP can take ~24 hours to calculate. Marketo ICP scoring is used interim until SFDC updates.",
  },
  {
    q: "Can a lead score decrease?",
    a: "Yes—in two ways. Demographic grade (A–D) can worsen when account or persona data changes—for example ICP status, account marked Not Relevant/Competitor/Customer, employee-count band, job title or function updates, or junk/DQ flags. Behavioral tier (1–4) can also move down when engagement changes in Marketo, since tiers map to point ranges in Behavioral Score Calculation (100+ → 1, 50–99 → 2, 15–49 → 3, 0–14 → 4). Activities add points and stack over time; this guide documents how points are earned, not automatic decay. Confirm any score-reset or decay rules in live Marketo programs with Marketing Ops.",
  },
  {
    q: "Where can I see the full process flow?",
    a: "See the linked Miro board for the end-to-end lead scoring flow maintained by RevOps/Marketing Ops.",
  },
];
