import { SCORE_REDUCTION_RULES } from "../data/scoringContent";
import { Section } from "./Section";

export function ScoreReductionSection() {
  return (
    <Section
      id="score-reduction"
      label="Score reduction"
      title="When the behavioral score is reduced"
      subtitle="These statuses reset Behavioral Score Calculation in Marketo so leads don’t stay above MQL after they should stop being worked."
      alt
    >
      <div className="score-reduction card">
        <table className="score-reduction__table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Score</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_REDUCTION_RULES.flatMap((rule) => {
              if (rule.reasons?.length) {
                return rule.reasons.map((item, i) => (
                  <tr key={`${rule.id}-${item.reason}`}>
                    <td>
                      {i === 0 ? <strong>{rule.scenario}</strong> : null}
                      <span className="score-reduction__sub">{item.reason}</span>
                    </td>
                    <td>
                      <span className="score-reduction__pts">→ {item.points}</span>
                    </td>
                    <td>{item.why}</td>
                  </tr>
                ));
              }
              return [
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.scenario}</strong>
                  </td>
                  <td>
                    <span className="score-reduction__pts">→ {rule.points}</span>
                  </td>
                  <td>{rule.why}</td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
      <p className="score-reduction__note">
        After reduction, the lead must earn new points before reaching the 100-point MQL threshold again.
      </p>
    </Section>
  );
}
