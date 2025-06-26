import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ConeyLoader } from "@/components/coney-loader";
import { useState, useEffect } from "react";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function Router() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Show Côney for a moment while the app initializes
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500); // 2.5 seconds of Côney

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center win98-bg">
        <div className="text-center win98-panel p-8 max-w-md">
          <ConeyLoader size="lg" className="mb-6" />
          <h1 className="text-2xl font-bold mb-2 win98-text">FlightClaim Pro</h1>
          <p className="text-muted-foreground text-sm mb-2">Côney's getting things ready...</p>
          <div className="mt-4 text-xs text-muted-foreground win98-text">
            🍁 Montreal's finest flight compensation service 🍁
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Powered by authentic retro computing
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/admin/setup" component={AdminSetup} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
            
            {/* Add CSS for Côney animations */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes eyeMovementLeft {
                  0% { top: 25%; left: 25%; }
                  25% { top: 15%; left: 35%; }
                  50% { top: 25%; left: 45%; }
                  75% { top: 35%; left: 35%; }
                  100% { top: 25%; left: 25%; }
                }
                
                @keyframes eyeMovementRight {
                  0% { top: 25%; left: 45%; }
                  25% { top: 35%; left: 35%; }
                  50% { top: 25%; left: 25%; }
                  75% { top: 15%; left: 35%; }
                  100% { top: 25%; left: 45%; }
                }
                
                @keyframes coneyBounce {
                  0%, 100% { transform: perspective(100px) rotateX(5deg) translateY(0); }
                  50% { transform: perspective(100px) rotateX(5deg) translateY(-3px); }
                }
              `
            }} />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
