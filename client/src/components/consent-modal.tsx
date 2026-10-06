import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLang } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

export type ConsentDocumentType = "terms" | "privacy" | "dataRetention" | "poa" | "emailMarketing";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: ConsentDocumentType;
}

/** Shows a consent document in the current language. The text lives in the i18n dictionaries. */
export function ConsentModal({ isOpen, onClose, documentType }: ConsentModalProps) {
  const { t } = useLang();
  const title = t(`consent.docTitle.${documentType}` as TranslationKey);
  const content = t(`consent.doc.${documentType}` as TranslationKey);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] win98-panel">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] win98-inset p-4">
          <div className="whitespace-pre-wrap text-sm font-mono">{content}</div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="btn-primary">{t("consent.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
