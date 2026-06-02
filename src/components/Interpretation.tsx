import { Section } from "./Section";

export function Interpretation() {
  return (
    <Section
      id="interpretation"
      label="For teams"
      title="How to interpret the score"
      subtitle="Read the two-letter code together with lead source—not either one alone."
    >
      <div className="grid-2">
        <div className="card" style={{ borderTop: "4px solid var(--cherry-syrup)" }}>
          <h3>Do</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            <li>Use the combo code (e.g. B2) plus lead type (Hand Raiser, WAD, Activity-Based).</li>
            <li>Prioritize A1 and B1 for activity-based follow-up queues.</li>
            <li>Expect higher conversion on hand raisers (~18% MQL-to-SQA) vs activity-only paths.</li>
            <li>Re-check scores after major engagement (demo, pricing, BOFU bursts).</li>
            <li>Align pipeline forecasts to post-2025 reduced MQL volumes and higher CVR.</li>
          </ul>
        </div>
        <div className="card" style={{ borderTop: "4px solid var(--orange-juice)" }}>
          <h3>Don&apos;t</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            <li>Assume every MQL has the same priority or expected close rate.</li>
            <li>Ignore demographic D on WAD—D3 is explicitly excluded from auto-MQL.</li>
            <li>Use email clicks alone as an MQL signal.</li>
            <li>Compare pre-2025 MQL volume targets to post-strategy counts without adjustment.</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Metrics glossary</h3>
        <table>
          <tbody>
            {[
              ["MQL-to-SQA CVR", "Primary quality metric: % of MQLs that become Sales Qualified Accounts."],
              ["Inbound pipeline", "Revenue potential from inbound-sourced opportunities; weighed when cutting volume."],
              ["cMQL", "Cost or qualified-MQL variant used in FP&A views—confirm definition with RevOps."],
              ["Soft leads", "Engaged leads not auto-MQLd; under investigation for hand-raiser conversion paths."],
            ].map(([term, def]) => (
              <tr key={term}>
                <td style={{ fontWeight: 600, width: "30%" }}>{term}</td>
                <td style={{ color: "var(--coffee-muted)" }}>{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
