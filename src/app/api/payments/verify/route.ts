import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { sendWhatsAppOrderUpdate } from "@/lib/whatsapp/service";
import { isMockPaymentAllowed, MOCK_PAYMENT_DISABLED_MESSAGE } from "@/lib/payments/mock";
import { expireStaleOrders, isExpired } from "@/lib/orders/lifecycle";

class OutOfStockError extends Error {}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // No signature verification exists yet, so this endpoint only works with the dev mock payment.
    if (!isMockPaymentAllowed()) {
      return NextResponse.json({ success: false, error: MOCK_PAYMENT_DISABLED_MESSAGE }, { status: 503 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id } = body;

    const order = await prisma.order.findUnique({
      where: { id: Number(body.order_id) },
      include: { school: true, parent: true, items: true, student: true },
    });

    if (!order || order.parent_id !== session.userId) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const payment = await prisma.payment.findFirst({
      where: { order_id: order.id, razorpay_order_id: String(razorpay_order_id || ""), status: "created" },
    });
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment session not found. Please try again." }, { status: 400 });
    }
    if (payment.type === "initial" && order.order_status !== "pending_payment") {
      return NextResponse.json({ success: false, error: "This order has already been paid" }, { status: 400 });
    }
    if (isExpired(order)) {
      await expireStaleOrders({ id: order.id });
      return NextResponse.json(
        { success: false, error: "This checkout expired. Your items are back in the bag, please check out again." },
        { status: 410 }
      );
    }

    const paymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;

    if (payment.type === "extra") {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { id: payment.id }, data: { razorpay_payment_id: paymentId, status: "captured" } });
        return tx.order.update({
          where: { id: order.id },
          data: {
            amount_paid: { increment: payment.amount },
            statusHistory: {
              create: { status: order.order_status, changed_by: "System (Payment Verification)", note: `Balance of ₹${payment.amount / 100} paid via ${paymentId}` },
            },
          },
        });
      });
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    let updatedOrder;
    try {
      updatedOrder = await prisma.$transaction(async (tx) => {
        // Take stock now that the order is paid; fail if someone else bought the last pieces.
        for (const item of order.items) {
          if (!item.variant_id) continue;
          const res = await tx.schoolProductVariant.updateMany({
            where: { id: item.variant_id, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty } },
          });
          if (res.count === 0) throw new OutOfStockError(`${item.item_name} (${item.size}) just went out of stock`);
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: { razorpay_payment_id: paymentId, status: "captured" },
        });

        return tx.order.update({
          where: { id: order.id },
          data: {
            payment_status: "paid",
            order_status: "placed",
            amount_paid: order.grand_total,
            statusHistory: {
              create: {
                status: "placed",
                changed_by: "System (Payment Verification)",
                note: `Payment verified via Razorpay ID ${paymentId}`,
              },
            },
          },
          include: { school: true },
        });
      });
    } catch (err) {
      if (err instanceof OutOfStockError) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
        return NextResponse.json({ success: false, error: err.message }, { status: 409 });
      }
      throw err;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendWhatsAppOrderUpdate({
      mobile: order.parent.mobile,
      orderNo: order.order_no,
      status: "placed",
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
