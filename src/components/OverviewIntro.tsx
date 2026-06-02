import { MQL_POINT_THRESHOLD } from "../data/scoringContent";

export function OverviewIntro() {
  return (
    <section id="overview-intro" className="overview-intro" aria-labelledby="overview-intro-heading">
      <div className="section-inner">
        <h2 id="overview-intro-heading" className="sr-only">
          Overview
        </h2>
        <div className="overview-columns">
          <article className="overview-item">
            <h3 className="overview-item__title">What it is</h3>
            <p className="overview-item__text">
              A method to rank leads by <strong>demographic fit</strong> (A–D) and{" "}
              <strong>behavioral engagement</strong> (1–4), combined into codes like A1 or B3.
            </p>
          </article>
          <article className="overview-item">
            <h3 className="overview-item__title">Why it exists</h3>
            <p className="overview-item__text">
              Prioritize sales outreach, reduce MQL noise, and route leads using conversion data—not
              treating every {MQL_POINT_THRESHOLD}-point MQL equally.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
