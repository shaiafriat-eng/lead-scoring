/** @type {Record<string, { definition: string, calculation: string, example: string }>} */
export const POST_MQL_KPI_TIPS = {
  "post-mql-contacts": {
    definition:
      "Unique MQL contacts with at least one tracked website return visit after their MQL date. Contact-level.",
    calculation:
      "Count of contacts in the post-MQL export with ≥1 post-MQL return session in the current filter. The export only includes contacts with tracked post-MQL website activity.",
    example:
      "A contact who became MQL in April and returned once in May counts here.",
  },
  "return-visits": {
    definition: "Total post-MQL return sessions across all contacts.",
    calculation:
      "Sum of return visit sessions after MQL date (30-minute inactivity gap defines a session).",
    example:
      "A contact who returned 4 times after MQL contributes 4 to this total.",
  },
  "page-views": {
    definition: "Total page views recorded after the MQL date.",
    calculation: "Sum of post-MQL page view events across all contacts.",
    example:
      "66 page views for one contact and 10 for another contribute 76 total.",
  },
  "avg-return-visits": {
    definition:
      "Average return sessions per contact who came back at least once.",
    calculation:
      "Total return visits divided by contacts with ≥1 return visit.",
    example:
      "561 return visits across 200 returning contacts ≈ 2.8 avg per returning contact.",
  },
  "high-intent-returners": {
    definition:
      "Contacts who viewed high-intent pages after MQL (pricing, demo, trial).",
    calculation:
      "Unique contacts with ≥1 post-MQL page view matching pricing/demo/trial URL patterns.",
    example:
      "A contact who viewed /pricing after MQL counts as high-intent.",
  },
  "immediate-outreach": {
    definition:
      "Returning MQL contacts with outreach priority score of 55 or higher. These contacts showed post-MQL intent and should be reviewed for follow-up.",
    calculation:
      "Count of filtered contacts with outreach priority score ≥ 55.",
    example:
      "A contact with 4 returns, pricing visit, and Discovery Call status likely appears here.",
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

export function initPostMqlKpiTooltips(root = document) {
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
    const tip = key ? POST_MQL_KPI_TIPS[key] : null;
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
