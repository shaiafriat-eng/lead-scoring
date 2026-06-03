import { Section } from "./Section";

const LIMITATIONS = [
  {
    title: "Dual behavioral model",
    body: "Stakeholders see tiers 1–4 by activity type; operations use point buckets in Marketo. Both describe the same dimension.",
  },
  {
    title: "ICP calculation delay",
    body: "Salesforce ICP can take ~24 hours for new contacts. Marketo ICP scoring is used until SFDC catches up.",
  },
  {
    title: "Update latency",
    body: "Scores refresh after engagement, not instantly. Plan routing and SLAs with a short lag in mind.",
  },
  {
    title: "Rule-based demographics",
    body: "Grades follow explicit persona, account, and geo rules—not a black-box ML model.",
  },
  {
    title: "6Sense augments, not replaces",
    body: "Intent and buying stage inform bonuses and targeting; demographic logic still governs fit.",
  },
  {
    title: "Pipeline tradeoffs",
    body: "Activity-based and WAD cuts reduce volume by design. Forecasting must use post-strategy baselines.",
  },
  {
    title: "Living documentation",
    body: "MQL allowlists and weights evolve with conversion studies. Confirm current rules in Marketo flows before major campaigns.",
  },
];

export function Methodology() {
  return (
    <Section
      id="methodology"
      label="Trust & transparency"
      title="Methodology, assumptions & limitations"
      subtitle="Built from conversion analysis, ICP definitions, and operational rules in Marketo and Salesforce."
    >
      <div className="grid-2">
        <div className="card">
          <h3>Assumptions</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            <li>ICP and persona rules reflect our best current GTM fit definition.</li>
            <li>Historical MQL-to-SQA rates by score combo predict future routing quality.</li>
            <li>Hand-raiser intent remains the highest-confidence auto-MQL signal.</li>
            <li>Reducing low-CVR combos (e.g. D3, broad activity MQLs) improves sales efficiency.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Source materials</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            <li>Lead Scoring cheat sheet & multi-dimensional model overview</li>
            <li>New Lead Scoring functional specification (Marketo/SFDC rules)</li>
            <li>New MQL Strategy (March 2025) — conversion-driven policy</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        {LIMITATIONS.map((l) => (
          <div key={l.title} className="card" style={{ marginBottom: "0.75rem", padding: "1.25rem" }}>
            <h3 style={{ marginBottom: "0.35rem", fontSize: "1rem" }}>{l.title}</h3>
            <p style={{ margin: 0, color: "var(--coffee-muted)", fontSize: "0.9375rem" }}>{l.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
