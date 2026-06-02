import {
  MANUAL_MQL_REVIEW_GATHER,
  MANUAL_MQL_REVIEW_OUTCOMES,
  MANUAL_MQL_REVIEW_STEPS,
  MANUAL_MQL_REVIEW_WHEN,
  MQL_POINT_THRESHOLD,
} from "../data/scoringContent";
import { Section } from "./Section";

export function ManualMqlReviewSection() {
  return (
    <Section
      id="manual-mql-review"
      label="Escalation"
      title="Manual MQL review"
      subtitle={`When a lead looks qualified but did not MQL, use this path before assuming automation failed. Threshold: ${MQL_POINT_THRESHOLD} points + channel rules.`}
    >
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <h3>When to request a review</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            {MANUAL_MQL_REVIEW_WHEN.map((item) => (
              <li key={item} style={{ marginBottom: "0.5rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Before you escalate</h3>
          <p style={{ color: "var(--coffee-muted)", margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>
            Most “missed” MQLs are policy-intentional. Confirm first:
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)", fontSize: "0.9rem" }}>
            <li>
              <a href="#non-mql-reasons">Why not MQL</a> — common blockers
            </li>
            <li>
              <a href="#mql-policy">MQL policy (2025)</a> — channel allowlists
            </li>
            <li>
              <a href="#scoring-flow">Scoring flow</a> — step-through process
            </li>
            <li>
              <a href="#mqling-flow">MQLing flow</a> — ICP & routing context
            </li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Review process</h3>
        <ol className="mql-review-steps">
          {MANUAL_MQL_REVIEW_STEPS.map((s) => (
            <li key={s.step} className="mql-review-steps__item">
              <span className="mql-review-steps__num">{s.step}</span>
              <div>
                <strong>{s.title}</strong>
                <p style={{ margin: "0.35rem 0 0", color: "var(--coffee-muted)", fontSize: "0.9rem" }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem", overflowX: "auto" }}>
        <h3>What to include in your request</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Notes for reviewer</th>
            </tr>
          </thead>
          <tbody>
            {MANUAL_MQL_REVIEW_GATHER.map((row) => (
              <tr key={row.field}>
                <td>
                  <strong>{row.field}</strong>
                </td>
                <td style={{ color: "var(--coffee-muted)" }}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        {MANUAL_MQL_REVIEW_OUTCOMES.map((o) => (
          <div key={o.outcome} className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>{o.outcome}</h3>
            <p style={{ margin: 0, color: "var(--coffee-muted)", fontSize: "0.9rem" }}>{o.detail}</p>
          </div>
        ))}
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          borderLeft: "4px solid var(--cherry-syrup)",
          background: "linear-gradient(90deg, var(--white-cream) 0%, var(--cappuccino-foam) 100%)",
        }}
      >
        <h3>Do not bypass policy without review</h3>
        <p style={{ margin: 0, color: "var(--coffee-muted)" }}>
          Sales should not manually change MQL status in Salesforce without Ops alignment—auditing,
          attribution, and conversion reporting depend on consistent Marketo-driven MQL logic. Use the
          formal review path so exceptions are traceable.
        </p>
      </div>
    </Section>
  );
}
