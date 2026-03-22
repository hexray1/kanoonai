export const DOC_CATEGORIES = [
  { id: 'rental', title: 'Rental & Housing', titleHi: 'किराया और आवास' },
  { id: 'business', title: 'Business & Finance', titleHi: 'व्यापार और वित्त' },
  { id: 'personal', title: 'Personal & Family', titleHi: 'व्यक्तिगत और परिवार' },
  { id: 'legal', title: 'Legal Notices', titleHi: 'कानूनी नोटिस' },
  { id: 'employment', title: 'Employment', titleHi: 'रोज़गार' },
  { id: 'gov', title: 'Government', titleHi: 'सरकारी' },
];

export const DOCUMENTS = {
  'rent-agreement': { category: 'rental', name: 'Rent Agreement', nameHi: 'किरायानामा', price: 199, fields: ['landlord_name', 'landlord_address', 'tenant_name', 'tenant_address', 'property_address', 'monthly_rent', 'deposit_amount', 'start_date', 'duration_months', 'state'] },
  'leave-license': { category: 'rental', name: 'Leave & License', nameHi: 'लीव एंड लाइसेंस', price: 199, fields: ['licensor_name', 'licensee_name', 'property_address', 'monthly_fee', 'deposit', 'duration_months'] },
  'noc-letter': { category: 'rental', name: 'NOC Letter', nameHi: 'अनापत्ति प्रमाण पत्र (NOC)', price: 99, fields: ['issuer_name', 'recipient_name', 'property_details', 'purpose', 'date'] },
  'eviction-notice': { category: 'rental', name: 'Eviction Notice', nameHi: 'बेदखली नोटिस', price: 99, fields: ['landlord_name', 'tenant_name', 'property_address', 'reason', 'vacate_by_date'] },
  
  'partnership-deed': { category: 'business', name: 'Partnership Deed', nameHi: 'साझेदारी विलेख', price: 499, fields: ['partner1_name', 'partner1_address', 'partner2_name', 'partner2_address', 'business_name', 'business_address', 'profit_ratio', 'start_date'] },
  'mou': { category: 'business', name: 'MOU Agreement', nameHi: 'समझौता ज्ञापन (MOU)', price: 499, fields: ['party1_name', 'party2_name', 'purpose', 'effective_date', 'duration'] },
  'invoice': { category: 'business', name: 'Invoice Format', nameHi: 'चालान प्रारूप', price: 99, fields: ['company_name', 'client_name', 'items_description', 'total_amount', 'date'] },
  'nda': { category: 'business', name: 'NDA Agreement', nameHi: 'गोपनीयता समझौता (NDA)', price: 299, fields: ['party1_name', 'party1_company', 'party2_name', 'party2_company', 'effective_date', 'duration', 'jurisdiction'] },

  'affidavit': { category: 'personal', name: 'Affidavit', nameHi: 'शपथ पत्र', price: 199, fields: ['deponent_name', 'deponent_address', 'deponent_age', 'statement_purpose', 'statement_details', 'place', 'date'] },
  'gift-deed': { category: 'personal', name: 'Gift Deed', nameHi: 'उपहार विलेख', price: 499, fields: ['donor_name', 'donee_name', 'property_description', 'relationship', 'date'] },
  'will': { category: 'personal', name: 'Will/Testament', nameHi: 'वसीयत', price: 499, fields: ['testator_name', 'testator_address', 'executor_name', 'beneficiary_details', 'date'] },
  
  'legal-notice': { category: 'legal', name: 'Legal Notice', nameHi: 'कानूनी नोटिस', price: 299, fields: ['sender_name', 'sender_address', 'recipient_name', 'recipient_address', 'notice_subject', 'notice_details', 'demand', 'response_days'] },
  'fir-draft': { category: 'legal', name: 'FIR Draft', nameHi: 'प्राथमिकी (FIR) ड्राफ्ट', price: 199, fields: ['complainant_name', 'incident_date', 'incident_place', 'incident_description', 'police_station'] },
  'rti': { category: 'legal', name: 'RTI Application', nameHi: 'आरटीआई आवेदन', price: 99, fields: ['applicant_name', 'applicant_address', 'authority_name', 'authority_address', 'information_sought', 'date'] },

  'offer-letter': { category: 'employment', name: 'Offer Letter', nameHi: 'प्रस्ताव पत्र', price: 99, fields: ['company_name', 'candidate_name', 'designation', 'salary', 'joining_date', 'reporting_manager'] },
  'emp-contract': { category: 'employment', name: 'Employment Contract', nameHi: 'रोज़गार अनुबंध', price: 199, fields: ['company_name', 'employee_name', 'designation', 'salary', 'probation_period', 'notice_period'] },
  
  'income-cert': { category: 'gov', name: 'Income Certificate App', nameHi: 'आय प्रमाण पत्र आवेदन', price: 99, fields: ['applicant_name', 'father_name', 'address', 'annual_income', 'purpose'] },
};

export const FIELD_LABELS: Record<string, {en: string, hi: string, placeholder: string}> = {
  landlord_name: { en: 'Landlord Name', hi: 'मकान मालिक का नाम', placeholder: 'Rajesh Kumar' },
  landlord_address: { en: 'Landlord Address', hi: 'मकान मालिक का पता', placeholder: '123, Vasant Kunj, New Delhi' },
  tenant_name: { en: 'Tenant Name', hi: 'किरायेदार का नाम', placeholder: 'Amit Sharma' },
  tenant_address: { en: 'Tenant Permanent Address', hi: 'किरायेदार का स्थायी पता', placeholder: '45, Civil Lines, Jaipur' },
  property_address: { en: 'Property Address', hi: 'संपत्ति का पता', placeholder: 'Flat 4B, XYZ Apartments, Delhi' },
  monthly_rent: { en: 'Monthly Rent (₹)', hi: 'मासिक किराया (₹)', placeholder: '15000' },
  deposit_amount: { en: 'Security Deposit (₹)', hi: 'सुरक्षा जमा (₹)', placeholder: '30000' },
  start_date: { en: 'Start Date', hi: 'शुरू होने की तिथि', placeholder: 'YYYY-MM-DD' },
  duration_months: { en: 'Duration (Months)', hi: 'अवधि (महीने)', placeholder: '11' },
  state: { en: 'State', hi: 'राज्य', placeholder: 'Delhi' },
  partner1_name: { en: 'Partner 1 Name', hi: 'साझेदार 1 का नाम', placeholder: 'Rohan Gupta' },
  partner2_name: { en: 'Partner 2 Name', hi: 'साझेदार 2 का नाम', placeholder: 'Vikram Singh' },
  business_name: { en: 'Business Name', hi: 'व्यापार का नाम', placeholder: 'TechNova Solutions' },
  profit_ratio: { en: 'Profit Ratio (e.g. 50:50)', hi: 'लाभ अनुपात', placeholder: '50:50' },
  deponent_name: { en: 'Deponent Name', hi: 'शपथकर्ता का नाम', placeholder: 'Suresh Verma' },
  statement_purpose: { en: 'Purpose of Affidavit', hi: 'शपथ पत्र का उद्देश्य', placeholder: 'Address Proof Change' },
  statement_details: { en: 'Statement Details', hi: 'बयान का विवरण', placeholder: 'I hereby declare that...' },
  company_name: { en: 'Company Name', hi: 'कंपनी का नाम', placeholder: 'Acme Corp' },
  salary: { en: 'Annual Salary (₹)', hi: 'वार्षिक वेतन (₹)', placeholder: '600000' },
};
