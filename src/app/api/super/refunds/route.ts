import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

// Until Razorpay refunds are wired in, the platform team pays refunds out (UPI/bank) and records them here.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const status = new URL(req.url).searchParams.get("status");
  const refunds = await prisma.refund.findMany({
    where: status && status !== "all" ? { status: status as any } : {},
    include: {
      order: {
        select: {
          id: true,
          order_no: true,
          order_status: true,
          school: { select: { name: true, code: true } },
          student: { select: { name: true } },
          parent: { select: { name: true, mobile: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ success: true, refunds });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const status = body.status;
    const reference = String(body.reference || "").trim();
    if (status !== "processed" && status !== "failed") {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    if (status === "processed" && reference.length < 4) {
      return NextResponse.json({ success: false, error: "Enter the UTR / UPI reference of the refund" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Conditional update so a refund can't be paid out twice
      const claimed = await tx.refund.updateMany({
        where: { id: Number(body.id), status: "pending" },
        data: {
          status,
          reference: reference || null,
          processed_at: new Date(),
          processed_by: `${session.name} (${session.role})`,
        },
      });
      if (claimed.count === 0) return null;

      const refund = await tx.refund.findUniqueOrThrow({ where: { id: Number(body.id) }, include: { order: true } });
      if (status === "processed") {
        const amountPaid = Math.max(refund.order.amount_paid - refund.amount, 0);
        await tx.order.update({
          where: { id: refund.order_id },
          data: {
            amount_paid: amountPaid,
            payment_status: amountPaid === 0 ? "refunded" : "partial_refund",
            statusHistory: {
              create: {
                status: refund.order.order_status,
                changed_by: `${session.name} (${session.role})`,
                note: `Refund of ₹${refund.amount / 100} sent (ref ${reference})`,
              },
            },
          },
        });
      }
      return refund;
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "This refund was already handled" }, { status: 409 });
    }
    return NextResponse.json({ success: true, refund: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
