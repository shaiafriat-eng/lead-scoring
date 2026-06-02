export const MIRO_BOARD_URL =
  "https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622";

export const MIRO_EMBED_URL =
  "https://miro.com/app/live-embed/uXjVIkUIQp0=/?embedMode=view_only_without_ui&share_link_id=79974080622";

export const ICP_DOC_URL =
  "https://docs.google.com/document/d/1RLKQBVBYxgLHPT3YOboqpobUEW0yQZDwkt67vONTTto/edit?tab=t.0";

export const MQL_POINT_THRESHOLD = 100;

export const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How it works" },
  { id: "scoring-flow", label: "Scoring flow" },
  { id: "mqling-flow", label: "MQLing flow" },
  { id: "demographic", label: "Demographic" },
  { id: "behavioral", label: "Behavioral" },
  { id: "matrix", label: "Score matrix" },
  { id: "non-mql-reasons", label: "Why not MQL" },
  { id: "manual-mql-review", label: "MQL review" },
  { id: "mql-policy", label: "MQL policy" },
  { id: "examples", label: "Examples" },
  { id: "interpretation", label: "Interpretation" },
  { id: "faq", label: "FAQ" },
  { id: "methodology", label: "Methodology" },
] as const;

export const MATRIX_CELLS: { demo: string; beh: number; priority: number; label: string }[] = [
  { demo: "A", beh: 1, priority: 1, label: "Top priority" },
  { demo: "A", beh: 2, priority: 2, label: "High" },
  { demo: "A", beh: 3, priority: 3, label: "High" },
  { demo: "A", beh: 4, priority: 4, label: "Medium" },
  { demo: "B", beh: 1, priority: 2, label: "High" },
  { demo: "B", beh: 2, priority: 5, label: "Medium" },
  { demo: "B", beh: 3, priority: 6, label: "Medium" },
  { demo: "B", beh: 4, priority: 7, label: "Lower" },
  { demo: "C", beh: 1, priority: 2, label: "High" },
  { demo: "C", beh: 2, priority: 8, label: "Lower" },
  { demo: "C", beh: 3, priority: 9, label: "Nurture / selective" },
  { demo: "C", beh: 4, priority: 10, label: "Lower" },
  { demo: "D", beh: 1, priority: 11, label: "Review" },
  { demo: "D", beh: 2, priority: 12, label: "Low" },
  { demo: "D", beh: 3, priority: 13, label: "Typically not MQL" },
  { demo: "D", beh: 4, priority: 14, label: "Lowest" },
];

export function heatColorForPriority(priority: number): string {
  if (priority <= 2) return "var(--cherry-syrup)";
  if (priority <= 5) return "var(--pink-mid)";
  if (priority <= 8) return "var(--orange-juice)";
  if (priority <= 10) return "#FEBB59";
  if (priority <= 12) return "var(--border)";
  return "#d4cec4";
}

export function textColorForPriority(priority: number): string {
  return priority <= 8 ? "#fff" : "var(--black-coffee)";
}

export type SalesQueueTier = { rank: number; codes: string[] };

export function getSalesQueueTiers(): SalesQueueTier[] {
  const sorted = [...MATRIX_CELLS].sort(
    (a, b) => a.priority - b.priority || a.demo.localeCompare(b.demo) || a.beh - b.beh,
  );
  const tiers: SalesQueueTier[] = [];
  for (const cell of sorted) {
    const code = `${cell.demo}${cell.beh}`;
    const last = tiers[tiers.length - 1];
    if (last?.rank === cell.priority) last.codes.push(code);
    else tiers.push({ rank: cell.priority, codes: [code] });
  }
  return tiers;
}

