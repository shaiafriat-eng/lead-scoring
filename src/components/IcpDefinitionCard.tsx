import {
  ICP_DEFINITION,
  ICP_DEFINITION_SUMMARY,
  ICP_DOC_URL,
} from "../data/scoringContent";

export function IcpDefinitionCard() {
  return (
    <div className="card icp-definition">
      <h3>ICP definition</h3>
      <p className="icp-definition__summary">{ICP_DEFINITION_SUMMARY}</p>
      <p style={{ color: "var(--coffee-muted)", margin: "0 0 0.65rem", fontSize: "0.875rem" }}>
        Account must meet <strong>all</strong> criteria below (unless overridden):
      </p>
      <ul className="icp-definition__list">
        {ICP_DEFINITION.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
        Full rules and edge cases: maintained by <strong>MIS</strong>.
      </p>
      <a
        className="btn btn-secondary"
        href={ICP_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: "0.75rem" }}
      >
        Open full ICP doc (Google) →
      </a>
    </div>
  );
}
