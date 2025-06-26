import { FileText, Calculator, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Hero() {
  const { isAuthenticated, user } = useAuth();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-background text-foreground py-12 border-b-2 border-border" style={{borderStyle: 'inset'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-bold text-2xl mb-4">
              Get Your Flight Compensation
              <span className="block text-accent">15% Fee, No Win No Pay</span>
            </h1>
            <p className="text-sm text-foreground mb-6">
              Delayed, cancelled, or denied boarding? Claim up to $700 compensation. 
              We only charge our 15% commission when you win.
            </p>
            
            {/* Commission Highlight */}
            <div className="win98-panel mb-6">
              <h3 className="font-bold text-sm mb-2">
                <Calculator className="inline w-4 h-4 mr-1" />
                Transparent Commission Structure
              </h3>
              <div className="win98-inset mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Compensation: <strong>$700</strong></div>
                  <div>Our Fee (15%): <strong>$105</strong></div>
                  <div>You Receive: <strong>$595</strong></div>
                  <div>If No Win: <strong>$0 Fee</strong></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="btn-accent"
                onClick={() => scrollToSection('claims')}
              >
                <FileText className="mr-1 h-4 w-4" />
                Submit Claim
              </Button>
              <Button 
                variant="outline"
                className="btn-outline"
                onClick={() => scrollToSection('calculator')}
              >
                Calculate
              </Button>
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2 mt-3 text-xs bg-accent/10 border border-accent/20 rounded-lg p-2">
                <User className="h-3 w-3 text-accent" />
                <span className="text-accent">Welcome back, {user?.firstName || user?.email}!</span>
                <a href="/api/logout" className="ml-auto underline hover:text-primary">
                  Logout
                </a>
              </div>
            ) : (
              <div className="flex gap-2 mt-3 text-xs">
                <a href="/register" className="underline hover:text-primary">
                  New User? Register here
                </a>
                <span>•</span>
                <a href="/api/login" className="underline hover:text-primary">
                  Have an account? Login
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="win98-panel">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent flex items-center justify-center mx-auto mb-2" style={{border: '2px outset'}}>
                  <FileText className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-2">Quick Claim Process</h3>
                <p className="text-xs mb-3">
                  Submit your claim in under 5 minutes. Our AI validates eligibility instantly.
                </p>
                <div className="space-y-1 text-left text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary" style={{border: '1px outset'}}></div>
                    <span>Flight details & documents</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary" style={{border: '1px outset'}}></div>
                    <span>AI eligibility validation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary" style={{border: '1px outset'}}></div>
                    <span>Commission only on success</span>
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
