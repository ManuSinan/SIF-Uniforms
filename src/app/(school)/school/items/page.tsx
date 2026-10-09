"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  Shirt,
  Package,
  Layers,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";

export default function SchoolItemsPage() {
  const [school, setSchool] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // Edit stock/price modal state
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [productContext, setProductContext] = useState<any | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editPriceRupees, setEditPriceRupees] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schools/my-school");
      const data = await res.json();
      if (data.success) {
        setSchool(data.school || null);
      }
    } catch (err) {
      console.error("Error loading school uniforms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (sp: any, v: any) => {
    setProductContext(sp);
    setEditingVariant(v);
    setEditStock(String(v.stock));
    setEditPriceRupees(String(v.price / 100));
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    setSaving(true);
    try {
      const res = await fetch("/api/schools/items/variant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: editingVariant.id,
          stock: editStock,
          price: editPriceRupees,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingVariant(null);
        setToastMsg(`Size ${editingVariant.size.size_label} updated successfully!`);
        await loadCatalog();
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        setEditingVariant(null);
        setToastMsg(data.error || "Couldn't update this size");
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const schoolProducts = school?.schoolProducts || [];

  const filteredProducts = schoolProducts.filter((sp: any) => {
    const matchesSearch =
      sp.product.name.toLowerCase().includes(search.toLowerCase()) ||
      sp.color_name.toLowerCase().includes(search.toLowerCase()) ||
      sp.product.category.toLowerCase().includes(search.toLowerCase());

    const matchesGender =
      genderFilter === "all" || sp.gender === genderFilter || sp.gender === "all";

    const matchesClass =
      classFilter === "all" ||
      (classFilter === "primary" && (Number(sp.class_from) <= 4 || sp.class_from === "1")) ||
      (classFilter === "middle" && (Number(sp.class_from) >= 5 && Number(sp.class_from) <= 7)) ||
      (classFilter === "high" && (Number(sp.class_from) >= 8 || Number(sp.class_to) >= 10));

    return matchesSearch && matchesGender && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Approved School Uniforms</h1>
            {school?.code && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                {school.code}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Assigned uniform sets, sizes, color specifications, and inventory for {school?.name || "this school"}
          </p>
        </div>

        <Button
          onClick={loadCatalog}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Stock</span>
        </Button>
      </div>

      {toastMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-800/80 border-slate-700/60 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search uniforms (e.g. Navy Blue Polo, Pleated Skirt, Blazer)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-blue-500 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Genders</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
            <option value="unisex">Unisex</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-blue-500 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Classes</option>
            <option value="primary">Primary (1 - 4)</option>
            <option value="middle">Middle (5 - 7)</option>
            <option value="high">High School (8 - 12)</option>
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading uniform catalogue...
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800/60 border-slate-700/60 rounded-3xl space-y-3">
          <Shirt className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">No Uniform Items Found</h3>
          <p className="text-xs text-slate-400">
            No items match the selected filter criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((sp: any) => (
            <Card
              key={sp.id}
              className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-3xl space-y-4 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-blue-300">{sp.color_name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-300 border border-slate-600">
                    Class {sp.class_from} - {sp.class_to}
                  </span>
                </div>

                {/* Garment Image & Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {sp.image_url ? (
                      <img
                        src={sp.image_url}
                        alt={sp.product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Shirt className="w-8 h-8 text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm leading-snug">
                      {sp.product.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{sp.product.category}</p>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-800/60 capitalize">
                      {sp.gender === "all" ? "Unisex" : sp.gender}
                    </span>
                  </div>
                </div>

                {/* Size & Stock Matrix */}
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Available Sizes</span>
                    <span>Price & Stock</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {sp.variants.map((v: any) => {
                      const isLow = v.stock > 0 && v.stock < 5;
                      const isOut = v.stock === 0;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] border border-slate-700">
                              Size {v.size.size_label}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                isOut
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : isLow
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {isOut ? "Out of Stock" : `${v.stock} in stock`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">
                              {formatPaiseToRupees(v.price)}
                            </span>
                            {school?.allow_admin_price_stock_edit && (
                            <button
                              onClick={() => handleOpenEdit(sp, v)}
                              aria-label={`Edit size ${v.size.size_label}`}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Update stock or price"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Variant Stock / Price Modal */}
      {editingVariant && productContext && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 text-white p-6 shadow-2xl border-slate-700 space-y-4 rounded-3xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Quick Stock / Price Update
                </span>
                <h3 className="font-bold text-white text-base">
                  {productContext.product.name} (Size {editingVariant.size.size_label})
                </h3>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-slate-400 hover:text-white font-bold text-xl px-2 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  In-Stock Quantity (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-blue-500 outline-hidden font-mono font-bold"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current Reserved: {editingVariant.reserved_stock || 0} units
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Price for School (₹ Rupees)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPriceRupees}
                  onChange={(e) => setEditPriceRupees(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-blue-500 outline-hidden font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVariant(null)}
                  className="w-1/3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {saving ? "Saving Changes..." : "Save Variant"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
