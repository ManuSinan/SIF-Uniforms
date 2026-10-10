"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Settings,
  School,
  MapPin,
  Truck,
  Phone,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  X,
  Palette,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { SchoolAvatar } from "@/components/common/SchoolAvatar";
import { formatPaiseToRupees } from "@/lib/config/constants";

export default function SchoolSettingsPage() {
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    logo_url: "",
    primaryColor: "#1e3a8a",
    secondaryColor: "#f59e0b",
    address: "",
    contactPhone: "",
    deliveryCharge: "0",
    freeDeliveryAbove: "",
  });

  const [pincodesList, setPincodesList] = useState<string[]>([]);
  const [newPincodeInput, setNewPincodeInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSchoolProfile();
  }, []);

  const loadSchoolProfile = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.authenticated || !meData.user?.schoolId) {
        throw new Error("Unable to identify logged in school admin");
      }

      const schoolId = meData.user.schoolId;
      const schoolRes = await fetch(`/api/schools/${schoolId}`);
      const schoolJson = await schoolRes.json();

      if (schoolJson.success && schoolJson.school) {
        const sch = schoolJson.school;
        setSchoolData(sch);
        setFormData({
          name: sch.name || "",
          code: sch.code || "",
          logo_url: sch.logo_url || "",
          primaryColor: sch.primary_color || "#1e3a8a",
          secondaryColor: sch.secondary_color || "#f59e0b",
          address: sch.address || "",
          contactPhone: sch.contact_phone || "",
          deliveryCharge: String(Math.round((sch.delivery_charge || 0) / 100)),
          freeDeliveryAbove: sch.free_delivery_above
            ? String(Math.round(sch.free_delivery_above / 100))
            : "",
        });

        const pins = (sch.serviceablePincodes || []).map((p: any) => String(p.pincode).trim());
        setPincodesList(pins);
      }
    } catch (err: any) {
      console.error("Failed to load school settings:", err);
      setErrorMsg(err.message || "Failed to load store settings");
    } finally {
      setLoading(false);
    }
  };

  const showToastNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  // Upload Logo handler
  const handleLogoUpload = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "schools");

    try {
      setUploadingLogo(true);
      setErrorMsg("");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo image");
      }

      setFormData((prev) => ({ ...prev, logo_url: data.url }));
      showToastNotification("Logo uploaded! Remember to click 'Save Settings'.");
    } catch (err: any) {
      setErrorMsg(err.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Pincode addition
  const handleAddPincode = () => {
    if (!newPincodeInput.trim()) return;

    const parts = newPincodeInput
      .split(/[,\s]+/)
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter((p) => p.length >= 3 && p.length <= 10);

    if (parts.length > 0) {
      setPincodesList((prev) => Array.from(new Set([...prev, ...parts])));
      setNewPincodeInput("");
    }
  };

  const handleRemovePincode = (pincodeToRemove: string) => {
    setPincodesList((prev) => prev.filter((p) => p !== pincodeToRemove));
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolData?.id) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/schools/${schoolData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          logo_url: formData.logo_url || null,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          address: formData.address,
          contactPhone: formData.contactPhone,
          deliveryCharge: Number(formData.deliveryCharge) || 0,
          freeDeliveryAbove: formData.freeDeliveryAbove ? Number(formData.freeDeliveryAbove) : null,
          pincodes: pincodesList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save store settings.");
      }

      showToastNotification("Store settings updated successfully!");
      await loadSchoolProfile();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save store settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading store profile &amp; settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                School Store Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-300 border border-white/10 uppercase">
                {formData.code}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customize your official uniform storefront branding, logo, delivery pricing, and serviceable pincodes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/s/${formData.code.toLowerCase()}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Visit Parent Store</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: School Identity & Logo Branding */}
        <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-700/60 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>1. School Identity &amp; Logo Branding</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Visible to Parents on Catalog</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Live Logo Avatar Preview */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Store Avatar Preview
              </span>
              <SchoolAvatar
                school={{
                  name: formData.name,
                  code: formData.code,
                  logo_url: formData.logo_url,
                  primary_color: formData.primaryColor,
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 shadow-lg"
              />
              <span className="text-[10px] text-slate-400">
                {formData.logo_url ? "Uploaded Custom Logo" : "Auto-Generated 1st Letter & Color"}
              </span>
            </div>

            {/* Logo Image URL & Upload Actions */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  School Logo Image
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload a file"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="flex-1 min-w-[160px] px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:border-blue-500 outline-none font-medium"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.svg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-md"
                  >
                    {uploadingLogo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Logo</span>
                  </button>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                      className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Reset to 1st-letter avatar"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload SVG, PNG, or JPG. If left blank, your store will automatically display an avatar with the 1st letter and your brand background color.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    School Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    School Unique Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.code}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-400 font-mono font-bold cursor-not-allowed uppercase"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Managed by Super Admin</span>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    <span>Primary Theme Color</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white font-mono font-bold uppercase focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Secondary Accent Color</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white font-mono font-bold uppercase focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-700/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>2. Campus Location &amp; Contact Details</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Physical Campus Address
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 12 Church Street, Richmond Town, Bengaluru"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-none font-medium resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Helpdesk Phone Number</span>
              </label>
              <input
                type="text"
                placeholder="+91 80 2221 4455"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-none font-medium"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Shown to parents for uniform queries and size exchanges
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Delivery Charges & Serviceable Pincodes */}
        <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-700/60 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>3. Delivery Pricing &amp; Serviceable Pincodes</span>
            </h2>
          </div>

          {/* Delivery Charges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Standard Delivery Charge (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  value={formData.deliveryCharge}
                  onChange={(e) => setFormData({ ...formData, deliveryCharge: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-none font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Set ₹0 for complimentary free delivery</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Free Delivery Above Order Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 2000 (Optional)"
                  value={formData.freeDeliveryAbove}
                  onChange={(e) => setFormData({ ...formData, freeDeliveryAbove: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-blue-500 outline-none font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Leave empty if no threshold applies</span>
            </div>
          </div>

          {/* Serviceable Pincodes Manager */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Serviceable Delivery Pincodes ({pincodesList.length})
              </label>
              <span className="text-[11px] text-slate-400">
                {pincodesList.length === 0 ? "Delivering across all India pincodes" : "Restricted to listed areas"}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit pincode(s) e.g. 560001, 560025"
                value={newPincodeInput}
                onChange={(e) => setNewPincodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPincode();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:border-blue-500 outline-none font-mono font-medium"
              />
              <button
                type="button"
                onClick={handleAddPincode}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pincode</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 min-h-[80px] max-h-48 overflow-y-auto">
              {pincodesList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pincodesList.map((pin) => (
                    <span
                      key={pin}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-blue-300 border border-slate-700 text-xs font-mono font-bold shadow-xs group"
                    >
                      <span>{pin}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePincode(pin)}
                        className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove pincode"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs font-medium">
                  No pincode restrictions set. Orders will be accepted for all pincodes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/school"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Store Settings...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
