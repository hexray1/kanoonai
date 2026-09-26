/**
 * Pricing consistency tests — server-authoritative pricing.
 * The backend DOCUMENT_PRICES registry is the single source of truth;
 * the frontend DOCUMENTS prices must match it exactly for every type,
 * otherwise checkout would charge a different amount than shown.
 * Run: node --test src/utils/__tests__/
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENT_PRICES, getDocumentPrice } from "../aiGenerator.js";
import { DOCUMENTS } from "../../../../kanoon-ai/src/lib/constants.js";

const GST_RATE = 0.18;

describe("server-authoritative pricing", () => {
  it("backend registry covers exactly 25 document types", () => {
    assert.equal(Object.keys(DOCUMENT_PRICES).length, 25);
  });
  it("frontend prices match backend prices for ALL types (no checkout mismatch)", () => {
    const mismatches: string[] = [];
    for (const [type, price] of Object.entries(DOCUMENT_PRICES)) {
      const front = (DOCUMENTS as Record<string, { price: number }>)[type]?.price;
      if (front !== price) mismatches.push(`${type}: frontend=${front} backend=${price}`);
    }
    assert.deepEqual(mismatches, [], `price mismatches: ${mismatches.join("; ")}`);
  });
  it("previously-mismatched types are now synchronized", () => {
    assert.equal(getDocumentPrice("eviction-notice"), 149);
    assert.equal(getDocumentPrice("offer-letter"), 149);
    assert.equal(getDocumentPrice("emp-contract"), 299);
    assert.equal(getDocumentPrice("termination-letter"), 149);
  });
  it("GST math: total paise = round(base * 1.18) * 100", () => {
    for (const [type, base] of Object.entries(DOCUMENT_PRICES)) {
      const totalPaise = (base + Math.round(base * GST_RATE)) * 100;
      // Razorpay requires integer paise; totals must be whole rupees here.
      assert.ok(Number.isInteger(totalPaise), type);
      assert.ok(totalPaise > 0, type);
    }
  });
  it("all prices within the ₹99–₹499 product band", () => {
    for (const [type, price] of Object.entries(DOCUMENT_PRICES)) {
      assert.ok(price >= 99 && price <= 499, `${type}=${price}`);
    }
  });
  it("unknown types throw (never priced silently)", () => {
    assert.throws(() => getDocumentPrice("nope"), /unknown/i);
  });
});
