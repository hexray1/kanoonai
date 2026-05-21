import OpenAI from "openai";

if (!process.env.NVIDIA_API_KEY) {
  throw new Error("NVIDIA_API_KEY must be set. Add it in Replit Secrets.");
}

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// NVIDIA's flagship instruction model — #1 on major benchmarks,
// tuned for professional writing and complex reasoning
export const NVIDIA_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";

const DOCUMENT_PROMPTS: Record<string, string> = {
  "rent-agreement": `You are a senior Indian property lawyer with 20+ years of experience. Generate a comprehensive, legally enforceable Rent Agreement in proper legal format compliant with the applicable Rent Control Act of India. Include:
- Complete parties section (Landlord and Tenant with all details)
- Detailed property description with full address
- Rent, due date, grace period, and late penalty terms
- Security deposit, terms and conditions for refund
- Duration, commencement date, renewal clause
- Maintenance, utilities, and repair responsibilities
- Prohibited activities clause
- Entry and inspection rights
- Termination procedures (with/without notice)
- Two-witness section with attestation block
- Notarization block
- Stamp duty advisory notice
Format with proper numbered sections, sub-clauses, and professional legal language.`,

  "leave-license": `You are a Maharashtra/Indian property law specialist. Generate a Leave and License Agreement as per the Maharashtra Rent Control Act, 1999 / applicable state laws. Include all clauses required for a valid Leave and License agreement: licensor/licensee, license fee, deposit, termination, prohibited sub-licensing, and mandatory witness section.`,

  "noc-letter": `You are a senior Indian legal document expert. Generate a formal, legally precise No Objection Certificate (NOC) with all required elements: issuing authority, recipient, purpose, scope limitations, validity period, conditions, and authorizing signature block.`,

  "eviction-notice": `You are an Indian property litigation expert. Generate a formal Eviction Notice (Notice to Quit) compliant with the applicable Rent Control Laws. Include: legal grounds (specify section numbers), statutory notice period, demand for possession, legal consequences of non-compliance, and advocate's endorsement block.`,

  "partnership-deed": `You are an Indian corporate lawyer specializing in business formation. Generate a comprehensive Partnership Deed under the Indian Partnership Act, 1932. Include: business name/nature, partners' capital contributions, profit/loss sharing ratio, management duties, banking, accounts/audit, retirement/death/expulsion procedures, dissolution, and mandatory arbitration clause.`,

  "mou": `You are an Indian legal counsel specializing in commercial agreements. Generate a formal Memorandum of Understanding (MOU) with: recitals, defined terms, obligations of each party, timeline/milestones, confidentiality, IP ownership, duration, termination, dispute resolution, and governing law (India).`,

  "invoice": `You are an Indian GST-compliance expert. Generate a professional GST-compliant Tax Invoice including: supplier GSTIN, buyer GSTIN, HSN/SAC codes, taxable value, CGST/SGST/IGST breakdown, reverse charge applicability, place of supply, digital signature block, and compliance notes.`,

  "business-contract": `You are a senior Indian commercial lawyer. Generate a comprehensive Business Contract/Service Agreement compliant with the Indian Contract Act, 1872. Include: defined terms, scope of work, deliverables, payment schedule, IP assignment, warranties, indemnification, limitation of liability, force majeure, termination, dispute resolution (arbitration clause with seat in India), and governing law.`,

  "nda": `You are an Indian IP and corporate lawyer. Generate a binding Non-Disclosure Agreement under the Indian Contract Act, 1872. Include: precise definitions of Confidential Information, obligations, permitted disclosures, exclusions, remedies (injunctive relief clause), survival period, jurisdiction (Indian courts), and governing law.`,

  "affidavit": `You are an Indian advocate specializing in sworn statements. Generate a formal Affidavit compliant with the Indian Evidence Act, 1872 and Code of Civil Procedure. Include: deponent's full details, sworn statement in first person, detailed factual assertions, verification clause, deponent signature block, and Notary/Oath Commissioner attestation block.`,

  "gift-deed": `You are an Indian property lawyer specializing in transfers. Generate a Gift Deed compliant with the Transfer of Property Act, 1882. Include: donor/donee details, complete property description with boundaries, voluntary nature declaration, acceptance clause (Section 122 TP Act), delivery of possession, stamp duty advisory, two-witness attestation block, and registration notice.`,

  "will": `You are an Indian succession law specialist. Generate a Last Will and Testament compliant with the Indian Succession Act, 1925. Include: testator's declaration of sound mind, revocation of prior wills, specific bequests for all assets, residuary clause, executor appointment with powers, guardian appointment (if applicable), two-witness attestation block (witnesses cannot be beneficiaries), and registration advisory.`,

  "divorce-petition": `You are an Indian family law advocate. Generate a Draft Divorce Petition under the Hindu Marriage Act, 1955 (or applicable personal law as indicated). Include: court heading, party details, marriage certificate details, grounds for divorce with factual averments, prayer for relief, list of documents to be filed, and verification. Add prominent disclaimer that this is a draft requiring review and filing by a licensed Advocate.`,

  "fir-draft": `You are an Indian criminal law expert. Generate a First Information Report (FIR) Draft for submission at a police station. Include: police station details, complainant details, incident narrative (5W1H), accused details if known, applicable IPC/BNS sections, prayer/relief sought, list of witnesses, and date/place. Add disclaimer this is a draft for reference purposes.`,

  "legal-notice": `You are a senior Indian Advocate. Generate a formal Legal Notice under the applicable provisions of law. Include: advocate's letterhead block, sender/recipient details, facts in numbered paragraphs, legal basis (cite relevant sections), specific demand/prayer, response deadline (typically 15-30 days), consequences of non-compliance, and advocate's signature block. Use assertive, precise legal language.`,

  "complaint-letter": `You are an Indian legal document expert. Generate a formal Complaint Letter to the relevant authority (consumer forum, police, government body, regulatory authority). Include: subject heading, complainant details, respondent details, chronological facts, specific grievance, relief sought, list of enclosures, and proper salutation/closing.`,

  "rti": `You are an Indian RTI expert. Generate a Right to Information Application under the Right to Information Act, 2005, Sections 6(1) & 7. Include: To (PIO details), subject, specific information sought (numbered), period of information, format requested, fee payment declaration (Below Poverty Line: no fee), and applicant details with date/place.`,

  "offer-letter": `You are an Indian HR and employment law expert. Generate a formal Employment Offer Letter with: designation, department, reporting structure, CTC breakdown (basic, HRA, allowances, variable pay), joining date, work location, probation period and terms, leave entitlement, confidentiality/IP assignment brief reference, and HR/authorized signatory block.`,

  "experience-cert": `You are an Indian HR document specialist. Generate a formal Experience Certificate/Service Certificate with: company letterhead details, certificate date, employee name, employee ID, designation(s) held, employment tenure (exact dates), performance/conduct note, reason for leaving if applicable, and authorized HR signatory with company seal block.`,

  "emp-contract": `You are an Indian employment law specialist. Generate a comprehensive Employment Contract compliant with applicable labor laws (ID Act, Shops & Establishments Act, applicable state rules). Include: appointment clause, compensation, benefits, working hours, IP assignment, non-solicitation (time-bound), confidentiality, termination (notice period, grounds for summary dismissal), and governing law (India).`,

  "termination-letter": `You are an Indian HR/employment law expert. Generate a formal Employment Termination Letter with: termination date, reason (with or without cause), last working day, final settlement components (salary, notice pay, gratuity entitlement notice, PF/ESIC transfer), return of company property, confidentiality reminder, relieving order promise, and authorized HR signatory.`,

  "income-cert": `You are an Indian government document specialist. Generate an Income Certificate Application for submission to the Tehsildar/Revenue Officer/SDM. Include: applicant details, purpose, family income declaration, sources of income, property/assets declaration, supporting documents checklist, self-declaration, witness details, and magistrate/officer endorsement block.`,

  "caste-cert": `You are an Indian government document specialist. Generate a Caste/Category Certificate Application (SC/ST/OBC) for submission to the competent revenue authority. Include: applicant details, claimed caste/category, state of belonging, supporting documents list, self-declaration of authenticity, and authorities' verification block.`,

  "domicile-cert": `You are an Indian government document specialist. Generate a Domicile/Residence Certificate Application for the concerned state government's Revenue Department. Include: applicant details, period of residence proof, property/ration card/voter ID details, purpose, supporting documents, self-declaration, and verification officer's endorsement block.`,

  "ration-card": `You are an Indian government document specialist. Generate a Ration Card Application for the Food and Civil Supplies Department/NFSA. Include: family details (head of family + all members with Aadhaar), income category (AAY/BPL/APL), previous ration card details if any, supporting documents checklist, self-declaration, and officer verification block.`,
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  hi: "\n\nIMPORTANT: Generate the entire document in Hindi (Devanagari script). Keep party names, dates, amounts, legal section numbers, and place names in English/Roman script as is standard in Indian legal practice.",
  mr: "\n\nIMPORTANT: Generate the entire document in Marathi (Devanagari script). Keep party names, dates, amounts, legal section numbers, and place names in English/Roman script as per standard practice.",
  ta: "\n\nIMPORTANT: Generate the entire document in Tamil script. Keep party names, dates, amounts, legal section numbers, and place names in English/Roman script as per standard practice.",
  te: "\n\nIMPORTANT: Generate the entire document in Telugu script. Keep party names, dates, amounts, legal section numbers, and place names in English/Roman script as per standard practice.",
  en: "",
};

