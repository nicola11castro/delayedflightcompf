import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang, useDynamicT } from "@/i18n";
import { COMPENSATION_TABLE, type CarrierSize, type DelayBand } from "@shared/appr";

interface LookupResponse {
  configured: boolean;
  found: boolean;
  flightIata: string;
  airlineName?: string;
  airlineIata?: string;
  carrierSize?: CarrierSize;
  departureIata?: string;
  departureAirport?: string;
  arrivalIata?: string;
  arrivalAirport?: string;
  status?: string;
  delayMinutes?: number | null;
  delayBand?: DelayBand | null;
}

/** Fired so the claim form can prefill itself (see claim-form.tsx). */
export interface ClaimPrefill {
  flightNumber?: string;
  flightDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  delayDuration?: string;
  passengerName?: string;
  issueType?: string;
}

export function prefillClaimForm(prefill: ClaimPrefill) {
  window.dispatchEvent(new CustomEvent<ClaimPrefill>("prefillClaim", { detail: prefill }));
  document.getElementById("claims")?.scrollIntoView({ behavior: "smooth" });
}

export function FlightCheck() {
  const { t } = useLang();
  const dt = useDynamicT();
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");

  const lookup = useMutation({
    mutationFn: async (): Promise<LookupResponse> => {
      const params = new URLSearchParams({ flightNumber, date });
      const response = await fetch(`/api/flights/lookup?${params}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || t("check.invalid"));
      return body;
    },
  });

  const result = lookup.data;
  const canCheck = flightNumber.trim().length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const start = () => {
    prefillClaimForm({
      flightNumber: result?.flightIata ?? flightNumber.trim().toUpperCase(),
      flightDate: date,
      departureAirport: result?.departureIata ? `${result.departureAirport ?? ""} (${result.departureIata})`.trim() : undefined,
      arrivalAirport: result?.arrivalIata ? `${result.arrivalAirport ?? ""} (${result.arrivalIata})`.trim() : undefined,
      delayDuration: result?.delayBand ?? undefined,
      issueType: result?.status === "cancelled" ? "cancelled" : "delayed",
    });
  };

  const sizeLabel = (size?: CarrierSize) => (size === "small" ? t("check.sizeSmall") : t("check.sizeLarge"));
  const range = (size?: CarrierSize) => {
    const table = COMPENSATION_TABLE[size ?? "large"];
    return `$${table["3-6"]}–$${table["9+"]}`;
  };
  const delayHours = result?.delayMinutes != null ? `${Math.floor(result.delayMinutes / 60)}h${String(result.delayMinutes % 60).padStart(2, "0")}` : t("check.delayUnknown");

  return (
    <div className="win98-panel">
      <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><Plane className="h-4 w-4" />{t("check.title")}</h3>
      <p className="text-xs text-muted-foreground mb-3">{t("check.lead")}</p>
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs font-bold mb-1">{t("check.flightNumber")}</label>
          <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder={t("check.flightNumberPlaceholder")} className="win98-inset text-xs" autoCapitalize="characters" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">{t("check.date")}</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="win98-inset text-xs" max={new Date().toISOString().slice(0, 10)} />
        </div>
        <Button className="btn-accent" onClick={() => lookup.mutate()} disabled={!canCheck || lookup.isPending}>
          <Search className="h-4 w-4 mr-1" />
          {lookup.isPending ? t("check.checking") : t("check.button")}
        </Button>
      </div>
      {lookup.isError && <p className="text-xs text-destructive mt-2">{lookup.error.message}</p>}

      {result && (
        <div className="win98-inset mt-3 p-3 text-xs space-y-2">
          {result.found ? (
            <>
              <div className="font-bold">{t("check.foundTitle")}</div>
              <div className="grid sm:grid-cols-2 gap-1">
                <div><strong>{t("check.airline")}:</strong> {result.airlineName ?? result.airlineIata}</div>
                <div><strong>{t("check.route")}:</strong> {result.departureIata} → {result.arrivalIata}</div>
                <div><strong>{t("check.status")}:</strong> {result.status}</div>
                <div><strong>{t("check.delay")}:</strong> {delayHours}</div>
              </div>
              <p>
                {result.delayBand
                  ? t("check.eligibleBand", { band: dt("band", result.delayBand), amount: `$${COMPENSATION_TABLE[result.carrierSize ?? "large"][result.delayBand]}` })
                  : result.delayMinutes != null
                    ? t("check.underThreshold")
                    : t("check.carrierOnly", { airline: result.airlineName ?? result.flightIata, size: sizeLabel(result.carrierSize), range: range(result.carrierSize) })}
              </p>
            </>
          ) : (
            <>
              <p>{result.configured ? t("check.notFound") : t("check.offline")}</p>
              {result.airlineName && <p>{t("check.carrierOnly", { airline: result.airlineName, size: sizeLabel(result.carrierSize), range: range(result.carrierSize) })}</p>}
            </>
          )}
          <Button className="btn-primary text-xs w-full sm:w-auto" onClick={start}>
            {result.found ? t("check.start") : t("check.startManual")} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
