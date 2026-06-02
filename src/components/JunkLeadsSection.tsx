import { JUNK_LEAD_CRITERIA, JUNK_EXCEPTIONS } from "../data/scoringContent";
import { Accordion } from "./Accordion";

export function JunkLeadsSection() {
  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <h3>Junk & test lead criteria</h3>
      <p style={{ color: "var(--coffee-muted)", marginBottom: "1rem" }}>
        Leads are classified as junk if they meet <strong>one or more</strong> of the following
        (operational junk-lead process):
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
        {JUNK_LEAD_CRITERIA.map((item) => (
          <li key={item} style={{ marginBottom: "0.35rem" }}>
            {item}
          </li>
        ))}
      </ul>
      <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
        {JUNK_EXCEPTIONS}
      </p>
      <Accordion
        items={[
          {
            id: "junk-ops",
            title: "Relationship to grade D",
            content: (
              <p style={{ margin: 0 }}>
                Junk/test matches typically receive demographic grade <strong>D</strong> and are
                excluded from auto-MQL paths unless manually reviewed and excepted.
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