export const DEMOGRAPHIC_GRADES = [
  {
    grade: "A",
    title: "Best fit",
    summary:
      "ICP company with a decision maker or champion persona—or a 50–99 employee company when the ICP flag has not yet updated (modern industry, not government or education).",
    details: [
      "Job function: HR, HR/Finance (and related champion roles per Marketo rules).",
      "Seniority: C-level through director/VP and comparable levels.",
      "Account: SFDC ICP checkbox TRUE, or eligible 50–99 EE edge case.",
    ],
  },
  {
    grade: "B",
    title: "Strong fit",
    summary:
      "ICP company with a relevant function persona, or a non-ICP company with a decision maker/champion.",
    details: [
      "ICP path: HR, Finance, Business Operations, CEO, G&A with ICP TRUE.",
      "Non-ICP path: HR/HR Finance with senior decision-maker seniority.",
    ],
  },
  {
    grade: "C",
    title: "Workable fit",
    summary:
      "Non-ICP with a workable persona, or ICP with validating/influencing (non-champion) function.",
    details: [
      "Other job functions and seniorities when ICP is FALSE.",
      "Used for selective MQL rules (e.g. C3 in target regions).",
    ],
  },
  {
    grade: "D",
    title: "Lowest fit / disqualified",
    summary:
      "Irrelevant company or persona, junk data, restricted geographies, competitors, customers, or out-of-range employee counts.",
    details: [
      "See expandable disqualifier list for full operational rules.",
    ],
  },
];

export const BEHAVIORAL_TIERS = [
  {
    tier: 1,
    label: "Highest engagement",
    activities: "Demo request, pricing page, explicit sales contact, booth/3rd-party demo intent",
    points: "100+",
  },
  {
    tier: 2,
    label: "High engagement",
    activities: "Watch-a-Demo, product tour, ROI calculator, BOFU visits, high-value assets, events",
    points: "50–99",
  },
  {
    tier: 3,
    label: "Mid engagement",
    activities: "Nurture/content/newsletter/webinar forms, MOFU visits, CPL syndication",
    points: "15–49",
  },
  {
    tier: 4,
    label: "Low engagement",
    activities: "General/TOFU forms and page visits only",
    points: "0–14",
  },
];

export const ACTIVITY_WEIGHTS = [
  { points: 100, tag: "Immediate tier 1", activities: ["Request demo form", "Pricing form", "Contact Sales reason", "Demo/learn-more on webinars & events"] },
  { points: 50, tag: "Immediate tier 2", activities: ["Watch a Demo form", "Product tour", "ROI calculator", "HiBob/community event attendance"] },
  { points: 35, tag: "6Sense booth bonus", activities: ["A demographic + Decision/Purchase stage booth attendee"] },
  { points: 30, tag: "", activities: ["Watched 20+ seconds of demo video"] },
  { points: 25, tag: "", activities: ["Pre-MQL bonus for BOFU page visits"] },
  { points: 15, tag: "Once per day cap", activities: ["BOFU page visit or link click", "Content/newsletter/webinar form", "CPL content syndication", "High-value asset download"] },
  { points: 10, tag: "Once per day cap", activities: ["MOFU page visit", "10+ minutes on live webinar"] },
  { points: 5, tag: "Max 3×/month", activities: [`Email link click — cannot reach MQL threshold (${MQL_POINT_THRESHOLD} pts) alone`] },
];

export const JUNK_LEAD_CRITERIA = [
  "Test or fake data in names, company names, notes, or email (e.g. \"test\", \"asdf\", Lorem Ipsum).",
  "Invalid, disposable, or bounced email addresses.",
  "Internal QA/UAT records from non-production environments.",
  "Restricted/high-risk countries (Iran, North Korea, Syria, Cuba, Sudan, Libya, Iraq, Afghanistan, Somalia, Pakistan, India, China, Palestine, Lebanon, and others per ops list).",
  "Fails qualification requirements (e.g. missing referral form submissions).",
  "Already flagged through operational junk-lead processes.",
  "Low-quality email validation signals (free/disposable email indicators).",
];

export const JUNK_EXCEPTIONS =
  "Exceptions apply for approved companies, domains, referral programs, and manually reviewed records to reduce false positives.";

