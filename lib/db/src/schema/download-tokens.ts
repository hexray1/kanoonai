import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { guestDocumentsTable } from "./guest-documents";

/**
 * Secure download tokens. Only the SHA-256 hash is stored — the raw token
 * is shown to the client once and never persisted. Tokens are short-lived,
 * revocable, and the download endpoint is rate-limited.
 */
export const downloadTokensTable = pgTable("download_tokens", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tokenHash:  text("token_hash").notNull().unique(),
  documentId: uuid("document_id").notNull().references(() => guestDocumentsTable.id),
  expiresAt:  timestamp("expires_at").notNull(),
  revoked:    boolean("revoked").notNull().default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type DownloadToken = typeof downloadTokensTable.$inferSelect;
