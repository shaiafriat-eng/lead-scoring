/** Letter grade from LAST_COMBINED_SCORE (e.g. C1 → C, D2 → D). */
export function scoreGrade(score) {
  const s = String(score ?? "").trim();
  if (!s) return null;
  const m = s.match(/^([A-D])/i);
  return m ? m[1].toUpperCase() : null;
}
