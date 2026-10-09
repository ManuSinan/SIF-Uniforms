import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "school_admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let schoolId = session.schoolId;

    // Super admin can specify ?schoolId=X
    if (session.role === "super_admin") {
      const { searchParams } = new URL(req.url);
      const qSchoolId = searchParams.get("schoolId");
      if (qSchoolId) {
        schoolId = Number(qSchoolId);
      }
    }

    if (!schoolId) {
      // Fallback to first active school
      const firstSchool = await prisma.school.findFirst({
        where: { is_active: true },
      });
      schoolId = firstSchool?.id;
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "No school found" }, { status: 404 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        serviceablePincodes: true,
        schoolProducts: {
          where: { is_active: true },
          include: {
            product: {
              include: { sizes: { orderBy: { sort_order: "asc" } } },
            },
            variants: {
              include: { size: true },
              orderBy: { size: { sort_order: "asc" } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            students: true,
            orders: true,
            schoolProducts: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, school });
  } catch (error: any) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
