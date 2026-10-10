"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParentNavbar } from "@/components/layout/ParentNavbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  MapPin,
  Plus,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  Pencil,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");

  // New Address modal/form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrError, setAddrError] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  // Edit Address modal/form state
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLine1, setEditLine1] = useState("");
  const [editLine2, setEditLine2] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editError, setEditError] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [savingEditAddr, setSavingEditAddr] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const studentParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("student") : null;

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartRes, addrRes] = await Promise.all([
        fetch(`/api/cart${studentParam ? `?studentId=${studentParam}` : ""}`),
        fetch("/api/addresses"),
      ]);

      const cartData = await cartRes.json();
      const addrData = await addrRes.json();

      if (cartData.success && cartData.cart) {
        setCart(cartData.cart);
      }

      if (addrData.success && addrData.addresses) {
        setAddresses(addrData.addresses);
        if (addrData.addresses.length > 0) {
          const defaultAddr = addrData.addresses.find((a: any) => a.is_default) || addrData.addresses[0];
          setSelectedAddressId((prev) => prev || defaultAddr.id);
        } else {
          setShowAddAddress(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setEditName(addr.name || "");
    setEditPhone(addr.phone || "");
    setEditLine1(addr.line1 || "");
    setEditLine2(addr.line2 || "");
    setEditCity(addr.city || "");
    setEditPincode(addr.pincode || "");
    setEditLandmark(addr.landmark || "");
    setEditError("");
    setShowEditAddress(true);
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressId || !editName || !editPhone || !editLine1 || !editPincode) return;

    setEditError("");
    setSavingEditAddr(true);
    try {
      const res = await fetch(`/api/addresses/${editingAddressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          line1: editLine1,
          line2: editLine2,
          city: editCity,
          pincode: editPincode,
          landmark: editLandmark,
        }),
      });

      const data = await res.json();
      if (data.success && data.address) {
        setShowEditAddress(false);
        setAddresses((prev) =>
          prev.map((a) => (a.id === data.address.id ? data.address : a))
        );
        setSelectedAddressId(data.address.id);
      } else {
        setEditError(data.error || "Couldn't update this address");
      }
    } catch (err) {
      console.error(err);
      setEditError("Failed to update address");
    } finally {
      setSavingEditAddr(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrLine1 || !addrPincode) return;

    setAddrError("");
    setSavingAddr(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addrName,
          phone: addrPhone,
          line1: addrLine1,
          line2: addrLine2,
          city: addrCity,
          pincode: addrPincode,
          landmark: addrLandmark,
          is_default: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddAddress(false);
        setAddrName("");
        setAddrPhone("");
        setAddrLine1("");
        setAddrLine2("");
        setAddrCity("");
        setAddrPincode("");
        setAddrLandmark("");
        setSelectedAddressId(data.address.id);
        await loadCheckoutData();
      } else {
        setAddrError(data.error || "Couldn't save this address");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddr(false);
    }
  };

  const handlePayAndPlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }

    if (!cart?.student?.id) {
      setError("Please select a student for this order");
      return;
    }

    if (selectedAddress && !isServiceable(selectedAddress.pincode)) {
      setError(`Sorry, ${school?.name} doesn't deliver to pincode ${selectedAddress.pincode} yet. Please choose another address.`);
      return;
    }

    setError("");
    setProcessingPayment(true);
    let createdOrder: any = null;

    try {
      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: cart.student.id,
          address_id: selectedAddressId,
          cart_id: cart.id,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const order = orderData.order;
      createdOrder = order;

      // 2. Initialize Razorpay Payment Order
      const rzpRes = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpData.success) {
        throw new Error(rzpData.error || "Couldn't start the payment");
      }

      // 3. Complete verification (in test/dev mode instant auto-capture)
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
      if (verifyData.success) {
        router.push(`/orders/${order.id}?placed=1`);
        return;
      }
      throw new Error(verifyData.error || "Payment verification failed");
    } catch (err: any) {
      if (createdOrder) {
        // The order exists but isn't paid; its page lets the parent retry the payment.
        router.push(`/orders/${createdOrder.id}?payment=failed&reason=${encodeURIComponent(err.message || "")}`);
        return;
      }
      setError(err.message || "Checkout failed");
      setProcessingPayment(false);
    }
  };

  const items = cart?.items || [];
  const itemsTotal = items.reduce((sum: number, it: any) => sum + (it.variant?.price || 0) * it.qty, 0);
  const school = cart?.student?.school;
  let deliveryCharge = school?.delivery_charge ?? 0;
  if (school?.free_delivery_above && itemsTotal >= school.free_delivery_above) {
    deliveryCharge = 0;
  }
  const grandTotal = itemsTotal + deliveryCharge;
  const servicePins: string[] = (school?.serviceablePincodes || []).map((p: any) => p.pincode.trim());
  const isServiceable = (pin: string) => servicePins.length === 0 || servicePins.includes(pin.trim());
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const blockedByPincode = Boolean(selectedAddress && !isServiceable(selectedAddress.pincode));

  return (
    <div className="flex flex-col min-h-screen">
      <ParentNavbar schoolName={school?.name} />

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/cart">
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Checkout & Payment</h1>
            <p className="text-xs text-slate-500">Secure Home Delivery & Razorpay Gateway</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium">Loading your bag...</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 bg-white border-slate-200 text-center space-y-3">
            <h2 className="text-base font-bold text-slate-900">Your bag is empty</h2>
            <p className="text-sm text-slate-500">Add uniform items to your bag before checking out.</p>
            <Link href="/parent" className="inline-block">
              <Button className="mt-2">Browse uniforms</Button>
            </Link>
          </Card>
        ) : (
        <>
        {/* Step 1: Delivery Address */}
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              1. Delivery Address
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(true)}
              className="text-xs h-8 text-blue-900 border-blue-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add New
            </Button>
          </div>

          {addresses.length === 0 && (
            <p className="text-sm text-slate-500">Add the address where the uniforms should be delivered.</p>
          )}
          <div className="grid grid-cols-1 gap-3">
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedAddressId(addr.id)}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-900 ring-1 ring-blue-900"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{addr.name}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-slate-500 font-mono">{addr.phone}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAddress(addr);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100/80 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg transition-colors"
                        title="Edit this address"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} - <strong>{addr.pincode}</strong>
                  </p>
                  {!isServiceable(addr.pincode) && (
                    <p className="mt-1.5 text-xs font-bold text-rose-600">No delivery to this pincode from {school?.name}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 2: Student & Package Summary */}
        <Card className="p-5 bg-white border-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-700" />
            2. Student & Items Overview
          </h2>

          {cart?.student && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-900">{cart.student.name}</span> &bull; Class {cart.student.class}
              <span className="text-slate-500 block">{cart.student.school.name}</span>
            </div>
          )}

          <div className="divide-y divide-slate-100 text-xs">
            {items.map((it: any) => (
              <div key={it.id} className="py-2.5 flex justify-between">
                <div>
                  <span className="font-bold text-slate-900">{it.variant?.schoolProduct?.product?.name}</span>
                  <div className="text-slate-500">
                    Size: {it.variant?.size?.size_label} &bull; Qty: {it.qty}
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-900">
                  {formatPaiseToRupees((it.variant?.price || 0) * it.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-mono">{formatPaiseToRupees(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono">
                {deliveryCharge === 0 ? "FREE" : formatPaiseToRupees(deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-100">
              <span>Grand Total</span>
              <span className="font-mono text-emerald-700">{formatPaiseToRupees(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Step 3: Payment CTA */}
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Razorpay Secure Checkout</h3>
              <p className="text-xs text-slate-500">UPI, Credit/Debit Cards, NetBanking, Wallets</p>
            </div>
          </div>
          {blockedByPincode && (
            <p className="text-sm font-semibold text-rose-600">
              {school?.name} doesn&apos;t deliver to {selectedAddress?.pincode} yet. Choose or add another address.
            </p>
          )}

          <Button
            disabled={processingPayment || items.length === 0 || !selectedAddressId || blockedByPincode}
            onClick={handlePayAndPlaceOrder}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 text-base shadow-lg shadow-emerald-600/15"
          >
            {processingPayment ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Pay {formatPaiseToRupees(grandTotal)} via Razorpay
              </div>
            )}
          </Button>
        </Card>
        </>
        )}

        {/* Edit Address Modal */}
        {showEditAddress && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <Card className="w-full max-w-md bg-white p-5 sm:p-6 pb-8 shadow-2xl border-slate-200 rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">Edit Delivery Address</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowEditAddress(false)}
                  className="w-11 text-slate-400 hover:text-slate-600 font-bold text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateAddress} className="space-y-3 text-xs">
                {editError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{editError}</div>
                )}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat No, Apartment Name, Street"
                    value={editLine1}
                    onChange={(e) => setEditLine1(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Area, Landmark or building"
                    value={editLine2}
                    onChange={(e) => setEditLine2(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      pattern="[0-9]{6}"
                      required
                      maxLength={6}
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditAddress(false)}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEditAddr}
                    className="w-1/2 bg-blue-900 text-white font-bold"
                  >
                    {savingEditAddr ? "Saving..." : "Update Address"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* New Address Modal */}
        {showAddAddress && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <Card className="w-full max-w-md bg-white p-5 sm:p-6 pb-8 shadow-2xl border-slate-200 rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">Add Home Delivery Address</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowAddAddress(false)}
                  className="w-11 text-slate-400 hover:text-slate-600 font-bold text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                {addrError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">{addrError}</div>
                )}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat No, Apartment Name, Street"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Area, Landmark or building"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      pattern="[0-9]{6}"
                      required
                      maxLength={6}
                      value={addrPincode}
                      onChange={(e) => setAddrPincode(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddAddress(false)}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingAddr}
                    className="w-1/2 bg-blue-900 text-white font-bold"
                  >
                    {savingAddr ? "Saving..." : "Save Address"}
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
