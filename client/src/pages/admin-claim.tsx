import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CLAIM_STATUSES, type Claim, type ClaimEvent } from "@shared/schema";
import { delayReasons } from "@shared/appr";
import { ArrowLeft, Mail, FileText, PenTool, CreditCard, AlertTriangle, Send, StickyNote } from "lucide-react";

interface FlightCase { cause?: string | null; causeStatus?: string | null; notes?: string | null; updatedBy?: string | null; updatedAt?: string }
interface ClaimDetail extends Claim {
  events: ClaimEvent[];
  lifecycle: { airlineResponseDays: number; daysLeft: number | null; overdue: boolean; canEscalate: boolean };
  poaSignUrl: string | null;
  flightCase: FlightCase | null;
  flightKey: string;
}

const EVENT_ICON: Record<string, string> = {
  note: "📝", email: "✉️", status: "🔁", letter: "📨", escalation: "⚖️", poa: "✍️", payment: "💳", system: "⚙️",
};

export default function AdminClaim() {
  const [, params] = useRoute("/admin/claims/:id");
  const id = Number(params?.id);
  const { isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [ctaRef, setCtaRef] = useState("");
  const [escalationPath, setEscalationPath] = useState<"cta" | "small_claims">("small_claims");
  const [refusalReason, setRefusalReason] = useState("");
  const [fc, setFc] = useState<{ cause: string; causeStatus: string; notes: string } | null>(null);

  const key = [`/api/admin/claims/${id}`];
  const { data: claim, isLoading, error } = useQuery<ClaimDetail>({ queryKey: key, enabled: isAdmin && Number.isInteger(id) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
  };
  const run = (label: string) => ({
    onSuccess: (data: { message?: string }) => { toast({ title: label, description: data?.message }); refresh(); },
    onError: (err: Error) => toast({ title: `${label} failed`, description: err.message, variant: "destructive" }),
  });

  const addNote = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/admin/claims/${id}/notes`, { message: note })).json(), ...run("Note added"), onSuccess: () => { setNote(""); refresh(); } });
  const changeStatus = useMutation({ mutationFn: async () => (await apiRequest("PATCH", `/api/admin/claims/${id}/status`, { status, notes: statusNote || undefined })).json(), ...run("Status updated"), onSuccess: () => { setStatus(""); setStatusNote(""); refresh(); } });
  const emailAirline = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/admin/claims/${id}/email-airline`)).json(), ...run("Claim letter") });
  const escalate = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/admin/claims/${id}/escalate`, { path: escalationPath, reference: ctaRef || undefined })).json(), ...run("Escalation") });
  const refused = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/admin/claims/${id}/refused`, { reason: refusalReason || undefined })).json(), ...run("Refusal recorded"), onSuccess: () => { setRefusalReason(""); refresh(); } });
  const saveFlightCase = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/admin/flights/${claim!.flightKey}`, { flightNumber: claim!.flightNumber, flightDate: claim!.flightDate, ...fc })).json(),
    ...run("Flight investigation saved"),
  });
  const invoice = useMutation({ mutationFn: async () => (await apiRequest("POST", `/api/admin/claims/${id}/payment-link`)).json(), ...run("Invoice") });

  if (authLoading) return <div className="p-6 text-sm">Checking your session...</div>;
  if (!isAdmin) return <div className="p-6 text-sm">Admin access required. <Link href="/login" className="underline">Sign in</Link></div>;
  if (isLoading) return <div className="p-6 text-sm">Loading claim...</div>;
  if (error || !claim) return <div className="p-6 text-sm">Claim not found. <Link href="/admin" className="underline">Back</Link></div>;

  const money = (v?: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
  const date = (v?: Date | string | null) => (v ? new Date(v).toLocaleString("en-CA") : "—");
  const reasonLabel = delayReasons.find((r) => r.value === claim.delayReason)?.label ?? claim.delayReason;
  const closed = ["approved", "rejected", "paid"].includes(claim.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="win98-title-bar flex justify-between items-center">
        <span>DelayedFlightComp - Claim {claim.claimId}</span>
        <Link href="/admin" className="underline text-xs"><ArrowLeft className="inline h-3 w-3" /> Dashboard</Link>
      </div>

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="win98-panel flex flex-wrap justify-between gap-4">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">{claim.claimId}</span>
              <Badge variant="outline">{claim.status}</Badge>
              {claim.eligibilityValidation?.needsReview && <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Needs review</Badge>}
              {claim.lifecycle.overdue && <Badge variant="destructive">Airline overdue</Badge>}
            </div>
            <div>{claim.passengerName} · <a href={`mailto:${claim.email}`} className="underline">{claim.email}</a> · {claim.language?.toUpperCase()}</div>
            <div>{claim.flightNumber} on {claim.flightDate} · {claim.departureAirport} → {claim.arrivalAirport} · {claim.issueType} · {claim.delayDuration}h</div>
            <div>Reason: {reasonLabel}{claim.mealVouchers ? ` · Vouchers: ${claim.mealVouchers}` : ""}</div>
            <div className="text-xs text-muted-foreground">{claim.eligibilityValidation?.reason}</div>
          </div>
          <div className="text-sm space-y-1 text-right">
            <div>Compensation <strong>{money(claim.compensationAmount)}</strong></div>
            <div>Commission <strong>{money(claim.commissionAmount)}</strong></div>
            <div>Submitted {date(claim.createdAt)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Lifecycle + actions */}
          <div className="space-y-4">
            <div className="win98-panel text-sm space-y-2">
              <h3 className="font-bold">Lifecycle</h3>
              <div>Sent to airline: {date(claim.airlineContactedAt)}</div>
              <div>
                Airline deadline: {date(claim.airlineDeadlineAt)}
                {claim.lifecycle.daysLeft !== null && !closed && !claim.ctaFiledAt && (
                  <span className={claim.lifecycle.overdue ? "text-destructive font-bold" : ""}> ({claim.lifecycle.overdue ? `${-claim.lifecycle.daysLeft} days overdue` : `${claim.lifecycle.daysLeft} days left`})</span>
                )}
              </div>
              <div>CTA complaint: {date(claim.ctaFiledAt)}</div>
              <div>Airline refused: {date(claim.airlineRefusedAt)}</div>
              <div>Small claims filed: {date(claim.smallClaimsFiledAt)}</div>
              <div>Service level: <Badge variant="secondary">{claim.serviceLevel ?? "managed"}</Badge>{claim.kitPaidAt ? ` · kit paid ${date(claim.kitPaidAt)}` : ""}</div>
              <div className="flex flex-col gap-2 pt-2">
                <Button size="sm" className="win98-button text-xs justify-start" onClick={() => emailAirline.mutate()} disabled={emailAirline.isPending || closed}>
                  <Mail className="h-3 w-3 mr-2" />{claim.airlineContactedAt ? "Re-send claim letter to airline" : "Send claim letter to airline"}
                </Button>
                {!claim.airlineRefusedAt && !closed && (
                  <div className="flex gap-2">
                    <Input value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)} placeholder="Airline's stated reason (optional)" className="win98-input text-xs" />
                    <Button size="sm" variant="outline" className="win98-button text-xs" onClick={() => refused.mutate()} disabled={refused.isPending}>Airline refused</Button>
                  </div>
                )}
                {!closed && (claim.airlineRefusedAt || claim.lifecycle.canEscalate) && (
                  <div className="flex flex-col gap-2 win98-inset p-2">
                    <div className="flex gap-2 items-center">
                      <select className="win98-input text-xs" value={escalationPath} onChange={(e) => setEscalationPath(e.target.value as "cta" | "small_claims")}>
                        <option value="small_claims">Québec small claims (months)</option>
                        <option value="cta">CTA complaint (years)</option>
                      </select>
                      <Input value={ctaRef} onChange={(e) => setCtaRef(e.target.value)} placeholder="Reference (optional)" className="win98-input text-xs" />
                      <Button size="sm" variant="destructive" className="win98-button text-xs" onClick={() => escalate.mutate()} disabled={escalate.isPending || (escalationPath === "cta" ? !!claim.ctaFiledAt : !!claim.smallClaimsFiledAt)}>Record filing</Button>
                    </div>
                    <a href={`/api/claims/${encodeURIComponent(claim.claimId)}/small-claims.pdf`} target="_blank" rel="noreferrer" className="underline text-xs">Generate small-claims file (PDF)</a>
                  </div>
                )}
              </div>
            </div>

            <div className="win98-panel text-sm space-y-2">
              <h3 className="font-bold">Flight investigation ({claim.flightKey})</h3>
              <p className="text-xs text-muted-foreground">Shared with every passenger on this flight. <Link href="/admin#flights" className="underline">All flights</Link></p>
              {(() => { const current = fc ?? { cause: claim.flightCase?.cause ?? "", causeStatus: claim.flightCase?.causeStatus ?? "unknown", notes: claim.flightCase?.notes ?? "" }; return (
                <>
                  <select className="win98-input text-xs w-full" value={current.causeStatus} onChange={(e) => setFc({ ...current, causeStatus: e.target.value })}>
                    <option value="unknown">Cause unknown</option>
                    <option value="admissible">Within airline control (compensable)</option>
                    <option value="contested">Airline claims exemption, we contest</option>
                    <option value="inadmissible">Genuinely outside control</option>
                  </select>
                  <Input value={current.cause} onChange={(e) => setFc({ ...current, cause: e.target.value })} placeholder="What actually happened (one line)" className="win98-input text-xs" />
                  <textarea className="win98-input text-xs w-full min-h-[60px]" value={current.notes} onChange={(e) => setFc({ ...current, notes: e.target.value })} placeholder="Evidence, sources, airline statements, CTA decisions to cite" />
                  <Button size="sm" className="win98-button text-xs" onClick={() => { setFc(current); saveFlightCase.mutate(); }} disabled={saveFlightCase.isPending}>Save for all passengers on this flight</Button>
                  {claim.flightCase?.updatedBy && <p className="text-xs text-muted-foreground">Last updated by {claim.flightCase.updatedBy} {date(claim.flightCase.updatedAt)}</p>}
                </>
              ); })()}
            </div>

            {claim.flightData && (
              <div className="win98-panel text-sm space-y-1">
                <h3 className="font-bold">Flight data ({claim.flightData.provider})</h3>
                <div>{claim.flightData.airlineName} {claim.flightData.departureIata} → {claim.flightData.arrivalIata} · {claim.flightData.status}</div>
                <div>Scheduled arrival: {date(claim.flightData.scheduledArrival)}</div>
                <div>Actual arrival: {date(claim.flightData.actualArrival)}</div>
                <div>
                  Delay: {claim.flightData.delayMinutes != null ? `${Math.round(claim.flightData.delayMinutes / 6) / 10}h` : "unknown"} → band {claim.flightData.delayBand ?? "<3h"}
                  {claim.flightData.matchesReported === false && <Badge variant="destructive" className="ml-2">Differs from reported {claim.delayDuration}h</Badge>}
                  {claim.flightData.matchesReported === true && <Badge variant="default" className="ml-2">Matches</Badge>}
                </div>
              </div>
            )}

            <div className="win98-panel text-sm space-y-2">
              <h3 className="font-bold">Change status</h3>
              <select className="win98-input text-xs w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select new status...</option>
                {CLAIM_STATUSES.filter((s) => s !== claim.status).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Message to the passenger (optional)" className="win98-input text-xs" />
              <Button size="sm" className="win98-button text-xs" onClick={() => changeStatus.mutate()} disabled={!status || changeStatus.isPending}>
                <Send className="h-3 w-3 mr-2" />Update and email passenger
              </Button>
            </div>

            <div className="win98-panel text-sm space-y-2">
              <h3 className="font-bold">Documents</h3>
              {(claim.documentsUrls ?? []).length === 0 && !claim.poaSigned && <p className="text-xs text-muted-foreground">None uploaded</p>}
              {(claim.documentsUrls ?? []).map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block underline text-xs"><FileText className="inline h-3 w-3 mr-1" />Document {i + 1}</a>
              ))}
              <div className="pt-2">
                <div className="flex items-center gap-2"><PenTool className="h-3 w-3" />POA: {claim.poaSigned ? `signed ${date(claim.poaSignedAt)}` : "not signed"}</div>
                {claim.poaSigned && claim.poaDocumentUrl && <a href={claim.poaDocumentUrl} target="_blank" rel="noreferrer" className="underline text-xs">Open signed POA</a>}
                {!claim.poaSigned && claim.poaSignUrl && (
                  <div className="text-xs mt-1">Signing link: <input readOnly value={claim.poaSignUrl} className="win98-input text-xs w-full" onFocus={(e) => e.currentTarget.select()} /></div>
                )}
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2"><CreditCard className="h-3 w-3" />Commission: {claim.paymentStatus ?? "none"}{claim.paidAt ? ` (${date(claim.paidAt)})` : ""}</div>
                {claim.paymentLinkUrl && <a href={claim.paymentLinkUrl} target="_blank" rel="noreferrer" className="underline text-xs break-all">{claim.paymentLinkUrl}</a>}
                {claim.paymentStatus !== "paid" && claim.commissionAmount && (
                  <Button size="sm" className="win98-button text-xs mt-1" onClick={() => invoice.mutate()} disabled={invoice.isPending}>
                    {claim.paymentLinkUrl ? "Re-send invoice" : "Send commission invoice"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="win98-panel text-sm space-y-2">
              <h3 className="font-bold flex items-center gap-2"><StickyNote className="h-4 w-4" />Add a note</h3>
              <textarea className="win98-input text-xs w-full min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (not sent to the passenger)" />
              <Button size="sm" className="win98-button text-xs" onClick={() => addNote.mutate()} disabled={!note.trim() || addNote.isPending}>Save note</Button>
            </div>

            <div className="win98-panel text-sm">
              <h3 className="font-bold mb-2">Timeline</h3>
              <ul className="space-y-2">
                {claim.events.length === 0 && <li className="text-xs text-muted-foreground">No events yet</li>}
                {claim.events.map((event) => (
                  <li key={event.id} className="win98-inset p-2">
                    <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>{EVENT_ICON[event.type] ?? "•"} {event.type}{event.actorEmail ? ` · ${event.actorEmail}` : ""}</span>
                      <span>{date(event.createdAt)}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{event.message}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
