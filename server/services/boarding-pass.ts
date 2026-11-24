/**
 * Boarding-pass field extraction with OpenAI vision (optional). The browser
 * falls back to on-device OCR (tesseract.js) when this is not configured.
 */
import OpenAI from "openai";
import { normalizeFlightNumber } from "./flight-data";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o";
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const isBoardingPassAiConfigured = () => openai !== null;

export interface BoardingPassFields {
  passengerName?: string;
  flightNumber?: string;
  flightDate?: string; // YYYY-MM-DD
  departureAirport?: string;
  arrivalAirport?: string;
  confidence: number;
  source: "ai" | "ocr";
}

export async function extractBoardingPass(image: Buffer, mimeType: string): Promise<BoardingPassFields | null> {
  if (!openai) return null;
  const dataUrl = `data:${mimeType};base64,${image.toString("base64")}`;
  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You read airline boarding passes. Return JSON only: {\"passengerName\": string|null, \"flightNumber\": string|null (IATA code + number, e.g. AC123), \"flightDate\": \"YYYY-MM-DD\"|null, \"departureAirport\": IATA code|null, \"arrivalAirport\": IATA code|null, \"confidence\": number 0-1}. Use null when a value is not visible. Never guess the year: if the pass shows no year, use null for flightDate.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the fields from this boarding pass." },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });
  const raw = JSON.parse(response.choices[0].message.content || "{}");
  const flightNumber = typeof raw.flightNumber === "string" ? normalizeFlightNumber(raw.flightNumber) ?? undefined : undefined;
  const date = typeof raw.flightDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.flightDate) ? raw.flightDate : undefined;
  const iata = (value: unknown) => (typeof value === "string" && /^[A-Z]{3}$/i.test(value.trim()) ? value.trim().toUpperCase() : undefined);
  return {
    passengerName: typeof raw.passengerName === "string" ? raw.passengerName.trim() : undefined,
    flightNumber,
    flightDate: date,
    departureAirport: iata(raw.departureAirport),
    arrivalAirport: iata(raw.arrivalAirport),
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    source: "ai",
  };
}
