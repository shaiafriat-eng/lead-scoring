/** Inputs collected in the MQL diagnostic guide (option ids). */
export type DemographicScoringAnswers = {
  junk?: string;
  ee?: string;
  icp?: string;
  job?: string;
  seniority?: string;
  marketo_grade?: string;
  engage?: string;
};

export type ComputedDemographic = {
  grade: "A" | "B" | "C" | "D";
  title: string;
  reasons: string[];
};

const GRADE_ORDER = { A: 4, B: 3, C: 2, D: 1 } as const;

export function computeDemographicFromInputs(
  answers: DemographicScoringAnswers,
): ComputedDemographic | null {
  if (answers.junk === "yes") return null;

  const reasons: string[] = [];

  if (answers.ee === "under_20" || answers.ee === "over_8000") {
    return {
      grade: "D",
      title: "Grade D — employee size",
      reasons: [
        "Account has fewer than 20 or more than 8,000 employees with Update MQL Process = FALSE in Salesforce.",
        "Standard auto-MQL is off for that employee band unless Ops has enabled an exception.",
      ],
    };
  }

  if (answers.icp === "competitor" || answers.icp === "customer") {
    return {
      grade: "D",
      title: "Grade D — account status",
      reasons: [
        "Competitor or Customer accounts are disqualified from normal MQL routing.",
      ],
    };
  }

  if (answers.job === "sales" || answers.job === "student_intern") {
    return {
      grade: "D",
      title: "Grade D — persona",
      reasons: [
        answers.job === "sales"
          ? "Job function Sales is always graded D."
          : "Student, Design, intern, or professor titles are person-level disqualifiers.",
      ],
    };
  }

  const icpTrue = answers.icp === "icp_true";
  const icpEdge = answers.icp === "icp_50_99";
  const icpFalse = answers.icp === "icp_false";
  const champion =
    answers.seniority === "cvp_director" || answers.seniority === "vp";
  const seniorManager = answers.seniority === "manager";
  const hrFamily =
    answers.job === "hr" || answers.job === "hr_finance";
  const icpRelevantOther =
    answers.job === "finance_ops_ceo" && (icpTrue || icpEdge);

  if ((icpTrue || icpEdge) && hrFamily && champion) {
    if (icpEdge) {
      reasons.push(
        "50–99 employees: treated as Grade A when ICP flag lags but industry is modern (not government/education).",
      );
    } else {
      reasons.push("ICP account (SFDC ICP = TRUE).");
    }
    reasons.push("Job function HR or HR/Finance.");
    reasons.push("Seniority C-level, VP, or Director — champion/decision-maker level.");
    return { grade: "A", title: "Grade A — best fit", reasons };
  }

  if (icpTrue && icpRelevantOther && champion) {
    reasons.push("ICP account with Finance, Business Operations, CEO, or G&A function.");
    reasons.push("Director+ seniority on an ICP account maps to Grade B.");
    return { grade: "B", title: "Grade B — strong fit (ICP)", reasons };
  }

  if (icpFalse && hrFamily && champion) {
    reasons.push("Non-ICP account but HR/HR Finance with C-level, VP, or Director seniority.");
    reasons.push("Non-ICP + decision maker/champion = Grade B.");
    return { grade: "B", title: "Grade B — strong fit (non-ICP champion)", reasons };
  }

  if (icpTrue && hrFamily && seniorManager) {
    reasons.push("ICP account with HR/HR Finance at manager level (validating/influencing, not top champion).");
    return { grade: "C", title: "Grade C — workable (ICP influencer)", reasons };
  }

  if (icpFalse && hrFamily && (seniorManager || answers.seniority === "individual")) {
    reasons.push("Non-ICP with HR/HR Finance but below champion seniority.");
    reasons.push("Workable persona — Grade C; only selective MQL paths (e.g. some WAD C3 regions).");
    return { grade: "C", title: "Grade C — workable (non-ICP)", reasons };
  }

  if (answers.job === "other_irrelevant" || answers.seniority === "entry") {
    return {
      grade: "D",
      title: "Grade D — weak persona",
      reasons: [
        "Function or seniority is outside HR champion paths for this account type.",
        "Irrelevant or entry-level personas score D.",
      ],
    };
  }

  if (icpTrue) {
    reasons.push("ICP account but function/seniority combination is not champion-level.");
    return { grade: "C", title: "Grade C — ICP validating persona", reasons };
  }

  reasons.push("Non-ICP account without a champion HR decision maker.");
  return { grade: "C", title: "Grade C — default workable", reasons };
}

export function routeAfterMarketoGrade(
  stated: string,
  computed: ComputedDemographic,
): string {
  const s = stated.toUpperCase() as "A" | "B" | "C" | "D";
  if (s === computed.grade) {
    return "engage";
  }
  if (GRADE_ORDER[s] < GRADE_ORDER[computed.grade]) {
    return "c_grade_system_lower";
  }
  return "c_grade_system_higher";
}

/** Behavioral tier (1–4) implied by the lead's primary marketing activity. */
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

export function getEngageActivitySummary(engageId: string | undefined): string | null {
  switch (engageId) {
    case "p100":
      return "+100 pts — demo, pricing, or contact sales (Tier 1)";
    case "p50":
      return "+50 pts — WAD, product tour, ROI calculator, or event (Tier 2)";
    case "p15":
      return "+15 pts — BOFU visit, content, newsletter, or webinar form (Tier 3)";
    case "p5":
      return "+5 pts — email link click only (Tier 4; cannot reach MQL threshold alone)";
    default:
      return null;
  }
}

export function routeAfterEngage(
  engageId: string,
  computed: ComputedDemographic | null,
): string {
  if (engageId === "p5") {
    return "c_low_points";
  }
  if (computed?.grade === "D") {
    return "points_after_d";
  }
  return "points";
}

export function enrichConclusionWithDemographic(
  conclusionId: string,
  computed: ComputedDemographic | null,
  answers: DemographicScoringAnswers,
): string[] {
  const extra: string[] = [];
  if (computed) {
    extra.push(`Scoring logic from your inputs → expected ${computed.grade}: ${computed.reasons[0]}`);
  }
  if (answers.marketo_grade && computed) {
    extra.push(
      `Marketo/SFDC shows Grade ${answers.marketo_grade.toUpperCase()} vs expected ${computed.grade}.`,
    );
  }
  if (answers.ee === "ee_5000_8000") {
    extra.push("Note: 5,000–8,000 EE accounts may still MQL under policy even when outside standard ICP size.");
  }
  const engageSummary = getEngageActivitySummary(answers.engage);
  if (engageSummary) {
    extra.push(`Primary activity: ${engageSummary}.`);
  }
  return extra;
}
