import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Guest (no-account) Razorpay orders.
 * Replaces the old in-memory pendingGuestOrders Map, which broke on
 * multi-instance / serverless deployments (Vercel).
 */
export const guestOrdersTable = pgTable("guest_orders", {
  orderId:   text("order_id").primaryKey(),
  docType:   text("doc_type").notNull(),
  amount:    integer("amount").notNull(), // rupees, incl. GST
  status:    text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GuestOrder = typeof guestOrdersTable.$inferSelect;
