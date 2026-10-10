import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/jwt";

// GET single school details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = parseInt(id, 10);
    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: "Invalid school ID" }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        serviceablePincodes: {
          orderBy: { pincode: "asc" },
        },
        users: {
          where: { role: "school_admin" },
          select: { id: true, name: true, mobile: true, email: true, role: true, is_active: true },
        },
        _count: {
          select: {
            orders: true,
            schoolProducts: true,
            students: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, school });
  } catch (error: any) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH / PUT update school details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = parseInt(id, 10);
    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: "Invalid school ID" }, { status: 400 });
    }

    const session = await getSession();
    const isSuperAdmin = session?.role === "super_admin";
    const isSchoolAdmin = session?.role === "school_admin" && session?.schoolId === schoolId;

    if (!session || (!isSuperAdmin && !isSchoolAdmin)) {
      return NextResponse.json({ success: false, error: "Unauthorized to modify school details" }, { status: 403 });
    }

    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { serviceablePincodes: true },
    });

    if (!existingSchool) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      code,
      logo_url,
      primaryColor,
      secondaryColor,
      address,
      contactPhone,
      deliveryCharge,
      freeDeliveryAbove,
      pincodes,
      allowAdminPriceStockEdit,
      is_active,
      adminName,
      adminMobile,
      adminEmail,
    } = body;

    // Check code uniqueness if changing code
    let cleanCode = existingSchool.code;
    if (code !== undefined && code.trim() !== "") {
      cleanCode = code.trim().toUpperCase();
      if (cleanCode !== existingSchool.code) {
        const duplicateCode = await prisma.school.findUnique({
          where: { code: cleanCode },
        });
        if (duplicateCode && duplicateCode.id !== schoolId) {
          return NextResponse.json(
            { success: false, error: `School code '${cleanCode}' is already used by another school.` },
            { status: 400 }
          );
        }
      }
    }

    // Convert Rupees to paise
    const deliveryChargePaise = deliveryCharge !== undefined
      ? Math.round(Number(deliveryCharge) * 100)
      : existingSchool.delivery_charge;

    const freeDeliveryAbovePaise = freeDeliveryAbove !== undefined
      ? (freeDeliveryAbove === null || freeDeliveryAbove === "" || Number(freeDeliveryAbove) <= 0
          ? null
          : Math.round(Number(freeDeliveryAbove) * 100))
      : existingSchool.free_delivery_above;

    // Update School record
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: name !== undefined ? name.trim() : existingSchool.name,
        code: cleanCode,
        logo_url: logo_url !== undefined ? (logo_url?.trim() || null) : existingSchool.logo_url,
        primary_color: primaryColor !== undefined ? primaryColor : existingSchool.primary_color,
        secondary_color: secondaryColor !== undefined ? secondaryColor : existingSchool.secondary_color,
        address: address !== undefined ? (address?.trim() || null) : existingSchool.address,
        contact_phone: contactPhone !== undefined ? (contactPhone?.trim() || null) : existingSchool.contact_phone,
        delivery_charge: deliveryChargePaise,
        free_delivery_above: freeDeliveryAbovePaise,
        allow_admin_price_stock_edit: allowAdminPriceStockEdit !== undefined
          ? Boolean(allowAdminPriceStockEdit)
          : existingSchool.allow_admin_price_stock_edit,
        is_active: is_active !== undefined ? Boolean(is_active) : existingSchool.is_active,
      },
    });

    // Synchronize Serviceable Pincodes if provided
    if (pincodes !== undefined && Array.isArray(pincodes)) {
      const sanitizedPincodes = Array.from(
        new Set(
          pincodes
            .map((p) => String(p).trim().replace(/\D/g, ""))
            .filter((p) => p.length >= 3 && p.length <= 10)
        )
      );

      const existingPins = existingSchool.serviceablePincodes.map((p) => p.pincode);
      const pinsToDelete = existingSchool.serviceablePincodes
        .filter((p) => !sanitizedPincodes.includes(p.pincode))
        .map((p) => p.id);

      const pinsToAdd = sanitizedPincodes.filter((p) => !existingPins.includes(p));

      // Remove deleted pins
      if (pinsToDelete.length > 0) {
        await prisma.schoolServiceablePincode.deleteMany({
          where: { id: { in: pinsToDelete } },
        });
      }

      // Add new pins
      if (pinsToAdd.length > 0) {
        await prisma.schoolServiceablePincode.createMany({
          data: pinsToAdd.map((pin) => ({
            school_id: schoolId,
            pincode: pin,
          })),
        });
      }
    }

    // Update / Upsert School Admin Account if provided
    let updatedAdmin = null;
    if (adminMobile !== undefined && String(adminMobile).trim() !== "") {
      const cleanMobile = String(adminMobile).replace(/\D/g, "").slice(-10);
      if (cleanMobile.length === 10) {
        updatedAdmin = await prisma.user.upsert({
          where: { mobile: cleanMobile },
          update: {
            name: adminName?.trim() || undefined,
            email: adminEmail !== undefined ? (adminEmail?.trim() || null) : undefined,
            role: "school_admin",
            school_id: schoolId,
            is_active: true,
          },
          create: {
            mobile: cleanMobile,
            name: adminName?.trim() || `${updatedSchool.name} Admin`,
            email: adminEmail?.trim() || null,
            role: "school_admin",
            school_id: schoolId,
            is_active: true,
          },
        });
      }
    }

    // Fetch refreshed school data
    const completeSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        serviceablePincodes: {
          orderBy: { pincode: "asc" },
        },
        users: {
          where: { role: "school_admin" },
          select: { id: true, name: true, mobile: true, email: true, role: true, is_active: true },
        },
        _count: {
          select: {
            orders: true,
            schoolProducts: true,
            students: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `School '${completeSchool?.name}' updated successfully!`,
      school: completeSchool,
      admin: updatedAdmin,
    });
  } catch (error: any) {
    console.error("Error updating school:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update school" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}

// DELETE / Deactivate school
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Only super admins can delete schools" }, { status: 403 });
    }

    const { id } = await params;
    const schoolId = parseInt(id, 10);
    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: "Invalid school ID" }, { status: 400 });
    }

    // Check if school has orders
    const ordersCount = await prisma.order.count({
      where: { school_id: schoolId },
    });

    if (ordersCount > 0) {
      // Soft-delete by setting is_active = false
      await prisma.school.update({
        where: { id: schoolId },
        data: { is_active: false },
      });
      return NextResponse.json({
        success: true,
        message: "School has existing orders and has been safely deactivated instead of deleted.",
      });
    }

    // Hard delete if no orders
    await prisma.school.delete({
      where: { id: schoolId },
    });

    return NextResponse.json({
      success: true,
      message: "School removed successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting school:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
