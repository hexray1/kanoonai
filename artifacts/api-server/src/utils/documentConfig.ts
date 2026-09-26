/**
 * Universal document engine configuration (server side).
 * Every document type declares its required input fields here so the
 * server validates the smart-form payload independently of the client.
 * Field lists mirror the wizard the frontend renders.
 *
 * Versioning: bump TEMPLATE_VERSION when a template changes, PROMPT_VERSION
 * when the generation prompt changes, LEGAL_VERSION when the underlying
 * statute references change. Stored on every generated document.
 */

// BNS / BNSS / BSA replaced IPC / CrPC / Indian Evidence Act (July 2024).
export const LEGAL_VERSION = "2026-09-bns-bnss-bsa";
export const TEMPLATE_VERSION = "2026-09-v1";
export const PROMPT_VERSION = "2026-09-v1";

export const DOCUMENT_REQUIRED_FIELDS: Record<string, string[]> = {
  "rent-agreement": ["landlord_name", "landlord_address", "tenant_name", "tenant_address", "property_address", "monthly_rent", "deposit_amount", "start_date", "duration_months", "state"],
  "leave-license": ["licensor_name", "licensee_name", "property_address", "monthly_fee", "deposit", "duration_months"],
  "noc-letter": ["issuer_name", "recipient_name", "property_details", "purpose", "date"],
  "eviction-notice": ["landlord_name", "tenant_name", "property_address", "reason", "vacate_by_date"],
  "partnership-deed": ["partner1_name", "partner1_address", "partner2_name", "partner2_address", "business_name", "business_address", "profit_ratio", "start_date"],
  "mou": ["party1_name", "party2_name", "purpose", "effective_date", "duration"],
  "business-contract": ["party1_name", "party1_address", "party2_name", "party2_address", "scope_of_work", "payment_terms", "start_date", "duration"],
  "nda": ["party1_name", "party1_company", "party2_name", "party2_company", "effective_date", "duration", "jurisdiction"],
  "invoice": ["company_name", "company_gstin", "client_name", "client_gstin", "items_description", "total_amount", "date"],
  "affidavit": ["deponent_name", "deponent_address", "deponent_age", "statement_purpose", "statement_details", "place", "date"],
  "gift-deed": ["donor_name", "donee_name", "property_description", "relationship", "date"],
  "will": ["testator_name", "testator_address", "executor_name", "beneficiary_details", "date"],
  "divorce-petition": ["petitioner_name", "respondent_name", "marriage_date", "grounds_for_divorce", "children_details", "place"],
  "legal-notice": ["sender_name", "sender_address", "recipient_name", "recipient_address", "notice_subject", "notice_details", "demand", "response_days"],
  "fir-draft": ["complainant_name", "incident_date", "incident_place", "incident_description", "police_station"],
  "complaint-letter": ["complainant_name", "complainant_address", "authority_name", "complaint_subject", "complaint_details", "relief_sought"],
  "rti": ["applicant_name", "applicant_address", "authority_name", "authority_address", "information_sought", "date"],
  "offer-letter": ["company_name", "candidate_name", "designation", "salary", "joining_date", "reporting_manager"],
  "emp-contract": ["company_name", "employee_name", "designation", "salary", "probation_period", "notice_period"],
  "termination-letter": ["company_name", "employee_name", "designation", "termination_date", "reason", "notice_period"],
  "experience-cert": ["company_name", "employee_name", "designation", "start_date", "end_date", "performance_note"],
  "income-cert": ["applicant_name", "father_name", "address", "annual_income", "purpose"],
  "caste-cert": ["applicant_name", "father_name", "address", "caste_category", "state", "purpose"],
  "domicile-cert": ["applicant_name", "father_name", "address", "years_of_residence", "state", "purpose"],
  "ration-card": ["head_of_family", "address", "family_members", "annual_income", "state"],
};

const MAX_FIELD_VALUE_LENGTH = 5000;
const MAX_FIELD_COUNT = 60;

export interface FormValidation {
  ok: boolean;
  error?: string;
}

/**
 * Server-side smart-form validation. Rejects:
 * - unknown document types
 * - missing/empty required fields
 * - non-string/number/boolean values, oversized values
 * - absurd field counts (payload abuse)
 */
export function validateFormData(type: string, formData: unknown): FormValidation {
  const required = DOCUMENT_REQUIRED_FIELDS[type];
  if (!required) return { ok: false, error: "Unknown document type" };
  if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
    return { ok: false, error: "formData must be an object" };
  }
  const entries = Object.entries(formData as Record<string, unknown>);
  if (entries.length === 0) return { ok: false, error: "formData is empty" };
  if (entries.length > MAX_FIELD_COUNT) return { ok: false, error: "Too many fields" };

  for (const [key, value] of entries) {
    if (typeof key !== "string" || key.length > 80) {
      return { ok: false, error: `Invalid field name: ${key}` };
    }
    const t = typeof value;
    if (t !== "string" && t !== "number" && t !== "boolean") {
      return { ok: false, error: `Invalid value type for field: ${key}` };
    }
    if (String(value).length > MAX_FIELD_VALUE_LENGTH) {
      return { ok: false, error: `Field too long: ${key}` };
    }
  }

  const missing: string[] = [];
  for (const field of required) {
    const v = (formData as Record<string, unknown>)[field];
    if (v === undefined || v === null || String(v).trim() === "") missing.push(field);
  }
  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }
  return { ok: true };
}

/** Output validation: the AI draft must look like a real document. */
export function validateGeneratedContent(content: unknown): FormValidation {
  if (typeof content !== "string") return { ok: false, error: "Empty generation" };
  const trimmed = content.trim();
  if (trimmed.length < 500) return { ok: false, error: "Generation too short to be a valid document" };
  if (trimmed.length > 200_000) return { ok: false, error: "Generation exceeds size limit" };
  // Structural markers a real legal draft must carry. Missing them usually
  // means a truncated or degenerate completion — repairable with one retry.
  const lower = trimmed.toLowerCase();
  const markers = ["signature", "witness", "date", "place", "signed", "executed"];
  const hits = markers.filter((m) => lower.includes(m)).length;
  if (hits < 2) return { ok: false, error: "Generation missing document structure (signature/witness/date markers)" };
  return { ok: true };
}
