import { gaugeSvgMarkup } from "./gauge-svg.mjs";

/** Shared home hero markup (static site). */
export function heroSection() {
  return `    <section class="guide-hero" aria-label="Introduction">
      <div class="guide-hero__pattern guide-hero__pattern--tl" aria-hidden="true"></div>
      <div class="guide-hero__pattern guide-hero__pattern--br" aria-hidden="true"></div>
      <div class="wrap guide-hero__main">
        <div class="guide-hero__copy">
          <h1 class="guide-hero__title">The Ultimate Guide to Lead Scoring</h1>
          <p class="guide-hero__tagline">Fit, engagement, and priority in one view.</p>
          <p class="guide-hero__description">Our two-dimensional model helps Marketing, Sales, and RevOps focus on leads most&nbsp;likely to become sales-qualified opportunities.</p>
        </div>
        <div class="guide-hero__visual" aria-hidden="true">
          <div class="guide-hero__gauge">
            ${gaugeSvgMarkup({ gradientId: "gaugeGrad" })}
          </div>
          <div class="guide-hero__score-card">
            <p class="guide-hero__score-label">Lead Score</p>
            <p class="guide-hero__score-value">85</p>
            <div class="guide-hero__score-meta">
              <span class="guide-hero__avatar"></span>
              <span class="guide-hero__score-lines"><i></i><i></i></span>
            </div>
          </div>
          <div class="guide-hero__bars">
            <span style="--h:42%"></span>
            <span style="--h:58%"></span>
            <span style="--h:72%"></span>
            <span style="--h:88%"></span>
          </div>
        </div>
      </div>
      <ul class="guide-hero__benefits wrap">
        <li>
          <span class="guide-hero__benefit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2"/></svg>
          </span>
          <span>Prioritize high-value leads</span>
        </li>
        <li>
          <span class="guide-hero__benefit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="16" y="4" width="4" height="16" rx="1"/></svg>
          </span>
          <span>Improve sales&nbsp;&amp;&nbsp;marketing alignment</span>
        </li>
        <li>
          <span class="guide-hero__benefit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 20c1.5-4 13.5-4 14 0"/></svg>
          </span>
          <span>Increase conversion rates</span>
        </li>
        <li>
          <span class="guide-hero__benefit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M9 11h6"/></svg>
          </span>
          <span>Drive more revenue</span>
        </li>
      </ul>
    </section>`;
}
