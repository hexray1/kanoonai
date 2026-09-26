import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, guestSessionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// TEMPORARY DEBUG (remove before final): surface the underlying PG error for
// the guest_sessions insert so the production DB failure can be diagnosed.
router.get("/debug-db", async (_req, res) => {
  try {
    await db.insert(guestSessionsTable).values({ deviceKey: "debug-probe" })
      .onConflictDoNothing({ target: guestSessionsTable.deviceKey });
    const tables = await db.execute(
      `select table_name from information_schema.tables where table_schema='public' and table_name like 'guest_%' or table_name like 'document_%' or table_name in ('webhook_events','download_tokens','edit_tokens','audit_events') order by 1` as any,
    );
    res.json({ ok: true, tables });
  } catch (err: any) {
    const cause: any = err?.cause ?? err;
    res.status(500).json({
      ok: false,
      code: cause?.code,
      message: String(cause?.message ?? err?.message ?? err).slice(0, 500),
    });
  }
});

export default router;