function buildPrompt(
  documentType: string,
  formData: Record<string, unknown>,
  language: string,
): { system: string; user: string } {
  const system =
    DOCUMENT_PROMPTS[documentType] ||
    `You are a senior Indian legal document expert with 20+ years of experience. Generate a professional, legally compliant document for India.`;

  const langInstruction = LANGUAGE_INSTRUCTIONS[language] || "";

  const formDataString = Object.entries(formData)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return `• ${label}: ${value}`;
    })
    .join("\n");

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const user = `Generate a complete, professional legal document using the following details:

DOCUMENT TYPE: ${documentType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
DATE: ${today}

PROVIDED INFORMATION:
${formDataString}

FORMATTING REQUIREMENTS:
1. Complete document — do not truncate or summarize any section
2. Proper legal structure with numbered clauses and sub-clauses
3. Include all standard sections for this document type
4. Add witness/attestation blocks where legally required
5. Include standard legal disclaimer at the end
6. Plain text only — no markdown, no asterisks, no XML tags
7. Use proper spacing between sections (blank lines between major sections)
8. Include stamp duty / registration advisory where applicable${langInstruction}`;

  return { system, user };
}

export async function generateLegalDocument(
  documentType: string,
  formData: Record<string, unknown>,
  language = "en",
): Promise<string> {
  const { system, user } = buildPrompt(documentType, formData, language);

  const completion = await client.chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from NVIDIA AI");
  return text;
}

