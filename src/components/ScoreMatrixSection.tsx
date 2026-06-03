import { MATRIX_CELLS } from "../data/scoringContent";
import { Section } from "./Section";
import { ScoreMatrixPreview } from "./ScoreMatrixPreview";

const PRIORITY_LADDER = [
  "A1 — Top priority (ICP decision maker + highest engagement)",
  "B1, C1 — Next in queue",
  "A2, B2, C2 — Strong follow-up",
  "Remaining combos by fit and engagement",
  "D4 — Lowest (irrelevant fit + minimal engagement)",
];

export function ScoreMatrixSection({ embedded = false }: { embedded?: boolean }) {
  if (embedded) {
    return (
      <Section
        id="matrix"
        title="Score matrix"
        subtitle={
          <>
            Darker = higher priority. A1 top → D4 lowest. <br />
            Hover a cell for an example lead.
          </>
        }
        alt
      >
        <div className="matrix-wrap">
          <ScoreMatrixPreview variant="section" />
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="matrix"
      title="Score matrix & sales priority"
      subtitle="Combine demographic letter + behavioral number. Hotter cells go to the front of the queue."
      alt
    >
      <div className="matrix-section-layout">
        <ScoreMatrixPreview variant="section" />
        <div className="card">
          <h3>Sales priority ladder</h3>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            {PRIORITY_LADDER.map((item) => (
              <li key={item} style={{ marginBottom: "0.5rem" }}>
                {item}
              </li>
            ))}
          </ol>
          <p style={{ margin: "1rem 0 0", fontSize: "0.875rem" }}>
            Leads move between cells as they engage or as account/person data updates.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem", overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Priority rank</th>
              <th>Guidance</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_CELLS.sort((a, b) => a.priority - b.priority).map((c) => (
              <tr key={`${c.demo}${c.beh}`}>
                <td>
                  <strong>
                    {c.demo}
                    {c.beh}
                  </strong>
                </td>
                <td>{c.priority}</td>
                <td style={{ color: "var(--coffee-muted)" }}>{c.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
