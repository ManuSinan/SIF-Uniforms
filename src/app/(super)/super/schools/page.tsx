"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Package,
  CheckCircle2,
  X,
  User,
  Mail,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  Store,
  ChevronRight,
} from "lucide-react";

import { SchoolAvatar } from "@/components/common/SchoolAvatar";


export default function SuperSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  // Notifications
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createLogoUploading, setCreateLogoUploading] = useState(false);
  const [newPincodeInputCreate, setNewPincodeInputCreate] = useState("");
  const [createPincodesList, setCreatePincodesList] = useState<string[]>([
    "560001",
    "560025",
    "560034",
  ]);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    code: "",
    logo_url: "",
    primaryColor: "#1e3a8a",
    secondaryColor: "#f59e0b",
    address: "",
    contactPhone: "",
    deliveryCharge: "100",
    freeDeliveryAbove: "2000",
    adminName: "",
    adminMobile: "",
    adminEmail: "",
    allowAdminPriceStockEdit: true,
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [newPincodeInputEdit, setNewPincodeInputEdit] = useState("");
  const [editPincodesList, setEditPincodesList] = useState<string[]>([]);

  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    logo_url: "",
    primaryColor: "#1e3a8a",
    secondaryColor: "#f59e0b",
    address: "",
    contactPhone: "",
    deliveryCharge: "0",
    freeDeliveryAbove: "",
    adminName: "",
    adminMobile: "",
    adminEmail: "",
    allowAdminPriceStockEdit: false,
    isActive: true,
  });

  const fileInputRefCreate = useRef<HTMLInputElement>(null);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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

  // Open Edit Modal with selected school data
  const handleOpenEdit = (sch: any) => {
    setEditingSchool(sch);
    setErrorMsg("");

    const pincodes = (sch.serviceablePincodes || []).map((p: any) => String(p.pincode).trim());
    setEditPincodesList(pincodes);
    setNewPincodeInputEdit("");

    const schoolAdmin = (sch.users || []).find((u: any) => u.role === "school_admin");

    setEditFormData({
      name: sch.name || "",
      code: sch.code || "",
      logo_url: sch.logo_url || "",
      primaryColor: sch.primary_color || "#1e3a8a",
      secondaryColor: sch.secondary_color || "#f59e0b",
      address: sch.address || "",
      contactPhone: sch.contact_phone || "",
      deliveryCharge: String(Math.round((sch.delivery_charge || 0) / 100)),
      freeDeliveryAbove: sch.free_delivery_above ? String(Math.round(sch.free_delivery_above / 100)) : "",
      adminName: schoolAdmin?.name || "",
      adminMobile: schoolAdmin?.mobile || "",
      adminEmail: schoolAdmin?.email || "",
      allowAdminPriceStockEdit: Boolean(sch.allow_admin_price_stock_edit),
      isActive: sch.is_active !== undefined ? Boolean(sch.is_active) : true,
    });

    setShowEditModal(true);
  };

  // File Upload Handlers
  const handleFileUpload = async (file: File, isEdit: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "schools");

    if (isEdit) setEditLogoUploading(true);
    else setCreateLogoUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo image");
      }

      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, logo_url: data.url }));
      } else {
        setCreateFormData((prev) => ({ ...prev, logo_url: data.url }));
      }
      showToastNotification("Logo uploaded successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      if (isEdit) setEditLogoUploading(false);
      else setCreateLogoUploading(false);
    }
  };

  const showToastNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  // Pincode helpers
  const handleAddPincode = (isEdit: boolean) => {
    const raw = isEdit ? newPincodeInputEdit : newPincodeInputCreate;
    if (!raw.trim()) return;

    const parts = raw
      .split(/[,\s]+/)
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter((p) => p.length >= 3 && p.length <= 10);

    if (parts.length === 0) return;

    if (isEdit) {
      setEditPincodesList((prev) => Array.from(new Set([...prev, ...parts])));
      setNewPincodeInputEdit("");
    } else {
      setCreatePincodesList((prev) => Array.from(new Set([...prev, ...parts])));
      setNewPincodeInputCreate("");
    }
  };

  const handleRemovePincode = (pincodeToRemove: string, isEdit: boolean) => {
    if (isEdit) {
      setEditPincodesList((prev) => prev.filter((p) => p !== pincodeToRemove));
    } else {
      setCreatePincodesList((prev) => prev.filter((p) => p !== pincodeToRemove));
    }
  };

  // Onboard / Create School
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCreateSubmitting(true);

    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createFormData.name,
          code: createFormData.code,
          logo_url: createFormData.logo_url || null,
          primaryColor: createFormData.primaryColor,
          secondaryColor: createFormData.secondaryColor,
          address: createFormData.address,
          contactPhone: createFormData.contactPhone,
          deliveryCharge: Number(createFormData.deliveryCharge) || 0,
          freeDeliveryAbove: Number(createFormData.freeDeliveryAbove) || null,
          pincodes: createPincodesList,
          adminName: createFormData.adminName,
          adminMobile: createFormData.adminMobile,
          adminEmail: createFormData.adminEmail,
          allowAdminPriceStockEdit: createFormData.allowAdminPriceStockEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create school.");
      }

      showToastNotification(`School '${createFormData.name}' & School Admin created successfully!`);
      setShowCreateModal(false);
      setCreateFormData({
        name: "",
        code: "",
        logo_url: "",
        primaryColor: "#1e3a8a",
        secondaryColor: "#f59e0b",
        address: "",
        contactPhone: "",
        deliveryCharge: "100",
        freeDeliveryAbove: "2000",
        adminName: "",
        adminMobile: "",
        adminEmail: "",
        allowAdminPriceStockEdit: true,
      });
      setCreatePincodesList(["560001", "560025", "560034"]);

      await fetchSchools();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to onboard school.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Update / Save School Details
  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    setErrorMsg("");
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/schools/${editingSchool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          code: editFormData.code,
          logo_url: editFormData.logo_url || null,
          primaryColor: editFormData.primaryColor,
          secondaryColor: editFormData.secondaryColor,
          address: editFormData.address,
          contactPhone: editFormData.contactPhone,
          deliveryCharge: Number(editFormData.deliveryCharge) || 0,
          freeDeliveryAbove: editFormData.freeDeliveryAbove ? Number(editFormData.freeDeliveryAbove) : null,
          pincodes: editPincodesList,
          adminName: editFormData.adminName,
          adminMobile: editFormData.adminMobile,
          adminEmail: editFormData.adminEmail,
          allowAdminPriceStockEdit: editFormData.allowAdminPriceStockEdit,
          is_active: editFormData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update school details.");
      }

      showToastNotification(`School '${editFormData.name}' details updated successfully!`);
      setShowEditModal(false);
      setEditingSchool(null);
      await fetchSchools();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update school.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Client-side search and dynamic sorting
  const filteredSchools = schools
    .filter((sch) => {
      const q = search.toLowerCase();
      const matchesName = (sch.name || "").toLowerCase().includes(q);
      const matchesCode = (sch.code || "").toLowerCase().includes(q);
      const matchesAddress = (sch.address || "").toLowerCase().includes(q);
      const matchesPincode = (sch.serviceablePincodes || []).some((p: any) =>
        String(p.pincode).includes(q)
      );
      return matchesName || matchesCode || matchesAddress || matchesPincode;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "code") return (a.code || "").localeCompare(b.code || "");
      if (sortBy === "delivery_asc") return (a.delivery_charge || 0) - (b.delivery_charge || 0);
      if (sortBy === "pincodes_desc")
        return (b.serviceablePincodes?.length || 0) - (a.serviceablePincodes?.length || 0);
      if (sortBy === "products_desc")
        return (b._count?.schoolProducts || 0) - (a._count?.schoolProducts || 0);
      return 0;
    });

  const totalPincodes = schools.reduce((acc, s) => acc + (s.serviceablePincodes?.length || 0), 0);
  const totalProducts = schools.reduce(
    (acc, s) => acc + (s.schoolProducts?.length || s._count?.schoolProducts || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-16 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header Banner in Royal Blue Theme */}
      <div className="relative bg-gradient-to-br from-[#061536] via-[#0c2461] to-[#1e40af] text-white pt-6 pb-20 px-4 sm:px-8 lg:px-12 overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar */}
        <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between gap-4 pb-8">
          <Link href="/super" className="flex items-center group">
            <img
              src="/images/logo-white.png"
              alt="SIF UNIFORMS"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
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
              onClick={() => {
                setErrorMsg("");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-white text-[#0c2461] hover:bg-blue-50 px-4 py-2 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard School</span>
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

        {/* Mobile Horizontal Navigation Pills */}
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
              <span>Multi-Tenant School Directory &bull; Branding &amp; Delivery Hub</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Partner School Stores
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Configure partner schools, manage custom logos and branding, adjust delivery pincodes, and configure admin permissions.
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
              <span className="text-xs font-semibold text-blue-200/80 block">Uniform Items</span>
              <span className="text-2xl font-black text-white font-mono">{totalProducts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-6">
        {toastMsg && (
          <div className="p-4 bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search and Sort Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-full sm:min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by school name, code (e.g. SXHS), pincode (e.g. 560001), or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0c2461] focus:ring-2 focus:ring-blue-100 outline-hidden font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-w-0 flex-1 sm:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-hidden focus:border-[#0c2461] cursor-pointer"
            >
              <option value="name_asc">Sort: School Name (A-Z)</option>
              <option value="name_desc">Sort: School Name (Z-A)</option>
              <option value="code">Sort: School Code</option>
              <option value="pincodes_desc">Sort: Most Pincodes</option>
              <option value="products_desc">Sort: Most Products</option>
              <option value="delivery_asc">Sort: Lowest Delivery Fee</option>
            </select>

            {/* Add School Action Button */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0c2461] hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-950/15 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add School</span>
            </button>
          </div>
        </div>

        {/* Schools Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-72 animate-pulse"
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
              onClick={() => {
                setErrorMsg("");
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-[#0c2461] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors cursor-pointer"
            >
              + Onboard New School
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((sch) => {
              return (
                <div
                  key={sch.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300/80 transition-all duration-200 flex flex-col justify-between group space-y-5 relative overflow-hidden"
                >
                  {/* School Status Top Gradient Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${sch.primary_color || "#1e3a8a"}, ${
                        sch.secondary_color || "#f59e0b"
                      })`,
                    }}
                  />

                  {/* Header: Logo, Name & Code */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* High-Resolution Logo Avatar */}
                        <SchoolAvatar school={sch} className="w-13 h-13 sm:w-14 sm:h-14" />

                        {/* Name and Code */}
                        <div className="min-w-0">
                          <h3
                            className="font-black text-slate-900 text-base leading-snug group-hover:text-[#0c2461] transition-colors line-clamp-2"
                            title={sch.name}
                          >
                            {sch.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/80">
                              {sch.code}
                            </span>
                            {!sch.is_active && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Brand Colors Pill Indicator */}
                      <div
                        className="flex items-center gap-1 p-1 rounded-full bg-slate-50 border border-slate-200/80 shrink-0"
                        title="Brand Theme Colors"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: sch.primary_color || "#1e3a8a" }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: sch.secondary_color || "#f59e0b" }}
                        />
                      </div>
                    </div>

                    {/* Delivery Info Box */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs space-y-2 text-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#1e40af] shrink-0" />
                          <span>
                            Delivery: <strong>{formatPaiseToRupees(sch.delivery_charge)}</strong>
                          </span>
                        </div>
                        {sch.free_delivery_above ? (
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Free &gt; {formatPaiseToRupees(sch.free_delivery_above)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Standard</span>
                        )}
                      </div>

                      {sch.address && (
                        <div className="flex items-start gap-2 text-slate-500 pt-1.5 border-t border-slate-200/50">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1 leading-relaxed text-[11px]">{sch.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Serviceable Pincodes List */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#0c2461]" />
                          <span>Serviceable Pincodes ({sch.serviceablePincodes?.length || 0})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sch)}
                          className="text-[10px] text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                        >
                          + Manage
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                        {sch.serviceablePincodes && sch.serviceablePincodes.length > 0 ? (
                          sch.serviceablePincodes.map((p: any) => (
                            <span
                              key={p.id || p.pincode}
                              className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 transition-colors"
                            >
                              {p.pincode}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                            No pincode restrictions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Premium Action Bar */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {/* Catalog item count badge */}
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.schoolProducts?.length || sch._count?.schoolProducts || 0} Uniform Sets</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Official Store</span>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sch)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#0c2461] border border-slate-200 hover:border-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#0c2461]" />
                        <span>Edit School</span>
                      </button>

                      <Link
                        href={`/s/${sch.code.toLowerCase()}`}
                        target="_blank"
                        className="w-full py-2.5 px-3 rounded-2xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/20 transition-all active:scale-95 cursor-pointer group/btn"
                      >
                        <span>Visit Store</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* EDIT SCHOOL DETAILS & PINCODES MODAL                                     */}
      {/* ======================================================================= */}
      {showEditModal && editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <SchoolAvatar
                  school={{ name: editFormData.name, code: editFormData.code, logo_url: editFormData.logo_url }}
                  className="w-12 h-12"
                />
                <div>
                  <span className="text-[10px] font-bold text-[#1e40af] uppercase tracking-wider block">
                    School Profile &amp; Delivery Management
                  </span>
                  <h2 className="font-black text-slate-900 text-xl">
                    Edit {editingSchool.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSchool(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSchool} className="space-y-6 text-xs">
              {/* Section 1: Logo & Branding Identity */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0c2461]" />
                  <span>1. School Logo &amp; Brand Colors</span>
                </h3>

                {/* Logo Uploader / URL Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  {/* Logo Live Preview */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Live Logo Preview</span>
                    <SchoolAvatar
                      school={{ name: editFormData.name, code: editFormData.code, logo_url: editFormData.logo_url }}
                      className="w-20 h-20"
                    />
                    <span className="text-[10px] text-slate-400">Displayed on student shop &amp; badges</span>
                  </div>

                  {/* Logo URL & Upload Buttons */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Logo Image URL or Local Asset
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="/images/schools/sxhs-logo.svg or https://..."
                          value={editFormData.logo_url}
                          onChange={(e) => setEditFormData({ ...editFormData, logo_url: e.target.value })}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                        />
                        <input
                          type="file"
                          ref={fileInputRefEdit}
                          accept="image/*,.svg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], true);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefEdit.current?.click()}
                          disabled={editLogoUploading}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                          {editLogoUploading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Name, Code, Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.code}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Brand Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editFormData.primaryColor}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, primaryColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={editFormData.primaryColor}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, primaryColor: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secondary Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editFormData.secondaryColor}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, secondaryColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={editFormData.secondaryColor}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, secondaryColor: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Campus Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 12 Church Street, Bengaluru"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 80 2221 4455"
                      value={editFormData.contactPhone}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, contactPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Pricing & Serviceable Pincodes */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0c2461]" />
                  <span>2. Delivery Pricing &amp; Serviceable Pincodes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Standard Delivery Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={editFormData.deliveryCharge}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, deliveryCharge: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Free Delivery Threshold (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="2000"
                      value={editFormData.freeDeliveryAbove}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, freeDeliveryAbove: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>
                </div>

                {/* Serviceable Pincode Manager */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Deliverable Pincodes ({editPincodesList.length})
                    </label>
                    {editPincodesList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditPincodesList([])}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Add New Pincode Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit pincode (or multiple e.g. 560001, 560002, 673571)"
                      value={newPincodeInputEdit}
                      onChange={(e) => setNewPincodeInputEdit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPincode(true);
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPincode(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Pincode</span>
                    </button>
                  </div>

                  {/* Interactive Pincode Tags */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 min-h-[70px] max-h-48 overflow-y-auto">
                    {editPincodesList.length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-xs">
                        No pincode restrictions configured. Delivery will be available everywhere.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editPincodesList.map((pin) => (
                          <span
                            key={pin}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/80 font-mono font-bold text-xs shadow-2xs group"
                          >
                            <span>{pin}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePincode(pin, true)}
                              className="w-4 h-4 rounded-full bg-blue-200/60 hover:bg-rose-500 hover:text-white flex items-center justify-center text-blue-800 transition-colors cursor-pointer"
                              title="Remove Pincode"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: School Admin Details & Permissions */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0c2461]" />
                  <span>3. School Admin Login &amp; Operational Controls</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Admin Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Principal / Store Incharge"
                      value={editFormData.adminName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, adminName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admin WhatsApp Mobile</label>
                    <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <span className="px-3 py-2.5 bg-slate-100 font-bold text-slate-600 border-r border-slate-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={editFormData.adminMobile}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            adminMobile: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full px-3 py-2.5 bg-transparent font-mono font-bold outline-hidden tracking-wider"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="admin@school.edu"
                    value={editFormData.adminEmail}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, adminEmail: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                  />
                </div>

                {/* Permissions & Status Toggles */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.allowAdminPriceStockEdit}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          allowAdminPriceStockEdit: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Allow School Admin to Edit Price &amp; Stock
                      </span>
                      <span className="text-[10px] text-slate-400">
                        When enabled, local school staff can modify variant price and stock overrides.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Active Store</span>
                      <span className="text-[10px] text-slate-400">Visible for student ordering</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSchool(null);
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-3 rounded-2xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-md shadow-blue-950/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save School Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ONBOARD NEW SCHOOL & ADMIN ACCESS MODAL                                */}
      {/* ======================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#1e40af] uppercase tracking-wider block">
                  Multi-Tenant Partner Onboarding
                </span>
                <h2 className="font-black text-slate-900 text-xl">Onboard New School Store</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-6 text-xs">
              {/* Section 1: School Profile & Branding */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0c2461]" />
                  <span>1. School Profile &amp; Logo Branding</span>
                </h3>

                {/* Logo Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Logo Preview</span>
                    <SchoolAvatar
                      school={{ name: createFormData.name, code: createFormData.code, logo_url: createFormData.logo_url }}
                      className="w-20 h-20"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Logo URL or Upload</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="/images/schools/sxhs-logo.svg or URL"
                          value={createFormData.logo_url}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, logo_url: e.target.value })
                          }
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                        />
                        <input
                          type="file"
                          ref={fileInputRefCreate}
                          accept="image/*,.svg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefCreate.current?.click()}
                          disabled={createLogoUploading}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                          {createLogoUploading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>


                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi Public School"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DPS"
                      value={createFormData.code}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Brand Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={createFormData.primaryColor}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, primaryColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={createFormData.primaryColor}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, primaryColor: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secondary Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={createFormData.secondaryColor}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, secondaryColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={createFormData.secondaryColor}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, secondaryColor: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Campus Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Survey 45/1, Outer Ring Road, Bengaluru"
                    value={createFormData.address}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Section 2: Delivery & Serviceable Pincodes */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0c2461]" />
                  <span>2. Delivery Pricing &amp; Serviceable Zones</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={createFormData.deliveryCharge}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, deliveryCharge: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Free Delivery Threshold (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="2000"
                      value={createFormData.freeDeliveryAbove}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          freeDeliveryAbove: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-slate-700">
                    Serviceable Pincodes ({createPincodesList.length})
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter pincode (e.g. 560001, 560025, 673571)"
                      value={newPincodeInputCreate}
                      onChange={(e) => setNewPincodeInputCreate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPincode(false);
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPincode(false)}
                      className="px-4 py-2.5 rounded-xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 min-h-[60px] max-h-40 overflow-y-auto">
                    {createPincodesList.length === 0 ? (
                      <div className="text-center py-2 text-slate-400 text-xs">
                        No pincodes added yet.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {createPincodesList.map((pin) => (
                          <span
                            key={pin}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/80 font-mono font-bold text-xs shadow-2xs"
                          >
                            <span>{pin}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePincode(pin, false)}
                              className="w-4 h-4 rounded-full bg-blue-200/60 hover:bg-rose-500 hover:text-white flex items-center justify-center text-blue-800 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: School Admin Access */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0c2461]" />
                  <span>3. School Administrator Login Access</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admin Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Principal Dr. Sharma"
                      value={createFormData.adminName}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, adminName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Admin WhatsApp Mobile (10-digits) *
                    </label>
                    <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <span className="px-3 py-2.5 bg-slate-100 font-bold text-slate-600 border-r border-slate-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="98765 43217"
                        value={createFormData.adminMobile}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            adminMobile: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full px-3 py-2.5 bg-transparent font-mono font-bold outline-hidden tracking-wider"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="admin@school.edu"
                    value={createFormData.adminEmail}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, adminEmail: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#0c2461] outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-6 py-3 rounded-2xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Onboarding School...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Confirm &amp; Onboard School</span>
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