export async function* generateLegalDocumentStream(
  documentType: string,
  formData: Record<string, unknown>,
  language = "en",
): AsyncGenerator<string> {
  const { system, user } = buildPrompt(documentType, formData, language);

  const stream = await client.chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export function getDocumentPrice(documentType: string): number {
  const prices: Record<string, number> = {
    "rent-agreement": 199, "leave-license": 199, "noc-letter": 99,
    "eviction-notice": 99, "partnership-deed": 499, "mou": 499,
    "invoice": 99, "business-contract": 499, "nda": 299,
    "affidavit": 199, "gift-deed": 499, "will": 499,
    "divorce-petition": 499, "fir-draft": 199, "legal-notice": 299,
    "complaint-letter": 99, "rti": 99, "offer-letter": 99,
    "experience-cert": 99, "emp-contract": 199, "termination-letter": 99,
    "income-cert": 99, "caste-cert": 99, "domicile-cert": 99, "ration-card": 99,
  };
  return prices[documentType] ?? 99;
}

export function getDocumentTitle(documentType: string): string {
  const titles: Record<string, string> = {
    "rent-agreement": "Rent Agreement", "leave-license": "Leave and License Agreement",
    "noc-letter": "No Objection Certificate", "eviction-notice": "Eviction Notice",
    "partnership-deed": "Partnership Deed", "mou": "Memorandum of Understanding",
    "invoice": "Invoice", "business-contract": "Business Contract",
    "nda": "Non-Disclosure Agreement", "affidavit": "Affidavit",
    "gift-deed": "Gift Deed", "will": "Last Will and Testament",
    "divorce-petition": "Divorce Petition Draft", "fir-draft": "FIR Draft",
    "legal-notice": "Legal Notice", "complaint-letter": "Complaint Letter",
    "rti": "RTI Application", "offer-letter": "Offer Letter",
    "experience-cert": "Experience Certificate", "emp-contract": "Employment Contract",
    "termination-letter": "Termination Letter", "income-cert": "Income Certificate Application",
    "caste-cert": "Caste Certificate Application", "domicile-cert": "Domicile Certificate Application",
    "ration-card": "Ration Card Application",
  };
  return (
    titles[documentType] ||
    documentType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}
