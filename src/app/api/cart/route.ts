import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import {
  countItems,
  findOwnedStudent,
  getOrCreateStudentCart,
  isProductForStudent,
  parseQty,
} from "@/lib/cart";

async function cartSummaries(parentId: number) {
  const carts = await prisma.cart.findMany({
    where: { parent_id: parentId, student_id: { not: null } },
    include: { student: true, items: { select: { qty: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return carts
    .filter((c) => c.items.length > 0 && c.student)
    .map((c) => ({
      cart_id: c.id,
      student_id: c.student_id,
      student_name: c.student!.name,
      count: countItems(c.items),
    }));
}

async function cartResponse(parentId: number, studentId: number) {
  const [cart, carts] = await Promise.all([
    getOrCreateStudentCart(parentId, studentId),
    cartSummaries(parentId),
  ]);
  return NextResponse.json({
    success: true,
    cart,
    carts,
    totalCount: carts.reduce((sum, c) => sum + c.count, 0),
  });
}

/**
 * GET /api/cart?studentId=X returns that child's cart.
 * Without studentId it returns the most recently used non-empty cart (or the first child's).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentIdParam = new URL(req.url).searchParams.get("studentId");
    if (studentIdParam) {
      const student = await findOwnedStudent(session.userId, studentIdParam);
      if (!student) {
        return NextResponse.json({ success: false, error: "Child not found" }, { status: 404 });
      }
      return cartResponse(session.userId, student.id);
    }

    const carts = await cartSummaries(session.userId);
    if (carts[0]?.student_id) {
      return cartResponse(session.userId, carts[0].student_id);
    }

    const firstStudent = await prisma.student.findFirst({
      where: { parent_id: session.userId },
      orderBy: { createdAt: "desc" },
    });
    if (!firstStudent) {
      return NextResponse.json({ success: true, cart: null, carts: [], totalCount: 0 });
    }
    return cartResponse(session.userId, firstStudent.id);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const variantId = Number(body.variant_id || body.variantId);
    const qty = parseQty(body.qty ?? 1);
    if (!variantId || !qty) {
      return NextResponse.json({ success: false, error: "Choose a size and a valid quantity" }, { status: 400 });
    }

    const student = await findOwnedStudent(session.userId, body.student_id || body.studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Please select your child first" }, { status: 400 });
    }
    if (student.verification_status === "rejected") {
      return NextResponse.json(
        { success: false, error: `${student.school.name} couldn't verify ${student.name}. Please contact the school.` },
        { status: 400 }
      );
    }

    const variant = await prisma.schoolProductVariant.findUnique({
      where: { id: variantId },
      include: { schoolProduct: { include: { product: true } } },
    });
    const sp = variant?.schoolProduct;
    if (!variant || !sp || !sp.is_active || !sp.product.is_active || sp.school_id !== student.school_id) {
      return NextResponse.json({ success: false, error: "This item isn't available at your child's school" }, { status: 400 });
    }
    if (!isProductForStudent(sp, student)) {
      return NextResponse.json(
        { success: false, error: `This item isn't part of the uniform for ${student.name}'s class` },
        { status: 400 }
      );
    }

    const cart = await getOrCreateStudentCart(session.userId, student.id);
    const existingItem = cart.items.find((it) => it.variant_id === variantId);
    const newQty = (existingItem?.qty || 0) + qty;

    if (newQty > variant.stock) {
      const msg = variant.stock <= 0 ? "This size is out of stock" : `Only ${variant.stock} left in this size`;
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    if (!parseQty(newQty)) {
      return NextResponse.json({ success: false, error: "You've reached the maximum quantity for this item" }, { status: 400 });
    }

    if (existingItem) {
      await prisma.cartItem.update({ where: { id: existingItem.id }, data: { qty: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cart_id: cart.id, variant_id: variantId, qty } });
    }
    await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

    return cartResponse(session.userId, student.id);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function findOwnedItem(parentId: number, itemId: number) {
  if (!Number.isInteger(itemId) || itemId <= 0) return null;
  return prisma.cartItem.findFirst({
    where: { id: itemId, cart: { parent_id: parentId } },
    include: { cart: true, variant: true },
  });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const item = await findOwnedItem(session.userId, Number(body.itemId || body.item_id));
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    if (Number(body.qty) <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      const qty = parseQty(body.qty);
      if (!qty) {
        return NextResponse.json({ success: false, error: "Invalid quantity" }, { status: 400 });
      }
      if (qty > item.variant.stock) {
        return NextResponse.json({ success: false, error: `Only ${item.variant.stock} left in this size` }, { status: 400 });
      }
      await prisma.cartItem.update({ where: { id: item.id }, data: { qty } });
    }

    return item.cart.student_id
      ? cartResponse(session.userId, item.cart.student_id)
      : NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || searchParams.get("item_id");
    const cartId = searchParams.get("cartId") || searchParams.get("cart_id");

    if (itemId) {
      const item = await findOwnedItem(session.userId, Number(itemId));
      if (!item) {
        return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
      }
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else if (cartId) {
      await prisma.cartItem.deleteMany({
        where: { cart_id: Number(cartId), cart: { parent_id: session.userId } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

