// Client-side live preview templates — render instantly as user types.
// These are simplified previews. Full AI-generated content is unlocked after payment.

function esc(v?: string): string {
  if (!v || v.trim() === "") return '<span class="blank">___________</span>';
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function filled(v?: string): boolean {
  return !!(v && v.trim() !== "");
}

const PREVIEW_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11px;
    line-height: 1.7;
    color: #1a1a2e;
    background: #f5f5f0;
    padding: 0;
  }
  .paper {
    background: white;
    max-width: 720px;
    margin: 0 auto;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  }
  .header {
    background: #0a0f1e;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .logo-box {
    width: 28px; height: 28px;
    background: #f5c518;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 14px; color: #0a0f1e;
    font-family: 'Helvetica Neue', sans-serif;
  }
  .brand-name { color: #f5c518; font-family: 'Helvetica Neue', sans-serif; font-size: 13px; font-weight: 800; }
  .brand-sub { color: #888; font-family: 'Helvetica Neue', sans-serif; font-size: 8px; letter-spacing: 1.2px; text-transform: uppercase; }
  .header-right { text-align: right; }
  .header-right .site { color: #f5c518; font-size: 9px; font-family: 'Helvetica Neue', sans-serif; font-weight: 700; }
  .header-right .verified { color: #666; font-size: 7.5px; font-family: 'Helvetica Neue', sans-serif; }
  .gold-line { height: 3px; background: #f5c518; }
  .doc-body { padding: 28px 36px 60px; }
  .title-block {
    background: #f8f4e8;
    border-left: 4px solid #f5c518;
    padding: 14px 18px;
    margin-bottom: 22px;
  }
  .doc-title {
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: #0a0f1e;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .doc-meta {
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 8px;
    color: #888;
    margin-top: 5px;
  }
  .section { margin-bottom: 16px; }
  .section-heading {
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #0a0f1e;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #eee;
  }
  .party-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 14px 0;
  }
  .party-box {
    border: 1px solid #e8e8e0;
    padding: 12px;
    background: #fafaf8;
  }
  .party-label {
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 8px;
    font-weight: 700;
    color: #f5c518;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .party-name { font-size: 12px; font-weight: 700; color: #0a0f1e; }
  .party-addr { font-size: 10px; color: #666; margin-top: 3px; }
  .terms-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 14px 0;
  }
  .term-box {
    background: #f8f4e8;
    border: 1px solid #e8d99a;
    padding: 10px;
    text-align: center;
  }
  .term-label { font-family: 'Helvetica Neue', sans-serif; font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.6px; }
  .term-value { font-size: 14px; font-weight: 800; color: #0a0f1e; margin-top: 3px; }
  .clause-text { font-size: 10.5px; line-height: 1.8; color: #333; margin-bottom: 10px; text-align: justify; }
  .clause-num { font-weight: 700; color: #0a0f1e; }
  .blank { 
    display: inline-block;
    border-bottom: 1.5px solid #ccc;
    min-width: 80px;
    color: #bbb;
    font-style: italic;
  }
  .locked-section {
    position: relative;
    margin-top: 24px;
    border-top: 2px dashed #e0d9c0;
    padding-top: 16px;
  }
  .locked-blur {
    filter: blur(4px);
    user-select: none;
    pointer-events: none;
    opacity: 0.5;
    font-size: 10.5px;
    line-height: 2;
    color: #333;
    max-height: 160px;
    overflow: hidden;
  }
  .locked-overlay {
    position: absolute;
    top: 16px; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.95) 40%);
    z-index: 10;
  }
  .locked-badge {
    background: #0a0f1e;
    color: #f5c518;
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 10px;
    font-weight: 700;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .locked-sub {
    font-family: 'Helvetica Neue', sans-serif;
    font-size: 9px;
    color: #888;
    margin-top: 6px;
    text-align: center;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 90px;
    font-weight: 900;
    font-family: 'Helvetica Neue', sans-serif;
    color: rgba(0,0,0,0.035);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 6px;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 24px;
  }
  .sig-box { text-align: center; }
  .sig-line { border-bottom: 1.5px solid #333; margin-bottom: 6px; height: 32px; }
  .sig-label { font-size: 8px; color: #888; font-family: 'Helvetica Neue', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer {
    position: sticky;
    bottom: 0;
    background: #0a0f1e;
    padding: 8px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 2px solid #f5c518;
  }
  .footer-legal { color: #555; font-size: 7.5px; font-family: 'Helvetica Neue', sans-serif; }
  .footer-brand { color: #f5c518; font-size: 8px; font-weight: 700; font-family: 'Helvetica Neue', sans-serif; }
`;

function wrapDocument(title: string, body: string, docId: string): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — A2z Kanoon AI Preview</title>
<style>${PREVIEW_CSS}</style>
</head>
<body>
<div class="watermark">DRAFT PREVIEW</div>
<div class="paper">
  <div class="header">
    <div class="header-brand">
      <div class="logo-box">K</div>
      <div>
        <div class="brand-name">A2z Kanoon AI</div>
        <div class="brand-sub">India's AI Legal Platform</div>
      </div>
    </div>
    <div class="header-right">
      <div class="site">kanooxai.in</div>
      <div class="verified">DRAFT PREVIEW · ${date}</div>
    </div>
  </div>
  <div class="gold-line"></div>
  <div class="doc-body">
    <div class="title-block">
      <div class="doc-title">${title}</div>
      <div class="doc-meta">Document ID: ${docId} &nbsp;|&nbsp; Date: ${date} &nbsp;|&nbsp; Jurisdiction: India</div>
    </div>
    ${body}
  </div>
  <div class="footer">
    <div class="footer-legal">Generated by A2z Kanoon AI · Draft only — not a substitute for professional legal advice</div>
    <div class="footer-brand">kanooxai.in</div>
  </div>
</div>
</body></html>`;
}

function lockedSection(clauses: string[]): string {
  return `
  <div class="locked-section">
    <div class="locked-blur">
      ${clauses.map((c, i) => `<p><span class="clause-num">${i + 1}.</span> ${c}</p>`).join("")}
    </div>
    <div class="locked-overlay">
      <div class="locked-badge">🔒 Full Document Locked</div>
      <div class="locked-sub">All clauses, legal provisions, and signature blocks<br/>unlock after payment. Free to preview this summary.</div>
    </div>
  </div>`;
}

// ── RENT AGREEMENT ────────────────────────────────────────────────────────────
function rentAgreementPreview(f: Record<string, string>): string {
  const docId = `KAI-RA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const months = f.duration_months || "11";
  const endDate = (() => {
    try {
      if (!f.start_date) return "___________";
      const d = new Date(f.start_date);
      d.setMonth(d.getMonth() + parseInt(months));
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch { return "___________"; }
  })();

  const body = `
    <div class="section">
      <div class="section-heading">Parties to this Agreement</div>
      <div class="party-row">
        <div class="party-box">
          <div class="party-label">🏠 Landlord / Lessor</div>
          <div class="party-name">${esc(f.landlord_name)}</div>
          <div class="party-addr">${esc(f.landlord_address)}</div>
        </div>
        <div class="party-box">
          <div class="party-label">👤 Tenant / Lessee</div>
          <div class="party-name">${esc(f.tenant_name)}</div>
          <div class="party-addr">${esc(f.tenant_address)}</div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-heading">Property Details</div>
      <p class="clause-text">The property being let out is situated at: <strong>${esc(f.property_address)}</strong>, located in the state of ${esc(f.state)}.</p>
    </div>
    <div class="section">
      <div class="section-heading">Key Financial Terms</div>
      <div class="terms-grid">
        <div class="term-box">
          <div class="term-label">Monthly Rent</div>
          <div class="term-value">${filled(f.monthly_rent) ? `₹${Number(f.monthly_rent).toLocaleString("en-IN")}` : esc(f.monthly_rent)}</div>
        </div>
        <div class="term-box">
          <div class="term-label">Security Deposit</div>
          <div class="term-value">${filled(f.deposit_amount) ? `₹${Number(f.deposit_amount).toLocaleString("en-IN")}` : esc(f.deposit_amount)}</div>
        </div>
        <div class="term-box">
          <div class="term-label">Duration</div>
          <div class="term-value">${months} Months</div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-heading">Term of Agreement</div>
      <p class="clause-text">This Rent Agreement shall commence on <strong>${esc(f.start_date)}</strong> and expire on <strong>${endDate}</strong>, for a period of <strong>${months} calendar months</strong>.</p>
    </div>
    <div class="section">
      <div class="section-heading">Preview Clauses</div>
      <p class="clause-text"><span class="clause-num">1.</span> The Tenant shall pay a monthly rent of ₹${filled(f.monthly_rent) ? Number(f.monthly_rent).toLocaleString("en-IN") : "___"} on or before the 5th day of each calendar month.</p>
      <p class="clause-text"><span class="clause-num">2.</span> A security deposit of ₹${filled(f.deposit_amount) ? Number(f.deposit_amount).toLocaleString("en-IN") : "___"} has been paid and shall be refunded within 30 days of vacation subject to deductions.</p>
      <p class="clause-text"><span class="clause-num">3.</span> The Tenant shall use the premises for <strong>residential purposes only</strong>.</p>
    </div>
    ${lockedSection([
      "The Tenant shall not sublet or assign the premises to any other person without prior written consent of the Landlord.",
      "The Tenant shall maintain the property in good condition and shall not make structural alterations without permission.",
      "On expiry or termination of this Agreement, the Tenant shall peacefully vacate the premises and hand over possession.",
      "Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts at [city].",
      "The Tenant shall bear electricity, water, and other utility charges separately unless agreed otherwise.",
      "Witness attestation, notarization block, and 2-witness signature section included.",
    ])}
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Landlord: ${esc(f.landlord_name)}</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Tenant: ${esc(f.tenant_name)}</div></div>
    </div>`;

  return wrapDocument("Rent Agreement", body, docId);
}

// ── NDA ───────────────────────────────────────────────────────────────────────
function ndaPreview(f: Record<string, string>): string {
  const docId = `KAI-NDA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = `
    <div class="section">
      <div class="section-heading">Parties</div>
      <div class="party-row">
        <div class="party-box">
          <div class="party-label">⬤ Disclosing Party</div>
          <div class="party-name">${esc(f.party1_name)}</div>
          <div class="party-addr">${esc(f.party1_company)}</div>
        </div>
        <div class="party-box">
          <div class="party-label">⬤ Receiving Party</div>
          <div class="party-name">${esc(f.party2_name)}</div>
          <div class="party-addr">${esc(f.party2_company)}</div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-heading">Key Terms</div>
      <div class="terms-grid">
        <div class="term-box"><div class="term-label">Effective Date</div><div class="term-value" style="font-size:11px">${esc(f.effective_date)}</div></div>
        <div class="term-box"><div class="term-label">Duration</div><div class="term-value" style="font-size:11px">${esc(f.duration)}</div></div>
        <div class="term-box"><div class="term-label">Jurisdiction</div><div class="term-value" style="font-size:11px">${esc(f.jurisdiction)}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-heading">Confidentiality Obligations (Preview)</div>
      <p class="clause-text"><span class="clause-num">1.</span> "Confidential Information" means any and all non-public information disclosed by the Disclosing Party, including but not limited to technical data, trade secrets, business plans, and financial data.</p>
      <p class="clause-text"><span class="clause-num">2.</span> The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third party without prior written consent.</p>
    </div>
    ${lockedSection([
      "Exclusions from Confidential Information: information already in public domain, independently developed by Receiving Party.",
      "Receiving Party's obligations shall survive termination of this Agreement for a period of 2 years.",
      "Upon termination, all Confidential Information shall be returned or destroyed upon written request.",
      "Remedies: The parties acknowledge that breach would cause irreparable harm entitling the Disclosing Party to seek injunctive relief.",
      "Governing Law: This Agreement shall be governed by the laws of India; jurisdiction at " + (f.jurisdiction || "[City]"),
    ])}
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">${esc(f.party1_name)}</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">${esc(f.party2_name)}</div></div>
    </div>`;
  return wrapDocument("Non-Disclosure Agreement", body, docId);
}

// ── AFFIDAVIT ─────────────────────────────────────────────────────────────────
function affidavitPreview(f: Record<string, string>): string {
  const docId = `KAI-AFF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = `
    <div class="section">
      <div class="section-heading">Deponent Details</div>
      <div class="party-box" style="max-width:360px">
        <div class="party-label">👤 Deponent</div>
        <div class="party-name">${esc(f.deponent_name)}</div>
        <div class="party-addr">Age: ${esc(f.deponent_age)} years &nbsp;|&nbsp; ${esc(f.deponent_address)}</div>
      </div>
    </div>
    <div class="section">
      <div class="section-heading">Sworn Statement</div>
      <p class="clause-text">I, <strong>${esc(f.deponent_name)}</strong>, aged <strong>${esc(f.deponent_age)}</strong> years, residing at <strong>${esc(f.deponent_address)}</strong>, do hereby solemnly affirm and state as follows:</p>
      <p class="clause-text"><span class="clause-num">1.</span> That the purpose of this affidavit is: <strong>${esc(f.statement_purpose)}</strong></p>
      <p class="clause-text"><span class="clause-num">2.</span> ${filled(f.statement_details) ? esc(f.statement_details).substring(0, 300) + (f.statement_details.length > 300 ? "..." : "") : '<span class="blank">Your statement will appear here</span>'}</p>
      <p class="clause-text"><span class="clause-num">3.</span> That the above facts are true and correct to the best of my knowledge and belief.</p>
    </div>
    ${lockedSection([
      "Verification clause: Verified at [place] on this [date], that the contents are true and correct.",
      "Deponent signature block with name and date.",
      "Notary Public / Oath Commissioner attestation block.",
      "Court stamp affixing area and notary seal space.",
    ])}
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Deponent: ${esc(f.deponent_name)}</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Notary / Oath Commissioner</div></div>
    </div>`;
  return wrapDocument("Affidavit", body, docId);
}

// ── LEGAL NOTICE ─────────────────────────────────────────────────────────────
function legalNoticePreview(f: Record<string, string>): string {
  const docId = `KAI-LN-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = `
    <div class="section">
      <p class="clause-text" style="text-align:right">Date: ${esc(f.date) !== "___________" ? esc(f.date) : new Date().toLocaleDateString("en-IN")}</p>
      <p class="clause-text"><strong>TO,</strong><br/>${esc(f.recipient_name)}<br/>${esc(f.recipient_address)}</p>
    </div>
    <div class="section">
      <div class="section-heading">Subject: ${esc(f.notice_subject) !== "___________" ? esc(f.notice_subject) : "Legal Notice"}</div>
      <p class="clause-text"><strong>Dear ${esc(f.recipient_name)},</strong></p>
      <p class="clause-text">Under instructions from and on behalf of my client <strong>${esc(f.sender_name)}</strong>, residing at <strong>${esc(f.sender_address)}</strong>, I do hereby serve you with the following legal notice:</p>
      <p class="clause-text">${filled(f.notice_details) ? esc(f.notice_details).substring(0, 300) + "..." : '<span class="blank">Your notice details will appear here</span>'}</p>
    </div>
    <div class="section">
      <div class="section-heading">Demand</div>
      <p class="clause-text">${esc(f.demand) !== "___________" ? `You are hereby called upon to <strong>${esc(f.demand)}</strong> within <strong>${esc(f.response_days) || "15"} days</strong> of receipt of this notice.` : '<span class="blank">Your demand will appear here</span>'}</p>
    </div>
    ${lockedSection([
      "Consequences of non-compliance including legal action under applicable laws.",
      "Reservation of right to initiate civil/criminal proceedings without further notice.",
      "Advocate's complete name, registration number, and signature block.",
      "RPAD dispatch instructions and acknowledgment tracking details.",
    ])}
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Advocate for ${esc(f.sender_name)}</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Place: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date:</div></div>
    </div>`;
  return wrapDocument("Legal Notice", body, docId);
}

// ── OFFER LETTER ─────────────────────────────────────────────────────────────
function offerLetterPreview(f: Record<string, string>): string {
  const docId = `KAI-OL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = `
    <div class="section">
      <p class="clause-text" style="text-align:right">Date: ${new Date().toLocaleDateString("en-IN")}</p>
      <p class="clause-text"><strong>TO,</strong><br/>${esc(f.candidate_name)}</p>
    </div>
    <div class="section">
      <div class="section-heading">Subject: Offer of Employment</div>
      <p class="clause-text">Dear <strong>${esc(f.candidate_name)}</strong>,</p>
      <p class="clause-text">We are pleased to offer you the position of <strong>${esc(f.designation)}</strong> at <strong>${esc(f.company_name)}</strong>. This offer is subject to the following terms and conditions:</p>
    </div>
    <div class="section">
      <div class="section-heading">Key Terms</div>
      <div class="terms-grid">
        <div class="term-box"><div class="term-label">Designation</div><div class="term-value" style="font-size:11px">${esc(f.designation)}</div></div>
        <div class="term-box"><div class="term-label">Annual CTC</div><div class="term-value" style="font-size:11px">${filled(f.salary) ? `₹${Number(f.salary).toLocaleString("en-IN")}` : esc(f.salary)}</div></div>
        <div class="term-box"><div class="term-label">Joining Date</div><div class="term-value" style="font-size:11px">${esc(f.joining_date)}</div></div>
      </div>
    </div>
    ${lockedSection([
      "CTC breakup: Basic salary, HRA, special allowance, and variable pay components.",
      "Probation period of 3 months with review and confirmation process.",
      "Notice period, leave policy, and other terms of employment.",
      "Confidentiality, IP assignment, and non-solicitation clauses.",
      "HR authorization block and company seal.",
    ])}
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">HR / Authorized Signatory<br/>${esc(f.company_name)}</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Accepted by: ${esc(f.candidate_name)}</div></div>
    </div>`;
  return wrapDocument("Offer Letter", body, docId);
}

// ── GENERIC FALLBACK ─────────────────────────────────────────────────────────
function genericPreview(title: string, f: Record<string, string>): string {
  const docId = `KAI-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const entries = Object.entries(f).filter(([, v]) => v && v.trim());
  const body = `
    <div class="section">
      <div class="section-heading">Document Details</div>
      ${entries.length === 0
        ? "<p class=\"clause-text\">Fill in the form on the left to see your document preview here in real-time.</p>"
        : `<table style="width:100%;border-collapse:collapse;font-size:10.5px">
          ${entries.map(([k, v]) => `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:7px 10px;color:#666;text-transform:capitalize;white-space:nowrap;width:40%">${k.replace(/_/g, " ")}</td>
              <td style="padding:7px 10px;color:#1a1a2e;font-weight:600">${esc(v)}</td>
            </tr>`).join("")}
          </table>`
      }
    </div>
    ${lockedSection([
      "All standard legal clauses, obligations, and representations applicable to this document type.",
      "Proper jurisdiction, governing law, and dispute resolution clauses.",
      "Witness attestation, signature blocks, and notarization area.",
      "Stamp duty advisory and registration guidance.",
    ])}`;
  return wrapDocument(title, body, docId);
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export function buildDocumentPreview(
  docType: string,
  formData: Record<string, string>,
  docTitle: string,
): string {
  try {
    switch (docType) {
      case "rent-agreement":   return rentAgreementPreview(formData);
      case "leave-license":    return rentAgreementPreview(formData); // similar structure
      case "nda":              return ndaPreview(formData);
      case "affidavit":        return affidavitPreview(formData);
      case "legal-notice":     return legalNoticePreview(formData);
      case "offer-letter":     return offerLetterPreview(formData);
      default:                 return genericPreview(docTitle, formData);
    }
  } catch {
    return genericPreview(docTitle, formData);
  }
}
