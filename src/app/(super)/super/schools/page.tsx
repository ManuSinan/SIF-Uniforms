"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  School,
  MapPin,
  Truck,
  Plus,
  Phone,
  Search,
  ExternalLink,
  Shield,
  Package,
  CheckCircle2,
  ChevronLeft,
  X,
  User,
  Mail,
  RefreshCw,
  Sparkles,
  LogOut,
} from "lucide-react";

export default function SuperSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Modal State for Onboarding School & Admin Access
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    primaryColor: "#1e3a8a",
    secondaryColor: "#f59e0b",
    address: "",
    contactPhone: "",
    deliveryCharge: "100",
    freeDeliveryAbove: "2000",
    pincodes: "560001, 560025, 560034",
    adminName: "",
    adminMobile: "",
    adminEmail: "",
    allowAdminPriceStockEdit: true,
  });

  useEffect(() => {
    fetchSchools();
  }, [sortBy]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schools?sort=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const pinArray = formData.pincodes
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          address: formData.address,
          contactPhone: formData.contactPhone,
          deliveryCharge: Number(formData.deliveryCharge) || 0,
          freeDeliveryAbove: Number(formData.freeDeliveryAbove) || null,
          pincodes: pinArray,
          adminName: formData.adminName,
          adminMobile: formData.adminMobile,
          adminEmail: formData.adminEmail,
          allowAdminPriceStockEdit: formData.allowAdminPriceStockEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create school.");
      }

      setToastMsg(`School '${formData.name}' & School Admin access created successfully!`);
      setShowModal(false);
      setFormData({
        name: "",
        code: "",
        primaryColor: "#1e3a8a",
        secondaryColor: "#f59e0b",
        address: "",
        contactPhone: "",
        deliveryCharge: "100",
        freeDeliveryAbove: "2000",
        pincodes: "560001, 560025, 560034",
        adminName: "",
        adminMobile: "",
        adminEmail: "",
        allowAdminPriceStockEdit: true,
      });

      await fetchSchools();
      setTimeout(() => setToastMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to onboard school.");
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side search and dynamic sorting
  const filteredSchools = schools
    .filter((sch) => {
      const q = search.toLowerCase();
      const matchesName = sch.name.toLowerCase().includes(q);
      const matchesCode = sch.code.toLowerCase().includes(q);
      const matchesAddress = (sch.address || "").toLowerCase().includes(q);
      const matchesPincode = (sch.serviceablePincodes || []).some((p: any) =>
        p.pincode.includes(q)
      );
      return matchesName || matchesCode || matchesAddress || matchesPincode;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "delivery_asc") return a.delivery_charge - b.delivery_charge;
      if (sortBy === "pincodes_desc") return (b.serviceablePincodes?.length || 0) - (a.serviceablePincodes?.length || 0);
      if (sortBy === "products_desc") return (b._count?.schoolProducts || 0) - (a._count?.schoolProducts || 0);
      return 0;
    });

  const totalPincodes = schools.reduce((acc, s) => acc + (s.serviceablePincodes?.length || 0), 0);
  const totalProducts = schools.reduce((acc, s) => acc + (s.schoolProducts?.length || 0), 0);

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
                  tab.id === "Schools"
                    ? "bg-white/20 text-white font-bold shadow-xs border border-white/20"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 bg-white text-[#0c2461] hover:bg-blue-50 px-3.5 sm:px-4 py-2 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Onboard School</span>
              <span className="sm:hidden">Add</span>
            </button>

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
                  tab.id === "Schools"
                    ? "bg-white/25 text-white font-bold shadow-xs border border-white/25"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>
        </div>

        {/* Hero Title & Stats Banner */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-Tenant School Directory &bull; Access & Branding</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Partner School Stores
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Onboard new schools with dedicated admin access, custom branding themes, and delivery zones
            </p>
          </div>

          {/* Key Metric Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Schools</span>
              <span className="text-2xl font-black text-white font-mono">{schools.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Pincodes</span>
              <span className="text-2xl font-black text-white font-mono">{totalPincodes}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Catalog Sets</span>
              <span className="text-2xl font-black text-white font-mono">{totalProducts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-6">
        {toastMsg && (
          <div className="p-4 bg-emerald-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Search and Sort Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by school name, code (e.g. SXHS), pincode, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0c2461] focus:ring-2 focus:ring-blue-100 outline-hidden font-medium transition-all"
            />
          </div>

          {/* Add School Action Button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c2461] hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-950/15 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add School</span>
          </button>
        </div>

        {/* Schools Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <School className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">No matching schools found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or onboard a new partner school.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#0c2461] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors cursor-pointer"
            >
              + Onboard New School
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((sch) => (
              <div
                key={sch.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-5"
              >
                {/* Header: Logo, Name, Code & Palette */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-13 h-13 rounded-2xl text-white font-black flex items-center justify-center text-xl shadow-sm shrink-0"
                        style={{ backgroundColor: sch.primary_color }}
                      >
                        {sch.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#0c2461] transition-colors truncate">
                          {sch.name}
                        </h3>
                        <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 mt-1">
                          CODE: {sch.code}
                        </span>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 shrink-0" title="School Branding Colors">
                      <div
                        className="w-5 h-5 rounded-full border border-slate-200 shadow-2xs"
                        style={{ backgroundColor: sch.primary_color }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-slate-200 shadow-2xs"
                        style={{ backgroundColor: sch.secondary_color }}
                      />
                    </div>
                  </div>

                  {/* Address & Contact */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100/80 text-xs space-y-2 text-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#1e40af] shrink-0" />
                        <span>
                          Delivery: <strong>{formatPaiseToRupees(sch.delivery_charge)}</strong>
                        </span>
                      </div>
                      {sch.free_delivery_above && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Free &gt; {formatPaiseToRupees(sch.free_delivery_above)}
                        </span>
                      )}
                    </div>

                    {sch.address && (
                      <div className="flex items-start gap-2 text-slate-500 pt-1 border-t border-slate-200/50">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-2 leading-relaxed text-[11px]">{sch.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Serviceable Pincodes */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Serviceable Pincodes ({sch.serviceablePincodes?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                      {(sch.serviceablePincodes || []).map((p: any) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-slate-100 text-slate-700"
                        >
                          {p.pincode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Store Link & Catalog Info */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sch.schoolProducts?.length || sch._count?.schoolProducts || 0} Uniforms</span>
                  </div>

                  <Link
                    href={`/s/${sch.code.toLowerCase()}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Visit Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* ONBOARD NEW SCHOOL & ADMIN ACCESS MODAL                                */}
      {/* ======================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#1e40af] uppercase tracking-wider block">
                  Multi-Tenant Partner Onboarding
                </span>
                <h2 className="font-black text-slate-900 text-xl">Onboard New School & Admin Access</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-2xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-5 text-xs">
              {/* Section 1: School Details */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <School className="w-4 h-4 text-[#0c2461]" />
                  <span>1. School Profile & Branding</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi Public School"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DPS"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Brand Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secondary Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Campus Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Survey 45/1, Outer Ring Road, Bengaluru"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden"
                  />
                </div>
              </div>

              {/* Section 2: Delivery & Pincodes */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0c2461]" />
                  <span>2. Delivery Pricing & Serviceable Zones</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.deliveryCharge}
                      onChange={(e) => setFormData({ ...formData, deliveryCharge: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Free Delivery Threshold (₹)</label>
                    <input
                      type="number"
                      placeholder="2000"
                      value={formData.freeDeliveryAbove}
                      onChange={(e) => setFormData({ ...formData, freeDeliveryAbove: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serviceable Pincodes (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="560001, 560025, 560034"
                    value={formData.pincodes}
                    onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Parents entering any of these pincodes can order uniforms for this school.
                  </span>
                </div>
              </div>

              {/* Section 3: School Admin Login Access */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0c2461]" />
                  <span>3. School Administrator Login Access</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admin Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Principal Dr. Sharma"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admin WhatsApp Mobile (10-digits) *</label>
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <span className="px-3 py-2.5 bg-slate-100 font-bold text-slate-600 border-r border-slate-200">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="98765 43217"
                        value={formData.adminMobile}
                        onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value.replace(/\D/g, "") })}
                        className="w-full px-3 py-2.5 bg-transparent font-mono font-bold outline-hidden tracking-wider"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Admin will use this number to sign in via WhatsApp OTP at /login.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="admin@school.edu"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Onboarding School...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Confirm & Onboard School</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
