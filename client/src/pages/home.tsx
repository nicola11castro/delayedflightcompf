import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { TrustIndicators } from "@/components/trust-indicators";
import { ClaimForm } from "@/components/claim-form";
import { CommissionCalculator } from "@/components/commission-calculator";
import { ClaimTracking } from "@/components/claim-tracking";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground retro-grid">
      <Navigation />
      <Hero />
      <TrustIndicators />
      <ClaimForm />
      <CommissionCalculator />
      <ClaimTracking />
      <FaqSection />
      <Footer />
    </div>
  );
}
