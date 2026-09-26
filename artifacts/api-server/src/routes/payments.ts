import { Router } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  guestOrdersTable,
  guestDocumentsTable,
  guestPaymentsTable,
  guestSessionsTable,
  documentPdfsTable,
  downloadTokensTable,
  editTokensTable,
  webhookEventsTable,
} from "@workspace/db";
import { generatePDF } from "../utils/pdfGenerator.js";
import { DOCUMENT_PRICES, getDocumentTitle } from "../utils/aiGenerator.js";
import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
  generateToken,
  hashToken,
} from "../utils/tokens.js";
import { audit } from "../utils/audit.js";
import {
  guestOrderRateLimit,
  guestDeliverRateLimit,
  recoverRateLimit,
} from "../middleware/rateLimit.js";

const router = Router();

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
// No fallback: the webhook secret is mandatory. A missing secret must fail
// closed (503), never silently degrade to the API key secret.
const WEBHOOK_SECRET      = process.env.RAZORPAY_WEBHOOK_SECRET || "";
const PAYMENTS_CONFIGURED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
const IS_PROD = process.env.NODE_ENV === "production";

const DOWNLOAD_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EDIT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — edit access, NOT a refund

// ── Helper: create Razorpay order ────────────────────────────────────────────
async function createRazorpayOrder(
  amountPaise: number,
  currency = "INR",
  receipt?: string,
): Promise<{ id: string }> {
  if (!PAYMENTS_CONFIGURED) {
    // Dev only: without Razorpay keys, mint a fake order id. Production
    // refuses outright (503) instead of silently auto-approving payments.
    if (IS_PROD) throw new Error("Payments not configured");
    return { id: `dev_order_${Date.now()}` };
  }
  const creds = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${creds}` },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed: ${res.statusText} — ${body}`);
  }
  return res.json() as Promise<{ id: string }>;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number; // paise
  currency: string;
  status: string;
}

