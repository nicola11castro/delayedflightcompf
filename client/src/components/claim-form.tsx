import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FileText, Handshake, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLang, useDynamicT } from "@/i18n";
import { insertClaimSchema } from "@shared/schema";
import { ConsentCheckboxes } from "./consent-checkboxes";
import { delayReasons, bandsForIssue, getReasonStatus, ISSUE_TYPES } from "@shared/appr";
import { ApprValidationModal } from "./appr-validation-modal";
import { z } from "zod";

const claimFormSchema = insertClaimSchema.extend({
  allClaimConsentsAccepted: z.boolean().refine((val) => val === true, { message: "claim.consentRequired" }),
  commissionAgreement: z.boolean().refine((val) => val === true, { message: "claim.commissionRequired" }),
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

interface SubmittedClaim {
  claimId: string;
  compensationAmount?: string | null;
  estimate?: { needsReview?: boolean };
}

export function ClaimForm() {
  const { t, lang } = useLang();
  const dt = useDynamicT();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showApprModal, setShowApprModal] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<SubmittedClaim | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      passengerName: "",
      email: "",
      flightNumber: "",
      flightDate: "",
      departureAirport: "",
      arrivalAirport: "",
      issueType: "delayed",
      delayDuration: "",
      delayReason: "",
      mealVouchers: "",
      poaRequested: false,
      allClaimConsentsAccepted: false,
      emailMarketingConsentClaim: false,
      commissionAgreement: false,
    },
  });

  // Prefill from the signed-in account (once), without overwriting what the user typed.
  useEffect(() => {
    if (!user || prefilled) return;
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    if (!form.getValues("passengerName") && name) form.setValue("passengerName", name);
    if (!form.getValues("email") && user.email) form.setValue("email", user.email);
    setPrefilled(true);
  }, [user, prefilled, form]);

  const issueType = form.watch("issueType");
  const bands = bandsForIssue(issueType);

  const submitClaimMutation = useMutation({
    mutationFn: async (data: ClaimFormData): Promise<SubmittedClaim> => {
      const claimData: Record<string, string | boolean> = {
        passengerName: data.passengerName,
        email: data.email,
        flightNumber: data.flightNumber,
        flightDate: data.flightDate,
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        issueType: data.issueType,
        delayDuration: data.delayDuration,
        delayReason: data.delayReason,
        mealVouchers: data.mealVouchers || "",
        poaRequested: data.poaRequested || false,
        poaConsent: data.allClaimConsentsAccepted,
        emailMarketingConsentClaim: data.emailMarketingConsentClaim || false,
        language: lang,
      };

      const formData = new FormData();
      Object.entries(claimData).forEach(([key, value]) => formData.append(key, String(value)));
      uploadedFiles.forEach((file) => formData.append("documents", file));

      const response = await fetch("/api/claims", { method: "POST", body: formData, credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || t("claim.failDesc"));
      return body;
    },
    onSuccess: (claim) => {
      setSubmittedClaim(claim);
      toast({ title: t("claim.successToast"), description: t("claim.successDesc", { id: claim.claimId }) });
      form.reset();
      setPrefilled(false);
      setUploadedFiles([]);
      setCurrentStep(1);
      queryClient.invalidateQueries({ queryKey: ["/api/my-claims"] });
    },
    onError: (error: Error) => {
      toast({ title: t("claim.failToast"), description: error.message || t("claim.failDesc"), variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type);
      return isValidType && file.size <= 10 * 1024 * 1024;
    });
    if (validFiles.length !== files.length) {
      toast({ title: t("claim.invalidFiles"), description: t("claim.invalidFilesDesc"), variant: "destructive" });
    }
    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    event.target.value = "";
  };

  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = (data: ClaimFormData) => {
    // Inadmissible reason: warn, but let the passenger submit for verification.
    if (getReasonStatus(data.delayReason) === "inadmissible") {
      setShowApprModal(true);
      return;
    }
    submitClaimMutation.mutate(data);
  };

  const step1Fields: (keyof ClaimFormData)[] = [
    "flightNumber", "flightDate", "departureAirport", "arrivalAirport",
    "passengerName", "email", "issueType", "delayDuration", "delayReason",
  ];

  const nextStep = async () => {
    if (currentStep === 1) {
      const valid = await form.trigger(step1Fields);
      if (!valid) return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.dispatchEvent(new CustomEvent("clippyTrigger", { detail: { trigger: `step-${currentStep + 1}`, context: "claim-form" } }));
    }
  };

  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);
  const progress = (currentStep / 3) * 100;
  const stepLabel = currentStep === 1 ? t("claim.step1") : currentStep === 2 ? t("claim.step2") : t("claim.step3");

  // Validation messages are stored as keys so they can be translated.
  const message = (msg?: string) => (msg && msg.includes(".") && !msg.includes(" ") ? dt("", msg, msg) : msg);

  return (
    <section id="claims" className="py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">{t("claim.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("claim.lead")}</p>
        </div>

        {submittedClaim && (
          <div className="win98-panel mb-6" role="status">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Check className="h-4 w-4 text-secondary" />
              {t("claim.received")}
            </h3>
            <p className="text-xs mb-2">{t("claim.saveId")}</p>
            <div className="win98-inset p-2 font-mono text-sm select-all">{submittedClaim.claimId}</div>
            {submittedClaim.compensationAmount && Number(submittedClaim.compensationAmount) > 0 && (
              <p className="text-xs mt-2">{t("claim.estimate", { amount: `$${Number(submittedClaim.compensationAmount).toFixed(0)}` })}</p>
            )}
            {submittedClaim.estimate?.needsReview && <p className="text-xs mt-1 text-muted-foreground">{t("claim.reviewPending")}</p>}
            <div className="flex gap-2 mt-3">
              <Button type="button" className="btn-primary text-xs" onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}>
                {t("claim.track")}
              </Button>
              <Button type="button" variant="outline" className="btn-outline text-xs" onClick={() => setSubmittedClaim(null)}>
                {t("claim.another")}
              </Button>
            </div>
          </div>
        )}

        <Card className="shadow-xl">
          <CardHeader>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-primary">{t("claim.step", { n: currentStep })}</span>
                <span className="text-sm text-muted-foreground">{stepLabel}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="flightNumber" render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>{t("claim.flightNumber")}</FormLabel>
                          <FormControl><Input placeholder={t("claim.flightNumberPlaceholder")} {...field} /></FormControl>
                          <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="flightDate" render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>{t("claim.flightDate")}</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="departureAirport" render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>{t("claim.departure")}</FormLabel>
                          <FormControl><Input placeholder={t("claim.departurePlaceholder")} {...field} /></FormControl>
                          <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="arrivalAirport" render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>{t("claim.arrival")}</FormLabel>
                          <FormControl><Input placeholder={t("claim.arrivalPlaceholder")} {...field} /></FormControl>
                          <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                        </FormItem>
                      )} />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-1">{t("claim.passengerInfo")}</h3>
                      {user && <p className="text-xs text-muted-foreground mb-3">{t("claim.prefilled")}</p>}
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="passengerName" render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("claim.fullName")}</FormLabel>
                            <FormControl><Input placeholder={t("claim.fullNamePlaceholder")} {...field} /></FormControl>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("claim.email")}</FormLabel>
                            <FormControl><Input type="email" placeholder={t("claim.emailPlaceholder")} {...field} /></FormControl>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-4">{t("claim.details")}</h3>
                      <div className="space-y-4">
                        <FormField control={form.control} name="issueType" render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("claim.whatHappened")}</FormLabel>
                            <FormControl>
                              <Select onValueChange={(value) => { field.onChange(value); form.setValue("delayDuration", ""); }} value={field.value}>
                                <SelectTrigger><SelectValue placeholder={t("claim.selectIssue")} /></SelectTrigger>
                                <SelectContent>
                                  {ISSUE_TYPES.map((type) => <SelectItem key={type} value={type}>{dt("issue", type)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="delayDuration" render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("claim.delayDuration")}</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger><SelectValue placeholder={t("claim.selectDelay")} /></SelectTrigger>
                                <SelectContent>
                                  {bands.map((band) => <SelectItem key={band.value} value={band.value}>{dt("band", band.value)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="delayReason" render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("claim.delayReason")}</FormLabel>
                            <FormControl>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                window.dispatchEvent(new CustomEvent("clippyTrigger", { detail: { context: "claim-form", data: { delayReason: value, flightNumber: form.getValues("flightNumber") } } }));
                              }} value={field.value || ""}>
                                <SelectTrigger><SelectValue placeholder={t("claim.selectReason")} /></SelectTrigger>
                                <SelectContent>
                                  {delayReasons.map((reason) => (
                                    <SelectItem key={reason.value} value={reason.value} className={!reason.valid ? "text-red-600 dark:text-red-400" : reason.status === "unknown" ? "font-bold" : ""}>
                                      {dt("reason", reason.value)} {!reason.valid && "❌"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">{t("claim.reasonHelp")}</p>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="mealVouchers" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("claim.vouchers")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("claim.vouchersPlaceholder")} className="win98-inset" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">{t("claim.vouchersHelp")}</p>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-lg">{t("claim.docs")}</h3>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors" style={{ borderColor: "hsl(var(--border))" }}>
                      <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="mb-2">{t("claim.uploadLead")}</p>
                      <p className="text-sm text-muted-foreground mb-4">{t("claim.uploadHelp")}</p>
                      <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="win98-button inline-block cursor-pointer text-sm px-4 py-2">
                        <FileText className="inline w-4 h-4 mr-2" />
                        {t("claim.chooseFiles")}
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t("claim.uploadedFiles")}</h4>
                        {uploadedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 win98-inset text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>{t("claim.remove")}</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="commission-highlight">
                      <h4 className="font-semibold text-lg mb-3">
                        <Handshake className="inline w-5 h-5 text-primary mr-2" />
                        {t("claim.consentsTitle")}
                      </h4>

                      <div className="win98-inset p-4 mb-4">
                        <p className="text-sm mb-3"><strong>{t("claim.feeTitle")}</strong></p>
                        <ul className="text-sm space-y-1">
                          {(["claim.fee1", "claim.fee2", "claim.fee3", "claim.fee4"] as const).map((key) => (
                            <li key={key} className="flex items-start">
                              <Check className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                              {t(key)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <ConsentCheckboxes form={form} type="claim" showPreAgreedNotice={!!user} />

                      <FormField control={form.control} name="commissionAgreement" render={({ field, fieldState }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-primary/20 p-4 mt-4">
                          <FormControl><Checkbox checked={field.value || false} onCheckedChange={field.onChange} /></FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">{t("claim.commissionAgree")}</FormLabel>
                            <p className="text-xs text-muted-foreground">{t("claim.commissionAgreeHelp")}</p>
                            <FormMessage>{message(fieldState.error?.message)}</FormMessage>
                          </div>
                        </FormItem>
                      )} />
                      {form.formState.errors.allClaimConsentsAccepted && (
                        <p className="text-xs text-destructive mt-2">{message(form.formState.errors.allClaimConsentsAccepted.message)}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>{t("claim.previous")}</Button>
                  )}
                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <Button type="button" onClick={nextStep}>{t("claim.next")}</Button>
                    ) : (
                      <Button type="submit" className="btn-primary" disabled={submitClaimMutation.isPending}>
                        {submitClaimMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("claim.submitting")}</>
                        ) : (
                          <><FileText className="mr-2 h-4 w-4" />{t("claim.submit")}</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <ApprValidationModal
          isOpen={showApprModal}
          onClose={() => setShowApprModal(false)}
          delayReason={form.watch("delayReason") || ""}
          onProceed={() => { setShowApprModal(false); submitClaimMutation.mutate(form.getValues()); }}
        />
      </div>
    </section>
  );
}
