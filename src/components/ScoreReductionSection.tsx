import { SCORE_REDUCTION_RULES } from "../data/scoringContent";
import { Section } from "./Section";

export function ScoreReductionSection() {
  return (
    <Section
      id="score-reduction"
      label="Score management"
      title="When the behavioral score is reduced"
      subtitle="Certain account and person statuses reset Behavioral Score Calculation in Marketo so leads do not stay above MQL thresholds after they should stop being worked."
      alt
    >
      <div className="score-reduction">
        {SCORE_REDUCTION_RULES.map((rule) => (
          <article key={rule.id} className="score-reduction__card card">
            <div className="score-reduction__header">
              <h3 className="score-reduction__scenario">{rule.scenario}</h3>
              {rule.points !== null && rule.points !== undefined ? (
                <span className="score-reduction__pts" aria-label={`Reduced to ${rule.points} points`}>
                  → {rule.points}
                </span>
              ) : (
                <span className="score-reduction__pts score-reduction__pts--split">By reason</span>
              )}
            </div>
            <p className="score-reduction__why">{rule.why}</p>
            {rule.reasons ? (
              <ul className="score-reduction__reasons">
                {rule.reasons.map((item) => (
                  <li key={item.reason} className="score-reduction__reason">
                    <div className="score-reduction__reason-top">
                      <strong>{item.reason}</strong>
                      <span className="score-reduction__pts score-reduction__pts--sm">→ {item.points}</span>
                    </div>
                    <p>{item.why}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
      <p className="score-reduction__note">
        After reduction, the lead must earn new engagement points again before they can reach the 100-point
        MQL threshold (and still pass demographic + channel rules).
      </p>
    </Section>
  );
}
