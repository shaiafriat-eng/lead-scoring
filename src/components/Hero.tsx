import { HeroGauge } from "./HeroGauge";

export function Hero() {
  return (
    <section id="overview" className="guide-hero" aria-label="Introduction">
      <div className="guide-hero__pattern guide-hero__pattern--tl" aria-hidden />
      <div className="guide-hero__pattern guide-hero__pattern--br" aria-hidden />

      <div className="wrap guide-hero__main">
        <div className="guide-hero__copy">
          <h1 className="guide-hero__title">The Ultimate Guide to Lead Scoring</h1>
          <p className="guide-hero__tagline">Fit, engagement, and priority in one view.</p>
          <p className="guide-hero__description">
            Our two-dimensional model helps Marketing, Sales, and RevOps focus on leads most{"\u00A0"}
            likely to become sales-qualified opportunities.
          </p>
        </div>

        <div className="guide-hero__visual" aria-hidden>
          <div className="guide-hero__gauge">
            <HeroGauge />
          </div>

          <div className="guide-hero__score-card">
            <p className="guide-hero__score-label">Lead Score</p>
            <p className="guide-hero__score-value">85</p>
            <div className="guide-hero__score-meta">
              <span className="guide-hero__avatar" />
              <span className="guide-hero__score-lines">
                <i />
                <i />
              </span>
            </div>
          </div>

          <div className="guide-hero__bars">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <ul className="guide-hero__benefits wrap">
        <li>
          <span className="guide-hero__benefit-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2" />
            </svg>
          </span>
          <span>Prioritize high-value leads</span>
        </li>
        <li>
          <span className="guide-hero__benefit-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="12" width="4" height="8" rx="1" />
              <rect x="10" y="8" width="4" height="12" rx="1" />
              <rect x="16" y="4" width="4" height="16" rx="1" />
            </svg>
          </span>
          <span>Improve sales & marketing alignment</span>
        </li>
        <li>
          <span className="guide-hero__benefit-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c1.5-4 13.5-4 14 0" />
            </svg>
          </span>
          <span>Increase conversion rates</span>
        </li>
        <li>
          <span className="guide-hero__benefit-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M9 11h6" />
            </svg>
          </span>
          <span>Drive more revenue</span>
        </li>
      </ul>
    </section>
  );
}
