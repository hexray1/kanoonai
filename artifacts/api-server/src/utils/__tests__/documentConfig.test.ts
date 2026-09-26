/**
 * Validation unit tests — server-side form + output validation.
 * Run: node --test src/utils/__tests__/
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateFormData,
  validateGeneratedContent,
  DOCUMENT_REQUIRED_FIELDS,
} from "../documentConfig.js";

const LONG_DOC = `
RENT AGREEMENT
This agreement is executed on 1 January 2026 at Mumbai, Maharashtra.
BETWEEN: Ramesh Kumar (Landlord) AND Suresh Singh (Tenant).
The monthly rent is Rs. 15000. Security deposit Rs. 30000.
WITNESSES: 1. ________  2. ________
IN WITNESS WHEREOF the parties have signed on the date and place mentioned above.
Signature of Landlord: ________   Signature of Tenant: ________
`.repeat(8); // comfortably > 500 chars with structure markers

describe("validateFormData", () => {
  it("accepts a complete valid payload", () => {
    const r = validateFormData("nda", {
      party1_name: "A", party1_company: "ACo", party2_name: "B",
      party2_company: "BCo", effective_date: "2026-01-01",
      duration: "2 years", jurisdiction: "Mumbai",
    });
    assert.ok(r.ok, r.error);
  });
  it("rejects unknown document types", () => {
    const r = validateFormData("nuclear-treaty", {});
    assert.ok(!r.ok);
  });
  it("rejects missing required fields", () => {
    const r = validateFormData("nda", { party1_name: "A" });
    assert.ok(!r.ok);
    assert.match(r.error ?? "", /party1_company|required/i);
  });
  it("rejects empty-string required fields", () => {
    const r = validateFormData("noc-letter", {
      issuer_name: "A", recipient_name: "", property_details: "x", purpose: "y", date: "2026-01-01",
    });
    assert.ok(!r.ok);
  });
  it("rejects oversized field values (payload abuse)", () => {
    const r = validateFormData("noc-letter", {
      issuer_name: "x".repeat(6000), recipient_name: "B",
      property_details: "x", purpose: "y", date: "2026-01-01",
    });
    assert.ok(!r.ok);
  });
  it("rejects absurd field counts", () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < 200; i++) many[`f${i}`] = "v";
    const r = validateFormData("noc-letter", many);
    assert.ok(!r.ok);
  });
  it("covers all 25 document types with non-empty field lists", () => {
    const types = Object.keys(DOCUMENT_REQUIRED_FIELDS);
    assert.equal(types.length, 25);
    for (const t of types) assert.ok(DOCUMENT_REQUIRED_FIELDS[t].length > 0, t);
  });
});

describe("validateGeneratedContent", () => {
  it("accepts a well-formed document", () => {
    const r = validateGeneratedContent(LONG_DOC);
    assert.ok(r.ok, r.error);
  });
  it("rejects too-short output (truncated stream)", () => {
    assert.ok(!validateGeneratedContent("short text").ok);
  });
  it("rejects long output missing structure markers (degenerate completion)", () => {
    const filler = "lorem ipsum dolor sit amet ".repeat(60); // >500 chars, no markers
    const r = validateGeneratedContent(filler);
    assert.ok(!r.ok);
    assert.match(r.error ?? "", /structure/i);
  });
  it("rejects non-string / empty content", () => {
    assert.ok(!validateGeneratedContent(null).ok);
    assert.ok(!validateGeneratedContent("").ok);
  });
  it("rejects absurdly large output", () => {
    assert.ok(!validateGeneratedContent("x signature witness date place ".repeat(20000)).ok);
  });
});
