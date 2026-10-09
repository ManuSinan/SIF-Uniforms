import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "school_admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, stock, price } = body;

    if (!variantId) {
      return NextResponse.json({ success: false, error: "Variant ID is required" }, { status: 400 });
    }

    const variant = await prisma.schoolProductVariant.findUnique({
      where: { id: Number(variantId) },
      include: {
        schoolProduct: {
          include: { school: true },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
    }

    // Permission check for school admin
    if (session.role === "school_admin") {
      if (variant.schoolProduct.school_id !== session.schoolId) {
        return NextResponse.json({ success: false, error: "Forbidden: Not your school" }, { status: 403 });
      }
      if (!variant.schoolProduct.school.allow_admin_price_stock_edit) {
        return NextResponse.json(
          { success: false, error: "Price and stock for this school are managed by SIF UNIFORMS. Contact the platform team to change them." },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (stock !== undefined && stock !== null) {
      const parsedStock = parseInt(stock, 10);
      if (!isNaN(parsedStock) && parsedStock >= 0) {
        updateData.stock = parsedStock;
      }
    }

    if (price !== undefined && price !== null) {
      const parsedPriceRupees = parseFloat(price);
      if (!isNaN(parsedPriceRupees) && parsedPriceRupees >= 0) {
        updateData.price = Math.round(parsedPriceRupees * 100); // to paise
      }
    }

    const updated = await prisma.schoolProductVariant.update({
      where: { id: Number(variantId) },
      data: updateData,
      include: { size: true },
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (error: any) {
    console.error("Error updating variant:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
