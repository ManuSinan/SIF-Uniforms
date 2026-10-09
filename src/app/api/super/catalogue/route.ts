import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/jwt";
import { CLASS_ORDER, getClassIndex, isProductForStudent } from "@/lib/config/constants";
import { Gender } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      schoolId,
      productName,
      category,
      description,
      sizeChartText,
      colorName,
      gender,
      classFrom,
      classTo,
      variants, // Array of { sizeLabel: string, price: number (in rupees), stock: number }
    } = body;

    if (!schoolId || !productName || !category || !colorName) {
      return NextResponse.json(
        { success: false, error: "School, Product Name, Category, and Color are required." },
        { status: 400 }
      );
    }

    const numSchoolId = Number(schoolId);

    // 1. Find or create Master Product
    let product = await prisma.product.findFirst({
      where: { name: productName.trim() },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: productName.trim(),
          category: category.trim(),
          description: description?.trim() || null,
          size_chart_text: sizeChartText?.trim() || null,
          is_active: true,
        },
      });
    }

    // 2. Ensure sizes exist for the product
    const sizeMap: Record<string, number> = {};
    if (Array.isArray(variants) && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const sLabel = String(v.sizeLabel).trim();
        if (!sLabel) continue;

        let pSize = await prisma.productSize.findFirst({
          where: { product_id: product.id, size_label: sLabel },
        });

        if (!pSize) {
          pSize = await prisma.productSize.create({
            data: {
              product_id: product.id,
              size_label: sLabel,
              sort_order: i + 1,
            },
          });
        }
        sizeMap[sLabel] = pSize.id;
      }
    }

    // 3. Create or update SchoolProduct allocation
    let mappedGender: Gender = Gender.all;
    if (gender === "boys") mappedGender = Gender.boys;
    else if (gender === "girls") mappedGender = Gender.girls;

    let schoolProduct = await prisma.schoolProduct.findFirst({
      where: {
        school_id: numSchoolId,
        product_id: product.id,
        color_name: colorName.trim(),
      },
    });

    if (!schoolProduct) {
      schoolProduct = await prisma.schoolProduct.create({
        data: {
          school_id: numSchoolId,
          product_id: product.id,
          color_name: colorName.trim(),
          gender: mappedGender,
          class_from: classFrom?.trim() || "1",
          class_to: classTo?.trim() || "12",
          is_active: true,
        },
      });
    }

    // 4. Create/Upsert variants
    if (Array.isArray(variants)) {
      for (const v of variants) {
        const sLabel = String(v.sizeLabel).trim();
        const sizeId = sizeMap[sLabel];
        if (!sizeId) continue;

        const pricePaise = v.price ? Math.round(Number(v.price) * 100) : 50000;
        const stockCount = v.stock ? Number(v.stock) : 50;

        const existingVariant = await prisma.schoolProductVariant.findFirst({
          where: { school_product_id: schoolProduct.id, size_id: sizeId },
        });

        if (existingVariant) {
          await prisma.schoolProductVariant.update({
            where: { id: existingVariant.id },
            data: {
              price: pricePaise,
              stock: stockCount,
            },
          });
        } else {
          await prisma.schoolProductVariant.create({
            data: {
              school_product_id: schoolProduct.id,
              size_id: sizeId,
              price: pricePaise,
              stock: stockCount,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Uniform item '${product.name}' allocated to school successfully!`,
      schoolProduct,
    });
  } catch (error: any) {
    console.error("Error creating catalog item:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create catalog item" }, { status: 500 });
  }
}

/**
 * Catalogue coverage: for each school, which class + gender combinations have no top or no bottom,
 * within the class range the school sells for at all.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    where: { is_active: true },
    include: { schoolProducts: { where: { is_active: true, product: { is_active: true } }, include: { product: true } } },
    orderBy: { name: "asc" },
  });

  const KINDS = [
    { key: "top", match: (cat: string) => /top|shirt/i.test(cat) },
    { key: "bottom", match: (cat: string) => /bottom|skirt|pant|short|trouser/i.test(cat) },
  ];

  const coverage = schools.map((school) => {
    const sps = school.schoolProducts;
    if (sps.length === 0) return { school_id: school.id, code: school.code, name: school.name, gaps: [], empty: true };
    const from = Math.min(...sps.map((sp) => getClassIndex(sp.class_from)));
    const to = Math.max(...sps.map((sp) => getClassIndex(sp.class_to)));

    const gaps: { class: string; gender: string; missing: string[] }[] = [];
    for (const cls of CLASS_ORDER.slice(from, to + 1)) {
      for (const gender of ["boys", "girls"]) {
        const items = sps.filter((sp) => isProductForStudent(sp, { class: cls, gender }));
        const missing = KINDS.filter((k) => !items.some((it) => k.match(`${it.product.category} ${it.product.name}`))).map((k) => k.key);
        if (missing.length) gaps.push({ class: cls, gender, missing });
      }
    }
    return { school_id: school.id, code: school.code, name: school.name, gaps, empty: false };
  });

  return NextResponse.json({ success: true, coverage });
}
