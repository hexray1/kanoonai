import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { guestSessionsTable } from "./guest-sessions";

/**
 * Guest-generated legal documents (no account).
 * The AI output is persisted server-side at generation time so the
 * post-payment PDF is rendered from OUR stored copy — the client is never
 * trusted to supply final document content after payment.
 */
export const guestDocumentsTable = pgTable("guest_documents", {
  id:              uuid("id").primaryKey().defaultRandom(),
  sessionId:       uuid("session_id").references(() => guestSessionsTable.id),
  docType:         text("doc_type").notNull(),
  formData:        jsonb("form_data").$type<Record<string, unknown>>().notNull(),
  content:         text("content").notNull(), // AI-generated, server-stored
  language:        text("language").notNull().default("en"),
  templateVersion: text("template_version"),
  promptVersion:   text("prompt_version"),
  legalVersion:    text("legal_version"),
  pricePaise:      integer("price_paise").notNull(), // incl. GST, at generation time
  status:          text("status").notNull().default("draft"), // draft|paid
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

export type GuestDocument = typeof guestDocumentsTable.$inferSelect;
