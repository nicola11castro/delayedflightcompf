/**
 * Intake triage: the questions the APPR actually turns on, scored into a tier
 * so the team only takes mandates with a real chance of payment, and the
 * passenger gets an honest recommendation. Shared by the form and the server.
 */
import { COMPENSATION_TABLE, DENIED_BOARDING_TABLE, type CarrierSize, type DelayBand, type IssueType, getReasonStatus } from "./appr";

export const TRIAGE_VERSION = 1;

export interface TriageAnswers {
  ticketType: "paid" | "points" | "free_staff";
  noticeTiming: "at_airport" | "under_14_days" | "over_14_days" | "not_told";
  outcome: "rebooked_same" | "rebooked_other" | "refund" | "still_travelled_late";
  reasonSource: "written" | "verbal" | "not_told";
  deniedVoluntary?: "involuntary" | "volunteered";
  presentedOnTime?: boolean;
  priorClaim: "none" | "waiting" | "denied" | "paid";
  priorDenialReason?: string;
  settlement: "none" | "voucher" | "cash";
  partySize: number;
  hasBoardingPass: boolean;
  hasWrittenReason: boolean;
  hasArrivalProof: boolean;
}

export type TriageTier = "strong" | "medium" | "weak" | "ineligible";

export interface TriageResult {
  version: number;
  score: number;
  tier: TriageTier;
  recommendedPath: "managed" | "kit" | "none";
  /** machine-readable reason codes, translated in the UI */
  reasons: string[];
  gates: string[];
  perPassenger: number;
  partySize: number;
  partyTotal: number;
  refundRule: boolean;
}

export const TRIAGE_DEFAULTS: TriageAnswers = {
  ticketType: "paid",
  noticeTiming: "at_airport",
  outcome: "rebooked_same",
  reasonSource: "verbal",
  priorClaim: "none",
  settlement: "none",
  partySize: 1,
  hasBoardingPass: true,
  hasWrittenReason: false,
  hasArrivalProof: false,
};

export function parseTriage(raw: unknown): TriageAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pick = <T extends string>(value: unknown, allowed: T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
  const bool = (value: unknown) => value === true || value === "true";
  const size = Number(r.partySize);
  return {
    ticketType: pick(r.ticketType, ["paid", "points", "free_staff"], "paid"),
    noticeTiming: pick(r.noticeTiming, ["at_airport", "under_14_days", "over_14_days", "not_told"], "at_airport"),
    outcome: pick(r.outcome, ["rebooked_same", "rebooked_other", "refund", "still_travelled_late"], "rebooked_same"),
    reasonSource: pick(r.reasonSource, ["written", "verbal", "not_told"], "verbal"),
    deniedVoluntary: r.deniedVoluntary ? pick<"involuntary" | "volunteered">(r.deniedVoluntary, ["involuntary", "volunteered"], "involuntary") : undefined,
    presentedOnTime: r.presentedOnTime === undefined ? undefined : bool(r.presentedOnTime),
    priorClaim: pick(r.priorClaim, ["none", "waiting", "denied", "paid"], "none"),
    priorDenialReason: typeof r.priorDenialReason === "string" ? r.priorDenialReason.slice(0, 500) : undefined,
    settlement: pick(r.settlement, ["none", "voucher", "cash"], "none"),
    partySize: Number.isInteger(size) && size >= 1 && size <= 9 ? size : 1,
    hasBoardingPass: bool(r.hasBoardingPass),
    hasWrittenReason: bool(r.hasWrittenReason),
    hasArrivalProof: bool(r.hasArrivalProof),
  };
}

export interface TriageContext {
  issueType: IssueType;
  carrierSize: CarrierSize;
  carrierKnown: boolean;
  delayDuration: DelayBand | null;
  delayReason?: string | null;
  /** from the flight-data provider when available */
  providerMismatch?: boolean | null;
}

export function scoreTriage(answers: TriageAnswers, ctx: TriageContext): TriageResult {
  const gates: string[] = [];
  const reasons: string[] = [];
  let score = 100;
  const denied = ctx.issueType === "denied-boarding";

  // Hard gates
  if (answers.ticketType === "free_staff") gates.push("gate.free_ticket");
  if (answers.noticeTiming === "over_14_days") gates.push("gate.notice_14_days");
  if (denied && answers.deniedVoluntary === "volunteered") gates.push("gate.volunteered");
  if (denied && answers.presentedOnTime === false) gates.push("gate.not_presented");
  if (answers.priorClaim === "paid" || answers.settlement === "cash") gates.push("gate.already_paid");
  if (!denied && answers.outcome !== "refund" && !ctx.delayDuration) gates.push("gate.under_3h");

  // Amount
  const refundRule = !denied && answers.outcome === "refund";
  let perPassenger = 0;
  if (gates.length === 0) {
    if (denied) perPassenger = ctx.delayDuration ? DENIED_BOARDING_TABLE[ctx.delayDuration] : DENIED_BOARDING_TABLE["0-3"];
    else if (refundRule) perPassenger = COMPENSATION_TABLE[ctx.carrierSize]["3-6"];
    else if (ctx.delayDuration) perPassenger = COMPENSATION_TABLE[ctx.carrierSize][ctx.delayDuration];
  }
  if (refundRule) reasons.push("amount.refund_rule");
  if (answers.partySize > 1) reasons.push("amount.party");

  // Odds
  const reasonStatus = getReasonStatus(ctx.delayReason);
  if (reasonStatus === "inadmissible") { score -= 45; reasons.push("odds.reason_inadmissible"); }
  else if (reasonStatus === "unknown") { score -= 20; reasons.push("odds.reason_unknown"); }
  else reasons.push("odds.reason_admissible");

  if (answers.reasonSource === "not_told") { score -= 5; reasons.push("odds.airline_silent"); }
  if (answers.reasonSource === "written" || answers.hasWrittenReason) { score += 10; reasons.push("odds.written_reason"); }
  if (!answers.hasBoardingPass) { score -= 15; reasons.push("odds.no_boarding_pass"); }
  if (!answers.hasArrivalProof) { score -= 10; reasons.push("odds.no_arrival_proof"); }
  if (answers.settlement === "voucher") { score -= 15; reasons.push("odds.voucher_accepted"); }
  if (answers.priorClaim === "denied") {
    if (reasonStatus === "admissible") { score += 5; reasons.push("odds.denied_but_admissible"); }
    else { score -= 10; reasons.push("odds.denied_contested"); }
  }
  if (answers.priorClaim === "waiting") reasons.push("odds.waiting_airline");
  if (!ctx.carrierKnown) { score -= 5; reasons.push("odds.carrier_unknown"); }
  if (ctx.providerMismatch === true) { score -= 20; reasons.push("odds.provider_mismatch"); }
  if (ctx.providerMismatch === false) { score += 5; reasons.push("odds.provider_match"); }

  score = Math.max(0, Math.min(100, score));
  let tier: TriageTier = gates.length ? "ineligible" : score >= 75 ? "strong" : score >= 50 ? "medium" : "weak";
  if (gates.length) score = 0;
  const recommendedPath = tier === "ineligible" ? "none" : tier === "weak" ? "kit" : "managed";

  return {
    version: TRIAGE_VERSION,
    score,
    tier,
    recommendedPath,
    reasons,
    gates,
    perPassenger,
    partySize: answers.partySize,
    partyTotal: perPassenger * answers.partySize,
    refundRule,
  };
}
