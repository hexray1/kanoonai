// Email delivery via Resend — gracefully degrades if RESEND_API_KEY is not set.

let Resend: any;
try { Resend = require("resend").Resend; } catch { Resend = null; }

const resend = Resend && process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Kanoon AI <documents@kanooxai.in>";

function log(msg: string) {
  if (!resend) console.info(`[EmailService] (no RESEND_API_KEY) — skipping: ${msg}`);
}

export async function sendDocumentDelivery({
  to, name, docTitle, docId, pdfBuffer, price,
}: {
  to: string; name: string; docTitle: string; docId: number | string;
  pdfBuffer?: Buffer; price: number;
}): Promise<void> {
  if (!resend) { log(`Document delivery to ${to}`); return; }

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:Arial,sans-serif;background:#f5f5f5;padding:0;margin:0;}
    .wrap{max-width:600px;margin:0 auto;background:white;}
    .header{background:#0a0f1e;padding:24px 32px;}
    .brand{color:#f5c518;font-size:22px;font-weight:800;}
    .body{padding:32px;}
    h2{color:#0a0f1e;margin:0 0 16px;}
    p{color:#444;line-height:1.6;margin:0 0 14px;}
    .doc-box{background:#f8f4e8;border-left:4px solid #f5c518;padding:16px;margin:20px 0;}
    .doc-title{font-weight:700;color:#0a0f1e;font-size:16px;}
    .doc-meta{color:#888;font-size:12px;margin-top:4px;}
    .btn{display:inline-block;background:#f5c518;color:#0a0f1e;padding:12px 28px;font-weight:700;text-decoration:none;border-radius:6px;margin:16px 0;}
    .footer{background:#f0f0f0;padding:16px 32px;font-size:11px;color:#888;}
    </style></head>
    <body><div class="wrap">
    <div class="header"><div class="brand">Kanoon AI</div></div>
    <div class="body">
      <h2>Your document is ready, ${name}! 🎉</h2>
      <p>Your AI-generated legal document has been unlocked and is attached to this email.</p>
      <div class="doc-box">
        <div class="doc-title">${docTitle}</div>
        <div class="doc-meta">Document ID: KAI-${docId} · Paid: ₹${price}</div>
      </div>
      <p>The document is also saved in your Kanoon AI dashboard for future downloads.</p>
      <a href="https://kanooxai.in/dashboard" class="btn">View in Dashboard →</a>
      <p style="font-size:12px;color:#888;margin-top:24px;">
        Disclaimer: This is an AI-generated draft. For legal proceedings or high-value transactions, 
        we recommend having it reviewed by a licensed Advocate.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Kanoon AI Technologies Pvt. Ltd. ·
      <a href="https://kanooxai.in" style="color:#888;">kanooxai.in</a> · 
      <a href="https://kanooxai.in/refund" style="color:#888;">Refund Policy</a>
    </div>
    </div></body></html>
  `;

  try {
    const attachments = pdfBuffer
      ? [{ filename: `${docTitle.replace(/\s+/g, "-")}.pdf`, content: pdfBuffer }]
      : [];

    await resend.emails.send({
      from: FROM, to, subject: `Your ${docTitle} — Kanoon AI`,
      html, attachments,
    });
  } catch (err) {
    console.error("[EmailService] sendDocumentDelivery failed:", err);
  }
}

export async function sendPaymentReceipt({
  to, name, docTitle, amount, paymentId, orderId,
}: {
  to: string; name: string; docTitle: string; amount: number;
  paymentId: string; orderId: string;
}): Promise<void> {
  if (!resend) { log(`Receipt to ${to}`); return; }

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:Arial,sans-serif;background:#f5f5f5;}
    .wrap{max-width:560px;margin:0 auto;background:white;}
    .header{background:#0a0f1e;padding:20px 28px;}
    .brand{color:#f5c518;font-size:18px;font-weight:800;}
    .body{padding:28px;}
    h2{color:#0a0f1e;font-size:18px;margin:0 0 16px;}
    .receipt-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#444;}
    .receipt-row:last-child{border-bottom:none;font-weight:700;color:#0a0f1e;}
    .footer{background:#f0f0f0;padding:14px 28px;font-size:11px;color:#888;}
    </style></head>
    <body><div class="wrap">
    <div class="header"><div class="brand">Kanoon AI</div></div>
    <div class="body">
      <h2>Payment Receipt ✅</h2>
      <div class="receipt-row"><span>Document</span><span>${docTitle}</span></div>
      <div class="receipt-row"><span>Amount Paid</span><span>₹${amount} + GST</span></div>
      <div class="receipt-row"><span>Payment ID</span><span style="font-size:11px">${paymentId}</span></div>
      <div class="receipt-row"><span>Order ID</span><span style="font-size:11px">${orderId}</span></div>
      <div class="receipt-row"><span>Date</span><span>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      <div class="receipt-row"><span>Status</span><span style="color:green">✓ PAID</span></div>
    </div>
    <div class="footer">Kanoon AI Technologies Pvt. Ltd. · GST Invoice available on request</div>
    </div></body></html>
  `;

  try {
    await resend.emails.send({ from: FROM, to, subject: `Payment Receipt — ${docTitle}`, html });
  } catch (err) {
    console.error("[EmailService] sendPaymentReceipt failed:", err);
  }
}

export async function sendAbandonedCheckout({
  to, name, docTitle, price,
}: {
  to: string; name: string; docTitle: string; price: number;
}): Promise<void> {
  if (!resend) { log(`Abandoned checkout to ${to}`); return; }

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:Arial,sans-serif;background:#f5f5f5;}
    .wrap{max-width:560px;margin:0 auto;background:white;}
    .header{background:#0a0f1e;padding:20px 28px;}.brand{color:#f5c518;font-size:18px;font-weight:800;}
    .body{padding:28px;}.btn{display:inline-block;background:#f5c518;color:#0a0f1e;padding:12px 28px;font-weight:700;text-decoration:none;border-radius:6px;margin:16px 0;}
    p{color:#444;line-height:1.6;}
    </style></head>
    <body><div class="wrap">
    <div class="header"><div class="brand">Kanoon AI</div></div>
    <div class="body">
      <p>Hi ${name},</p>
      <p>You were almost done! Your <strong>${docTitle}</strong> draft is saved and ready to unlock for just <strong>₹${price}</strong>.</p>
      <p>One click to download your professionally drafted legal document.</p>
      <a href="https://kanooxai.in/dashboard" class="btn">Complete My Download →</a>
      <p style="font-size:12px;color:#aaa;margin-top:24px;">You generated this document on Kanoon AI. Your draft is saved for 30 days.</p>
    </div>
    </div></body></html>
  `;

  try {
    await resend.emails.send({ from: FROM, to, subject: `Your ${docTitle} is waiting — complete your download`, html });
  } catch (err) {
    console.error("[EmailService] sendAbandonedCheckout failed:", err);
  }
}
