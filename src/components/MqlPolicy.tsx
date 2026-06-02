import { useState } from "react";
import { MQL_POLICIES } from "../data/scoringContent";
import { Section } from "./Section";

export function MqlPolicy() {
  const [active, setActive] = useState(MQL_POLICIES[0].id);
  const policy = MQL_POLICIES.find((p) => p.id === active)!;

  return (
    <Section
      id="mql-policy"
      label="Go-to-market"
      title="MQL policy & business decisions"
      subtitle="March 2025 strategy: tighten auto-MQL rules using MQL-to-SQA conversion data while keeping high-intent channels."
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
        role="tablist"
      >
        {MQL_POLICIES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active === p.id}
            className="btn"
            style={{
              background: active === p.id ? "var(--cherry-syrup)" : "var(--white-cream)",
              color: active === p.id ? "#fff" : "var(--black-coffee)",
              border: active === p.id ? "none" : "2px solid var(--border)",
            }}
            onClick={() => setActive(p.id)}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="card" role="tabpanel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <span
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: 999,
              background: "var(--cappuccino-foam)",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            {policy.autoMql}
          </span>
        </div>
        <p style={{ color: "var(--coffee-muted)" }}>{policy.description}</p>
        <ul style={{ paddingLeft: "1.25rem" }}>
          {policy.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "var(--cappuccino-foam)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9375rem",
          }}
        >
          {policy.note}
        </p>
        {policy.impact && (
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--coffee-muted)" }}>Before</div>
              <div style={{ fontWeight: 700 }}>{policy.impact.before}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--coffee-muted)" }}>After</div>
              <div style={{ fontWeight: 700 }}>{policy.impact.after}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--coffee-muted)" }}>Pipeline note</div>
              <div style={{ fontWeight: 600, color: "var(--cherry-syrup)" }}>{policy.impact.pipeline}</div>
            </div>
          </div>
        )}
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          background: "linear-gradient(135deg, var(--dark-wine) 0%, var(--cherry-syrup) 100%)",
          color: "#fff",
          border: "none",
        }}
      >
        <h3 style={{ color: "#fff" }}>Key metric</h3>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Decisions are driven primarily by <strong>MQL-to-SQA conversion rate (CVR)</strong>, with
          secondary attention to inbound pipeline volume where cuts would remove productive demand.
        </p>
      </div>
    </Section>
  );
}
