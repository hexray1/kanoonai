import { Router } from "express";
import crypto from "crypto";
import { db, paymentsTable, documentsTable, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

const SUBSCRIPTION_PRICES: Record<string, number> = {
  basic: 29900,
  pro: 69900,
  business: 199900,
};

async function createRazorpayOrder(amount: number, currency: string = "INR"): Promise<{ id: string }> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return { id: `dev_order_${Date.now()}` };
  }

  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({ amount, currency, receipt: `receipt_${Date.now()}` }),
  });

  if (!response.ok) {
    throw new Error(`Razorpay order creation failed: ${response.statusText}`);
  }

  return response.json() as Promise<{ id: string }>;
}

router.use(authMiddleware);

router.post("/create-order", async (req: AuthRequest, res) => {
  try {
    const { documentId, amount } = req.body as { documentId: number; amount: number };

    if (!documentId || !amount) {
      res.status(400).json({ error: "Document ID and amount are required" });
      return;
    }

    const docs = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.id, documentId), eq(documentsTable.userId, req.userId!)))
      .limit(1);

    if (docs.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const order = await createRazorpayOrder(amount * 100);

    await db.insert(paymentsTable).values({
      userId: req.userId!,
      documentId,
      amount,
      razorpayOrderId: order.id,
      status: "pending",
    });

    res.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID || "rzp_test_placeholder",
    });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/verify", async (req: AuthRequest, res) => {
  try {
    const { orderId, paymentId, signature, documentId } = req.body as {
      orderId: string;
      paymentId: string;
      signature: string;
      documentId: number;
    };

    if (!RAZORPAY_KEY_SECRET || orderId.startsWith("dev_order_")) {
      await db.update(paymentsTable)
        .set({ razorpayPaymentId: paymentId || "dev_payment", status: "paid" })
        .where(eq(paymentsTable.razorpayOrderId, orderId));

      await db.update(documentsTable)
        .set({ paid: true })
        .where(eq(documentsTable.id, documentId));

      const docs = await db.select().from(documentsTable).where(eq(documentsTable.id, documentId)).limit(1);
      res.json({ success: true, document: docs[0] });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      res.status(400).json({ success: false, error: "Payment verification failed" });
      return;
    }

    await db.update(paymentsTable)
      .set({ razorpayPaymentId: paymentId, status: "paid" })
      .where(eq(paymentsTable.razorpayOrderId, orderId));

    await db.update(documentsTable)
      .set({ paid: true })
      .where(eq(documentsTable.id, documentId));

    const docs = await db.select().from(documentsTable).where(eq(documentsTable.id, documentId)).limit(1);
    res.json({ success: true, document: docs[0] });
  } catch (err) {
    req.log.error({ err }, "Verify payment error");
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

router.get("/history", async (req: AuthRequest, res) => {
  try {
    const payments = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.userId, req.userId!));
    res.json(payments);
  } catch (err) {
    req.log.error({ err }, "Payment history error");
    res.status(500).json({ error: "Failed to get payment history" });
  }
});

router.post("/subscription/create", async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body as { plan: string };
    const amount = SUBSCRIPTION_PRICES[plan];

    if (!amount) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    const order = await createRazorpayOrder(amount);

    await db.insert(paymentsTable).values({
      userId: req.userId!,
      amount: amount / 100,
      razorpayOrderId: order.id,
      status: "pending",
      plan,
    });

    res.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID || "rzp_test_placeholder",
    });
  } catch (err) {
    req.log.error({ err }, "Create subscription error");
    res.status(500).json({ error: "Failed to create subscription order" });
  }
});

export default router;
