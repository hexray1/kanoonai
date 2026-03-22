import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function getOtpExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry;
}

export function verifyOtpHash(otp: string, hash: string): boolean {
  const computedHash = hashOtp(otp);
  return computedHash === hash;
}

export async function sendOtpViaSms(phone: string, otp: string): Promise<boolean> {
  const msg91Key = process.env.MSG91_API_KEY;

  if (!msg91Key) {
    console.warn("MSG91_API_KEY not set, running in dev mode - OTP:", otp);
    return true;
  }

  try {
    const response = await fetch("https://api.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": msg91Key,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID || "",
        mobile: `91${phone}`,
        authkey: msg91Key,
        otp,
      }),
    });

    const data = await response.json() as { type: string };
    return data.type === "success";
  } catch (err) {
    console.error("SMS send error:", err);
    return false;
  }
}

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
