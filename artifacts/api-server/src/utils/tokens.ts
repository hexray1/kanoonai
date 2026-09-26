import crypto from "crypto";

/**
 * Token + signature primitives for the guest-only product.
 * Pure functions (no DB, no env reads at import) so they are unit-testable.
 */

const TOKEN_BYTES = 32;

/** Cryptographically random URL-safe token (shown to the client once). */
export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hash of a token — this is what gets stored in the database. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison of two hex digests. */
export function digestsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Verify a Razorpay checkout signature: HMAC-SHA256(key_secret) over
 * "orderId|paymentId". Constant-time comparison. Never throws.
 */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return digestsEqual(expected, signature);
}

/**
 * Verify a Razorpay webhook signature: HMAC-SHA256(webhook_secret) over the
 * EXACT raw request bytes. Constant-time comparison. Never throws.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  webhookSecret: string,
): boolean {
  if (!rawBody || rawBody.length === 0 || !signature || !webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return digestsEqual(expected, signature);
}

/** True when a stored token row is still usable (not revoked, not expired). */
export function isTokenLive(row: { revoked: boolean; expiresAt: Date }): boolean {
  return !row.revoked && row.expiresAt.getTime() > Date.now();
}
