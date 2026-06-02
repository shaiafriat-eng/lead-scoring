import { ACTIVITY_WEIGHTS, BEHAVIORAL_TIERS, MQL_POINT_THRESHOLD } from "../data/scoringContent";
import { Section } from "./Section";

export function BehavioralSection() {
  return (
    <Section
      id="behavioral"
      label="Dimension 2"
      title="Behavioral score (1–4)"
      subtitle={`Engagement depth from the Marketo point ledger. MQL threshold: ${MQL_POINT_THRESHOLD} points. Higher points → higher tier → stronger intent.`}
    >
      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <h3>Engagement tiers (stakeholder view)</h3>
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Typical activities</th>
              </tr>
            </thead>
            <tbody>
              {BEHAVIORAL_TIERS.map((t) => (
                <tr key={t.tier}>
                  <td>
                    <strong>{t.tier}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--coffee-muted)" }}>{t.label}</div>
                  </td>
                  <td style={{ color: "var(--coffee-muted)" }}>{t.activities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Point buckets (Marketo field)</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
            Field: <code>Behavioral Score Calculation</code>
          </p>
          <table>
            <thead>
              <tr>
                <th>Behavioral</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {BEHAVIORAL_TIERS.map((t) => (
                <tr key={t.tier}>
                  <td>
                    <strong>{t.tier}</strong>
                  </td>
                  <td>{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 style={{ marginBottom: "1rem" }}>Activity weights</h3>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Points</th>
              <th>Notes</th>
              <th>Activities</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY_WEIGHTS.map((row) => (
              <tr key={row.points + row.tag}>
                <td>
                  <strong style={{ color: "var(--cherry-syrup)" }}>+{row.points}</strong>
                </td>
                <td style={{ fontSize: "0.8125rem", color: "var(--coffee-muted)" }}>{row.tag || "—"}</td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    {row.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          borderLeft: "4px solid var(--orange-juice)",
          background: "linear-gradient(90deg, var(--white-cream) 0%, var(--cappuccino-foam) 100%)",
        }}
      >
        <h3>6Sense high-value booth bonus (+35)</h3>
        <p style={{ margin: 0, color: "var(--coffee-muted)" }}>
          After the 2023 booth pilot, we no longer MQL all ICP booth attendees. Only attendees with
          demographic <strong>A</strong> whose account is in <strong>Decision/Purchase</strong> stage
          (6Sense) receive +35 points—helping top ~5% reach the {MQL_POINT_THRESHOLD}-point MQL threshold alongside attendance points (+15).
        </p>
      </div>
    </Section>
  );
}
