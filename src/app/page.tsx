import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SectorsSection } from "@/components/landing/SectorsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-parchemin">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SectorsSection />
        <PricingSection />
      </main>
      <FooterSection />
    </div>
  );
}
