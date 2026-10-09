import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { generateOrderNo } from "@/lib/config/constants";
import { nanoid } from "nanoid";
import { expireStaleOrders, orderExpiryDate } from "@/lib/orders/lifecycle";
import {
  CART_INCLUDE,
  computeDeliveryCharge,
  findOwnedStudent,
  isPincodeServiceable,
  isProductForStudent,
} from "@/lib/cart";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const schoolId = searchParams.get("schoolId");

    const whereClause: any = {};

    if (session.role === "parent") {
      whereClause.parent_id = session.userId;
      await expireStaleOrders({ parent_id: session.userId });
    } else if (session.role === "school_admin") {
      if (!session.schoolId) {
        return NextResponse.json({ success: false, error: "No school linked to this account" }, { status: 403 });
      }
      whereClause.school_id = session.schoolId;
      // Unpaid checkouts aren't real orders yet; keep them out of the school's queue.
      whereClause.order_status = { not: "pending_payment" };
    } else if (session.role === "super_admin") {
      if (schoolId) {
        whereClause.school_id = Number(schoolId);
      }
    }

    if (status && status !== "all" && !(session.role === "school_admin" && status === "pending_payment")) {
      whereClause.order_status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        school: true,
        student: true,
        parent: { select: { id: true, name: true, mobile: true } },
        items: true,
        payments: true,
        changeRequests: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
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

    // 1. Student must belong to this parent; each child has their own cart.
    const student = await findOwnedStudent(session.userId, body.student_id || body.studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Please select your child before ordering" }, { status: 400 });
    }

    // 2. A real, owned delivery address is required.
    const addressId = Number(body.address_id || body.addressId);
    const address = addressId
      ? await prisma.address.findFirst({ where: { id: addressId, parent_id: session.userId } })
      : null;
    if (!address) {
      return NextResponse.json({ success: false, error: "Please add a delivery address" }, { status: 400 });
    }

    if (student.verification_status === "rejected") {
      return NextResponse.json(
        { success: false, error: `${student.school.name} couldn't verify ${student.name}. Please contact the school.` },
        { status: 400 }
      );
    }

    const school = student.school;
    if (!school.is_active) {
      return NextResponse.json({ success: false, error: `${school.name} isn't taking orders right now` }, { status: 400 });
    }
    if (!(await isPincodeServiceable(school.id, address.pincode))) {
      return NextResponse.json(
        { success: false, error: `Sorry, ${school.name} doesn't deliver to pincode ${address.pincode} yet`, code: "PINCODE_NOT_SERVICEABLE" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findFirst({
      where: { parent_id: session.userId, student_id: student.id },
      include: CART_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: "Your bag is empty" }, { status: 400 });
    }

    // 3. Re-validate every item against the school, the child and current stock.
    let itemsTotal = 0;
    const orderItemsData = [];
    for (const item of cart.items) {
      const sp = item.variant.schoolProduct;
      const label = `${sp.product.name} (${item.variant.size.size_label})`;
      if (sp.school_id !== school.id || !sp.is_active || !sp.product.is_active || !isProductForStudent(sp, student)) {
        return NextResponse.json({ success: false, error: `${label} is no longer available. Please remove it from your bag.` }, { status: 400 });
      }
      if (item.qty > item.variant.stock) {
        const msg = item.variant.stock <= 0 ? `${label} is out of stock` : `Only ${item.variant.stock} left of ${label}`;
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      itemsTotal += item.variant.price * item.qty;
      orderItemsData.push({
        variant_id: item.variant_id,
        item_name: sp.product.name,
        size: item.variant.size.size_label,
        color: sp.color_name,
        qty: item.qty,
        unit_price: item.variant.price,
      });
    }

    const deliveryCharge = computeDeliveryCharge(school, itemsTotal);
    const grandTotal = itemsTotal + deliveryCharge;

    const order = await prisma.order.create({
      data: {
        order_no: generateOrderNo(school.code),
        parent_id: session.userId,
        student_id: student.id,
        school_id: school.id,
        address_id: address.id,
        address_snapshot: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          pincode: address.pincode,
          landmark: address.landmark,
        },
        items_total: itemsTotal,
        delivery_charge: deliveryCharge,
        grand_total: grandTotal,
        amount_paid: 0,
        payment_status: "pending",
        order_status: "pending_payment",
        tracking_token: nanoid(16),
        expires_at: orderExpiryDate(),
        items: { create: orderItemsData },
        statusHistory: {
          create: { status: "pending_payment", note: "Order created awaiting payment" },
        },
      },
      include: { items: true, school: true },
    });

    await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
