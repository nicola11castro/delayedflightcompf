import { AlertTriangle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

interface ApprValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  delayReason: string;
  /** When provided, shows a "submit anyway" button so the team can verify the airline's stated reason. */
  onProceed?: () => void;
}

const REASONS_WITH_MESSAGE = [
  "weather", "atc", "security", "airport_failure", "safety_maintenance",
  "third_party_strikes", "government_delays", "medical_emergencies", "cyberattacks",
];

export function ApprValidationModal({ isOpen, onClose, delayReason, onProceed }: ApprValidationModalProps) {
  const { t } = useLang();
  const messageKey = (REASONS_WITH_MESSAGE.includes(delayReason) ? `appr.msg.${delayReason}` : "appr.msg.default") as TranslationKey;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="win98-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            {t("appr.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="win98-inset p-3">
            <p className="text-xs text-foreground leading-relaxed">{t(messageKey)}</p>
          </div>

          <div className="win98-inset p-3 bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="text-xs font-bold mb-2 text-yellow-800 dark:text-yellow-200">{t("appr.alternatives")}</h4>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• {t("appr.alt1")}</li>
              <li>• {t("appr.alt2")}</li>
              <li>• {t("appr.alt3")}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            {onProceed && (
              <>
                <Button onClick={onProceed} className="btn-accent text-xs">
                  {t("appr.submitAnyway")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">{t("appr.submitAnywayHelp")}</p>
              </>
            )}
            <Button onClick={onClose} className="btn-primary text-xs">
              {t("appr.understand")}
            </Button>
            <Button variant="outline" className="btn-secondary text-xs" onClick={() => window.open("/appr-guide", "_blank")}>
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("appr.learnMore")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
