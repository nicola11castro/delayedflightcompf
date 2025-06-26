import { AlertTriangle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApprValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  delayReason: string;
}

export function ApprValidationModal({ isOpen, onClose, delayReason }: ApprValidationModalProps) {
  const getReasonMessage = (reason: string): string => {
    switch (reason) {
      case "weather":
        return "Weather conditions are considered extraordinary circumstances under APPR and are not eligible for compensation.";
      case "atc":
        return "Air Traffic Control restrictions are outside airline control and not eligible for compensation.";
      case "security":
        return "Security incidents are extraordinary circumstances not covered by APPR compensation.";
      case "airport_failure":
        return "Airport operational issues are outside airline control and not eligible for compensation.";
      case "safety_maintenance":
        return "Safety-related maintenance is required by law and not eligible for compensation under APPR.";
      case "third_party_strikes":
        return "Third-party strikes are extraordinary circumstances outside airline control.";
      case "government_delays":
        return "Government or regulatory delays are outside airline control and not compensable.";
      case "medical_emergencies":
        return "Medical emergencies are extraordinary circumstances not covered by APPR.";
      case "cyberattacks":
        return "Cyberattacks are extraordinary circumstances outside normal airline operations.";
      default:
        return "This delay reason is not eligible for compensation under Canadian APPR regulations.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="win98-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            APPR Eligibility Notice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="win98-inset p-3">
            <p className="text-xs text-foreground leading-relaxed">
              {getReasonMessage(delayReason)}
            </p>
          </div>
          
          <div className="win98-inset p-3 bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="text-xs font-bold mb-2 text-yellow-800 dark:text-yellow-200">
              Alternative Options:
            </h4>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Check if your flight qualifies under Montreal Convention (international flights)</li>
              <li>• Contact your airline directly for goodwill compensation</li>
              <li>• Review your travel insurance policy for coverage</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={onClose}
              className="btn-primary text-xs"
            >
              I Understand
            </Button>
            
            <Button
              variant="outline"
              className="btn-secondary text-xs"
              onClick={() => window.open('/appr-guide', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Learn More About APPR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}