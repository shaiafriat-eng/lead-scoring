import { SiteHeader } from "./components/SiteHeader";
import { Hero } from "./components/Hero";
import { OverviewIntro } from "./components/OverviewIntro";
import { HowItWorks } from "./components/HowItWorks";
import { ScoringFlowExplorer } from "./components/ScoringFlowExplorer";
import { MqlingFlowSection } from "./components/MqlingFlowSection";
import { DemographicSection } from "./components/DemographicSection";
import { BehavioralSection } from "./components/BehavioralSection";
import { ScoreMatrixSection } from "./components/ScoreMatrixSection";
import { NonMqlReasonsSection } from "./components/NonMqlReasonsSection";
import { ManualMqlReviewSection } from "./components/ManualMqlReviewSection";
import { MqlPolicy } from "./components/MqlPolicy";
import { Examples } from "./components/Examples";
import { Interpretation } from "./components/Interpretation";
import { FAQ } from "./components/FAQ";
import { Methodology } from "./components/Methodology";
import { SiteFooter } from "./components/SiteFooter";

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <OverviewIntro />
        <HowItWorks />
        <ScoringFlowExplorer />
        <MqlingFlowSection />
        <DemographicSection />
        <BehavioralSection />
        <ScoreMatrixSection />
        <NonMqlReasonsSection />
        <ManualMqlReviewSection />
        <MqlPolicy />
        <Examples />
        <Interpretation />
        <FAQ />
        <Methodology />
      </main>
      <SiteFooter />
    </>
  );
}
