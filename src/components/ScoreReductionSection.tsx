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
              const baseRow = (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.scenario}</strong>
                    {rule.reasons?.length ? (
                      <span className="score-reduction__sub">Default</span>
                    ) : null}
                  </td>
                  <td>
                    <span className="score-reduction__pts">→ {rule.points ?? 0}</span>
                  </td>
                  <td>{rule.why}</td>
                </tr>
              );

              if (!rule.reasons?.length) return [baseRow];

              return [
                baseRow,
                <tr key={`${rule.id}-reasons-label`} className="score-reduction__group">
                  <td colSpan={3}>
                    <span className="score-reduction__group-label">
                      Nurture reasons — score set to 10 or 20
                    </span>
                  </td>
                </tr>,
                ...rule.reasons.map((item) => (
                  <tr key={`${rule.id}-${item.reason}`} className="score-reduction__exception">
                    <td>
                      <span className="score-reduction__sub">
                        Nurture reason · {item.reason}
                      </span>
                    </td>
                    <td>
                      <span className="score-reduction__pts">→ {item.points}</span>
                    </td>
                    <td>{item.why}</td>
                  </tr>
                )),
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
