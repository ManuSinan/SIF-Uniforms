import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { Gender } from "@prisma/client";
import { CLASS_ORDER } from "@/lib/config/constants";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: { parent_id: session.userId },
      include: { school: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const schoolId = Number(body.school_id || body.schoolId);
    const studentClass = String(body.studentClass || body.class || "").trim();
    const section = String(body.section || "").trim().slice(0, 10) || null;
    const admissionNo = String(body.admission_no || body.admissionNo || "").trim().toUpperCase();
    const gender = body.gender;

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ success: false, error: "Please enter your child's full name" }, { status: 400 });
    }
    if (!(CLASS_ORDER as readonly string[]).includes(studentClass)) {
      return NextResponse.json({ success: false, error: "Please choose a valid class" }, { status: 400 });
    }
    if (!Object.values(Gender).includes(gender)) {
      return NextResponse.json({ success: false, error: "Please choose boys, girls or unisex uniform" }, { status: 400 });
    }
    if (!/^[A-Z0-9][A-Z0-9/\-]{0,29}$/.test(admissionNo)) {
      return NextResponse.json(
        { success: false, error: "Please enter the admission / GR number from the school ID card" },
        { status: 400 }
      );
    }

    const school = schoolId ? await prisma.school.findFirst({ where: { id: schoolId, is_active: true } }) : null;
    if (!school) {
      return NextResponse.json({ success: false, error: "Please choose your child's school" }, { status: 400 });
    }

    const duplicateOwn = await prisma.student.findFirst({
      where: { parent_id: session.userId, school_id: school.id, admission_no: admissionNo },
    });
    if (duplicateOwn) {
      return NextResponse.json({ success: false, error: `${duplicateOwn.name} is already added with this admission number` }, { status: 400 });
    }
    // Another account may legitimately hold the same child (e.g. the other parent); the school decides.
    const rejectedElsewhere = await prisma.student.findFirst({
      where: { school_id: school.id, admission_no: admissionNo, verification_status: "rejected" },
    });
    if (rejectedElsewhere) {
      return NextResponse.json(
        { success: false, error: `${school.name} couldn't verify this admission number. Please contact the school office.` },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        parent_id: session.userId,
        school_id: school.id,
        name,
        class: studentClass,
        section,
        admission_no: admissionNo,
        gender,
        verification_status: "pending",
      },
      include: { school: true },
    });

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID required" }, { status: 400 });
    }

    const orderCount = await prisma.order.count({ where: { student_id: Number(id), parent_id: session.userId } });
    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: "This child has orders, so their profile can't be removed" },
        { status: 400 }
      );
    }
    await prisma.student.deleteMany({
      where: { id: Number(id), parent_id: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
