"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Package,
  Layers,
  Search,
  CheckCircle2,
  Shield,
  ChevronLeft,
  Shirt,
  ShoppingBag,
  Trophy,
  Footprints,
  Plus,
  School,
  Sparkles,
  ExternalLink,
  X,
  RefreshCw,
  Trash2,
  LogOut,
} from "lucide-react";

export default function SuperCataloguePage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Modal State for Adding New Catalog Item
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    schoolId: "",
    productName: "",
    category: "Tops",
    colorName: "",
    description: "",
    sizeChartText: "",
    gender: "all",
    classFrom: "1",
    classTo: "10",
    variants: [
      { sizeLabel: "28", price: 480, stock: 50 },
      { sizeLabel: "30", price: 520, stock: 50 },
      { sizeLabel: "32", price: 550, stock: 50 },
      { sizeLabel: "34", price: 580, stock: 50 },
    ],
  });

  const [coverage, setCoverage] = useState<any[]>([]);
  const [showCoverage, setShowCoverage] = useState(false);

  const fetchCoverage = async () => {
    try {
      const res = await fetch("/api/super/catalogue");
      const data = await res.json();
      if (data.success) setCoverage(data.coverage || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchCoverage();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schools");
      const data = await res.json();
      if (data.success) {
        setSchools(data.schools || []);
        if (data.schools?.length > 0 && !formData.schoolId) {
          setFormData((prev) => ({ ...prev, schoolId: data.schools[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSizeVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { sizeLabel: "", price: 500, stock: 40 }],
    });
  };

  const handleRemoveSizeVariant = (index: number) => {
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...formData.variants];
    (updated[index] as any)[field] = value;
    setFormData({ ...formData, variants: updated });
  };

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      if (!formData.schoolId) {
        throw new Error("Please select a partner school.");
      }

      const res = await fetch("/api/super/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add catalog item.");
      }

      setToastMsg(`Uniform item '${formData.productName}' added to school catalog!`);
      setShowModal(false);
      fetchCoverage();
      setFormData({
        schoolId: schools[0]?.id || "",
        productName: "",
        category: "Tops",
        colorName: "",
        description: "",
        sizeChartText: "",
        gender: "all",
        classFrom: "1",
        classTo: "10",
        variants: [
          { sizeLabel: "28", price: 480, stock: 50 },
          { sizeLabel: "30", price: 520, stock: 50 },
          { sizeLabel: "32", price: 550, stock: 50 },
          { sizeLabel: "34", price: 580, stock: 50 },
        ],
      });

      await fetchSchools();
      setTimeout(() => setToastMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add catalog item.");
    } finally {
      setSubmitting(false);
    }
  };

  // Flatten all school products with school context
  const allSchoolProducts = schools.flatMap((sch) =>
    (sch.schoolProducts || []).map((sp: any) => ({
      ...sp,
      school: sch,
    }))
  );

  const filteredProducts = allSchoolProducts.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.product.name.toLowerCase().includes(q) ||
      item.color_name.toLowerCase().includes(q) ||
      item.school.name.toLowerCase().includes(q) ||
      item.school.code.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "all" ||
      item.product.category.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesSchool =
      schoolFilter === "all" || item.school.code === schoolFilter;

    return matchesSearch && matchesCategory && matchesSchool;
  });

  const totalCatalogItems = allSchoolProducts.length;

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
                  tab.id === "Catalog"
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
              <span className="hidden sm:inline">Add Catalog Item</span>
              <span className="sm:hidden">Add Item</span>
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
                  tab.id === "Catalog"
                    ? "bg-white/25 text-white font-bold shadow-xs border border-white/25"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>
        </div>

        {/* Title & Stats Badges */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Master Uniform Apparel Database</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Uniform Catalog & Allocations
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Add new apparel products, customize size matrices, set school prices, and allocate sets to stores
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Total Items</span>
              <span className="text-2xl font-black text-white font-mono">{totalCatalogItems}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-xs font-semibold text-blue-200/80 block">Schools</span>
              <span className="text-2xl font-black text-white font-mono">{schools.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-6">
        {coverage.some((c) => c.gaps.length > 0 || c.empty) && (
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Catalogue gaps</h3>
                <p className="text-sm text-slate-500">
                  Some children would find no shirt or no bottom (shorts/skirt/trousers) for their class. Add the missing items below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverage(!showCoverage)}
                className="px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              >
                {showCoverage ? "Hide details" : "Show details"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {coverage
                .filter((c) => c.gaps.length > 0 || c.empty)
                .map((c) => (
                  <span key={c.school_id} className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                    {c.code}: {c.empty ? "no items" : `${c.gaps.length} gaps`}
                  </span>
                ))}
            </div>
            {showCoverage && (
              <div className="space-y-3 pt-1">
                {coverage
                  .filter((c) => c.gaps.length > 0)
                  .map((c) => {
                    // Group "Class 1–7 girls: bottom" style lines
                    const lines: Record<string, string[]> = {};
                    for (const g of c.gaps) {
                      const key = `${g.gender} · missing ${g.missing.join(" & ")}`;
                      (lines[key] = lines[key] || []).push(g.class);
                    }
                    return (
                      <div key={c.school_id} className="text-sm">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <ul className="text-slate-600 list-disc pl-5">
                          {Object.entries(lines).map(([k, classes]) => (
                            <li key={k}>
                              <span className="capitalize">{k}</span>: Class {classes.join(", ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        {toastMsg && (
          <div className="p-4 bg-emerald-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by apparel name, color, or school code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0c2461] focus:ring-2 focus:ring-blue-100 outline-hidden font-medium transition-all"
            />
          </div>

          {/* Category & School Filter Selectors + Add Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-[#0c2461] outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">All Categories</option>
              <option value="Tops">Tops & Shirts</option>
              <option value="Bottoms">Bottoms & Skirts</option>
              <option value="Outerwear">Blazers & Outerwear</option>
              <option value="Sports">Sports & PE House</option>
              <option value="Accessories">Ties & Accessories</option>
              <option value="Footwear">Shoes & Socks</option>
            </select>

            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-[#0c2461] outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0c2461] hover:bg-blue-900 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Catalog Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">No matching catalog items</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try changing the search keywords or add a new uniform item to this school.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#0c2461] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors cursor-pointer"
            >
              + Add Catalog Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((item) => {
              const minPrice = Math.min(...(item.variants || []).map((v: any) => v.price));
              const maxPrice = Math.max(...(item.variants || []).map((v: any) => v.price));
              const priceDisplay =
                minPrice === maxPrice
                  ? formatPaiseToRupees(minPrice)
                  : `${formatPaiseToRupees(minPrice)} - ${formatPaiseToRupees(maxPrice)}`;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-5"
                >
                  {/* Top Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0"
                          style={{ backgroundColor: item.school.primary_color }}
                        >
                          {item.school.code}
                        </div>
                        <span className="font-bold text-xs text-slate-600 truncate">
                          {item.school.name}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                        Class {item.class_from}-{item.class_to}
                      </span>
                    </div>

                    {/* Garment Image Box */}
                    <div className="w-full h-44 rounded-2xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100 overflow-hidden relative group/img">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product.name}
                          className="h-full w-auto object-contain transition-transform group-hover/img:scale-105 duration-300 drop-shadow-xs"
                        />
                      ) : (
                        <Shirt className="w-12 h-12 text-slate-300" />
                      )}
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-slate-700 shadow-2xs border border-slate-200">
                        {item.color_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                        {item.product.category}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#0c2461] transition-colors mt-0.5">
                        {item.product.name}
                      </h3>
                      {item.product.description && (
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                          {item.product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-700">Color:</span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {item.color_name}
                      </span>
                    </div>

                    {/* Sizes Matrix with Prices */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Available Sizes ({item.variants?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.variants || []).map((v: any) => (
                          <div
                            key={v.id}
                            className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                            title={`Stock: ${v.stock} units`}
                          >
                            <span>{v.size?.size_label}</span>
                            <span className="text-slate-400 font-normal ml-1">({formatPaiseToRupees(v.price)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Pricing</span>
                      <span className="font-extrabold text-slate-900 text-sm font-sans">{priceDisplay}</span>
                    </div>

                    <Link
                      href={`/s/${item.school.code.toLowerCase()}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0c2461] hover:text-blue-700 transition-colors"
                    >
                      <span>Store View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* ADD CATALOG ITEM MODAL                                                 */}
      {/* ======================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#1e40af] uppercase tracking-wider block">
                  Catalog Management
                </span>
                <h2 className="font-black text-slate-900 text-xl">Add Uniform Apparel Item</h2>
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

            <form onSubmit={handleCreateCatalogItem} className="space-y-5 text-xs">
              {/* Target School */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target School *</label>
                <select
                  required
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-bold"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apparel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford Full Sleeve Shirt"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-bold"
                  >
                    <option value="Tops">Tops & Shirts</option>
                    <option value="Bottoms">Bottoms & Skirts</option>
                    <option value="Outerwear">Blazers & Sweaters</option>
                    <option value="Sports">Sports PE Kits</option>
                    <option value="Accessories">Ties, Belts & Badges</option>
                    <option value="Footwear">Shoes & Socks</option>
                  </select>
                </div>
              </div>

              {/* Color & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Color / Fabric *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sky Blue Pin-Stripe"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden font-semibold"
                  >
                    <option value="all">All Genders</option>
                    <option value="boys">Boys Only</option>
                    <option value="girls">Girls Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classes (From &rarr; To)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="1"
                      value={formData.classFrom}
                      onChange={(e) => setFormData({ ...formData, classFrom: e.target.value })}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold"
                    />
                    <span className="text-slate-400 font-bold">&rarr;</span>
                    <input
                      type="text"
                      placeholder="10"
                      value={formData.classTo}
                      onChange={(e) => setFormData({ ...formData, classTo: e.target.value })}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Fabric Details</label>
                <input
                  type="text"
                  placeholder="e.g. 60/40 Poly-cotton blend with reinforced collar and twin button cuffs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2461] outline-hidden"
                />
              </div>

              {/* Size Matrix & Pricing */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-900 text-sm">
                    Size Matrix & Unit Pricing
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSizeVariant}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0c2461] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Size Label</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 30"
                          value={v.sizeLabel}
                          onChange={(e) => handleVariantChange(i, "sizeLabel", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-center"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Price (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="550"
                          value={v.price}
                          onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-center"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Stock Units</label>
                        <input
                          type="number"
                          required
                          placeholder="50"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-center"
                        />
                      </div>

                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeVariant(i)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg self-end mb-1 cursor-pointer"
                          title="Remove size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
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
                      <span>Allocating Uniform...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save & Allocate to School</span>
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
