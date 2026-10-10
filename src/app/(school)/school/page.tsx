"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Package,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Shirt,
  FileText,
  AlertCircle,
  ExternalLink,
  MapPin,
  ChevronRight,
  Settings,
} from "lucide-react";
import { SchoolAvatar } from "@/components/common/SchoolAvatar";

export default function SchoolDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("packed");
  const [courierName, setCourierName] = useState("BlueDart");
  const [courierTrackingNo, setCourierTrackingNo] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, schRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/schools/my-school"),
      ]);

      const [ordData, schData] = await Promise.all([ordRes.json(), schRes.json()]);

      if (ordData.success) setOrders(ordData.orders || []);
      if (schData.success) setSchoolData(schData.school || null);
    } catch (err) {
      console.error("Error loading school dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(
      order.order_status === "placed" || order.order_status === "confirmed"
        ? "packed"
        : order.order_status === "packed"
        ? "out_for_delivery"
        : "delivered"
    );
    setCourierName(order.courier_name || "Delhivery");
    setCourierTrackingNo(order.courier_tracking_no || "");
    setCourierPhone(order.courier_phone || "");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courier_name: courierName,
          courier_tracking_no: courierTrackingNo,
          courier_phone: courierPhone,
          delivery_note: deliveryNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedOrder(null);
        setToastMsg(`Order #${selectedOrder.order_no} updated to ${newStatus.replace(/_/g, " ")}! WhatsApp update sent.`);
        await loadData();
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const pendingPacking = orders.filter((o) => ["placed", "confirmed"].includes(o.order_status)).length;
  const packedOrders = orders.filter((o) => o.order_status === "packed").length;
  const outForDelivery = orders.filter((o) => o.order_status === "out_for_delivery").length;
  const deliveredOrders = orders.filter((o) => o.order_status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.grand_total, 0);

  const pendingChangeRequests = orders.reduce((acc, o) => {
    const pending = (o.changeRequests || []).filter((cr: any) => cr.status === "pending").length;
    return acc + pending;
  }, 0);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* School Branding Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 md:p-8 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <SchoolAvatar school={schoolData} className="w-14 h-14 md:w-16 md:h-16" />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {schoolData?.name || "School Operations Portal"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-300 border border-white/10 uppercase tracking-wider">
                  {schoolData?.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Store Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {schoolData?.address || "Calicut, Kerala"}
                </span>
                {schoolData?.serviceablePincodes && schoolData.serviceablePincodes.length > 0 && (
                  <span className="text-slate-400">
                    Serviceable Pincodes:{" "}
                    <strong className="text-slate-200">
                      {schoolData.serviceablePincodes.map((p: any) => p.pincode).join(", ")}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/school/orders">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Orders Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/school/reports">
              <Button
                variant="outline"
                className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 font-semibold text-xs h-10 px-4 rounded-xl cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Packing Manifest</span>
              </Button>
            </Link>
            <Link href="/school/settings">
              <Button
                variant="outline"
                className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 font-semibold text-xs h-10 px-4 rounded-xl cursor-pointer flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Store Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Pending Packing
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{pendingPacking}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-amber-400/90 font-medium">Orders awaiting packing</span>
            <Link href="/school/orders?status=placed" className="text-amber-400 font-bold hover:underline flex items-center gap-0.5">
              Pack <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Packed & Ready
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{packedOrders}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Ready for dispatch</span>
            <Link href="/school/orders?status=packed" className="text-blue-400 font-bold hover:underline flex items-center gap-0.5">
              Dispatch <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
              Out For Delivery
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{outForDelivery}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">In transit to parents</span>
            <Link href="/school/orders?status=out_for_delivery" className="text-purple-400 font-bold hover:underline flex items-center gap-0.5">
              Track <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              School Uniform Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatPaiseToRupees(totalRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-400/90 font-medium">{deliveredOrders} orders delivered</span>
            <span className="text-slate-400">{orders.length} total</span>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/school/items" className="group">
          <Card className="p-5 bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-blue-500/50 transition-all shadow-lg rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                  Uniform Catalogue & Stock
                </h3>
                <p className="text-xs text-slate-400">
                  {schoolData?._count?.schoolProducts || schoolData?.schoolProducts?.length || 0} approved uniform sets
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link href="/school/change-requests" className="group">
          <Card className="p-5 bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-amber-500/50 transition-all shadow-lg rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                    Size Change Requests
                  </h3>
                  {pendingChangeRequests > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      {pendingChangeRequests}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {pendingChangeRequests > 0
                    ? `${pendingChangeRequests} pending parent requests`
                    : "No pending size requests"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link href="/school/reports" className="group">
          <Card className="p-5 bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-emerald-500/50 transition-all shadow-lg rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                  Packing & Stock Reports
                </h3>
                <p className="text-xs text-slate-400">Class breakdown & item-wise packing slips</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
      </div>

      {/* Recent Orders Queue */}
      <Card className="p-6 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Live Orders Fulfillment Queue</h2>
            <p className="text-xs text-slate-400">
              Orders placed by parents for {schoolData?.name || "your school"}
            </p>
          </div>
          <Link
            href="/school/orders"
            className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1"
          >
            View All ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Loading orders queue...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No orders placed for this school yet.
          </div>
        ) : (
          <>
          {/* Phones: one card per order */}
          <div className="md:hidden space-y-3">
            {orders.slice(0, 8).map((ord) => (
              <div key={ord.id} className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-white text-sm">#{ord.order_no}</div>
                    <div className="text-xs text-slate-400">
                      {ord.student.name} · Class {ord.student.class}
                      {ord.student.section ? ` ${ord.student.section}` : ""}
                    </div>
                  </div>
                  <Badge
                    variant={
                      ord.order_status === "delivered"
                        ? "success"
                        : ord.order_status === "packed"
                        ? "warning"
                        : ord.order_status === "out_for_delivery"
                        ? "brand"
                        : "neutral"
                    }
                  >
                    {ord.order_status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  {ord.items.map((it: any) => (
                    <div key={it.id} className="text-xs text-slate-300">
                      <span className="font-bold text-white">{it.qty}×</span> {it.item_name} (Size {it.size})
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatPaiseToRupees(ord.grand_total)}</span>
                  {!["delivered", "cancelled"].includes(ord.order_status) && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenUpdateModal(ord)}
                    className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 rounded-lg"
                  >
                    Fulfill
                  </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="p-3.5 w-32">Order No</th>
                  <th className="p-3.5 w-44">Student / Class</th>
                  <th className="p-3.5">Items &amp; Sizes</th>
                  <th className="p-3.5 w-24">Total</th>
                  <th className="p-3.5 w-36 text-center">Status</th>
                  <th className="p-3.5 w-32 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-200">
                {orders.slice(0, 8).map((ord) => {
                  const statusColors: Record<string, { bg: string; dot: string; text: string; border: string }> = {
                    delivered: { bg: "bg-emerald-500/15", dot: "bg-emerald-400", text: "text-emerald-300", border: "border-emerald-500/30" },
                    out_for_delivery: { bg: "bg-sky-500/15", dot: "bg-sky-400", text: "text-sky-300", border: "border-sky-500/30" },
                    packed: { bg: "bg-amber-500/15", dot: "bg-amber-400", text: "text-amber-300", border: "border-amber-500/30" },
                    cancelled: { bg: "bg-rose-500/15", dot: "bg-rose-400", text: "text-rose-300", border: "border-rose-500/30" },
                    placed: { bg: "bg-slate-700/50", dot: "bg-slate-400", text: "text-slate-300", border: "border-slate-600/80" },
                    confirmed: { bg: "bg-blue-500/15", dot: "bg-blue-400", text: "text-blue-300", border: "border-blue-500/30" },
                  };
                  const statusStyle = statusColors[ord.order_status] || statusColors.placed;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white align-middle">
                        <div>#{ord.order_no}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="p-3.5 align-middle">
                        <div className="font-bold text-white truncate">{ord.student.name}</div>
                        <div className="text-slate-400 text-[11px]">
                          Class {ord.student.class} {ord.student.section ? `• ${ord.student.section}` : ""}
                        </div>
                      </td>
                      <td className="p-3.5 align-middle">
                        <div className="space-y-0.5 max-w-sm">
                          {ord.items.map((it: any) => (
                            <div key={it.id} className="text-[11px] text-slate-300 truncate">
                              <span className="font-bold text-white">{it.qty}x</span> {it.item_name} (Size {it.size})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400 align-middle whitespace-nowrap">
                        {formatPaiseToRupees(ord.grand_total)}
                      </td>
                      <td className="p-3.5 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border w-28 mx-auto ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className="capitalize">{ord.order_status.replace(/_/g, " ")}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap align-middle">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {!["delivered", "cancelled"].includes(ord.order_status) && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenUpdateModal(ord)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold h-7 px-3 rounded-lg cursor-pointer transition-transform active:scale-95"
                          >
                            Fulfill
                          </Button>
                          )}
                          {ord.tracking_token && (
                            <Link href={`/t/${ord.tracking_token}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-7 h-7 p-0 rounded-lg border-slate-700 bg-slate-900/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                                title="Parent Live Tracking View"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      {/* Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 text-white p-6 shadow-2xl border-slate-700 space-y-4 rounded-3xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Update Order Fulfillment
                </span>
                <h3 className="font-bold text-white text-base">Order #{selectedOrder.order_no}</h3>
                <span className="text-xs text-slate-400">
                  Student: <strong>{selectedOrder.student.name}</strong> (Class {selectedOrder.student.class})
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white font-bold text-xl px-2 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Select New Status</label>
                <div className="grid grid-cols-3 gap-2 font-semibold">
                  {[
                    { id: "confirmed", label: "Confirmed" },
                    { id: "packed", label: "Packed" },
                    { id: "out_for_delivery", label: "Out for Delivery" },
                    { id: "delivered", label: "Delivered" },
                    { id: "cancelled", label: "Cancelled" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewStatus(s.id)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                        newStatus === s.id
                          ? "bg-blue-600 text-white border-blue-500 shadow-md font-bold"
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {(newStatus === "out_for_delivery" || newStatus === "packed" || newStatus === "delivered") && (
                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                  <span className="font-bold text-white block">Courier & Dispatch Details</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-400 mb-1">Courier Partner</label>
                      <input
                        type="text"
                        placeholder="BlueDart, DTDC, Delhivery..."
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-400 mb-1">Tracking / AWB #</label>
                      <input
                        type="text"
                        placeholder="e.g. BLD9823472"
                        value={courierTrackingNo}
                        onChange={(e) => setCourierTrackingNo(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fulfillment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Handed to delivery executive at 10 AM"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="w-1/3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingStatus}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {updatingStatus ? "Updating & Notifying..." : "Update & Send WhatsApp"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
