"use client";

import React, { useEffect, useState } from "react";
import { Minus, Plus, X, AlertCircle } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/config/constants";

interface SizeOption {
  variant_id: number;
  size_label: string;
  price: number;
  available: number;
}

interface EditableItem {
  id: number;
  item_name: string;
  color: string;
  size: string;
  qty: number;
  unit_price: number;
  variant_id: number | null;
  options: SizeOption[];
}

interface Props {
  orderId: number;
  /** When editing in answer to a parent's request, it's marked approved on save */
  changeRequestId?: number;
  initialReason?: string;
  onClose: () => void;
  /** Called with the server result after a successful save */
  onSaved: (result: { balanceDue: number; priceDiff: number }) => void;
}

/** Admin dialog to change sizes/quantities on a paid order (school or super admin). */
export function OrderItemEditor({ orderId, changeRequestId, initialReason, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [draft, setDraft] = useState<Record<number, { variant_id: number | null; qty: number }>>({});
  const [reason, setReason] = useState(initialReason || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}/edit`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setError(data.error || "Couldn't load this order");
          return;
        }
        setOrderInfo(data.order);
        setItems(data.items);
        setDraft(
          Object.fromEntries(data.items.map((it: EditableItem) => [it.id, { variant_id: it.variant_id, qty: it.qty }]))
        );
      })
      .catch(() => !cancelled && setError("Couldn't load this order"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const linePrice = (it: EditableItem) => {
    const d = draft[it.id];
    if (!d) return it.unit_price * it.qty;
    const unit = d.variant_id === it.variant_id ? it.unit_price : it.options.find((o) => o.variant_id === d.variant_id)?.price ?? it.unit_price;
    return unit * d.qty;
  };

  const changes = items
    .filter((it) => draft[it.id] && (draft[it.id].variant_id !== it.variant_id || draft[it.id].qty !== it.qty))
    .map((it) => ({ order_item_id: it.id, variant_id: draft[it.id].variant_id ?? undefined, qty: draft[it.id].qty }));

  const newItemsTotal = items.reduce((sum, it) => sum + linePrice(it), 0);
  const school = orderInfo?.school;
  const newDelivery = school && !(school.free_delivery_above && newItemsTotal >= school.free_delivery_above) ? school.delivery_charge : 0;
  const newTotal = newItemsTotal + newDelivery;
  const diff = orderInfo ? newTotal - orderInfo.grand_total : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes, reason, changeRequestId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Couldn't save changes");
      onSaved({ balanceDue: data.balanceDue, priceDiff: data.priceDiff });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Change items</span>
            <h3 className="font-extrabold text-lg">{orderInfo ? `Order #${orderInfo.order_no}` : "Loading…"}</h3>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-11 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {!loading && items.length > 0 && (
          <form onSubmit={save} className="space-y-4">
            {items.map((it) => {
              const d = draft[it.id];
              const selected = it.options.find((o) => o.variant_id === d?.variant_id);
              const maxQty = Math.min(selected?.available ?? d?.qty ?? 1, 20);
              return (
                <div key={it.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{it.item_name}</p>
                      <p className="text-xs text-slate-500">
                        {it.color} · was size {it.size} × {it.qty}
                      </p>
                    </div>
                    <span className="font-bold text-sm shrink-0">{formatPaiseToRupees(linePrice(it))}</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex-1 text-xs font-semibold text-slate-600">
                      Size
                      <select
                        value={d?.variant_id ?? ""}
                        disabled={it.options.length === 0}
                        onChange={(e) => setDraft({ ...draft, [it.id]: { ...d, variant_id: Number(e.target.value) } })}
                        className="mt-1 w-full px-3 rounded-xl border border-slate-300 bg-white text-base font-bold"
                      >
                        {it.options.map((o) => (
                          <option key={o.variant_id} value={o.variant_id} disabled={o.available < 1}>
                            {o.size_label} · {formatPaiseToRupees(o.price)}
                            {o.available < 1 ? " (out of stock)" : o.available < 5 ? ` (${o.available} left)` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-300 bg-white">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={!d || d.qty <= 1}
                        onClick={() => setDraft({ ...draft, [it.id]: { ...d, qty: d.qty - 1 } })}
                        className="w-11 flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{d?.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={!d || d.qty >= maxQty}
                        onClick={() => setDraft({ ...draft, [it.id]: { ...d, qty: d.qty + 1 } })}
                        className="w-11 flex items-center justify-center disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-3.5 rounded-2xl border border-slate-200 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">New total (incl. delivery)</span>
                <span className="font-bold">{formatPaiseToRupees(newTotal)}</span>
              </div>
              {changes.length > 0 && diff !== 0 && (
                <p className={`font-semibold ${diff > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {diff > 0
                    ? `Parent will be asked to pay ${formatPaiseToRupees(diff)} more`
                    : `${formatPaiseToRupees(-diff)} will be queued as a refund`}
                </p>
              )}
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Reason (shown to the parent)
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Parent asked for size 32 instead of 30"
                className="mt-1 w-full px-3.5 rounded-xl border border-slate-300 text-base font-normal"
              />
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || changes.length === 0 || !reason.trim()}
                className="w-1/2 py-3 bg-[#0c2461] hover:bg-blue-900 text-white font-bold rounded-xl disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
        {loading && <p className="text-sm text-slate-500 py-6 text-center">Loading items…</p>}
      </div>
    </div>
  );
}
