(function () {
  const MQL_THRESHOLD = 100;

  const FLOW_STEPS = [
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
          outcome:
            "Grade D immediately. Lead is nurtured or suppressed—not scored through the normal A–D fit ladder.",
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
        },
        {
          id: "b",
          label: "Grade B — Strong fit",
          grade: "B",
          outcome: "ICP + relevant function, or non-ICP + decision maker/champion. Still strong for outreach.",
        },
        {
          id: "c",
          label: "Grade C — Workable",
          grade: "C",
          outcome:
            "Non-ICP with a workable persona, or ICP with validating/influencing (non-champion) function. Selective MQL paths only.",
        },
        {
          id: "d",
          label: "Grade D — Not a fit",
          grade: "D",
          outcome:
            "Persona and/or account are not a fit (irrelevant role, non-ICP without champion, competitor, customer, bad geo, DQ rules). Grade D—typically blocked from standard auto-MQL paths.",
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
      body: "Based on your demographic grade, activity, and score code, this is the expected auto-MQL outcome.",
      branchMode: "derived",
      branches: [],
    },
  ];

  let flowStep = 0;
  const choices = {};

  const panel = document.getElementById("flow-panel");
  const dotsEl = document.getElementById("flow-dots");
  if (!panel || !dotsEl) return;

  const ENGAGE_TO_TIER = { p100: "1", p50: "2", p15: "3", p5: "4" };

  function getEngageBranch(engageId) {
    const engageStep = FLOW_STEPS.find(function (s) {
      return s.id === "engage";
    });
    return engageStep && engageStep.branches
      ? engageStep.branches.find(function (b) {
          return b.id === engageId;
        })
      : undefined;
  }

  function getBehaviorBranchByTier(tierId) {
    const behaviorStep = FLOW_STEPS.find(function (s) {
      return s.id === "behavior";
    });
    return behaviorStep && behaviorStep.branches
      ? behaviorStep.branches.find(function (b) {
          return b.id === tierId;
        })
      : undefined;
  }

  function scoreCodeFromChoices(demoId, tier) {
    if (!demoId || !tier) return null;
    return demoId.toUpperCase() + tier;
  }

  function getScoreCodeOutcome(code) {
    const codeStep = FLOW_STEPS.find(function (s) {
      return s.id === "code";
    });
    const match =
      codeStep &&
      codeStep.branches &&
      codeStep.branches.find(function (b) {
        return b.label === code || b.grade === code;
      });
    if (match) return match.outcome;
    var letter = code.charAt(0);
    if (letter === "D") return "Poor fit combined with engagement level — lowest priority; usually no auto-MQL.";
    if (letter === "A") return "Best demographic fit with this engagement tier — top of the sales queue.";
    if (letter === "B") return "Strong fit with this engagement tier — high priority outreach.";
    if (letter === "C") return "Workable fit with this engagement tier — selective MQL and outreach paths.";
    return "Used for prioritization, reporting, and MQL combo rules.";
  }

  function currentBehaviorTier() {
    return choices.behavior || (choices.engage ? ENGAGE_TO_TIER[choices.engage] : null);
  }

  function setChoice(stepId, branchId) {
    choices[stepId] = branchId;
    if (stepId === "engage" && ENGAGE_TO_TIER[branchId]) {
      choices.behavior = ENGAGE_TO_TIER[branchId];
    }
  }

  function getMqlDecisionFromFlow() {
    if (choices.junk === "yes") {
      return {
        value: "Not MQL",
        tone: "no",
        outcome:
          "Lead matched junk/test screening (grade D). Standard auto-MQL paths do not apply—nurture or suppress per ops rules.",
      };
    }
    var tier = currentBehaviorTier();
    var demo = choices.demo;
    var engage = choices.engage;
    if (!demo || !engage || !tier) return null;

    var code = scoreCodeFromChoices(demo, tier);
    var engageBranch = getEngageBranch(engage);
    var activityLabel = engageBranch ? engageBranch.label : "Selected activity";

    if (engage === "p100") {
      if (demo === "d") {
        return {
          value: "Review required",
          tone: "review",
          outcome:
            code +
            " — hand-raiser with grade D is unusual. Verify junk/ICP data or submit a manual MQL review.",
        };
      }
      return {
        value: "Likely auto-MQL",
        tone: "yes",
        outcome:
          activityLabel + " → " + code + ". Hand-raiser path is always auto-MQL when the record is clean.",
      };
    }

    if (demo === "d") {
      if (engage === "p50" && tier === "3") {
        return {
          value: "Not auto-MQL",
          tone: "no",
          outcome: code + " on WAD — D3 is explicitly blocked. Other D grades rarely auto-MQL.",
        };
      }
      return {
        value: "Not auto-MQL",
        tone: "no",
        outcome: code + " — grade D is excluded from most WAD and activity auto-MQL paths.",
      };
    }

    if (engage === "p5") {
      return {
        value: "Not auto-MQL",
        tone: "no",
        outcome: "Email clicks only (+5 pts) cannot reach the " + MQL_THRESHOLD + "-point threshold alone.",
      };
    }

    if (engage === "p15") {
      return {
        value: "Not auto-MQL",
        tone: "no",
        outcome: code + " — ~15 pts from this activity; below the " + MQL_THRESHOLD + "-point MQL threshold.",
      };
    }

    if (engage === "p50") {
      if (tier === "3" && demo === "c") {
        return {
          value: "Selective MQL",
          tone: "selective",
          outcome: code + " on WAD — C3 may auto-MQL in Americas, UK, and APJ only. Not a blanket pass.",
        };
      }
      if (demo === "c" && tier === "1") {
        return {
          value: "Likely auto-MQL",
          tone: "yes",
          outcome: code + " on WAD — C1 is in the allowed WAD auto-MQL list.",
        };
      }
      if (demo === "a" || demo === "b") {
        return {
          value: "Likely auto-MQL",
          tone: "yes",
          outcome: code + " on WAD — fits allowed combos (A1–A4, B1–B3, and C1).",
        };
      }
      if (demo === "c") {
        return {
          value: "Unlikely auto-MQL",
          tone: "no",
          outcome: code + " on WAD — only C1 and selective C3 qualify.",
        };
      }
      return { value: "Check WAD rules", tone: "review", outcome: code + " on WAD — confirm allowed combos in MQL policy." };
    }

    if (tier === "1" && (demo === "a" || demo === "b")) {
      return {
        value: "Likely auto-MQL",
        tone: "yes",
        outcome: code + " — activity-based auto-MQL allows A1 and B1 only (" + MQL_THRESHOLD + "+ pts).",
      };
    }

    if (demo === "a" || demo === "b") {
      return {
        value: "Not auto-MQL",
        tone: "no",
        outcome: code + " — activity-based path requires A1 or B1; " + code + " does not qualify.",
      };
    }

    if (demo === "c") {
      return {
        value: "Unlikely auto-MQL",
        tone: "no",
        outcome: code + " — grade C only has selective paths (e.g. C3 + WAD in target regions).",
      };
    }

    return { value: "Check MQL policy", tone: "review", outcome: code + " — confirm channel rules on the MQL Policy page." };
  }

  function renderDerived(step) {
    var wrap = document.createElement("div");
    wrap.className = "flow-derived";
    wrap.style.marginBottom = "1.25rem";

    if (step.id === "behavior") {
      var tier = currentBehaviorTier();
      if (!choices.engage || !tier) {
        var hint = document.createElement("p");
        hint.style.cssText = "font-size:0.875rem;color:var(--muted);margin:0";
        hint.textContent = "Select a marketing activity on step 4 first.";
        wrap.appendChild(hint);
        return wrap;
      }
      var tierBranch = getBehaviorBranchByTier(tier);
      wrap.className = "flow-derived";
      appendDerived(wrap, "Behavioral tier", "Tier " + tier, tierBranch ? tierBranch.outcome : "");
      return wrap;
    }

    if (step.id === "code") {
      var behaviorTier = currentBehaviorTier();
      if (!choices.demo || !behaviorTier) {
        var hint2 = document.createElement("p");
        hint2.style.cssText = "font-size:0.875rem;color:var(--muted);margin:0";
        hint2.textContent = "Complete steps 3 and 4 first — the score code is built from your demographic grade and activity.";
        wrap.appendChild(hint2);
        return wrap;
      }
      var code = scoreCodeFromChoices(choices.demo, behaviorTier);
      wrap.className = "flow-derived flow-derived--grade-" + choices.demo.toUpperCase();
      if (choices.demo === "d") wrap.className = "flow-derived flow-derived--grade-D";
      appendDerived(wrap, "Score code", code, getScoreCodeOutcome(code));
      return wrap;
    }

    if (step.id === "mql") {
      var decision = getMqlDecisionFromFlow();
      if (!decision) {
        var hint3 = document.createElement("p");
        hint3.style.cssText = "font-size:0.875rem;color:var(--muted);margin:0";
        hint3.textContent = "Complete steps 2–6 first — MQL outcome depends on your path through the flow.";
        wrap.appendChild(hint3);
        return wrap;
      }
      wrap.className = "flow-derived flow-derived--mql-" + decision.tone;
      appendDerived(wrap, "MQL decision", decision.value, decision.outcome);
      return wrap;
    }

    return null;
  }

  function appendDerived(wrap, label, value, outcome) {
    var lbl = document.createElement("p");
    lbl.className = "flow-derived__label";
    lbl.textContent = label;
    wrap.appendChild(lbl);
    var val = document.createElement("p");
    val.className = "flow-derived__value";
    val.setAttribute("aria-live", "polite");
    val.textContent = value;
    wrap.appendChild(val);
    var out = document.createElement("p");
    out.className = "flow-derived__outcome";
    out.textContent = outcome;
    wrap.appendChild(out);
  }

  function renderBranches(step) {
    if (!step.branches || !step.branches.length) return null;
    const wrap = document.createElement("div");
    wrap.className = "flow-branches";
    if (step.branchPrompt) {
      const prompt = document.createElement("p");
      prompt.style.cssText = "font-weight:700;font-size:0.875rem;margin:0 0 0.65rem";
      prompt.textContent = step.branchPrompt;
      wrap.appendChild(prompt);
    }
    const list = document.createElement("ul");
    list.className = "flow-branches__list";
    const isChoose = step.branchMode === "choose-one";
    const selected = choices[step.id];

    step.branches.forEach(function (branch) {
      const li = document.createElement("li");
      const gradeClass = branch.grade ? " flow-branches__item--grade-" + branch.grade.charAt(0) : "";
      li.className =
        "flow-branches__item" + (isChoose ? " flow-branches__item--btn" : "") + gradeClass + (selected === branch.id ? " is-selected" : "");

      if (isChoose) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "flow-branches__trigger";
        if (branch.grade) {
          const badge = document.createElement("span");
          badge.className = "flow-branches__badge";
          badge.textContent = branch.grade;
          btn.appendChild(badge);
        }
        const lbl = document.createElement("span");
        lbl.className = "flow-branches__label";
        lbl.textContent = branch.label;
        btn.appendChild(lbl);
        btn.onclick = function () {
          setChoice(step.id, branch.id);
          renderFlow();
        };
        li.appendChild(btn);
      } else {
        if (branch.grade) {
          const badge = document.createElement("span");
          badge.className = "flow-branches__badge";
          badge.textContent = branch.grade;
          li.appendChild(badge);
        }
        const body = document.createElement("div");
        const strong = document.createElement("strong");
        strong.className = "flow-branches__label";
        strong.textContent = branch.label;
        body.appendChild(strong);
        const out = document.createElement("p");
        out.className = "flow-branches__outcome";
        out.textContent = branch.outcome;
        body.appendChild(out);
        li.appendChild(body);
      }

      const outP = document.createElement("p");
      outP.className = "flow-branches__outcome";
      outP.textContent = branch.outcome;
      if (isChoose) li.appendChild(outP);

      list.appendChild(li);
    });

    wrap.appendChild(list);

    if (isChoose && selected) {
      const sel = step.branches.find(function (b) {
        return b.id === selected;
      });
      if (sel) {
        const note = document.createElement("p");
        note.className = "flow-branches__selected";
        note.style.cssText =
          "margin-top:0.75rem;padding:0.75rem 1rem;background:var(--cappuccino-foam);border-radius:8px;font-size:0.875rem";
        note.textContent = sel.outcome;
        wrap.appendChild(note);
      }
    }

    return wrap;
  }

  function renderFlow() {
    dotsEl.innerHTML = "";
    FLOW_STEPS.forEach(function (_, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "flow-dot" + (i === flowStep ? " active" : i < flowStep ? " done" : "");
      b.textContent = String(i + 1);
      b.onclick = function () {
        flowStep = i;
        renderFlow();
      };
      dotsEl.appendChild(b);
    });

    const s = FLOW_STEPS[flowStep];
    if (s.id === "behavior" && choices.engage && ENGAGE_TO_TIER[choices.engage] && !choices.behavior) {
      choices.behavior = ENGAGE_TO_TIER[choices.engage];
    }
    panel.innerHTML = "";
    const label = document.createElement("p");
    label.className = "label";
    label.textContent = "Step " + (flowStep + 1) + " of " + FLOW_STEPS.length;
    panel.appendChild(label);
    const h = document.createElement("h3");
    h.textContent = s.title;
    panel.appendChild(h);
    const p = document.createElement("p");
    p.style.color = "var(--muted)";
    p.style.marginBottom = "1rem";
    p.textContent = s.body;
    panel.appendChild(p);

    if (s.branchMode === "derived") {
      const derivedEl = renderDerived(s);
      if (derivedEl) panel.appendChild(derivedEl);
    } else {
      const branchesEl = renderBranches(s);
      if (branchesEl) panel.appendChild(branchesEl);
    }

    const nav = document.createElement("div");
    nav.style.cssText = "margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn btn-secondary";
    back.textContent = "Back";
    back.disabled = flowStep === 0;
    back.onclick = function () {
      if (flowStep > 0) {
        flowStep--;
        renderFlow();
      }
    };
    nav.appendChild(back);

    var needsChoice = false;
    if (s.id === "behavior") needsChoice = !choices.engage || !currentBehaviorTier();
    else if (s.id === "code") needsChoice = !choices.demo || !currentBehaviorTier();
    else if (s.id === "mql") needsChoice = !getMqlDecisionFromFlow();
    else if (s.branchMode === "choose-one") needsChoice = !choices[s.id];

    if (flowStep < FLOW_STEPS.length - 1) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn btn-primary";
      next.textContent = "Next";
      next.disabled = needsChoice;
      next.onclick = function () {
        if (needsChoice) return;
        const branch = s.branches && s.branches.find(function (b) {
          return b.id === choices[s.id];
        });
        if (branch && branch.action === "end") flowStep = FLOW_STEPS.length - 1;
        else flowStep++;
        renderFlow();
      };
      nav.appendChild(next);
    } else {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "btn btn-primary";
      reset.textContent = "Start over";
      reset.onclick = function () {
        flowStep = 0;
        Object.keys(choices).forEach(function (k) {
          delete choices[k];
        });
        renderFlow();
      };
      nav.appendChild(reset);
    }
    panel.appendChild(nav);
  }

  renderFlow();
})();
