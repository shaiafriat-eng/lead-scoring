import { MQL_POINT_THRESHOLD, NON_MQL_REASONS } from "../data/scoringContent";
import { Section } from "./Section";

export function NonMqlReasonsSection() {
  return (
    <Section
      id="non-mql-reasons"
      label="Exceptions"
      title="Common reasons a lead won't be MQL'd"
      subtitle={`Reaching ${MQL_POINT_THRESHOLD}+ points or high engagement is not enough—fit, channel, and March 2025 combo rules all apply.`}
      alt
    >
      <div className="grid-2">
        {NON_MQL_REASONS.map((group) => (
          <div
            key={group.id}
            className="card"
            style={group.id === "booth" ? { gridColumn: "1 / -1" } : undefined}
          >
            <h3>{group.title}</h3>
            <p style={{ color: "var(--coffee-muted)", margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>
              {group.summary}
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "var(--coffee-muted)",
                fontSize: "0.9rem",
              }}
            >
              {group.reasons.map((reason) => (
                <li key={reason} style={{ marginBottom: "0.4rem" }}>
                  {reason}
                </li>
              ))}
            </ul>
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
          Confirm demographic grade (not D unless reviewed), lead source (hand raiser vs WAD vs
          activity-based), score code vs auto-MQL list for that channel, and whether junk/DQ flags
          are present. When in doubt, see{" "}
          <a href="#mql-policy">MQL policy</a>, the{" "}
          <a href="#scoring-flow">scoring flow</a>, or{" "}
          <a href="#manual-mql-review">manual MQL review</a> if it still looks wrong.
        </p>
      </div>
    </Section>
  );
}
