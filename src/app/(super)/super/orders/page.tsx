"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPaiseToRupees } from "@/lib/config/constants";
import { OrderItemEditor } from "@/components/orders/OrderItemEditor";
import {
  ShoppingCart,
  Edit,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Shield,
  Truck,
  Package,
  Clock,
  RotateCcw,
  ChevronLeft,
  Filter,
  Download,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";

export default function SuperOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Order edit dialog + refunds queue
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundRefs, setRefundRefs] = useState<Record<number, string>>({});
  const [refundBusy, setRefundBusy] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const loadRefunds = async () => {
    try {
      const res = await fetch("/api/super/refunds?status=pending");
      const data = await res.json();
      if (data.success) setRefunds(data.refunds || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadRefunds();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (ord: any) => setEditingOrder(ord);

  const handleRefund = async (refundId: number, status: "processed" | "failed") => {
    setRefundBusy(refundId);
    try {
      const res = await fetch("/api/super/refunds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: refundId, status, reference: refundRefs[refundId] || "" }),
      });
      const data = await res.json();
      showToast(data.success ? (status === "processed" ? "Refund marked as sent" : "Refund marked as failed") : data.error);
      if (data.success) {
        await Promise.all([loadRefunds(), loadOrders()]);
      }
    } finally {
      setRefundBusy(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.order_no.toLowerCase().includes(q) ||
      (o.student?.name || "").toLowerCase().includes(q) ||
      (o.school?.name || "").toLowerCase().includes(q) ||
      (o.parent?.mobile || "").includes(q);

    const matchesStatus = statusFilter === "all" || o.order_status === statusFilter;
    const matchesSchool = schoolFilter === "all" || o.school?.code === schoolFilter;

    return matchesSearch && matchesStatus && matchesSchool;
  });

  // Money actually collected (net of refunds already sent)
  const totalRevenue = orders.reduce((acc, o) => acc + (o.amount_paid || 0), 0);
  const deliveredCount = orders.filter((o) => o.order_status === "delivered").length;
  const inTransitCount = orders.filter((o) => o.order_status === "out_for_delivery" || o.order_status === "packed").length;

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-16 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header Banner in Royal Blue Theme */}
      <div className="relative bg-gradient-to-br from-[#061536] via-[#0c2461] to-[#1e40af] text-white pt-6 pb-20 px-4 sm:px-8 lg:px-12 overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar */}
        <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between gap-4 pb-8">
          <Link href="/super" className="flex items-center group">
            <img src="/images/logo-white.png" alt="SIF UNIFORMS" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>

          {/* Centered Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 p-1 rounded-full text-xs font-semibold text-white/80 shadow-inner">
            {[
              { id: "Dashboard", href: "/super" },
              { id: "Schools", href: "/super/schools" },
              { id: "Orders", href: "/super/orders" },
              { id: "Catalog", href: "/super/catalogue" },
              { id: "Reports", href: "/super/whatsapp-logs" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  tab.id === "Orders"
                    ? "bg-white/20 text-white font-bold shadow-xs border border-white/20"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/super"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500/20 backdrop-blur-md border border-white/15 hover:border-rose-400/40 flex items-center justify-center text-white/90 hover:text-rose-200 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Pills (Visible only on mobile/tablet) */}
        <div className="md:hidden relative z-10 -mt-3 pb-6">
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white/10 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl text-xs font-semibold text-white/80 shadow-inner">
            {[
              { id: "Dashboard", href: "/super" },
              { id: "Schools", href: "/super/schools" },
              { id: "Orders", href: "/super/orders" },
              { id: "Catalog", href: "/super/catalogue" },
              { id: "Reports", href: "/super/whatsapp-logs" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  tab.id === "Orders"
                    ? "bg-white/25 text-white font-bold shadow-xs border border-white/25"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>
        </div>

        {/* Title & Stats Badges */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-School Order Fulfillment Stream</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Master Orders & Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Global order visibility across partner schools with live status tracking and edit engine
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Total Orders</span>
              <span className="text-2xl font-black text-white font-mono">{orders.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Delivered</span>
              <span className="text-2xl font-black text-emerald-300 font-mono">{deliveredCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">In Transit</span>
              <span className="text-2xl font-black text-amber-300 font-mono">{inTransitCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-6">
        {refunds.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Refunds to send ({refunds.length})</h3>
              <p className="text-sm text-slate-500">
                Pay these back to the parent (UPI / bank), then record the reference here.
              </p>
            </div>
            <div className="space-y-2.5">
              {refunds.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900">
                        {formatPaiseToRupees(r.amount)} · #{r.order.order_no}
                      </p>
                      <p className="text-xs text-slate-600">
                        {r.order.parent.name} · {r.order.parent.mobile} · {r.order.school.code} · {r.order.student.name}
                      </p>
                      <p className="text-xs text-slate-500">{r.reason}</p>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="UTR / UPI reference"
                      value={refundRefs[r.id] || ""}
                      onChange={(e) => setRefundRefs({ ...refundRefs, [r.id]: e.target.value })}
                      className="flex-1 px-3 rounded-xl border border-slate-300 text-base"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={refundBusy === r.id || (refundRefs[r.id] || "").trim().length < 4}
                        onClick={() => handleRefund(r.id, "processed")}
                        className="flex-1 sm:flex-none px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-40"
                      >
                        Mark sent
                      </button>
                      <button
                        type="button"
                        disabled={refundBusy === r.id}
                        onClick={() => handleRefund(r.id, "failed")}
                        className="flex-1 sm:flex-none px-4 rounded-xl border border-slate-300 text-sm font-bold text-slate-600"
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {toastMsg && (
          <div className="p-4 bg-emerald-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, student name, school, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0c2461] focus:ring-2 focus:ring-blue-100 outline-hidden font-medium transition-all"
            />
          </div>

          {/* Status & School Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-[#0c2461] outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="out_for_delivery">Out For Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-[#0c2461] outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">All Schools</option>
              <option value="SXHS">St. Xavier&apos;s (SXHS)</option>
              <option value="GWIS">Greenwood (GWIS)</option>
              <option value="MES">MES Higher (MES)</option>
              <option value="JDT">JDT Iqraa (JDT)</option>
              <option value="MR">Markaz (MR)</option>
              <option value="KMO">KMO School (KMO)</option>
            </select>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium">Loading live orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No orders match your filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Order No</th>
                    <th className="p-4">School</th>
                    <th className="p-4">Student & Class</th>
                    <th className="p-4">Ordered Items</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredOrders.map((ord) => {
                    const isDelivered = ord.order_status === "delivered";
                    const isOut = ord.order_status === "out_for_delivery";
                    const isPacked = ord.order_status === "packed";

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-950">
                          <div>#{ord.order_no}</div>
                          {ord.edited_count > 0 && (
                            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-1 inline-block">
                              Edited {ord.edited_count}x
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{ord.school?.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{ord.school?.code}</span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-900">{ord.student?.name}</div>
                          <div className="text-slate-500 text-[11px]">
                            Class {ord.student?.class} &bull; {ord.parent?.name}
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="space-y-1 text-[11px] text-slate-700">
                            {(ord.items || []).map((it: any) => (
                              <div key={it.id} className="truncate">
                                &bull; {it.qty}x {it.item_name} <span className="font-bold">(Sz {it.size})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-950 text-sm">
                          {formatPaiseToRupees(ord.grand_total)}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                              isDelivered
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : isOut
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : isPacked
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {isOut && <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            {isPacked && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            <span>{ord.order_status?.replace(/_/g, " ").toUpperCase()}</span>
                          </span>
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ord)}
                              className="inline-flex items-center gap-1.5 text-xs bg-[#0c2461] hover:bg-blue-900 text-white font-bold h-8 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {ord.tracking_token && (
                              <Link
                                href={`/t/${ord.tracking_token}`}
                                target="_blank"
                                className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95 shrink-0"
                                title="Live Tracking Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
          )}
        </div>
      </div>

      {/* Super Admin Order Edit Modal */}
      {editingOrder && (
        <OrderItemEditor
          orderId={editingOrder.id}
          onClose={() => setEditingOrder(null)}
          onSaved={({ balanceDue, priceDiff }) => {
            setEditingOrder(null);
            showToast(
              balanceDue > 0
                ? `Saved. Parent owes ${formatPaiseToRupees(balanceDue)} more.`
                : priceDiff < 0
                ? `Saved. ${formatPaiseToRupees(-priceDiff)} queued for refund.`
                : "Order updated"
            );
            loadOrders();
            loadRefunds();
          }}
        />
      )}
    </div>
  );
}
