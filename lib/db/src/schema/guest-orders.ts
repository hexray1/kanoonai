import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { guestDocumentsTable } from "./guest-documents";

/**
 * Guest (no-account) Razorpay orders — the payment_orders entity.
 * Replaces the old in-memory pendingGuestOrders Map, which broke on
 * multi-instance / serverless deployments (Vercel).
 * Rows are NEVER deleted: status moves pending → paid/captured/failed and
 * the row remains the persistent order record.
 */
export const guestOrdersTable = pgTable("guest_orders", {
  orderId:    text("order_id").primaryKey(), // Razorpay order id (unguessable)
  documentId: uuid("document_id").references(() => guestDocumentsTable.id),
  docType:    text("doc_type").notNull(),
  amount:     integer("amount").notNull(), // rupees, incl. GST
  currency:   text("currency").notNull().default("INR"),
  receipt:    text("receipt"),
  status:     text("status").notNull().default("pending"), // pending|paid|captured|failed
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type GuestOrder = typeof guestOrdersTable.$inferSelect;
