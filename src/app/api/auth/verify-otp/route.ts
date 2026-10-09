import { NextRequest, NextResponse } from "next/server";
import { verifyOtpAndGetUser } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, otp, name, email } = body;

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, error: "Mobile number and OTP are required" }, { status: 400 });
    }

    const verification = await verifyOtpAndGetUser(mobile, otp, name, email);
    if (!verification.success || !verification.user) {
      return NextResponse.json({ success: false, error: verification.error || "Verification failed" }, { status: 400 });
    }

    const user = verification.user;

    // Set signed JWT session cookie
    await setSessionCookie({
      userId: user.id,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      schoolId: user.school_id,
    });

    // Determine redirect URL based on user role
    let redirectUrl = "/";
    if (user.role === "super_admin") {
      redirectUrl = "/super";
    } else if (user.role === "school_admin") {
      redirectUrl = "/school";
    } else {
      redirectUrl = "/parent";
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        school: user.school,
      },
      redirectUrl,
    });
  } catch (error: any) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
