import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { parent_id: session.userId },
      orderBy: { is_default: "desc" },
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, line1, line2, city, pincode, landmark, is_default } = body;

    if (!name || !phone || !line1 || !city || !pincode) {
      return NextResponse.json({ success: false, error: "Required address fields are missing" }, { status: 400 });
    }
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const cleanPincode = String(pincode).trim();
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(cleanPincode)) {
      return NextResponse.json({ success: false, error: "Enter a valid 6-digit pincode" }, { status: 400 });
    }

    if (is_default) {
      await prisma.address.updateMany({
        where: { parent_id: session.userId },
        data: { is_default: false },
      });
    }

    const count = await prisma.address.count({ where: { parent_id: session.userId } });

    const address = await prisma.address.create({
      data: {
        parent_id: session.userId,
        name: String(name).trim(),
        phone: cleanPhone,
        line1: String(line1).trim(),
        line2: line2 || null,
        city: String(city).trim(),
        pincode: cleanPincode,
        landmark: landmark || null,
        is_default: is_default || count === 0,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
