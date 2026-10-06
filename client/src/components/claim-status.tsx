import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useLang, useDynamicT } from "@/i18n";
import type { Claim } from "@shared/schema";

export function getStatusIcon(status: string) {
  switch (status) {
    case "submitted": return <Clock className="h-5 w-5 text-blue-500" />;
    case "under-review": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case "approved": return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
    case "paid": return <CheckCircle className="h-5 w-5 text-green-600" />;
    default: return <Clock className="h-5 w-5 text-gray-500" />;
  }
}

export function ClaimStatus() {
  const { t, lang } = useLang();
  const dt = useDynamicT();
  const [claimId, setClaimId] = useState("");
  const [searchClaimId, setSearchClaimId] = useState("");

  const { data: claim, isLoading, error } = useQuery<Claim | null>({
    queryKey: ["/api/claims/status", searchClaimId],
    queryFn: async () => {
      if (!searchClaimId) return null;
      const response = await apiRequest("GET", `/api/claims/status/${encodeURIComponent(searchClaimId)}`);
      return response.json();
    },
    enabled: !!searchClaimId,
  });

  const handleSearch = () => {
    if (claimId.trim()) setSearchClaimId(claimId.trim());
  };

  const compensation = claim?.compensationAmount ? Number(claim.compensationAmount) : 0;
  const commission = claim?.commissionAmount ? Number(claim.commissionAmount) : 0;

  return (
    <section id="claim-status" className="py-12 bg-muted">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="win98-panel mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            <Search className="inline-block w-4 h-4 mr-2" />
            {t("status.heading")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("status.help")}</p>
        </div>

        <div className="win98-panel">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t("status.placeholder")}
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="win98-inset text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!claimId.trim() || isLoading} className="btn-primary text-xs">
                <Search className="w-3 h-3 mr-1" />
                {isLoading ? t("status.searching") : t("status.search")}
              </Button>
            </div>

            {error && (
              <div className="p-3 win98-inset bg-destructive/10">
                <p className="text-xs text-destructive">{t("status.notFound")}</p>
              </div>
            )}

            {claim && (
              <div className="space-y-4">
                <div className="win98-panel">
                  <h3 className="text-sm font-bold mb-3">{t("status.details")}</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span>{t("status.claimId")}</span><span className="font-mono">{claim.claimId}</span></div>
                    <div className="flex justify-between"><span>{t("status.passenger")}</span><span>{claim.passengerName}</span></div>
                    <div className="flex justify-between items-center">
                      <span>{t("status.status")}</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(claim.status)}
                        <span className="font-bold">{dt("status.label", claim.status)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("status.submittedOn")}</span>
                      <span>{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA") : ""}</span>
                    </div>
                    {compensation > 0 && (
                      <>
                        <div className="flex justify-between"><span>{t("status.compensation")}</span><span className="font-bold">${compensation.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>{t("status.commission")}</span><span className="font-bold text-accent">${commission.toFixed(2)}</span></div>
                        <div className="flex justify-between p-2 win98-inset">
                          <span className="font-bold">{t("status.youReceive")}</span>
                          <span className="font-bold text-secondary">${(compensation - commission).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="win98-panel">
                  <h4 className="text-xs font-bold mb-2">{t("status.nextSteps")}</h4>
                  <p className="text-xs text-muted-foreground">{dt("status.msg", claim.status)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
