"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ParentNavbar } from "@/components/layout/ParentNavbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Phone,
  LogOut,
  MapPin,
  Users,
  Shield,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLine1, setFormLine1] = useState("");
  const [formLine2, setFormLine2] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formError, setFormError] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meRes, addrRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/addresses"),
      ]);
      const meData = await meRes.json();
      const addrData = await addrRes.json();

      if (meData.authenticated && meData.user) {
        setUser(meData.user);
      }
      if (addrData.success) {
        setAddresses(addrData.addresses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddrId(null);
    setFormName(user?.name || "");
    setFormPhone(user?.mobile || "");
    setFormLine1("");
    setFormLine2("");
    setFormCity("");
    setFormPincode("");
    setFormError("");
    setShowAddressModal(true);
  };

  const handleOpenEdit = (addr: any) => {
    setEditingAddrId(addr.id);
    setFormName(addr.name || "");
    setFormPhone(addr.phone || "");
    setFormLine1(addr.line1 || "");
    setFormLine2(addr.line2 || "");
    setFormCity(addr.city || "");
    setFormPincode(addr.pincode || "");
    setFormError("");
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert(data.error || "Failed to delete address");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting address");
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formLine1 || !formPincode) return;

    setFormError("");
    setSavingAddr(true);
    try {
      if (editingAddrId) {
        const res = await fetch(`/api/addresses/${editingAddrId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            phone: formPhone,
            line1: formLine1,
            line2: formLine2,
            city: formCity,
            pincode: formPincode,
          }),
        });
        const data = await res.json();
        if (data.success && data.address) {
          setShowAddressModal(false);
          setAddresses((prev) => prev.map((a) => (a.id === data.address.id ? data.address : a)));
        } else {
          setFormError(data.error || "Failed to update address");
        }
      } else {
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            phone: formPhone,
            line1: formLine1,
            line2: formLine2,
            city: formCity,
            pincode: formPincode,
            is_default: addresses.length === 0,
          }),
        });
        const data = await res.json();
        if (data.success && data.address) {
          setShowAddressModal(false);
          setAddresses((prev) => [data.address, ...prev]);
        } else {
          setFormError(data.error || "Failed to add address");
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("An error occurred while saving address");
    } finally {
      setSavingAddr(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ParentNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Your Account</h1>

        {/* User Card */}
        <Card className="p-6 bg-white border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{user?.name || "Parent"}</h2>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                +91 {user?.mobile}
              </p>
              <div className="mt-2">
                <Badge variant="brand" className="capitalize text-[10px]">
                  {user?.role?.replace("_", " ") || "Parent"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Logout
          </Button>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/parent">
            <Card hoverEffect className="p-4 bg-white border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Child Profiles</h3>
                  <p className="text-xs text-slate-500">Manage children & schools</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Card>
          </Link>

          <Link href="/orders">
            <Card hoverEffect className="p-4 bg-white border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Order History</h3>
                  <p className="text-xs text-slate-500">Track packages & receipts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Card>
          </Link>
        </div>

        {/* Saved Addresses */}
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              Saved Delivery Addresses
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs h-8 text-blue-900 border-blue-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Address
            </Button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-slate-500">No saved addresses found. Click &apos;Add Address&apos; to save one.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>{addr.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-normal">{addr.phone}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(addr)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100/80 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg transition-colors"
                        title="Edit address"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-100/80 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} - <strong>{addr.pincode}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Address Modal (Add / Edit) */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <Card className="w-full max-w-md bg-white p-5 sm:p-6 pb-8 shadow-2xl border-slate-200 rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingAddrId ? "Edit Delivery Address" : "Add Delivery Address"}
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowAddressModal(false)}
                  className="w-11 text-slate-400 hover:text-slate-600 font-bold text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat No, Apartment Name, Street"
                    value={formLine1}
                    onChange={(e) => setFormLine1(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Area, Landmark or building"
                    value={formLine2}
                    onChange={(e) => setFormLine2(e.target.value)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
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
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="w-full px-3 py-2 text-base rounded-xl border border-slate-300 focus:border-blue-700 outline-hidden font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddressModal(false)}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingAddr}
                    className="w-1/2 bg-blue-900 text-white font-bold"
                  >
                    {savingAddr ? "Saving..." : editingAddrId ? "Update Address" : "Save Address"}
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
