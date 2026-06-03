import { MATRIX_CELLS } from "../data/scoringContent";
import { MatrixTryHint } from "./MatrixTryHint";

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
  default: { gap: 8, fontSize: "0.9375rem", cellPx: 52, labelSize: "0.875rem", captionSize: "0.75rem" },
  compact: { gap: 6, fontSize: "0.8125rem", cellPx: 44, labelSize: "0.875rem", captionSize: "0.75rem" },
  section: { gap: 8, fontSize: "0.9375rem", cellPx: 56, labelSize: "0.875rem", captionSize: "0.75rem" },
};

function MatrixCell({
  code,
  priority,
  example,
  cellPx,
  rounded,
  flipTooltip,
}: {
  code: string;
  priority: number;
  example: string;
  cellPx: number;
  rounded: number;
  flipTooltip?: boolean;
}) {
  return (
    <div
      className={`matrix-cell${flipTooltip ? " matrix-cell--flip" : ""}`}
      tabIndex={0}
      aria-label={`${code}: ${example}`}
      style={{
        width: cellPx,
        height: cellPx,
        borderRadius: rounded,
        background: heatColor(priority),
        color: priority <= 8 ? "#fff" : "var(--black-coffee)",
      }}
    >
      <span className="matrix-cell__code">{code}</span>
      <span className="matrix-cell__tooltip" role="tooltip">
        <span className="matrix-cell__tooltip-code">{code}</span>
        <span className="matrix-cell__tooltip-text">{example}</span>
      </span>
    </div>
  );
}

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
  const rounded = resolved === "section" ? 10 : 8;

  const showTryHint = resolved === "section";

  return (
    <div
      className={`card score-matrix-preview${resolved === "section" ? " score-matrix-preview--section" : ""}`}
      aria-label="Lead score matrix preview"
    >
      <p style={{ margin: "0 0 0.75rem", fontSize: size.labelSize, fontWeight: 600 }}>
        Demographic × Behavioral
      </p>
      <div className={`matrix-wrap${showTryHint ? " matrix-wrap--with-hint" : ""}`}>
        {showTryHint && <MatrixTryHint />}
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
          <div key={b} className="matrix-axis" style={{ textAlign: "center" }}>
            {b}
          </div>
        ))}
        {demos.map((d) => (
          <div key={d} style={{ display: "contents" }}>
            <div className="matrix-axis matrix-axis--row">{d}</div>
            {behs.map((b) => {
              const cell = MATRIX_CELLS.find((c) => c.demo === d && c.beh === b)!;
              const code = `${d}${b}`;
              return (
                <MatrixCell
                  key={code}
                  code={code}
                  priority={cell.priority}
                  example={cell.example}
                  cellPx={size.cellPx}
                  rounded={rounded}
                  flipTooltip={d === "A"}
                />
              );
            })}
          </div>
        ))}
        </div>
      </div>
      <p
        style={{
          margin: "0.75rem 0 0",
          fontSize: size.captionSize,
          color: "var(--coffee-muted)",
        }}
      >
        Hover a cell for an example lead. Darker = higher sales priority (A1 first → D4 last).
      </p>
    </div>
  );
}
