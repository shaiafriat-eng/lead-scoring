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
      branchMode: "show-all",
      branchPrompt: "How points accrue (examples):",
      branches: [
        { id: "p100", label: "+100 pts", outcome: "Demo, pricing, contact sales — immediate high intent" },
        { id: "p50", label: "+50 pts", outcome: "WAD, product tour, ROI calculator, events" },
        { id: "p15", label: "+15 pts", outcome: "BOFU visit, content/newsletter/webinar form (daily caps apply)" },
        { id: "p5", label: "+5 pts", outcome: "Email click — capped; cannot reach MQL threshold alone" },
      ],
    },
    {
      id: "behavior",
      title: "Behavioral tier (1–4)",
      body:
        "Total points map to engagement tier. MQL threshold is " +
        MQL_THRESHOLD +
        " points, but channel and grade still gate auto-MQL.",
      branchMode: "show-all",
      branchPrompt: "Point total → behavioral tier:",
      branches: [
        { id: "1", label: "Tier 1 (100+ pts)", grade: "1", outcome: "Demo, pricing, explicit sales contact — highest intent" },
        { id: "2", label: "Tier 2 (50–99 pts)", grade: "2", outcome: "WAD, product tour, BOFU, events" },
        { id: "3", label: "Tier 3 (15–49 pts)", grade: "3", outcome: "Nurture forms, MOFU, CPL" },
        { id: "4", label: "Tier 4 (0–14 pts)", grade: "4", outcome: "TOFU only — lowest engagement" },
      ],
    },
    {
      id: "code",
      title: "Score code",
      body: "Demographic letter + behavioral number = code (e.g. A1, B3). Used for prioritization, reporting, and MQL combo rules.",
      branchMode: "show-all",
      branchPrompt: "Examples:",
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
        { id: "mql-ab", label: "A1 / B1 + qualifying channel", outcome: "Usually auto-MQL on activity-based paths (March 2025 policy)." },
        { id: "mql-c", label: "C3 + WAD (selective)", outcome: "May MQL in target regions only; not a blanket pass." },
        { id: "mql-d", label: "Any D grade", grade: "D", outcome: "Generally no auto-MQL—D3 blocked on WAD; D4 lowest priority." },
        {
          id: "mql-block",
          label: "100+ pts but wrong combo",
          outcome: "Points alone do not MQL if grade/channel/source is excluded (see MQL routing).",
        },
      ],
    },
    {
      id: "sales",
      title: "Sales priority",
      body: "Queue order follows the score matrix (A1 first → D4 lowest). Scores refresh as fit or engagement changes.",
      branchMode: "show-all",
      branchPrompt: "Routing outcome:",
      branches: [
        { id: "top", label: "A1 / top codes", outcome: "Fast-track outreach and SDR queue priority" },
        { id: "mid", label: "B2–C2", outcome: "Standard nurture or timed sales follow-up" },
        { id: "low", label: "D grades", outcome: "Suppress, nurture only, or manual review exceptions" },
      ],
    },
  ];

  let flowStep = 0;
  const choices = {};

  const panel = document.getElementById("flow-panel");
  const dotsEl = document.getElementById("flow-dots");
  if (!panel || !dotsEl) return;

  function endSummary() {
    if (choices.junk === "yes") {
      return "Lead stops at Grade D after junk screening—not auto-MQL on standard WAD/activity paths.";
    }
    if (choices.demo === "d") {
      return (
        "Demographic grade D (persona/account not a fit). Even with " +
        MQL_THRESHOLD +
        "+ points, standard auto-MQL paths are usually blocked—see MQL routing."
      );
    }
    if (choices.demo) {
      const code =
        choices.demo === "a" ? "A1" : choices.demo === "b" ? "B2" : choices.demo === "c" ? "C3" : "D4";
      return (
        "Example with grade " +
        choices.demo.toUpperCase() +
        ": strong engagement could produce " +
        code +
        ". MQL still depends on channel rules."
      );
    }
    return "Example: ICP champion with 105 points → A1 → high priority. MQL threshold: " + MQL_THRESHOLD + " points.";
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
          choices[step.id] = branch.id;
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

    const branchesEl = renderBranches(s);
    if (branchesEl) panel.appendChild(branchesEl);

    if (flowStep === FLOW_STEPS.length - 1) {
      const end = document.createElement("p");
      end.style.cssText =
        "margin:1rem 0;padding:1rem;background:linear-gradient(135deg,var(--dark-wine),var(--cherry-syrup));color:#fff;border-radius:12px;font-size:0.9375rem";
      end.textContent = endSummary();
      panel.appendChild(end);
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

    const needsChoice = s.branchMode === "choose-one" && !choices[s.id];

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
