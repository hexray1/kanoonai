import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import documentsRouter from "./documents.js";
import paymentsRouter, { createWebhookHandler } from "./payments.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/documents", documentsRouter);
router.use("/payments", paymentsRouter);
router.use("/webhooks", createWebhookHandler());
router.use("/admin", adminRouter);

export default router;