/** Fetch the payment from Razorpay — server-side truth about capture/amount. */
async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment | null> {
  if (!PAYMENTS_CONFIGURED) return null;
  try {
    const creds = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Basic ${creds}` } },
    );
    if (!res.ok) return null;
    return (await res.json()) as RazorpayPayment;
  } catch {
    return null;
  }
}

function deviceKeyOf(req: any): string {
  const raw = String(req.headers["x-guest-token"] ?? "").slice(0, 100);
  return raw || "guest-fallback";
}

async function getSessionId(deviceKey: string): Promise<string> {
  const [row] = await db
    .insert(guestSessionsTable)
    .values({ deviceKey })
    .onConflictDoNothing({ target: guestSessionsTable.deviceKey })
    .returning({ id: guestSessionsTable.id });
  if (row) return row.id;
  const existing = await db
    .select({ id: guestSessionsTable.id })
    .from(guestSessionsTable)
    .where(eq(guestSessionsTable.deviceKey, deviceKey))
    .limit(1);
  return existing[0]!.id;
}

async function issueDownloadToken(documentId: string): Promise<string> {
  const raw = generateToken();
  await db.insert(downloadTokensTable).values({
    tokenHash: hashToken(raw),
    documentId,
    expiresAt: new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS),
  });
  return raw;
}

async function getOrIssueEditToken(
  documentId: string,
  sessionId: string | null | undefined,
): Promise<{ token: string; expiresAt: Date }> {
  const existing = await db
    .select()
    .from(editTokensTable)
    .where(
      and(
        eq(editTokensTable.documentId, documentId),
        eq(editTokensTable.revoked, false),
      ),
    )
    .limit(1);
  const live = existing[0] && existing[0].expiresAt.getTime() > Date.now();
  if (live) return { token: "", expiresAt: existing[0].expiresAt }; // client keeps its copy
  const raw = generateToken();
  const expiresAt = new Date(Date.now() + EDIT_TOKEN_TTL_MS);
  await db.insert(editTokensTable).values({
    tokenHash: hashToken(raw),
    documentId,
    sessionId: sessionId ?? null,
    expiresAt,
  });
  return { token: raw, expiresAt };
}

interface FulfillResult {
  documentId: string;
  pdfBuffer: Buffer;
  downloadToken: string;
  editToken: string; // "" when already issued earlier
  editExpiresAt: Date;
}

/**
 * Idempotent fulfillment: record the payment persistently, render the PDF
 * from the SERVER-STORED document content, store the PDF privately, and
 * issue download + 7-day edit tokens. Safe to call twice for the same
 * payment — the second call replays the first call's result.
 */
async function fulfillOrder(
  orderId: string,
  paymentId: string,
  amountPaise: number,
  currency: string,
  source: "deliver" | "webhook" | "recover",
  req: any,
): Promise<FulfillResult | { error: string; status: number }> {
  const orders = await db
    .select()
    .from(guestOrdersTable)
    .where(eq(guestOrdersTable.orderId, orderId))
    .limit(1);
  const order = orders[0];
  if (!order) return { error: "Unknown or expired order", status: 400 };
  if (!order.documentId) return { error: "Order is not bound to a document", status: 400 };

  // Amount + currency must match the server-side order. Never trust the client.
  if (amountPaise !== order.amount * 100 || currency !== order.currency) {
    await audit("payment.amount_mismatch", {
      orderId, paymentId, ip: req.ip,
      metadata: { expectedPaise: order.amount * 100, gotPaise: amountPaise, currency },
    });
    return { error: "Payment amount mismatch", status: 400 };
  }

  // Idempotency anchor: one row per Razorpay payment, enforced by UNIQUE.
  const prior = await db
    .select()
    .from(guestPaymentsTable)
    .where(eq(guestPaymentsTable.razorpayPaymentId, paymentId))
    .limit(1);
  if (prior.length > 0) {
    // Replay: return the stored artifacts, don't regenerate or double-count.
    const docs = await db
      .select()
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, order.documentId!))
      .limit(1);
    const pdfs = await db
      .select()
      .from(documentPdfsTable)
      .where(eq(documentPdfsTable.documentId, order.documentId!))
      .limit(1);
    if (!docs[0] || !pdfs[0]) return { error: "Payment recorded but artifacts missing", status: 500 };
    const downloadToken = await issueDownloadToken(order.documentId!);
    const edit = await getOrIssueEditToken(order.documentId!, docs[0].sessionId);
    await audit("payment.replay", { orderId, paymentId, documentId: order.documentId!, ip: req.ip });
    return {
      documentId: order.documentId!,
      pdfBuffer: pdfs[0].pdfData,
      downloadToken,
      editToken: edit.token,
      editExpiresAt: edit.expiresAt,
    };
  }

  // Atomically claim the order (pending → paid). Exactly one caller wins;
  // a loser falls back to the replay path above on retry. Orders already
  // marked captured by the webhook are also claimed here.
  const claimed = await db
    .update(guestOrdersTable)
    .set({ status: "paid" })
    .where(and(
      eq(guestOrdersTable.orderId, orderId),
      eq(guestOrdersTable.status, "pending"),
    ))
    .returning({ orderId: guestOrdersTable.orderId });
  if (claimed.length === 0) {
    const recaptured = await db
      .update(guestOrdersTable)
      .set({ status: "paid" })
      .where(and(
        eq(guestOrdersTable.orderId, orderId),
        eq(guestOrdersTable.status, "captured"),
      ))
      .returning({ orderId: guestOrdersTable.orderId });
    if (recaptured.length === 0) {
      // Lost the race after the prior-check: re-read as replay.
      return fulfillOrder(orderId, paymentId, amountPaise, currency, source, req);
    }
  }

  await db.insert(guestPaymentsTable).values({
    orderId,
    razorpayPaymentId: paymentId,
    amountPaise,
    currency,
    status: "captured",
    source,
  }).onConflictDoNothing({ target: guestPaymentsTable.razorpayPaymentId });

  const docs = await db
    .select()
    .from(guestDocumentsTable)
    .where(eq(guestDocumentsTable.id, order.documentId!))
    .limit(1);
  const doc = docs[0];
  if (!doc) return { error: "Document not found", status: 404 };

  // Render the PDF from the SERVER-STORED content — never client-supplied.
  const pdfBuffer = await generatePDF(doc.content, getDocumentTitle(doc.docType), {
    watermark: false,
  });
  await db
    .insert(documentPdfsTable)
    .values({ documentId: doc.id, pdfData: pdfBuffer })
    .onConflictDoNothing({ target: documentPdfsTable.documentId });
  await db
    .update(guestDocumentsTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(guestDocumentsTable.id, doc.id));

  const downloadToken = await issueDownloadToken(doc.id);
  const edit = await getOrIssueEditToken(doc.id, doc.sessionId);

  await audit("payment.fulfilled", {
    orderId, paymentId, documentId: doc.id, ip: req.ip,
    metadata: { source, amountPaise },
  });

  return { documentId: doc.id, pdfBuffer, downloadToken, editToken: edit.token, editExpiresAt: edit.expiresAt };
}

// ── GUEST (no auth): Create payment order ────────────────────────────────────
// The order is bound to an exact server-stored document. Price comes from the
// server registry — the browser cannot choose or influence the amount.
router.post("/guest-create-order", guestOrderRateLimit, async (req, res) => {
  try {
    if (!PAYMENTS_CONFIGURED && IS_PROD) {
      res.status(503).json({ error: "Payments are not configured yet. Please try again later." });
      return;
    }

    const { documentId } = req.body as { documentId: string };
    if (!documentId || typeof documentId !== "string") {
      res.status(400).json({ error: "documentId is required" });
      return;
    }
    const docs = await db
      .select()
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, documentId))
      .limit(1);
    const doc = docs[0];
    if (!doc) {
      res.status(404).json({ error: "Document not found. Please regenerate it." });
      return;
    }
    // The document must belong to this device's session.
    const sessionId = await getSessionId(deviceKeyOf(req));
    if (doc.sessionId !== sessionId) {
      res.status(403).json({ error: "Document does not belong to this session" });
      return;
    }
    if (doc.status === "paid") {
      res.status(400).json({ error: "Document already paid" });
      return;
    }

    const basePrice = DOCUMENT_PRICES[doc.docType] ?? 99;
    const gst = Math.round(basePrice * 0.18);
    const total = basePrice + gst;
    const totalPaise = total * 100;
    const receipt = `guest_${documentId.slice(0, 8)}_${Date.now()}`;

    const order = await createRazorpayOrder(totalPaise, "INR", receipt);

    await db
      .insert(guestOrdersTable)
      .values({
        orderId: order.id,
        documentId: doc.id,
        docType: doc.docType,
        amount: total,
        currency: "INR",
        receipt,
        status: "pending",
      })
      .onConflictDoNothing({ target: guestOrdersTable.orderId });

    await audit("order.created", {
      orderId: order.id, documentId: doc.id, ip: req.ip,
      metadata: { amountPaise: totalPaise },
    });

    res.json({
      orderId: order.id,
      documentId: doc.id,
      amount: total,
      amountPaise: totalPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      basePrice,
      gst,
      total,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── GUEST (no auth): Verify payment + deliver PDF ────────────────────────────
// The frontend sends ONLY the Razorpay result (orderId/paymentId/signature).
// We verify the signature, confirm capture + amount with Razorpay's API,
// then fulfill idempotently from the server-stored document.
router.post("/guest-deliver", guestDeliverRateLimit, async (req, res) => {
  try {
    if (!PAYMENTS_CONFIGURED) {
      // No dev bypass: with no keys there is no real checkout to verify.
      // Production ALSO 503s here — it can never silently auto-approve.
      res.status(503).json({ error: "Payments are not configured yet. Please try again later." });
      return;
    }

    const { orderId, paymentId, signature } = req.body as {
      orderId: string; paymentId: string; signature: string;
    };
    if (!orderId || !paymentId) {
      res.status(400).json({ error: "orderId and paymentId are required" });
      return;
    }

    if (!signature || !verifyCheckoutSignature(orderId, paymentId, signature, RAZORPAY_KEY_SECRET)) {
      await audit("payment.signature_mismatch", { orderId, paymentId, ip: req.ip });
      res.status(400).json({ error: "Payment signature verification failed" });
      return;
    }

    // Server-side truth: fetch the payment from Razorpay and confirm it is
    // captured for THIS order, for the EXACT amount, in INR.
    const rp = await fetchRazorpayPayment(paymentId);
    if (!rp) {
      res.status(502).json({ error: "Could not confirm payment with Razorpay. Please retry." });
      return;
    }
    if (rp.order_id !== orderId || rp.status !== "captured") {
      await audit("payment.not_captured", { orderId, paymentId, ip: req.ip, metadata: { status: rp.status } });
      res.status(400).json({ error: "Payment is not captured for this order" });
      return;
    }

    const result = await fulfillOrder(orderId, paymentId, rp.amount, rp.currency, "deliver", req);
    if ("error" in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    const [titleRow] = await db
      .select({ docType: guestDocumentsTable.docType })
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, result.documentId))
      .limit(1);
    const title = getDocumentTitle(titleRow?.docType ?? "document");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/\s+/g, "-")}.pdf"`);
    res.setHeader("X-Document-Id", result.documentId);
    res.setHeader("X-Download-Token", result.downloadToken);
    if (result.editToken) res.setHeader("X-Edit-Token", result.editToken);
    res.setHeader("X-Edit-Expires-At", result.editExpiresAt.toISOString());
    res.send(result.pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "PDF delivery failed" });
  }
});

