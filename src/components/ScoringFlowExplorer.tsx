import { useState } from "react";
import {
  MIRO_BOARD_URL,
  SCORING_FLOW_STEPS,
  ENGAGE_TO_TIER,
  tierFromEngage,
  getBehaviorBranchByTier,
  scoreCodeFromChoices,
  getScoreCodeOutcome,
  getMqlDecisionFromFlow,
} from "../data/scoringContent";
import { FlowStepBranches } from "./FlowStepBranches";
import { FlowDerivedResult } from "./FlowDerivedResult";
import { Section } from "./Section";

export function ScoringFlowExplorer() {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});

  const current = SCORING_FLOW_STEPS[step];
  const engageChoice = choices.engage;
  const demoGrade = choices.demo;
  const behaviorTier = choices.behavior ?? tierFromEngage(engageChoice);
  const scoreCode = scoreCodeFromChoices(demoGrade, behaviorTier);

  const selectedBranchId = choices[current.id] ?? null;
  const selectedBranch = current.branches?.find((b) => b.id === selectedBranchId);
  const needsChoice = stepNeedsChoice(current.id, choices, behaviorTier, demoGrade);
  const isLastStep = step === SCORING_FLOW_STEPS.length - 1;

  const setChoice = (stepId: string, branchId: string) => {
    setChoices((prev) => {
      const next = { ...prev, [stepId]: branchId };
      if (stepId === "engage") {
        const tier = ENGAGE_TO_TIER[branchId];
        if (tier) next.behavior = tier;
      }
      return next;
    });
  };

  const goNext = () => {
    if (selectedBranch?.action === "end") {
      setStep(SCORING_FLOW_STEPS.length - 1);
      return;
    }
    setStep((s) => Math.min(s + 1, SCORING_FLOW_STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setStep(0);
    setChoices({});
  };

  const derivedPanel = () => {
    if (current.id === "behavior") {
      if (!engageChoice || !behaviorTier) {
        return (
          <p style={{ fontSize: "0.875rem", color: "var(--coffee-muted)", marginBottom: "1.25rem" }}>
            Select a marketing activity on step 4 first.
          </p>
        );
      }
      const tierBranch = getBehaviorBranchByTier(behaviorTier);
      return (
        <FlowDerivedResult
          label="Behavioral tier"
          value={`Tier ${behaviorTier}`}
          outcome={tierBranch?.outcome ?? ""}
        />
      );
    }
    if (current.id === "code") {
      if (!demoGrade || !behaviorTier) {
        return (
          <p style={{ fontSize: "0.875rem", color: "var(--coffee-muted)", marginBottom: "1.25rem" }}>
            Complete steps 3 and 4 first — the score code is built from your demographic grade and activity.
          </p>
        );
      }
      const code = scoreCode ?? `${demoGrade.toUpperCase()}${behaviorTier}`;
      const gradeClass =
        demoGrade === "d" ? "flow-derived--grade-D" : `flow-derived--grade-${demoGrade.toUpperCase()}`;
      return (
        <FlowDerivedResult
          label="Score code"
          value={code}
          outcome={getScoreCodeOutcome(code)}
          gradeClass={gradeClass}
        />
      );
    }
    if (current.id === "mql") {
      const decision = getMqlDecisionFromFlow(choices);
      if (!decision) {
        return (
          <p style={{ fontSize: "0.875rem", color: "var(--coffee-muted)", marginBottom: "1.25rem" }}>
            Complete steps 2–6 first — MQL outcome depends on your path through the flow.
          </p>
        );
      }
      return (
        <FlowDerivedResult
          label="MQL decision"
          value={decision.value}
          outcome={decision.outcome}
          toneClass={`flow-derived--mql-${decision.tone}`}
        />
      );
    }
    return null;
  };

  return (
    <Section id="scoring-flow" title="Explore the scoring flow" alt>
      <div className="scoring-flow-block">
        <p
          className="scoring-flow-block__intro"
          style={{
            color: "var(--coffee-muted)",
            margin: "0 0 1.25rem",
            fontSize: "1.0625rem",
            fontWeight: 400,
            textTransform: "none",
            maxWidth: "none",
            width: "100%",
          }}
        >
          Step through the process below.
        </p>
        <p
          className="scoring-flow-block__miro"
          style={{ margin: "1rem 0 1.25rem", fontSize: "0.9375rem", color: "var(--coffee-muted)" }}
        >
          Full diagram:{" "}
          <a href={MIRO_BOARD_URL} target="_blank" rel="noopener noreferrer">
            Open Miro board →
          </a>
        </p>
        <div className="card scoring-flow-block__card" style={{ padding: 0, overflow: "hidden", marginTop: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "1rem 1rem 0",
              flexWrap: "wrap",
            }}
          >
            {SCORING_FLOW_STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  background:
                    i === step ? "var(--cherry-syrup)" : i < step ? "#fac7d1" : "var(--white-cream)",
                  color: i === step ? "#fff" : "var(--black-coffee)",
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step ? "step" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
            <p className="section-label" style={{ marginBottom: "0.35rem" }}>
              Step {step + 1} of {SCORING_FLOW_STEPS.length}
            </p>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>{current.title}</h3>
            <p style={{ color: "var(--coffee-muted)", margin: "0 0 1rem" }}>{current.body}</p>

            {current.branchMode === "derived" ? (
              derivedPanel()
            ) : (
              <FlowStepBranches
                step={current}
                selectedId={selectedBranchId}
                onSelect={(id) => setChoice(current.id, id)}
              />
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={goPrev} disabled={step === 0}>
                Back
              </button>
              {!isLastStep ? (
                <button type="button" className="btn btn-primary" onClick={goNext} disabled={needsChoice}>
                  Next
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={reset}>
                  Start over
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function stepNeedsChoice(
  stepId: string,
  choices: Record<string, string>,
  behaviorTier: string | null,
  demoGrade: string | undefined,
): boolean {
  if (stepId === "behavior") return !choices.engage || !behaviorTier;
  if (stepId === "code") return !demoGrade || !behaviorTier;
  if (stepId === "mql") return getMqlDecisionFromFlow(choices) === null;
  const step = SCORING_FLOW_STEPS.find((s) => s.id === stepId);
  if (step?.branchMode === "choose-one") return !choices[stepId];
  return false;
}