export const SCORING_FLOW_STEPS = [
  {
    id: "enter",
    title: "Lead enters the system",
    body: "A person engages via web forms, events, content, or third-party sources. Data lands in Marketo and syncs to Salesforce.",
  },
  {
    id: "junk",
    title: "Junk / test screening",
    body: "Marketo and ops rules check for junk/test signals. Matches are graded D and excluded from MQL routing (see Junk & test criteria).",
    branch: { yes: "Grade D — nurture or suppress", no: "Continue to demographic scoring" },
  },
  {
    id: "demo",
    title: "Demographic score (A–D)",
    body: "Persona (function, seniority) and account (ICP per MIS definition, status, geo, employee count) determine fit grade A through D.",
  },
  {
    id: "engage",
    title: "Engagement & point ledger",
    body: "Each activity adds points in Marketo (Behavioral Score Calculation). Points accumulate until the lead engages again.",
  },
  {
    id: "behavior",
    title: "Behavioral tier (1–4)",
    body: `Point total maps to tier: 100+ → 1, 50–99 → 2, 15–49 → 3, 0–14 → 4. MQL threshold is ${MQL_POINT_THRESHOLD} points (plus combo rules).`,
  },
  {
    id: "code",
    title: "Score code",
    body: "Demographic letter + behavioral number = code (e.g. A1, B3). Used for prioritization and reporting.",
  },
  {
    id: "mql",
    title: "MQL decision",
    body: "Hand raiser, WAD, or activity-based rules determine auto-MQL. Not every high-engagement lead MQLs—channel and grade matter.",
  },
  {
    id: "sales",
    title: "Sales priority",
    body: "A1 leads queue first; lower combos follow. Scores update dynamically as fit or engagement changes.",
  },
] as const;

export const NON_MQL_REASONS = [
  {
    id: "fit",
    title: "Fit & account disqualifiers",
    summary: "Demographic grade D or account/persona signals that fail ICP and routing rules.",
    reasons: [
      "Demographic grade D (junk, irrelevant persona, competitor, customer, bad country, EE <20 or >8,000 with Update MQL Process = FALSE).",
      "Persona or function outside champion/decision-maker paths for the account’s ICP status.",
      "Account status Not Relevant, or restricted/high-risk geography.",
      "Unsubscribed or HiBob employee records.",
    ],
  },
  {
    id: "engagement",
    title: "Engagement below MQL threshold",
    summary: `Behavioral points stay under the ${MQL_POINT_THRESHOLD}-point bar or reflect low-intent activity only.`,
    reasons: [
      `Total points in Behavioral Score Calculation below ${MQL_POINT_THRESHOLD} (tiers 3–4: typically 0–49 points).`,
      "TOFU-only engagement (general forms, light page visits) without BOFU or hand-raise actions.",
      "Email link clicks (+5, max 3×/month) cannot reach the MQL threshold alone.",
      "Engagement exists but does not map to an auto-MQL combo for that channel (see MQL policy).",
    ],
  },
  {
    id: "channel",
    title: "Channel & score-code rules",
    summary: "March 2025 policy limits which demographic × behavioral codes auto-MQL by source.",
    reasons: [
      "Activity-based path: only A1 and B1 auto-MQL—other codes (e.g. B2, C1, A2) do not qualify on points alone.",
      "WAD / product tour: D3 explicitly excluded; many C and D combos do not auto-MQL.",
      "C3: only selective regions (Americas, UK, APJ)—excludes Micro segment; not a default MQL.",
      "Excluded sources: ROI calculator submissions and High-value asset (“New Movers”) do not auto-MQL.",
      "Not a hand raiser (Request Demo, Pricing, Contact Sales)—those forms always MQL when valid.",
    ],
  },
  {
    id: "junk",
    title: "Junk, test & data quality",
    summary: "Operational junk screening removes leads before or regardless of engagement scoring.",
    reasons: [
      "Test/fake data, invalid or bounced email, QA/UAT from non-production environments.",
      "Failed qualification (e.g. missing referral form) or ops junk-lead flags.",
      "Low-quality/disposable email signals—typically graded D and suppressed from MQL routing.",
    ],
  },
  {
    id: "booth",
    title: "Events & booth (common misconception)",
    summary: "ICP booth attendance alone does not guarantee an MQL.",
    reasons: [
      "Post-2023 rule: only demographic A + 6Sense Decision/Purchase stage receive the +35 booth bonus.",
      "Attendance points (+15) plus bonus still require passing junk/DQ checks and channel combo rules.",
      "Most booth traffic is nurtured rather than auto-MQL’d to protect SQA conversion rates.",
    ],
  },
] as const;

