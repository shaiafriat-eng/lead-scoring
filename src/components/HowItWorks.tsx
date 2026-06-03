import { Link } from "react-router-dom";
import { Section } from "./Section";

export function HowItWorks() {
  return (
    <Section id="how-it-works" title="How the score works">
      <div className="intro-grid">
        <p className="lead">
          Two dimensions—fit and engagement—combine into a score code used for prioritization and MQL
          routing.
        </p>
        <div className="grid-2">
        <div className="card">
          <h3>1. Demographic score (A–D)</h3>
          <p style={{ color: "var(--coffee-muted)", marginBottom: "1rem" }}>
            Based on <strong>person</strong> (job function, seniority) and <strong>account</strong> (ICP,
            status, geography, employee count).
          </p>
          <div
            style={{
              padding: "1rem",
              background: "var(--cappuccino-foam)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
            }}
          >
            Person + Account → Marketo/SFDC rules → <strong>Grade A, B, C, or D</strong>
          </div>
        </div>
        <div className="card">
          <h3>2. Behavioral score (1–4)</h3>
          <p style={{ color: "var(--coffee-muted)", marginBottom: "1rem" }}>
            Activities earn points in Marketo. Total points map to engagement tiers 1 (highest) through
            4 (lowest).
          </p>
          <div
            style={{
              padding: "1rem",
              background: "var(--cappuccino-foam)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
            }}
          >
            Activities → Points (MQL at 100+) → <strong>Tier 1–4</strong> → Code (e.g. B2)
          </div>
        </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3 style={{ marginBottom: "0.5rem" }}>Systems involved</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
            <li>
              <strong>Marketo</strong> — behavioral point calculation, demographic grading, MQL flows
            </li>
            <li>
              <strong>Salesforce</strong> — ICP checkbox, account status, routing
            </li>
            <li>
              <strong>6Sense</strong> — intent, profile fit, person grade, buying stage; booth attendee
              bonus
            </li>
          </ul>
          <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
            Scores refresh as engagement accrues (typically within hours of activity).
          </p>
        </div>
        <Link className="btn btn-primary" to="/scoring-flow">
          Try interactive flow →
        </Link>
      </div>

      <svg
        viewBox="0 0 800 120"
        style={{ width: "100%", marginTop: "2rem", maxHeight: 100 }}
        aria-hidden="true"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#83143D" />
          </marker>
        </defs>
        {[
          { x: 20, label: "Lead activity" },
          { x: 200, label: "Point ledger" },
          { x: 380, label: "Behavioral 1–4" },
          { x: 560, label: "Score code" },
          { x: 700, label: "MQL / Sales" },
        ].map((step, i, arr) => (
          <g key={step.label}>
            <rect
              x={step.x}
              y={40}
              width={140}
              height={44}
              rx={12}
              fill={i === arr.length - 1 ? "#EE164F" : "#FDF6EB"}
              stroke="#E8E0D4"
            />
            <text
              x={step.x + 70}
              y={67}
              textAnchor="middle"
              fontSize="12"
              fontFamily="DM Sans, sans-serif"
              fill={i === arr.length - 1 ? "#fff" : "#3A3A37"}
              fontWeight="600"
            >
              {step.label}
            </text>
            {i < arr.length - 1 && (
              <line
                x1={step.x + 145}
                y1={62}
                x2={arr[i + 1].x - 8}
                y2={62}
                stroke="#83143D"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        ))}
      </svg>
    </Section>
  );
}
