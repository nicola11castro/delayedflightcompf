import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLang, useDynamicT } from "@/i18n";
import { apiRequest } from "@/lib/queryClient";
import { getStatusIcon } from "@/components/claim-status";
import type { Claim } from "@shared/schema";
import { FolderOpen, MailWarning, Plus } from "lucide-react";

export default function MyClaims() {
  const { t, lang } = useLang();
  const dt = useDynamicT();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading: claimsLoading } = useQuery<Claim[]>({
    queryKey: ["/api/my-claims"],
    enabled: isAuthenticated,
  });

  const resend = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/verify-email/request")).json(),
    onSuccess: () => toast({ title: t("my.resent") }),
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  // Landing here from the verification link
  useEffect(() => {
    const verified = new URLSearchParams(window.location.search).get("verified");
    if (verified === "1") {
      toast({ title: t("my.verifiedToast") });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.history.replaceState({}, "", "/my-claims");
    }
  }, [toast, t, queryClient]);

  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const formatDate = (value?: Date | string | null) => (value ? new Date(value).toLocaleDateString(locale) : "");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="win98-panel">
          <h1 className="text-xl font-bold flex items-center gap-2"><FolderOpen className="h-5 w-5" />{t("my.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("my.lead")}</p>
        </div>

        {isLoading ? (
          <p className="text-sm">{t("common.loading")}</p>
        ) : !isAuthenticated ? (
          <div className="win98-panel text-sm">
            <Link href="/login" className="underline">{t("auth.signIn")}</Link>
          </div>
        ) : (
          <>
            {user && !user.emailVerified && (
              <div className="win98-inset p-3 bg-yellow-50 dark:bg-yellow-900/20 text-sm flex flex-wrap items-center gap-3">
                <MailWarning className="h-4 w-4 text-yellow-700" />
                <span className="flex-1">{t("my.verifyBanner")}</span>
                <Button size="sm" className="win98-button text-xs" onClick={() => resend.mutate()} disabled={resend.isPending}>
                  {t("my.resend")}
                </Button>
              </div>
            )}

            {claimsLoading ? (
              <p className="text-sm">{t("common.loading")}</p>
            ) : claims.length === 0 ? (
              <div className="win98-panel text-sm space-y-3">
                <p>{t("my.none")}</p>
                <Link href="/#claims"><Button className="btn-primary text-xs"><Plus className="h-3 w-3 mr-1" />{t("my.newClaim")}</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => {
                  const compensation = claim.compensationAmount ? Number(claim.compensationAmount) : 0;
                  const needsReview = claim.eligibilityValidation?.needsReview;
                  return (
                    <div key={claim.id} className="win98-panel space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm">{claim.claimId}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(claim.status)}
                          <Badge variant="outline">{dt("status.label", claim.status)}</Badge>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2 text-xs">
                        <div><strong>{t("my.flight")}:</strong> {claim.flightNumber} · {claim.flightDate}<br />{claim.departureAirport} → {claim.arrivalAirport}</div>
                        <div><strong>{t("my.submittedOn")}:</strong> {formatDate(claim.createdAt)}<br />{dt("issue", claim.issueType)}</div>
                        <div>
                          <strong>{t("my.estimate")}:</strong> {compensation > 0 ? `$${compensation.toFixed(0)} CAD` : "—"}
                          {needsReview && <><br /><span className="text-muted-foreground">{t("my.pendingReview")}</span></>}
                        </div>
                      </div>
                      {(claim.documentsUrls?.length ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">{t("my.documents", { n: claim.documentsUrls!.length })}</p>
                      )}
                      <div className="win98-inset p-2 text-xs">
                        <strong>{t("my.history")}</strong>
                        <ul className="mt-1 space-y-1">
                          {(claim.statusHistory ?? []).map((entry, index) => (
                            <li key={index}>{formatDate(entry.timestamp)} · {dt("status.label", entry.status)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
                <Link href="/#claims"><Button className="btn-primary text-xs"><Plus className="h-3 w-3 mr-1" />{t("my.newClaim")}</Button></Link>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
