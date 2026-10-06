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
