import { useState } from "react";
import {
  MIRO_BOARD_URL,
  MIRO_EMBED_URL,
  SCORING_FLOW_STEPS,
  MQL_POINT_THRESHOLD,
} from "../data/scoringContent";
import { Section } from "./Section";

export function ScoringFlowExplorer() {
  const [step, setStep] = useState(0);
  const [junkPath, setJunkPath] = useState<"yes" | "no" | null>(null);
  const current = SCORING_FLOW_STEPS[step];
  const isJunkStep = current.id === "junk";

  const goNext = () => {
    if (isJunkStep && junkPath === "yes") {
      setStep(SCORING_FLOW_STEPS.length - 1);
      return;
    }
    setStep((s) => Math.min(s + 1, SCORING_FLOW_STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setStep(0);
    setJunkPath(null);
  };

  return (
    <Section
      id="scoring-flow"
      label="Interactive"
      title="Explore the scoring flow"
      subtitle="Step through the end-to-end process aligned with our Miro board. Choose paths where noted."
      alt
    >
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
                onClick={() => {
                  setStep(i);
                  if (s.id !== "junk") setJunkPath(null);
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  background: i === step ? "var(--cherry-syrup)" : i < step ? "var(--pink-soft)" : "var(--white-cream)",
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

            {isJunkStep && current.branch && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  Does the lead match junk/test criteria?
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: junkPath === "yes" ? "var(--dark-wine)" : "var(--white-cream)",
                      color: junkPath === "yes" ? "#fff" : "var(--black-coffee)",
                      border: "2px solid var(--border)",
                    }}
                    onClick={() => setJunkPath("yes")}
                  >
                    Yes → Grade D
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: junkPath === "no" ? "var(--cherry-syrup)" : "var(--white-cream)",
                      color: junkPath === "no" ? "#fff" : "var(--black-coffee)",
                      border: "2px solid var(--border)",
                    }}
                    onClick={() => setJunkPath("no")}
                  >
                    No → Continue
                  </button>
                </div>
                {junkPath === "yes" && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem",
                      background: "var(--cappuccino-foam)",
                      borderRadius: 8,
                      fontSize: "0.875rem",
                    }}
                  >
                    {current.branch.yes}
                  </p>
                )}
                {junkPath === "no" && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--coffee-muted)" }}>
                    {current.branch.no}
                  </p>
                )}
              </div>
            )}

            {step === SCORING_FLOW_STEPS.length - 1 && (
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
                {junkPath === "yes"
                  ? "Lead stops at Grade D — not auto-MQL on standard WAD/activity paths."
                  : `Example: ICP champion with 105 points → A1 → high priority. MQL threshold: ${MQL_POINT_THRESHOLD} points.`}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={goPrev} disabled={step === 0}>
                Back
              </button>
              {step < SCORING_FLOW_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={goNext}
                  disabled={isJunkStep && junkPath === null}
                >
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

        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
            <iframe
              title="HiBob lead scoring Miro board"
              src={MIRO_EMBED_URL}
              style={{
                width: "100%",
                height: 360,
                border: "none",
                display: "block",
              }}
              allowFullScreen
            />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--coffee-muted)", margin: 0 }}>
            Full diagram on{" "}
            <a href={MIRO_BOARD_URL} target="_blank" rel="noopener noreferrer">
              Miro
            </a>
            . Use the step guide on the left to walk through the same logic.
          </p>
        </div>
      </div>
    </Section>
  );
}
