/**
 * Stripe Checkout for commission collection, via the REST API (no SDK).
 * Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET; both optional.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { Claim } from "@shared/schema";
import { BRAND_NAME } from "@shared/brand";
import { appUrl } from "../config";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const isStripeConfigured = () => Boolean(secretKey);

export async function createCommissionCheckout(claim: Claim): Promise<{ id: string; url: string }> {
  const commission = Number(claim.commissionAmount ?? 0);
  if (!(commission > 0)) throw new Error("Claim has no commission amount");
  const fr = claim.language === "fr";
  return createCheckout({
    claim,
    kind: "commission",
    amountCents: Math.round(commission * 100),
    name: fr ? `Commission ${BRAND_NAME} – réclamation ${claim.claimId}` : `${BRAND_NAME} commission – claim ${claim.claimId}`,
    successUrl: `${appUrl()}/my-claims?paid=1`,
    cancelUrl: `${appUrl()}/my-claims?paid=0`,
  });
}

export async function createKitCheckout(claim: Claim, amountCents: number): Promise<{ id: string; url: string }> {
  const fr = claim.language === "fr";
  return createCheckout({
    claim,
    kind: "kit",
    amountCents,
    name: fr ? `Trousse de réclamation ${BRAND_NAME} – ${claim.claimId}` : `${BRAND_NAME} self-serve claim kit – ${claim.claimId}`,
    successUrl: `${appUrl()}/kit/${encodeURIComponent(claim.claimId)}?paid=1`,
    cancelUrl: `${appUrl()}/kit/${encodeURIComponent(claim.claimId)}?paid=0`,
  });
}

async function createCheckout(input: {
  claim: Claim;
  kind: "commission" | "kit";
  amountCents: number;
  name: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  if (!secretKey) throw new Error("Stripe is not configured");
  const { claim } = input;
  const fr = claim.language === "fr";
  const params = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    customer_email: claim.email,
    client_reference_id: claim.claimId,
    "metadata[claimId]": claim.claimId,
    "metadata[claimDbId]": String(claim.id),
    "metadata[kind]": input.kind,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "cad",
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][product_data][name]": input.name,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    locale: fr ? "fr-CA" : "en",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = (await response.json()) as { id?: string; url?: string; error?: { message: string } };
  if (!response.ok || !data.id || !data.url) {
    throw new Error(`Stripe error: ${data.error?.message ?? response.statusText}`);
  }
  return { id: data.id, url: data.url };
}

/** Verify the Stripe-Signature header (t=...,v1=...) against the raw body. */
export function verifyStripeSignature(rawBody: Buffer, header: string | undefined): boolean {
  if (!webhookSecret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false; // 5 minute tolerance
  const expected = createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
