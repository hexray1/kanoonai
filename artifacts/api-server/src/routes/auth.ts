import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { signToken, authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();

function getBaseUrl(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    // If explicitly set, derive base from it
    return "";
  }
  // Auto-detect Replit domain
  const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}`;
  return "http://localhost:80";
}

function getRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${getBaseUrl()}/api/auth/google/callback`;
}

function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  return getBaseUrl();
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new OAuth2Client(clientId, clientSecret, getRedirectUri());
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /auth/google — redirect to Google consent screen
router.get("/google", (req, res) => {
  const client = getOAuth2Client();
  if (!client) {
    return res.redirect(`${getFrontendUrl()}/login?error=no_google_config`);
  }

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "profile", "email"],
    prompt: "select_account",
  });

  res.redirect(url);
});

// GET /auth/google/callback — exchange code, create user, issue JWT
router.get("/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query as { code?: string; error?: string };

    if (error || !code) {
      return res.redirect(`${getFrontendUrl()}/login?error=google_denied`);
    }

    const client = getOAuth2Client();
    if (!client) {
      return res.redirect(`${getFrontendUrl()}/login?error=no_google_config`);
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.redirect(`${frontendUrl}/login?error=invalid_token`);
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let [existing] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.googleId, googleId!), eq(usersTable.email, email!)))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(usersTable)
        .values({
          googleId,
          email,
          name,
          profilePicture: picture,
          referralCode: generateReferralCode(),
          plan: "free",
        })
        .returning();
      existing = created;
    } else {
      // Update profile info if it changed
      const [updated] = await db
        .update(usersTable)
        .set({ googleId, name, profilePicture: picture, email })
        .where(eq(usersTable.id, existing.id))
        .returning();
      existing = updated;
    }

    const token = signToken({ userId: existing.id, isAdmin: existing.isAdmin });
    return res.redirect(`${getFrontendUrl()}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(`${getFrontendUrl()}/login?error=server_error`);
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        profilePicture: usersTable.profilePicture,
        phone: usersTable.phone,
        plan: usersTable.plan,
        referralCode: usersTable.referralCode,
        isAdmin: usersTable.isAdmin,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
