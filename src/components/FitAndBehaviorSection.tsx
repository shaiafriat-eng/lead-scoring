import { DemographicSection } from "./DemographicSection";
import { BehavioralSection } from "./BehavioralSection";

export function FitAndBehaviorSection() {
  return (
    <section id="dimensions" style={{ background: "var(--bg-page)" }}>
      <div className="section-inner">
        <DemographicSection embedded />
        <BehavioralSection embedded />
      </div>
    </section>
  );
}
