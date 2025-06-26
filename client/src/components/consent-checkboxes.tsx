import { useState } from "react";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ConsentModal, CONSENT_DOCUMENTS } from "./consent-modal";
import { ExternalLink } from "lucide-react";

interface ConsentCheckboxesProps {
  form: any;
  type: "registration" | "claim";
  showPreAgreedNotice?: boolean;
}

export function ConsentCheckboxes({ form, type, showPreAgreedNotice }: ConsentCheckboxesProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (documentType: string) => {
    setActiveModal(documentType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  if (type === "registration") {
    return (
      <div className="space-y-4">
        <div className="win98-panel p-4">
          <h3 className="font-bold text-sm mb-3">Required Consents</h3>
          
          {/* Terms of Service */}
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                <FormControl>
                  <Checkbox 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I agree to the{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm underline"
                      onClick={() => openModal("terms")}
                    >
                      Terms of Service
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                    {" "}*
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Privacy Policy */}
          <FormField
            control={form.control}
            name="privacyAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                <FormControl>
                  <Checkbox 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I agree to the{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm underline"
                      onClick={() => openModal("privacy")}
                    >
                      Privacy Policy
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                    {" "}*
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Data Retention Consent */}
          <FormField
            control={form.control}
            name="dataRetentionAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                <FormControl>
                  <Checkbox 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I acknowledge{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm underline"
                      onClick={() => openModal("dataRetention")}
                    >
                      Data Retention Policy
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                    {" "}*
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Email Marketing Consent (Optional) */}
          <FormField
            control={form.control}
            name="emailMarketingConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I consent to{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm underline"
                      onClick={() => openModal("emailMarketing")}
                    >
                      Email Marketing
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                    {" "}(Optional)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <ConsentModal
          isOpen={activeModal === "terms"}
          onClose={closeModal}
          title="Terms of Service"
          content={CONSENT_DOCUMENTS.terms}
        />
        <ConsentModal
          isOpen={activeModal === "privacy"}
          onClose={closeModal}
          title="Privacy Policy"
          content={CONSENT_DOCUMENTS.privacy}
        />
        <ConsentModal
          isOpen={activeModal === "dataRetention"}
          onClose={closeModal}
          title="Data Retention Policy"
          content={CONSENT_DOCUMENTS.dataRetention}
        />
        <ConsentModal
          isOpen={activeModal === "emailMarketing"}
          onClose={closeModal}
          title="Email Marketing Consent"
          content={CONSENT_DOCUMENTS.emailMarketing}
        />
      </div>
    );
  }

  // Claim submission consents
  return (
    <div className="space-y-4">
      {showPreAgreedNotice && (
        <div className="win98-inset p-3 bg-muted text-sm">
          <p>✓ You have already agreed to our Terms of Service, Privacy Policy, and Data Retention Policy during registration.</p>
        </div>
      )}

      <div className="win98-panel p-4">
        <h3 className="font-bold text-sm mb-3">Claim-Specific Consents</h3>
        
        {/* Power of Attorney Consent (Required) */}
        <FormField
          control={form.control}
          name="poaConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-3">
              <FormControl>
                <Checkbox 
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  I grant{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm underline"
                    onClick={() => openModal("poa")}
                  >
                    Power of Attorney
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                  {" "}to process my claim *
                </FormLabel>
                <p className="text-xs text-muted-foreground">Required to proceed with your claim</p>
              </div>
            </FormItem>
          )}
        />

        {/* Email Marketing Consent for Claims (Optional) */}
        <FormField
          control={form.control}
          name="emailMarketingConsentClaim"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  I consent to{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm underline"
                    onClick={() => openModal("emailMarketing")}
                  >
                    Email Marketing
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                  {" "}(Optional)
                </FormLabel>
                <p className="text-xs text-muted-foreground">Updates about your claim and service improvements</p>
              </div>
            </FormItem>
          )}
        />
      </div>

      <ConsentModal
        isOpen={activeModal === "poa"}
        onClose={closeModal}
        title="Power of Attorney Agreement"
        content={CONSENT_DOCUMENTS.poa}
      />
      <ConsentModal
        isOpen={activeModal === "emailMarketing"}
        onClose={closeModal}
        title="Email Marketing Consent"
        content={CONSENT_DOCUMENTS.emailMarketing}
      />
    </div>
  );
}