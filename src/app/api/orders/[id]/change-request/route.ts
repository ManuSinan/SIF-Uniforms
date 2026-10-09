import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { ChangeRequestStatus } from "@prisma/client";
import { ORDER_LOCK_RULES } from "@/lib/config/constants";
import { applyItemChanges, OrderRuleError } from "@/lib/orders/lifecycle";

/** Parent asks the school for a change: ideally "item X → size Y", or free text. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const note = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";

    const order = await prisma.order.findUnique({ where: { id: Number(id) }, include: { items: true } });
    if (!order || order.parent_id !== session.userId) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    if (!(ORDER_LOCK_RULES.parent.editItemsUntil as readonly string[]).includes(order.order_status)) {
      return NextResponse.json({ success: false, error: "Changes can only be requested before the order is packed" }, { status: 400 });
    }

    let orderItemId: number | null = null;
    let requestedVariantId: number | null = null;
    let message = note;

    if (body.order_item_id) {
      const item = order.items.find((it) => it.id === Number(body.order_item_id));
      if (!item?.variant_id) {
        return NextResponse.json({ success: false, error: "Item not found on this order" }, { status: 400 });
      }
      const [current, target] = await Promise.all([
        prisma.schoolProductVariant.findUnique({ where: { id: item.variant_id } }),
        prisma.schoolProductVariant.findUnique({ where: { id: Number(body.requested_variant_id) }, include: { size: true } }),
      ]);
      if (!current || !target || target.school_product_id !== current.school_product_id || target.id === current.id) {
        return NextResponse.json({ success: false, error: "Please choose a different size of the same item" }, { status: 400 });
      }
      orderItemId = item.id;
      requestedVariantId = target.id;
      message = `Change ${item.item_name} from size ${item.size} to ${target.size.size_label}${note ? `. ${note}` : ""}`;
    }

    if (!message) {
      return NextResponse.json({ success: false, error: "Please describe the change you need" }, { status: 400 });
    }

    const open = await prisma.changeRequest.count({ where: { order_id: order.id, status: "pending" } });
    if (open >= 3) {
      return NextResponse.json({ success: false, error: "You already have requests waiting for the school on this order" }, { status: 400 });
    }

    const changeRequest = await prisma.changeRequest.create({
      data: {
        order_id: order.id,
        parent_id: session.userId,
        message,
        order_item_id: orderItemId,
        requested_variant_id: requestedVariantId,
        status: ChangeRequestStatus.pending,
      },
    });

    return NextResponse.json({ success: true, changeRequest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * School/super admin answers a request. Approving a size swap applies it to the order
 * (stock, price difference and balance/refund); free-text approvals are acknowledgements
 * and the admin edits the order separately.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "school_admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, status } = body;
    const responseNote = String(body.response_note || "").trim();

    if (!requestId || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ success: false, error: "Request ID and a valid status are required" }, { status: 400 });
    }

    const { id } = await params;
    const existing = await prisma.changeRequest.findFirst({
      where: { id: Number(requestId), order_id: Number(id) },
      include: { order: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Change request not found" }, { status: 404 });
    }
    if (session.role === "school_admin" && (!session.schoolId || existing.order.school_id !== session.schoolId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json({ success: false, error: "This request has already been answered" }, { status: 400 });
    }
    if (status === "rejected" && !responseNote) {
      return NextResponse.json({ success: false, error: "Please tell the parent why" }, { status: 400 });
    }

    const actorLabel = `${session.name} (${session.role})`;
    let applied: Awaited<ReturnType<typeof applyItemChanges>> | null = null;

    if (status === "approved" && existing.order_item_id && existing.requested_variant_id) {
      applied = await applyItemChanges(
        existing.order_id,
        [{ order_item_id: existing.order_item_id, variant_id: existing.requested_variant_id }],
        { label: actorLabel, role: session.role as "school_admin" | "super_admin" },
        existing.message
      );
    }

    const updated = await prisma.changeRequest.update({
      where: { id: existing.id },
      data: { status: status as ChangeRequestStatus, handled_by: actorLabel, response_note: responseNote || null },
    });

    return NextResponse.json({
      success: true,
      changeRequest: updated,
      applied: Boolean(applied),
      balanceDue: applied?.balanceDue ?? 0,
      priceDiff: applied?.priceDiff ?? 0,
    });
  } catch (error: any) {
    if (error instanceof OrderRuleError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
