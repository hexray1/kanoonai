import { db, auditEventsTable } from "@workspace/db";

export interface AuditFields {
  documentId?: string;
  orderId?: string;
  paymentId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit log. Never throws — audit must not break the request
 * it observes. Fire-and-forget at call sites is fine; awaiting is fine too.
 */
export async function audit(eventType: string, fields: AuditFields = {}): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      eventType,
      documentId: fields.documentId,
      orderId: fields.orderId,
      paymentId: fields.paymentId,
      ip: fields.ip,
      metadata: fields.metadata,
    });
  } catch {
    // Audit is best-effort by design.
  }
}
