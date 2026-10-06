/**
 * Canadian APPR (Air Passenger Protection Regulations) reference data and
 * compensation rules shared by the client and the server.
 *
 * Keeping this in one place means the calculator, the claim form, the APPR
 * guide page and the server-side compensation estimate all agree.
 */

export interface DelayReason {
  value: string;
  label: string;
  /** true = within airline control and not safety-related (compensable) */
  valid: boolean;
}

export const delayReasons: DelayReason[] = [
  { value: "maintenance_non_safety", label: "Maintenance Issues (Non-Safety)", valid: true },
  { value: "crew_scheduling", label: "Crew Scheduling Problems", valid: true },
  { value: "overbooking", label: "Overbooking or Boarding Issues", valid: true },
  { value: "operational_decisions", label: "Operational Decisions", valid: true },
  { value: "it_failure", label: "IT System Failures", valid: true },
  { value: "ground_handling", label: "Ground Handling Delays", valid: true },
  { value: "fueling_deicing", label: "Fueling or De-Icing Delays (Non-Weather)", valid: true },
  { value: "weather", label: "Weather Conditions", valid: false },
  { value: "atc", label: "Air Traffic Control (ATC) Restrictions", valid: false },
  { value: "security", label: "Security Incidents", valid: false },
  { value: "airport_failure", label: "Airport Operational Issues", valid: false },
  { value: "safety_maintenance", label: "Safety-Related Maintenance", valid: false },
  { value: "third_party_strikes", label: "Third-Party Strikes", valid: false },
  { value: "government_delays", label: "Government or Regulatory Delays", valid: false },
  { value: "medical_emergencies", label: "Medical Emergencies", valid: false },
  { value: "cyberattacks", label: "Cyberattacks", valid: false },
];

export type CarrierSize = "large" | "small";
export type DelayBand = "3-6" | "6-9" | "9+";

export const DELAY_BANDS: { value: DelayBand; label: string; minHours: number }[] = [
  { value: "3-6", label: "3–6 hours", minHours: 3 },
  { value: "6-9", label: "6–9 hours", minHours: 6 },
  { value: "9+", label: "9+ hours", minHours: 9 },
];

/** CAD amounts set by the APPR for large (2M+ passengers/yr) and small carriers. */
export const COMPENSATION_TABLE: Record<CarrierSize, Record<DelayBand, number>> = {
  large: { "3-6": 400, "6-9": 700, "9+": 1000 },
  small: { "3-6": 125, "6-9": 250, "9+": 500 },
};

export const COMMISSION_RATE = 0.15;

export interface AirlineCompensation {
  short: number; // 3-6 hours
  medium: number; // 6-9 hours
  long: number; // 9+ hours
}

export interface Airline {
  name: string;
  code?: string;
  category: CarrierSize;
  compensation: AirlineCompensation;
}

const largeAirlineCompensation: AirlineCompensation = { short: 400, medium: 700, long: 1000 };
const smallAirlineCompensation: AirlineCompensation = { short: 125, medium: 250, long: 500 };

