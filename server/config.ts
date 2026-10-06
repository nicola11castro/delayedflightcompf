import { createHmac, timingSafeEqual } from "crypto";
import { DEFAULT_APP_URL } from "@shared/brand";

/** Public URL of the site, used in emails (verification, reset, unsubscribe). */
export function appUrl(): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? DEFAULT_APP_URL : `http://localhost:${process.env.PORT || 5000}`;
}

function signingSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-session-secret";
}

/** HMAC signature for unsubscribe links so nobody can unsubscribe someone else. */
export function signEmail(email: string): string {
  return createHmac("sha256", signingSecret()).update(email.toLowerCase()).digest("hex");
}

export function verifyEmailSignature(email: string, signature: string): boolean {
  const expected = Buffer.from(signEmail(email));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function unsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ email: email.toLowerCase(), sig: signEmail(email) });
  return `${appUrl()}/api/unsubscribe?${params.toString()}`;
}

/** Token that lets a passenger open their own claim pages (signing) from an email link without an account. */
export function claimToken(claimId: string): string {
  return createHmac("sha256", signingSecret()).update(`claim:${claimId}`).digest("hex").slice(0, 32);
}

export function verifyClaimToken(claimId: string, token: string): boolean {
  const expected = Buffer.from(claimToken(claimId));
  const provided = Buffer.from(token);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function signPoaUrl(claimId: string): string {
  return `${appUrl()}/sign/${encodeURIComponent(claimId)}?token=${claimToken(claimId)}`;
}
