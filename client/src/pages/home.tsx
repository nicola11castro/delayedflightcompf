import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { TrustIndicators } from "@/components/trust-indicators";
import { ClaimForm } from "@/components/claim-form";
import { CommissionCalculator } from "@/components/commission-calculator";
import { ClaimStatus } from "@/components/claim-status";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { ClippyAssistant } from "@/components/clippy-assistant";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Hero />
      <TrustIndicators />
      
      <section id="calculator" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommissionCalculator />
        </div>
      </section>

      <section id="claims" className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ClaimForm />
        </div>
      </section>

      <section id="track" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Track Your Claim</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your claim progress using your unique Claim ID. Get real-time updates on your compensation request.
            </p>
          </div>
          <ClaimStatus />
        </div>
      </section>

      <section id="faq" className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqSection />
        </div>
      </section>
      
      <Footer />
      <ClippyAssistant />
    </div>
  );
}
