import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  verifyOtpHash,
  sendOtpViaSms,
  generateReferralCode,
} from "../utils/otpService.js";
import { signToken, authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/send-otp", async (req, res) => {
  try {
    const { phone, name } = req.body as { phone: string; name?: string };
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: "Invalid Indian phone number" });
      return;
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = getOtpExpiry();

    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);

    if (existing.length > 0) {
      await db.update(usersTable)
        .set({ otpHash, otpExpiry, ...(name ? { name } : {}) })
        .where(eq(usersTable.phone, phone));
    } else {
      const referralCode = generateReferralCode();
      await db.insert(usersTable).values({
        phone,
        name: name || null,
        plan: "free",
        referralCode,
        otpHash,
        otpExpiry,
        isAdmin: false,
      });
    }

    await sendOtpViaSms(phone, otp);

    const isDev = !process.env.MSG91_API_KEY;
    res.json({
      success: true,
      message: "OTP sent successfully",
      ...(isDev ? { devOtp: otp } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "Send OTP error");
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp, name } = req.body as { phone: string; otp: string; name?: string };
    if (!phone || !otp) {
      res.status(400).json({ error: "Phone and OTP are required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (users.length === 0) {
      res.status(400).json({ error: "Phone number not found. Please request OTP first." });
      return;
    }

    const user = users[0];
    if (!user.otpHash || !user.otpExpiry) {
      res.status(400).json({ error: "OTP not requested. Please request OTP first." });
      return;
    }

    if (new Date() > user.otpExpiry) {
      res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
      return;
    }

    if (!verifyOtpHash(otp, user.otpHash)) {
      res.status(400).json({ error: "Invalid OTP. Please try again." });
      return;
    }

    const updateData: { otpHash: null; otpExpiry: null; name?: string } = { otpHash: null, otpExpiry: null };
    if (name && !user.name) updateData.name = name;

    await db.update(usersTable).set(updateData).where(eq(usersTable.phone, phone));

    const updatedUser = { ...user, ...updateData };
    const token = signToken(user.id, user.phone);

    res.json({
      token,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        plan: updatedUser.plan,
        referralCode: updatedUser.referralCode,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Verify OTP error");
    res.status(500).json({ error: "Verification failed" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = users[0];
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      plan: user.plan,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
