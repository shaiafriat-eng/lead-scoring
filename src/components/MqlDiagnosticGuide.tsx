import { useMemo, useState } from "react";
import { MqlDiagnosticBotAvatar } from "./MqlDiagnosticBotAvatar";
import {
  MQL_DIAGNOSTIC_CONCLUSIONS,
  MQL_DIAGNOSTIC_INTRO,
  MQL_DIAGNOSTIC_START,
  enrichConclusionWithDemographic,
  getMqlDiagnosticConclusion,
  getMqlDiagnosticStep,
  computeDemographicFromInputs,
  routeAfterMarketoGrade,
  type DemographicScoringAnswers,
  type MqlDiagnosticConclusion,
} from "../data/scoringContent";

type HistoryEntry = { question: string; answer: string };

const TONE_STYLES: Record<
  MqlDiagnosticConclusion["tone"],
  { border: string; bg: string; label: string }
> = {
  policy: {
    border: "var(--border)",
    bg: "var(--cappuccino-foam)",
    label: "Matches policy",
  },
  review: {
    border: "var(--cherry-syrup)",
    bg: "linear-gradient(90deg, var(--white-cream) 0%, var(--cappuccino-foam) 100%)",
    label: "Worth a review",
  },
  info: {
    border: "var(--orange-juice)",
    bg: "var(--white-cream)",
    label: "Depends on details",
  },
};

export function MqlDiagnosticGuide() {
  const [stepId, setStepId] = useState<string>(MQL_DIAGNOSTIC_START);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [answers, setAnswers] = useState<DemographicScoringAnswers>({});
  const [conclusionId, setConclusionId] = useState<string | null>(null);

  const step = conclusionId ? null : getMqlDiagnosticStep(stepId);
  const baseConclusion = conclusionId ? getMqlDiagnosticConclusion(conclusionId) : null;
  const computed = useMemo(() => computeDemographicFromInputs(answers), [answers]);

  const conclusion = baseConclusion
    ? {
        ...baseConclusion,
        reasons: [
          ...baseConclusion.reasons,
          ...enrichConclusionWithDemographic(conclusionId!, computed, answers),
        ],
      }
    : null;

  const toneStyle = conclusion ? TONE_STYLES[conclusion.tone] : null;

  const progress = useMemo(() => {
    if (conclusionId) return 100;
    return Math.min(12 + history.length * 10, 92);
  }, [conclusionId, history.length]);

  const goTo = (next: string) => {
    const nextConclusion = getMqlDiagnosticConclusion(next);
    if (nextConclusion) {
      setConclusionId(next);
      setStepId("");
      return;
    }
    setConclusionId(null);
    setStepId(next);
  };

  const pickOption = (stepKey: string, question: string, label: string, optionId: string, next: string) => {
    setHistory((h) => [...h, { question, answer: label }]);
    const nextAnswers = { ...answers, [stepKey]: optionId };
    setAnswers(nextAnswers);

    if (next === "__grade_route__") {
      const computedNow = computeDemographicFromInputs(answers);
      if (computedNow) {
        goTo(routeAfterMarketoGrade(optionId, computedNow));
        return;
      }
    }

    goTo(next);
  };

  const reset = () => {
    setStepId(MQL_DIAGNOSTIC_START);
    setHistory([]);
    setAnswers({});
    setConclusionId(null);
  };

  const showGradeInsight = step?.id === "marketo_grade" && computed;

  return (
    <div className="mql-diagnostic">
      <div className="mql-diagnostic__progress" aria-hidden>
        <div className="mql-diagnostic__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="mql-diagnostic__thread" role="log" aria-live="polite">
        <div className="mql-diagnostic__msg mql-diagnostic__msg--guide">
          <MqlDiagnosticBotAvatar />
          <div className="mql-diagnostic__bubble">{MQL_DIAGNOSTIC_INTRO}</div>
        </div>

        {history.map((entry, i) => (
          <div key={i}>
            <div className="mql-diagnostic__msg mql-diagnostic__msg--guide">
              <MqlDiagnosticBotAvatar />
              <div className="mql-diagnostic__bubble">{entry.question}</div>
            </div>
            <div className="mql-diagnostic__msg mql-diagnostic__msg--user">
              <div className="mql-diagnostic__bubble mql-diagnostic__bubble--user">{entry.answer}</div>
            </div>
          </div>
        ))}

        {showGradeInsight && (
          <div className="mql-diagnostic__grade-insight">
            <p className="mql-diagnostic__grade-insight-title">
              From scoring logic → <strong>expected {computed.grade}</strong> ({computed.title})
            </p>
            <ul>
              {computed.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {step && (
          <div className="mql-diagnostic__msg mql-diagnostic__msg--guide">
            <MqlDiagnosticBotAvatar />
            <div className="mql-diagnostic__bubble">
              <p style={{ margin: 0, fontWeight: 700 }}>{step.question}</p>
              {step.helper && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--coffee-muted)" }}>
                  {step.helper}
                </p>
              )}
            </div>
          </div>
        )}

        {conclusion && toneStyle && (
          <div
            className="mql-diagnostic__conclusion"
            style={{
              borderLeft: `4px solid ${toneStyle.border}`,
              background: toneStyle.bg,
            }}
          >
            <span className="mql-diagnostic__conclusion-tag">{toneStyle.label}</span>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>{conclusion.title}</h3>
            <p style={{ margin: "0 0 1rem", color: "var(--coffee-muted)" }}>{conclusion.summary}</p>
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.875rem" }}>Why</p>
            <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
              {conclusion.reasons.map((r) => (
                <li key={r} style={{ marginBottom: "0.35rem" }}>
                  {r}
                </li>
              ))}
            </ul>
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.875rem" }}>What to do next</p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--coffee-muted)" }}>
              {conclusion.nextSteps.map((s) => (
                <li key={s} style={{ marginBottom: "0.35rem" }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {step && (
        <div className="mql-diagnostic__options" role="group" aria-label="Your answer">
          {step.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="mql-diagnostic__option"
              onClick={() => pickOption(step.id, step.question, opt.label, opt.id, opt.next)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="mql-diagnostic__footer">
        {conclusion && (
          <button type="button" className="btn btn-primary" onClick={reset}>
            Check another lead
          </button>
        )}
        {!conclusion && history.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
