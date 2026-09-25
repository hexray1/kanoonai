import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  isAdmin?: boolean;
}

// Legacy auth routes are unmounted from the guest-only product, but the
// middleware module is still imported. Never fall back to a hardcoded
// secret: without JWT_SECRET we generate an ephemeral one (invalidated on
// restart) and log a loud warning.
function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 16) return configured;
  const ephemeral = crypto.randomBytes(32).toString("hex");
  console.warn(
    "[auth] JWT_SECRET is missing or too short — using an ephemeral secret. " +
      "All previously issued tokens are invalid. Set JWT_SECRET in production.",
  );
  return ephemeral;
}

const JWT_SECRET = resolveJwtSecret();

export function signToken(payload: { userId: number; isAdmin: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean };
    req.userId = decoded.userId;

    const [user] = await db
      .select({ isAdmin: usersTable.isAdmin })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    req.isAdmin = user?.isAdmin ?? false;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Like authMiddleware but never rejects — sets userId if token valid, otherwise continues as guest. */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean };
      req.userId = decoded.userId;
      req.isAdmin = decoded.isAdmin;
    } catch {
      // Invalid token — treat as guest, do not reject
    }
  }
  next();
}

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
