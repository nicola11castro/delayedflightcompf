import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { airlines, delayReasons, DELAY_BANDS, getDelayReasonValidity, type CompensationEstimate } from "@shared/appr";
import { ApprValidationModal } from "./appr-validation-modal";

interface CalculationResult extends CompensationEstimate {
  explanation?: string;
}

const OTHER_LARGE = "other-large";
const OTHER_SMALL = "other-small";

const largeAirlines = airlines.filter((airline) => airline.category === "large");
const smallAirlines = airlines.filter((airline) => airline.category === "small");

export function CommissionCalculator() {
  const [airline, setAirline] = useState<string>("");
  const [delayDuration, setDelayDuration] = useState<string>("");
  const [delayReason, setDelayReason] = useState<string>("");
  const [mealVouchers, setMealVouchers] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showApprModal, setShowApprModal] = useState<boolean>(false);

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      airline?: string;
      carrierSize?: "large" | "small";
      delayDuration: string;
      delayReason: string;
      mealVouchers: string;
    }): Promise<CalculationResult> => {
      const response = await apiRequest("POST", "/api/calculate-compensation", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const canCalculate = !!airline && !!delayDuration && !!delayReason;

  const handleCalculate = () => {
    if (!canCalculate) return;

    // APPR validation - check if delay reason is admissible
    if (!getDelayReasonValidity(delayReason)) {
      setShowApprModal(true);
      return;
    }

    calculateMutation.mutate({
      airline: airline === OTHER_LARGE || airline === OTHER_SMALL ? undefined : airline,
      carrierSize: airline === OTHER_LARGE ? "large" : airline === OTHER_SMALL ? "small" : undefined,
      delayDuration,
      delayReason,
      mealVouchers,
    });
  };

  const scrollToClaims = () => {
    const element = document.getElementById("claims");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
            See exactly what you'll receive after our 15% commission fee. Amounts follow Canada's APPR: they depend
            on the airline's size and how long you were delayed.
          </p>
        </div>

        <div className="win98-panel">
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="text-sm font-bold mb-4">Calculate Your Compensation</h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Airline *</label>
                  <Select value={airline} onValueChange={setAirline}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select your airline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Large airlines ($400 – $1,000)</SelectLabel>
                        {largeAirlines.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_LARGE}>Other large airline</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Small airlines ($125 – $500)</SelectLabel>
                        {smallAirlines.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_SMALL}>Other small airline</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Delay at Arrival *</label>
                  <Select value={delayDuration} onValueChange={setDelayDuration}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select delay duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_BANDS.map((band) => (
                        <SelectItem key={band.value} value={band.value}>
                          {band.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Delay Reason *</label>
                  <Select value={delayReason} onValueChange={setDelayReason}>
                    <SelectTrigger className="win98-inset text-xs">
                      <SelectValue placeholder="Select delay reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {delayReasons.map((reason) => (
                        <SelectItem
                          key={reason.value}
                          value={reason.value}
                          className={!reason.valid ? "text-red-600 dark:text-red-400" : ""}
                        >
                          {reason.label} {!reason.valid && "❌"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Meal Vouchers Received</label>
                  <Input
                    value={mealVouchers}
                    onChange={(e) => setMealVouchers(e.target.value)}
                    placeholder="e.g., $15 or None"
                    className="win98-inset text-xs"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    If you received meal vouchers, specify the amount in CAD. Otherwise leave blank.
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending || !canCalculate}
                className="btn-primary"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {calculateMutation.isPending ? "Calculating..." : "Calculate Compensation"}
              </Button>
              {calculateMutation.isError && (
                <p className="text-xs text-destructive mt-2">{calculateMutation.error.message}</p>
              )}
            </div>

            {result && (
              <div className="win98-panel">
                <h4 className="text-sm font-bold mb-4">Your Compensation Breakdown</h4>

                {!result.eligible ? (
                  <div className="mb-4 p-2 win98-inset">
                    <p className="text-xs">{result.reason}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span>APPR compensation ({result.airlineName ?? `${result.carrierSize} carrier`}):</span>
                        <span className="font-bold">${result.baseAmount}</span>
                      </div>
                      {result.mealVoucherDeduction > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span>Meal vouchers already received:</span>
                          <span className="font-bold">-${result.mealVoucherDeduction}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span>Total Compensation:</span>
                        <span className="font-bold">${result.compensationAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Our Commission (15%):</span>
                        <span className="font-bold text-accent">${result.commissionAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-2 win98-inset">
                        <span className="font-bold">You Receive:</span>
                        <span className="font-bold text-secondary">${result.finalAmount}</span>
                      </div>
                    </div>

                    {result.explanation && (
                      <div className="mb-4 p-2 win98-inset">
                        <p className="text-xs">{result.explanation}</p>
                      </div>
                    )}

                    <Button onClick={scrollToClaims} className="btn-accent w-full text-xs">
                      Submit Your Claim Now
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* APPR Validation Modal */}
      <ApprValidationModal
        isOpen={showApprModal}
        onClose={() => setShowApprModal(false)}
        delayReason={delayReason}
      />
    </section>
  );
}
