/**
 * Flight data lookup behind a small interface so the provider can change.
 * Today: AviationStack (FLIGHT_DATA_PROVIDER=aviationstack, AVIATIONSTACK_API_KEY).
 * Without a key the app works exactly as before: passengers type the details.
 */
import { delayBandFromHours, getAirlineByFlightNumber, type DelayBand } from "@shared/appr";

export interface FlightLookupResult {
  provider: string;
  flightIata: string;
  flightDate: string;
  airlineName?: string;
  airlineIata?: string;
  departureIata?: string;
  departureAirport?: string;
  arrivalIata?: string;
  arrivalAirport?: string;
  scheduledArrival?: string;
  actualArrival?: string;
  delayMinutes: number | null;
  status?: string;
  /** APPR delay band derived from the arrival delay (null when under 3 hours or unknown) */
  delayBand: DelayBand | null;
  fetchedAt: string;
}

export interface FlightDataProvider {
  name: string;
  lookup(flightIata: string, date: string): Promise<FlightLookupResult | null>;
}

/** "ac 123" / "AC-123" / "AC0123" → "AC123" */
export function normalizeFlightNumber(input: string): string | null {
  const match = input.trim().toUpperCase().replace(/[\s-]+/g, "").match(/^([A-Z0-9]{2})0*(\d{1,4})[A-Z]?$/);
  return match ? `${match[1]}${match[2]}` : null;
}

function bandFromMinutes(minutes: number | null): DelayBand | null {
  if (minutes === null || minutes < 0) return null;
  const band = delayBandFromHours(minutes / 60);
  return band;
}

class AviationStackProvider implements FlightDataProvider {
  name = "aviationstack";
  constructor(private readonly apiKey: string) {}

  async lookup(flightIata: string, date: string): Promise<FlightLookupResult | null> {
    const params = new URLSearchParams({ access_key: this.apiKey, flight_iata: flightIata, flight_date: date, limit: "5" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://api.aviationstack.com/v1/flights?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`AviationStack ${response.status}`);
      const payload = (await response.json()) as {
        error?: { message?: string };
        data?: Array<{
          flight_date?: string;
          flight_status?: string;
          airline?: { name?: string; iata?: string };
          departure?: { iata?: string; airport?: string };
          arrival?: { iata?: string; airport?: string; scheduled?: string; actual?: string; estimated?: string; delay?: number | null };
        }>;
      };
      if (payload.error) throw new Error(payload.error.message ?? "AviationStack error");
      const flight = payload.data?.find((f) => f.flight_date === date) ?? payload.data?.[0];
      if (!flight) return null;
      const arrival = flight.arrival ?? {};
      let delayMinutes: number | null = typeof arrival.delay === "number" ? arrival.delay : null;
      if (delayMinutes === null && arrival.scheduled && (arrival.actual || arrival.estimated)) {
        const diff = new Date(arrival.actual ?? arrival.estimated!).getTime() - new Date(arrival.scheduled).getTime();
        delayMinutes = Math.max(0, Math.round(diff / 60000));
      }
      if (flight.flight_status === "cancelled") delayMinutes = delayMinutes ?? null;
      return {
        provider: this.name,
        flightIata,
        flightDate: flight.flight_date ?? date,
        airlineName: flight.airline?.name,
        airlineIata: flight.airline?.iata,
        departureIata: flight.departure?.iata,
        departureAirport: flight.departure?.airport,
        arrivalIata: arrival.iata,
        arrivalAirport: arrival.airport,
        scheduledArrival: arrival.scheduled,
        actualArrival: arrival.actual ?? arrival.estimated,
        delayMinutes,
        status: flight.flight_status,
        delayBand: bandFromMinutes(delayMinutes),
        fetchedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

function buildProvider(): FlightDataProvider | null {
  const name = (process.env.FLIGHT_DATA_PROVIDER || "aviationstack").toLowerCase();
  if (name === "aviationstack" && process.env.AVIATIONSTACK_API_KEY) {
    return new AviationStackProvider(process.env.AVIATIONSTACK_API_KEY);
  }
  return null;
}

const provider = buildProvider();

export const isFlightLookupConfigured = () => provider !== null;

/** Returns null when not configured, not found, or the provider fails (never throws). */
export async function lookupFlight(flightNumber: string, date: string): Promise<FlightLookupResult | null> {
  if (!provider) return null;
  const flightIata = normalizeFlightNumber(flightNumber);
  if (!flightIata || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  try {
    return await provider.lookup(flightIata, date);
  } catch (error) {
    console.error(`[flight-data] lookup failed for ${flightIata} ${date}:`, error);
    return null;
  }
}

/** What we can say about a flight from the number alone, used when no provider is configured. */
export function offlineFlightHint(flightNumber: string) {
  const airline = getAirlineByFlightNumber(flightNumber);
  return airline ? { airlineName: airline.name, airlineIata: airline.code, carrierSize: airline.category } : null;
}
