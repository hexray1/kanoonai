import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { guestDocumentsTable } from "./guest-documents";

/**
 * Immutable versions of a guest document.
 * Every regeneration (including 7-day edit regenerations) appends a row.
 * The latest version is the source of truth for PDF rendering.
 */
export const documentVersionsTable = pgTable("document_versions", {
  id:         uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => guestDocumentsTable.id),
  version:    text("version").notNull().default("1"),
  content:    text("content").notNull(),
  formData:   text("form_data"), // JSON-encoded snapshot
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersionsTable.$inferSelect;
