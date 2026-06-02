import { DEMOGRAPHIC_GRADES, DISQUALIFIERS_D } from "../data/scoringContent";
import { Section } from "./Section";
import { Accordion } from "./Accordion";
import { JunkLeadsSection } from "./JunkLeadsSection";

export function DemographicSection() {
  return (
    <Section
      id="demographic"
      label="Dimension 1"
      title="Demographic score (A–D)"
      subtitle="Measures fit within our Ideal Customer Profile and whether the person is a decision maker, influencer, or irrelevant."
      alt
    >
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {DEMOGRAPHIC_GRADES.map((g) => (
          <div key={g.grade} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: g.grade === "D" ? "var(--border)" : "var(--cherry-syrup)",
                  color: g.grade === "D" ? "var(--black-coffee)" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                }}
              >
                {g.grade}
              </span>
              <div>
                <h3 style={{ margin: 0 }}>{g.title}</h3>
              </div>
            </div>
            <p style={{ margin: 0, color: "var(--coffee-muted)", fontSize: "0.9375rem" }}>{g.summary}</p>
            <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
              {g.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <JunkLeadsSection />

      <h3 style={{ marginBottom: "1rem" }}>Grade D — full disqualifier rules</h3>
      <p style={{ color: "var(--coffee-muted)", marginBottom: "1rem" }}>
        Operational detail for RevOps and Marketing Ops. Sensitive lists are included for internal
        accuracy.
      </p>
      <Accordion
        items={[
          {
            id: "d-person",
            title: "Person-level disqualifiers",
            content: (
              <ul>
                {DISQUALIFIERS_D.person.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ),
          },
          {
            id: "d-account",
            title: "Account-level disqualifiers",
            content: (
              <ul>
                {DISQUALIFIERS_D.account.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ),
          },
          {
            id: "d-countries",
            title: "Restricted countries (bad country list)",
            content: (
              <>
                <p>Leads associated with these countries receive grade D:</p>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.8 }}>
                  {DISQUALIFIERS_D.countries.join(" · ")}
                </p>
              </>
            ),
          },
        ]}
      />
    </Section>
  );
}
