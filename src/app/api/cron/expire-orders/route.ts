import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { expireStaleOrders } from "@/lib/orders/lifecycle";

// Call every few minutes from a scheduler: `Authorization: Bearer $CRON_SECRET`.
// Parents' own pages also expire their stale checkouts on load, so this is a backstop.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const ok =
    !!secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireStaleOrders();
  return NextResponse.json({ success: true, expired });
}
