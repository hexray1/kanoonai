import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Guest sessions for the no-login product.
 * The client holds a stable per-device token (localStorage); the server
 * upserts a row so documents/payments can be bound to a session without
 * any account. Sessions carry no privileges by themselves — every
 * privileged action still requires its own token/signature.
 */
export const guestSessionsTable = pgTable("guest_sessions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  deviceKey: text("device_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  metadata:  jsonb("metadata").$type<Record<string, unknown>>(),
});

export type GuestSession = typeof guestSessionsTable.$inferSelect;
