import prisma from "@/lib/db/prisma";
import { isProductForStudent } from "@/lib/config/constants";

export { isProductForStudent };

export const MAX_QTY_PER_ITEM = 20;

export const CART_INCLUDE = {
  student: { include: { school: { include: { serviceablePincodes: { select: { pincode: true } } } } } },
  items: {
    include: {
      variant: {
        include: {
          size: true,
          schoolProduct: { include: { product: true } },
        },
      },
    },
  },
} as const;

/** Parses a positive whole-number quantity, or returns null. */
export function parseQty(raw: unknown): number | null {
  const qty = Number(raw);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) return null;
  return qty;
}

export async function findOwnedStudent(parentId: number, studentId: unknown) {
  const id = Number(studentId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.student.findFirst({ where: { id, parent_id: parentId }, include: { school: true } });
}

/** Each child has their own cart; this returns it, creating it on first use. */
export async function getOrCreateStudentCart(parentId: number, studentId: number) {
  const existing = await prisma.cart.findFirst({
    where: { parent_id: parentId, student_id: studentId },
    include: CART_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { parent_id: parentId, student_id: studentId },
    include: CART_INCLUDE,
  });
}

export function countItems(items: { qty: number }[]) {
  return items.reduce((sum, it) => sum + it.qty, 0);
}

export function computeDeliveryCharge(
  school: { delivery_charge: number; free_delivery_above: number | null },
  itemsTotal: number
) {
  if (school.free_delivery_above && itemsTotal >= school.free_delivery_above) return 0;
  return school.delivery_charge;
}

/** Empty list means the school hasn't restricted delivery areas. */
export async function isPincodeServiceable(schoolId: number, pincode: string) {
  const pins = await prisma.schoolServiceablePincode.findMany({ where: { school_id: schoolId } });
  if (pins.length === 0) return true;
  return pins.some((p) => p.pincode.trim() === pincode.trim());
}
