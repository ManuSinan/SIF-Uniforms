"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ParentNavbar } from "@/components/layout/ParentNavbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Truck,
  ChevronLeft,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  RefreshCw,
  XCircle,
  Share2,
} from "lucide-react";

const STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "confirmed", label: "Confirmed by school" },
  { key: "packed", label: "Packed" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [banner, setBanner] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeMsg, setChangeMsg] = useState("");
  const [changeItemId, setChangeItemId] = useState<number | "">("");
  const [changeVariantId, setChangeVariantId] = useState<number | "">("");
  const [submittingChange, setSubmittingChange] = useState(false);
  const [busy, setBusy] = useState<"" | "pay" | "cancel">("");

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setLoadError("");
      } else {
        setLoadError(res.status === 404 || res.status === 403 ? "We couldn't find this order." : data.error || "Couldn't load this order.");
      }
    } catch {
      setLoadError("Couldn't load this order. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("placed")) setBanner({ kind: "success", msg: "Payment successful! Your order has been placed." });
    if (qs.get("payment") === "failed") {
      setBanner({ kind: "error", msg: qs.get("reason") || "Payment didn't go through. You can try again below." });
    }
    if (qs.toString()) window.history.replaceState(null, "", `/orders/${orderId}`);
    loadOrder();
  }, [orderId, loadOrder]);

  const handlePayNow = async () => {
    setBusy("pay");
    setBanner(null);
    try {
      const rzpRes = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpData.success) throw new Error(rzpData.error || "Couldn't start the payment");

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          razorpay_order_id: rzpData.orderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error || "Payment verification failed");
      const isPending = order?.order_status === "pending_payment";
      setBanner({
        kind: "success",
        msg: isPending ? "Payment successful! Your order has been placed." : "Balance paid. Thank you!",
      });
      await loadOrder();
    } catch (err: any) {
      setBanner({ kind: "error", msg: err.message || "Payment failed" });
    } finally {
      setBusy("");
    }
  };

  const handleCancel = async () => {
    const paid = order.payment_status === "paid";
    if (!window.confirm(paid ? "Cancel this order? Your payment will be refunded." : "Cancel this order?")) return;
    setBusy("cancel");
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", delivery_note: "Cancelled by parent" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Couldn't cancel this order");
      setBanner({ kind: "success", msg: paid ? "Order cancelled. Your refund has been requested." : "Order cancelled." });
      await loadOrder();
    } catch (err: any) {
      setBanner({ kind: "error", msg: err.message });
    } finally {
      setBusy("");
    }
  };

  const handleSendChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeMsg.trim() && !(changeItemId && changeVariantId)) return;
    setSubmittingChange(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          changeItemId && changeVariantId
            ? { order_item_id: changeItemId, requested_variant_id: changeVariantId, message: changeMsg }
            : { message: changeMsg }
        ),
      });
      const data = await res.json();
      if (data.success) {
        setShowChangeModal(false);
        setChangeMsg("");
        setChangeItemId("");
        setChangeVariantId("");
        setBanner({ kind: "success", msg: "Change request sent to the school." });
        await loadOrder();
      } else {
        setBanner({ kind: "error", msg: data.error || "Couldn't send your request" });
      }
    } finally {
      setSubmittingChange(false);
    }
  };

  const handleShareTracker = async () => {
    const url = `${window.location.origin}/t/${order.tracking_token}`;
    try {
      if (navigator.share) await navigator.share({ title: `Order #${order.order_no}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setBanner({ kind: "success", msg: "Tracking link copied" });
      }
    } catch {
      /* user dismissed share sheet */
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <ParentNavbar />
        <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
          {loadError ? (
            <>
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-semibold">{loadError}</p>
              <Link href="/orders" className="inline-block px-5 py-3 rounded-xl bg-[#0c2461] text-white text-sm font-bold">
                Back to my orders
              </Link>
            </>
          ) : (
            <p className="text-slate-500">Loading order details…</p>
          )}
        </div>
      </div>
    );
  }

  const status: string = order.order_status;
  const isPendingPayment = status === "pending_payment";
  const isCancelled = status === "cancelled";
  const canCancel = ["pending_payment", "placed", "confirmed"].includes(status);
  const canRequestChange = ["placed", "confirmed"].includes(status);
  const currentStep = STEPS.findIndex((s) => s.key === status);
  const addr = order.address_snapshot as any;
  const refunds: any[] = order.refunds || [];
  const balanceDue: number = order.balance_due || 0;
  const changeItem = order.items.find((it: any) => it.id === changeItemId);

  return (
    <div className="flex flex-col min-h-screen">
      <ParentNavbar schoolName={order.school.name} />

      <main className="max-w-3xl mx-auto px-4 py-5 flex-1 w-full space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            aria-label="Back to orders"
            className="w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Order #{order.order_no}</span>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">For {order.student.name}</h1>
            <p className="text-xs text-slate-500 truncate">
              {order.school.name} · Class {order.student.class}
            </p>
          </div>
        </div>

        {banner && (
          <div
            role="status"
            className={`p-3.5 rounded-2xl text-sm font-semibold flex items-start gap-2 ${
              banner.kind === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {banner.kind === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{banner.msg}</span>
          </div>
        )}

        {isPendingPayment && (
          <Card className="p-4 bg-amber-50 border-amber-200 space-y-3">
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Payment pending</h3>
              <p className="text-sm text-amber-800">This order isn&apos;t placed until payment is complete.</p>
            </div>
            <Button onClick={handlePayNow} disabled={busy !== ""} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {busy === "pay" ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Pay {formatPaiseToRupees(order.grand_total)}
            </Button>
          </Card>
        )}

        {balanceDue > 0 && !isCancelled && (
          <Card className="p-4 bg-amber-50 border-amber-200 space-y-3">
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Balance to pay: {formatPaiseToRupees(balanceDue)}</h3>
              <p className="text-sm text-amber-800">Your order was changed to a higher-priced size. The school packs it once this is paid.</p>
            </div>
            <Button onClick={handlePayNow} disabled={busy !== ""} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {busy === "pay" ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Pay {formatPaiseToRupees(balanceDue)}
            </Button>
          </Card>
        )}

        {refunds.length > 0 && (
          <Card className="p-4 bg-white border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Refunds</h3>
            {refunds.map((r: any) => (
              <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{formatPaiseToRupees(r.amount)}</p>
                  <p className="text-xs text-slate-500">{r.reason}</p>
                  {r.reference && <p className="text-xs text-slate-500">Ref: {r.reference}</p>}
                </div>
                <Badge variant={r.status === "processed" ? "success" : r.status === "failed" ? "danger" : "warning"}>
                  {r.status === "processed" ? "Sent" : r.status === "failed" ? "Failed" : "In progress"}
                </Badge>
              </div>
            ))}
            {refunds.some((r: any) => r.status === "pending") && (
              <p className="text-xs text-slate-500">Refunds usually reach your account within 5–7 working days.</p>
            )}
          </Card>
        )}

        {/* Delivery progress */}
        {!isPendingPayment && (
          <Card className="p-5 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-700" /> Delivery status
              </h3>
              <button
                type="button"
                onClick={handleShareTracker}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-800 px-2"
              >
                <Share2 className="w-4 h-4" /> Share tracking
              </button>
            </div>
            {isCancelled ? (
              <div className="text-sm text-rose-700 font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5" /> This order was cancelled.

              </div>
            ) : (
              <ol className="space-y-3">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </span>
                      <span className={`text-sm ${done ? "font-bold text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                    </li>
                  );
                })}
              </ol>
            )}
            {order.courier_name && (
              <p className="mt-4 pt-3 border-t border-slate-100 text-sm text-slate-600">
                Courier: <strong>{order.courier_name}</strong>
                {order.courier_tracking_no ? ` · AWB ${order.courier_tracking_no}` : ""}
                {order.courier_phone ? ` · ${order.courier_phone}` : ""}
              </p>
            )}
          </Card>
        )}

        {canRequestChange && (
          <Card className="p-4 bg-white border-slate-200 space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Need a different size?</h3>
              <p className="text-sm text-slate-500">The school hasn&apos;t packed this order yet, so you can still ask for a change.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowChangeModal(true)}
              className="w-full text-sm bg-white text-amber-900 border-amber-300 hover:bg-amber-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Request a change
            </Button>
          </Card>
        )}

        {order.changeRequests?.length > 0 && (
          <Card className="p-4 bg-white border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Your change requests</h3>
            {order.changeRequests.map((cr: any) => (
              <div key={cr.id} className="p-3 bg-slate-50 rounded-xl text-sm space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-900">{cr.message}</span>
                  <Badge variant={cr.status === "approved" ? "success" : cr.status === "rejected" ? "danger" : "warning"}>
                    {cr.status}
                  </Badge>
                </div>
                {cr.response_note && <p className="text-xs text-slate-600 italic">School: {cr.response_note}</p>}
              </div>
            ))}
          </Card>
        )}

        <Card className="p-5 bg-white border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm mb-2">Items</h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((it: any) => (
              <div key={it.id} className="py-3 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm">{it.item_name}</div>
                  <div className="text-xs text-slate-500">
                    {it.color} · Size <strong>{it.size}</strong> · Qty <strong>{it.qty}</strong>
                  </div>
                </div>
                <div className="font-bold text-slate-900 text-sm shrink-0">{formatPaiseToRupees(it.unit_price * it.qty)}</div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Items total</span>
              <span>{formatPaiseToRupees(order.items_total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{order.delivery_charge === 0 ? "FREE" : formatPaiseToRupees(order.delivery_charge)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-100">
              <span>{order.payment_status === "paid" ? "Paid" : "Total"}</span>
              <span className="text-emerald-700">{formatPaiseToRupees(order.grand_total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Delivery address</span>
          {addr ? (
            <div className="text-sm text-slate-700 space-y-0.5">
              <div className="font-bold text-slate-900">{addr.name}</div>
              <div>
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
              </div>
              <div>
                {addr.city} - {addr.pincode}
              </div>
              <div className="text-slate-500">{addr.phone}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Address on file</div>
          )}
        </Card>

        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy !== ""}
            className="w-full py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl disabled:opacity-50"
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel order"}
          </button>
        )}

        {showChangeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <Card className="w-full max-w-md bg-white p-5 sm:p-6 pb-8 shadow-2xl border-slate-200 rounded-b-none sm:rounded-b-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-base">Request a change</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowChangeModal(false)}
                  className="w-11 text-slate-400 hover:text-slate-600 font-bold text-2xl"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSendChangeRequest} className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Item
                    <select
                      value={changeItemId}
                      onChange={(e) => {
                        setChangeItemId(e.target.value ? Number(e.target.value) : "");
                        setChangeVariantId("");
                      }}
                      className="mt-1 w-full px-3 rounded-xl border border-slate-300 bg-white text-base"
                    >
                      <option value="">Something else (describe below)</option>
                      {order.items
                        .filter((it: any) => it.size_options?.length)
                        .map((it: any) => (
                          <option key={it.id} value={it.id}>
                            {it.item_name}, size {it.size}
                          </option>
                        ))}
                    </select>
                  </label>
                  {changeItem && (
                    <label className="block text-sm font-semibold text-slate-700">
                      New size
                      <select
                        required
                        value={changeVariantId}
                        onChange={(e) => setChangeVariantId(e.target.value ? Number(e.target.value) : "")}
                        className="mt-1 w-full px-3 rounded-xl border border-slate-300 bg-white text-base"
                      >
                        <option value="">Choose a size</option>
                        {changeItem.size_options.map((o: any) => (
                          <option key={o.variant_id} value={o.variant_id} disabled={!o.in_stock}>
                            {o.size_label} · {formatPaiseToRupees(o.price)}
                            {!o.in_stock ? " (out of stock)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div>
                  <label htmlFor="change-msg" className="block text-sm font-semibold text-slate-700 mb-1">
                    {changeItem ? "Note for the school (optional)" : "What should the school change?"}
                  </label>
                  <textarea
                    id="change-msg"
                    rows={3}
                    required={!changeItem}
                    placeholder='e.g. "Please change the shirt from size 30 to 32"'
                    value={changeMsg}
                    onChange={(e) => setChangeMsg(e.target.value)}
                    className="w-full p-3 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowChangeModal(false)} className="w-1/2">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingChange || (changeItem ? !changeVariantId : !changeMsg.trim())}
                    className="w-1/2 bg-blue-900 text-white font-bold"
                  >
                    {submittingChange ? "Sending…" : "Send request"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
