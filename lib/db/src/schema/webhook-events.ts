import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Raw Razorpay webhook events, keyed by Razorpay's event id.
 * eventId UNIQUE gives webhook idempotency: a redelivered event inserts
 * zero new rows and is acknowledged without reprocessing.
 */
export const webhookEventsTable = pgTable("webhook_events", {
  id:          uuid("id").primaryKey().defaultRandom(),
  eventId:     text("event_id").notNull().unique(),
  eventType:   text("event_type").notNull(),
  orderId:     text("order_id"),
  paymentId:   text("payment_id"),
  processedAt: timestamp("processed_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
