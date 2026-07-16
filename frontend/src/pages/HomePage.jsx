import HeroSection from "../components/home/HeroSection";
import ProblemSection from "../components/home/ProblemSection";
import SolutionSection from "../components/home/SolutionSection";
import FeatureSection from "../components/home/FeatureSection";
import ThemeSection from "../components/home/ThemeSection";
import TechStackSection from "../components/home/TechStackSection";
import ImpactSection from "../components/home/ImpactSection";
import PortalChooser from "../components/home/PortalChooser";
import HomeFooter from "../components/home/HomeFooter";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <PortalChooser />
      <ProblemSection />
      <SolutionSection />
      <FeatureSection />
      <ThemeSection />
      <TechStackSection />
      <ImpactSection />
      <HomeFooter />
    </div>
  );
}
