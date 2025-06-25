import { FileText, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-gradient-to-br from-background via-muted to-card text-foreground py-20 lg:py-32 retro-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6 retro-glow">
              Get Your Flight Compensation
              <span className="block text-accent">15% Fee, No Win No Pay</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Delayed, cancelled, or denied boarding? Claim up to $700 compensation. 
              We only charge our 15% commission when you win.
            </p>
            
            {/* Commission Highlight */}
            <div className="retro-card p-6 mb-8">
              <h3 className="font-semibold text-lg mb-3 text-primary">
                <Calculator className="inline w-5 h-5 text-accent mr-2" />
                Transparent Commission Structure
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Compensation: </span>
                  <span className="font-semibold text-primary">$700</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Our Fee (15%): </span>
                  <span className="font-semibold text-accent">$105</span>
                </div>
                <div>
                  <span className="text-muted-foreground">You Receive: </span>
                  <span className="font-semibold text-secondary">$595</span>
                </div>
                <div>
                  <span className="text-muted-foreground">If No Win: </span>
                  <span className="font-semibold text-foreground">$0 Fee</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="btn-accent text-lg retro-button"
                onClick={() => scrollToSection('claims')}
              >
                <FileText className="mr-2 h-5 w-5" />
                Submit Your Claim
              </Button>
              <Button 
                variant="outline"
                className="btn-outline text-lg"
                onClick={() => scrollToSection('calculator')}
              >
                Calculate Commission
              </Button>
            </div>
          </div>

          <div className="animate-slide-up">
            <div className="relative mx-auto max-w-md">
              <div className="retro-card p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 retro-shadow">
                    <FileText className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Quick Claim Process</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Submit your claim in under 5 minutes. Our AI validates eligibility instantly.
                  </p>
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full retro-shadow"></div>
                      <span className="text-foreground">Flight details & documents</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full retro-shadow"></div>
                      <span className="text-foreground">AI eligibility validation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full retro-shadow"></div>
                      <span className="text-foreground">Commission only on success</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
