import { DISQUALIFIERS_D, JUNK_LEAD_CRITERIA, JUNK_EXCEPTIONS } from "../data/scoringContent";

/** Junk criteria shown inside Person-level disqualifiers → Junk/bounced/private/invalid email */
export function JunkCriteriaNested() {
  return (
    <>
      <p style={{ color: "var(--coffee-muted)", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
        Classified as junk if <strong>one or more</strong> apply:
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)", fontSize: "0.9rem" }}>
        {JUNK_LEAD_CRITERIA.map((item) => (
          <li key={item} style={{ marginBottom: "0.35rem" }}>
            {item}
          </li>
        ))}
      </ul>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
        {JUNK_EXCEPTIONS}
      </p>
    </>
  );
}

/** Country list inside Account-level disqualifiers → Restricted countries */
export function RestrictedCountriesNested() {
  return (
    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.8, color: "var(--coffee-muted)" }}>
      {DISQUALIFIERS_D.countries.join(" · ")}
    </p>
  );
}
