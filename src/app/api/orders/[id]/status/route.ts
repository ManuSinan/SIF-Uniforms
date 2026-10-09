import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { sendWhatsAppOrderUpdate } from "@/lib/whatsapp/service";
import { OrderStatus } from "@prisma/client";
import { ORDER_LOCK_RULES } from "@/lib/config/constants";
import { cancelOrder, orderBalance } from "@/lib/orders/lifecycle";

// Normal fulfilment path for school admins: each step forward, or cancel before dispatch.
const SCHOOL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  placed: ["confirmed", "packed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery", "confirmed", "cancelled"],
  out_for_delivery: ["delivered", "packed"],
  delivered: [],
  cancelled: [],
};

function canSchoolMoveTo(from: OrderStatus, to: OrderStatus) {
  return from === to || SCHOOL_TRANSITIONS[from].includes(to);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = Number(id);
    const body = await req.json();
    const { status, courier_name, courier_phone, courier_tracking_no, delivery_note, delivery_proof_url } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { school: true, parent: true, student: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Permission check
    if (session.role === "school_admin" && (!session.schoolId || order.school_id !== session.schoolId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "parent") {
      if (order.parent_id !== session.userId) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      if (status !== "cancelled" || !["pending_payment", ...ORDER_LOCK_RULES.parent.cancelUntil].includes(order.order_status as any)) {
        return NextResponse.json({ success: false, error: "Orders can only be cancelled before packing" }, { status: 400 });
      }
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ success: false, error: "Unknown status" }, { status: 400 });
    }

    // Super admins may correct any status; school admins follow the normal lifecycle.
    if (session.role === "school_admin" && !canSchoolMoveTo(order.order_status, status)) {
      return NextResponse.json(
        { success: false, error: `Can't move an order from "${order.order_status.replace(/_/g, " ")}" to "${status.replace(/_/g, " ")}"` },
        { status: 400 }
      );
    }

    // Only a successful payment can move an order out of pending_payment.
    if (order.order_status === "pending_payment" && status !== "cancelled") {
      return NextResponse.json({ success: false, error: "This order hasn't been paid yet" }, { status: 400 });
    }
    if (order.order_status === "cancelled" && status !== "cancelled") {
      return NextResponse.json({ success: false, error: "Cancelled orders can't be reopened" }, { status: 400 });
    }
    if (order.student.verification_status === "rejected" && status !== "cancelled") {
      return NextResponse.json(
        { success: false, error: `${order.student.name} wasn't verified by the school. This order can only be cancelled.` },
        { status: 400 }
      );
    }

    if (["packed", "out_for_delivery", "delivered"].includes(status) && status !== order.order_status) {
      const balance = await orderBalance(prisma, order);
      if (balance > 0) {
        return NextResponse.json(
          { success: false, error: `The parent still has ₹${balance / 100} to pay after a size change. Pack it once that's paid.` },
          { status: 400 }
        );
      }
    }

    const actor = { label: `${session.name} (${session.role})`, role: session.role };

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (status === "cancelled") {
        await cancelOrder(tx, orderId, actor, delivery_note || `Cancelled by ${session.role.replace("_", " ")}`);
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: {
            order_status: status as OrderStatus,
            statusHistory: {
              create: { status, changed_by: actor.label, note: delivery_note || `Status updated to ${status}` },
            },
          },
        });
        // Confirming an order is the school vouching for the child.
        if (session.role !== "parent") {
          await tx.student.updateMany({
            where: { id: order.student_id, verification_status: "pending" },
            data: { verification_status: "verified", verified_by: actor.label, verified_at: new Date() },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          ...(courier_name ? { courier_name } : {}),
          ...(courier_phone ? { courier_phone } : {}),
          ...(courier_tracking_no ? { courier_tracking_no } : {}),
          ...(delivery_note && status !== "cancelled" ? { delivery_note } : {}),
          ...(delivery_proof_url ? { delivery_proof_url } : {}),
        },
        include: { school: true, parent: true, student: true },
      });
    });

    if (status === order.order_status) {
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Send WhatsApp notification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendWhatsAppOrderUpdate({
      mobile: order.parent.mobile,
      orderNo: order.order_no,
      status,
      schoolName: order.school.name,
      trackingUrl: `${baseUrl}/t/${order.tracking_token}`,
      studentName: order.student.name,
      orderId: order.id,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
