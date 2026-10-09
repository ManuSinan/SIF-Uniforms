import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

const HOUR_MS = 60 * 60 * 1000;
const ON_TIME_DAYS = 5;

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function round1(v: number | null): number | null {
  return v === null ? null : Math.round(v * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const yearParam = Number(new URL(req.url).searchParams.get("year"));
    const year = Number.isInteger(yearParam) && yearParam > 2000 && yearParam < 3000 ? yearParam : new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Monthly revenue: money actually collected (paid or partially refunded orders)
    const paidOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: yearStart, lt: yearEnd },
        payment_status: { in: ["paid", "partial_refund"] },
        deleted_at: null,
      },
      select: { grand_total: true, createdAt: true },
    });
    const monthlyRevenue = Array<number>(12).fill(0);
    const monthlyOrders = Array<number>(12).fill(0);
    for (const o of paidOrders) {
      const m = o.createdAt.getMonth();
      monthlyRevenue[m] += o.grand_total;
      monthlyOrders[m] += 1;
    }

    // Fulfilment timings from the status history of this year's orders
    const history = await prisma.orderStatusHistory.findMany({
      where: {
        status: { in: ["placed", "packed", "out_for_delivery", "delivered"] },
        order: { createdAt: { gte: yearStart, lt: yearEnd }, deleted_at: null },
      },
      select: { order_id: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // First time each order reached each status
    const firstAt = new Map<number, Partial<Record<string, Date>>>();
    for (const h of history) {
      const entry = firstAt.get(h.order_id) || {};
      if (!entry[h.status]) entry[h.status] = h.createdAt;
      firstAt.set(h.order_id, entry);
    }

    const packingHours: number[] = [];
    const dispatchHours: number[] = [];
    const deliveryDays: number[] = [];
    for (const t of firstAt.values()) {
      if (t.placed && t.packed && t.packed >= t.placed) {
        packingHours.push((t.packed.getTime() - t.placed.getTime()) / HOUR_MS);
      }
      if (t.packed && t.out_for_delivery && t.out_for_delivery >= t.packed) {
        dispatchHours.push((t.out_for_delivery.getTime() - t.packed.getTime()) / HOUR_MS);
      }
      if (t.placed && t.delivered && t.delivered >= t.placed) {
        deliveryDays.push((t.delivered.getTime() - t.placed.getTime()) / (24 * HOUR_MS));
      }
    }
    const onTimeCount = deliveryDays.filter((d) => d <= ON_TIME_DAYS).length;

    // WhatsApp delivery over the last 30 days
    const since = new Date(Date.now() - 30 * 24 * HOUR_MS);
    const [waTotal, waSent] = await Promise.all([
      prisma.whatsappLog.count({ where: { createdAt: { gte: since } } }),
      prisma.whatsappLog.count({ where: { createdAt: { gte: since }, status: "sent" } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        year,
        monthlyRevenue,
        monthlyOrders,
        fulfilment: {
          avgPackingHours: round1(avg(packingHours)),
          packingSamples: packingHours.length,
          avgDispatchHours: round1(avg(dispatchHours)),
          dispatchSamples: dispatchHours.length,
          avgDeliveryDays: round1(avg(deliveryDays)),
          deliveredSamples: deliveryDays.length,
          onTimeDays: ON_TIME_DAYS,
          onTimePct: deliveryDays.length ? Math.round((onTimeCount / deliveryDays.length) * 100) : null,
        },
        whatsapp: {
          total30d: waTotal,
          sentPct30d: waTotal ? Math.round((waSent / waTotal) * 1000) / 10 : null,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
