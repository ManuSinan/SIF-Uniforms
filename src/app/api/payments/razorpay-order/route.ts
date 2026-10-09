import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { nanoid } from "nanoid";
import { isMockPaymentAllowed, MOCK_PAYMENT_DISABLED_MESSAGE } from "@/lib/payments/mock";
import { expireStaleOrders, isExpired, orderBalance } from "@/lib/orders/lifecycle";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isMockPaymentAllowed()) {
      return NextResponse.json({ success: false, error: MOCK_PAYMENT_DISABLED_MESSAGE }, { status: 503 });
    }

    const body = await req.json();
    const order = await prisma.order.findUnique({
      where: { id: Number(body.order_id) },
      include: { school: true, parent: true, student: true },
    });

    if (!order || order.parent_id !== session.userId) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    if (order.student.verification_status === "rejected") {
      return NextResponse.json(
        { success: false, error: `${order.school.name} couldn't verify ${order.student.name}, so this order can't be paid` },
        { status: 400 }
      );
    }

    if (isExpired(order)) {
      await expireStaleOrders({ id: order.id });
      return NextResponse.json(
        { success: false, error: "This checkout expired. Your items are back in the bag, please check out again." },
        { status: 410 }
      );
    }

    // First payment for a new order, or the balance after a change made it dearer.
    let amount: number;
    let type: "initial" | "extra";
    if (order.order_status === "pending_payment") {
      amount = order.grand_total;
      type = "initial";
    } else if (order.order_status !== "cancelled" && (await orderBalance(prisma, order)) > 0) {
      amount = await orderBalance(prisma, order);
      type = "extra";
    } else {
      return NextResponse.json({ success: false, error: "Nothing to pay on this order" }, { status: 400 });
    }

    // Mock Razorpay order ID (real Razorpay SDK not integrated yet)
    const razorpayOrderId = `order_mock_${nanoid(14)}`;

    await prisma.payment.create({
      data: {
        order_id: order.id,
        razorpay_order_id: razorpayOrderId,
        amount,
        type,
        status: "created",
      },
    });

    return NextResponse.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey12345",
      orderId: razorpayOrderId,
      amount,
      currency: "INR",
      name: order.school.name,
      description: `Uniform Order #${order.order_no}`,
      prefill: {
        name: order.parent.name,
        contact: order.parent.mobile,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
