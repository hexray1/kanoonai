import { Router } from "express";
import crypto from "crypto";
import { db, paymentsTable, documentsTable, usersTable, subscriptionsTable, guestOrdersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import { sendDocumentDelivery, sendPaymentReceipt } from "../utils/emailService.js";
import { DOCUMENT_PRICES } from "../utils/aiGenerator.js";
import { guestOrderRateLimit } from "../middleware/rateLimit.js";

const router = Router();

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const WEBHOOK_SECRET      = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;
const PAYMENTS_CONFIGURED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
const IS_PROD = process.env.NODE_ENV === "production";

// ── Guest order registry (DB-backed) ─────────────────────────────────────────
// Replaces the old in-memory pendingGuestOrders Map, which silently broke on
// multi-instance / serverless deployments (paid users got "Unknown or expired
// order"). Orders are single-use: guest-deliver atomically consumes them.

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

// ── GUEST (no auth): Create payment order ────────────────────────────────────
// Price is determined server-side from the document type — cannot be spoofed.
router.post("/guest-create-order", guestOrderRateLimit, async (req, res) => {
  try {
    if (!PAYMENTS_CONFIGURED && IS_PROD) {
      res.status(503).json({ error: "Payments are not configured yet. Please try again later." });
      return;
    }

    const { type } = req.body as { type: string };
    if (!type || typeof type !== "string" || !(type in DOCUMENT_PRICES)) {
      res.status(400).json({ error: "Valid document type is required" });
      return;
    }

    const basePrice = DOCUMENT_PRICES[type] ?? 99;
    const gst       = Math.round(basePrice * 0.18);
    const total     = basePrice + gst;
    const totalPaise = total * 100;

    const order = await createRazorpayOrder(totalPaise, "INR", `guest_${type}_${Date.now()}`);

    // Register the order in the DB so guest-deliver can verify + consume it,
    // even across serverless instances.
    await db.insert(guestOrdersTable).values({
      orderId: order.id,
      docType: type,
      amount: total,
      status: "pending",
    });

    res.json({
      orderId:     order.id,
      amount:      total,
      amountPaise: totalPaise,
      currency:    "INR",
      keyId:       RAZORPAY_KEY_ID || "rzp_test_placeholder",
      basePrice,
      gst,
      total,
    });
  } catch (err: any) {
    (req as any).log?.error({ err }, "guest-create-order error");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── GUEST (no auth): Verify payment + deliver PDF ────────────────────────────
// After Razorpay payment success, frontend sends the document content here.
// We verify the Razorpay signature, then generate and return the PDF directly.
router.post("/guest-deliver", async (req, res) => {
  try {
    if (!PAYMENTS_CONFIGURED && IS_PROD) {
      res.status(503).json({ error: "Payments are not configured yet. Please try again later." });
      return;
    }

    const { orderId, paymentId, signature, content, title } = req.body as {
      orderId: string; paymentId: string; signature: string;
      content: string; title: string;
    };

    if (!orderId || !paymentId || !content || !title) {
      res.status(400).json({ error: "orderId, paymentId, content, and title are required" });
      return;
    }
    if (typeof content !== "string" || content.length > 200_000) {
      res.status(400).json({ error: "Invalid document content" });
      return;
    }

    // Verify Razorpay signature (skip only in non-production dev mode)
    const isDev = !PAYMENTS_CONFIGURED || orderId.startsWith("dev_order_");
    if (!isDev) {
      if (!signature) {
        res.status(400).json({ error: "Payment signature is required" });
        return;
      }
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      if (expected !== signature) {
        (req as any).log?.warn({ orderId, paymentId }, "Guest deliver: signature mismatch");
        res.status(400).json({ error: "Payment signature verification failed" });
        return;
      }

      // Atomically consume the order: exactly one successful delivery per
      // paid order, safe across serverless instances (no replay).
      const consumed = await db
        .delete(guestOrdersTable)
        .where(
          and(
            eq(guestOrdersTable.orderId, orderId),
            eq(guestOrdersTable.status, "pending"),
          ),
        )
        .returning({ orderId: guestOrdersTable.orderId });
      if (consumed.length === 0) {
        (req as any).log?.warn({ orderId }, "Guest deliver: unknown or already-consumed order");
        res.status(400).json({ error: "Unknown or expired order" });
        return;
      }
    }

    // Generate PDF from the submitted content and stream it back
    const pdfBuffer = await generatePDF(content, title, { watermark: false });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    (req as any).log?.error({ err }, "guest-deliver error");
    res.status(500).json({ error: "PDF generation failed" });
  }
});

// ── All routes below require auth ────────────────────────────────────────────
router.use(authMiddleware);

// POST /api/payments/create-order — authenticated users paying for a saved document
router.post("/create-order", async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.body as { documentId: number };
    if (!documentId) {
      res.status(400).json({ error: "documentId is required" });
      return;
    }

    const docs = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.id, documentId), eq(documentsTable.userId, req.userId!)))
      .limit(1);

    if (docs.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    const doc = docs[0];
    if (doc.paid) {
      res.status(400).json({ error: "Document already paid" });
      return;
    }

    const basePrice = doc.price ?? DOCUMENT_PRICES[doc.type] ?? 99;
    const gst       = Math.round(basePrice * 0.18);
    const total     = basePrice + gst;
    const totalPaise = total * 100;

    const order = await createRazorpayOrder(totalPaise, "INR", `doc_${documentId}`);

    // Upsert pending payment record
    const existing = await db.select().from(paymentsTable)
      .where(and(eq(paymentsTable.documentId, documentId), eq(paymentsTable.status, "pending")))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(paymentsTable).values({
        userId:          req.userId!,
        documentId,
        amount:          total,
        razorpayOrderId: order.id,
        status:          "pending",
      });
    } else {
      await db.update(paymentsTable)
        .set({ razorpayOrderId: order.id, amount: total })
        .where(eq(paymentsTable.id, existing[0].id));
    }

    res.json({
      orderId:       order.id,
      amount:        total,
      amountPaise:   totalPaise,
      currency:      "INR",
      keyId:         RAZORPAY_KEY_ID || "rzp_test_placeholder",
      documentTitle: doc.title,
      basePrice,
      gst,
      total,
    });
  } catch (err) {
    req.log.error({ err }, "create-order error");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// POST /api/payments/verify — authenticated users
router.post("/verify", async (req: AuthRequest, res) => {
  try {
    const { orderId, paymentId, signature, documentId } = req.body as {
      orderId: string; paymentId: string; signature: string; documentId: number;
    };

    if (!orderId || !paymentId || !documentId) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    const docs = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.id, documentId), eq(documentsTable.userId, req.userId!)))
      .limit(1);

    if (docs.length === 0) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }
    if (docs[0].paid) {
      res.json({ success: true, document: docs[0], alreadyPaid: true });
      return;
    }

    // Signature verification
    const isDev = !RAZORPAY_KEY_SECRET || orderId.startsWith("dev_order_");
    if (!isDev) {
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      if (expected !== signature) {
        req.log.warn({ orderId, paymentId }, "Payment signature mismatch");
        res.status(400).json({ success: false, error: "Signature verification failed" });
        return;
      }
    }

    await db.update(paymentsTable)
      .set({ razorpayPaymentId: paymentId || "dev_payment", status: "paid" })
      .where(eq(paymentsTable.razorpayOrderId, orderId));

    await db.update(documentsTable).set({ paid: true }).where(eq(documentsTable.id, documentId));

    const updatedDocs = await db.select().from(documentsTable)
      .where(eq(documentsTable.id, documentId)).limit(1);
    const doc = updatedDocs[0];

    // Fire-and-forget: email delivery
    if (doc?.content) {
      const users = await db.select().from(usersTable)
        .where(eq(usersTable.id, req.userId!)).limit(1);
      const user = users[0];

      if (user?.email) {
        Promise.resolve().then(async () => {
          try {
            const pdfBuf = await generatePDF(doc.content ?? "", doc.title, {
              watermark: false, documentId: doc.id,
            });
            await Promise.allSettled([
              sendDocumentDelivery({
                to: user.email!, name: user.name ?? "there",
                docTitle: doc.title, docId: doc.id, pdfBuffer: pdfBuf, price: doc.price ?? 0,
              }),
              sendPaymentReceipt({
                to: user.email!, name: user.name ?? "there",
                docTitle: doc.title, amount: doc.price ?? 0,
                paymentId: paymentId || "dev_payment", orderId,
              }),
            ]);
          } catch (emailErr) {
            req.log.warn({ emailErr }, "Email delivery failed after payment");
          }
        });
      }
    }

    res.json({ success: true, document: doc });
  } catch (err) {
    req.log.error({ err }, "verify payment error");
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// GET /api/payments/history
router.get("/history", async (req: AuthRequest, res) => {
  try {
    const payments = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.userId, req.userId!));
    res.json(payments);
  } catch (err) {
    req.log.error({ err }, "Payment history error");
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

const SUBSCRIPTION_PRICES: Record<string, { amount: number; label: string }> = {
  basic:    { amount: 29900,  label: "Basic Plan"    },
  pro:      { amount: 69900,  label: "Pro Plan"      },
  business: { amount: 199900, label: "Business Plan" },
};

// POST /api/payments/subscription/create
router.post("/subscription/create", async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body as { plan: string };
    const planData = SUBSCRIPTION_PRICES[plan];
    if (!planData) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    const order = await createRazorpayOrder(planData.amount, "INR", `sub_${plan}_${Date.now()}`);

    await db.insert(paymentsTable).values({
      userId:          req.userId!,
      amount:          planData.amount / 100,
      razorpayOrderId: order.id,
      status:          "pending",
      plan,
    });

    res.json({
      orderId:  order.id,
      amount:   planData.amount,
      currency: "INR",
      keyId:    RAZORPAY_KEY_ID || "rzp_test_placeholder",
      label:    planData.label,
    });
  } catch (err) {
    req.log.error({ err }, "Create subscription error");
    res.status(500).json({ error: "Failed to create subscription order" });
  }
});

