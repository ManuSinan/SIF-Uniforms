import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Home,
  Phone,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// Anyone with the link can open this page, so it shows only what a courier label would.
export const metadata = { robots: { index: false, follow: false } };

function maskName(name?: string) {
  if (!name) return "";
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1].charAt(0)}.` : first;
}

function maskPhone(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 4 ? `${digits.slice(0, 2)}••••••${digits.slice(-2)}` : "";
}

interface PageProps {
  params: Promise<{ token: string }>;
}

const STEPS = [
  { id: "placed", label: "Order Placed", desc: "Payment verified & order received" },
  { id: "confirmed", label: "Confirmed", desc: "School verified order details" },
  { id: "packed", label: "Packed", desc: "Uniforms verified & packed" },
  { id: "out_for_delivery", label: "Out for Delivery", desc: "Handed over to courier partner" },
  { id: "delivered", label: "Delivered", desc: "Package delivered to your home" },
];

export default async function OrderTrackingPage({ params }: PageProps) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { tracking_token: token },
    include: {
      school: true,
      student: true,
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    notFound();
  }

  const currentStatus = order.order_status;
  const isCancelled = currentStatus === "cancelled";

  const getStepIndex = (status: string) => {
    return STEPS.findIndex((s) => s.id === status);
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <ThemeProvider primaryColor={order.school.primary_color} secondaryColor={order.school.secondary_color}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-brand-primary text-white shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
                {order.school.name.charAt(0)}
              </div>
              <span className="font-extrabold text-base tracking-tight">{order.school.name}</span>
            </Link>
            <Badge variant="neutral" className="bg-white/20 text-white border-none text-xs">
              Live Tracker
            </Badge>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
          {/* Order Hero Card */}
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Order Tracking
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  #{order.order_no}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 block">Total Amount</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {formatPaiseToRupees(order.grand_total)}
                </span>
                <div className="mt-1">
                  {order.payment_status === "paid" || order.payment_status === "partial_refund" ? (
                    <Badge variant="success" className="text-[10px]">Paid</Badge>
                  ) : order.payment_status === "refunded" ? (
                    <Badge variant="neutral" className="text-[10px]">Refunded</Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">Payment Pending</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Live Status Banner */}
            {currentStatus === "pending_payment" ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-semibold">
                This order is waiting for payment. It will be sent to the school once it&apos;s paid.
              </div>
            ) : isCancelled ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold">
                ⚠️ This order was cancelled. If you were charged, your refund will be processed to the original payment method.
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-primary" />
                  Delivery Status
                </h2>

                {/* Progress Stepper */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {STEPS.map((st, i) => {
                    const isDone = currentIndex >= i;
                    const isCurrent = currentIndex === i;

                    return (
                      <div key={st.id} className="relative flex items-start gap-4">
                        <div
                          className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isDone
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white border-2 border-slate-300 text-slate-400"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                        </div>

                        <div className="pt-0.5">
                          <h3
                            className={`text-sm font-bold ${
                              isCurrent
                                ? "text-brand-primary"
                                : isDone
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {st.label}
                          </h3>
                          <p className="text-xs text-slate-500">{st.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier Details if Out for Delivery */}
            {(order.courier_name || order.courier_tracking_no) && (
              <div className="mt-6 p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>Courier & Dispatch Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900">
                  {order.courier_name && (
                    <div>Courier Partner: <strong>{order.courier_name}</strong></div>
                  )}
                  {order.courier_tracking_no && (
                    <div>Tracking / AWB No: <strong className="font-mono">{order.courier_tracking_no}</strong></div>
                  )}
                  {order.courier_phone && (
                    <div>Delivery Contact: <strong>{order.courier_phone}</strong></div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Student & Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Student
              </span>
              <div className="font-bold text-slate-900 text-sm">{maskName(order.student.name)}</div>
              <div className="text-xs text-slate-500">Class {order.student.class}</div>
              <div className="text-xs text-slate-500 capitalize">School: {order.school.name}</div>
            </Card>

            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Delivery Address
              </span>
              {order.address_snapshot ? (
                <div className="text-xs text-slate-700 space-y-0.5">
                  <div className="font-bold text-slate-900">{maskName((order.address_snapshot as any).name)}</div>
                  <div>{(order.address_snapshot as any).city} - {(order.address_snapshot as any).pincode}</div>
                  <div className="text-slate-500">Phone: {maskPhone((order.address_snapshot as any).phone)}</div>
                  <Link href={`/orders/${order.id}`} className="inline-block pt-1 text-blue-700 font-semibold">
                    Full address in your account →
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Address on file</div>
              )}
            </Card>
          </div>

          {/* Ordered Items List */}
          <Card className="p-5 bg-white border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Items in this package</h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                    <div className="text-slate-500">
                      Color: {item.color} &bull; Size: <strong>{item.size}</strong> &bull; Qty: <strong>{item.qty}</strong>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatPaiseToRupees(item.unit_price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatPaiseToRupees(order.items_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-mono">{formatPaiseToRupees(order.delivery_charge)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="font-mono">{formatPaiseToRupees(order.grand_total)}</span>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
}
