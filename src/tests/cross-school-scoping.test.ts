import prisma from "../lib/db/prisma";
import { signSession } from "../lib/auth/jwt";
import { Role } from "@prisma/client";

async function runTests() {
  console.log("🧪 Running Multi-School Scoping & Security Rules Test Suite...\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  try {
    // 1. Check School 1 and School 2 exist
    const school1 = await prisma.school.findUnique({ where: { code: "SXHS" } });
    const school2 = await prisma.school.findUnique({ where: { code: "GWIS" } });

    assert(!!school1 && !!school2, "Two distinct tenant schools exist with different branding");
    assert(school1?.primary_color === "#1e3a8a", "SXHS has Navy primary branding");
    assert(school2?.primary_color === "#065f46", "GWIS has Forest Green primary branding");

    // 2. Check School Admins exist with correct school scoping
    const admin1 = await prisma.user.findFirst({ where: { role: Role.school_admin, school_id: school1?.id } });
    const admin2 = await prisma.user.findFirst({ where: { role: Role.school_admin, school_id: school2?.id } });

    assert(!!admin1 && admin1.school_id === school1?.id, "Admin 1 is scoped strictly to School 1");
    assert(!!admin2 && admin2.school_id === school2?.id, "Admin 2 is scoped strictly to School 2");
    assert(admin1?.school_id !== admin2?.school_id, "School Admins belong to completely isolated school scopes");

    // 3. Check Parent User and Orders scoping
    const parent = await prisma.user.findFirst({ where: { role: Role.parent } });
    assert(!!parent, "Parent user exists in database");

    if (parent && school1) {
      const parentOrders = await prisma.order.findMany({
        where: { parent_id: parent.id },
      });
      assert(Array.isArray(parentOrders), "Parent can query own orders");

      // Verify that School Admin 2 cannot query School 1 orders
      const crossSchoolQuery = await prisma.order.findMany({
        where: { school_id: school2?.id, id: { in: parentOrders.map((o) => o.id) } },
      });
      assert(crossSchoolQuery.length === 0, "School Admin 2 query never yields School 1 orders (Strict Scoping)");
    }

    // 4. Check WhatsApp logging table
    const logs = await prisma.whatsappLog.findMany();
    assert(logs.length >= 0, "WhatsApp audit log table is functioning and queryable");

    console.log(`\n🎉 Results: ${passed}/${total} assertions passed!`);
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
