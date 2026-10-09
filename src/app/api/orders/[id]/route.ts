import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { expireStaleOrders, orderBalance } from "@/lib/orders/lifecycle";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await expireStaleOrders({ id: Number(id) });

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        school: true,
        student: true,
        parent: { select: { id: true, name: true, mobile: true } },
        items: true,
        payments: true,
        refunds: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        editHistory: { orderBy: { createdAt: "desc" } },
        changeRequests: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Role check: parent can only see their own order, school_admin can only see their school's order
    if (session.role === "parent" && order.parent_id !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "school_admin" && (!session.schoolId || order.school_id !== session.schoolId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Other sizes of each item, for the parent's "change size" request
    const variantIds = order.items.map((it) => it.variant_id).filter((v): v is number => !!v);
    const current = await prisma.schoolProductVariant.findMany({ where: { id: { in: variantIds } } });
    const siblings = await prisma.schoolProductVariant.findMany({
      where: { school_product_id: { in: [...new Set(current.map((v) => v.school_product_id))] } },
      include: { size: true },
      orderBy: { size: { sort_order: "asc" } },
    });
    const items = order.items.map((it) => {
      const cur = current.find((v) => v.id === it.variant_id);
      return {
        ...it,
        size_options: cur
          ? siblings
              .filter((v) => v.school_product_id === cur.school_product_id && v.id !== cur.id)
              .map((v) => ({ variant_id: v.id, size_label: v.size.size_label, price: v.price, in_stock: v.stock > 0 }))
          : [],
      };
    });

    const balance = order.order_status === "pending_payment" || order.order_status === "cancelled" ? 0 : await orderBalance(prisma, order);
    return NextResponse.json({ success: true, order: { ...order, items, balance_due: Math.max(balance, 0) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
