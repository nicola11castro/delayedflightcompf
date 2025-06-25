export interface DelayReason {
  value: string;
  label: string;
  valid: boolean;
}

export interface AirlineCompensation {
  short: number; // 3-6 hours
  medium: number; // 6-9 hours
  long: number; // 9+ hours
}

export interface Airline {
  name: string;
  code?: string;
  category: 'large' | 'small';
  compensation: AirlineCompensation;
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

// Large Airlines (2M+ passengers/year)
const largeAirlineCompensation: AirlineCompensation = {
  short: 400,  // 3-6 hours
  medium: 700, // 6-9 hours
  long: 1000   // 9+ hours
};

// Small Airlines (<2M passengers/year)
const smallAirlineCompensation: AirlineCompensation = {
  short: 125,  // 3-6 hours
  medium: 250, // 6-9 hours
  long: 500    // 9+ hours
};

export const airlines: Airline[] = [
  // Large Airlines
  { name: "Air Canada", code: "AC", category: "large", compensation: largeAirlineCompensation },
  { name: "Air Canada Express", category: "large", compensation: largeAirlineCompensation },
  { name: "Air Canada Rouge", category: "large", compensation: largeAirlineCompensation },
  { name: "WestJet", code: "WS", category: "large", compensation: largeAirlineCompensation },
  { name: "WestJet Encore", category: "large", compensation: largeAirlineCompensation },
  { name: "American Airlines", code: "AA", category: "large", compensation: largeAirlineCompensation },
  { name: "United Airlines", code: "UA", category: "large", compensation: largeAirlineCompensation },
  { name: "Delta Airlines", code: "DL", category: "large", compensation: largeAirlineCompensation },
  { name: "British Airways", code: "BA", category: "large", compensation: largeAirlineCompensation },
  { name: "Lufthansa", code: "LH", category: "large", compensation: largeAirlineCompensation },
  { name: "Air France", code: "AF", category: "large", compensation: largeAirlineCompensation },
  { name: "Japan Airlines", code: "JL", category: "large", compensation: largeAirlineCompensation },

  // Small Airlines
  { name: "Porter Airlines", code: "PD", category: "small", compensation: smallAirlineCompensation },
  { name: "Flair Airlines", code: "F8", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Transat", code: "TS", category: "small", compensation: smallAirlineCompensation },
  { name: "Air North", category: "small", compensation: smallAirlineCompensation },
  { name: "Canadian North", category: "small", compensation: smallAirlineCompensation },
  { name: "Pacific Coastal Airlines", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Inuit", category: "small", compensation: smallAirlineCompensation },
  { name: "Central Mountain Air", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Borealis", category: "small", compensation: smallAirlineCompensation },
  { name: "Rise Air", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Creebec", category: "small", compensation: smallAirlineCompensation },
  { name: "Max Aviation", category: "small", compensation: smallAirlineCompensation },
  { name: "Air Saint-Pierre", category: "small", compensation: smallAirlineCompensation },
  { name: "North Wright Airways", category: "small", compensation: smallAirlineCompensation },
];

export function getAirlineByName(name: string): Airline | undefined {
  return airlines.find(airline => 
    airline.name.toLowerCase().includes(name.toLowerCase()) ||
    airline.code?.toLowerCase() === name.toLowerCase()
  );
}

export function getDelayReasonValidity(reason: string): boolean {
  const delayReason = delayReasons.find(dr => dr.value === reason);
  return delayReason?.valid ?? false;
}

export function calculateCompensation(
  airlineName: string, 
  delayHours: number, 
  delayReason?: string
): { amount: number; eligible: boolean; reason: string } {
  const airline = getAirlineByName(airlineName);
  
  if (!airline) {
    return {
      amount: 0,
      eligible: false,
      reason: "Airline not found in our database"
    };
  }

  if (delayReason && !getDelayReasonValidity(delayReason)) {
    return {
      amount: 0,
      eligible: false,
      reason: "Delay reason is considered extraordinary circumstances"
    };
  }

  if (delayHours < 3) {
    return {
      amount: 0,
      eligible: false,
      reason: "Delay must be at least 3 hours for compensation eligibility"
    };
  }

  let amount: number;
  if (delayHours >= 9) {
    amount = airline.compensation.long;
  } else if (delayHours >= 6) {
    amount = airline.compensation.medium;
  } else {
    amount = airline.compensation.short;
  }

  return {
    amount,
    eligible: true,
    reason: `Eligible for compensation under ${airline.category} airline rules`
  };
}