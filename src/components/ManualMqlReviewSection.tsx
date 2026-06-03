import { MANUAL_MQL_REVIEW_FORM_URL } from "../data/scoringContent";
import { Section } from "./Section";
import { MqlDiagnosticGuide } from "./MqlDiagnosticGuide";

export function ManualMqlReviewSection() {
  return (
    <Section
      id="manual-review"
      title="Why wasn't this lead MQL'd?"
      subtitle="Walk through employee size, ICP, job function, and seniority—the same inputs Marketo uses for demographic grade—then engagement and MQL channel rules."
      subtitleWide
    >
      <MqlDiagnosticGuide />
      <div className="page-nav-links" style={{ marginTop: "1.5rem" }}>
        <a
          className="btn btn-primary"
          href={MANUAL_MQL_REVIEW_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Request manual MQL review (Marketing Ops) →
        </a>
      </div>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", color: "var(--coffee-muted)", maxWidth: "52rem" }}>
        Use this form when the guide shows the lead should have MQL&apos;d but did not—Marketing Ops can
        review and force MQL if appropriate.
      </p>
    </Section>
  );
}