// ── GUEST (no auth): Recover a paid order (browser closed before deliver) ────
// Re-verifies with Razorpay and re-issues a download token. Idempotent.
router.post("/guest-recover", recoverRateLimit, async (req, res) => {
  try {
    const { orderId } = req.body as { orderId: string };
    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ error: "orderId is required" });
      return;
    }
    const orders = await db
      .select()
      .from(guestOrdersTable)
      .where(eq(guestOrdersTable.orderId, orderId))
      .limit(1);
    const order = orders[0];
    if (!order || !order.documentId) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    // Only the purchasing session may recover.
    const sessionId = await getSessionId(deviceKeyOf(req));
    const docs = await db
      .select()
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, order.documentId))
      .limit(1);
    if (!docs[0] || docs[0].sessionId !== sessionId) {
      res.status(403).json({ error: "Not authorized for this order" });
      return;
    }

    // Find the verified payment (deliver or webhook path).
    const payments = await db
      .select()
      .from(guestPaymentsTable)
      .where(eq(guestPaymentsTable.orderId, orderId))
      .limit(1);
    let paymentId = payments[0]?.razorpayPaymentId;
    let amountPaise = payments[0]?.amountPaise;
    let currency = payments[0]?.currency;

    if (!paymentId) {
      // No payment recorded yet — check Razorpay for a captured payment on
      // this order (webhook may not have run). Amount/currency must match.
      if (!PAYMENTS_CONFIGURED) {
        res.status(404).json({ error: "No completed payment found for this order" });
        return;
      }
      const creds = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const r = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments`,
        { headers: { Authorization: `Basic ${creds}` } },
      );
      if (!r.ok) {
        res.status(404).json({ error: "No completed payment found for this order" });
        return;
      }
      const list = (await r.json()) as { items?: RazorpayPayment[] };
      const captured = (list.items ?? []).find(
        (p) => p.status === "captured" && p.amount === order.amount * 100 && p.currency === order.currency,
      );
      if (!captured) {
        res.status(404).json({ error: "No completed payment found for this order" });
        return;
      }
      paymentId = captured.id;
      amountPaise = captured.amount;
      currency = captured.currency;
    }

    const result = await fulfillOrder(orderId, paymentId, amountPaise!, currency!, "recover", req);
    if ("error" in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({
      ok: true,
      documentId: result.documentId,
      downloadToken: result.downloadToken,
      downloadUrl: `/api/documents/download/${result.downloadToken}`,
      editToken: result.editToken || undefined,
      editExpiresAt: result.editExpiresAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Recovery failed" });
  }
});

export default router;

// ── Webhook (unauthenticated, Razorpay-signature-verified) ───────────────────
export function createWebhookHandler() {
  const wRouter = Router();

  wRouter.post("/razorpay", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;

    // Fail closed: without the webhook secret we cannot verify anything.
    if (!WEBHOOK_SECRET) {
      res.status(503).json({ error: "Webhook secret not configured" });
      return;
    }
    if (!signature) {
      res.status(400).json({ error: "Missing webhook signature" });
      return;
    }
    // HMAC over the EXACT raw request bytes. No re-serialization fallback —
    // if the raw body is missing, the request cannot be verified.
    const rawBody: Buffer | undefined = (req as any).rawBody;
    if (!rawBody || !verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = req.body?.event as string;
    // V1 canonical event. Everything else is acknowledged and ignored.
    if (event !== "payment.captured") {
      res.json({ status: "ok" });
      return;
    }

    const payment = req.body?.payload?.payment?.entity as
      | { id?: string; order_id?: string; amount?: number; currency?: string; status?: string }
      | undefined;
    const paymentId = payment?.id;
    const orderId = payment?.order_id;
    if (!paymentId || !orderId) {
      res.json({ status: "ok" });
      return;
    }

    // Idempotency: one webhook event is processed exactly once, keyed by
    // event type + Razorpay payment id (unique per payment).
    const dedupeKey = `payment.captured:${paymentId}`;
    let inserted: { id: string }[] = [];
    try {
      inserted = await db
        .insert(webhookEventsTable)
        .values({ eventId: dedupeKey, eventType: "payment.captured", orderId, paymentId })
        .onConflictDoNothing({ target: webhookEventsTable.eventId })
        .returning({ id: webhookEventsTable.id });
    } catch {
      // DB failure on the idempotency write: safest is to acknowledge and
      // NOT process, since we cannot prove it wasn't already processed.
      await audit("webhook.dedupe_write_failed", { orderId, paymentId, ip: req.ip });
      res.json({ status: "ok" });
      return;
    }
    if (inserted.length === 0) {
      await audit("webhook.duplicate", { orderId, paymentId, ip: req.ip });
      res.json({ status: "ok" });
      return;
    }

    try {
      const orders = await db
        .select()
        .from(guestOrdersTable)
        .where(eq(guestOrdersTable.orderId, orderId))
        .limit(1);
      const order = orders[0];
      if (!order) {
        await audit("webhook.unknown_order", { orderId, paymentId, ip: req.ip });
        await db.update(webhookEventsTable)
          .set({ processedAt: new Date() })
          .where(eq(webhookEventsTable.eventId, dedupeKey));
        res.json({ status: "ok" });
        return;
      }

      // The captured amount and currency must match the server-side order.
      const amountPaise = typeof payment.amount === "number" ? payment.amount : -1;
      const currency = payment.currency ?? "";
      if (amountPaise !== order.amount * 100 || currency !== order.currency) {
        await audit("webhook.amount_mismatch", {
          orderId, paymentId, ip: req.ip,
          metadata: { expectedPaise: order.amount * 100, gotPaise: amountPaise, currency },
        });
        await db.update(webhookEventsTable)
          .set({ processedAt: new Date() })
          .where(eq(webhookEventsTable.eventId, dedupeKey));
        // 200: do not retry a payment that will never match; needs human review.
        res.json({ status: "ok" });
        return;
      }

      // Persistent payment record (idempotent) + mark order captured.
      // The row is KEPT — it is the durable order record.
      await db.insert(guestPaymentsTable).values({
        orderId,
        razorpayPaymentId: paymentId,
        amountPaise,
        currency,
        status: "captured",
        source: "webhook",
        rawEvent: req.body as Record<string, unknown>,
      }).onConflictDoNothing({ target: guestPaymentsTable.razorpayPaymentId });

      await db.update(guestOrdersTable)
        .set({ status: "captured" })
        .where(and(
          eq(guestOrdersTable.orderId, orderId),
          eq(guestOrdersTable.status, "pending"),
        ));

      // Ensure the final PDF exists in private storage so the buyer can
      // recover it even if the browser was closed before deliver ran.
      // Never overwrites an existing PDF (a later edit is authoritative).
      if (order.documentId) {
        const docs = await db.select()
          .from(guestDocumentsTable)
          .where(eq(guestDocumentsTable.id, order.documentId))
          .limit(1);
        const existing = await db.select({ documentId: documentPdfsTable.documentId })
          .from(documentPdfsTable)
          .where(eq(documentPdfsTable.documentId, order.documentId))
          .limit(1);
        if (docs[0] && existing.length === 0) {
          try {
            const pdfBuffer = await generatePDF(docs[0].content, getDocumentTitle(docs[0].docType), {
              watermark: false,
            });
            await db.insert(documentPdfsTable)
              .values({ documentId: order.documentId, pdfData: pdfBuffer })
              .onConflictDoNothing({ target: documentPdfsTable.documentId });
            await db.update(guestDocumentsTable)
              .set({ status: "paid", updatedAt: new Date() })
              .where(eq(guestDocumentsTable.id, order.documentId));
          } catch (pdfErr) {
            console.error("Webhook PDF pre-generation failed:", pdfErr);
          }
        }
      }

      await db.update(webhookEventsTable)
        .set({ processedAt: new Date() })
        .where(eq(webhookEventsTable.eventId, dedupeKey));
      await audit("payment.captured_webhook", {
        orderId, paymentId, documentId: order.documentId ?? undefined, ip: req.ip,
        metadata: { amountPaise },
      });
    } catch (err) {
      console.error("Webhook processing error:", err);
    }

    res.json({ status: "ok" });
  });

  return wRouter;
}
