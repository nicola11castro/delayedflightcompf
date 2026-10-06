import OpenAI from "openai";
import { COMMISSION_RATE } from "@shared/appr";

// Optional. Without OPENAI_API_KEY the app still works: compensation comes
// from the APPR rules table, the AI pre-screen is skipped and the chatbot
// answers with a polite offline message.
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o";
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const isAiConfigured = () => openai !== null;

export interface ClaimEligibilityResult {
  isEligible: boolean;
  confidence: number;
  reason: string;
}

export interface ChatbotResponse {
  message: string;
  isHelpful: boolean;
}

/**
 * Second-opinion pre-screen of a claim. Returns null when the AI is not
 * configured or fails, so callers never store a misleading "ineligible".
 * Dollar amounts are never taken from the model.
 */
export async function validateClaimEligibility(claimData: {
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  issueType: string;
  delayDuration?: string;
  delayReason?: string;
}): Promise<ClaimEligibilityResult | null> {
  if (!openai) return null;

  try {
    const prompt = `Analyze this flight compensation claim for eligibility under Canadian APPR (Air Passenger Protection Regulations):

Flight Details:
- Flight: ${claimData.flightNumber}
- Date: ${claimData.flightDate}
- Route: ${claimData.departureAirport} to ${claimData.arrivalAirport}
- Issue: ${claimData.issueType}
- Delay Duration: ${claimData.delayDuration || "Not specified"}
- Reason: ${claimData.delayReason || "Not specified"}

Evaluate eligibility based on APPR criteria:
1. Flight must be within/to/from Canada
2. Delay/cancellation must be within airline control and not safety-related
3. Minimum delay threshold of 3 hours at arrival applies
4. Weather, ATC, security and other extraordinary circumstances are excluded

Respond with JSON: { "isEligible": boolean, "confidence": number between 0 and 1, "reason": "short explanation" }`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in Canadian Air Passenger Protection Regulations (APPR). Analyze flight compensation claims for eligibility. Respond only with JSON in the specified format.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      isEligible: Boolean(result.isEligible),
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
      reason: typeof result.reason === "string" ? result.reason : "No explanation provided",
    };
  } catch (error) {
    console.error("OpenAI eligibility validation error:", error);
    return null;
  }
}

export async function handleChatbotQuery(query: string, context?: string): Promise<ChatbotResponse> {
  if (!openai) {
    return {
      message:
        "Our assistant is offline at the moment. Please browse the FAQ below or email support@yulclaims.com and we will get back to you within 48 hours.",
      isHelpful: false,
    };
  }

  try {
    const systemPrompt = `You are a helpful assistant for FlightClaim Pro, an airline compensation service that charges a 15% commission on successful claims.

Key information about our service:
- We charge 15% commission only on successful claims
- No upfront fees or hidden costs
- Power of Attorney (POA) allows direct collection and immediate transfer
- Without POA, we invoice after airline pays passenger
- We handle Canadian APPR claims for delays, cancellations, and denied boarding
- Compensation ranges from $125 to $1000 CAD depending on carrier size and delay length

Provide helpful, accurate responses about:
- Commission structure and fees
- Claim process and requirements
- APPR rights and regulations
- Timeline and expectations

Keep responses concise and professional. Never promise a specific outcome.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context ? `Context: ${context}\n\nQuestion: ${query}` : query },
      ],
    });

    return {
      message:
        response.choices[0].message.content ||
        "I'm sorry, I couldn't process your question. Please try rephrasing it.",
      isHelpful: true,
    };
  } catch (error) {
    console.error("OpenAI chatbot error:", error);
    return {
      message: "I'm experiencing technical difficulties. Please contact our support team for assistance.",
      isHelpful: false,
    };
  }
}

/**
 * Plain-language breakdown of the 15% commission. Deterministic on purpose:
 * it is instant, free, and can never quote the wrong numbers.
 */
export function generateCommissionExplanation(
  compensationAmount: number,
  commissionAmount = Math.round(compensationAmount * COMMISSION_RATE),
  finalAmount = compensationAmount - commissionAmount,
): string {
  if (compensationAmount <= 0) {
    return "No compensation applies for this scenario, so there is nothing to pay us. Our fee is only ever charged when you win.";
  }
  return `If your claim succeeds, the airline owes you $${compensationAmount} CAD. Our commission is 15% ($${commissionAmount}), which we only collect once you are paid, and you keep $${finalAmount}. If the claim is unsuccessful you pay nothing.`;
}
