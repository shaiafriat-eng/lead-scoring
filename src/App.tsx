import { Routes, Route } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { Hero } from "./components/Hero";
import { OverviewIntro } from "./components/OverviewIntro";
import { HowItWorks } from "./components/HowItWorks";
import { ScoringFlowExplorer } from "./components/ScoringFlowExplorer";
import { MqlingFlowSection } from "./components/MqlingFlowSection";
import { FitAndBehaviorSection } from "./components/FitAndBehaviorSection";
import { ScoreMatrixSection } from "./components/ScoreMatrixSection";
import { NonMqlReasonsSection } from "./components/NonMqlReasonsSection";
import { ManualMqlReviewSection } from "./components/ManualMqlReviewSection";
import { MqlPolicy } from "./components/MqlPolicy";
import { FAQ } from "./components/FAQ";
import { Methodology } from "./components/Methodology";

function HomePage() {
  return (
    <>
      <Hero />
      <OverviewIntro />
      <HowItWorks />
      <FitAndBehaviorSection />
    </>
  );
}

function DimensionsPage() {
  return <FitAndBehaviorSection />;
}

function MqlRoutingPage() {
  return (
    <>
      <MqlPolicy />
      <NonMqlReasonsSection />
      <ManualMqlReviewSection />
    </>
  );
}

function GuidePage() {
  return (
    <>
      <FAQ />
      <Methodology />
    </>
  );
}

function ScoringFlowPage() {
  return (
    <>
      <ScoringFlowExplorer />
      <ScoreMatrixSection embedded />
    </>
  );
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/scoring-flow" element={<ScoringFlowPage />} />
          <Route path="/mqling-flow" element={<MqlingFlowSection />} />
          <Route path="/dimensions" element={<DimensionsPage />} />
          <Route path="/matrix" element={<ScoreMatrixSection />} />
          <Route path="/mql-routing" element={<MqlRoutingPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}
