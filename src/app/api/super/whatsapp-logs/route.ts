import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.whatsappLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
