import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DOCUMENT_PROMPTS: Record<string, string> = {
  "rent-agreement": `You are a legal document expert specializing in Indian tenancy law. Generate a comprehensive Rent Agreement in proper legal format. Include:
- Parties section (Landlord and Tenant details)
- Property description
- Rent terms and payment schedule
- Security deposit terms
- Duration and renewal clause
- Maintenance responsibilities
- Termination clauses
- Witness section (2 witnesses required)
- Proper legal disclaimers
Format with proper sections, numbered clauses, and professional legal language.`,

  "leave-and-license": `You are an Indian legal document specialist. Generate a Leave and License Agreement as per Maharashtra Rent Control Act / applicable state laws. Include all required clauses for a valid Leave and License agreement in India.`,

  "noc-letter": `You are an Indian legal document expert. Generate a formal No Objection Certificate (NOC) Letter in proper format with all required elements including purpose, scope, and authorization.`,

  "eviction-notice": `You are an Indian legal document expert. Generate a formal Eviction Notice (Notice to Quit) as per applicable Rent Control Laws of India. Include proper legal grounds, notice period, and legal consequences.`,

  "partnership-deed": `You are an Indian legal document specialist. Generate a comprehensive Partnership Deed as per the Indian Partnership Act, 1932. Include all mandatory clauses: partners' details, capital contribution, profit/loss sharing, management, dissolution, and arbitration clause.`,

  "mou-agreement": `You are an Indian legal document expert. Generate a formal Memorandum of Understanding (MOU) with all standard clauses including purpose, obligations, confidentiality, duration, and termination.`,

  "invoice-format": `You are an Indian legal/accounting document expert. Generate a professional GST-compliant Invoice format with all required fields including GSTIN, HSN/SAC codes, tax breakup (CGST, SGST/IGST), and supplier/buyer details.`,

  "business-contract": `You are an Indian legal document specialist. Generate a comprehensive Business Contract/Service Agreement with all standard clauses including scope of work, payment terms, intellectual property, warranties, indemnification, dispute resolution, and governing law (Indian jurisdiction).`,

  "nda-agreement": `You are an Indian legal document expert. Generate a bilateral Non-Disclosure Agreement (NDA) as per Indian Contract Act, 1872. Include definitions, obligations, exclusions, remedies, jurisdiction (Indian courts), and governing law.`,

  "affidavit": `You are an Indian legal document specialist. Generate a formal Affidavit as per Indian Evidence Act. Include proper deponent declaration, sworn statement format, notarization section, and verification clause.`,

  "gift-deed": `You are an Indian legal document expert. Generate a Gift Deed as per Transfer of Property Act, 1882. Include donor/donee details, property description, acceptance clause, delivery of possession, stamp duty notice, and witness section.`,

  "will-testament": `You are an Indian legal document specialist. Generate a Last Will and Testament as per Indian Succession Act, 1925. Include testator details, beneficiary designations, executor appointment, specific bequests, residuary clause, and witness requirements.`,

  "divorce-petition": `You are an Indian legal document expert. Generate a Draft Divorce Petition under Hindu Marriage Act, 1955 (or applicable personal law). Note: This is a draft for reference purposes. Include grounds for divorce, prayer for relief, and required legal declarations. Add prominent disclaimer that this requires court filing with a licensed advocate.`,

  "fir-draft": `You are an Indian legal document expert. Generate a First Information Report (FIR) Draft to be filed at a police station. Include complainant details, incident details, accused details (if known), sections of IPC/relevant laws, and prayer. Add disclaimer that this is a draft for reference.`,

  "legal-notice": `You are an Indian legal document specialist. Generate a formal Legal Notice as per Code of Civil Procedure and applicable laws. Include sender/recipient details, facts, legal grounds, demand/prayer, and response timeline.`,

  "complaint-letter": `You are an Indian legal document expert. Generate a formal Complaint Letter to a government authority, consumer forum, or relevant body. Include all required elements for it to be a legally valid complaint.`,

  "rti-application": `You are an Indian legal document specialist. Generate an RTI (Right to Information) Application as per Right to Information Act, 2005. Include proper format, information sought, declaration, and fee details.`,

  "offer-letter": `You are an Indian HR/legal document expert. Generate a professional Employment Offer Letter with all required details including designation, CTC, joining date, reporting structure, probation terms, and standard conditions of employment.`,

  "experience-certificate": `You are an Indian HR document expert. Generate a formal Experience Certificate/Employment Certificate with proper format, employment duration, designation, performance note, and company seal placeholder.`,

  "employment-contract": `You are an Indian legal/HR document specialist. Generate a comprehensive Employment Contract as per relevant Indian labor laws (Industrial Disputes Act, Shops and Establishments Act). Include all standard clauses including IP assignment, non-compete, confidentiality, and termination conditions.`,

  "termination-letter": `You are an Indian HR/legal document expert. Generate a formal Employment Termination Letter with proper documentation, reason for termination, last working day, settlement details, and return of company property clause.`,

  "income-certificate": `You are an Indian government document specialist. Generate an Income Certificate Application to be submitted to the Tehsildar/Revenue Officer. Include all required fields and supporting documents list as per government requirements.`,

  "caste-certificate": `You are an Indian government document specialist. Generate a Caste/Category Certificate Application in proper format for submission to the competent authority. Include all required declarations and supporting documents.`,

  "domicile-certificate": `You are an Indian government document specialist. Generate a Domicile/Residence Certificate Application in proper format for the concerned state government authority.`,

  "ration-card": `You are an Indian government document specialist. Generate a Ration Card Application in proper format for the Food and Civil Supplies Department. Include all required family member details, income declaration, and supporting documents list.`,
};

