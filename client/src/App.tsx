import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function Router() {
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
                  0% { top: 20%; left: 20%; }
                  25% { top: 10%; left: 30%; }
                  50% { top: 20%; left: 40%; }
                  75% { top: 30%; left: 30%; }
                  100% { top: 20%; left: 20%; }
                }
                
                @keyframes eyeMovementRight {
                  0% { top: 20%; left: 40%; }
                  25% { top: 30%; left: 30%; }
                  50% { top: 20%; left: 20%; }
                  75% { top: 10%; left: 30%; }
                  100% { top: 20%; left: 40%; }
                }
                
                @keyframes coneyBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-2px); }
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
