import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { generateClaimId } from "@/lib/claim-id";

interface CalculationResult {
  compensationAmount: number;
  commissionAmount: number;
  finalAmount: number;
  claimId?: string;
  mealVoucherDeduction?: number;
  explanation?: string;
}

export function CommissionCalculator() {
  const [email, setEmail] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [delayDuration, setDelayDuration] = useState<string>("");
  const [delayReason, setDelayReason] = useState<string>("");
  const [mealVouchers, setMealVouchers] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: { 
      email: string;
      distance: string; 
      delayDuration: number;
      delayReason: string;
      mealVouchers: string;
      claimId: string;
    }) => {
      const response = await apiRequest('POST', '/api/calculate-compensation', data);
      return response.json();
    },
    onSuccess: (data: CalculationResult) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    if (!email || !distance || !delayDuration || !delayReason) {
      alert('Please fill in all required fields including email, distance, delay duration, and delay reason');
      return;
    }

    const claimId = generateClaimId(email);
    const delayHours = parseInt(delayDuration);
    calculateMutation.mutate({ 
      email,
      distance, 
      delayDuration: delayHours,
      delayReason,
      claimId
    });
  };

  const scrollToClaims = () => {
    const element = document.getElementById('claims');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="calculator" className="py-8 bg-muted">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            <Calculator className="inline-block w-4 h-4 mr-2" />
            Commission Calculator
          </h2>
          <p className="text-xs text-muted-foreground">
            See exactly what you'll receive after our 15% commission fee
          </p>
        </div>

        <div className="win98-panel">
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-sm font-bold mb-4">
                Calculate Your Compensation
              </h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="win98-inset text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Flight Distance *
                  </label>
                  <Select value={distance} onValueChange={setDistance}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">Short haul (up to 1,500 km)</SelectItem>
                      <SelectItem value="3500">Medium haul (1,500-3,500 km)</SelectItem>
                      <SelectItem value="3500+">Long haul (over 3,500 km)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Delay Duration *
                  </label>
                  <Select value={delayDuration} onValueChange={setDelayDuration}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select delay duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3–6 hours</SelectItem>
                      <SelectItem value="6">6–9 hours</SelectItem>
                      <SelectItem value="9">9+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Delay Reason *
                  </label>
                  <Select value={delayReason} onValueChange={setDelayReason}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select delay reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance_non_safety">Maintenance Issues (Non-Safety)</SelectItem>
                      <SelectItem value="crew_scheduling">Crew Scheduling Problems</SelectItem>
                      <SelectItem value="overbooking">Overbooking or Boarding Issues</SelectItem>
                      <SelectItem value="operational_decisions">Operational Decisions</SelectItem>
                      <SelectItem value="it_failure">IT System Failures</SelectItem>
                      <SelectItem value="ground_handling">Ground Handling Delays</SelectItem>
                      <SelectItem value="fueling_deicing">Fueling or De-Icing Delays (Non-Weather)</SelectItem>
                      <SelectItem value="weather">Weather Conditions</SelectItem>
                      <SelectItem value="atc">Air Traffic Control (ATC) Restrictions</SelectItem>
                      <SelectItem value="security">Security Incidents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Meal Vouchers Received
                  </label>
                  <Input
                    value={mealVouchers}
                    onChange={(e) => setMealVouchers(e.target.value)}
                    placeholder="e.g., $15 or None"
                    className="win98-inset text-xs"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    If you received meal vouchers, specify amount in CAD. Otherwise enter "None".
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCalculate}
                disabled={calculateMutation.isPending || !email || !distance || !delayDuration || !delayReason}
                className="btn-primary"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {calculateMutation.isPending ? "Calculating..." : "Calculate Compensation"}
              </Button>
            </div>

            {result && (
              <div className="win98-panel">
                <h4 className="text-sm font-bold mb-4">
                  Your Compensation Breakdown
                </h4>
                
                {result.claimId && (
                  <div className="mb-4 p-2 win98-inset">
                    <div className="text-xs font-bold mb-1">Claim ID Generated:</div>
                    <div className="text-xs font-mono bg-accent text-accent-foreground p-1">
                      {result.claimId}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span>Total Compensation:</span>
                    <span className="font-bold">
                      ${result.compensationAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Our Commission (15%):</span>
                    <span className="font-bold text-accent">
                      ${result.commissionAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 win98-inset">
                    <span className="font-bold">You Receive:</span>
                    <span className="font-bold text-secondary">
                      ${result.finalAmount}
                    </span>
                  </div>
                </div>

                {result.explanation && (
                  <div className="mb-4 p-2 win98-inset">
                    <p className="text-xs">
                      {result.explanation}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={scrollToClaims}
                  className="btn-accent w-full text-xs"
                >
                  Submit Your Claim Now
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
