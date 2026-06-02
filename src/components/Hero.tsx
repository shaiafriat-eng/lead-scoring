import { MIRO_BOARD_URL } from "../data/scoringContent";
import { ScoreMatrixPreview } from "./ScoreMatrixPreview";

export function Hero() {
  return (
    <section id="overview" className="hero">
      <div className="brand-blob brand-blob--cherry" style={{ top: -60, right: -40 }} />
      <div className="brand-blob brand-blob--orange" style={{ bottom: 20, left: -60 }} />
      <div className="section-inner">
        <div className="hero-grid hero-grid--top">
          <div>
            <p className="section-label">Internal stakeholder guide</p>
            <h1>
              Understand <span className="hibob-word">HiBob</span> lead scoring
            </h1>
            <p className="hero-tagline">Fit, engagement, and priority in one view.</p>
          </div>
          <ScoreMatrixPreview compact />
          <p className="hero-description">
            Our two-dimensional model helps Marketing, Sales, and RevOps focus on leads most{"\u00A0"}
            likely to become sales-qualified opportunities.
          </p>
          <div className="hero-ctas">
              <a className="btn btn-primary" href="#scoring-flow">
                Explore scoring flow
              </a>
            <a className="btn btn-secondary" href="#mql-policy">
              MQL policy (2025)
            </a>
            <a
              className="btn btn-secondary"
              href={MIRO_BOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Miro board
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
