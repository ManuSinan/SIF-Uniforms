import { NextRequest, NextResponse } from "next/server";
import { requestOtp } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json({ success: false, message: "Mobile number is required" }, { status: 400 });
    }

    const result = await requestOtp(mobile);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      testOtp: result.testOtp,
    });
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
