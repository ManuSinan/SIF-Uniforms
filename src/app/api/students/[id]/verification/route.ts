import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { cancelOrder } from "@/lib/orders/lifecycle";

/** School confirms (or rejects) that a child really studies there. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "school_admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id: Number(id) } });
    if (!student || (session.role === "school_admin" && student.school_id !== session.schoolId)) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const status = body.status;
    const reason = String(body.reason || "").trim();
    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    if (status === "rejected" && !reason) {
      return NextResponse.json({ success: false, error: "Please tell the parent why" }, { status: 400 });
    }

    const actor = { label: `${session.name} (${session.role})`, role: session.role };
    let cancelledOrders = 0;

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          verification_status: status,
          verified_by: actor.label,
          verified_at: new Date(),
          rejection_reason: status === "rejected" ? reason : null,
        },
      });

      if (status === "rejected") {
        // Orders that haven't shipped are cancelled and refunded; shipped ones need a manual call.
        const open = await tx.order.findMany({
          where: { student_id: student.id, order_status: { in: ["pending_payment", "placed", "confirmed", "packed"] } },
        });
        for (const o of open) {
          await cancelOrder(tx, o.id, actor, `Student not verified by school: ${reason}`);
        }
        cancelledOrders = open.length;
        await tx.cartItem.deleteMany({ where: { cart: { student_id: student.id } } });
      }
    });

    return NextResponse.json({ success: true, cancelledOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
