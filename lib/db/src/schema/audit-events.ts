import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Append-only audit trail for money-adjacent events:
 * order.created, payment.verified, payment.captured_webhook,
 * webhook.duplicate, pdf.downloaded, edit.regenerated, etc.
 * Never updated or deleted by application code.
 */
export const auditEventsTable = pgTable("audit_events", {
  id:         uuid("id").primaryKey().defaultRandom(),
  eventType:  text("event_type").notNull(),
  documentId: uuid("document_id"),
  orderId:    text("order_id"),
  paymentId:  text("payment_id"),
  ip:         text("ip"),
  metadata:   jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type AuditEvent = typeof auditEventsTable.$inferSelect;
