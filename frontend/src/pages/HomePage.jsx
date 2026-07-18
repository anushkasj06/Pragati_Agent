import { motion } from "framer-motion";
import HeroSection from "../components/home/HeroSection";
import ProblemSection from "../components/home/ProblemSection";
import SolutionSection from "../components/home/SolutionSection";
import FeatureSection from "../components/home/FeatureSection";
import ThemeSection from "../components/home/ThemeSection";
import TechStackSection from "../components/home/TechStackSection";
import ImpactSection from "../components/home/ImpactSection";
import PortalChooser from "../components/home/PortalChooser";
import WhatsAppShowcase from "../components/home/WhatsAppShowcase";
import HomeFooter from "../components/home/HomeFooter";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <PortalChooser />
      <WhatsAppShowcase />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <ProblemSection />
      </motion.div>
      <SolutionSection />
      <FeatureSection />
      <ThemeSection />
      <TechStackSection />
      <ImpactSection />
      <HomeFooter />
    </div>
  );
}