// POST /api/payments/subscription/verify
router.post("/subscription/verify", async (req: AuthRequest, res) => {
  try {
    const { orderId, paymentId, signature, plan } = req.body as {
      orderId: string; paymentId: string; signature: string; plan: string;
    };

    const isDev = !RAZORPAY_KEY_SECRET || orderId.startsWith("dev_order_");
    if (!isDev) {
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      if (expected !== signature) {
        res.status(400).json({ success: false, error: "Signature verification failed" });
        return;
      }
    }

    await db.update(paymentsTable)
      .set({ razorpayPaymentId: paymentId || "dev_payment", status: "paid" })
      .where(eq(paymentsTable.razorpayOrderId, orderId));

    const planData = SUBSCRIPTION_PRICES[plan];
    const now      = new Date();
    const expires  = new Date(now);
    expires.setMonth(expires.getMonth() + 1);

    await db.insert(subscriptionsTable).values({
      userId:    req.userId!,
      plan,
      status:    "active",
      startDate: now,
      endDate:   expires,
    }).onConflictDoNothing();

    await db.update(usersTable).set({ plan }).where(eq(usersTable.id, req.userId!));

    res.json({ success: true, plan, expires: expires.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Subscription verify error");
    res.status(500).json({ success: false, error: "Subscription verification failed" });
  }
});

export default router;

// ── Webhook (unauthenticated, Razorpay-signature-verified) ───────────────────
export function createWebhookHandler() {
  const wRouter = Router();

  wRouter.post("/razorpay", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;

    // Signature is mandatory. A missing header must NEVER bypass verification.
    if (!WEBHOOK_SECRET) {
      res.status(503).json({ error: "Webhook secret not configured" });
      return;
    }
    if (!signature) {
      res.status(400).json({ error: "Missing webhook signature" });
      return;
    }

    // HMAC over the exact raw request bytes (not re-serialized JSON).
    const rawBody: Buffer | undefined = (req as any).rawBody;
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody ?? Buffer.from(JSON.stringify(req.body)))
      .digest("hex");

    if (signature !== expected) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const event   = req.body?.event as string;
    const payment = req.body?.payload?.payment?.entity;

    if (event === "payment.captured" && payment) {
      const orderId   = payment.order_id as string;
      const paymentId = payment.id as string;
      try {
        await db.update(paymentsTable)
          .set({ razorpayPaymentId: paymentId, status: "paid" })
          .where(eq(paymentsTable.razorpayOrderId, orderId));

        const payments = await db.select().from(paymentsTable)
          .where(eq(paymentsTable.razorpayOrderId, orderId)).limit(1);

        if (payments[0]?.documentId) {
          await db.update(documentsTable).set({ paid: true })
            .where(eq(documentsTable.id, payments[0].documentId));
        }
      } catch (err) {
        console.error("Webhook processing error:", err);
      }
    }

    res.json({ status: "ok" });
  });

  return wRouter;
}
