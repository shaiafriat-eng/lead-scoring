import { Section } from "./Section";

const ROWS = [
  { aspect: "Dimensions", old: "Single point total (mostly behavioral)", neu: "Demographic (A–D) + Behavioral (1–4)" },
  { aspect: "MQL definition", old: "50+ points = MQL for all", neu: "Combo-based rules by lead type & channel" },
  { aspect: "Demographics", old: "+5 HR/C-level, +5 for 500+ employees", neu: "Full ICP + persona logic (Marketo / SFDC)" },
  { aspect: "Prioritization", old: "All MQLs treated equally", neu: "A1 first → D4 last; sales queue order" },
  { aspect: "6Sense", old: "Limited integration", neu: "Intent, profile fit, person grade, buying stage; booth bonus" },
  { aspect: "Reporting", old: "MQL duplication across Leads & Contacts", neu: "ABX focus; auto account conversion (where enabled)" },
];

export function WhyChanged() {
  return (
    <Section
      id="why"
      label="Context"
      title="Why we changed the model"
      subtitle="The legacy model helped us scale inbound volume but could not distinguish hot from cold MQLs or fully use ICP and intent data."
      alt
    >
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Previous model</th>
              <th>New model</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.aspect}>
                <td style={{ fontWeight: 600 }}>{r.aspect}</td>
                <td style={{ color: "var(--coffee-muted)" }}>{r.old}</td>
                <td>{r.neu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
