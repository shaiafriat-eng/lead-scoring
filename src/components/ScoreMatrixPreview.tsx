import { MATRIX_CELLS } from "../data/scoringContent";

function heatColor(priority: number): string {
  if (priority <= 2) return "var(--cherry-syrup)";
  if (priority <= 5) return "var(--pink-mid)";
  if (priority <= 8) return "var(--orange-juice)";
  if (priority <= 10) return "#FEBB59";
  if (priority <= 12) return "var(--border)";
  return "#d4cec4";
}

type MatrixVariant = "default" | "compact" | "section";

const MATRIX_SIZES: Record<
  MatrixVariant,
  { gap: number; fontSize: string; cellPx: number; labelSize: string; captionSize: string }
> = {
  default: { gap: 6, fontSize: "0.8125rem", cellPx: 44, labelSize: "0.875rem", captionSize: "0.75rem" },
  compact: { gap: 4, fontSize: "0.75rem", cellPx: 36, labelSize: "0.875rem", captionSize: "0.75rem" },
  section: { gap: 3, fontSize: "0.625rem", cellPx: 28, labelSize: "0.8125rem", captionSize: "0.6875rem" },
};

export function ScoreMatrixPreview({
  compact,
  variant,
}: {
  compact?: boolean;
  variant?: MatrixVariant;
}) {
  const resolved: MatrixVariant = variant ?? (compact ? "compact" : "default");
  const size = MATRIX_SIZES[resolved];
  const demos = ["A", "B", "C", "D"] as const;
  const behs = [1, 2, 3, 4] as const;
  const cellCol = `${size.cellPx}px`;

  return (
    <div
      className={`card score-matrix-preview${resolved === "section" ? " score-matrix-preview--section" : ""}`}
      aria-label="Lead score matrix preview"
    >
      <p style={{ margin: "0 0 0.5rem", fontSize: size.labelSize, fontWeight: 600 }}>
        Demographic × Behavioral
      </p>
      <div
        className="score-matrix-preview__grid"
        style={{
          gridTemplateColumns: `auto repeat(4, ${cellCol})`,
          gap: size.gap,
          fontSize: size.fontSize,
        }}
      >
        <div />
        {behs.map((b) => (
          <div key={b} style={{ textAlign: "center", fontWeight: 700, color: "var(--coffee-muted)" }}>
            {b}
          </div>
        ))}
        {demos.map((d) => (
          <div key={d} style={{ display: "contents" }}>
            <div
              style={{ display: "flex", alignItems: "center", fontWeight: 700, paddingRight: 6 }}
            >
              {d}
            </div>
            {behs.map((b) => {
              const cell = MATRIX_CELLS.find((c) => c.demo === d && c.beh === b)!;
              return (
                <div
                  key={`${d}-${b}`}
                  title={`${d}${b}: ${cell.label}`}
                  style={{
                    width: size.cellPx,
                    height: size.cellPx,
                    borderRadius: resolved === "section" ? 6 : 8,
                    background: heatColor(cell.priority),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: cell.priority <= 8 ? "#fff" : "var(--black-coffee)",
                  }}
                >
                  {d}
                  {b}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "0.5rem 0 0",
          fontSize: size.captionSize,
          color: "var(--coffee-muted)",
        }}
      >
        Darker = higher sales priority (A1 first → D4 last)
      </p>
    </div>
  );
}