export const MANUAL_MQL_REVIEW_WHEN = [
  "The lead had a clear high-intent action (demo, pricing, contact sales, WAD) but did not MQL within expected timing.",
  "Sales or Marketing believes the score code or demographic grade is wrong for the account/persona.",
  "ICP, employee count, or account status recently changed and may not have synced yet.",
  "The lead source or campaign should qualify under March 2025 MQL policy but was excluded.",
];

export const MANUAL_MQL_REVIEW_GATHER = [
  { field: "Lead / contact ID", note: "Salesforce 18-char ID and Marketo lead ID if available." },
  { field: "Behavioral Score Calculation", note: `Current point total and whether it is ≥ ${MQL_POINT_THRESHOLD}.` },
  { field: "Demographic grade & score code", note: "e.g. A1, B2 — from Marketo/SFDC scoring fields." },
  { field: "Lead source / program", note: "Hand raiser, WAD, activity-based, event, PPL, etc." },
  { field: "ICP & account status", note: "SFDC ICP checkbox, account status, EE count, bad-country flags." },
  { field: "Recent activities", note: "Form fills, page visits, emails—with dates (last 7–14 days)." },
  { field: "Junk / DQ flags", note: "Any junk-lead, unsubscribe, or grade-D disqualifier signals." },
  { field: "What you expected", note: "Which auto-MQL path should have fired and why." },
];

export const MANUAL_MQL_REVIEW_STEPS = [
  {
    step: 1,
    title: "Self-check against policy",
    body: "Use Why not MQL and MQL policy to confirm whether exclusion was intentional (e.g. D3 on WAD, activity path not A1/B1, ROI calculator).",
  },
  {
    step: 2,
    title: "Verify data freshness",
    body: "Allow ~24h for SFDC ICP updates; confirm Marketo program membership and that scoring flows have run since the last activity.",
  },
  {
    step: 3,
    title: "Open a review with Marketing Ops / RevOps",
    body: "Submit via your team’s Marketing Ops or RevOps intake (Slack channel or ticket queue—use your org’s standard path). Include the gather checklist below.",
  },
  {
    step: 4,
    title: "Reviewer decision",
    body: "Ops may manually MQL, correct scoring/ICP data and re-run flows, document a false positive for junk/DQ, or confirm no MQL per policy.",
  },
];

export const MANUAL_MQL_REVIEW_OUTCOMES = [
  { outcome: "Approved manual MQL", detail: "Lead routed to sales with audit note; use when policy supports MQL but automation missed." },
  { outcome: "Data or rule fix", detail: "ICP, grade, or activity attribution corrected; flows re-triggered—lead may MQL automatically." },
  { outcome: "Confirmed no MQL", detail: "Documented reason shared back; lead stays in nurture or suppression per policy." },
  { outcome: "Policy exception", detail: "One-off leadership-approved exception—rare; should feed back into rule review if recurring." },
];

