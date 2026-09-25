import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the platform's reverse proxy (Vercel / Replit) so req.ip and
// x-forwarded-for reflect the real client — needed for rate limiting.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS: restrict to the configured frontend origin in production;
// fall back to permissive CORS only outside production (dev).
const frontendOrigin = process.env.FRONTEND_URL;
app.use(
  frontendOrigin
    ? cors({ origin: frontendOrigin.split(",").map((o) => o.trim()) })
    : cors(),
);

// Capture the raw body for HMAC verification (Razorpay webhook).
// express.json() parses into req.body; rawBody keeps the exact bytes.
app.use(
  express.json({
    limit: "500kb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
