import type { Request, Response, NextFunction } from "express";

/**
 * Tiny in-memory sliding-window rate limiter.
 * Protects the unauthenticated guest AI endpoint from key-burn abuse.
 * (Per-instance on serverless — still caps per-instance abuse; a shared
 * Redis/DB limiter can replace this later without changing the call sites.)
 */
const buckets = new Map<string, number[]>();

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = clientIp(req);
    const hits = (buckets.get(ip) ?? []).filter((t) => now - t < opts.windowMs);
    if (hits.length >= opts.max) {
      res.status(429).json({
        error: opts.message ?? "Too many requests — please try again later.",
      });
      return;
    }
    hits.push(now);
    buckets.set(ip, hits);
    // Prevent unbounded memory growth
    if (buckets.size > 50_000) buckets.clear();
    next();
  };
}

/** Guest AI generation: 10 generations per IP per hour. */
export const guestStreamRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Hourly generation limit reached — please try again later.",
});

/** Guest order creation: 20 orders per IP per hour (payment retries). */
export const guestOrderRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many payment attempts — please try again later.",
});
