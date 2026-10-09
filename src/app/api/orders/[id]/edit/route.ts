import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { applyItemChanges, OrderRuleError, ItemChange } from "@/lib/orders/lifecycle";
import { formatPaiseToRupees } from "@/lib/config/constants";
import { sendWhatsAppOrderUpdate } from "@/lib/whatsapp/service";

async function loadForAdmin(session: SessionPayload | null, orderId: number) {
  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, school: true, parent: true, student: true } });
  if (!order || (session.role === "school_admin" && order.school_id !== session.schoolId)) {
    return { error: NextResponse.json({ success: false, error: "Order not found" }, { status: 404 }) };
  }
  return { order };
}

/** Items on the order plus the other sizes each can be switched to. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const { order, error } = await loadForAdmin(session, Number(id));
    if (error) return error;

    const variantIds = order.items.map((it) => it.variant_id).filter((v): v is number => !!v);
    const variants = await prisma.schoolProductVariant.findMany({ where: { id: { in: variantIds } } });
    const productIds = [...new Set(variants.map((v) => v.school_product_id))];
    const siblings = await prisma.schoolProductVariant.findMany({
      where: { school_product_id: { in: productIds } },
      include: { size: true },
      orderBy: { size: { sort_order: "asc" } },
    });

    const items = order.items.map((it) => {
      const current = variants.find((v) => v.id === it.variant_id);
      return {
        ...it,
        options: current
          ? siblings
              .filter((s) => s.school_product_id === current.school_product_id)
              .map((s) => ({
                variant_id: s.id,
                size_label: s.size.size_label,
                price: s.price,
                // Pieces already in this order count as available to keep
                available: s.stock + (s.id === it.variant_id ? it.qty : 0),
              }))
          : [],
      };
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_no: order.order_no,
        order_status: order.order_status,
        amount_paid: order.amount_paid,
        grand_total: order.grand_total,
        school: { delivery_charge: order.school.delivery_charge, free_delivery_above: order.school.free_delivery_above },
      },
      items,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const { order, error } = await loadForAdmin(session, Number(id));
    if (error) return error;

    const body = await req.json();
    const changes: ItemChange[] = Array.isArray(body.changes) ? body.changes : [];
    const reason = String(body.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ success: false, error: "Please give a reason for the change" }, { status: 400 });
    }

    const result = await applyItemChanges(
      order.id,
      changes,
      { label: `${session!.name} (${session!.role})`, role: session!.role as "super_admin" | "school_admin" },
      reason
    );

    if (body.changeRequestId) {
      await prisma.changeRequest.updateMany({
        where: { id: Number(body.changeRequestId), order_id: order.id, status: "pending" },
        data: { status: "approved", handled_by: `${session!.name} (${session!.role})`, response_note: reason },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendWhatsAppOrderUpdate({
      mobile: order.parent.mobile,
      orderNo: order.order_no,
      status: "updated",
      schoolName: order.school.name,
      trackingUrl: `${baseUrl}/t/${order.tracking_token}`,
      studentName: order.student.name,
      orderId: order.id,
      note: result.balanceDue > 0 ? `Balance to pay: ${formatPaiseToRupees(result.balanceDue)}` : reason,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof OrderRuleError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
