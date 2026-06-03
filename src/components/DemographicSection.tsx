import { DEMOGRAPHIC_GRADES, DISQUALIFIERS_D } from "../data/scoringContent";
import { Section } from "./Section";
import { Accordion } from "./Accordion";
import { JunkCriteriaNested, RestrictedCountriesNested } from "./JunkLeadsSection";

type Props = { embedded?: boolean };

function DemographicContent() {
  return (
    <>
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

      <h3 style={{ marginBottom: "1rem" }}>Grade D — full rules</h3>
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
              <ul className="dq-person-list">
                <li>
                  <details className="details-in-list">
                    <summary>Junk/bounced/private/invalid email</summary>
                    <div className="details-in-list__body">
                      <JunkCriteriaNested />
                    </div>
                  </details>
                </li>
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
              <ul className="dq-person-list">
                <li>Account status is Not Relevant</li>
                <li>
                  <details className="details-in-list">
                    <summary>Bad country</summary>
                    <div className="details-in-list__body">
                      <RestrictedCountriesNested />
                    </div>
                  </details>
                </li>
                {DISQUALIFIERS_D.account.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </>
  );
}

export function DemographicSection({ embedded }: Props = {}) {
  if (embedded) {
    return (
      <div id="demographic" className="dimension-block" aria-labelledby="demographic-heading">
        <span className="section-label">Dimension 1 · Fit</span>
        <h2 id="demographic-heading">Demographic score (A–D)</h2>
        <p
          style={{
            maxWidth: "42rem",
            color: "var(--coffee-muted)",
            marginBottom: "2rem",
            fontSize: "1.0625rem",
          }}
        >
          Measures fit within our Ideal Customer Profile and whether the person is a decision maker,
          influencer, or irrelevant.
        </p>
        <DemographicContent />
      </div>
    );
  }

  return (
    <Section
      id="demographic"
      label="Dimension 1 · Fit"
      title="Demographic score (A–D)"
      subtitle="Measures fit within our Ideal Customer Profile and whether the person is a decision maker, influencer, or irrelevant."
    >
      <DemographicContent />
    </Section>
  );
}
