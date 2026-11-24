/**
 * Boarding-pass field extraction in the browser (tesseract.js), used when the
 * server has no AI vision configured. Heuristic parsing of the OCR text.
 */
import { airlines } from "@shared/appr";

export interface ScannedFields {
  passengerName?: string;
  flightNumber?: string;
  flightDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  confidence: number;
  source: "ai" | "ocr";
}

const AIRLINE_CODES = new Set(airlines.map((a) => a.code).filter(Boolean) as string[]);
const MONTHS: Record<string, string> = { JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06", JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12", FEV: "02", AVR: "04", MAI: "05", JUI: "06", AOU: "08", DEC_: "12" };

export function parseBoardingPassText(text: string): ScannedFields {
  const upper = text.toUpperCase().replace(/[|]/g, "I");
  const fields: ScannedFields = { confidence: 0, source: "ocr" };
  let hits = 0;

  // Flight number: known airline code followed by 1-4 digits
  const flightMatches = [...upper.matchAll(/\b([A-Z0-9]{2})\s?0?(\d{1,4})\b/g)];
  const known = flightMatches.find((m) => AIRLINE_CODES.has(m[1]));
  const flight = known ?? flightMatches.find((m) => /^[A-Z]{2}$/.test(m[1]) && m[2].length >= 2);
  if (flight) {
    fields.flightNumber = `${flight[1]}${flight[2]}`;
    hits += 1;
  }

  // Airports: pairs of 3-letter codes around arrows/dashes, or "FROM X TO Y"
  const route = upper.match(/\b([A-Z]{3})\s*(?:->|→|-|TO|À|A)\s*([A-Z]{3})\b/);
  if (route && route[1] !== route[2]) {
    fields.departureAirport = route[1];
    fields.arrivalAirport = route[2];
    hits += 1;
  } else {
    const fromTo = upper.match(/FROM\s+.*?\b([A-Z]{3})\b[\s\S]{0,40}?TO\s+.*?\b([A-Z]{3})\b/);
    if (fromTo) {
      fields.departureAirport = fromTo[1];
      fields.arrivalAirport = fromTo[2];
      hits += 1;
    }
  }

  // Date: 15SEP, 15 SEP 2026, 2026-09-15, SEP 15
  const iso = upper.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const dmy = upper.match(/\b(\d{1,2})\s?([A-Z]{3})\.?\s?(20\d{2})?\b/);
  if (iso) {
    fields.flightDate = `${iso[1]}-${iso[2]}-${iso[3]}`;
    hits += 1;
  } else if (dmy && MONTHS[dmy[2]]) {
    const year = dmy[3] ?? String(new Date().getFullYear());
    fields.flightDate = `${year}-${MONTHS[dmy[2]]}-${dmy[1].padStart(2, "0")}`;
    hits += 0.5;
  }

  // Name: "SURNAME/GIVEN" pattern common on passes
  const name = upper.match(/\b([A-Z]{2,})\/([A-Z]{2,})(?:\s?(MR|MRS|MS|MISS))?\b/);
  if (name) {
    const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
    fields.passengerName = `${cap(name[2])} ${cap(name[1])}`;
    hits += 0.5;
  }

  fields.confidence = Math.min(1, hits / 3.5);
  return fields;
}

export async function ocrBoardingPass(file: File, onProgress?: (message: string) => void): Promise<ScannedFields> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { logger: (m) => onProgress?.(m.status) });
  try {
    const { data } = await worker.recognize(file);
    return parseBoardingPassText(data.text);
  } finally {
    await worker.terminate();
  }
}

/** Server AI first, on-device OCR as the fallback. */
export async function scanBoardingPass(file: File, onProgress?: (message: string) => void): Promise<ScannedFields> {
  const form = new FormData();
  form.append("image", file);
  const response = await fetch("/api/boarding-pass/extract", { method: "POST", body: form });
  if (response.ok) {
    return (await response.json()) as ScannedFields;
  }
  if (response.status !== 503) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not read the boarding pass");
  }
  return ocrBoardingPass(file, onProgress);
}
