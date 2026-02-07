import { FeatureSection } from "@/src/components/homepage/features-section";
import { CTASection } from "@/src/components/homepage/cta-section";
import { HeroSection } from "@/src/components/homepage/hero-section";
import { DashboardSection } from "@/src/components/homepage/dashboard-section";
import { Footer } from "@/src/components/footer";


export default function LandingPage() {

  return (
    <main id="smooth-content">
        <HeroSection />
        <DashboardSection />
        <FeatureSection />
        <CTASection />
        <Footer />
    </main>
  )
}
