/** @typedef {{ definition: string, calculation: string, example: string }} KpiTip */

/** @type {Record<string, KpiTip>} */
export const PRE_MQL_KPI_TIPS = {
  "mql-contacts": {
    definition:
      "Unique contacts that became MQL in the selected dataset. One account can have more than one MQL contact.",
    calculation:
      "Each unique person who became MQL counts once per MQL conversion date.",
    example:
      "If two people from the same company became MQL on different dates, they count as two MQL contacts.",
  },
  "calendar-presented": {
    definition:
      "Contacts where Chili Piper confirmed that a calendar or meeting booking flow was shown before the MQL date.",
    calculation:
      "Unique MQL contacts with a matched Chili Piper concierge session between first website touch and MQL date. Includes Meeting Not Scheduled, Meeting Scheduled, Cancelled, and Scheduling Meeting.",
    example:
      "A lead submitted a demo form and Chili Piper displayed available meeting times. Even if the lead did not book, this counts as calendar presented.",
  },
  "meeting-scheduled-after-calendar": {
    definition:
      "Contacts who saw the Chili Piper calendar and then scheduled a meeting in the same MQL journey.",
    calculation:
      "Unique contacts where a calendar was presented, a meeting was scheduled, and the scheduled time is on or after the calendar presentation. Source: Chili Piper status Meeting Scheduled.",
    example:
      "A lead saw available meeting slots at 10:00 and booked a meeting at 10:02. This counts as meeting scheduled.",
  },
  "scheduled-without-calendar": {
    definition:
      "Contacts with a scheduled meeting where no earlier Chili Piper calendar presentation was found in the same MQL journey. This should usually be zero in a clean Chili Piper flow.",
    calculation:
      "Unique contacts with a meeting scheduled in Chili Piper but no calendar-presented session in the same journey window.",
    example:
      "A meeting exists in Chili Piper, but the dashboard cannot find the earlier calendar presentation event. This may indicate missing data, a different booking path, or a matching issue.",
  },
  "offered-not-booked": {
    definition:
      "Contacts who saw the Chili Piper calendar before MQL but did not schedule a meeting in that journey.",
    calculation:
      "Unique contacts with a calendar-presented timestamp and no meeting scheduled timestamp in the same journey.",
    example:
      "A lead opened the booking calendar but left without selecting a time.",
  },
  "cp-exceptions-strip": {
    definition:
      "Sessions that ended in Disqualified or Cancelled status. These are shown separately from the main calendar-to-meeting funnel.",
    calculation:
      "Counts of MQL contacts with Chili Piper concierge sessions marked Disqualified or Cancelled in the journey window.",
    example:
      "A lead was disqualified by routing rules, or started a booking flow that was later cancelled.",
  },
  "concierge-disqualified": {
    definition:
      "Contacts where the Chili Piper concierge flow ended with a disqualified status.",
    calculation:
      "Unique MQL contacts with a Chili Piper concierge session status of Disqualified in the journey window.",
    example:
      "A lead submitted a form but did not meet the routing or qualification rules, so Chili Piper disqualified the session.",
  },
  "booking-cancelled": {
    definition:
      "Chili Piper sessions where a meeting or booking flow was cancelled.",
    calculation:
      "Chili Piper concierge sessions with status Cancelled matched to an MQL contact in the journey window.",
    example:
      "A lead scheduled a meeting but later cancelled it, or the booking flow ended as cancelled.",
  },
  "discovery-call": {
    definition:
      "Contacts whose current lead status is Discovery Call. This is based on CRM/lead status, not directly on Chili Piper booking status.",
    calculation:
      "Unique MQL contacts where the current lead status is Discovery Call.",
    example:
      "A lead may have booked through Chili Piper, but this KPI only counts them if the CRM lead status currently says Discovery Call.",
  },
  "avg-premql-touches": {
    definition:
      "The average number of tracked pre-MQL activities per MQL contact.",
    calculation:
      "Total pre-MQL activities divided by total MQL contacts. Includes page views, form activity, source touches, and repeated visits.",
    example:
      "If one contact had 10 tracked activities before becoming MQL and another had 2, both contribute to the average.",
  },
  "no-cp-session": {
    definition:
      "MQL contacts where no matching Chili Piper concierge session was found between first touch and MQL date.",
    calculation:
      "Unique MQL contacts with no Chili Piper session matched by email and journey window.",
    example:
      "This may happen if the lead did not use Chili Piper, used another booking path, used a different email, or the Chili Piper data is missing.",
  },
};

const INFO_ICON = `<svg class="kpi-info-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.25"/><path fill="currentColor" d="M7.25 7h1.5V11h-1.5V7zm0-2.5h1.5V5h-1.5V2.5z"/></svg>`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tipHtml(tip) {
  return `
    <p class="kpi-tooltip-def">${escapeHtml(tip.definition)}</p>
    <p class="kpi-tooltip-block"><span class="kpi-tooltip-heading">Calculation</span>${escapeHtml(tip.calculation)}</p>
    <p class="kpi-tooltip-block"><span class="kpi-tooltip-heading">Example</span>${escapeHtml(tip.example)}</p>`;
}

/**
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floatEl
 */
function positionTooltip(trigger, floatEl) {
  const rect = trigger.getBoundingClientRect();
  const tipRect = floatEl.getBoundingClientRect();
  const margin = 8;
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.bottom + margin;

  left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));

  if (top + tipRect.height > window.innerHeight - margin) {
    top = rect.top - tipRect.height - margin;
  }
  if (top < margin) top = margin;

  floatEl.style.left = `${left}px`;
  floatEl.style.top = `${top}px`;
}

/**
 * Wire rich KPI tooltips for elements with [data-kpi-tip].
 * @param {ParentNode} [root]
 */
export function initKpiTooltips(root = document) {
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
    floatEl.removeAttribute("data-active-tip");
  };

  const show = (trigger) => {
    const key = trigger.getAttribute("data-kpi-tip");
    const tip = key ? PRE_MQL_KPI_TIPS[key] : null;
    if (!tip) return;

    activeTrigger = trigger;
    floatEl.innerHTML = tipHtml(tip);
    floatEl.hidden = false;
    floatEl.setAttribute("data-active-tip", key);
    positionTooltip(trigger, floatEl);
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
      if (activeTrigger && !floatEl.hidden) {
        positionTooltip(activeTrigger, floatEl);
      }
    },
    true,
  );

  window.addEventListener("resize", hide);
}

/**
 * @param {string} label
 * @param {string} tipKey
 */
export function kpiLabelRowHtml(label, tipKey) {
  return `
    <span class="kpi-label-row">
      <span class="kpi-label">${escapeHtml(label)}</span>
      <span
        class="kpi-info-btn"
        role="button"
        tabindex="0"
        data-kpi-tip="${escapeHtml(tipKey)}"
        aria-label="About ${escapeHtml(label)}"
      >${INFO_ICON}</span>
    </span>`;
}
