import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { airlines, delayReasons, bandsForIssue, getReasonStatus, ISSUE_TYPES, type CompensationEstimate } from "@shared/appr";
import { ApprValidationModal } from "./appr-validation-modal";
import { useLang, useDynamicT } from "@/i18n";

interface CalculationResult extends CompensationEstimate {
  explanation?: string;
}

const OTHER_LARGE = "other-large";
const OTHER_SMALL = "other-small";

const largeAirlines = airlines.filter((airline) => airline.category === "large");
const smallAirlines = airlines.filter((airline) => airline.category === "small");

export function CommissionCalculator() {
  const { t } = useLang();
  const dt = useDynamicT();
  const [issueType, setIssueType] = useState<string>("delayed");
  const [airline, setAirline] = useState<string>("");
  const [delayDuration, setDelayDuration] = useState<string>("");
  const [delayReason, setDelayReason] = useState<string>("");
  const [mealVouchers, setMealVouchers] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showApprModal, setShowApprModal] = useState<boolean>(false);

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      issueType: string;
      airline?: string;
      carrierSize?: "large" | "small";
      delayDuration: string;
      delayReason: string;
      mealVouchers: string;
    }): Promise<CalculationResult> => {
      const response = await apiRequest("POST", "/api/calculate-compensation", data);
      return response.json();
    },
    onSuccess: (data) => setResult(data),
  });

  const bands = bandsForIssue(issueType);
  const canCalculate = !!airline && !!delayDuration && !!delayReason && bands.some((b) => b.value === delayDuration);

  const runCalculation = () => {
    calculateMutation.mutate({
      issueType,
      airline: airline === OTHER_LARGE || airline === OTHER_SMALL ? undefined : airline,
      carrierSize: airline === OTHER_LARGE ? "large" : airline === OTHER_SMALL ? "small" : undefined,
      delayDuration,
      delayReason,
      mealVouchers,
    });
  };

  const handleCalculate = () => {
    if (!canCalculate) return;
    if (getReasonStatus(delayReason) === "inadmissible") {
      setShowApprModal(true);
      return;
    }
    runCalculation();
  };

  const scrollToClaims = () => document.getElementById("claims")?.scrollIntoView({ behavior: "smooth" });

  const carrierLabel = result
    ? result.airlineName ?? (result.carrierSize === "large" ? t("calc.carrierLarge") : t("calc.carrierSmall"))
    : "";

  return (
    <section id="calculator" className="py-8 bg-muted">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            <Calculator className="inline-block w-4 h-4 mr-2" />
            {t("calc.title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("calc.lead")}</p>
        </div>

        <div className="win98-panel">
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="text-sm font-bold mb-4">{t("calc.heading")}</h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{t("calc.issue")}</label>
                  <Select value={issueType} onValueChange={(value) => { setIssueType(value); setDelayDuration(""); }}>
                    <SelectTrigger className="win98-inset text-xs"><SelectValue placeholder={t("calc.issuePlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{dt("issue", type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("calc.airline")}</label>
                  <Select value={airline} onValueChange={setAirline}>
                    <SelectTrigger className="win98-inset text-xs"><SelectValue placeholder={t("calc.airlinePlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("calc.largeGroup")}</SelectLabel>
                        {largeAirlines.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}
                        <SelectItem value={OTHER_LARGE}>{t("calc.otherLarge")}</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>{t("calc.smallGroup")}</SelectLabel>
                        {smallAirlines.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}
                        <SelectItem value={OTHER_SMALL}>{t("calc.otherSmall")}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("calc.delay")}</label>
                  <Select value={delayDuration} onValueChange={setDelayDuration}>
                    <SelectTrigger className="win98-inset text-xs"><SelectValue placeholder={t("calc.delayPlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      {bands.map((band) => <SelectItem key={band.value} value={band.value}>{dt("band", band.value)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("calc.reason")}</label>
                  <Select value={delayReason} onValueChange={setDelayReason}>
                    <SelectTrigger className="win98-inset text-xs"><SelectValue placeholder={t("calc.reasonPlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      {delayReasons.map((reason) => (
                        <SelectItem
                          key={reason.value}
                          value={reason.value}
                          className={!reason.valid ? "text-red-600 dark:text-red-400" : reason.status === "unknown" ? "font-bold" : ""}
                        >
                          {dt("reason", reason.value)} {!reason.valid && "❌"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("calc.vouchers")}</label>
                  <Input value={mealVouchers} onChange={(e) => setMealVouchers(e.target.value)} placeholder={t("calc.vouchersPlaceholder")} className="win98-inset text-xs" />
                  <div className="text-xs text-muted-foreground mt-1">{t("calc.vouchersHelp")}</div>
                </div>
              </div>

              <Button onClick={handleCalculate} disabled={calculateMutation.isPending || !canCalculate} className="btn-primary">
                <Calculator className="mr-2 h-4 w-4" />
                {calculateMutation.isPending ? t("calc.calculating") : t("calc.button")}
              </Button>
              {calculateMutation.isError && <p className="text-xs text-destructive mt-2">{calculateMutation.error.message}</p>}
            </div>

            {result && (
              <div className="win98-panel">
                <h4 className="text-sm font-bold mb-4">{t("calc.resultTitle")}</h4>

                {!result.eligible ? (
                  <div className="space-y-3">
                    <div className="p-2 win98-inset"><p className="text-xs">{result.reason}</p></div>
                    {result.reasonStatus === "inadmissible" && (
                      <>
                        <p className="text-xs text-muted-foreground">{t("calc.stillSubmit")}</p>
                        <Button onClick={scrollToClaims} className="btn-accent w-full text-xs">
                          {t("calc.submitNow")} <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span>{result.issueType === "denied-boarding" ? t("calc.deniedBoarding") : t("calc.appr", { carrier: carrierLabel })}:</span>
                        <span className="font-bold">${result.baseAmount}</span>
                      </div>
                      {result.mealVoucherDeduction > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span>{t("calc.voucherDeduct")}:</span>
                          <span className="font-bold">-${result.mealVoucherDeduction}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span>{t("calc.total")}:</span>
                        <span className="font-bold">${result.compensationAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>{t("calc.commission")}:</span>
                        <span className="font-bold text-accent">${result.commissionAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-2 win98-inset">
                        <span className="font-bold">{t("calc.youReceive")}:</span>
                        <span className="font-bold text-secondary">${result.finalAmount}</span>
                      </div>
                    </div>

                    {result.needsReview && <p className="text-xs text-muted-foreground mb-3">{t("calc.reviewNote")}</p>}
                    {result.explanation && <div className="mb-4 p-2 win98-inset"><p className="text-xs">{result.explanation}</p></div>}

                    <Button onClick={scrollToClaims} className="btn-accent w-full text-xs">
                      {t("calc.submitNow")} <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ApprValidationModal
        isOpen={showApprModal}
        onClose={() => setShowApprModal(false)}
        delayReason={delayReason}
        onProceed={() => { setShowApprModal(false); runCalculation(); }}
      />
    </section>
  );
}
