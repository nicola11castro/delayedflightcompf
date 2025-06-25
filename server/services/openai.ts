import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR 
});

export interface ClaimEligibilityResult {
  isEligible: boolean;
  confidence: number;
  reason: string;
  compensationAmount?: number;
}

export interface ChatbotResponse {
  message: string;
  isHelpful: boolean;
}

export async function validateClaimEligibility(claimData: {
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  issueType: string;
  delayDuration?: string;
  delayReason?: string;
}): Promise<ClaimEligibilityResult> {
  try {
    const prompt = `Analyze this flight compensation claim for eligibility under Canadian APPR (Air Passenger Protection Regulations):

Flight Details:
- Flight: ${claimData.flightNumber}
- Date: ${claimData.flightDate}
- Route: ${claimData.departureAirport} to ${claimData.arrivalAirport}
- Issue: ${claimData.issueType}
- Delay Duration: ${claimData.delayDuration || 'Not specified'}
- Reason: ${claimData.delayReason || 'Not specified'}

Evaluate eligibility based on APPR criteria:
1. Flight must be within/to/from Canada
2. Delay/cancellation must be within airline control
3. Minimum delay thresholds apply
4. Weather and extraordinary circumstances are excluded

Provide assessment in JSON format with:
- isEligible: boolean
- confidence: number (0-1)
- reason: detailed explanation
- compensationAmount: estimated CAD amount if eligible`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in Canadian Air Passenger Protection Regulations (APPR). Analyze flight compensation claims for eligibility and provide accurate assessments. Respond with JSON in the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      isEligible: result.isEligible || false,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      reason: result.reason || "Unable to determine eligibility",
      compensationAmount: result.compensationAmount || 0
    };
  } catch (error) {
    console.error("OpenAI eligibility validation error:", error);
    return {
      isEligible: false,
      confidence: 0,
      reason: "Error validating claim eligibility. Please review manually."
    };
  }
}

export async function handleChatbotQuery(query: string, context?: string): Promise<ChatbotResponse> {
  try {
    const systemPrompt = `You are a helpful AI assistant for FlightClaim Pro, an airline compensation platform that charges a 15% commission on successful claims.

Key information about our service:
- We charge 15% commission only on successful claims
- No upfront fees or hidden costs
- Power of Attorney (POA) allows direct collection and immediate transfer
- Without POA, we invoice after airline pays passenger
- We handle Canadian APPR claims for delays, cancellations, and denied boarding
- Average compensation ranges from $125 to $1000 CAD

Provide helpful, accurate responses about:
- Commission structure and fees
- Claim process and requirements
- APPR rights and regulations
- Timeline and expectations

Keep responses concise and professional.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context ? `Context: ${context}\n\nQuestion: ${query}` : query }
      ],
    });

    return {
      message: response.choices[0].message.content || "I'm sorry, I couldn't process your question. Please try rephrasing it.",
      isHelpful: true
    };
  } catch (error) {
    console.error("OpenAI chatbot error:", error);
    return {
      message: "I'm experiencing technical difficulties. Please contact our support team for assistance.",
      isHelpful: false
    };
  }
}

export async function generateCommissionExplanation(compensationAmount: number): Promise<string> {
  try {
    const commissionAmount = Math.round(compensationAmount * 0.15);
    const finalAmount = compensationAmount - commissionAmount;

    const prompt = `Generate a clear, professional explanation of our 15% commission structure for a compensation claim of $${compensationAmount} CAD. Include:
- Total compensation: $${compensationAmount}
- Our commission (15%): $${commissionAmount}
- Amount passenger receives: $${finalAmount}
- Why this fee structure is fair and transparent
- What services are included

Keep it conversational and reassuring.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a customer service expert explaining commission structures in a clear, friendly manner."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || `For your $${compensationAmount} compensation claim, our 15% commission would be $${commissionAmount}, leaving you with $${finalAmount}.`;
  } catch (error) {
    console.error("OpenAI commission explanation error:", error);
    const commissionAmount = Math.round(compensationAmount * 0.15);
    const finalAmount = compensationAmount - commissionAmount;
    return `For your $${compensationAmount} compensation claim, our 15% commission would be $${commissionAmount}, leaving you with $${finalAmount}.`;
  }
}
