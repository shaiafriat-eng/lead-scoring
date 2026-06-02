import { EXAMPLES } from "../data/scoringContent";
import { Section } from "./Section";

export function Examples() {
  return (
    <Section
      id="examples"
      label="Walkthroughs"
      title="Visual examples"
      subtitle="See how person fit, points, and channel rules combine into a score code and MQL outcome."
      alt
    >
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {EXAMPLES.map((ex) => (
          <article key={ex.title} className="card">
            <h3 style={{ fontSize: "1rem" }}>{ex.title}</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "1rem 0",
              }}
            >
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--cherry-syrup)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {ex.code}
              </span>
              <span style={{ color: "var(--coffee-muted)", fontSize: "0.875rem" }}>
                {ex.demographic} + {ex.behavioral} · ~{ex.points} pts
              </span>
            </div>
            <dl style={{ margin: 0, fontSize: "0.875rem" }}>
              <dt style={{ fontWeight: 600, marginTop: "0.5rem" }}>Auto-MQL?</dt>
              <dd style={{ margin: "0.25rem 0 0", color: "var(--coffee-muted)" }}>{ex.mql}</dd>
              <dt style={{ fontWeight: 600, marginTop: "0.75rem" }}>Recommended action</dt>
              <dd style={{ margin: "0.25rem 0 0", color: "var(--coffee-muted)" }}>{ex.action}</dd>
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}
