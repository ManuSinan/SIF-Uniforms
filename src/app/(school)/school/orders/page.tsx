"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import { OrderItemEditor } from "@/components/orders/OrderItemEditor";
import {
  Package,
  Truck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Printer,
  Phone,
  MessageSquare,
  Clock,
  Check,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Calendar,
} from "lucide-react";

// Mirrors the server's school transition rules so only valid next steps are offered.
const NEXT_STATUSES: Record<string, string[]> = {
  placed: ["confirmed", "packed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery", "confirmed", "cancelled"],
  out_for_delivery: ["delivered", "packed"],
  delivered: [],
  cancelled: [],
};

function SchoolOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Status update modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("packed");
  const [courierName, setCourierName] = useState("BlueDart");
  const [courierTrackingNo, setCourierTrackingNo] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Packing Slip modal state
  const [packingSlipOrder, setPackingSlipOrder] = useState<any | null>(null);

  const [toastMsg, setToastMsg] = useState("");
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [verifyBusy, setVerifyBusy] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const handleVerifyStudent = async (student: any, status: "verified" | "rejected") => {
    let reason = "";
    if (status === "rejected") {
      reason = window.prompt(`Why can't you verify ${student.name}? The parent will see this.`, "Admission number not found in school records") || "";
      if (!reason.trim()) return;
      if (!window.confirm(`Reject ${student.name}? Their unshipped orders will be cancelled and refunded.`)) return;
    }
    setVerifyBusy(student.id);
    try {
      const res = await fetch(`/api/students/${student.id}/verification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!data.success) showToast(data.error || "Couldn't update the student");
      else {
        showToast(
          status === "verified"
            ? `${student.name} verified`
            : `${student.name} rejected${data.cancelledOrders ? `; ${data.cancelledOrders} order(s) cancelled` : ""}`
        );
        await loadOrders();
      }
    } finally {
      setVerifyBusy(null);
    }
  };

  useEffect(() => {
    loadOrders();
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

  const handleOpenUpdateModal = (order: any) => {
    setSelectedOrder(order);
    setNewStatus((NEXT_STATUSES[order.order_status] || [])[0] || order.order_status);
    setCourierName(order.courier_name || "BlueDart");
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
        showToast(`Order #${selectedOrder.order_no} is now ${newStatus.replace(/_/g, " ")}. Parent notified on WhatsApp.`);
        await loadOrders();
      } else {
        showToast(data.error || "Couldn't update this order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_no.toLowerCase().includes(search.toLowerCase()) ||
      o.student.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.address_snapshot && JSON.stringify(o.address_snapshot).toLowerCase().includes(search.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === "pending") {
      matchesStatus = ["placed", "confirmed"].includes(o.order_status);
    } else if (statusFilter !== "all") {
      matchesStatus = o.order_status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => ["placed", "confirmed"].includes(o.order_status)).length,
    packed: orders.filter((o) => o.order_status === "packed").length,
    out_for_delivery: orders.filter((o) => o.order_status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.order_status === "delivered").length,
    cancelled: orders.filter((o) => o.order_status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Uniform Orders Fulfillment</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Verify garment sizes, pack school uniform items, generate packing slips & assign couriers
          </p>
        </div>

        <Button
          onClick={loadOrders}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {toastMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Orders", count: statusCounts.all },
          { id: "pending", label: "Pending Packing", count: statusCounts.pending, color: "text-amber-400" },
          { id: "packed", label: "Packed / Ready", count: statusCounts.packed, color: "text-blue-400" },
          { id: "out_for_delivery", label: "Out For Delivery", count: statusCounts.out_for_delivery, color: "text-purple-400" },
          { id: "delivered", label: "Delivered", count: statusCounts.delivered, color: "text-emerald-400" },
          { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled, color: "text-rose-400" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white border-blue-500 shadow-md"
                : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <Card className="p-3 bg-slate-800/80 border-slate-700/60 flex items-center gap-3 rounded-2xl">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by Order # (e.g. SXHS-1001), Student Name, or Pincode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-hidden font-medium"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-slate-400 hover:text-white text-xs px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading fulfillment queue...
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800/60 border-slate-700/60 rounded-3xl space-y-3">
          <Package className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400">
            There are no orders matching your current filter & search query.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const isPending = ["placed", "confirmed"].includes(ord.order_status);
            const isPacked = ord.order_status === "packed";
            const isOut = ord.order_status === "out_for_delivery";
            const isDelivered = ord.order_status === "delivered";

            return (
              <Card
                key={ord.id}
                className="p-5 md:p-6 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-3xl space-y-4 hover:border-slate-600 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/60 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                      #{ord.order_no.split("-")[1] || ord.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-sm">
                          #{ord.order_no}
                        </span>
                        <Badge
                          variant={
                            isDelivered
                              ? "success"
                              : isPacked
                              ? "warning"
                              : isOut
                              ? "brand"
                              : isPending
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {ord.order_status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(ord.createdAt).toLocaleString("en-IN")}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          Payment {ord.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPackingSlipOrder(ord)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold h-8 px-3 rounded-xl cursor-pointer flex items-center gap-1.5"
                      title="Print Packing Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-300" />
                      <span>Packing Slip</span>
                    </Button>

                    {["placed", "confirmed", "packed"].includes(ord.order_status) && (
                      <Button
                        size="sm"
                        onClick={() => setEditingOrder(ord)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 rounded-xl cursor-pointer"
                      >
                        Change items
                      </Button>
                    )}

                    {(NEXT_STATUSES[ord.order_status] || []).length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenUpdateModal(ord)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-8 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Update Status</span>
                    </Button>
                    )}

                    {ord.tracking_token && (
                      <Link href={`/t/${ord.tracking_token}`} target="_blank">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0 rounded-xl border-slate-700 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                          title="Open Parent Live Tracking Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Main Content Grid: Student + Items List + Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Student & Class Details */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Student Details
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{ord.student.name}</h4>
                      <p className="text-xs text-blue-400 font-semibold">
                        Class {ord.student.class} {ord.student.section ? `• Section ${ord.student.section}` : ""}
                      </p>
                      {ord.student.admission_no && (
                        <p className="text-xs text-slate-300 font-mono">Adm #: {ord.student.admission_no}</p>
                      )}
                      {ord.student.verification_status === "verified" ? (
                        <p className="text-xs font-bold text-emerald-400 mt-1">✓ Verified student</p>
                      ) : ord.student.verification_status === "rejected" ? (
                        <p className="text-xs font-bold text-rose-400 mt-1">✕ Not verified: {ord.student.rejection_reason}</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-bold text-amber-300">
                            New student: check the admission number against school records
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={verifyBusy === ord.student.id}
                              onClick={() => handleVerifyStudent(ord.student, "verified")}
                              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              disabled={verifyBusy === ord.student.id}
                              onClick={() => handleVerifyStudent(ord.student, "rejected")}
                              className="flex-1 rounded-xl border border-rose-500/50 text-rose-300 text-xs font-bold disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items to Pack */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Uniform Items ({ord.items.reduce((sum: number, it: any) => sum + it.qty, 0)} Units)
                    </span>
                    <div className="space-y-1.5">
                      {ord.items.map((it: any) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/50"
                        >
                          <div>
                            <span className="font-bold text-white">
                              {it.qty}x {it.item_name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Color: {it.color}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-mono font-bold text-[11px] border border-blue-500/30">
                            Size {it.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery & Dispatch Summary */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Delivery Address & Courier
                    </span>
                    {ord.address_snapshot ? (
                      <div className="text-xs text-slate-300 space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{(ord.address_snapshot as any).name || ord.student.name}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2">
                          {(ord.address_snapshot as any).line1}, {(ord.address_snapshot as any).city} -{" "}
                          {(ord.address_snapshot as any).pincode}
                        </p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{(ord.address_snapshot as any).phone}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No address recorded</div>
                    )}

                    {ord.courier_tracking_no && (
                      <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
                        <span className="text-slate-400">Courier: </span>
                        <strong>{ord.courier_name}</strong> &bull; AWB:{" "}
                        <span className="font-mono text-blue-400">{ord.courier_tracking_no}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
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
                    { id: "cancelled", label: "Cancel & refund" },
                  ]
                    .filter((s) => (NEXT_STATUSES[selectedOrder.order_status] || []).includes(s.id))
                    .map((s) => (
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
                  placeholder="e.g. Verified sizes, packed in official SIF UNIFORMS bag"
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

      {/* Printable Packing Slip Modal */}
      {editingOrder && (
        <OrderItemEditor
          orderId={editingOrder.id}
          onClose={() => setEditingOrder(null)}
          onSaved={({ balanceDue, priceDiff }) => {
            setEditingOrder(null);
            showToast(
              balanceDue > 0
                ? `Saved. Parent has been asked to pay ${formatPaiseToRupees(balanceDue)} more.`
                : priceDiff < 0
                ? `Saved. ${formatPaiseToRupees(-priceDiff)} will be refunded to the parent.`
                : "Order updated. Parent notified."
            );
            loadOrders();
          }}
        />
      )}

      {packingSlipOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-slate-900 p-8 shadow-2xl rounded-3xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    {packingSlipOrder.school?.name || "SIF UNIFORMS Portal"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                  Official School Uniform Packing Slip & Verification Manifest
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Order Number</span>
                <span className="text-lg font-black font-mono text-slate-900 block">
                  #{packingSlipOrder.order_no}
                </span>
                <span className="text-[11px] text-slate-500">
                  {new Date(packingSlipOrder.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Student & Delivery Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Student Information
                </span>
                <p className="font-bold text-sm text-slate-900">{packingSlipOrder.student.name}</p>
                <p className="text-slate-600 font-semibold">
                  Class: {packingSlipOrder.student.class} {packingSlipOrder.student.section ? `(${packingSlipOrder.student.section})` : ""}
                </p>
                {packingSlipOrder.student.admission_no && (
                  <p className="text-slate-500">Adm No: {packingSlipOrder.student.admission_no}</p>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Delivery Destination
                </span>
                {packingSlipOrder.address_snapshot ? (
                  <div className="text-slate-700">
                    <p className="font-bold">{(packingSlipOrder.address_snapshot as any).name}</p>
                    <p>{(packingSlipOrder.address_snapshot as any).line1}</p>
                    <p>
                      {(packingSlipOrder.address_snapshot as any).city},{" "}
                      {(packingSlipOrder.address_snapshot as any).pincode}
                    </p>
                    <p className="font-mono mt-1">
                      Phone: {(packingSlipOrder.address_snapshot as any).phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">No address recorded</p>
                )}
              </div>
            </div>

            {/* Items Packing Checklist */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                Garment Checklist (Packing Staff Verification)
              </h4>
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Check</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Color</th>
                    <th className="p-2.5 text-center">Size</th>
                    <th className="p-2.5 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packingSlipOrder.items.map((it: any, index: number) => (
                    <tr key={it.id || index}>
                      <td className="p-2.5 text-center">
                        <div className="w-4 h-4 border-2 border-slate-400 rounded-sm mx-auto" />
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{it.item_name}</td>
                      <td className="p-2.5 text-center text-slate-600">{it.color}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-900">
                        Size {it.size}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{it.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures / Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <p>Packed by: ________________________</p>
                <p className="text-[10px] text-slate-400 mt-1">Verified with size tags</p>
              </div>
              <div className="text-right">
                <p>Dispatched Date: ___________________</p>
                <p className="text-[10px] text-slate-400 mt-1">SIF UNIFORMS Logistics</p>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="pt-2 flex justify-end gap-2 print:hidden">
              <Button
                variant="outline"
                onClick={() => setPackingSlipOrder(null)}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchoolOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading orders...</div>}>
      <SchoolOrdersContent />
    </Suspense>
  );
}
