"use client";

import { formatPaiseToRupees } from "@/lib/config/constants";
import { OrderItemEditor } from "@/components/orders/OrderItemEditor";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare,
  Check,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  User,
} from "lucide-react";

export default function SchoolChangeRequestsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [handlingId, setHandlingId] = useState<number | null>(null);
  const [responseNotes, setResponseNotes] = useState<Record<number, string>>({});
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [editing, setEditing] = useState<{ orderId: number; requestId: number; message: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const handleAction = async (orderId: number, requestId: number, status: "approved" | "rejected") => {
    if (status === "rejected" && !(responseNotes[requestId] || "").trim()) {
      showToast("Please write a short reason for the parent before rejecting");
      return;
    }
    setHandlingId(requestId);
    try {
      const res = await fetch(`/api/orders/${orderId}/change-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          response_note: responseNotes[requestId] || "",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          status === "rejected"
            ? "Request declined. Parent has been told why."
            : data.balanceDue > 0
            ? `Size changed. Parent asked to pay ${formatPaiseToRupees(data.balanceDue)} more.`
            : data.priceDiff < 0
            ? `Size changed. ${formatPaiseToRupees(-data.priceDiff)} will be refunded.`
            : data.applied
            ? "Size changed on the order."
            : "Request marked as done."
        );
        await loadRequests();
      } else {
        showToast(data.error || "Couldn't update this request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHandlingId(null);
    }
  };

  const allRequests = orders.flatMap((o) =>
    (o.changeRequests || []).map((cr: any) => ({ ...cr, order: o }))
  );

  const filteredRequests = allRequests.filter((cr) => {
    if (statusFilter === "all") return true;
    return cr.status === statusFilter;
  });

  const counts = {
    pending: allRequests.filter((cr) => cr.status === "pending").length,
    approved: allRequests.filter((cr) => cr.status === "approved").length,
    rejected: allRequests.filter((cr) => cr.status === "rejected").length,
    all: allRequests.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Parent Size & Order Change Requests</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review size modification, exchange, and adjustment requests submitted by parents before packing
          </p>
        </div>

        <Button
          onClick={loadRequests}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {toastMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "pending", label: "Pending Review", count: counts.pending, color: "text-amber-400" },
          { id: "approved", label: "Approved", count: counts.approved, color: "text-emerald-400" },
          { id: "rejected", label: "Rejected", count: counts.rejected, color: "text-rose-400" },
          { id: "all", label: "All Requests", count: counts.all, color: "text-slate-300" },
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

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading size change requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800/60 border-slate-700/60 rounded-3xl space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">No Requests Found</h3>
          <p className="text-xs text-slate-400">
            {statusFilter === "pending"
              ? "All size exchange and change requests are resolved!"
              : "No change requests found under this filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((cr) => {
            const isPending = cr.status === "pending";
            const isApproved = cr.status === "approved";
            const isRejected = cr.status === "rejected";

            return (
              <Card
                key={cr.id}
                className="p-5 md:p-6 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-3xl space-y-4 hover:border-slate-600 transition-all"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          Order #{cr.order.order_no}
                        </span>
                        <Badge
                          variant={
                            isApproved ? "success" : isRejected ? "danger" : "warning"
                          }
                        >
                          {cr.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Submitted on {new Date(cr.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/school/orders`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white text-xs h-8 px-3 rounded-xl cursor-pointer"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Student Info */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Student
                    </span>
                    <h4 className="font-bold text-white text-sm">{cr.order.student.name}</h4>
                    <p className="text-xs text-blue-400">Class {cr.order.student.class}</p>
                    {cr.order.address_snapshot && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{(cr.order.address_snapshot as any).phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-700/40 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ordered Uniform Items
                    </span>
                    <div className="space-y-1">
                      {cr.order.items.map((it: any) => (
                        <div key={it.id} className="text-xs text-slate-300">
                          <strong>{it.qty}x</strong> {it.item_name} &bull;{" "}
                          <span className="text-blue-400 font-mono">Size {it.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parent Message & Request */}
                  <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Parent's Request Note
                    </span>
                    <p className="text-xs font-semibold text-white leading-relaxed">
                      &ldquo;{cr.message}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Response Note if already handled */}
                {cr.response_note && (
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/40 text-xs text-slate-300">
                    <span className="font-bold text-slate-400 block text-[11px]">
                      Admin Response ({cr.handled_by || "School Admin"}):
                    </span>
                    <p className="mt-0.5 text-slate-200">{cr.response_note}</p>
                  </div>
                )}

                {/* Action Toolbar for Pending Requests */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder={cr.requested_variant_id ? "Note for parent (optional when approving)" : "Reply to the parent…"}
                      value={responseNotes[cr.id] || ""}
                      onChange={(e) =>
                        setResponseNotes({ ...responseNotes, [cr.id]: e.target.value })
                      }
                      className="flex-1 min-w-0 w-full sm:w-auto px-3.5 py-2 text-base sm:text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 outline-hidden font-medium"
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={handlingId === cr.id}
                        onClick={() => handleAction(cr.order.id, cr.id, "rejected")}
                        className="text-xs h-9 px-3 rounded-xl text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                      {cr.requested_variant_id ? (
                        <Button
                          size="sm"
                          disabled={handlingId === cr.id}
                          onClick={() => handleAction(cr.order.id, cr.id, "approved")}
                          className="text-xs px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-lg shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Approve &amp; change size
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={handlingId === cr.id}
                            onClick={() => handleAction(cr.order.id, cr.id, "approved")}
                            className="text-xs px-3 rounded-xl border-slate-600 text-slate-200 bg-slate-800 font-bold cursor-pointer"
                          >
                            Reply &amp; close
                          </Button>
                          <Button
                            size="sm"
                            disabled={handlingId === cr.id}
                            onClick={() => setEditing({ orderId: cr.order.id, requestId: cr.id, message: cr.message })}
                            className="text-xs px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            Edit order
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <OrderItemEditor
          orderId={editing.orderId}
          changeRequestId={editing.requestId}
          initialReason={`As requested: ${editing.message}`.slice(0, 180)}
          onClose={() => setEditing(null)}
          onSaved={({ balanceDue, priceDiff }) => {
            setEditing(null);
            showToast(
              balanceDue > 0
                ? `Order changed. Parent asked to pay ${formatPaiseToRupees(balanceDue)} more.`
                : priceDiff < 0
                ? `Order changed. ${formatPaiseToRupees(-priceDiff)} will be refunded.`
                : "Order changed and request approved."
            );
            loadRequests();
          }}
        />
      )}
    </div>
  );
}
