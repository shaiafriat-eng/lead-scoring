import {
  ICP_DEFINITION,
  ICP_DEFINITION_SUMMARY,
  ICP_DOC_BUTTON_LABEL,
  ICP_DOC_BUTTON_NOTE,
  ICP_DOC_URL,
  ICP_MQL_EE_DISCLAIMER,
} from "../data/scoringContent";

export function IcpDefinitionCard() {
  return (
    <div className="card icp-definition">
      <p className="icp-definition__summary">{ICP_DEFINITION_SUMMARY}</p>
      <p style={{ color: "var(--coffee-muted)", margin: "0 0 0.65rem", fontSize: "0.875rem" }}>
        Account must meet <strong>all</strong> criteria below (unless overridden):
      </p>
      <ul className="icp-definition__list">
        {ICP_DEFINITION.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p className="icp-disclaimer">{ICP_MQL_EE_DISCLAIMER}</p>
      <a
        className="btn btn-secondary icp-doc-link"
        href={ICP_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: "1rem" }}
      >
        <span className="icp-doc-link__label">{ICP_DOC_BUTTON_LABEL}</span>
        <span className="icp-doc-link__note">
          {" "}
          — {ICP_DOC_BUTTON_NOTE} →
        </span>
      </a>
    </div>
  );
}
