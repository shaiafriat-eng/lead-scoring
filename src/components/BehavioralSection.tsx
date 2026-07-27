import { useMemo, useState } from "react";
import {
  ACTIVITY_WEIGHTS,
  BEHAVIORAL_TIERS,
  flattenActivityWeights,
  MQL_POINT_THRESHOLD,
} from "../data/scoringContent";
import { Section } from "./Section";

type Props = { embedded?: boolean };

function ActivityPointsExplorer() {
  const all = useMemo(() => flattenActivityWeights(), []);
  const pointOptions = useMemo(() => ACTIVITY_WEIGHTS.map((row) => row.points), []);
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState<"all" | number>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    return all.filter((item) => {
      if (points !== "all" && item.points !== points) return false;
      if (!tokens.length) return true;
      const hay = `${item.name} ${item.aliases} +${item.points} ${item.tag}`.toLowerCase();
      return tokens.every((token) => hay.includes(token));
    });
  }, [all, points, query]);

  return (
    <div className="activity-points card" style={{ marginTop: "1.25rem" }}>
      <h3>Which activities earn points?</h3>
      <p className="activity-points__lead">
        Search any marketing activity to see how many points it adds in Marketo’s Behavioral Score
        Calculation field.
      </p>
      <label className="activity-points__search-label" htmlFor="activity-points-search-react">
        Search activities
      </label>
      <div className="activity-points__search-wrap">
        <svg
          className="activity-points__search-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="activity-points-search-react"
          className="activity-points__search"
          type="search"
          placeholder="Try demo, webinar, email, BOFU, booth…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="activity-points__chips" role="group" aria-label="Filter by points">
        <button
          type="button"
          className={`activity-points__chip${points === "all" ? " is-active" : ""}`}
          onClick={() => setPoints("all")}
        >
          All
        </button>
        {pointOptions.map((pts) => (
          <button
            key={pts}
            type="button"
            className={`activity-points__chip${points === pts ? " is-active" : ""}`}
            onClick={() => setPoints(pts)}
          >
            +{pts}
          </button>
        ))}
      </div>
      <p className="activity-points__count" aria-live="polite">
        {filtered.length} activit{filtered.length === 1 ? "y" : "ies"}
      </p>
      {filtered.length === 0 ? (
        <p className="activity-points__empty">
          No activities match <strong>{query}</strong>. Try “demo”, “webinar”, “email”, or “BOFU”.
        </p>
      ) : (
        <ul className="activity-points__list" role="list">
          {filtered.map((item) => (
            <li key={`${item.points}-${item.name}`} className="activity-points__row">
              <span className="activity-points__pts" aria-label={`${item.points} points`}>
                +{item.points}
              </span>
              <div className="activity-points__copy">
                <p className="activity-points__name">{item.name}</p>
                {item.tag ? <p className="activity-points__tag">{item.tag}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BehavioralContent() {
  return (
    <>
      <div className="card" style={{ overflowX: "auto", marginBottom: "1rem" }}>
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Points (Marketo)</th>
              <th>Typical activities</th>
            </tr>
          </thead>
          <tbody>
            {BEHAVIORAL_TIERS.map((t) => (
              <tr key={t.tier}>
                <td>
                  <strong>{t.tier}</strong>
                </td>
                <td>{t.points}</td>
                <td style={{ color: "var(--coffee-muted)" }}>{t.activities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ActivityPointsExplorer />

      <div
        className="card"
        style={{
          marginTop: "1.5rem",
          borderLeft: "4px solid var(--orange-juice)",
          background: "linear-gradient(90deg, var(--white-cream) 0%, var(--cappuccino-foam) 100%)",
        }}
      >
        <h3>6Sense high-value booth bonus (+35)</h3>
        <p style={{ margin: 0, color: "var(--coffee-muted)" }}>
          After the 2023 booth pilot, we no longer MQL all ICP booth attendees. Only attendees with
          demographic <strong>A</strong> whose account is in <strong>Decision/Purchase</strong> stage
          (6Sense) receive +35 points—helping top ~5% reach the {MQL_POINT_THRESHOLD}-point MQL
          threshold alongside attendance points (+15).
        </p>
      </div>
    </>
  );
}

export function BehavioralSection({ embedded }: Props = {}) {
  if (embedded) {
    return (
      <div id="behavioral" className="dimension-block dimension-block--follow" aria-labelledby="behavioral-heading">
        <span className="section-label">Dimension 2 · Behavior</span>
        <h2 id="behavioral-heading">Behavioral score (1–4)</h2>
        <p
          style={{
            maxWidth: "42rem",
            color: "var(--coffee-muted)",
            marginBottom: "2rem",
            fontSize: "1.0625rem",
          }}
        >
          Engagement depth from the Marketo point ledger. MQL threshold: {MQL_POINT_THRESHOLD} points.
          Higher points → higher tier → stronger intent.
        </p>
        <BehavioralContent />
      </div>
    );
  }

  return (
    <Section
      id="behavioral"
      label="Dimension 2 · Behavior"
      title="Behavioral score (1–4)"
      subtitle={`Engagement depth from the Marketo point ledger. MQL threshold: ${MQL_POINT_THRESHOLD} points. Higher points → higher tier → stronger intent.`}
    >
      <BehavioralContent />
    </Section>
  );
}
