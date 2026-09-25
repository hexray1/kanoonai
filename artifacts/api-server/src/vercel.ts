import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app.js";
import { ensureGuestOrdersTable } from "@workspace/db";

/**
 * Vercel Serverless entry for the Kanoon AI Express API.
 * vercel.json rewrites /api/:path* -> /api/index; the function receives the
 * original request path, so the Express router mounted at /api matches.
 */

export const config = {
  api: { bodyParser: false }, // let Express parse the body (needed for webhook rawBody)
  maxDuration: 300,           // allow long AI generations (capped by plan)
};

let ready: Promise<void> | null = null;

/** Cold-start init: idempotent guest_orders table migration. Runs once per instance. */
function ensureReady(): Promise<void> {
  if (!ready) {
    const p: Promise<void> = ensureGuestOrdersTable().catch((err: unknown) => {
      // Log but don't crash: guest order registration will surface DB errors
      // per-request with a clear 500 instead of killing the function.
      console.error("[vercel] ensureGuestOrdersTable failed:", err);
    });
    ready = p;
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureReady();
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
