import { useState } from "react";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ConsentModal, type ConsentDocumentType } from "./consent-modal";
import { ExternalLink } from "lucide-react";
import { useLang } from "@/i18n";

interface ConsentCheckboxesProps {
  form: any;
  type: "registration" | "claim";
  showPreAgreedNotice?: boolean;
}

export function ConsentCheckboxes({ form, type, showPreAgreedNotice }: ConsentCheckboxesProps) {
  const { t } = useLang();
  const [activeModal, setActiveModal] = useState<ConsentDocumentType | null>(null);

  const docLink = (doc: ConsentDocumentType, label: string, size = "text-xs") => (
    <Button type="button" variant="link" className={`p-0 h-auto ${size} underline`} onClick={() => setActiveModal(doc)}>
      {label}
      <ExternalLink className="ml-1 h-3 w-3" />
    </Button>
  );

  const marketingField = (name: string, help?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm">
              {t("consent.marketingPrefix")} {docLink("emailMarketing", t("consent.marketing"), "text-sm")} {t("consent.optional")}
            </FormLabel>
            {help && <p className="text-xs text-muted-foreground">{help}</p>}
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-4">
      {type === "claim" && showPreAgreedNotice && (
        <div className="win98-inset p-3 bg-muted text-sm">
          <p>{t("consent.preAgreed")}</p>
        </div>
      )}

      <div className="win98-panel p-4">
        <h3 className="font-bold text-sm mb-3">{type === "registration" ? t("consent.required") : t("consent.claimTitle")}</h3>

        <FormField
          control={form.control}
          name={type === "registration" ? "allConsentsAccepted" : "allClaimConsentsAccepted"}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-3">
              <FormControl>
                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">{t("consent.allAgree")}</FormLabel>
                <div className="flex flex-wrap gap-4 mt-2">
                  {type === "registration" ? (
                    <>
                      {docLink("terms", t("consent.terms"))}
                      {docLink("privacy", t("consent.privacy"))}
                      {docLink("dataRetention", t("consent.retention"))}
                    </>
                  ) : (
                    docLink("poa", t("consent.poa"))
                  )}
                </div>
                {type === "claim" && <p className="text-xs text-muted-foreground mt-1">{t("consent.poaRequired")}</p>}
              </div>
            </FormItem>
          )}
        />

        {type === "registration"
          ? marketingField("emailMarketingConsent")
          : marketingField("emailMarketingConsentClaim", t("consent.marketingHelp"))}
      </div>

      {activeModal && <ConsentModal isOpen onClose={() => setActiveModal(null)} documentType={activeModal} />}
    </div>
  );
}
