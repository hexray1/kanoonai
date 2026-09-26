import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { guestDocumentsTable } from "./guest-documents";
import { guestSessionsTable } from "./guest-sessions";

/**
 * 7-day EDIT access tokens (NOT a refund).
 * Issued once per paid document, bound to the document AND the purchasing
 * session. Lets the buyer regenerate the paid document (new version + new
 * PDF) within 7 days of payment. Only the hash is stored.
 */
export const EDIT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const editTokensTable = pgTable("edit_tokens", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tokenHash:  text("token_hash").notNull().unique(),
  documentId: uuid("document_id").notNull().references(() => guestDocumentsTable.id),
  sessionId:  uuid("session_id").references(() => guestSessionsTable.id),
  expiresAt:  timestamp("expires_at").notNull(),
  revoked:    boolean("revoked").notNull().default(false),
  usedCount:  integer("used_count").notNull().default(0),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type EditToken = typeof editTokensTable.$inferSelect;
