import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FileText, Handshake, PenTool, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateClaimId } from "@/lib/claim-id";
import { insertClaimSchema } from "@shared/schema";
import { ConsentCheckboxes } from "./consent-checkboxes";
import { z } from "zod";

const claimFormSchema = insertClaimSchema.extend({
  commissionAgreement: z.boolean().refine((val) => val === true, {
    message: "You must agree to the commission structure to submit a claim",
  }),
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

export function ClaimForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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
      poaConsent: false,
      emailMarketingConsentClaim: false,
      commissionAgreement: false,
    },
  });

  const submitClaimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      const claimId = generateClaimId(data.email || '');
      
      // Create the claim data object with all required fields
      const claimData = {
        claimId,
        passengerName: data.passengerName,
        email: data.email,
        flightNumber: data.flightNumber,
        flightDate: data.flightDate,
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        issueType: data.issueType,
        delayDuration: data.delayDuration,
        delayReason: data.delayReason,
        poaRequested: data.poaRequested || false,
        poaConsent: data.poaConsent || false,
        emailMarketingConsentClaim: data.emailMarketingConsentClaim || false,
      };

      const formData = new FormData();
      
      // Append all claim data fields
      Object.entries(claimData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Append files
      uploadedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await fetch('/api/claims', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit claim');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Submitted Successfully",
        description: "We've received your claim and will begin processing it immediately.",
      });
      form.reset();
      setUploadedFiles([]);
      setCurrentStep(1);
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were rejected. Only PDF, PNG, and JPG files up to 10MB are allowed.",
        variant: "destructive",
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ClaimFormData) => {
    submitClaimMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      // Trigger Clippy context messages
      const event = new CustomEvent('clippyTrigger', { 
        detail: { trigger: `step-${currentStep + 1}`, context: 'claim-form' }
      });
      window.dispatchEvent(event);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const progress = (currentStep / 3) * 100;

  return (
    <section id="claims" className="py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            Submit Your Compensation Claim
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Simple 3-step process. We validate eligibility using AI and handle everything for just 15%.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-primary">Step {currentStep} of 3</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentStep === 1 && "Flight Details"}
                  {currentStep === 2 && "Supporting Documents"}
                  {currentStep === 3 && "Agreement & Submission"}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Flight Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="flightNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flight Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., WF 102" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="flightDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flight Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="departureAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Airport *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Toronto Pearson (YYZ)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="arrivalAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrival Airport *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Vancouver (YVR)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-inter font-semibold text-lg text-gray-900 dark:text-white mb-4">
                        Passenger Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="passengerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="As shown on boarding pass" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-inter font-semibold text-lg text-gray-900 dark:text-white mb-4">
                        Delay/Cancellation Details
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="issueType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What happened? *</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select issue type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="delayed">Flight Delayed</SelectItem>
                                    <SelectItem value="cancelled">Flight Cancelled</SelectItem>
                                    <SelectItem value="denied-boarding">Denied Boarding</SelectItem>
                                    <SelectItem value="missed-connection">Missed Connection</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="delayDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delay Duration *</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select delay duration" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3-6">3–6 hours</SelectItem>
                                    <SelectItem value="6-9">6–9 hours</SelectItem>
                                    <SelectItem value="9+">9+ hours</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="delayReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delay Reason *</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <SelectTrigger>
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
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: File Upload */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-inter font-semibold text-lg text-gray-900 dark:text-white mb-4">
                        Supporting Documents
                      </h3>
                      
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors duration-200">
                        <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          Upload boarding pass and any relevant documents
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                          PDF, PNG, or JPG files up to 10MB each
                        </p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button type="button" variant="outline" asChild>
                            <span className="cursor-pointer">Choose Files</span>
                          </Button>
                        </label>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Uploaded Files:</h4>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Consents and Agreements */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="commission-highlight">
                      <h4 className="font-inter font-semibold text-lg text-gray-900 dark:text-white mb-3">
                        <Handshake className="inline w-5 h-5 text-primary mr-2" />
                        Required Consents & Commission Agreement
                      </h4>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                          <strong>Our transparent fee structure:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                            15% commission only charged on successful claims
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                            No upfront fees or hidden costs
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                            Full legal support throughout the process
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                            Expert negotiation with airlines
                          </li>
                        </ul>
                      </div>

                      {/* Consent Checkboxes */}
                      <ConsentCheckboxes form={form} type="claim" showPreAgreedNotice={true} />

                      <FormField
                        control={form.control}
                        name="commissionAgreement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-primary/20 p-4 mt-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                                I agree to the 15% commission fee structure *
                              </FormLabel>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                This fee covers our service and is deducted from your compensation before transfer.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        className="btn-primary"
                        disabled={submitClaimMutation.isPending}
                      >
                        {submitClaimMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Submit Claim for Review
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
