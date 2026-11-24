import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n";
import { BookOpen, Download, Copy, Send, Clock, AlertTriangle, CheckCircle, Scale, Handshake, ExternalLink } from "lucide-react";

interface KitStatus {
  claimId: string;
  passengerName: string;
  flightNumber: string;
  flightDate: string;
  compensationAmount?: string | null;
  serviceLevel?: string | null;
  eligibility: { reason: string; needsReview?: boolean } | null;
  unlocked: boolean;
  requiresPayment: boolean;
  priceCents: number;
  paymentsConfigured: boolean;
  letter: { subject: string; body: string } | null;
  airlineContactedAt?: string | null;
  airlineDeadlineAt?: string | null;
  airlineRefusedAt?: string | null;
  filingLimit: string;
  documents: number;
  poaSigned?: boolean | null;
  poaSignUrl: string | null;
  paymentUrl?: string;
  status?: string;
}

export default function KitPage() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/kit/:claimId");
  const claimId = params?.claimId ? decodeURIComponent(params.claimId) : "";
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const tq = token ? `?token=${encodeURIComponent(token)}` : "";
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0, 10));

  const key = [`/api/claims/${encodeURIComponent(claimId)}/kit${tq}`];
  const { data: kit, isLoading, error } = useQuery<KitStatus>({ queryKey: key, enabled: !!claimId });

  useEffect(() => {
    const paid = new URLSearchParams(window.location.search).get("paid");
    if (paid === "1") toast({ title: t("kit.paidToast") });
    if (paid === "0") toast({ title: t("kit.paidCancelled"), variant: "destructive" });
    if (paid) window.history.replaceState({}, "", window.location.pathname + (token ? `?token=${token}` : ""));
  }, [toast, t, token]);

  const post = async (path: string, body: Record<string, unknown> = {}) => {
    const response = await fetch(`/api/claims/${encodeURIComponent(claimId)}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ token, ...body }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data as KitStatus;
  };

  const unlock = useMutation({
    mutationFn: () => post("/kit"),
    onSuccess: (data) => { if (data.paymentUrl) window.location.href = data.paymentUrl; else queryClient.setQueryData(key, data); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });
  const progress = useMutation({
    mutationFn: ({ step, date }: { step: "sent" | "refused" | "paid"; date?: string }) => post("/kit/progress", { step, date }),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(key, data);
      toast({ title: vars.step === "sent" ? t("kit.sentRecorded") : vars.step === "refused" ? t("kit.refusedRecorded") : t("kit.paidRecorded") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString(locale) : "");
  const daysLeft = kit?.airlineDeadlineAt ? Math.ceil((new Date(kit.airlineDeadlineAt).getTime() - Date.now()) / 86400000) : null;
  const price = kit ? (kit.priceCents > 0 ? `$${(kit.priceCents / 100).toFixed(2)} CAD` : t("choice.kitFree")) : "";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="win98-panel">
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5" />{t("kit.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("kit.lead")}</p>
        </div>

        {isLoading ? <p className="text-sm">{t("common.loading")}</p> : error || !kit ? (
          <div className="win98-panel text-sm"><p>{t("sign.invalid")}</p><Link href="/my-claims" className="underline">{t("sign.backToClaims")}</Link></div>
        ) : (
          <>
            <div className="win98-panel text-sm grid sm:grid-cols-2 gap-2">
              <div><strong>{t("sign.claim")}:</strong> <span className="font-mono">{kit.claimId}</span></div>
              <div><strong>{t("sign.flight")}:</strong> {kit.flightNumber} · {kit.flightDate}</div>
              <div><strong>{t("sign.estimate")}:</strong> {kit.compensationAmount ? `$${Number(kit.compensationAmount).toFixed(0)} CAD` : "—"}</div>
              <div><strong>{t("kit.filingLimit")}:</strong> {kit.filingLimit}</div>
              {kit.eligibility && <p className="sm:col-span-2 text-xs text-muted-foreground">{kit.eligibility.reason}</p>}
            </div>

            {!kit.unlocked ? (
              <div className="win98-panel space-y-3 text-sm">
                <p>{t("kit.locked")} <strong>{price}</strong></p>
                <p className="text-xs text-muted-foreground">{t("choice.kitLead")}</p>
                <Button className="btn-accent" onClick={() => unlock.mutate()} disabled={unlock.isPending}>{unlock.isPending ? t("kit.unlocking") : t("kit.unlock")}</Button>
              </div>
            ) : (
              <>
                {kit.serviceLevel !== "kit" && (
                  <div className="win98-panel text-sm">
                    <Button className="btn-accent" onClick={() => unlock.mutate()} disabled={unlock.isPending}>{unlock.isPending ? t("kit.unlocking") : t("choice.kitButton")}</Button>
                  </div>
                )}
                <a href={`/api/claims/${encodeURIComponent(claimId)}/kit.pdf${tq}`} target="_blank" rel="noreferrer">
                  <Button className="btn-primary w-full"><Download className="h-4 w-4 mr-2" />{t("kit.download")}</Button>
                </a>

                <section className="win98-panel space-y-2 text-sm">
                  <h2 className="font-bold">{t("kit.step1")}</h2>
                  <p className="text-xs">{t("kit.evidenceCount", { n: kit.documents })} · <Link href="/#claims" className="underline">{t("kit.addEvidence")}</Link></p>
                </section>

                {kit.letter && (
                  <section className="win98-panel space-y-2 text-sm">
                    <h2 className="font-bold flex items-center gap-2"><Send className="h-4 w-4" />{t("kit.step2")}</h2>
                    <p className="text-xs text-muted-foreground">{t("kit.letterHelp")}</p>
                    <div className="win98-inset p-3 text-xs whitespace-pre-wrap font-mono max-h-72 overflow-auto"><strong>{kit.letter.subject}</strong>{"\n\n"}{kit.letter.body}</div>
                    <div className="flex flex-wrap gap-2 items-end">
                      <Button size="sm" variant="outline" className="win98-button text-xs" onClick={() => { navigator.clipboard.writeText(`${kit.letter!.subject}\n\n${kit.letter!.body}`); toast({ title: t("kit.copied") }); }}>
                        <Copy className="h-3 w-3 mr-1" />{t("kit.copy")}
                      </Button>
                      {!kit.airlineContactedAt && (
                        <>
                          <label className="text-xs">{t("kit.sentOn")}</label>
                          <Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} className="win98-input text-xs w-40" max={new Date().toISOString().slice(0, 10)} />
                          <Button size="sm" className="btn-primary text-xs" onClick={() => progress.mutate({ step: "sent", date: sentDate })} disabled={progress.isPending}>{t("kit.markSent")}</Button>
                        </>
                      )}
                    </div>
                  </section>
                )}

                <section className="win98-panel space-y-2 text-sm">
                  <h2 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4" />{t("kit.step3")}</h2>
                  {kit.airlineContactedAt ? (
                    <>
                      <p>{t("kit.sentOn")} {fmt(kit.airlineContactedAt)} · {t("kit.deadline")} <strong>{fmt(kit.airlineDeadlineAt)}</strong>{" "}
                        {daysLeft !== null && (daysLeft >= 0 ? <span>({t("kit.daysLeft", { n: daysLeft })})</span> : <span className="text-destructive font-bold">({t("kit.overdue", { n: -daysLeft })})</span>)}
                      </p>
                      {kit.status !== "paid" && !kit.airlineRefusedAt && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" className="btn-primary text-xs" onClick={() => progress.mutate({ step: "paid" })} disabled={progress.isPending}><CheckCircle className="h-3 w-3 mr-1" />{t("kit.paid")}</Button>
                          <Button size="sm" variant="outline" className="win98-button text-xs" onClick={() => progress.mutate({ step: "refused" })} disabled={progress.isPending}><AlertTriangle className="h-3 w-3 mr-1" />{t("kit.refused")}</Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("kit.letterHelp")}</p>
                  )}
                </section>

                {(kit.airlineRefusedAt || (daysLeft !== null && daysLeft < 0)) && (
                  <section className="win98-panel space-y-3 text-sm">
                    <h2 className="font-bold">{t("kit.step4")}</h2>
                    <div className="win98-inset p-3 space-y-1">
                      <strong>{t("kit.optionCta")}</strong>
                      <p className="text-xs">{t("kit.optionCtaText")}</p>
                      <a href="https://rppa-appr.ca" target="_blank" rel="noreferrer" className="underline text-xs inline-flex items-center gap-1">{t("kit.optionCtaLink")} <ExternalLink className="h-3 w-3" /></a>
                    </div>
                    <div className="win98-inset p-3 space-y-2">
                      <strong className="flex items-center gap-2"><Scale className="h-4 w-4" />{t("kit.optionCourt")}</strong>
                      <p className="text-xs">{t("kit.optionCourtText")}</p>
                      <a href={`/api/claims/${encodeURIComponent(claimId)}/small-claims.pdf${tq}`} target="_blank" rel="noreferrer">
                        <Button size="sm" className="btn-accent text-xs"><Download className="h-3 w-3 mr-1" />{t("kit.optionCourtButton")}</Button>
                      </a>
                    </div>
                    {!kit.poaSigned && kit.poaSignUrl && (
                      <div className="win98-inset p-3 space-y-2">
                        <strong className="flex items-center gap-2"><Handshake className="h-4 w-4" />{t("kit.optionManaged")}</strong>
                        <p className="text-xs">{t("kit.optionManagedText")}</p>
                        <a href={kit.poaSignUrl}><Button size="sm" className="btn-primary text-xs">{t("choice.managedButton")}</Button></a>
                      </div>
                    )}
                  </section>
                )}
                <p className="text-xs text-muted-foreground">{t("kit.notLegal")}</p>
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
