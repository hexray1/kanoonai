/**
 * Security unit tests — token primitives & payment signature verification.
 * Run: node --test src/utils/__tests__/
 * (Node 24 type-stripping; no test runner dependency.)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  generateToken,
  hashToken,
  digestsEqual,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  isTokenLive,
} from "../tokens.js";

const SECRET = "test_webhook_secret_123";

function signCheckout(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

describe("generateToken", () => {
  it("produces unique URL-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();
    assert.notEqual(a, b);
    assert.match(a, /^[A-Za-z0-9_-]+$/);
    assert.ok(a.length >= 40);
  });
});

describe("hashToken / digestsEqual", () => {
  it("is deterministic and one-way in practice", () => {
    const t = generateToken();
    assert.equal(hashToken(t), hashToken(t));
    assert.equal(hashToken(t).length, 64);
    assert.notEqual(hashToken(t), t);
  });
  it("compares digests in constant time without leaking on length", () => {
    const h = hashToken("x");
    assert.ok(digestsEqual(h, h));
    assert.ok(!digestsEqual(h, hashToken("y")));
    assert.ok(!digestsEqual(h, "short"));
  });
});

describe("verifyCheckoutSignature (valid payment path)", () => {
  const orderId = "order_TEST123";
  const paymentId = "pay_TEST456";
  const sig = signCheckout(orderId, paymentId, SECRET);

  it("accepts a valid Razorpay checkout signature", () => {
    assert.ok(verifyCheckoutSignature(orderId, paymentId, sig, SECRET));
  });
  it("rejects a tampered signature", () => {
    const bad = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
    assert.ok(!verifyCheckoutSignature(orderId, paymentId, bad, SECRET));
  });
  it("rejects a signature for a DIFFERENT order (wrong-order attack)", () => {
    assert.ok(!verifyCheckoutSignature("order_OTHER", paymentId, sig, SECRET));
  });
  it("rejects a signature for a DIFFERENT payment id", () => {
    assert.ok(!verifyCheckoutSignature(orderId, "pay_OTHER", sig, SECRET));
  });
  it("rejects a signature made with the wrong secret", () => {
    const other = signCheckout(orderId, paymentId, "wrong_secret");
    assert.ok(!verifyCheckoutSignature(orderId, paymentId, other, SECRET));
  });
  it("rejects empty inputs without throwing", () => {
    assert.ok(!verifyCheckoutSignature("", paymentId, sig, SECRET));
    assert.ok(!verifyCheckoutSignature(orderId, paymentId, "", SECRET));
    assert.ok(!verifyCheckoutSignature(orderId, paymentId, sig, ""));
  });
});

describe("verifyWebhookSignature (raw-body HMAC)", () => {
  const raw = Buffer.from(JSON.stringify({ event: "payment.captured", id: "evt_1" }));
  const sig = crypto.createHmac("sha256", SECRET).update(raw).digest("hex");

  it("accepts a valid webhook signature over exact raw bytes", () => {
    assert.ok(verifyWebhookSignature(raw, sig, SECRET));
  });
  it("rejects when a single raw byte is tampered", () => {
    const tampered = Buffer.from(raw);
    tampered[10] ^= 0xff;
    assert.ok(!verifyWebhookSignature(tampered, sig, SECRET));
  });
  it("rejects a re-serialized body (key order changed) — no fallback", () => {
    const reserialized = Buffer.from(JSON.stringify({ id: "evt_1", event: "payment.captured" }));
    assert.ok(!verifyWebhookSignature(reserialized, sig, SECRET));
  });
  it("rejects wrong secret / missing signature / empty body", () => {
    assert.ok(!verifyWebhookSignature(raw, sig, "nope"));
    assert.ok(!verifyWebhookSignature(raw, "", SECRET));
    assert.ok(!verifyWebhookSignature(Buffer.alloc(0), sig, SECRET));
  });
});

describe("isTokenLive", () => {
  it("accepts a live token", () => {
    assert.ok(isTokenLive({ revoked: false, expiresAt: new Date(Date.now() + 1000) }));
  });
  it("rejects revoked tokens", () => {
    assert.ok(!isTokenLive({ revoked: true, expiresAt: new Date(Date.now() + 100000) }));
  });
  it("rejects expired tokens (download 24h / edit 7d windows)", () => {
    assert.ok(!isTokenLive({ revoked: false, expiresAt: new Date(Date.now() - 1000) }));
  });
});
