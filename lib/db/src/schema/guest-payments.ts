import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { guestOrdersTable } from "./guest-orders";

/**
 * Persistent guest payment records. NEVER deleted.
 * Written once the payment is verified (checkout signature + Razorpay
 * fetch, or payment.captured webhook). razorpayPaymentId is UNIQUE so a
 * retried webhook or a double deliver can never create a second record —
 * this is the idempotency anchor for fulfillment.
 */
export const guestPaymentsTable = pgTable("guest_payments", {
  id:                uuid("id").primaryKey().defaultRandom(),
  orderId:           text("order_id").notNull().references(() => guestOrdersTable.orderId),
  razorpayPaymentId: text("razorpay_payment_id").notNull().unique(),
  amountPaise:       integer("amount_paise").notNull(),
  currency:          text("currency").notNull().default("INR"),
  status:            text("status").notNull().default("captured"), // captured|failed
  source:            text("source").notNull().default("deliver"), // deliver|webhook
  capturedAt:        timestamp("captured_at").defaultNow().notNull(),
  rawEvent:          jsonb("raw_event").$type<Record<string, unknown>>(),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
});

export type GuestPayment = typeof guestPaymentsTable.$inferSelect;
