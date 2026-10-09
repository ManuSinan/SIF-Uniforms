import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { OTP_CONFIG } from "@/lib/config/constants";
import { sendWhatsAppOtp, whatsappMode } from "@/lib/whatsapp/service";
import { randomInt } from "crypto";
import { Role } from "@prisma/client";

export async function requestOtp(mobileRaw: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
  const mobile = mobileRaw.replace(/\D/g, "").slice(-10);
  if (mobile.length !== 10) {
    return { success: false, message: "Please enter a valid 10-digit mobile number" };
  }

  // Check rate limit in last 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await prisma.otpRequest.count({
    where: {
      mobile,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentRequests >= OTP_CONFIG.MAX_PER_HOUR) {
    return { success: false, message: "Too many OTP requests. Please try again later." };
  }

  // Dev WhatsApp mode (never allowed in production) uses a fixed code so testers can log in.
  const devMode = whatsappMode() === "dev";
  const otp = devMode ? process.env.WHATSAPP_TEST_OTP || "123456" : randomInt(100000, 1000000).toString();

  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous unused OTPs for this mobile
  await prisma.otpRequest.updateMany({
    where: { mobile, used: false },
    data: { used: true },
  });

  await prisma.otpRequest.create({
    data: {
      mobile,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
    },
  });

  const delivered = await sendWhatsAppOtp({ mobile, otp });
  if (!delivered) {
    return { success: false, message: "We couldn't send the code on WhatsApp right now. Please try again in a minute." };
  }

  return {
    success: true,
    message: `OTP sent via WhatsApp to +91 ${mobile}`,
    testOtp: devMode ? otp : undefined,
  };
}

export async function verifyOtpAndGetUser(
  mobileRaw: string,
  otp: string,
  parentName?: string,
  parentEmail?: string
): Promise<{ success: boolean; user?: any; error?: string; isNewParent?: boolean }> {
  const mobile = mobileRaw.replace(/\D/g, "").slice(-10);
  if (mobile.length !== 10 || !otp || otp.length !== 6) {
    return { success: false, error: "Invalid mobile number or OTP format" };
  }

  const latestRequest = await prisma.otpRequest.findFirst({
    where: {
      mobile,
      used: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // Always verify against a requested, unexpired code (the dev test code is hashed like any other).
  if (latestRequest) {
    if (latestRequest.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      return { success: false, error: "Maximum OTP attempts exceeded. Please request a new OTP." };
    }
    const isValid = await bcrypt.compare(otp, latestRequest.otp_hash);
    if (!isValid) {
      await prisma.otpRequest.update({
        where: { id: latestRequest.id },
        data: { attempts: { increment: 1 } },
      });
      return { success: false, error: "Incorrect OTP. Please check and try again." };
    }
  } else {
    return { success: false, error: "OTP expired or not found. Please request a new OTP." };
  }

  // Single use; the conditional update stops two parallel verifications both succeeding.
  const consumed = await prisma.otpRequest.updateMany({
    where: { id: latestRequest.id, used: false },
    data: { used: true },
  });
  if (consumed.count === 0) {
    return { success: false, error: "This code was already used. Please request a new OTP." };
  }

  // Find or create User
  let user = await prisma.user.findUnique({
    where: { mobile },
    include: { school: true },
  });

  let isNewParent = false;

  if (!user) {
    // Check if mobile matches SUPER_ADMIN_MOBILE
    const isSuperAdmin = mobile === (process.env.SUPER_ADMIN_MOBILE || "9876543210");
    user = await prisma.user.create({
      data: {
        mobile,
        name: parentName || (isSuperAdmin ? "Platform Super Admin" : `Parent (${mobile.slice(-4)})`),
        email: parentEmail || null,
        role: isSuperAdmin ? Role.super_admin : Role.parent,
        is_active: true,
      },
      include: { school: true },
    });
    isNewParent = !isSuperAdmin;
  } else if (parentName && user.role === Role.parent) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parentName,
        email: parentEmail || user.email,
      },
      include: { school: true },
    });
  }

  if (!user.is_active) {
    return { success: false, error: "Account is disabled. Please contact support." };
  }

  return { success: true, user, isNewParent };
}
