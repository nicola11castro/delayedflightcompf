import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n";

import Home from "@/pages/home";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import MyClaims from "@/pages/my-claims";
import Unsubscribed from "@/pages/unsubscribed";
import SignPoa from "@/pages/sign-poa";
import AdminClaim from "@/pages/admin-claim";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import { ApprGuide } from "@/pages/appr-guide";
import { ConsentDemo } from "@/components/consent-demo";

function Router() {
  return (
    <Switch>
      <Route path="/admin/setup" component={AdminSetup} />
      <Route path="/admin/claims/:id" component={AdminClaim} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/register" component={Register} />
      <Route path="/my-claims" component={MyClaims} />
      <Route path="/unsubscribed" component={Unsubscribed} />
      <Route path="/sign/:claimId" component={SignPoa} />
      <Route path="/appr-guide" component={ApprGuide} />
      <Route path="/consent-demo" component={() => <ConsentDemo />} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Toaster />
              <Router />

              {/* CSS for Côney animations */}
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
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
