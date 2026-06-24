export type FieldType = "text" | "number" | "currency" | "date" | "select" | "textarea";

export interface FieldConfig {
  type: FieldType;
  question: string;          // Conversational question shown in wizard
  questionHi?: string;
  aiTip?: string;            // AI helper tip shown below input
  aiTipHi?: string;
  emoji?: string;
  options?: string[];        // for "select" type
  prefix?: string;           // e.g. "₹" for currency
  suffix?: string;           // e.g. "months"
  min?: number;
  max?: number;
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi (NCT)", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

export const FIELD_CONFIG: Record<string, FieldConfig> = {
  // ── Rental ──────────────────────────────────────────────
  landlord_name: {
    type: "text", emoji: "🏠",
    question: "What is the landlord's full legal name?",
    questionHi: "मकान मालिक का पूरा कानूनी नाम क्या है?",
    aiTip: "Use full name as it appears on Aadhaar or PAN card — this is required for legal enforceability.",
    aiTipHi: "आधार या पैन कार्ड पर जैसा नाम है वैसा ही लिखें — कानूनी मान्यता के लिए जरूरी है।",
  },
  landlord_address: {
    type: "text", emoji: "📍",
    question: "What is the landlord's permanent address?",
    aiTip: "Full permanent address including pin code. This is where legal notices will be served.",
  },
  tenant_name: {
    type: "text", emoji: "👤",
    question: "What is the tenant's full legal name?",
    questionHi: "किरायेदार का पूरा कानूनी नाम क्या है?",
    aiTip: "Use name as on Aadhaar. If joint tenants, list primary tenant here and add others in the clause section.",
  },
  tenant_address: {
    type: "text", emoji: "🏡",
    question: "What is the tenant's permanent home address?",
    aiTip: "This should be the tenant's permanent address (not the rented property). Used for correspondence.",
  },
  property_address: {
    type: "text", emoji: "📌",
    question: "What is the complete address of the rental property?",
    questionHi: "किराये की संपत्ति का पूरा पता क्या है?",
    aiTip: "Include flat/house number, floor, building name, street, city, district, and pin code.",
  },
  monthly_rent: {
    type: "currency", emoji: "💰", prefix: "₹",
    question: "How much is the monthly rent?",
    questionHi: "मासिक किराया कितना है?",
    aiTip: "Include only base rent. List maintenance charges, parking fees, or utility charges separately in the additional clauses.",
  },
  deposit_amount: {
    type: "currency", emoji: "🏦", prefix: "₹",
    question: "What is the security deposit amount?",
    questionHi: "सुरक्षा जमा राशि कितनी है?",
    aiTip: "Standard practice in India is 1–3 months' rent as security deposit. It must be returned within 30 days of vacating.",
  },
  start_date: {
    type: "date", emoji: "📅",
    question: "When does the tenancy start?",
    questionHi: "किराया कब से शुरू होगा?",
    aiTip: "This is the commencement date. The agreement takes legal effect from this date.",
  },
  duration_months: {
    type: "number", emoji: "⏱️", suffix: "months",
    question: "What is the duration of the rental agreement?",
    questionHi: "किराया समझौते की अवधि कितने महीने है?",
    aiTip: "11 months is the most common duration in India — longer agreements typically attract stamp duty registration requirements.",
    min: 1, max: 120,
  },
  state: {
    type: "select", emoji: "📍",
    question: "In which state is the property located?",
    questionHi: "संपत्ति किस राज्य में है?",
    aiTip: "This determines which Rent Control Act applies — Maharashtra uses MRC Act 1999, Delhi uses DRC Act 1958, etc.",
    options: INDIAN_STATES,
  },

  // ── Leave & License ─────────────────────────────────────
  licensor_name: { type: "text", emoji: "🏠", question: "What is the licensor's (property owner's) full name?", aiTip: "Use name as on Aadhaar/PAN." },
  licensee_name: { type: "text", emoji: "👤", question: "What is the licensee's (occupant's) full name?", aiTip: "Full legal name for the person who will occupy the property." },
  monthly_fee: { type: "currency", emoji: "💰", prefix: "₹", question: "What is the monthly license fee?", aiTip: "This is called 'license fee' (not rent) in a Leave & License agreement." },
  deposit: { type: "currency", emoji: "🏦", prefix: "₹", question: "What is the refundable deposit amount?", aiTip: "Typically 2–3 months' license fee." },

  // ── Business ────────────────────────────────────────────
  partner1_name: { type: "text", emoji: "👤", question: "What is Partner 1's full legal name?", aiTip: "Use name exactly as on PAN card — this is binding for the partnership deed." },
  partner1_address: { type: "text", emoji: "📍", question: "What is Partner 1's full address?", aiTip: "Complete address including pin code." },
  partner2_name: { type: "text", emoji: "👤", question: "What is Partner 2's full legal name?", aiTip: "Use name exactly as on PAN card." },
  partner2_address: { type: "text", emoji: "📍", question: "What is Partner 2's full address?" },
  business_name: { type: "text", emoji: "🏢", question: "What is the name of the partnership firm?", aiTip: "This will be the firm's trading name. Can be registered with the Registrar of Firms under the Indian Partnership Act." },
  business_address: { type: "text", emoji: "📌", question: "What is the principal place of business?", aiTip: "Main office address where the firm will operate." },
  profit_ratio: { type: "text", emoji: "📊", question: "What is the profit and loss sharing ratio?", aiTip: "Enter as ratio (e.g., 60:40 or 50:50). Both profit and loss will be shared in this ratio unless specified otherwise." },
  party1_name: { type: "text", emoji: "🤝", question: "What is the name of Party 1?", aiTip: "Can be an individual or company name." },
  party1_address: { type: "text", emoji: "📍", question: "What is Party 1's full address?" },
  party2_name: { type: "text", emoji: "🤝", question: "What is the name of Party 2?" },
  party2_address: { type: "text", emoji: "📍", question: "What is Party 2's full address?" },
  purpose: { type: "text", emoji: "🎯", question: "What is the purpose of this agreement?", aiTip: "Be specific — e.g., 'software development services', 'product distribution', 'consultancy'." },
  effective_date: { type: "date", emoji: "📅", question: "What is the effective/start date of this agreement?", aiTip: "The date from which this agreement becomes legally binding." },
  duration: { type: "text", emoji: "⏱️", question: "What is the duration of this agreement?", aiTip: "E.g., '2 years', '12 months', 'until project completion'." },
  party1_company: { type: "text", emoji: "🏢", question: "What is Party 1's company name?", aiTip: "Include Pvt Ltd, LLP, or other suffix." },
  party2_company: { type: "text", emoji: "🏢", question: "What is Party 2's company name?" },
  jurisdiction: { type: "select", emoji: "⚖️", question: "Which city's courts will have jurisdiction?", aiTip: "In case of disputes, this city's courts will have exclusive jurisdiction.", options: ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Chandigarh"] },
  scope_of_work: { type: "textarea", emoji: "📋", question: "Describe the scope of work / services in detail.", aiTip: "Be as specific as possible — list deliverables, timelines, and exclusions. The more detail, the stronger the contract." },
  payment_terms: { type: "text", emoji: "💳", question: "What are the payment terms?", aiTip: "E.g., '50% advance, 50% on completion' or 'monthly invoicing on the 1st'." },
  company_name: { type: "text", emoji: "🏢", question: "What is your company's name?", aiTip: "Official registered name of the company." },
  company_gstin: { type: "text", emoji: "🔢", question: "What is your company's GSTIN?", aiTip: "15-digit GST Identification Number. Required for GST-compliant invoices." },
  client_name: { type: "text", emoji: "👤", question: "What is the client's name?" },
  client_gstin: { type: "text", emoji: "🔢", question: "What is the client's GSTIN? (if applicable)", aiTip: "Leave blank if client is unregistered or not a GST entity." },
  items_description: { type: "textarea", emoji: "📦", question: "Describe the goods or services billed in this invoice.", aiTip: "List item name, quantity, rate, and HSN/SAC code if applicable." },
  total_amount: { type: "currency", emoji: "💰", prefix: "₹", question: "What is the total invoice amount (before GST)?", aiTip: "GST will be calculated automatically based on applicable rate." },

  // ── Personal / Family ────────────────────────────────────
  deponent_name: { type: "text", emoji: "👤", question: "What is the deponent's full name?", questionHi: "शपथकर्ता का पूरा नाम क्या है?", aiTip: "Name exactly as on Aadhaar or Passport — you are the deponent making the sworn statement." },
  deponent_address: { type: "text", emoji: "📍", question: "What is the deponent's full residential address?", aiTip: "Complete current residential address." },
  deponent_age: { type: "number", emoji: "🎂", question: "What is the deponent's age?", aiTip: "Must be 18 or above to make a sworn affidavit.", min: 18, max: 120 },
  statement_purpose: { type: "text", emoji: "🎯", question: "What is the purpose of this affidavit?", aiTip: "E.g., 'Name correction', 'Income declaration', 'Residence proof', 'Identity verification'." },
  statement_details: { type: "textarea", emoji: "📝", question: "What are the facts you are declaring in this affidavit?", aiTip: "State the facts clearly and truthfully. Write in first person. This becomes your sworn legal statement." },
  place: { type: "text", emoji: "📍", question: "At which place/city is this being executed?", aiTip: "City and state where you will sign this document before the Notary." },
  donor_name: { type: "text", emoji: "🎁", question: "What is the donor's (giver's) full name?", aiTip: "Use name as on Aadhaar/PAN." },
  donee_name: { type: "text", emoji: "🎁", question: "What is the donee's (receiver's) full name?", aiTip: "Full legal name of the person receiving the gift." },
  property_description: { type: "textarea", emoji: "🏠", question: "Describe the property being gifted in detail.", aiTip: "Include survey number, plot number, area in sq ft/sq mt, and complete address with boundaries (North, South, East, West)." },
  relationship: { type: "text", emoji: "❤️", question: "What is the relationship between donor and donee?", aiTip: "E.g., 'Father to Son', 'Mother to Daughter'. Gift deeds between close family members typically have lower stamp duty." },
  testator_name: { type: "text", emoji: "📜", question: "What is the testator's (will-maker's) full name?", aiTip: "Your full legal name as appears on Aadhaar/PAN. You are the testator — the person making this Will." },
  testator_address: { type: "text", emoji: "📍", question: "What is the testator's full residential address?" },
  executor_name: { type: "text", emoji: "⚖️", question: "Who will be the executor of this Will?", aiTip: "The executor is responsible for carrying out the instructions in your Will. Choose a trusted person — usually a family member or advocate." },
  beneficiary_details: { type: "textarea", emoji: "👨‍👩‍👧", question: "Who are the beneficiaries and what do they inherit?", aiTip: "List each beneficiary with their full name, relationship, and specific assets/shares they inherit. E.g., 'My son Rahul (full name: Rahul Sharma) shall inherit Flat 4B, XYZ Society'." },
  petitioner_name: { type: "text", emoji: "👤", question: "What is the petitioner's (filing party's) full name?" },
  respondent_name: { type: "text", emoji: "👤", question: "What is the respondent's (other party's) full name?" },
  marriage_date: { type: "date", emoji: "💍", question: "What was the date of marriage?" },
  grounds_for_divorce: { type: "textarea", emoji: "⚖️", question: "What are the grounds for divorce?", aiTip: "Under Hindu Marriage Act: cruelty, desertion (2+ years), conversion, mental disorder, leprosy, venereal disease, renunciation, or not heard of for 7 years." },
  children_details: { type: "textarea", emoji: "👶", question: "Provide details of any children from this marriage.", aiTip: "Name, age, and current custody arrangement. Leave blank if no children." },

  // ── Legal Notices ────────────────────────────────────────
  sender_name: { type: "text", emoji: "✍️", question: "Who is sending this legal notice? (Your full name)", aiTip: "Your full legal name. The notice will be sent from you." },
  sender_address: { type: "text", emoji: "📍", question: "What is the sender's full address?", aiTip: "Your complete address for correspondence and reply." },
  recipient_name: { type: "text", emoji: "👤", question: "To whom is this notice being sent?", aiTip: "Full legal name of the recipient. If a company, use registered company name." },
  recipient_address: { type: "text", emoji: "📮", question: "What is the recipient's address?", aiTip: "Complete address for serving the notice. Send via RPAD (Registered Post with Acknowledgment Due)." },
  notice_subject: { type: "text", emoji: "📋", question: "What is the subject of this legal notice?", aiTip: "E.g., 'Non-payment of dues', 'Recovery of security deposit', 'Breach of contract'." },
  notice_details: { type: "textarea", emoji: "📝", question: "Describe the facts and grievance in detail.", aiTip: "State events chronologically. Include dates, amounts, and prior communications. The more specific, the stronger the notice." },
  demand: { type: "text", emoji: "🎯", question: "What specific action or payment are you demanding?", aiTip: "Be precise: 'Payment of ₹50,000 within 15 days' or 'Vacate the premises by [date]'." },
  response_days: { type: "number", emoji: "📅", question: "How many days to respond?", aiTip: "Standard notice periods: 7 days (urgent), 15 days (typical), 30 days (routine). This starts from date of receipt.", min: 7, max: 90 },
  complainant_name: { type: "text", emoji: "👤", question: "What is the complainant's full name?" },
  incident_date: { type: "date", emoji: "📅", question: "On what date did the incident occur?" },
  incident_place: { type: "text", emoji: "📍", question: "Where did the incident take place?", aiTip: "Full address/location of the incident." },
  incident_description: { type: "textarea", emoji: "📝", question: "Describe the incident in detail (What, Where, When, Who, How)?", aiTip: "Be specific with dates, times, names, and events. This forms the basis of the FIR." },
  police_station: { type: "text", emoji: "🚔", question: "Which police station has jurisdiction?", aiTip: "The police station in the area where the incident occurred." },
  complainant_address: { type: "text", emoji: "📍", question: "What is the complainant's full address?" },
  authority_name: { type: "text", emoji: "🏛️", question: "To which authority/organization is this complaint addressed?", aiTip: "E.g., 'District Consumer Forum', 'Commissioner of Police', 'District Collector'." },
  complaint_subject: { type: "text", emoji: "📋", question: "What is the subject of your complaint?" },
  complaint_details: { type: "textarea", emoji: "📝", question: "Describe your complaint in detail.", aiTip: "State facts chronologically. Include dates, names, and any previous attempts to resolve the issue." },
  relief_sought: { type: "textarea", emoji: "🎯", question: "What relief or remedy are you seeking?", aiTip: "Be specific: refund amount, corrective action, compensation, etc." },
  applicant_name: { type: "text", emoji: "👤", question: "What is the applicant's full name?" },
  applicant_address: { type: "text", emoji: "📍", question: "What is the applicant's full address?" },
  authority_address: { type: "text", emoji: "📮", question: "What is the authority's full address?", aiTip: "Full office address of the Public Information Officer (PIO)." },
  information_sought: { type: "textarea", emoji: "📋", question: "What specific information are you seeking under RTI?", aiTip: "Be specific and numbered. E.g., (1) Copies of all orders passed regarding [matter], (2) Status of application No. XYZ." },

  // ── Employment ───────────────────────────────────────────
  candidate_name: { type: "text", emoji: "👤", question: "What is the candidate's full name?" },
  designation: { type: "text", emoji: "💼", question: "What is the job designation/title?", aiTip: "E.g., 'Senior Software Engineer', 'Marketing Manager', 'Accountant'." },
  salary: { type: "currency", emoji: "💰", prefix: "₹", question: "What is the annual CTC (Cost to Company)?", aiTip: "Total annual compensation package including all components. You can break down the CTC structure in notes." },
  joining_date: { type: "date", emoji: "📅", question: "What is the joining date?" },
  reporting_manager: { type: "text", emoji: "👔", question: "Who is the reporting manager?", aiTip: "Full name and designation of the direct reporting manager." },
  employee_name: { type: "text", emoji: "👤", question: "What is the employee's full name?" },
  probation_period: { type: "number", emoji: "⏱️", suffix: "months", question: "What is the probation period?", aiTip: "Standard is 3–6 months. During probation, shorter notice period applies.", min: 1, max: 12 },
  notice_period: { type: "number", emoji: "📋", suffix: "days", question: "What is the notice period (in days)?", aiTip: "Standard is 30–90 days. During probation, it may be shorter (typically 7–14 days).", min: 7, max: 180 },
  termination_date: { type: "date", emoji: "📅", question: "What is the effective date of termination?" },
  start_date_emp: { type: "date", emoji: "📅", question: "What was the employee's date of joining?" },
  end_date: { type: "date", emoji: "📅", question: "What was the employee's last working day?" },
  performance_note: { type: "text", emoji: "⭐", question: "Add a brief performance note (optional).", aiTip: "E.g., 'diligently', 'satisfactorily', 'with distinction'. Leave blank for a neutral certificate." },
  reason: { type: "text", emoji: "📋", question: "What is the reason?", aiTip: "Keep it brief and professional. For termination: 'performance', 'restructuring', 'mutual agreement'." },

  // ── NOC Letter ──────────────────────────────────────────
  issuer_name: {
    type: "text", emoji: "✍️",
    question: "Who is issuing this NOC? (Your full name / company name)",
    aiTip: "The NOC is issued BY you — use your full legal name or registered company name.",
  },
  property_details: {
    type: "text", emoji: "🏠",
    question: "Describe the property for which this NOC is being issued.",
    aiTip: "Include property address, type (flat/plot/shop), and any survey/plot numbers.",
  },
  vacate_by_date: {
    type: "date", emoji: "📅",
    question: "By what date must the tenant vacate the premises?",
    aiTip: "This is the final date for the tenant to hand over possession. A minimum of 15–30 days notice is customary.",
  },

  // ── Government ───────────────────────────────────────────
  father_name: { type: "text", emoji: "👨", question: "What is your father's full name?", aiTip: "As appears on official documents." },
  address: { type: "text", emoji: "📍", question: "What is your full residential address?", aiTip: "Complete address with house number, street, ward, district, and pin code." },
  annual_income: { type: "currency", emoji: "💰", prefix: "₹", question: "What is the total annual household income?", aiTip: "Include all sources: salary, business, agriculture, etc." },
  caste_category: { type: "select", emoji: "📋", question: "Which caste/category are you applying for?", options: ["SC (Scheduled Caste)", "ST (Scheduled Tribe)", "OBC (Other Backward Class)", "NT (Nomadic Tribe)", "DT (De-notified Tribe)", "SBC (Special Backward Class)"] },
  years_of_residence: { type: "number", emoji: "🏠", suffix: "years", question: "How many years have you been a resident of this state?", aiTip: "Continuous period of domicile. Typically need minimum 3–5 years depending on state.", min: 1, max: 100 },
  head_of_family: { type: "text", emoji: "👤", question: "What is the head of family's full name?" },
  family_members: { type: "textarea", emoji: "👨‍👩‍👧‍👦", question: "List all family members to be included in the ration card.", aiTip: "Format: Name | Age | Relationship | Aadhaar No. (if available). One member per line." },
};

export function getFieldConfig(fieldKey: string): FieldConfig {
  return FIELD_CONFIG[fieldKey] ?? {
    type: "text",
    question: `Enter ${fieldKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
    aiTip: undefined,
  };
}
