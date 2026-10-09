import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { school: true },
    });

    if (!user || !user.is_active) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        school: user.school,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!existing || !existing.is_active) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { name, email: email || existing.email },
    });

    await setSessionCookie({
      userId: user.id,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      schoolId: user.school_id,
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    console.error("Error in update profile:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
