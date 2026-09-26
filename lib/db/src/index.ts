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
 * Idempotent startup migration for the guest-only product.
 * Vercel/serverless has no persistent process and no migration runner in
 * the request path, so every cold start ensures the spec tables exist.
 * All statements are IF NOT EXISTS — safe to run on every cold start,
 * never destructive, never drops anything.
 */
export async function ensureGuestOrdersTable(): Promise<void> {
  return ensureSpecTables();
}

export async function ensureSpecTables(): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_sessions (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_key TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      metadata   JSONB
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_documents (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id       UUID REFERENCES guest_sessions(id),
      doc_type         TEXT NOT NULL,
      form_data        JSONB NOT NULL,
      content          TEXT NOT NULL,
      language         TEXT NOT NULL DEFAULT 'en',
      template_version TEXT,
      prompt_version   TEXT,
      legal_version    TEXT,
      price_paise      INTEGER NOT NULL,
      status           TEXT NOT NULL DEFAULT 'draft',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_documents_session_idx
      ON guest_documents (session_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES guest_documents(id),
      version     TEXT NOT NULL DEFAULT '1',
      content     TEXT NOT NULL,
      form_data   TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_pdfs (
      document_id UUID PRIMARY KEY REFERENCES guest_documents(id),
      pdf_data    BYTEA NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // guest_orders: create if missing, then add newer columns idempotently
  // (older deployments have only order_id/doc_type/amount/status/created_at).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_orders (
      order_id   TEXT PRIMARY KEY,
      doc_type   TEXT NOT NULL,
      amount     INTEGER NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES guest_documents(id);`);
  await pool.query(`ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';`);
  await pool.query(`ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS receipt TEXT;`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_orders_created_at_idx
      ON guest_orders (created_at);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_orders_document_idx
      ON guest_orders (document_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_payments (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id            TEXT NOT NULL REFERENCES guest_orders(order_id),
      razorpay_payment_id TEXT NOT NULL UNIQUE,
      amount_paise        INTEGER NOT NULL,
      currency            TEXT NOT NULL DEFAULT 'INR',
      status              TEXT NOT NULL DEFAULT 'captured',
      source              TEXT NOT NULL DEFAULT 'deliver',
      captured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      raw_event           JSONB,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS guest_payments_order_idx
      ON guest_payments (order_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id     TEXT NOT NULL UNIQUE,
      event_type   TEXT NOT NULL,
      order_id     TEXT,
      payment_id   TEXT,
      processed_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS download_tokens (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash  TEXT NOT NULL UNIQUE,
      document_id UUID NOT NULL REFERENCES guest_documents(id),
      expires_at  TIMESTAMPTZ NOT NULL,
      revoked     BOOLEAN NOT NULL DEFAULT FALSE,
      last_used_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS edit_tokens (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash  TEXT NOT NULL UNIQUE,
      document_id UUID NOT NULL REFERENCES guest_documents(id),
      session_id  UUID REFERENCES guest_sessions(id),
      expires_at  TIMESTAMPTZ NOT NULL,
      revoked     BOOLEAN NOT NULL DEFAULT FALSE,
      used_count  INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type  TEXT NOT NULL,
      document_id UUID,
      order_id    TEXT,
      payment_id  TEXT,
      ip          TEXT,
      metadata    JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS audit_events_created_idx
      ON audit_events (created_at);
  `);

  // Best-effort cleanup of stale pending orders (> 2h old, never delivered).
  // Paid/captured rows are NEVER deleted — they are the persistent record.
  await pool
    .query(
      `DELETE FROM guest_orders
        WHERE status = 'pending'
          AND created_at < NOW() - INTERVAL '2 hours'`,
    )
    .catch(() => {});
}
