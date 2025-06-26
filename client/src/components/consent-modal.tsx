import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function ConsentModal({ isOpen, onClose, title, content }: ConsentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] win98-panel">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] win98-inset p-4">
          <div className="whitespace-pre-wrap text-sm font-mono">
            {content}
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="btn-primary">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Consent document contents
export const CONSENT_DOCUMENTS = {
  terms: `Terms of Service
YUL Flight Delay Compensation Service

This agreement governs your use of the YUL Flight Delay Compensation Service.

1.1 Service Description
We assist in processing flight delay claims under Canada's Air Passenger Protection Regulations (APPR) for flights to, from, or within Canada, including those at Montreal-Pierre Elliott Trudeau International Airport (YUL).

1.2 Commission
A 15% commission (e.g., $105 on a $700 claim) is charged only on successful claims. You receive the remaining 85% (e.g., $595).

1.3 User Obligations
You must provide accurate information, including flight number, date, delay duration, delay reason, and boarding pass. Misrepresentation may result in claim rejection.

1.4 Limitations
Compensation is not guaranteed and depends on airline liability under APPR. We are not responsible for airline rejections or delays.

1.5 Dispute Resolution
Contact us at support@yulclaims.com. We respond within 48 hours, per Quebec's Consumer Protection Act.

1.6 Acceptance
By checking the box, you agree to these terms.`,

  privacy: `Privacy Policy
YUL Flight Delay Compensation Service

This policy outlines how we handle your personal information, per Canada's PIPEDA and Quebec's Law 25.

1.1 Data Collected
We collect: name, email, flight number, flight date, delay duration, delay reason, and boarding pass.

1.2 Usage
Data is used for claim processing, airline submissions, and email marketing (with consent).

1.3 Storage
Data is encrypted in our database and retained for 1 year, per APPR, even if you delete your account.

1.4 Sharing
Data is shared with airlines for claims and Mailchimp for email marketing (if consented). No other third-party sharing occurs.

1.5 User Rights
You may access, correct, or delete your data (except claims, per APPR). Contact support@yulclaims.com.

1.6 Acceptance
By checking the box, you agree to this policy.`,

  dataRetention: `Data Deletion Consent
YUL Flight Delay Compensation Service

This consent addresses data retention for APPR compliance.

1.1 Retention
Claim data (flight details, boarding pass) is retained for 1 year, per APPR, even if you delete your account.

1.2 User Rights
You may delete personal data (name, email), but claim data remains for regulatory purposes. Contact support@yulclaims.com.

1.3 Compliance
This complies with PIPEDA and Quebec's Law 25.

1.4 Acceptance
By checking the box, you acknowledge claim data retention.`,

  poa: `Power of Attorney Agreement
YUL Flight Delay Compensation Service

This agreement authorizes our service to act on your behalf for APPR delay claims.

1.1 Scope
We are authorized to submit claims, negotiate, and collect compensation for your specified flight delay at YUL.

1.2 Commission
We deduct a 15% commission (e.g., $105 on $700) and forward the remaining 85% (e.g., $595) to you.

1.3 Consent
You provide this authority via digital signature. You may revoke it with 7 days notice to support@yulclaims.com.

1.4 Compliance
This agreement complies with Quebec's Civil Code and Consumer Protection Act.

1.5 Acceptance
By checking the box, you grant this power of attorney.`,

  emailMarketing: `Email Marketing Consent
YUL Flight Delay Compensation Service

This consent allows us to send you promotional emails.

1.1 Scope
You agree to receive emails about YUL delay claims, updates, and offers via Mailchimp.

1.2 Opt-Out
Unsubscribe at any time via the link in our emails or by contacting support@yulclaims.com.

1.3 Compliance
This complies with Canada's Anti-Spam Legislation (CASL) and PIPEDA.

1.4 Acceptance
By checking the box, you consent to receive marketing emails.`
};