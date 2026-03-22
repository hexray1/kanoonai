import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  userPhone?: string;
  isAdmin?: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "kanoonai-dev-secret-change-in-prod";

export function signToken(userId: number, phone: string): string {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: "30d" });
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; phone: string };
    req.userId = decoded.userId;
    req.userPhone = decoded.phone;

    const user = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
    if (user.length > 0) {
      req.isAdmin = user[0].isAdmin;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
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
