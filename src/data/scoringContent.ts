export const MIRO_BOARD_URL =
  "https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622";

export const MIRO_EMBED_URL =
  "https://miro.com/app/live-embed/uXjVIkUIQp0=/?embedMode=view_only_without_ui&share_link_id=79974080622";

export const ICP_DOC_URL =
  "https://docs.google.com/document/d/1RLKQBVBYxgLHPT3YOboqpobUEW0yQZDwkt67vONTTto/edit?tab=t.0";

/** Marketing Ops form to request manual review / force MQL on a lead that did not auto-MQL. */
export const MANUAL_MQL_REVIEW_FORM_URL =
  "https://form.asana.com/?k=VjhxKo900uMGso834pxKXg&d=103035621276259";

export const MQL_POINT_THRESHOLD = 100;

/** Multi-page site navigation (paths, not anchor links). */
export const SITE_NAV = [
  { path: "/", label: "Home" },
  { path: "/mqling-flow", label: "ICP definition" },
  { path: "/scoring-flow", label: "Explore the Flow" },
  { path: "/mql-routing", label: "MQL Policy" },
  { path: "/guide", label: "Support and Trust" },
] as const;

/** @deprecated Use SITE_NAV — kept for legacy section ids */
export const NAV_SECTIONS = SITE_NAV.map((item) => ({
  id: item.path.replace(/^\//, "").replace(/\//g, "-") || "overview",
  label: item.label,
}));

export type MatrixCell = {
  demo: string;
  beh: number;
  priority: number;
  label: string;
  example: string;
};

export const MATRIX_CELLS: MatrixCell[] = [
  {
    demo: "A",
    beh: 1,
    priority: 1,
    label: "Top priority",
    example:
      "VP People at a 400-employee ICP tech company requests a demo on the website (105 pts).",
  },
  {
    demo: "A",
    beh: 2,
    priority: 2,
    label: "High",
    example:
      "ICP CHRO attends a live webinar and downloads the pricing guide (~72 pts).",
  },
  {
    demo: "A",
    beh: 3,
    priority: 3,
    label: "High",
    example:
      "ICP People Ops Manager engages with MOFU emails and product pages (~30 pts).",
  },
  {
    demo: "A",
    beh: 4,
    priority: 4,
    label: "Medium",
    example: "ICP champion clicks newsletter links only; no high-intent actions (~8 pts).",
  },
  {
    demo: "B",
    beh: 1,
    priority: 2,
    label: "High",
    example:
      "ICP People Manager submits a WAD pricing form at a strong-fit account (102 pts).",
  },
  {
    demo: "B",
    beh: 2,
    priority: 5,
    label: "Medium",
    example:
      "ICP HR Manager downloads an implementation guide plus a BOFU asset (~58 pts).",
  },
  {
    demo: "B",
    beh: 3,
    priority: 6,
    label: "Medium",
    example:
      "ICP HRBP visits the booth at an event and consumes MOFU content (~24 pts).",
  },
  {
    demo: "B",
    beh: 4,
    priority: 7,
    label: "Lower",
    example: "Strong-fit manager subscribes to the blog with light TOFU only (~11 pts).",
  },
  {
    demo: "C",
    beh: 1,
    priority: 2,
    label: "High",
    example:
      "Non-ICP 800-EE account; C-level champion reaches 100+ pts on an executive brief.",
  },
  {
    demo: "C",
    beh: 2,
    priority: 8,
    label: "Lower",
    example:
      "Non-ICP HR Generalist replays a BOFU webinar and downloads an asset (~55 pts).",
  },
  {
    demo: "C",
    beh: 3,
    priority: 9,
    label: "Nurture / selective",
    example:
      "Non-ICP event attendee in a target region; MOFU engagement only (~25 pts).",
  },
  {
    demo: "C",
    beh: 4,
    priority: 10,
    label: "Lower",
    example: "Workable persona at a non-ICP firm; single whitepaper view (~9 pts).",
  },
  {
    demo: "D",
    beh: 1,
    priority: 11,
    label: "Review",
    example:
      "Sales job function at an otherwise relevant account; 100+ pts but demographic D.",
  },
  {
    demo: "D",
    beh: 2,
    priority: 12,
    label: "Low",
    example: "Design intern at an ICP account with some content engagement (~18 pts).",
  },
  {
    demo: "D",
    beh: 3,
    priority: 13,
    label: "Typically not MQL",
    example:
      "Competitor- or restricted-country-flagged account with moderate engagement (~32 pts).",
  },
  {
    demo: "D",
    beh: 4,
    priority: 14,
    label: "Lowest",
    example:
      "Irrelevant persona with TOFU only—e.g. student or ops junk-adjacent lead (~5 pts).",
  },
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

export type ScoringFlowBranch = {
  id: string;
  label: string;
  outcome: string;
  grade?: string;
  /** end = jump to final step; continue = normal next step */
  action?: "continue" | "end";
};

export type ScoringFlowStep = {
  id: string;
  title: string;
  body: string;
  branchPrompt?: string;
  /** choose-one: pick a path; show-all: display all outcomes; derived: show result from prior steps only */
  branchMode?: "choose-one" | "show-all" | "derived";
  branches?: ScoringFlowBranch[];
};

/** Maps step-4 activity choice → step-5 behavioral tier (1–4). */
export const ENGAGE_TO_TIER: Record<string, string> = {
  p100: "1",
  p50: "2",
  p15: "3",
  p5: "4",
};

export function tierFromEngage(engageId: string | undefined): string | null {
  if (!engageId) return null;
  return ENGAGE_TO_TIER[engageId] ?? null;
}

export function getEngageBranch(engageId: string | undefined) {
  if (!engageId) return undefined;
  return SCORING_FLOW_STEPS.find((s) => s.id === "engage")?.branches?.find((b) => b.id === engageId);
}

export function getBehaviorBranchByTier(tierId: string | undefined) {
  if (!tierId) return undefined;
  return SCORING_FLOW_STEPS.find((s) => s.id === "behavior")?.branches?.find((b) => b.id === tierId);
}

export function scoreCodeFromChoices(demoId: string | undefined, tier: string | null | undefined): string | null {
  if (!demoId || !tier) return null;
  return `${demoId.toUpperCase()}${tier}`;
}

export function getScoreCodeOutcome(code: string): string {
  const match = SCORING_FLOW_STEPS.find((s) => s.id === "code")?.branches?.find(
    (b) => b.label === code || b.grade === code,
  );
  if (match) return match.outcome;
  const letter = code.charAt(0);
  if (letter === "D") return "Poor fit combined with engagement level — lowest priority; usually no auto-MQL.";
  if (letter === "A") return "Best demographic fit with this engagement tier — top of the sales queue.";
  if (letter === "B") return "Strong fit with this engagement tier — high priority outreach.";
  if (letter === "C") return "Workable fit with this engagement tier — selective MQL and outreach paths.";
  return "Used for prioritization, reporting, and MQL combo rules.";
}

export const SCORING_FLOW_STEPS: ScoringFlowStep[] = [
  {
    id: "enter",
    title: "Lead enters the system",
    body: "A person engages via web forms, events, content, or third-party sources. Data lands in Marketo and syncs to Salesforce.",
  },
  {
    id: "junk",
    title: "Junk / test screening",
    body: "Marketo and ops rules check for junk/test signals before fit scoring runs.",
    branchMode: "choose-one",
    branchPrompt: "Does the lead match junk/test criteria?",
    branches: [
      {
        id: "yes",
        label: "Yes — junk / test match",
        grade: "D",
        outcome: "Grade D immediately. Lead is nurtured or suppressed—not scored through the normal A–D fit ladder.",
        action: "end",
      },
      {
        id: "no",
        label: "No — passes screening",
        outcome: "Continue to demographic scoring (persona + account).",
        action: "continue",
      },
    ],
  },
  {
    id: "demo",
    title: "Demographic score (A–D)",
    body: "Marketo/Salesforce rules evaluate persona (function, seniority) and account (ICP, status, geography, employee count) together.",
    branchMode: "choose-one",
    branchPrompt: "Persona + account fit — which grade applies?",
    branches: [
      {
        id: "a",
        label: "Grade A — Best fit",
        grade: "A",
        outcome:
          "ICP account with champion/decision-maker persona (or eligible 50–99 EE edge case). Strongest demographic fit.",
        action: "continue",
      },
      {
        id: "b",
        label: "Grade B — Strong fit",
        grade: "B",
        outcome: "ICP + relevant function, or non-ICP + decision maker/champion. Still strong for outreach.",
        action: "continue",
      },
      {
        id: "c",
        label: "Grade C — Workable",
        grade: "C",
        outcome:
          "Non-ICP with a workable persona, or ICP with validating/influencing (non-champion) function. Selective MQL paths only.",
        action: "continue",
      },
      {
        id: "d",
        label: "Grade D — Not a fit",
        grade: "D",
        outcome:
          "Persona and/or account are not a fit (irrelevant role, non-ICP without champion, competitor, customer, bad geo, DQ rules). Grade D—typically blocked from standard auto-MQL paths.",
        action: "continue",
      },
    ],
  },
  {
    id: "engage",
    title: "Engagement & point ledger",
    body: "Each marketing activity adds points in Marketo (Behavioral Score Calculation). Points stack until the next activity.",
    branchMode: "choose-one",
    branchPrompt: "Which marketing activity did the lead take?",
    branches: [
      {
        id: "p100",
        label: "Demo, pricing, or contact sales",
        outcome: "+100 pts — immediate high intent (often reaches MQL threshold in one step).",
        action: "continue",
      },
      {
        id: "p50",
        label: "WAD, product tour, ROI calculator, or event",
        outcome: "+50 pts — strong engagement; may need another activity to reach 100+ pts.",
        action: "continue",
      },
      {
        id: "p15",
        label: "BOFU visit, content, newsletter, or webinar form",
        outcome: "+15 pts — mid engagement (daily caps apply on some channels).",
        action: "continue",
      },
      {
        id: "p5",
        label: "Email click only",
        outcome: "+5 pts — capped; cannot reach MQL threshold from email clicks alone.",
        action: "continue",
      },
    ],
  },
  {
    id: "behavior",
    title: "Behavioral tier (1–4)",
    body: "Based on the activity you selected in step 4, Marketo assigns a behavioral tier (1–4).",
    branchMode: "derived",
    branches: [
      {
        id: "1",
        label: "Tier 1 (100+ pts)",
        grade: "1",
        outcome: "Matches demo, pricing, or contact sales — highest intent.",
        action: "continue",
      },
      {
        id: "2",
        label: "Tier 2 (50–99 pts)",
        grade: "2",
        outcome: "Matches WAD, product tour, ROI calculator, or events.",
        action: "continue",
      },
      {
        id: "3",
        label: "Tier 3 (15–49 pts)",
        grade: "3",
        outcome: "Matches BOFU visits, content, newsletter, or webinar forms.",
        action: "continue",
      },
      {
        id: "4",
        label: "Tier 4 (0–14 pts)",
        grade: "4",
        outcome: "Matches email clicks only or very low engagement.",
        action: "continue",
      },
    ],
  },
  {
    id: "code",
    title: "Score code",
    body: "Your demographic grade and behavioral tier combine into one score code.",
    branchMode: "derived",
    branches: [
      { id: "a1", label: "A1", grade: "A1", outcome: "Best ICP fit + highest engagement → top sales priority" },
      { id: "b2", label: "B2", grade: "B2", outcome: "Strong fit + high engagement → high priority" },
      { id: "c3", label: "C3", grade: "C3", outcome: "Workable fit + mid engagement → selective MQL/outreach" },
      { id: "d4", label: "D4", grade: "D4", outcome: "Poor fit + low engagement → lowest priority / usually no MQL" },
    ],
  },
  {
    id: "mql",
    title: "MQL decision",
    body: "Reaching 100+ points is necessary but not sufficient. Hand-raiser, WAD, and activity-based paths each have grade and channel rules.",
    branchMode: "show-all",
    branchPrompt: "Typical branches by score code:",
    branches: [
      {
        id: "mql-ab",
        label: "A1 / B1 + qualifying channel",
        outcome: "Usually auto-MQL on activity-based paths (March 2025 policy).",
      },
      {
        id: "mql-c",
        label: "C3 + WAD (selective)",
        outcome: "May MQL in target regions only; not a blanket pass.",
      },
      {
        id: "mql-d",
        label: "Any D grade",
        grade: "D",
        outcome: "Generally no auto-MQL—D3 blocked on WAD; D4 lowest priority.",
      },
      {
        id: "mql-block",
        label: "100+ pts but wrong combo",
        outcome: "Points alone do not MQL if grade/channel/source is excluded (see MQL routing).",
      },
    ],
  },
];

export const MQL_QUALIFICATION_ISSUES = [
  {
    id: "employee-count",
    title: "Employee Count Discrepancies",
    body: "Company size data is often inaccurate, mainly due to reliance on ZoomInfo without Apollo as a secondary source.",
  },
  {
    id: "job-title",
    title: "Job Title Classification",
    body: "Most title-related issues involve broad roles such as student, intern, sales, or marketing.",
  },
  {
    id: "wad-scoring",
    title: "WAD vs. Scoring Misalignment",
    body: "Some WAD completions have strong titles but receive a low score due to company attributes, preventing MQL qualification.",
    wip: true,
  },
  {
    id: "irrelevant-accounts",
    title: "Conversions on Irrelevant Accounts",
    body: "Leads converting on accounts already marked as not relevant are not assigned to sales and lose MQL status.",
  },
] as const;

export type MqlQualificationIssue = (typeof MQL_QUALIFICATION_ISSUES)[number];

export type MqlDiagnosticOption = {
  id: string;
  label: string;
  next: string;
};

export type MqlDiagnosticStep = {
  id: string;
  question: string;
  helper?: string;
  options: MqlDiagnosticOption[];
};

export type MqlDiagnosticConclusion = {
  id: string;
  title: string;
  tone: "policy" | "review" | "info";
  summary: string;
  reasons: string[];
  nextSteps: string[];
};

export {
  computeDemographicFromInputs,
  enrichConclusionWithDemographic,
  routeAfterMarketoGrade,
  type ComputedDemographic,
  type DemographicScoringAnswers,
} from "./mqlDiagnosticLogic";

export const MQL_DIAGNOSTIC_INTRO =
  "Let's apply the same demographic rules Marketo uses: employee size, ICP, job function, and seniority combine into grade A–D. Answer about the lead, then we'll compare that logic to engagement and MQL policy.";

export const MQL_DIAGNOSTIC_START = "junk";

export const MQL_DIAGNOSTIC_STEPS: MqlDiagnosticStep[] = [
  {
    id: "junk",
    question: "First, does the record show junk, test, or hard disqualifier flags?",
    helper:
      "Unsubscribed, bounced/invalid email, test/QA data, bad country, ops junk flags, or person-level DQs (Sales, student, intern).",
    options: [
      { id: "yes", label: "Yes — junk / DQ signals present", next: "c_junk" },
      { id: "no", label: "No — passes screening", next: "ee" },
    ],
  },
  {
    id: "ee",
    question: "How many employees does the account have?",
    helper: "From Salesforce account — drives ICP and Grade D rules when Update MQL Process = FALSE.",
    options: [
      { id: "under_20", label: "Under 20 employees", next: "c_ee_dq" },
      { id: "ee_50_99", label: "50–99 employees", next: "icp" },
      { id: "ee_100_4999", label: "100–4,999 employees (standard ICP band)", next: "icp" },
      { id: "ee_5000_8000", label: "5,000–8,000 employees", next: "icp" },
      { id: "over_8000", label: "More than 8,000 employees", next: "c_ee_dq" },
    ],
  },
  {
    id: "icp",
    question: "What is the account ICP / status fit?",
    helper: "SFDC ICP checkbox, account status, and the 50–99 EE edge case when ICP lags.",
    options: [
      { id: "icp_true", label: "ICP = TRUE", next: "job" },
      { id: "icp_false", label: "ICP = FALSE", next: "job" },
      {
        id: "icp_50_99",
        label: "50–99 EE, ICP still FALSE (modern industry, not gov/edu)",
        next: "job",
      },
      { id: "competitor", label: "Competitor account", next: "c_account_dq" },
      { id: "customer", label: "Customer account", next: "c_account_dq" },
    ],
  },
  {
    id: "job",
    question: "What is the lead's job function?",
    helper: "Persona rules: HR/HR Finance are champion paths; Sales is always Grade D.",
    options: [
      { id: "hr", label: "HR / People / Talent", next: "seniority" },
      { id: "hr_finance", label: "HR Finance / HR & Finance", next: "seniority" },
      {
        id: "finance_ops_ceo",
        label: "Finance, Business Operations, CEO, or G&A",
        next: "seniority",
      },
      { id: "sales", label: "Sales (any seniority)", next: "c_persona_dq" },
      {
        id: "student_intern",
        label: "Student, intern, professor, or Design",
        next: "c_persona_dq",
      },
      { id: "other_workable", label: "Other — but still HR-adjacent / workable", next: "seniority" },
      { id: "other_irrelevant", label: "Other — unrelated to HR buying center", next: "seniority" },
    ],
  },
  {
    id: "seniority",
    question: "What is the lead's seniority level?",
    helper: "Champion seniority (C-level, VP, Director) unlocks A/B on ICP or non-ICP HR paths.",
    options: [
      { id: "cvp_director", label: "C-level or Director", next: "marketo_grade" },
      { id: "vp", label: "VP / Head of", next: "marketo_grade" },
      { id: "manager", label: "Manager / senior manager", next: "marketo_grade" },
      { id: "individual", label: "Individual contributor (non-manager)", next: "marketo_grade" },
      { id: "entry", label: "Coordinator, assistant, or entry-level", next: "marketo_grade" },
    ],
  },
  {
    id: "marketo_grade",
    question: "What demographic grade does Marketo or Salesforce show right now?",
    helper: "We'll compare this to the grade implied by employee size + ICP + function + seniority.",
    options: [
      { id: "a", label: "Grade A", next: "__grade_route__" },
      { id: "b", label: "Grade B", next: "__grade_route__" },
      { id: "c", label: "Grade C", next: "__grade_route__" },
      { id: "d", label: "Grade D", next: "__grade_route__" },
    ],
  },
  {
    id: "points_after_d",
    question: "Even with grade D—roughly how many behavioral points?",
    options: [
      { id: "low", label: "Under 100 points", next: "c_grade_d_low" },
      { id: "high", label: "100+ points", next: "source_after_d" },
    ],
  },
  {
    id: "source_after_d",
    question: "What was the highest-intent action?",
    options: [
      { id: "hand", label: "Hand raiser (demo, pricing, contact sales)", next: "c_hand_on_d" },
      { id: "other", label: "WAD, content, event, or other", next: "c_grade_d" },
    ],
  },
  {
    id: "points",
    question: `Are behavioral points at or above ${MQL_POINT_THRESHOLD}?`,
    helper: "Behavioral Score Calculation field in Marketo.",
    options: [
      { id: "no", label: `No — under ${MQL_POINT_THRESHOLD} points`, next: "c_low_points" },
      { id: "yes", label: `${MQL_POINT_THRESHOLD}+ points`, next: "source" },
    ],
  },
  {
    id: "source",
    question: "What path best describes how they engaged?",
    options: [
      { id: "hand", label: "Hand raiser — demo, pricing, or contact sales", next: "c_should_mql" },
      { id: "wad", label: "WAD / product tour / BOFU asset", next: "code_wad" },
      { id: "activity", label: "Activity only — no hand-raise form", next: "code_activity" },
      { id: "roi", label: "ROI calculator submission", next: "c_excluded_roi" },
      { id: "movers", label: "New Movers / high-value asset", next: "c_excluded_movers" },
      { id: "event", label: "Event or booth — no demo/pricing form", next: "c_event" },
    ],
  },
  {
    id: "code_wad",
    question: "What is the score code on the WAD path?",
    helper: "Demographic letter + behavioral tier (e.g. B2, C3, D3).",
    options: [
      { id: "allowed", label: "A1–A4, B1–B3, or C1", next: "c_should_mql" },
      { id: "c3", label: "C3", next: "c_wad_c3" },
      { id: "d3", label: "D3", next: "c_wad_d3" },
      { id: "d_other", label: "D1, D2, or D4", next: "c_wad_d_blocked" },
      { id: "other", label: "Other / not sure", next: "c_wad_check" },
    ],
  },
  {
    id: "code_activity",
    question: "What is the score code on the activity-based path?",
    options: [
      { id: "a1b1", label: "A1 or B1", next: "c_should_mql" },
      { id: "other", label: "Any other code (A2, B2, C1, C3, D*, etc.)", next: "c_activity_blocked" },
    ],
  },
];

export const MQL_DIAGNOSTIC_CONCLUSIONS: Record<string, MqlDiagnosticConclusion> = {
  c_ee_dq: {
    id: "c_ee_dq",
    title: "Expected — employee size blocks auto-MQL",
    tone: "policy",
    summary:
      "Accounts under 20 or over 8,000 employees with Update MQL Process = FALSE do not follow standard auto-MQL. This is an account-level rule, not a points issue.",
    reasons: [
      "Standard ICP employee band is 100–5,000; 5,000–8,000 may still MQL under separate policy.",
      "Small (<20) or very large (>8,000) accounts are intentionally excluded unless Ops enables exceptions.",
    ],
    nextSteps: [
      "Confirm employee count and Update MQL Process in Salesforce.",
      "Do not expect auto-MQL unless RevOps confirms an override for that account band.",
    ],
  },
  c_account_dq: {
    id: "c_account_dq",
    title: "Expected — competitor or customer",
    tone: "policy",
    summary: "Competitor and Customer accounts are disqualified regardless of persona seniority or points.",
    reasons: ["Account status overrides champion personas.", "Engagement may still be tracked for reporting."],
    nextSteps: ["Verify account status in SFDC.", "Route to nurture or competitive programs—not sales MQL."],
  },
  c_persona_dq: {
    id: "c_persona_dq",
    title: "Expected — persona disqualifier",
    tone: "policy",
    summary:
      "Sales function, student/intern/design titles, and unrelated buying-center roles score Grade D before channel rules run.",
    reasons: [
      "Sales job function is always Grade D in Marketo demographic logic.",
      "Student, Design, intern, and professor titles are hard person-level DQs.",
    ],
    nextSteps: [
      "Confirm Job Function and Title in Marketo/SFDC.",
      "If persona is actually HR champion, open RevOps to fix persona attribution—not a manual MQL.",
    ],
  },
  c_grade_system_lower: {
    id: "c_grade_system_lower",
    title: "Scoring mismatch — system grade is lower than fit",
    tone: "review",
    summary:
      "Based on employee size, ICP, function, and seniority, this lead should grade higher than what Marketo shows. A depressed grade often explains a missing MQL.",
    reasons: [
      "Demographic grade may be stale after a recent ICP, EE, or persona update.",
      "SFDC ICP can lag ~24h; Marketo may still use older account/person data.",
    ],
    nextSteps: [
      "Compare SFDC ICP, employee count, Job Function, and Seniority to Marketo fields.",
      "Ask RevOps to refresh scoring or re-run flows after data correction.",
      "If grade should be A/B with qualifying engagement, submit the manual MQL review form (link on this page) with before/after field values.",
    ],
  },
  c_grade_system_higher: {
    id: "c_grade_system_higher",
    title: "Scoring mismatch — system grade is higher than fit",
    tone: "info",
    summary:
      "Marketo shows a stronger grade (A/B) than employee size + persona logic suggests. Engagement paths may still fail if true fit is weaker (e.g. activity-only with code B2).",
    reasons: [
      "Grade may not have refreshed down after account fell out of ICP or persona changed.",
      "High points with a non-qualifying code still fail activity-based and some WAD rules.",
    ],
    nextSteps: [
      "Continue to score code and channel checks below.",
      "If true fit is C/D, no-MQL may still be correct despite a generous grade field.",
    ],
  },
  c_junk: {
    id: "c_junk",
    title: "Likely intentional — junk or data quality",
    tone: "policy",
    summary: "Junk and disqualifier rules run before or regardless of engagement. These leads are usually suppressed from auto-MQL.",
    reasons: [
      "Test/fake data, invalid or bounced email, or QA/UAT traffic.",
      "Ops junk flags, failed qualification, or grade-D person/account disqualifiers.",
    ],
    nextSteps: [
      "Confirm junk/DQ fields in Marketo and Salesforce.",
      "If the flag is wrong, ask RevOps to correct data and re-run scoring—not a standard MQL override.",
    ],
  },
  c_grade_d_low: {
    id: "c_grade_d_low",
    title: "Expected — grade D with low engagement",
    tone: "policy",
    summary: "Grade D reflects poor fit. Without 100+ points, the lead stays below the MQL engagement bar.",
    reasons: [
      "Demographic grade D (irrelevant persona, competitor, customer, geo, or EE rules).",
      `Behavioral points under ${MQL_POINT_THRESHOLD}.`,
    ],
    nextSteps: [
      "Keep in nurture or suppression per policy.",
      "Re-score only if ICP, persona, or account data materially changes.",
    ],
  },
  c_grade_d: {
    id: "c_grade_d",
    title: "Expected — grade D blocks standard auto-MQL",
    tone: "policy",
    summary: "Even with strong engagement, grade D is excluded from most WAD and activity auto-MQL paths.",
    reasons: [
      "WAD explicitly blocks D3; other D combos rarely auto-MQL.",
      "Activity-based path allows only A1 and B1.",
    ],
    nextSteps: [
      "Check MQL policy for the exact channel.",
      "Do not expect auto-MQL unless RevOps confirms an approved exception.",
    ],
  },
  c_hand_on_d: {
    id: "c_hand_on_d",
    title: "Unusual — hand raiser with grade D",
    tone: "review",
    summary:
      "Hand-raiser forms normally always MQL when valid. Grade D plus a demo/pricing request may mean bad data, junk flags, or a scoring sync issue.",
    reasons: [
      "Hand raiser should bypass most combo rules when the record is clean.",
      "Grade D may indicate competitor, customer, junk, or stale ICP/persona data.",
    ],
    nextSteps: [
      "Verify junk/DQ flags and that the form was Request Demo, Pricing, or Contact Sales.",
      "Allow ~24h for ICP sync, then submit the Marketing Ops manual MQL review form if still not MQL.",
      "Include lead IDs, points, grade, form name, and activity dates in the form.",
    ],
  },
  c_low_points: {
    id: "c_low_points",
    title: "Expected — below the MQL point threshold",
    tone: "policy",
    summary: `Leads need ${MQL_POINT_THRESHOLD}+ points in Behavioral Score Calculation for tier 1—and must still pass fit and channel rules.`,
    reasons: [
      "TOFU-only activity (light pages, newsletters) without BOFU or hand-raise actions.",
      "Email clicks alone (+5, max 3×/month) cannot reach 100 points.",
    ],
    nextSteps: [
      "Review recent activities in Marketo.",
      "If a high-intent form exists, confirm it was attributed to the right program.",
    ],
  },
  c_should_mql: {
    id: "c_should_mql",
    title: "This lead should have MQL'd — request a review",
    tone: "review",
    summary:
      "Based on your answers, the lead matches a path that usually auto-MQLs. If it did not, suspect timing, attribution, or data sync—not policy intent.",
    reasons: [
      "Passes junk screening with workable fit and qualifying channel/code.",
      "Hand raiser always MQLs when valid; WAD allows your code band; activity allows A1/B1.",
    ],
    nextSteps: [
      "Confirm Marketo program membership and that scoring ran after the last activity.",
      "Allow ~24h for Salesforce ICP updates if account data just changed.",
      "Submit the Marketing Ops manual MQL review form with SFDC + Marketo IDs, points, code, source, and expected rule.",
    ],
  },
  c_excluded_roi: {
    id: "c_excluded_roi",
    title: "Expected — ROI calculator excluded",
    tone: "policy",
    summary: "March 2025 policy removed auto-MQL for ROI calculator submissions regardless of points.",
    reasons: ["Listed under Other channels in MQL policy.", "Points may still accrue for nurture and reporting."],
    nextSteps: ["Route through nurture.", "Use hand-raiser or WAD paths for sales-ready intent."],
  },
  c_excluded_movers: {
    id: "c_excluded_movers",
    title: "Expected — New Movers asset excluded",
    tone: "policy",
    summary: "High-value “New Movers” asset leads do not auto-MQL under current policy.",
    reasons: ["Excluded source in MQL policy Other channel rules."],
    nextSteps: ["Confirm asset/program in Marketo.", "Pursue MQL only via qualifying forms or approved review."],
  },
  c_event: {
    id: "c_event",
    title: "Expected — event / booth alone rarely MQLs",
    tone: "policy",
    summary: "ICP booth attendance does not guarantee MQL. Only A + 6Sense Decision/Purchase gets the booth bonus.",
    reasons: [
      "Attendance (+15) plus bonus still requires junk/DQ clearance and channel combo rules.",
      "Most booth traffic is nurtured to protect SQA conversion.",
    ],
    nextSteps: [
      "Check demographic grade and whether a hand-raiser form was submitted.",
      "See Events & booth under Why not MQL for detail.",
    ],
  },
  c_wad_c3: {
    id: "c_wad_c3",
    title: "Selective — C3 on WAD is region-limited",
    tone: "info",
    summary: "C3 may MQL in Americas, UK, and APJ only—not Micro segment. Other regions stay nurture.",
    reasons: ["WAD combo rules exclude blanket C3 auto-MQL.", "Demographic C + mid engagement is selective by design."],
    nextSteps: [
      "Confirm region and segment in Salesforce.",
      "If region qualifies and still no MQL, open RevOps review.",
    ],
  },
  c_wad_d3: {
    id: "c_wad_d3",
    title: "Expected — D3 blocked on WAD",
    tone: "policy",
    summary: "WAD policy explicitly excludes D3 because of low conversion.",
    reasons: ["March 2025 WAD allowlist: A1–A4, B1–B3, C1 only.", "D3 is a known non-MQL combo."],
    nextSteps: ["Keep in nurture.", "Do not escalate unless leadership approves an exception."],
  },
  c_wad_d_blocked: {
    id: "c_wad_d_blocked",
    title: "Expected — D grade on WAD",
    tone: "policy",
    summary: "D1, D2, and D4 on WAD are not auto-MQL paths under current policy.",
    reasons: ["Poor demographic fit combined with WAD engagement.", "D3 has its own explicit block."],
    nextSteps: ["Confirm grade and code in Marketo.", "Focus on nurture unless fit improves."],
  },
  c_wad_check: {
    id: "c_wad_check",
    title: "Check the WAD allowlist for this code",
    tone: "info",
    summary: "Auto-MQL on WAD: A1–A4, B1–B3, C1. C3 selective. No D3.",
    reasons: ["If the code is outside this list, no-MQL is expected.", "If inside the list, treat as a should-have-MQL review."],
    nextSteps: ["Compare score code to MQL policy WAD tab.", "Escalate only when code is on the allowlist."],
  },
  c_activity_blocked: {
    id: "c_activity_blocked",
    title: "Expected — activity path is A1 & B1 only",
    tone: "policy",
    summary:
      "Activity-based auto-MQL is limited to A1 and B1. Other codes (A2, B2, C1, C3, etc.) do not MQL on points alone.",
    reasons: [
      "March 2025 change cut low-converting activity MQLs (~1,874 → ~86 MQLs).",
      "100+ points without A1/B1 still fails this channel rule.",
    ],
    nextSteps: [
      "Prioritize nurture or hand-raiser/WAD paths.",
      "Request review only if you believe the code should be A1/B1.",
    ],
  },
};

export function getMqlDiagnosticStep(id: string): MqlDiagnosticStep | undefined {
  return MQL_DIAGNOSTIC_STEPS.find((s) => s.id === id);
}

export function getMqlDiagnosticConclusion(id: string): MqlDiagnosticConclusion | undefined {
  return MQL_DIAGNOSTIC_CONCLUSIONS[id];
}

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
    title: "Request manual MQL review (Marketing Ops)",
    body: "Submit the Marketing Ops manual MQL review form (link below this guide) with the gather checklist. Ops will review leads that should have MQL’d and can force MQL when appropriate.",
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

export const ICP_DOC_BUTTON_LABEL = "Open full ICP doc (Google)";
export const ICP_DOC_BUTTON_NOTE = "full rules maintained by MIS";

/** Accounts in this band may still MQL despite ICP employee ceiling of 5,000. */
export const ICP_MQL_EE_DISCLAIMER =
  "Disclaimer: We may still MQL accounts with 5,000–8,000 employees under current policy, even though they fall outside the standard ICP employee range.";

export const DISQUALIFIERS_D = {
  person: [
    "Unsubscribed",
    "Irrelevant titles: Student, Design, intern, professor",
    "Job function: Sales",
    "HiBob employees",
  ],
  account: [
    "Competitor or Customer",
    "Account has fewer than 20 or more than 8,000 employees, and Update MQL Process = FALSE in Salesforce (standard auto-MQL is off for that size band)",
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

