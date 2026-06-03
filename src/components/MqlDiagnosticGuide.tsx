import { useEffect, useMemo, useRef, useState } from "react";
import { MqlDiagnosticBotAvatar } from "./MqlDiagnosticBotAvatar";
import { MqlDiagnosticThinking } from "./MqlDiagnosticThinking";
import {
  MQL_DIAGNOSTIC_CONCLUSIONS,
  MQL_DIAGNOSTIC_START,
  enrichConclusionWithDemographic,
  getMqlDiagnosticConclusion,
  getMqlDiagnosticStep,
  computeDemographicFromInputs,
  routeAfterMarketoGrade,
  routeAfterEngage,
  tierFromEngage,
  getEngageActivitySummary,
  type DemographicScoringAnswers,
  type MqlDiagnosticConclusion,
} from "../data/scoringContent";

type HistoryEntry = { question: string; answer: string };

const THINK_MS = 750;

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

function HistoryExchange({ entry }: { entry: HistoryEntry }) {
  return (
    <>
      <div className="mql-diagnostic__msg mql-diagnostic__msg--guide">
        <MqlDiagnosticBotAvatar />
        <div className="mql-diagnostic__bubble">{entry.question}</div>
      </div>
      <div className="mql-diagnostic__msg mql-diagnostic__msg--user">
        <div className="mql-diagnostic__bubble mql-diagnostic__bubble--user">{entry.answer}</div>
      </div>
    </>
  );
}

export function MqlDiagnosticGuide() {
  const [stepId, setStepId] = useState<string>(MQL_DIAGNOSTIC_START);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [answers, setAnswers] = useState<DemographicScoringAnswers>({});
  const [conclusionId, setConclusionId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [pendingExchange, setPendingExchange] = useState<HistoryEntry | null>(null);
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, thinking, pendingExchange, stepId, conclusionId]);

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

  const pickOption = (
    stepKey: string,
    question: string,
    label: string,
    optionId: string,
    next: string,
  ) => {
    if (thinking) return;

    const exchange = { question, answer: label };
    setPendingExchange(exchange);
    setThinking(true);

    if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    thinkTimerRef.current = setTimeout(() => {
      thinkTimerRef.current = null;
      const nextAnswers = { ...answers, [stepKey]: optionId };
      setHistory((h) => [...h, exchange]);
      setAnswers(nextAnswers);
      setPendingExchange(null);
      setThinking(false);

      if (next === "__grade_route__") {
        const computedNow = computeDemographicFromInputs(nextAnswers);
        if (computedNow) {
          goTo(routeAfterMarketoGrade(optionId, computedNow));
          return;
        }
      }

      if (next === "__engage_route__") {
        const computedNow = computeDemographicFromInputs(nextAnswers);
        goTo(routeAfterEngage(optionId, computedNow));
        return;
      }

      goTo(next);
    }, THINK_MS);
  };

  const reset = () => {
    if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    thinkTimerRef.current = null;
    setThinking(false);
    setPendingExchange(null);
    setStepId(MQL_DIAGNOSTIC_START);
    setHistory([]);
    setAnswers({});
    setConclusionId(null);
  };

  const showGradeInsight = !thinking && step?.id === "marketo_grade" && computed;
  const engageTier = tierFromEngage(answers.engage);
  const engageSummary = getEngageActivitySummary(answers.engage);
  const showEngageInsight =
    !thinking && Boolean(engageTier && engageSummary && step?.id !== "engage" && step?.id !== "marketo_grade");

  return (
    <div className={`mql-diagnostic${thinking ? " mql-diagnostic--thinking" : ""}`}>
      <div className="mql-diagnostic__progress" aria-hidden>
        <div className="mql-diagnostic__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="mql-diagnostic__thread" role="log" aria-live="polite" ref={threadRef}>
        {history.map((entry, i) => (
          <div key={`hist-${i}`}>
            <HistoryExchange entry={entry} />
          </div>
        ))}

        {thinking && pendingExchange && (
          <>
            <div className="mql-diagnostic__msg mql-diagnostic__msg--guide">
              <MqlDiagnosticBotAvatar />
              <div className="mql-diagnostic__bubble">{pendingExchange.question}</div>
            </div>
            <div className="mql-diagnostic__msg mql-diagnostic__msg--user">
              <div className="mql-diagnostic__bubble mql-diagnostic__bubble--user">{pendingExchange.answer}</div>
            </div>
            <MqlDiagnosticThinking />
          </>
        )}

        {!thinking && showGradeInsight && (
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

        {showEngageInsight && (
          <div className="mql-diagnostic__grade-insight">
            <p className="mql-diagnostic__grade-insight-title">
              From activity → <strong>Tier {engageTier}</strong>
            </p>
            <p style={{ margin: 0, color: "var(--coffee-muted)" }}>{engageSummary}</p>
          </div>
        )}

        {!thinking && step && (
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

        {!thinking && conclusion && toneStyle && (
          <div
            className={`mql-diagnostic__conclusion mql-diagnostic__conclusion--${conclusion.tone}`}
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
              disabled={thinking}
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
