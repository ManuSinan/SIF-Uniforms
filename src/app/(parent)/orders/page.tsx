"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ParentNavbar } from "@/components/layout/ParentNavbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Package,
  ArrowRight,
  Truck,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return <Badge variant="brand">Order Placed</Badge>;
      case "confirmed":
        return <Badge variant="brand">Confirmed</Badge>;
      case "packed":
        return <Badge variant="warning">Packed</Badge>;
      case "out_for_delivery":
        return <Badge variant="warning">Out for Delivery</Badge>;
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      case "pending_payment":
        return <Badge variant="warning">Payment Pending</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ParentNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Your Orders</h1>
            <p className="text-xs text-slate-500">Track and manage your uniform purchases</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="p-10 text-center bg-white border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 text-base mb-1">No Orders Yet</h2>
            <p className="text-xs text-slate-500 mb-6">
              When you purchase uniforms for your children, your orders will appear here.
            </p>
            <Link href="/parent" className="inline-flex px-5 py-3 rounded-xl bg-blue-900 text-white text-sm font-bold">
              Order Uniforms
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <Card key={ord.id} className="p-5 bg-white border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <span className="text-xs text-slate-500 font-mono block">#{ord.order_no}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{ord.school.name}</h3>
                    <p className="text-xs text-slate-500">For: {ord.student.name} (Class {ord.student.class})</p>
                  </div>
                  <div className="shrink-0 whitespace-nowrap">{getStatusBadge(ord.order_status)}</div>
                </div>

                {/* Product Items Preview */}
                {ord.items && ord.items.length > 0 && (
                  <div className="my-2.5 space-y-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    {ord.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-800 truncate">{item.item_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-semibold text-slate-600 border border-slate-200 shrink-0">
                            Size {item.size}
                          </span>
                          <span className="text-xs text-slate-500 shrink-0">&times;{item.qty}</span>
                        </div>
                        <span className="font-bold text-slate-700 shrink-0 pl-3">
                          {formatPaiseToRupees(item.unit_price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="py-2.5 my-2 border-y border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    {ord.items?.length || 0} {ord.items?.length === 1 ? "item" : "items"} &bull; Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatPaiseToRupees(ord.grand_total)}
                  </span>
                </div>

                {ord.grand_total > ord.amount_paid && !["pending_payment", "cancelled"].includes(ord.order_status) && (
                  <p className="text-sm font-bold text-amber-700 mb-2">
                    Balance to pay: {formatPaiseToRupees(ord.grand_total - ord.amount_paid)}
                  </p>
                )}
                <Link
                  href={`/orders/${ord.id}`}
                  className={`flex items-center justify-center gap-1 w-full py-3 rounded-xl text-sm font-bold ${
                    ord.order_status === "pending_payment"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {ord.order_status === "pending_payment" ? "Complete payment" : (
                    <>
                      <Truck className="w-4 h-4" /> Track &amp; details
                    </>
                  )}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
