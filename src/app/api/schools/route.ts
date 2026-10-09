import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sort") || "name_asc";

    let orderBy: any = { name: "asc" };
    if (sortBy === "name_desc") orderBy = { name: "desc" };
    else if (sortBy === "code") orderBy = { code: "asc" };
    else if (sortBy === "created_desc") orderBy = { createdAt: "desc" };

    const schools = await prisma.school.findMany({
      where: { is_active: true },
      include: {
        serviceablePincodes: true,
        _count: {
          select: {
            orders: true,
            schoolProducts: true,
            students: true,
          },
        },
        schoolProducts: {
          where: { is_active: true },
          include: {
            product: { include: { sizes: true } },
            variants: { include: { size: true } },
          },
        },
      },
      orderBy,
    });

    return NextResponse.json({ success: true, schools });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Only super admins can onboard schools" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      code,
      primaryColor,
      secondaryColor,
      address,
      contactPhone,
      deliveryCharge,
      freeDeliveryAbove,
      pincodes,
      adminName,
      adminMobile,
      adminEmail,
      allowAdminPriceStockEdit,
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "School name and unique school code are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await prisma.school.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `School code '${cleanCode}' is already registered.` },
        { status: 400 }
      );
    }

    // Don't silently take over an existing admin/super-admin account
    const cleanAdminMobile = adminMobile ? String(adminMobile).replace(/\D/g, "").slice(-10) : "";
    if (cleanAdminMobile) {
      const existingUser = await prisma.user.findUnique({ where: { mobile: cleanAdminMobile } });
      if (existingUser && existingUser.role !== "parent") {
        return NextResponse.json(
          { success: false, error: `+91 ${cleanAdminMobile} is already an admin account. Use a different mobile number.` },
          { status: 400 }
        );
      }
    }

    // Convert Rupees to Paise
    const deliveryChargePaise = deliveryCharge ? Math.round(Number(deliveryCharge) * 100) : 0;
    const freeDeliveryAbovePaise = freeDeliveryAbove ? Math.round(Number(freeDeliveryAbove) * 100) : null;

    // Create School
    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        primary_color: primaryColor || "#1e3a8a",
        secondary_color: secondaryColor || "#f59e0b",
        address: address?.trim() || null,
        contact_phone: contactPhone?.trim() || null,
        delivery_charge: deliveryChargePaise,
        free_delivery_above: freeDeliveryAbovePaise,
        allow_admin_price_stock_edit: Boolean(allowAdminPriceStockEdit),
        is_active: true,
      },
    });

    // Create Serviceable Pincodes
    if (Array.isArray(pincodes) && pincodes.length > 0) {
      for (const pin of pincodes) {
        const cleanPin = String(pin).trim();
        if (cleanPin) {
          await prisma.schoolServiceablePincode.create({
            data: {
              school_id: school.id,
              pincode: cleanPin,
            },
          });
        }
      }
    }

    // Create/Assign School Admin Login User
    let adminUser = null;
    if (adminMobile) {
      const cleanMobile = adminMobile.replace(/\D/g, "").slice(-10);
      if (cleanMobile.length === 10) {
        adminUser = await prisma.user.upsert({
          where: { mobile: cleanMobile },
          update: {
            name: adminName?.trim() || `${school.name} Admin`,
            email: adminEmail?.trim() || undefined,
            role: "school_admin",
            school_id: school.id,
            is_active: true,
          },
          create: {
            mobile: cleanMobile,
            name: adminName?.trim() || `${school.name} Admin`,
            email: adminEmail?.trim() || undefined,
            role: "school_admin",
            school_id: school.id,
            is_active: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `School '${school.name}' onboarded successfully!`,
      school,
      adminUser,
    });
  } catch (error: any) {
    console.error("Error creating school:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create school" }, { status: 500 });
  }
}
