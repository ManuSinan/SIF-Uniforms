import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

// GET single address
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json({ success: false, error: "Invalid address ID" }, { status: 400 });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, parent_id: session.userId },
    });

    if (!address) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH / PUT update address
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json({ success: false, error: "Invalid address ID" }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id: addressId, parent_id: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { name, phone, line1, line2, city, pincode, landmark, is_default } = body;

    const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(-10) : existing.phone;
    const cleanPincode = pincode ? String(pincode).trim() : existing.pincode;

    if (phone && cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }
    if (pincode && !/^\d{6}$/.test(cleanPincode)) {
      return NextResponse.json({ success: false, error: "Enter a valid 6-digit pincode" }, { status: 400 });
    }

    if (is_default) {
      await prisma.address.updateMany({
        where: { parent_id: session.userId },
        data: { is_default: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        phone: cleanPhone,
        line1: line1 !== undefined ? String(line1).trim() : existing.line1,
        line2: line2 !== undefined ? (line2?.trim() || null) : existing.line2,
        city: city !== undefined ? String(city).trim() : existing.city,
        pincode: cleanPincode,
        landmark: landmark !== undefined ? (landmark?.trim() || null) : existing.landmark,
        is_default: is_default !== undefined ? Boolean(is_default) : existing.is_default,
      },
    });

    return NextResponse.json({ success: true, address: updatedAddress });
  } catch (error: any) {
    console.error("Error updating address:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}

// DELETE address
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json({ success: false, error: "Invalid address ID" }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id: addressId, parent_id: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized" }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
