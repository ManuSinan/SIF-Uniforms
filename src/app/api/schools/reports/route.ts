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
    if (session.role === "super_admin") {
      const { searchParams } = new URL(req.url);
      const qSchoolId = searchParams.get("schoolId");
      if (qSchoolId) schoolId = Number(qSchoolId);
    }

    if (!schoolId) {
      const firstSchool = await prisma.school.findFirst({ where: { is_active: true } });
      schoolId = firstSchool?.id;
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    // Fetch school
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    // Fetch all orders for this school
    const orders = await prisma.order.findMany({
      where: { school_id: schoolId },
      include: {
        student: true,
        items: true,
        changeRequests: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all school products with variants & stock
    const schoolProducts = await prisma.schoolProduct.findMany({
      where: { school_id: schoolId, is_active: true },
      include: {
        product: true,
        variants: {
          include: { size: true },
        },
      },
    });

    // 1. Status breakdown
    const statusCounts: Record<string, number> = {
      placed: 0,
      confirmed: 0,
      packed: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    let totalRevenue = 0;
    let totalItemsOrdered = 0;

    // 2. Class-wise breakdown
    const classBreakdown: Record<string, { orderCount: number; itemsCount: number; revenue: number }> = {};

    // 3. Item & Size level fulfillment requirement (for pending/confirmed/packed orders)
    const itemRequirements: Record<
      string,
      {
        itemName: string;
        color: string;
        size: string;
        pendingPackQty: number;
        dispatchedQty: number;
        deliveredQty: number;
        totalQty: number;
      }
    > = {};

    for (const ord of orders) {
      const st = ord.order_status;
      if (statusCounts[st] !== undefined) {
        statusCounts[st]++;
      }

      if (ord.payment_status === "paid") {
        totalRevenue += ord.grand_total;
      }

      const cls = ord.student.class || "Unknown";
      if (!classBreakdown[cls]) {
        classBreakdown[cls] = { orderCount: 0, itemsCount: 0, revenue: 0 };
      }
      classBreakdown[cls].orderCount++;
      if (ord.payment_status === "paid") {
        classBreakdown[cls].revenue += ord.grand_total;
      }

      for (const item of ord.items) {
        totalItemsOrdered += item.qty;
        classBreakdown[cls].itemsCount += item.qty;

        const key = `${item.item_name}__${item.color}__${item.size}`;
        if (!itemRequirements[key]) {
          itemRequirements[key] = {
            itemName: item.item_name,
            color: item.color,
            size: item.size,
            pendingPackQty: 0,
            dispatchedQty: 0,
            deliveredQty: 0,
            totalQty: 0,
          };
        }

        itemRequirements[key].totalQty += item.qty;

        if (["placed", "confirmed"].includes(ord.order_status)) {
          itemRequirements[key].pendingPackQty += item.qty;
        } else if (ord.order_status === "packed" || ord.order_status === "out_for_delivery") {
          itemRequirements[key].dispatchedQty += item.qty;
        } else if (ord.order_status === "delivered") {
          itemRequirements[key].deliveredQty += item.qty;
        }
      }
    }

    return NextResponse.json({
      success: true,
      school,
      metrics: {
        totalOrders: orders.length,
        totalRevenue,
        totalItemsOrdered,
        statusCounts,
      },
      classBreakdown: Object.entries(classBreakdown).map(([className, data]) => ({
        className,
        ...data,
      })),
      itemRequirements: Object.values(itemRequirements),
      inventorySummary: schoolProducts.map((sp) => ({
        id: sp.id,
        name: sp.product.name,
        color: sp.color_name,
        gender: sp.gender,
        classRange: `Class ${sp.class_from} - ${sp.class_to}`,
        variants: sp.variants.map((v) => ({
          id: v.id,
          size: v.size.size_label,
          price: v.price,
          stock: v.stock,
          reserved: v.reserved_stock,
        })),
      })),
    });
  } catch (error: any) {
    console.error("Error generating school reports:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
