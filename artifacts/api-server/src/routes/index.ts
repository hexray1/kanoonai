import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import documentsRouter from "./documents.js";
import paymentsRouter, { createWebhookHandler } from "./payments.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);
router.use("/payments", paymentsRouter);
router.use("/webhooks", createWebhookHandler());

export default router;
