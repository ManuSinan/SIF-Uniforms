import { PrismaClient, Role, Gender, OrderStatus, PaymentStatus, ChangeRequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding with full multi-school dummy data...");

  // 1. Seed Super Admin
  const superAdminMobile = process.env.SUPER_ADMIN_MOBILE || "9876543210";
  const superAdmin = await prisma.user.upsert({
    where: { mobile: superAdminMobile },
    update: {
      name: "Platform Super Admin",
      role: Role.super_admin,
      is_active: true,
    },
    create: {
      mobile: superAdminMobile,
      name: "Platform Super Admin",
      email: "superadmin@schoolfit.local",
      role: Role.super_admin,
      is_active: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.name} (${superAdmin.mobile})`);

  // 2. Define 6 Partner Schools
  const schoolsData = [
    {
      code: "SXHS",
      name: "St. Xavier's High School",
      logo_url: "/images/schools/sxhs-logo.jpg",
      primary_color: "#1e3a8a",
      secondary_color: "#f59e0b",
      delivery_charge: 10000, // ₹100
      free_delivery_above: 200000, // ₹2,000
      allow_admin_price_stock_edit: true,
      address: "12 Church Street, Richmond Town, Bengaluru, Karnataka 560025",
      contact_phone: "+91 80 2221 4455",
      pincodes: ["560001", "560002", "560025", "560034", "560047"],
      adminMobile: "9876543211",
      adminName: "Fr. Thomas (SXHS Admin)",
      adminEmail: "admin@stxaviers.edu",
    },
    {
      code: "GWIS",
      name: "Greenwood International School",
      logo_url: "/images/schools/gwis-logo.jpg",
      primary_color: "#065f46",
      secondary_color: "#f97316",
      delivery_charge: 15000, // ₹150
      free_delivery_above: 250000, // ₹2,500
      allow_admin_price_stock_edit: false,
      address: "Varthur Sarjapur Road, Gunjur Post, Bengaluru, Karnataka 560087",
      contact_phone: "+91 80 2853 8811",
      pincodes: ["560066", "560087", "560103", "560037"],
      adminMobile: "9876543212",
      adminName: "Mrs. Sharma (GWIS Admin)",
      adminEmail: "admin@greenwood.edu",
    },
    {
      code: "MES",
      name: "MES Higher Secondary School",
      logo_url: "/images/schools/mes-logo.jpg",
      primary_color: "#0f766e",
      secondary_color: "#fbbf24",
      delivery_charge: 8000, // ₹80
      free_delivery_above: 150000, // ₹1,500
      allow_admin_price_stock_edit: true,
      address: "15th Cross, Malleshwaram, Bengaluru, Karnataka 560003",
      contact_phone: "+91 80 2334 1122",
      pincodes: ["560003", "560055", "560012", "560021"],
      adminMobile: "9876543213",
      adminName: "Prof. K. Menon (MES Admin)",
      adminEmail: "admin@meschool.edu",
    },
    {
      code: "JDT",
      name: "JDT Iqraa English School",
      logo_url: "/images/schools/jdt-logo.jpg",
      primary_color: "#92400e",
      secondary_color: "#1e3a8a",
      delivery_charge: 9000, // ₹90
      free_delivery_above: 180000, // ₹1,800
      allow_admin_price_stock_edit: false,
      address: "Calicut Bypass Road, Kozhikode, Kerala 673012",
      contact_phone: "+91 495 273 0123",
      pincodes: ["673012", "673001", "673004", "673006"],
      adminMobile: "9876543214",
      adminName: "Mr. Ashraf (JDT Admin)",
      adminEmail: "admin@jdtiqraa.edu",
    },
    {
      code: "MR",
      name: "Markaz Residential School",
      logo_url: "/images/schools/markaz-logo.jpg",
      primary_color: "#1e293b",
      secondary_color: "#10b981",
      delivery_charge: 12000, // ₹120
      free_delivery_above: 220000, // ₹2,200
      allow_admin_price_stock_edit: true,
      address: "Karanthur, Kozhikode, Kerala 673571",
      contact_phone: "+91 495 280 5500",
      pincodes: ["673571", "673570", "673572", "673574"],
      adminMobile: "9876543215",
      adminName: "Usthad Farooq (Markaz Admin)",
      adminEmail: "admin@markaz.edu",
    },
    {
      code: "KMO",
      name: "KMO English Medium School",
      logo_url: "/images/schools/kmo-logo.jpg",
      primary_color: "#4338ca",
      secondary_color: "#ec4899",
      delivery_charge: 7500, // ₹75
      free_delivery_above: 150000, // ₹1,500
      allow_admin_price_stock_edit: false,
      address: "Koduvally, Kozhikode, Kerala 673572",
      contact_phone: "+91 495 221 0099",
      pincodes: ["673572", "673585", "673573"],
      adminMobile: "9876543216",
      adminName: "Mrs. Rahila (KMO Admin)",
      adminEmail: "admin@kmoschool.edu",
    },
  ];

  const seededSchools: Record<string, any> = {};

  for (const sData of schoolsData) {
    const sch = await prisma.school.upsert({
      where: { code: sData.code },
      update: {
        name: sData.name,
        logo_url: sData.logo_url,
        primary_color: sData.primary_color,
        secondary_color: sData.secondary_color,
        delivery_charge: sData.delivery_charge,
        free_delivery_above: sData.free_delivery_above,
        allow_admin_price_stock_edit: sData.allow_admin_price_stock_edit,
        address: sData.address,
        contact_phone: sData.contact_phone,
        is_active: true,
      },
      create: {
        code: sData.code,
        name: sData.name,
        logo_url: sData.logo_url,
        primary_color: sData.primary_color,
        secondary_color: sData.secondary_color,
        delivery_charge: sData.delivery_charge,
        free_delivery_above: sData.free_delivery_above,
        allow_admin_price_stock_edit: sData.allow_admin_price_stock_edit,
        address: sData.address,
        contact_phone: sData.contact_phone,
        is_active: true,
      },
    });

    seededSchools[sData.code] = sch;

    // Pincodes
    for (const pin of sData.pincodes) {
      const existingPin = await prisma.schoolServiceablePincode.findFirst({
        where: { school_id: sch.id, pincode: pin },
      });
      if (!existingPin) {
        await prisma.schoolServiceablePincode.create({
          data: { school_id: sch.id, pincode: pin },
        });
      }
    }

    // School Admin
    await prisma.user.upsert({
      where: { mobile: sData.adminMobile },
      update: {
        name: sData.adminName,
        email: sData.adminEmail,
        role: Role.school_admin,
        school_id: sch.id,
        is_active: true,
      },
      create: {
        mobile: sData.adminMobile,
        name: sData.adminName,
        email: sData.adminEmail,
        role: Role.school_admin,
        school_id: sch.id,
        is_active: true,
      },
    });

    console.log(`✅ Seeded school: ${sch.name} (${sch.code}) with Admin ${sData.adminMobile}`);
  }

  // 3. Seed Master Products & Sizes
  const masterProductsData = [
    {
      name: "Classic Regular Uniform Shirt",
      category: "Tops",
      description: "Breathable poly-cotton blend with reinforced collar and twin button cuffs.",
      sizeChartText: "Size 28: Chest 30in | Size 30: Chest 32in | Size 32: Chest 34in | Size 34: Chest 36in | Size 36: Chest 38in",
      sizes: ["28", "30", "32", "34", "36", "38"],
    },
    {
      name: "Pleated Uniform Shorts",
      category: "Bottoms",
      description: "Durable twill weave with elasticated waistband and deep pockets.",
      sizeChartText: "Size 24: Waist 24in | Size 26: Waist 26in | Size 28: Waist 28in | Size 30: Waist 30in",
      sizes: ["24", "26", "28", "30"],
    },
    {
      name: "Box Pleat Uniform Skirt",
      category: "Bottoms",
      description: "Comfortable crease-resistant pleats with side zip and adjustable inner elastic.",
      sizeChartText: "Size 24: Waist 24in, L 16in | Size 26: Waist 26in, L 18in | Size 28: Waist 28in, L 20in",
      sizes: ["24", "26", "28", "30"],
    },
    {
      name: "Formal School Crest Blazer",
      category: "Outerwear",
      description: "Tailored poly-viscose blazer with metallic crest buttons and padded shoulders.",
      sizeChartText: "Size 32: Chest 34in | Size 34: Chest 36in | Size 36: Chest 38in | Size 38: Chest 40in",
      sizes: ["32", "34", "36", "38", "40"],
    },
    {
      name: "Sports PE House T-Shirt",
      category: "Sports",
      description: "Dry-fit moisture-wicking fabric engineered for maximum athletic mobility.",
      sizeChartText: "Size 28: Chest 30in | Size 30: Chest 32in | Size 32: Chest 34in | Size 34: Chest 36in",
      sizes: ["28", "30", "32", "34", "36"],
    },
    {
      name: "PE Sports Track Pants",
      category: "Sports",
      description: "Breathable stretch fabric with contrast side piping and zipped ankle cuffs.",
      sizeChartText: "Size 26: Waist 26in | Size 28: Waist 28in | Size 30: Waist 30in | Size 32: Waist 32in",
      sizes: ["26", "28", "30", "32"],
    },
    {
      name: "School Formal Woven Tie",
      category: "Accessories",
      description: "Jacquard woven polyester tie with satin crest emblem.",
      sizeChartText: "Standard Length (48 inches)",
      sizes: ["Standard"],
    },
    {
      name: "Formal School Shoes & Socks Set",
      category: "Footwear",
      description: "High-grade leatherette uniform shoes with anti-skid rubber sole and 2 pairs of socks.",
      sizeChartText: "Size 3 to Size 8 UK/India",
      sizes: ["3", "4", "5", "6", "7", "8"],
    },
  ];

  const seededProducts: Record<string, any> = {};

  for (const prodData of masterProductsData) {
    let prod = await prisma.product.findFirst({
      where: { name: prodData.name },
    });

    if (!prod) {
      prod = await prisma.product.create({
        data: {
          name: prodData.name,
          category: prodData.category,
          description: prodData.description,
          size_chart_text: prodData.sizeChartText,
          is_active: true,
        },
      });
    }

    for (let i = 0; i < prodData.sizes.length; i++) {
      const sizeLabel = prodData.sizes[i];
      const existingSize = await prisma.productSize.findFirst({
        where: { product_id: prod.id, size_label: sizeLabel },
      });
      if (!existingSize) {
        await prisma.productSize.create({
          data: {
            product_id: prod.id,
            size_label: sizeLabel,
            sort_order: i + 1,
          },
        });
      }
    }

    // Reload with sizes
    seededProducts[prodData.name] = await prisma.product.findUnique({
      where: { id: prod.id },
      include: { sizes: true },
    });
  }
  console.log("✅ Master products & sizes seeded.");

  // 4. Assign Catalog Items to each school
  const catalogMap: Record<
    string,
    { product: string; color: string; imageUrl: string; price: number; gender: Gender; classFrom: string; classTo: string }[]
  > = {
    SXHS: [
      { product: "Classic Regular Uniform Shirt", color: "Sky Blue", imageUrl: "/images/uniforms/sky-blue-shirt.jpg", price: 55000, gender: Gender.all, classFrom: "1", classTo: "10" },
      { product: "Pleated Uniform Shorts", color: "Navy Blue", imageUrl: "/images/uniforms/navy-shorts.jpg", price: 48000, gender: Gender.boys, classFrom: "1", classTo: "7" },
      { product: "Formal School Crest Blazer", color: "Navy Blue with Gold Trim", imageUrl: "/images/uniforms/navy-blazer.jpg", price: 185000, gender: Gender.all, classFrom: "5", classTo: "12" },
      { product: "School Formal Woven Tie", color: "Navy Blue with Gold Stripes", imageUrl: "/images/uniforms/navy-tie.jpg", price: 18000, gender: Gender.all, classFrom: "1", classTo: "12" },
      { product: "Sports PE House T-Shirt", color: "House Blue / Red", imageUrl: "/images/uniforms/sports-tshirt.jpg", price: 42000, gender: Gender.all, classFrom: "1", classTo: "12" },
    ],
    GWIS: [
      { product: "Classic Regular Uniform Shirt", color: "Forest Green Pin-Stripe", imageUrl: "/images/uniforms/green-shirt.jpg", price: 62000, gender: Gender.all, classFrom: "1", classTo: "12" },
      { product: "Box Pleat Uniform Skirt", color: "Dark Bottle Green", imageUrl: "/images/uniforms/green-skirt.jpg", price: 59000, gender: Gender.girls, classFrom: "1", classTo: "10" },
      { product: "Formal School Crest Blazer", color: "Deep Bottle Green", imageUrl: "/images/uniforms/green-blazer.jpg", price: 195000, gender: Gender.all, classFrom: "6", classTo: "12" },
      { product: "School Formal Woven Tie", color: "Green with Orange Stripe", imageUrl: "/images/uniforms/navy-tie.jpg", price: 20000, gender: Gender.all, classFrom: "1", classTo: "12" },
    ],
    MES: [
      { product: "Classic Regular Uniform Shirt", color: "Teal White Check", imageUrl: "/images/uniforms/white-shirt.jpg", price: 52000, gender: Gender.all, classFrom: "1", classTo: "10" },
      { product: "Sports PE House T-Shirt", color: "Red House Athletic Tee", imageUrl: "/images/uniforms/red-sports-tshirt.jpg", price: 39000, gender: Gender.all, classFrom: "1", classTo: "12" },
      { product: "PE Sports Track Pants", color: "Teal Navy Tracksuit", imageUrl: "/images/uniforms/track-pants.jpg", price: 68000, gender: Gender.all, classFrom: "1", classTo: "12" },
    ],
    JDT: [
      { product: "Classic Regular Uniform Shirt", color: "Beige & Brown Pinstripe", imageUrl: "/images/uniforms/white-shirt.jpg", price: 56000, gender: Gender.all, classFrom: "1", classTo: "10" },
      { product: "Pleated Uniform Shorts", color: "Dark Chocolate Brown", imageUrl: "/images/uniforms/brown-shorts.jpg", price: 49000, gender: Gender.boys, classFrom: "1", classTo: "7" },
      { product: "Box Pleat Uniform Skirt", color: "Dark Chocolate Brown", imageUrl: "/images/uniforms/brown-skirt.jpg", price: 54000, gender: Gender.girls, classFrom: "1", classTo: "10" },
      { product: "School Formal Woven Tie", color: "Brown & Gold Tie", imageUrl: "/images/uniforms/navy-tie.jpg", price: 17500, gender: Gender.all, classFrom: "1", classTo: "12" },
    ],
    MR: [
      { product: "Classic Regular Uniform Shirt", color: "Crisp Pure White", imageUrl: "/images/uniforms/white-shirt.jpg", price: 50000, gender: Gender.all, classFrom: "1", classTo: "12" },
      { product: "Formal School Shoes & Socks Set", color: "Black Leatherette Set", imageUrl: "/images/uniforms/school-shoes.jpg", price: 85000, gender: Gender.all, classFrom: "1", classTo: "12" },
      { product: "School Formal Woven Tie", color: "Emerald & Slate Stripe", imageUrl: "/images/uniforms/navy-tie.jpg", price: 19000, gender: Gender.all, classFrom: "1", classTo: "12" },
    ],
    KMO: [
      { product: "Classic Regular Uniform Shirt", color: "Lavender & Navy Accent", imageUrl: "/images/uniforms/sky-blue-shirt.jpg", price: 54000, gender: Gender.all, classFrom: "1", classTo: "10" },
      { product: "Box Pleat Uniform Skirt", color: "Navy Blue Pleats", imageUrl: "/images/uniforms/navy-skirt.jpg", price: 52000, gender: Gender.girls, classFrom: "1", classTo: "10" },
      { product: "Sports PE House T-Shirt", color: "Electric Blue PE Shirt", imageUrl: "/images/uniforms/sports-tshirt.jpg", price: 40000, gender: Gender.all, classFrom: "1", classTo: "10" },
    ],
  };

  const schoolVariantsMap: Record<string, any[]> = {};

  for (const [schCode, items] of Object.entries(catalogMap)) {
    const sch = seededSchools[schCode];
    if (!sch) continue;

    schoolVariantsMap[schCode] = [];

    for (const item of items) {
      const prod = seededProducts[item.product];
      if (!prod) continue;

      let schProd = await prisma.schoolProduct.findFirst({
        where: { school_id: sch.id, product_id: prod.id },
      });

      if (!schProd) {
        schProd = await prisma.schoolProduct.create({
          data: {
            school_id: sch.id,
            product_id: prod.id,
            color_name: item.color,
            image_url: item.imageUrl,
            gender: item.gender,
            class_from: item.classFrom,
            class_to: item.classTo,
            is_active: true,
          },
        });
      } else {
        schProd = await prisma.schoolProduct.update({
          where: { id: schProd.id },
          data: {
            image_url: item.imageUrl,
            color_name: item.color,
          },
        });
      }

      for (const sz of prod.sizes) {
        let variant = await prisma.schoolProductVariant.findFirst({
          where: { school_product_id: schProd.id, size_id: sz.id },
        });

        if (!variant) {
          variant = await prisma.schoolProductVariant.create({
            data: {
              school_product_id: schProd.id,
              size_id: sz.id,
              price: item.price,
              stock: 60,
            },
          });
        }

        schoolVariantsMap[schCode].push({
          variant,
          productName: prod.name,
          color: item.color,
          sizeLabel: sz.size_label,
          price: item.price,
        });
      }
    }
  }
  console.log("✅ School catalogs & variants configured.");

  // 5. Seed Demo Parents, Students & Addresses
  const parentsData = [
    {
      mobile: "9876543299",
      name: "Rajesh Sharma",
      email: "rajesh.sharma@example.com",
      address: {
        line1: "Flat 402, Shanthi Residency, 12th Main",
        city: "Bengaluru",
        pincode: "560025",
      },
      students: [
        { name: "Aarav Sharma", class: "4", schoolCode: "SXHS", gender: Gender.boys },
        { name: "Ananya Sharma", class: "7", schoolCode: "SXHS", gender: Gender.girls },
      ],
    },
    {
      mobile: "9876543288",
      name: "Deepa Menon",
      email: "deepa.menon@example.com",
      address: {
        line1: "Villa 18, Palm Meadows, Whitefield",
        city: "Bengaluru",
        pincode: "560066",
      },
      students: [
        { name: "Diya Menon", class: "8", schoolCode: "GWIS", gender: Gender.girls },
      ],
    },
    {
      mobile: "9876543277",
      name: "Mohammed Faizal",
      email: "faizal.m@example.com",
      address: {
        line1: "House 24, 8th Cross, Malleshwaram",
        city: "Bengaluru",
        pincode: "560003",
      },
      students: [
        { name: "Faizan Faizal", class: "6", schoolCode: "MES", gender: Gender.boys },
      ],
    },
    {
      mobile: "9876543266",
      name: "Ayesha Khan",
      email: "ayesha.khan@example.com",
      address: {
        line1: "Rose Villa, Bypass Road",
        city: "Kozhikode",
        pincode: "673012",
      },
      students: [
        { name: "Rayan Khan", class: "2", schoolCode: "JDT", gender: Gender.boys },
      ],
    },
    {
      mobile: "9876543255",
      name: "Bilal Rasheed",
      email: "bilal.r@example.com",
      address: {
        line1: "Green Valley, Karanthur",
        city: "Kozhikode",
        pincode: "673571",
      },
      students: [
        { name: "Hadiya Bilal", class: "5", schoolCode: "MR", gender: Gender.girls },
      ],
    },
  ];

  const seededOrders = [];

  for (let pIndex = 0; pIndex < parentsData.length; pIndex++) {
    const pData = parentsData[pIndex];
    const parent = await prisma.user.upsert({
      where: { mobile: pData.mobile },
      update: { name: pData.name, email: pData.email, role: Role.parent },
      create: { mobile: pData.mobile, name: pData.name, email: pData.email, role: Role.parent },
    });

    const addr = await prisma.address.create({
      data: {
        parent_id: parent.id,
        name: pData.name,
        phone: pData.mobile,
        line1: pData.address.line1,
        city: pData.address.city,
        pincode: pData.address.pincode,
        is_default: true,
      },
    });

    for (let sIndex = 0; sIndex < pData.students.length; sIndex++) {
      const stData = pData.students[sIndex];
      const sch = seededSchools[stData.schoolCode];
      if (!sch) continue;

      let student = await prisma.student.findFirst({
        where: { parent_id: parent.id, name: stData.name },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            parent_id: parent.id,
            school_id: sch.id,
            name: stData.name,
            class: stData.class,
            gender: stData.gender,
            admission_no: `ADM-${stData.schoolCode}-${1000 + pIndex * 10 + sIndex}`,
          },
        });
      }

      // 6. Create realistic sample orders for this student
      const orderNum = `SF-${1082 - (pIndex * 2 + sIndex)}`;
      const trackingToken = `trk_${orderNum.toLowerCase()}_${Date.now()}`;

      const variants = schoolVariantsMap[stData.schoolCode] || [];
      const item1 = variants[0] || { productName: "Uniform Shirt", price: 55000, sizeLabel: "32", color: "Standard" };
      const item2 = variants[1] || { productName: "Uniform Shorts", price: 48000, sizeLabel: "28", color: "Standard" };

      const itemsTotal = item1.price + item2.price;
      const deliveryCharge = sch.delivery_charge || 10000;
      const grandTotal = itemsTotal + deliveryCharge;

      const orderStatusList: OrderStatus[] = [
        OrderStatus.delivered,
        OrderStatus.out_for_delivery,
        OrderStatus.packed,
        OrderStatus.confirmed,
        OrderStatus.placed,
      ];
      const assignedStatus = orderStatusList[(pIndex + sIndex) % orderStatusList.length];

      const existingOrder = await prisma.order.findUnique({ where: { order_no: orderNum } });
      if (!existingOrder) {
        const order = await prisma.order.create({
          data: {
            order_no: orderNum,
            parent_id: parent.id,
            student_id: student.id,
            school_id: sch.id,
            address_id: addr.id,
            address_snapshot: {
              name: pData.name,
              phone: pData.mobile,
              line1: pData.address.line1,
              city: pData.address.city,
              pincode: pData.address.pincode,
            },
            items_total: itemsTotal,
            delivery_charge: deliveryCharge,
            grand_total: grandTotal,
            amount_paid: grandTotal,
            payment_status: PaymentStatus.paid,
            order_status: assignedStatus,
            tracking_token: trackingToken,
            courier_name: "BlueDart Express",
            courier_tracking_no: `BD-${orderNum}-IN`,
            items: {
              create: [
                {
                  variant_id: item1.variant?.id,
                  item_name: item1.productName,
                  size: item1.sizeLabel,
                  color: item1.color,
                  qty: 1,
                  unit_price: item1.price,
                },
                {
                  variant_id: item2.variant?.id,
                  item_name: item2.productName,
                  size: item2.sizeLabel,
                  color: item2.color,
                  qty: 1,
                  unit_price: item2.price,
                },
              ],
            },
            payments: {
              create: [
                {
                  razorpay_order_id: `order_rzp_${orderNum}`,
                  razorpay_payment_id: `pay_${orderNum}_success`,
                  amount: grandTotal,
                  status: "captured",
                },
              ],
            },
          },
        });

        seededOrders.push(order);

        // 7. WhatsApp Audit Logs
        await prisma.whatsappLog.create({
          data: {
            mobile: pData.mobile,
            template: "order_confirmation_v1",
            order_id: order.id,
            status: "sent",
            provider_message_id: `wamid_conf_${orderNum}`,
          },
        });

        if (assignedStatus === OrderStatus.out_for_delivery || assignedStatus === OrderStatus.delivered) {
          await prisma.whatsappLog.create({
            data: {
              mobile: pData.mobile,
              template: "order_dispatch_alert_v1",
              order_id: order.id,
              status: "sent",
              provider_message_id: `wamid_disp_${orderNum}`,
            },
          });
        }
      }
    }
  }

  // 8. Add sample Change / Exchange request for Greenwood student
  const firstOrder = await prisma.order.findFirst({
    where: { order_no: "SF-1081" },
  });
  if (firstOrder) {
    await prisma.changeRequest.create({
      data: {
        order_id: firstOrder.id,
        parent_id: firstOrder.parent_id,
        message: "Requesting size exchange for Blazer from Size 34 to Size 36.",
        status: ChangeRequestStatus.pending,
      },
    });
  }

  console.log(`✅ Seeded ${seededOrders.length} live school orders with WhatsApp logs.`);
  console.log("🎉 All 6 schools and complete dummy data successfully seeded into database!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
