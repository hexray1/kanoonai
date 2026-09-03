import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { benchmarkNvidiaModels, getNvidiaModelStatus } from "../utils/aiGenerator.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/ai", async (_req, res) => {
  const status = await getNvidiaModelStatus();
  res.json({
    provider: "nvidia-build",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    ...status,
  });
});

router.post("/healthz/ai-benchmark", async (_req, res) => {
  res.json({ provider: "nvidia-build", results: await benchmarkNvidiaModels() });
});

export default router;
