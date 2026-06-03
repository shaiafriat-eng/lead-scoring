import { Link } from "react-router-dom";
import { MQL_QUALIFICATION_ISSUES } from "../data/scoringContent";
import { Section } from "./Section";

export function NonMqlReasonsSection() {
  return (
    <Section
      id="non-mql-reasons"
      label="Qualification issues"
      title="Common MQL Qualification Issues"
      alt
    >
      <div className="grid-2">
        {MQL_QUALIFICATION_ISSUES.map((issue) => (
          <div key={issue.id} className="card">
            <h3 className="qualification-issue__title">
              <span>{issue.title}</span>
              {"wip" in issue && issue.wip ? (
                <span className="qualification-issue__wip">WIP</span>
              ) : null}
            </h3>
            <p style={{ color: "var(--coffee-muted)", margin: 0, fontSize: "0.9375rem", lineHeight: 1.55 }}>
              {issue.body}
            </p>
          </div>
        ))}
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          borderLeft: "4px solid var(--dark-wine)",
          background: "linear-gradient(90deg, var(--white-cream) 0%, var(--cappuccino-foam) 100%)",
        }}
      >
        <h3>Quick check before escalating</h3>
        <p style={{ margin: 0, color: "var(--coffee-muted)" }}>
          Confirm employee count sources, job title classification, WAD vs demographic grade alignment, and
          account relevance before opening a manual review. See the{" "}
          <Link to="/mql-routing#manual-review">MQL diagnostic</Link> below or{" "}
          <Link to="/scoring-flow">scoring flow</Link> for full policy detail.
        </p>
      </div>
    </Section>
  );
}
