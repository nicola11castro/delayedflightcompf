import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface CalculationResult {
  compensationAmount: number;
  commissionAmount: number;
  finalAmount: number;
  explanation?: string;
}

export function CommissionCalculator() {
  const [distance, setDistance] = useState<string>("");
  const [delayDuration, setDelayDuration] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: { distance: string; delayDuration: number }) => {
      const response = await apiRequest('POST', '/api/calculate-compensation', data);
      return response.json();
    },
    onSuccess: (data: CalculationResult) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    if (!distance || !delayDuration) {
      alert('Please select both distance and delay duration');
      return;
    }

    const delayHours = parseInt(delayDuration);
    calculateMutation.mutate({ distance, delayDuration: delayHours });
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
                    Flight Distance
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delay Duration
                  </label>
                  <Select value={delayDuration} onValueChange={setDelayDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3-6 hours</SelectItem>
                      <SelectItem value="6">6-9 hours</SelectItem>
                      <SelectItem value="9">9+ hours or cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="btn-primary"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {calculateMutation.isPending ? "Calculating..." : "Calculate Compensation"}
              </Button>
            </div>

            {result && (
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <h4 className="font-inter font-semibold text-lg text-gray-900 dark:text-white mb-4">
                    Your Compensation Breakdown
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">Total Compensation:</span>
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">
                        ${result.compensationAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">Our Commission (15%):</span>
                      <span className="font-semibold text-accent">
                        ${result.commissionAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-secondary/10 rounded-lg px-3">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">You Receive:</span>
                      <span className="font-bold text-xl text-secondary">
                        ${result.finalAmount}
                      </span>
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {result.explanation}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <Button 
                      onClick={scrollToClaims}
                      className="btn-accent w-full"
                    >
                      Submit Your Claim Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