export const MQL_POLICIES = [
  {
    id: "hand-raiser",
    title: "Hand raiser",
    description: "Leads who explicitly ask to be contacted.",
    rules: ["Request Demo", "Request Pricing", "Contact Us / Contact Sales"],
    autoMql: "Always auto-MQL",
    note: "~18% MQL-to-SQA conversion — highest-intent channel.",
    impact: null,
  },
  {
    id: "wad",
    title: "WAD & product tour",
    description: "Watch-a-Demo and similar high-intent content journeys.",
    rules: [
      "Auto-MQL: A1, A2, A3, A4, B1, B2, B3, C1",
      "C3: Americas, UK, APJ only — exclude Micro segment",
      "Do not MQL D3 (low conversion)",
    ],
    autoMql: "Combo-based",
    note: "Projected ~60% fewer WAD MQLs with ~75% higher conversion rate.",
    impact: { before: "6,297 MQLs @ 8% CR", after: "2,566 MQLs @ 14% CR", pipeline: "−20% pipeline, +75% CR" },
  },
  {
    id: "activity",
    title: "Activity-based",
    description: "Leads who cross the engagement threshold without a hand-raise form.",
    rules: ["Auto-MQL: A1 and B1 only"],
    autoMql: "A1 & B1 only",
    note: "Largest noise reduction; prioritize these for sales follow-up.",
    impact: { before: "1,874 MQLs @ 4% CR", after: "86 MQLs @ 17% CR", pipeline: "Pipeline intentionally reduced for quality" },
  },
  {
    id: "other",
    title: "Other channels",
    description: "Directories, PPL, and exclusions.",
    rules: [
      "Keep: PPL / directory leads (3rd-party lead service)",
      "Do not MQL: ROI calculator submissions",
      "Do not MQL: High-value asset (“New Movers”)",
    ],
    autoMql: "Varies by source",
    note: "Overall 2024 baseline: ~14,940 → ~9,567 MQLs; CVR 11% → 15.5%.",
    impact: null,
  },
];

export const ICP_DEFINITION_SUMMARY =
  "An account is ICP when it meets size, technology, industry, and geography rules—or is manually overridden in Salesforce.";

export const ICP_DEFINITION = [
  "100–5,000 employees",
  "At least one modern technology in tech stack",
  "Industry is NOT colleges/universities, government, federal, or schools",
  "US-based companies must be international",
  "OR manually flagged via ICP override field",
];

export const DISQUALIFIERS_D = {
  person: [
    "Junk list: bounced, private, or invalid email",
    "Unsubscribed",
    "Irrelevant titles: Student, Design, intern, professor",
    "Job function: Sales",
    "HiBob employees",
  ],
  account: [
    "Account status: Not Relevant",
    "Bad country (see restricted list)",
    "Competitor or Customer",
    "Update MQL Process = FALSE with EE count <20 or >8,000",
  ],
  countries: [
    "Iran", "Lebanon", "North Korea (Democratic People's Republic of)", "Somalia", "Cuba", "Syria",
    "Sudan", "Libya", "Pakistan", "India", "Iraq", "Palestine", "Syrian Arab Republic", "China",
    "Palestinian Territory (Occupied)", "Palestinian Territory",
  ],
};

export const EXAMPLES = [
  {
    title: "ICP VP HR requests a demo",
    demographic: "A",
    behavioral: 1,
    points: "100 (demo form)",
    code: "A1",
    mql: "Yes — Hand raiser (always)",
    action: "Highest sales priority; expect strongest conversion.",
  },
  {
    title: "ICP manager downloads BOFU content",
    demographic: "B",
    behavioral: 2,
    points: "~65 (BOFU + asset)",
    code: "B2",
    mql: "Yes — WAD/activity rules permitting",
    action: "Strong fit; prioritize after A1 queue.",
  },
  {
    title: "Non-ICP attendee, MOFU only",
    demographic: "C",
    behavioral: 3,
    points: "~25",
    code: "C3",
    mql: "Selective — target regions only, not Micro",
    action: "Nurture or regional MQL; not default auto-MQL.",
  },
  {
    title: "Irrelevant persona, TOFU only",
    demographic: "D",
    behavioral: 4,
    points: "<15",
    code: "D4",
    mql: "No",
    action: "Lowest priority; do not auto-MQL on WAD.",
  },
];

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
    q: "Do scores change over time?",
    a: "Yes. Behavioral tiers move up or down with new engagement. Demographic grades can change when account or persona data updates.",
  },
  {
    q: "Where can I see the full process flow?",
    a: "See the linked Miro board for the end-to-end lead scoring flow maintained by RevOps/Marketing Ops.",
  },
];

