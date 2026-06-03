import { useState } from "react";
import { MIRO_BOARD_URL, SCORING_FLOW_STEPS, MQL_POINT_THRESHOLD } from "../data/scoringContent";
import { FlowStepBranches } from "./FlowStepBranches";
import { Section } from "./Section";

export function ScoringFlowExplorer() {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});

  const current = SCORING_FLOW_STEPS[step];
  const selectedBranchId = choices[current.id] ?? null;
  const selectedBranch = current.branches?.find((b) => b.id === selectedBranchId);
  const needsChoice = current.branchMode === "choose-one" && !selectedBranchId;
  const isLastStep = step === SCORING_FLOW_STEPS.length - 1;

  const setChoice = (stepId: string, branchId: string) => {
    setChoices((prev) => ({ ...prev, [stepId]: branchId }));
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

  const demoGrade = choices.demo;
  const engageChoice = choices.engage;
  const junkEnd = choices.junk === "yes";
  const engageToTier: Record<string, string> = { p100: "1", p50: "2", p15: "3", p5: "4" };

  const endSummary = () => {
    if (junkEnd) {
      return "Lead stops at Grade D after junk screening—not auto-MQL on standard WAD/activity paths.";
    }
    if (demoGrade === "d") {
      return `Demographic grade D (persona/account not a fit). Even with ${MQL_POINT_THRESHOLD}+ points, standard auto-MQL paths are usually blocked—see MQL routing.`;
    }
    if (demoGrade && engageChoice) {
      const tier = engageToTier[engageChoice] ?? "?";
      const code = `${demoGrade.toUpperCase()}${tier}`;
      return `With grade ${demoGrade.toUpperCase()} and your selected activity → example score code ${code}. MQL still depends on channel rules (threshold: ${MQL_POINT_THRESHOLD} pts).`;
    }
    if (demoGrade) {
      const code =
        demoGrade === "a" ? "A1" : demoGrade === "b" ? "B2" : demoGrade === "c" ? "C3" : "D4";
      return `Example with grade ${demoGrade.toUpperCase()}: strong engagement could produce ${code}. MQL still depends on channel rules (A1/B1 vs C3 selective vs D blocked).`;
    }
    return `Example: ICP champion with 105 points → A1 → high priority. MQL threshold: ${MQL_POINT_THRESHOLD} points.`;
  };

  return (
    <Section
      id="scoring-flow"
      title="Explore the scoring flow"
      alt
    >
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
          Step through the process below. On branching steps, pick a path—including the marketing activity on
          step 4 and Grade D when persona and account are not a fit.
        </p>
        <p className="scoring-flow-block__miro" style={{ margin: "1rem 0 1.25rem", fontSize: "0.9375rem", color: "var(--coffee-muted)" }}>
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

            <FlowStepBranches
              step={current}
              selectedId={selectedBranchId}
              onSelect={(id) => setChoice(current.id, id)}
            />

            {isLastStep && (
              <div
                style={{
                  padding: "1rem",
                  background: "linear-gradient(135deg, var(--dark-wine), var(--cherry-syrup))",
                  borderRadius: 12,
                  color: "#fff",
                  marginBottom: "1rem",
                  fontSize: "0.9375rem",
                }}
              >
                {endSummary()}
              </div>
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