export const airlines: Airline[] = [
  // Large carriers
  { name: "Air Canada", code: "AC", category: "large", compensation: largeAirlineCompensation },
  { name: "Air Canada Express", code: "QK", category: "large", compensation: largeAirlineCompensation },
  { name: "Air Canada Rouge", code: "RV", category: "large", compensation: largeAirlineCompensation },
  { name: "WestJet", code: "WS", category: "large", compensation: largeAirlineCompensation },
  { name: "WestJet Encore", code: "WR", category: "large", compensation: largeAirlineCompensation },
  { name: "American Airlines", code: "AA", category: "large", compensation: largeAirlineCompensation },
  { name: "United Airlines", code: "UA", category: "large", compensation: largeAirlineCompensation },
  { name: "Delta Airlines", code: "DL", category: "large", compensation: largeAirlineCompensation },
  { name: "British Airways", code: "BA", category: "large", compensation: largeAirlineCompensation },
  { name: "Lufthansa", code: "LH", category: "large", compensation: largeAirlineCompensation },
  { name: "Air France", code: "AF", category: "large", compensation: largeAirlineCompensation },
  { name: "Japan Airlines", code: "JL", category: "large", compensation: largeAirlineCompensation },

  // Small carriers
  { name: "Porter Airlines", code: "PD", category: "small", compensation: smallAirlineCompensation },
  { name: "Flair Airlines", code: "F8", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Transat", code: "TS", category: "small", compensation: smallAirlineCompensation },
  { name: "Air North", code: "4N", category: "small", compensation: smallAirlineCompensation },
  { name: "Canadian North", code: "5T", category: "small", compensation: smallAirlineCompensation },
  { name: "Pacific Coastal Airlines", code: "8P", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Inuit", code: "3H", category: "small", compensation: smallAirlineCompensation },
  { name: "Central Mountain Air", code: "9M", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Borealis", category: "small", compensation: smallAirlineCompensation },
  { name: "Rise Air", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Creebec", code: "YN", category: "small", compensation: smallAirlineCompensation },
  { name: "Max Aviation", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Saint-Pierre", code: "PJ", category: "small", compensation: smallAirlineCompensation },
  { name: "North Wright Airways", category: "small", compensation: smallAirlineCompensation },
];

export function getAirlineByName(name: string): Airline | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return airlines.find(
    (airline) =>
      airline.name.toLowerCase().includes(needle) ||
      airline.code?.toLowerCase() === needle,
  );
}

/** "AC 123", "ac123", "WS-456" → the airline whose IATA code starts the flight number. */
export function getAirlineByFlightNumber(flightNumber: string): Airline | undefined {
  const match = flightNumber.trim().toUpperCase().match(/^([A-Z0-9]{2})\s*-?\s*\d/);
  if (!match) return undefined;
  return airlines.find((airline) => airline.code === match[1]);
}

export function getDelayReasonValidity(reason: string): boolean {
  const delayReason = delayReasons.find((dr) => dr.value === reason);
  return delayReason?.valid ?? false;
}

export function delayBandFromHours(hours: number): DelayBand | null {
  if (hours >= 9) return "9+";
  if (hours >= 6) return "6-9";
  if (hours >= 3) return "3-6";
  return null;
}

export function isDelayBand(value: unknown): value is DelayBand {
  return DELAY_BANDS.some((band) => band.value === value);
}

/** "$25", "25.50 CAD", "none" → numeric CAD amount (0 when absent). */
export function parseMealVoucherAmount(input?: string | null): number {
  if (!input) return 0;
  const text = String(input).trim().toLowerCase();
  if (!text || ["none", "no", "n/a", "na", "0"].includes(text)) return 0;
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
  return match ? parseFloat(match[1].replace(",", ".")) : 0;
}

export interface CompensationEstimate {
  eligible: boolean;
  carrierSize: CarrierSize;
  /** false when we could not identify the airline and assumed a large carrier */
  carrierKnown: boolean;
  airlineName?: string;
  delayDuration: DelayBand | null;
  baseAmount: number;
  mealVoucherDeduction: number;
  compensationAmount: number;
  commissionAmount: number;
  finalAmount: number;
  reason: string;
}

export interface CompensationInput {
  carrierSize?: CarrierSize;
  flightNumber?: string | null;
  airlineName?: string | null;
  delayDuration: string | null | undefined;
  delayReason?: string | null;
  mealVouchers?: string | null;
}

/**
 * Deterministic APPR estimate. This is the single source of truth for the
 * dollar figures shown in the calculator, stored on a claim and emailed to
 * the passenger.
 */
export function estimateCompensation(input: CompensationInput): CompensationEstimate {
  const airline = input.flightNumber
    ? getAirlineByFlightNumber(input.flightNumber)
    : input.airlineName
      ? getAirlineByName(input.airlineName)
      : undefined;

  const carrierKnown = !!input.carrierSize || !!airline;
  const carrierSize: CarrierSize = input.carrierSize ?? airline?.category ?? "large";
  const band = isDelayBand(input.delayDuration) ? input.delayDuration : null;
  const reasonValid = input.delayReason ? getDelayReasonValidity(input.delayReason) : true;

  let reason: string;
  let baseAmount = 0;
  if (!band) {
    reason = "Delays under 3 hours are not compensable under the APPR.";
  } else if (!reasonValid) {
    reason = "This delay reason is outside airline control or safety-related, so no APPR compensation applies.";
  } else {
    baseAmount = COMPENSATION_TABLE[carrierSize][band];
    const carrierLabel = carrierSize === "large" ? "large carrier" : "small carrier";
    reason = airline
      ? `${airline.name} is a ${carrierLabel}; a ${band} hour delay within airline control is compensable.`
      : carrierKnown
        ? `A ${band} hour delay on a ${carrierLabel} within airline control is compensable.`
        : `Airline not recognised from the flight number; estimate assumes a large carrier for a ${band} hour delay.`;
  }

  const mealVoucherDeduction = baseAmount > 0 ? parseMealVoucherAmount(input.mealVouchers) : 0;
  const compensationAmount = Math.max(0, baseAmount - mealVoucherDeduction);
  const commissionAmount = Math.round(compensationAmount * COMMISSION_RATE);
  const finalAmount = compensationAmount - commissionAmount;

  return {
    eligible: baseAmount > 0,
    carrierSize,
    carrierKnown,
    airlineName: airline?.name,
    delayDuration: band,
    baseAmount,
    mealVoucherDeduction,
    compensationAmount,
    commissionAmount,
    finalAmount,
    reason,
  };
}

/** Legacy helper kept for the assistant tips: airline name + raw hours. */
export function calculateCompensation(
  airlineName: string,
  delayHours: number,
  delayReason?: string,
): { amount: number; eligible: boolean; reason: string } {
  const airline = getAirlineByName(airlineName);
  if (!airline) {
    return { amount: 0, eligible: false, reason: "Airline not found in our database" };
  }
  if (delayReason && !getDelayReasonValidity(delayReason)) {
    return { amount: 0, eligible: false, reason: "Delay reason is considered extraordinary circumstances" };
  }
  const band = delayBandFromHours(delayHours);
  if (!band) {
    return { amount: 0, eligible: false, reason: "Delay must be at least 3 hours for compensation eligibility" };
  }
  return {
    amount: COMPENSATION_TABLE[airline.category][band],
    eligible: true,
    reason: `Eligible for compensation under ${airline.category} airline rules`,
  };
}
