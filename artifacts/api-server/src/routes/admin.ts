import { Router } from "express";
import { db, usersTable, documentsTable, paymentsTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [totalDocs] = await db.select({ count: sql<number>`count(*)` }).from(documentsTable);

    const [revenueTotal] = await db.select({
      total: sql<number>`coalesce(sum(amount), 0)`,
    }).from(paymentsTable).where(eq(paymentsTable.status, "paid"));

    const [revenueToday] = await db.select({
      total: sql<number>`coalesce(sum(amount), 0)`,
    }).from(paymentsTable).where(
      and(eq(paymentsTable.status, "paid"), gte(paymentsTable.createdAt, today))
    );

    const [revenueMonth] = await db.select({
      total: sql<number>`coalesce(sum(amount), 0)`,
    }).from(paymentsTable).where(
      and(eq(paymentsTable.status, "paid"), gte(paymentsTable.createdAt, monthStart))
    );

    const [docsToday] = await db.select({
      count: sql<number>`count(*)`,
    }).from(documentsTable).where(gte(documentsTable.createdAt, today));

    const [docsMonth] = await db.select({
      count: sql<number>`count(*)`,
    }).from(documentsTable).where(gte(documentsTable.createdAt, monthStart));

    const popularTypes = await db.select({
      type: documentsTable.type,
      count: sql<number>`count(*)`,
    }).from(documentsTable)
      .groupBy(documentsTable.type)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const recentTransactions = await db.select().from(paymentsTable)
      .orderBy(sql`created_at desc`)
      .limit(10);

    res.json({
      totalUsers: Number(totalUsers.count),
      totalDocuments: Number(totalDocs.count),
      revenueToday: Number(revenueToday.total),
      revenueMonth: Number(revenueMonth.total),
      revenueTotal: Number(revenueTotal.total),
      documentsToday: Number(docsToday.count),
      documentsMonth: Number(docsMonth.count),
      popularDocTypes: popularTypes.map(p => ({ type: p.type, count: Number(p.count) })),
      recentTransactions,
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/users", async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(sql`created_at desc`);

    const userStats = await Promise.all(users.map(async (user) => {
      const [docCount] = await db.select({ count: sql<number>`count(*)` })
        .from(documentsTable).where(eq(documentsTable.userId, user.id));
      const [spent] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(paymentsTable).where(
          and(eq(paymentsTable.userId, user.id), eq(paymentsTable.status, "paid"))
        );
      return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        plan: user.plan,
        isAdmin: user.isAdmin,
        documentCount: Number(docCount.count),
        totalSpent: Number(spent.total),
        createdAt: user.createdAt,
      };
    }));

    res.json(userStats);
  } catch (err) {
    req.log.error({ err }, "Admin users error");
    res.status(500).json({ error: "Failed to get users" });
  }
});

router.get("/documents", async (req: AuthRequest, res) => {
  try {
    const docs = await db.select().from(documentsTable).orderBy(sql`created_at desc`).limit(100);
    res.json(docs.map(d => ({ ...d, content: d.content?.substring(0, 200) + "..." })));
  } catch (err) {
    req.log.error({ err }, "Admin documents error");
    res.status(500).json({ error: "Failed to get documents" });
  }
});

router.get("/transactions", async (req: AuthRequest, res) => {
  try {
    const transactions = await db.select().from(paymentsTable).orderBy(sql`created_at desc`).limit(100);
    res.json(transactions);
  } catch (err) {
    req.log.error({ err }, "Admin transactions error");
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

export default router;
