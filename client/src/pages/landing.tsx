import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { TrustIndicators } from "@/components/trust-indicators";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { ClippyAssistant } from "@/components/clippy-assistant";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background win98-bg">
      <Navigation />
      <Hero />
      <TrustIndicators />
      <FaqSection />
      <Footer />
      <ClippyAssistant />
    </div>
  );
}