const HINDI_INSTRUCTION = `
Please generate the document in Hindi (Devanagari script) while keeping the legal terms, party names, dates, and amounts in English/Roman script as is standard practice in Indian legal documents.`;

const ENGLISH_INSTRUCTION = `
Please generate the document in English with professional legal language appropriate for Indian jurisdiction.`;

export async function generateLegalDocument(
  documentType: string,
  formData: Record<string, unknown>,
  language: string = "en"
): Promise<string> {
  const systemPrompt = DOCUMENT_PROMPTS[documentType] || `You are an Indian legal document expert. Generate a professional legal document for India.`;

  const languageInstruction = language === "hi" ? HINDI_INSTRUCTION :
    language === "mr" ? "\nPlease generate the document in Marathi (Devanagari script) while keeping legal terms, names, and numbers in English as per standard practice." :
    language === "ta" ? "\nPlease generate the document in Tamil while keeping legal terms, names, and numbers in English as per standard practice." :
    language === "te" ? "\nPlease generate the document in Telugu while keeping legal terms, names, and numbers in English as per standard practice." :
    ENGLISH_INSTRUCTION;

  const formDataString = Object.entries(formData)
    .map(([key, value]) => `${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}: ${value}`)
    .join("\n");

  const userPrompt = `Generate a legal document with the following details:

Document Type: ${documentType.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}

Provided Information:
${formDataString}

${languageInstruction}

Requirements:
1. Generate a complete, legally structured document
2. Use proper legal formatting with numbered sections and clauses
3. Include today's date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
4. Add witness section where applicable (2 witnesses)
5. Include relevant stamp duty notice for the state if applicable
6. Add standard legal disclaimer at the end
7. Format it as a proper A4 document with appropriate headers and sections
8. Do NOT include any XML tags or markdown, use plain text with proper spacing`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in AI response");
  }

  return textContent.text;
}

export function getDocumentPrice(documentType: string): number {
  const prices: Record<string, number> = {
    "rent-agreement": 199,
    "leave-and-license": 199,
    "noc-letter": 99,
    "eviction-notice": 99,
    "partnership-deed": 499,
    "mou-agreement": 499,
    "invoice-format": 99,
    "business-contract": 499,
    "nda-agreement": 299,
    "affidavit": 199,
    "gift-deed": 499,
    "will-testament": 499,
    "divorce-petition": 499,
    "fir-draft": 199,
    "legal-notice": 299,
    "complaint-letter": 99,
    "rti-application": 99,
    "offer-letter": 99,
    "experience-certificate": 99,
    "employment-contract": 199,
    "termination-letter": 99,
    "income-certificate": 99,
    "caste-certificate": 99,
    "domicile-certificate": 99,
    "ration-card": 99,
  };
  return prices[documentType] || 99;
}

export function getDocumentTitle(documentType: string): string {
  const titles: Record<string, string> = {
    "rent-agreement": "Rent Agreement",
    "leave-and-license": "Leave and License Agreement",
    "noc-letter": "No Objection Certificate",
    "eviction-notice": "Eviction Notice",
    "partnership-deed": "Partnership Deed",
    "mou-agreement": "Memorandum of Understanding",
    "invoice-format": "Invoice",
    "business-contract": "Business Contract",
    "nda-agreement": "Non-Disclosure Agreement",
    "affidavit": "Affidavit",
    "gift-deed": "Gift Deed",
    "will-testament": "Last Will and Testament",
    "divorce-petition": "Divorce Petition Draft",
    "fir-draft": "FIR Draft",
    "legal-notice": "Legal Notice",
    "complaint-letter": "Complaint Letter",
    "rti-application": "RTI Application",
    "offer-letter": "Offer Letter",
    "experience-certificate": "Experience Certificate",
    "employment-contract": "Employment Contract",
    "termination-letter": "Termination Letter",
    "income-certificate": "Income Certificate Application",
    "caste-certificate": "Caste Certificate Application",
    "domicile-certificate": "Domicile Certificate Application",
    "ration-card": "Ration Card Application",
  };
  return titles[documentType] || documentType.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
