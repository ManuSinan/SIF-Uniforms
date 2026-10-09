"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPaiseToRupees } from "@/lib/config/constants";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, CheckCircle2, AlertCircle, Shirt } from "lucide-react";
import { ParentHeader } from "@/components/layout/ParentHeader";

interface CartSummary {
  cart_id: number;
  student_id: number;
  student_name: string;
  count: number;
}

export default function MyCartPage() {
  const [cart, setCart] = useState<any | null>(null);
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2500);
  };

  const applyResponse = (data: any) => {
    if (data.success) {
      setCart(data.cart);
      setCarts(data.carts || []);
    }
  };

  const loadCart = useCallback(async (studentId?: number | string | null) => {
    try {
      const res = await fetch(studentId ? `/api/cart?studentId=${studentId}` : "/api/cart");
      applyResponse(await res.json());
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart(new URLSearchParams(window.location.search).get("student"));
  }, [loadCart]);

  const switchChild = (studentId: number) => {
    window.history.replaceState(null, "", `/cart?student=${studentId}`);
    setLoading(true);
    loadCart(studentId);
  };

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, qty: newQty }),
      });
      const data = await res.json();
      if (data.success) applyResponse(data);
      else showToast(data.error || "Couldn't update quantity", true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        await loadCart(cart?.student_id);
        showToast("Item removed");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const items: any[] = cart?.items || [];
  const itemsTotal = items.reduce((sum, it) => sum + (it.variant?.price || 0) * it.qty, 0);
  const school = cart?.student?.school;
  const deliveryCharge =
    school && !(school.free_delivery_above && itemsTotal >= school.free_delivery_above) ? school.delivery_charge : 0;
  const grandTotal = itemsTotal > 0 ? itemsTotal + deliveryCharge : 0;
  const toFreeDelivery = school?.free_delivery_above ? school.free_delivery_above - itemsTotal : 0;
  const otherCarts = carts.filter((c) => c.student_id !== cart?.student_id);

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-slate-900 pb-28 md:pb-16">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 p-3 px-5 text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 max-w-[90vw] ${
            toast.error ? "bg-rose-700" : "bg-[#061536]"
          }`}
        >
          {toast.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <ParentHeader activeSchoolName={school?.name} cartCount={carts.reduce((s, c) => s + c.count, 0)} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        <header className="relative flex items-center justify-between py-2">
          <Link
            href="/parent"
            aria-label="Back to shop"
            className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-lg text-slate-900 absolute left-1/2 -translate-x-1/2">My bag</h1>
          <div className="w-11 h-11" />
        </header>

        {/* Bags for each child. A bag becomes one order for that child's school. */}
        {otherCarts.length > 0 && cart?.student && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            <span className="flex items-center px-4 h-11 rounded-full text-sm font-bold bg-[#0c2461] text-white shrink-0">
              {cart.student.name.split(" ")[0]}&apos;s bag · {items.reduce((n, it) => n + it.qty, 0)}
            </span>
            {otherCarts.map((c) => (
              <button
                key={c.cart_id}
                type="button"
                onClick={() => switchChild(c.student_id)}
                className="px-4 rounded-full text-sm font-bold shrink-0 border bg-white text-slate-700 border-slate-200"
              >
                {c.student_name.split(" ")[0]}&apos;s bag · {c.count}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4 pt-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 bg-white rounded-3xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[28px] p-10 text-center border border-slate-100 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0c2461] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 text-base">
                {cart?.student ? `${cart.student.name.split(" ")[0]}'s bag is empty` : "Your bag is empty"}
              </h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Browse the approved uniform list for your child&apos;s school and class.
              </p>
            </div>
            <Link
              href="/parent"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#061536] hover:bg-[#0c2461] text-white rounded-full text-sm font-bold shadow-md"
            >
              Browse uniforms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart?.student && (
              <div className="bg-white rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0c2461] font-bold text-sm flex items-center justify-center shrink-0">
                  {cart.student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    For {cart.student.name} · Class {cart.student.class}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{school?.name}</p>
                </div>
              </div>
            )}

            {items.map((it) => {
              const isBusy = updatingId === it.id;
              const sp = it.variant?.schoolProduct;
              const unitPrice = it.variant?.price || 0;
              const stock = it.variant?.stock ?? 0;
              return (
                <div key={it.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-20 h-20 rounded-2xl bg-[#f4f4f7] flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      {sp?.image_url ? (
                        <img src={sp.image_url} alt={sp.product?.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shirt className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">{sp?.product?.name}</h3>
                      <p className="text-xs text-slate-500">
                        Size {it.variant?.size?.size_label} · {sp?.color_name}
                      </p>
                      <p className="font-black text-sm text-slate-950">{formatPaiseToRupees(unitPrice)}</p>
                      {it.qty > stock && (
                        <p className="text-xs font-bold text-rose-600">
                          {stock <= 0 ? "Out of stock, please remove" : `Only ${stock} left`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRemoveItem(it.id)}
                      className="flex items-center gap-1.5 px-2 text-sm font-semibold text-slate-500 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>

                    <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200/60">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={isBusy || it.qty <= 1}
                        onClick={() => handleUpdateQty(it.id, it.qty - 1)}
                        className="w-10 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-9 text-center font-bold text-sm text-slate-900" aria-live="polite">
                        {it.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={isBusy || it.qty >= stock}
                        onClick={() => handleUpdateQty(it.id, it.qty + 1)}
                        className="w-10 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Order summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-900">{formatPaiseToRupees(itemsTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-bold text-slate-900">
                    {deliveryCharge === 0 ? "FREE" : formatPaiseToRupees(deliveryCharge)}
                  </span>
                </div>
                {deliveryCharge > 0 && toFreeDelivery > 0 && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    Add {formatPaiseToRupees(toFreeDelivery)} more for free delivery
                  </p>
                )}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-black text-slate-950 text-base">{formatPaiseToRupees(grandTotal)}</span>
                </div>
              </div>

              <Link
                href={`/checkout?student=${cart?.student_id}`}
                className="flex items-center justify-center w-full py-4 rounded-full bg-[#061536] hover:bg-[#0c2461] text-white font-bold text-sm shadow-xl shadow-blue-950/20 active:scale-98"
              >
                Checkout for {cart?.student?.name.split(" ")[0]}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
