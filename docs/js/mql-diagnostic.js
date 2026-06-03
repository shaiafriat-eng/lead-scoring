(function () {
  const MQL_THRESHOLD = 100;
  const INTRO =
    "Let's apply the same demographic rules Marketo uses: employee size, ICP, job function, and seniority combine into grade A–D. Answer about the lead, then we'll compare that logic to engagement and MQL policy.";

  const OPS_BOT_AVATAR =
    '<span class="mql-diagnostic__avatar" aria-hidden title="Marketing Ops bot">' +
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/>' +
    '<path d="M2 14h2"/><path d="M20 14h2"/><path d="M9 13v2"/><path d="M15 13v2"/>' +
    "</svg></span>";

  const GRADE_ORDER = { A: 4, B: 3, C: 2, D: 1 };

  function computeDemographic(answers) {
    if (answers.junk === "yes") return null;

    var reasons = [];

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
        reasons: ["Competitor or Customer accounts are disqualified from normal MQL routing."],
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

    var icpTrue = answers.icp === "icp_true";
    var icpEdge = answers.icp === "icp_50_99";
    var champion = answers.seniority === "cvp_director" || answers.seniority === "vp";
    var seniorManager = answers.seniority === "manager";
    var hrFamily = answers.job === "hr" || answers.job === "hr_finance";
    var icpRelevantOther = answers.job === "finance_ops_ceo" && (icpTrue || icpEdge);

    if ((icpTrue || icpEdge) && hrFamily && champion) {
      if (icpEdge) {
        reasons.push(
          "50–99 employees: treated as Grade A when ICP flag lags but industry is modern (not government/education).",
        );
      } else reasons.push("ICP account (SFDC ICP = TRUE).");
      reasons.push("Job function HR or HR/Finance.");
      reasons.push("Seniority C-level, VP, or Director — champion/decision-maker level.");
      return { grade: "A", title: "Grade A — best fit", reasons: reasons };
    }

    if (icpTrue && icpRelevantOther && champion) {
      reasons.push("ICP account with Finance, Business Operations, CEO, or G&A function.");
      reasons.push("Director+ seniority on an ICP account maps to Grade B.");
      return { grade: "B", title: "Grade B — strong fit (ICP)", reasons: reasons };
    }

    if (answers.icp === "icp_false" && hrFamily && champion) {
      reasons.push("Non-ICP account but HR/HR Finance with C-level, VP, or Director seniority.");
      reasons.push("Non-ICP + decision maker/champion = Grade B.");
      return { grade: "B", title: "Grade B — strong fit (non-ICP champion)", reasons: reasons };
    }

    if (icpTrue && hrFamily && seniorManager) {
      reasons.push("ICP account with HR/HR Finance at manager level (validating/influencing, not top champion).");
      return { grade: "C", title: "Grade C — workable (ICP influencer)", reasons: reasons };
    }

    if (answers.icp === "icp_false" && hrFamily && (seniorManager || answers.seniority === "individual")) {
      reasons.push("Non-ICP with HR/HR Finance but below champion seniority.");
      reasons.push("Workable persona — Grade C; only selective MQL paths (e.g. some WAD C3 regions).");
      return { grade: "C", title: "Grade C — workable (non-ICP)", reasons: reasons };
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
      return { grade: "C", title: "Grade C — ICP validating persona", reasons: reasons };
    }

    reasons.push("Non-ICP account without a champion HR decision maker.");
    return { grade: "C", title: "Grade C — default workable", reasons: reasons };
  }

  function routeGrade(stated, computed) {
    var s = stated.toUpperCase();
    if (s === computed.grade) return s === "D" ? "points_after_d" : "points";
    if (GRADE_ORDER[s] < GRADE_ORDER[computed.grade]) return "c_grade_system_lower";
    return "c_grade_system_higher";
  }

  var STEPS = {
    junk: {
      question: "First, does the record show junk, test, or hard disqualifier flags?",
      helper:
        "Unsubscribed, bounced/invalid email, test/QA data, bad country, ops junk flags, or person-level DQs (Sales, student, intern).",
      options: [
        { id: "yes", label: "Yes — junk / DQ signals present", next: "c_junk" },
        { id: "no", label: "No — passes screening", next: "ee" },
      ],
    },
    ee: {
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
    icp: {
      question: "What is the account ICP / status fit?",
      helper: "SFDC ICP checkbox, account status, and the 50–99 EE edge case when ICP lags.",
      options: [
        { id: "icp_true", label: "ICP = TRUE", next: "job" },
        { id: "icp_false", label: "ICP = FALSE", next: "job" },
        { id: "icp_50_99", label: "50–99 EE, ICP still FALSE (modern industry, not gov/edu)", next: "job" },
        { id: "competitor", label: "Competitor account", next: "c_account_dq" },
        { id: "customer", label: "Customer account", next: "c_account_dq" },
      ],
    },
    job: {
      question: "What is the lead's job function?",
      helper: "Persona rules: HR/HR Finance are champion paths; Sales is always Grade D.",
      options: [
        { id: "hr", label: "HR / People / Talent", next: "seniority" },
        { id: "hr_finance", label: "HR Finance / HR & Finance", next: "seniority" },
        { id: "finance_ops_ceo", label: "Finance, Business Operations, CEO, or G&A", next: "seniority" },
        { id: "sales", label: "Sales (any seniority)", next: "c_persona_dq" },
        { id: "student_intern", label: "Student, intern, professor, or Design", next: "c_persona_dq" },
        { id: "other_workable", label: "Other — but still HR-adjacent / workable", next: "seniority" },
        { id: "other_irrelevant", label: "Other — unrelated to HR buying center", next: "seniority" },
      ],
    },
    seniority: {
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
    marketo_grade: {
      question: "What demographic grade does Marketo or Salesforce show right now?",
      helper: "We'll compare this to the grade implied by employee size + ICP + function + seniority.",
      options: [
        { id: "a", label: "Grade A", next: "__grade_route__" },
        { id: "b", label: "Grade B", next: "__grade_route__" },
        { id: "c", label: "Grade C", next: "__grade_route__" },
        { id: "d", label: "Grade D", next: "__grade_route__" },
      ],
    },
    points_after_d: {
      question: "Even with grade D—roughly how many behavioral points?",
      options: [
        { label: "Under 100 points", next: "c_grade_d_low" },
        { label: "100+ points", next: "source_after_d" },
      ],
    },
    source_after_d: {
      question: "What was the highest-intent action?",
      options: [
        { label: "Hand raiser (demo, pricing, contact sales)", next: "c_hand_on_d" },
        { label: "WAD, content, event, or other", next: "c_grade_d" },
      ],
    },
    points: {
      question: "Are behavioral points at or above " + MQL_THRESHOLD + "?",
      helper: "Behavioral Score Calculation field in Marketo.",
      options: [
        { label: "No — under " + MQL_THRESHOLD + " points", next: "c_low_points" },
        { label: MQL_THRESHOLD + "+ points", next: "source" },
      ],
    },
    source: {
      question: "What path best describes how they engaged?",
      options: [
        { label: "Hand raiser — demo, pricing, or contact sales", next: "c_should_mql" },
        { label: "WAD / product tour / BOFU asset", next: "code_wad" },
        { label: "Activity only — no hand-raise form", next: "code_activity" },
        { label: "ROI calculator submission", next: "c_excluded_roi" },
        { label: "New Movers / high-value asset", next: "c_excluded_movers" },
        { label: "Event or booth — no demo/pricing form", next: "c_event" },
      ],
    },
    code_wad: {
      question: "What is the score code on the WAD path?",
      helper: "Demographic letter + behavioral tier (e.g. B2, C3, D3).",
      options: [
        { label: "A1–A4, B1–B3, or C1", next: "c_should_mql" },
        { label: "C3", next: "c_wad_c3" },
        { label: "D3", next: "c_wad_d3" },
        { label: "D1, D2, or D4", next: "c_wad_d_blocked" },
        { label: "Other / not sure", next: "c_wad_check" },
      ],
    },
    code_activity: {
      question: "What is the score code on the activity-based path?",
      options: [
        { label: "A1 or B1", next: "c_should_mql" },
        { label: "Any other code (A2, B2, C1, C3, D*, etc.)", next: "c_activity_blocked" },
      ],
    },
  };

  var CONCLUSIONS = {
    c_ee_dq: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — employee size blocks auto-MQL",
      summary:
        "Accounts under 20 or over 8,000 employees with Update MQL Process = FALSE do not follow standard auto-MQL.",
      reasons: [
        "Standard ICP employee band is 100–5,000; 5,000–8,000 may still MQL under separate policy.",
        "Small or very large accounts are excluded unless Ops enables exceptions.",
      ],
      nextSteps: ["Confirm employee count and Update MQL Process in Salesforce."],
    },
    c_account_dq: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — competitor or customer",
      summary: "Competitor and Customer accounts are disqualified regardless of persona or points.",
      reasons: ["Account status overrides champion personas."],
      nextSteps: ["Verify account status in SFDC."],
    },
    c_persona_dq: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — persona disqualifier",
      summary: "Sales function or student/intern/design titles score Grade D before channel rules.",
      reasons: ["Sales is always Grade D.", "Student/intern/professor/design are hard DQs."],
      nextSteps: ["Confirm Job Function and Title in Marketo/SFDC."],
    },
    c_grade_system_lower: {
      tone: "review",
      tag: "Worth a review",
      title: "Scoring mismatch — system grade is lower than fit",
      summary:
        "Employee size, ICP, function, and seniority imply a higher grade than Marketo shows. That often explains a missing MQL.",
      reasons: [
        "Demographic grade may be stale after ICP, EE, or persona updates.",
        "SFDC ICP can lag ~24h behind Marketo.",
      ],
      nextSteps: [
        "Compare SFDC ICP, employee count, Job Function, and Seniority to Marketo.",
        "Ask RevOps to refresh scoring, then submit the manual MQL review form (link below) if still warranted.",
      ],
    },
    c_grade_system_higher: {
      tone: "info",
      tag: "Depends on details",
      title: "Scoring mismatch — system grade is higher than fit",
      summary:
        "Marketo shows A/B but persona/account inputs suggest weaker fit. Channel rules may still block MQL.",
      reasons: ["Grade may not have refreshed down.", "High points with wrong code still fail activity/WAD rules."],
      nextSteps: ["Continue to score code and channel checks.", "No-MQL may still be correct."],
    },
    c_junk: {
      tone: "policy",
      tag: "Matches policy",
      title: "Likely intentional — junk or data quality",
      summary: "Junk and disqualifier rules run before engagement scoring.",
      reasons: ["Test/fake email, ops junk flags, or hard DQs."],
      nextSteps: ["Confirm junk/DQ fields in Marketo and Salesforce."],
    },
    c_grade_d_low: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — grade D with low engagement",
      summary: "Poor fit plus under " + MQL_THRESHOLD + " points.",
      reasons: ["Grade D from persona/account rules.", "Below MQL point threshold."],
      nextSteps: ["Keep in nurture or suppression."],
    },
    c_grade_d: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — grade D blocks standard auto-MQL",
      summary: "Grade D is excluded from most WAD and activity auto-MQL paths.",
      reasons: ["WAD blocks D3; activity allows only A1/B1."],
      nextSteps: ["Check MQL policy for the channel."],
    },
    c_hand_on_d: {
      tone: "review",
      tag: "Worth a review",
      title: "Unusual — hand raiser with grade D",
      summary: "Hand raisers normally always MQL when valid—check persona/EE/ICP data quality.",
      reasons: ["Hand raiser bypasses most combo rules when clean.", "Grade D may be stale or wrong."],
      nextSteps: [
        "Verify form type and junk flags.",
        "Submit the Marketing Ops manual MQL review form (link below) if still not MQL.",
      ],
    },
    c_low_points: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — below the MQL point threshold",
      summary: "Need " + MQL_THRESHOLD + "+ points plus fit and channel rules.",
      reasons: ["TOFU-only engagement.", "Email clicks cannot reach 100 alone."],
      nextSteps: ["Review recent activities in Marketo."],
    },
    c_should_mql: {
      tone: "review",
      tag: "Worth a review",
      title: "This lead should have MQL'd — request a review",
      summary: "Fit, points, and channel align with auto-MQL—suspect sync or attribution.",
      reasons: ["Passes demographic and channel logic from your inputs."],
      nextSteps: [
        "Confirm scoring ran after last activity.",
        "Submit the Marketing Ops manual MQL review form (link below) with IDs and field values.",
      ],
    },
    c_excluded_roi: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — ROI calculator excluded",
      summary: "ROI calculator submissions do not auto-MQL.",
      reasons: ["March 2025 Other channel rule."],
      nextSteps: ["Use hand-raiser or WAD for sales intent."],
    },
    c_excluded_movers: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — New Movers asset excluded",
      summary: "New Movers asset does not auto-MQL.",
      reasons: ["Excluded source in policy."],
      nextSteps: ["Confirm program in Marketo."],
    },
    c_event: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — event / booth alone rarely MQLs",
      summary: "Only A + 6Sense Decision/Purchase gets booth bonus; attendance alone is not enough.",
      reasons: ["Booth rules are selective by design."],
      nextSteps: ["Check for hand-raiser form.", "See Why not MQL — Events."],
    },
    c_wad_c3: {
      tone: "info",
      tag: "Depends on details",
      title: "Selective — C3 on WAD is region-limited",
      summary: "C3 may MQL in Americas, UK, APJ only—not Micro.",
      reasons: ["WAD C3 is selective."],
      nextSteps: ["Confirm region in SFDC."],
    },
    c_wad_d3: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — D3 blocked on WAD",
      summary: "WAD policy excludes D3.",
      reasons: ["Known non-MQL combo."],
      nextSteps: ["Keep in nurture."],
    },
    c_wad_d_blocked: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — D grade on WAD",
      summary: "D1, D2, D4 not auto-MQL on WAD.",
      reasons: ["Poor demographic fit on WAD."],
      nextSteps: ["Confirm grade and code."],
    },
    c_wad_check: {
      tone: "info",
      tag: "Depends on details",
      title: "Check the WAD allowlist",
      summary: "WAD auto-MQL: A1–A4, B1–B3, C1; C3 selective; no D3.",
      reasons: ["Compare code to policy tab."],
      nextSteps: ["Escalate only if on allowlist."],
    },
    c_activity_blocked: {
      tone: "policy",
      tag: "Matches policy",
      title: "Expected — activity path is A1 & B1 only",
      summary: "Activity auto-MQL limited to A1 and B1.",
      reasons: ["March 2025 activity path restriction."],
      nextSteps: ["Prioritize nurture or hand-raiser/WAD."],
    },
  };

  var root = document.getElementById("mql-diagnostic");
  if (!root) return;

  var stepId = "junk";
  var history = [];
  var answers = {};
  var conclusionId = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function enrichReasons(id, computed) {
    var extra = [];
    if (computed) extra.push("Scoring logic from your inputs → expected " + computed.grade + ": " + computed.reasons[0]);
    if (answers.marketo_grade && computed) {
      extra.push(
        "Marketo/SFDC shows Grade " + answers.marketo_grade.toUpperCase() + " vs expected " + computed.grade + ".",
      );
    }
    if (answers.ee === "ee_5000_8000") {
      extra.push("Note: 5,000–8,000 EE may still MQL under policy outside standard ICP size.");
    }
    return extra;
  }

  function render() {
    var step = conclusionId ? null : STEPS[stepId];
    var conclusion = conclusionId ? CONCLUSIONS[conclusionId] : null;
    var computed = computeDemographic(answers);

    var html =
      '<div class="mql-diagnostic__progress" aria-hidden><div class="mql-diagnostic__progress-bar" style="width:' +
      (conclusionId ? 100 : Math.min(12 + history.length * 10, 92)) +
      '%"></div></div>';
    html += '<div class="mql-diagnostic__thread" role="log" aria-live="polite">';
    html +=
      '<div class="mql-diagnostic__msg mql-diagnostic__msg--guide">' + OPS_BOT_AVATAR + '<div class="mql-diagnostic__bubble">' +
      esc(INTRO) +
      "</div></div>";

    history.forEach(function (entry) {
      html +=
        '<div class="mql-diagnostic__msg mql-diagnostic__msg--guide">' + OPS_BOT_AVATAR + '<div class="mql-diagnostic__bubble">' +
        esc(entry.question) +
        '</div></div><div class="mql-diagnostic__msg mql-diagnostic__msg--user"><div class="mql-diagnostic__bubble mql-diagnostic__bubble--user">' +
        esc(entry.answer) +
        "</div></div>";
    });

    if (step && stepId === "marketo_grade" && computed) {
      html += '<div class="mql-diagnostic__grade-insight"><p class="mql-diagnostic__grade-insight-title">From scoring logic → <strong>expected ' +
        computed.grade +
        "</strong> (" +
        esc(computed.title) +
        ')</p><ul>';
      computed.reasons.forEach(function (r) {
        html += "<li>" + esc(r) + "</li>";
      });
      html += "</ul></div>";
    }

    if (step) {
      html +=
        '<div class="mql-diagnostic__msg mql-diagnostic__msg--guide">' + OPS_BOT_AVATAR + '<div class="mql-diagnostic__bubble"><p style="margin:0;font-weight:700">' +
        esc(step.question) +
        "</p>";
      if (step.helper) {
        html += '<p style="margin:0.5rem 0 0;font-size:0.8125rem;color:var(--muted)">' + esc(step.helper) + "</p>";
      }
      html += "</div></div>";
    }

    if (conclusion) {
      var border =
        conclusion.tone === "review"
          ? "var(--cherry-syrup)"
          : conclusion.tone === "info"
            ? "var(--orange-juice)"
            : "var(--border)";
      html +=
        '<div class="mql-diagnostic__conclusion mql-diagnostic__conclusion--' +
        conclusion.tone +
        '" style="border-left:4px solid ' +
        border +
        '"><span class="mql-diagnostic__conclusion-tag">' +
        esc(conclusion.tag) +
        "</span><h3 style=\"margin:0 0 0.5rem;font-size:1.15rem\">" +
        esc(conclusion.title) +
        '</h3><p style="margin:0 0 1rem;color:var(--muted)">' +
        esc(conclusion.summary) +
        '</p><p style="margin:0 0 0.35rem;font-weight:700;font-size:0.875rem">Why</p><ul style="margin:0 0 1rem;padding-left:1.25rem;color:var(--muted)">';
      conclusion.reasons.concat(enrichReasons(conclusionId, computed)).forEach(function (r) {
        html += "<li style=\"margin-bottom:0.35rem\">" + esc(r) + "</li>";
      });
      html += '</ul><p style="margin:0 0 0.35rem;font-weight:700;font-size:0.875rem">What to do next</p><ul style="margin:0;padding-left:1.25rem;color:var(--muted)">';
      conclusion.nextSteps.forEach(function (s) {
        html += "<li style=\"margin-bottom:0.35rem\">" + esc(s) + "</li>";
      });
      html += "</ul></div>";
    }

    html += "</div>";

    if (step) {
      html += '<div class="mql-diagnostic__options" role="group" aria-label="Your answer">';
      step.options.forEach(function (opt, idx) {
        html +=
          '<button type="button" class="mql-diagnostic__option" data-idx="' +
          idx +
          '">' +
          esc(opt.label) +
          "</button>";
      });
      html += "</div>";
    }

    html += '<div class="mql-diagnostic__footer">';
    if (conclusion) html += '<button type="button" class="btn btn-primary" id="mql-diag-reset">Check another lead</button>';
    else if (history.length) html += '<button type="button" class="btn btn-secondary" id="mql-diag-reset">Start over</button>';
    html += "</div>";

    root.innerHTML = html;

    if (step) {
      root.querySelectorAll(".mql-diagnostic__option").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var opt = step.options[Number(btn.getAttribute("data-idx"))];
          history.push({ question: step.question, answer: opt.label });
          if (opt.id) answers[stepId] = opt.id;
          var next = opt.next;
          if (next === "__grade_route__") {
            var comp = computeDemographic(answers);
            if (comp) next = routeGrade(opt.id, comp);
          }
          if (CONCLUSIONS[next]) {
            conclusionId = next;
            stepId = null;
          } else {
            stepId = next;
            conclusionId = null;
          }
          render();
        });
      });
    }

    var resetBtn = document.getElementById("mql-diag-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        stepId = "junk";
        history = [];
        answers = {};
        conclusionId = null;
        render();
      });
    }
  }

  render();
})();
