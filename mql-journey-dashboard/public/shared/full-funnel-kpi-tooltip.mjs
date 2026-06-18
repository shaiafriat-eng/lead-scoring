/** @type {Record<string, { definition: string, calculation: string, example: string }>} */
export const FULL_FUNNEL_KPI_TIPS = {
  "accounts-pre-mql": {
    definition:
      "Unique accounts with tracked website activity before at least one contact became MQL. Counted at account level (company/domain), not per contact.",
    calculation:
      "One row per account group in pre-MQL data that has ≥1 touch before MQL.",
    example:
      "Acme Corp with two MQL contacts still counts as one account with pre-MQL data.",
  },
  "became-mql": {
    definition:
      "MQL conversions across accounts in the current filter. Includes every contact who reached MQL, so one account can contribute more than one.",
    calculation:
      "Sum of mqlCount per account (contact-level MQL events grouped under accounts).",
    example:
      "One account with 3 MQL contacts contributes 3 to Became MQL.",
  },
  "returned-post-mql": {
    definition:
      "Unique accounts where at least one MQL contact had tracked website return activity after MQL.",
    calculation:
      "Group pre-MQL journeys by account; count accounts where any related MQL contact email matches a post-MQL export with ≥1 return session.",
    example:
      "An account with two MQL contacts counts once if either contact returned post-MQL, even when the primary contact did not.",
  },
  "post-mql-return-rate": {
    definition:
      "Share of accounts with pre-MQL data where any MQL contact shows tracked post-MQL return activity.",
    calculation:
      "Accounts returned post-MQL ÷ accounts with pre-MQL data × 100.",
    example:
      "310 of 3,814 accounts → 8.1% return rate.",
  },
  "avg-pre-mql-touches": {
    definition:
      "Average pre-MQL touch count per account before qualification.",
    calculation:
      "Sum of pre-MQL touches across filtered accounts ÷ number of accounts.",
    example:
      "600 touches across 200 accounts → 3.0 avg pre-MQL touches.",
  },
  "avg-post-mql-views": {
    definition:
      "Average post-MQL page views among accounts that returned after MQL only.",
    calculation:
      "Total post-MQL page views ÷ accounts with ≥1 post-MQL return.",
    example:
      "220 page views across 40 returning accounts → 5.5 avg post-MQL views.",
  },
  "account-vs-mql": {
    definition:
      "Post-MQL tab counts MQL contacts; Full Funnel counts accounts. One account can include multiple MQL contacts and multiple returning contacts.",
    calculation:
      "Became MQL sums contact-level mqlCount. Accounts returned post-MQL counts unique accounts where any related MQL contact has tracked post-MQL returns.",
    example:
      "3,967 MQL contacts across 3,814 accounts; 335 returning contacts vs 310 returning accounts in the current export.",
  },
};

const INFO_ICON = `<svg class="kpi-info-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.25"/><path fill="currentColor" d="M7.25 7h1.5V11h-1.5V7zm0-2.5h1.5V5h-1.5V2.5z"/></svg>`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tipHtml(tip) {
  return `
    <p class="kpi-tooltip-def">${escapeHtml(tip.definition)}</p>
    <p class="kpi-tooltip-block"><span class="kpi-tooltip-heading">Calculation</span>${escapeHtml(tip.calculation)}</p>
    <p class="kpi-tooltip-block"><span class="kpi-tooltip-heading">Example</span>${escapeHtml(tip.example)}</p>`;
}

export function initFullFunnelKpiTooltips(root = document) {
  let floatEl = document.getElementById("kpiTooltipFloat");
  if (!floatEl) {
    floatEl = document.createElement("div");
    floatEl.id = "kpiTooltipFloat";
    floatEl.className = "kpi-tooltip-float";
    floatEl.hidden = true;
    floatEl.setAttribute("role", "tooltip");
    document.body.appendChild(floatEl);
  }

  let activeTrigger = null;
  const hide = () => {
    floatEl.hidden = true;
    activeTrigger = null;
  };
  const show = (trigger) => {
    const key = trigger.getAttribute("data-kpi-tip");
    const tip = key ? FULL_FUNNEL_KPI_TIPS[key] : null;
    if (!tip) return;
    activeTrigger = trigger;
    floatEl.innerHTML = tipHtml(tip);
    floatEl.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const tipRect = floatEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    if (top + tipRect.height > window.innerHeight - 8) {
      top = rect.top - tipRect.height - 8;
    }
    floatEl.style.left = `${left}px`;
    floatEl.style.top = `${top}px`;
  };

  root.querySelectorAll("[data-kpi-tip]").forEach((trigger) => {
    if (!trigger.querySelector(".kpi-info-icon") && trigger.classList.contains("kpi-info-btn")) {
      trigger.insertAdjacentHTML("afterbegin", INFO_ICON);
    }
    trigger.addEventListener("mouseenter", () => show(trigger));
    trigger.addEventListener("mouseleave", hide);
    trigger.addEventListener("focus", () => show(trigger));
    trigger.addEventListener("blur", hide);
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    trigger.addEventListener("mousedown", (e) => e.stopPropagation());
  });

  window.addEventListener(
    "scroll",
    () => {
      if (activeTrigger && !floatEl.hidden) show(activeTrigger);
    },
    true,
  );
  window.addEventListener("resize", hide);
}
