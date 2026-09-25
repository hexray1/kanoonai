import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

/**
 * Idempotent startup migration for the guest checkout path.
 * Vercel/serverless has no persistent process, so the old in-memory
 * pendingGuestOrders registry is replaced by the guest_orders table.
 * Safe to run on every cold start.
 */
export async function ensureGuestOrdersTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_orders (
      order_id   TEXT PRIMARY KEY,
      doc_type   TEXT NOT NULL,
      amount     INTEGER NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_orders_created_at_idx
      ON guest_orders (created_at);
  `);
  // Best-effort cleanup of stale pending orders (> 2h old, never delivered).
  await pool
    .query(
      `DELETE FROM guest_orders
        WHERE status = 'pending'
          AND created_at < NOW() - INTERVAL '2 hours'`,
    )
    .catch(() => {});
}
