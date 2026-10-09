export const CLASS_ORDER = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;

export type SchoolClass = (typeof CLASS_ORDER)[number];

export function getClassIndex(cls: string): number {
  const index = CLASS_ORDER.indexOf(cls as SchoolClass);
  return index === -1 ? 999 : index;
}

export function isClassInRange(studentClass: string, fromClass: string, toClass: string): boolean {
  const studentIdx = getClassIndex(studentClass);
  const fromIdx = getClassIndex(fromClass);
  const toIdx = getClassIndex(toClass);
  return studentIdx >= fromIdx && studentIdx <= toIdx;
}

/** Whether a school product is meant for this student (class range + gender). */
export function isProductForStudent(
  sp: { class_from: string; class_to: string; gender: string },
  student: { class: string; gender?: string | null }
): boolean {
  if (!isClassInRange(student.class, sp.class_from, sp.class_to)) return false;
  const g = student.gender || "all";
  if (sp.gender === "all" || g === "all") return true;
  return sp.gender === g;
}

export const ORDER_LOCK_RULES = {
  parent: {
    editItemsUntil: ["placed", "confirmed"],
    editAddressUntil: ["placed", "confirmed", "packed"],
    cancelUntil: ["placed", "confirmed"],
  },
  school_admin: {
    editItemsUntil: ["placed", "confirmed", "packed"],
    editAddressUntil: ["placed", "confirmed", "packed"],
    cancelUntil: ["placed", "confirmed", "packed"],
  },
  super_admin: {
    editItemsUntil: ["placed", "confirmed", "packed", "out_for_delivery", "delivered"],
    editAddressUntil: ["placed", "confirmed", "packed", "out_for_delivery", "delivered"],
    cancelUntil: ["placed", "confirmed", "packed", "out_for_delivery", "delivered"],
  },
} as const;

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_COOLDOWN_SECONDS: 30,
  MAX_ATTEMPTS: 5,
  MAX_PER_HOUR: 5,
} as const;

export const ORDER_EXPIRY_MINUTES = 30;

export function formatPaiseToRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function generateOrderNo(schoolCode?: string): string {
  const code = (schoolCode || "SF").toUpperCase().slice(0, 4);
  // 6 chars from a 31-symbol alphabet (no 0/O/1/I/L) ≈ 887M combinations per school code
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${code}-${rand}`;
}
