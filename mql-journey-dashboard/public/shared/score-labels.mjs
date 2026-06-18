export const FIT_SCORE_LABEL = "Fit score";
export const INTENT_SCORE_LABEL = "Intent score";

export const FIT_SCORE_TOOLTIP =
  "Source lead/account qualification score, such as A1, B1, C1. This reflects lead/account fit or qualification quality, not post-MQL intent.";

export const INTENT_SCORE_TOOLTIP =
  "Calculated outreach priority score based on post-MQL behavior such as return visits, high-intent pages, recency, and current status.";

export function isPresentScoreValue(value) {
  if (value == null || value === undefined) return false;
  const s = String(value).trim();
  if (!s || s === "—" || s === "undefined" || s === "null" || s === "Unknown") {
    return false;
  }
  return true;
}

/** Source qualification score (e.g. A1, B1, C1). */
export function formatFitScore(value) {
  if (!isPresentScoreValue(value)) return null;
  return String(value).trim();
}

/** Calculated outreach priority score (numeric). */
export function formatIntentScore(value) {
  if (value == null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.round(n));
}

export function scorePairParts(fitScore, intentScore) {
  const parts = [];
  const fit = formatFitScore(fitScore);
  const intent = formatIntentScore(intentScore);
  if (fit) {
    parts.push({ label: FIT_SCORE_LABEL, value: fit, tip: FIT_SCORE_TOOLTIP });
  }
  if (intent) {
    parts.push({ label: INTENT_SCORE_LABEL, value: intent, tip: INTENT_SCORE_TOOLTIP });
  }
  return parts;
}

export function scorePairInline(fitScore, intentScore) {
  return scorePairParts(fitScore, intentScore)
    .map((p) => `${p.label}: ${p.value}`)
    .join(" · ");
}

export function scoreCoverageStats(items, { fitKey = "lastCombinedScore", intentKey = "priorityScore" } = {}) {
  let withFit = 0;
  let withIntent = 0;
  let withBoth = 0;
  const total = items.length;
  for (const item of items) {
    const fit = formatFitScore(item[fitKey]);
    const intent = formatIntentScore(item[intentKey]);
    if (fit) withFit += 1;
    if (intent) withIntent += 1;
    if (fit && intent) withBoth += 1;
  }
  return {
    total,
    withFit,
    withIntent,
    withBoth,
    missingFit: total - withFit,
    missingIntent: total - withIntent,
  };
}
