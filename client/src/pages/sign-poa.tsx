import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/signature-pad";
import { ConsentModal } from "@/components/consent-modal";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n";
import { PenTool, Download, CheckCircle } from "lucide-react";

interface PoaInfo {
  claimId: string;
  passengerName: string;
  email: string;
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  compensationAmount?: string | null;
  commissionAmount?: string | null;
  poaSigned: boolean | null;
  poaSignedAt?: string | null;
}

export default function SignPoa() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/sign/:claimId");
  const claimId = params?.claimId ? decodeURIComponent(params.claimId) : "";
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  const [signature, setSignature] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [done, setDone] = useState(false);

  const { data: info, isLoading, error } = useQuery<PoaInfo>({
    queryKey: [`/api/claims/${encodeURIComponent(claimId)}/poa${tokenQuery}`],
    enabled: !!claimId,
  });

  const sign = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/claims/${encodeURIComponent(claimId)}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, signature, typedName, agreed }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || t("sign.failed"));
      return body;
    },
    onSuccess: () => {
      setDone(true);
      toast({ title: t("sign.done") });
      queryClient.invalidateQueries({ queryKey: ["/api/my-claims"] });
    },
    onError: (err: Error) => toast({ title: t("sign.failed"), description: err.message, variant: "destructive" }),
  });

  const downloadUrl = `/api/claims/${encodeURIComponent(claimId)}/poa.pdf${tokenQuery}`;
  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const money = (value?: string | null) => (value ? `$${Number(value).toFixed(0)} CAD` : "—");
  const canSign = !!signature && typedName.trim().length >= 2 && agreed && !sign.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="win98-panel">
          <h1 className="text-xl font-bold flex items-center gap-2"><PenTool className="h-5 w-5" />{t("sign.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sign.lead")}</p>
        </div>

        {isLoading ? (
          <p className="text-sm">{t("common.loading")}</p>
        ) : error || !info ? (
          <div className="win98-panel text-sm space-y-3">
            <p>{t("sign.invalid")}</p>
            <Link href="/my-claims" className="underline">{t("sign.backToClaims")}</Link>
          </div>
        ) : (
          <>
            <div className="win98-panel text-sm grid sm:grid-cols-2 gap-2">
              <div><strong>{t("sign.claim")}:</strong> <span className="font-mono">{info.claimId}</span></div>
              <div><strong>{t("sign.flight")}:</strong> {info.flightNumber} · {info.flightDate}<br />{info.departureAirport} → {info.arrivalAirport}</div>
              <div><strong>{t("sign.estimate")}:</strong> {money(info.compensationAmount)}</div>
              <div><strong>{t("sign.commission")}:</strong> {money(info.commissionAmount)}</div>
            </div>

            {info.poaSigned || done ? (
              <div className="win98-panel text-sm space-y-3">
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />
                  {done ? t("sign.done") : t("sign.alreadySigned", { date: info.poaSignedAt ? new Date(info.poaSignedAt).toLocaleDateString(locale) : "" })}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <a href={downloadUrl} target="_blank" rel="noreferrer"><Button className="btn-primary text-xs"><Download className="h-3 w-3 mr-1" />{t("sign.download")}</Button></a>
                  <Link href="/my-claims"><Button variant="outline" className="btn-outline text-xs">{t("sign.backToClaims")}</Button></Link>
                </div>
              </div>
            ) : (
              <div className="win98-panel space-y-4">
                <Button type="button" variant="link" className="p-0 h-auto underline text-sm" onClick={() => setShowDoc(true)}>{t("sign.readDoc")}</Button>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("sign.draw")}</label>
                  <SignaturePad onChange={setSignature} clearLabel={t("sign.clear")} />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t("sign.typedName")}</label>
                  <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder={info.passengerName} className="win98-input" autoComplete="name" />
                </div>

                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <Checkbox checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" />
                  <span>{t("sign.agree")}</span>
                </label>

                <Button className="btn-primary w-full" disabled={!canSign} onClick={() => (signature ? sign.mutate() : toast({ title: t("sign.needSignature"), variant: "destructive" }))}>
                  <PenTool className="h-4 w-4 mr-2" />
                  {sign.isPending ? t("sign.signing") : t("sign.button")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {showDoc && <ConsentModal isOpen onClose={() => setShowDoc(false)} documentType="poa" />}
      <Footer />
    </div>
  );
}
