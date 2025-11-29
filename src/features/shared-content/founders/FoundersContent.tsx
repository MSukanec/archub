import { HeroSection } from "./components/HeroSection";
import { EssenceSection } from "./components/EssenceSection";
import { BenefitsSection } from "./components/BenefitsSection";
import { CourseBonusSection } from "./components/CourseBonusSection";
import { HowToJoinSection } from "./components/HowToJoinSection";
import { FinalCTASection } from "./components/FinalCTASection";
import type { FoundersContentProps } from "./types";

export function FoundersContent({ mode, showHero = true }: FoundersContentProps) {
  return (
    <>
      {showHero && <HeroSection mode={mode} />}
      <EssenceSection />
      <BenefitsSection />
      <CourseBonusSection />
      <HowToJoinSection />
      <FinalCTASection mode={mode} />
    </>
  );
}
