"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatPaiseToRupees, isProductForStudent } from "@/lib/config/constants";
import {
  Search,
  Sparkles,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Check,
  ShieldCheck,
  Shirt,
  X,
  Truck,
  ArrowRight,
  User,
  Ruler,
  ExternalLink,
  ChevronRight,
  Package,
  Layers,
  RotateCcw,
  Sparkle,
} from "lucide-react";
import { ParentHeader, Student } from "@/components/layout/ParentHeader";

interface SchoolProduct {
  id: string;
  color_name: string;
  image_url?: string | null;
  gender: string;
  class_from: string;
  class_to: string;
  product: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    size_chart_text?: string | null;
  };
  variants: {
    id: string;
    price: number;
    stock: number;
    size: {
      id: string;
      size_label: string;
      sort_order: number;
    };
  }[];
}

export default function ParentDiscoverPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [cart, setCart] = useState<any | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Interaction
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState<SchoolProduct | null>(null);
  const [newChildForm, setNewChildForm] = useState({
    name: "",
    class: "1",
    section: "",
    admissionNo: "",
    schoolId: "",
    gender: "boys",
  });
  const [submittingChild, setSubmittingChild] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stuRes, schRes, ordRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/schools"),
        fetch("/api/orders"),
      ]);

      const stuData = await stuRes.json();
      const schData = await schRes.json();
      const ordData = await ordRes.json();
      const schoolList: any[] = schData.success ? schData.schools || [] : [];
      // Arriving from a school's store page (/login?school=CODE → /parent?school=CODE)
      const wantedCode = new URLSearchParams(window.location.search).get("school")?.toUpperCase();
      const wantedSchool = wantedCode ? schoolList.find((sc) => sc.code.toUpperCase() === wantedCode) : null;

      if (schData.success) {
        setSchools(schData.schools || []);
        if (schoolList.length > 0) {
          setNewChildForm((prev) => ({ ...prev, schoolId: (wantedSchool || schoolList[0]).id }));
        }
      }

      if (stuData.success && stuData.students) {
        const studentList = stuData.students || [];
        setStudents(studentList);
        const childAtWanted = wantedSchool ? studentList.find((st: Student) => st.school_id === wantedSchool.id) : null;
        if (childAtWanted) {
          setSelectedStudent(childAtWanted);
        } else if (studentList.length > 0) {
          setSelectedStudent((prev) => prev || studentList[0]);
        }
        if (studentList.length === 0 || (wantedSchool && !childAtWanted)) {
          setShowAddChild(true);
        }
      }

      if (ordData.success && ordData.orders) {
        setRecentOrders(ordData.orders || []);
      }
    } catch (err) {
      console.error("Failed loading parent data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Each child has their own bag
  useEffect(() => {
    if (!selectedStudent) {
      setCart(null);
      setCartCount(0);
      return;
    }
    fetch(`/api/cart?studentId=${selectedStudent.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cart) {
          setCart(data.cart);
          setCartCount((data.cart.items || []).reduce((acc: number, it: any) => acc + it.qty, 0));
        }
      })
      .catch(() => {});
  }, [selectedStudent]);

  const handleAddChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSchoolId = newChildForm.schoolId || (schools.length > 0 ? schools[0].id : "");
    if (!newChildForm.name.trim()) {
      setToastMsg("Please enter child full name");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    setSubmittingChild(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChildForm.name.trim(),
          school_id: effectiveSchoolId,
          schoolId: effectiveSchoolId,
          studentClass: newChildForm.class || "1",
          class: newChildForm.class || "1",
          section: newChildForm.section,
          admission_no: newChildForm.admissionNo.trim(),
          gender: newChildForm.gender || "boys",
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newStu = data.student;
        setStudents((prev) => [newStu, ...prev]);
        setSelectedStudent(newStu);
        setShowAddChild(false);
        setNewChildForm({
          name: "",
          class: "1",
          section: "",
          admissionNo: "",
          schoolId: schools[0]?.id || "",
          gender: "boys",
        });
        setToastMsg(`${newStu.name} added. You can start shopping now.`);
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        setToastMsg(data.error || "Failed to add student profile");
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setToastMsg("Failed to add student profile");
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setSubmittingChild(false);
    }
  };

  const handleAddToCart = async (product: SchoolProduct) => {
    let studentToUse = selectedStudent;
    if (!studentToUse && students.length > 0) {
      studentToUse = students[0];
      setSelectedStudent(students[0]);
    }

    if (!studentToUse) {
      setShowAddChild(true);
      setToastMsg("Please add your child first");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    const sizeId = selectedSizes[product.id] || product.variants.find((v) => v.stock > 0)?.id;
    if (!sizeId) {
      setToastMsg("Please select a size first");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    setAddingToCart(product.id);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: sizeId,
          variantId: sizeId,
          qty: 1,
          student_id: studentToUse.id,
          studentId: studentToUse.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        setCartCount((data.cart?.items || []).reduce((acc: number, it: any) => acc + it.qty, 0));
        setToastMsg(`Added '${product.product.name}' to ${studentToUse.name}'s bag`);
        setTimeout(() => setToastMsg(""), 2500);
      } else {
        setToastMsg(data.error || "Could not add item to bag");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setToastMsg("Failed to add to bag");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  const activeSchool = useMemo(() => {
    if (!selectedStudent) return null;
    return schools.find((s) => s.id === selectedStudent.school_id) || null;
  }, [selectedStudent, schools]);

  // Only the uniform items for this child's class and gender
  const allSchoolProducts: SchoolProduct[] = useMemo(
    () =>
      selectedStudent
        ? ((activeSchool?.schoolProducts || []) as SchoolProduct[]).filter((sp) => isProductForStudent(sp, selectedStudent))
        : [],
    [activeSchool, selectedStudent]
  );

  const filteredProducts = useMemo(() => {
    return allSchoolProducts.filter((sp) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = sp.product.name.toLowerCase().includes(q);
        const matchCat = sp.product.category.toLowerCase().includes(q);
        const matchColor = (sp.color_name || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchColor) return false;
      }

      if (selectedCategory !== "all") {
        const cat = sp.product.category.toLowerCase();
        if (selectedCategory === "shirts" && !cat.includes("shirt") && !cat.includes("top")) return false;
        if (selectedCategory === "pants" && !cat.includes("pant") && !cat.includes("skirt") && !cat.includes("bottom")) return false;
        if (selectedCategory === "blazers" && !cat.includes("blazer") && !cat.includes("formal") && !cat.includes("outerwear")) return false;
        if (selectedCategory === "sports" && !cat.includes("sport") && !cat.includes("pe") && !cat.includes("house")) return false;
        if (selectedCategory === "accessories" && !cat.includes("shoe") && !cat.includes("sock") && !cat.includes("tie") && !cat.includes("accessory")) return false;
      }

      return true;
    });
  }, [allSchoolProducts, searchQuery, selectedCategory]);

  const categories = [
    { id: "all", label: "All Uniforms", count: allSchoolProducts.length },
    {
      id: "shirts",
      label: "Shirts & Tops",
      count: allSchoolProducts.filter((p) => p.product.category.toLowerCase().includes("top") || p.product.category.toLowerCase().includes("shirt")).length,
    },
    {
      id: "pants",
      label: "Bottoms & Skirts",
      count: allSchoolProducts.filter((p) => p.product.category.toLowerCase().includes("bottom") || p.product.category.toLowerCase().includes("skirt")).length,
    },
    {
      id: "blazers",
      label: "Blazers & Formal",
      count: allSchoolProducts.filter((p) => p.product.category.toLowerCase().includes("outerwear") || p.product.name.toLowerCase().includes("blazer")).length,
    },
    {
      id: "sports",
      label: "Sports & PE",
      count: allSchoolProducts.filter((p) => p.product.category.toLowerCase().includes("sport")).length,
    },
    {
      id: "accessories",
      label: "Accessories",
      count: allSchoolProducts.filter((p) => p.product.category.toLowerCase().includes("accessories") || p.product.category.toLowerCase().includes("footwear")).length,
    },
  ];

  const activeOrder = recentOrders.find(
    (o) => o.order_status === "placed" || o.order_status === "confirmed" || o.order_status === "packed" || o.order_status === "out_for_delivery"
  );

  const cartTotalPaise = (cart?.items || []).reduce(
    (sum: number, it: any) => sum + (it.variant?.price || 0) * it.qty,
    0
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-36 md:pb-20">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 px-5 bg-slate-900 text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <ParentHeader
        selectedStudent={selectedStudent}
        students={students}
        onSelectStudent={(st) => setSelectedStudent(st)}
        onAddChild={() => setShowAddChild(true)}
        cartCount={cartCount}
        activeSchoolName={activeSchool?.name}
        activeSchoolCode={activeSchool?.code}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        
        {/* ========================================================================= */}
        {/* ACTIVE ORDER TRACKER (If active order exists)                             */}
        {/* ========================================================================= */}
        {activeOrder && (
          <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Order #{activeOrder.order_no} is <span className="text-emerald-700 font-black capitalize">{activeOrder.order_status.replace(/_/g, " ")}</span>
                </p>
                <p className="text-[11px] text-slate-500">For {activeOrder.student?.name} · tap to track</p>
              </div>
            </div>

            <Link
              href={`/orders/${activeOrder.id}`}
              className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 hover:bg-slate-800 transition-colors"
            >
              Track Live
            </Link>
          </div>
        )}



        {selectedStudent && (selectedStudent as any).verification_status === "rejected" && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
            <p className="font-bold">{activeSchool?.name || "The school"} couldn&apos;t verify {selectedStudent.name}</p>
            <p>{(selectedStudent as any).rejection_reason || "Please contact the school office."}</p>
          </div>
        )}
        {selectedStudent && (selectedStudent as any).verification_status === "pending" && (
          <p className="text-xs text-slate-500 px-1">
            {selectedStudent.name}&apos;s details will be confirmed by the school with your first order.
          </p>
        )}

        {/* ========================================================================= */}
        {/* 4. SEARCH & CATEGORY CHIPS                                                */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, color, or category (e.g. shirt, blazer, skirt)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2461]/20 focus:border-[#0c2461] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. UNIFORM PRODUCTS (2-Col Mobile / 3-Col Tablet / 4-Col Desktop)         */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : !selectedStudent ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xs space-y-3">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">Add your child to start shopping</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              We&apos;ll show the exact uniform list for their school, class and gender.
            </p>
            <button
              type="button"
              onClick={() => setShowAddChild(true)}
              className="px-5 py-3 bg-[#0c2461] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors cursor-pointer"
            >
              Add Child
            </button>
          </div>
        ) : allSchoolProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xs space-y-2">
            <Shirt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">No uniform items listed yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {activeSchool?.name || "The school"} hasn&apos;t added items for Class {selectedStudent.class}
              {selectedStudent.gender && selectedStudent.gender !== "all" ? ` (${selectedStudent.gender})` : ""} yet. Please check back soon.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
            <Shirt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">No matching uniforms</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or choose another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-[#0c2461] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((sp) => {
              const availableVariants = sp.variants || [];
              const minPrice = availableVariants[0]?.price || 50000;
              const selectedSizeId = selectedSizes[sp.id] || availableVariants.find((v) => v.stock > 0)?.id;
              const allSoldOut = availableVariants.every((v) => v.stock <= 0);
              const currentVariant = availableVariants.find((v) => v.id === selectedSizeId) || availableVariants[0];
              const priceDisplay = formatPaiseToRupees(currentVariant?.price || minPrice);
              const isAdding = addingToCart === sp.id;

              return (
                <div
                  key={sp.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Image Area */}
                    <div className="w-full h-64 sm:h-72 bg-[#f7f8fb] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-white/95 text-slate-800 shadow-2xs border border-slate-200 uppercase tracking-wider">
                          {sp.color_name}
                        </span>
                      </div>

                      {/* Uniform Image */}
                      {sp.image_url ? (
                        <img
                          src={sp.image_url}
                          alt={sp.product.name}
                          className="w-full h-full object-contain p-2 sm:p-3 transition-transform group-hover:scale-105 duration-300 drop-shadow-sm"
                        />
                      ) : (
                        <Shirt className="w-20 h-20 text-slate-300 group-hover:text-[#0c2461] transition-colors" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block truncate">
                        {sp.product.category}
                      </span>

                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                        {sp.product.name}
                      </h3>

                      {/* Size Selector */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size</span>
                          <button
                            type="button"
                            onClick={() => setShowSizeGuide(sp)}
                            className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Ruler className="w-3 h-3" />
                            <span>Guide</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pb-1">
                          {availableVariants.map((v) => {
                            const isSizeSelected = selectedSizeId === v.id;
                            const soldOut = v.stock <= 0;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                disabled={soldOut}
                                title={soldOut ? "Out of stock" : undefined}
                                onClick={() =>
                                  setSelectedSizes((prev) => ({ ...prev, [sp.id]: v.id }))
                                }
                                className={`min-w-9 h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                                  isSizeSelected
                                    ? "bg-[#0c2461] text-white shadow-2xs"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                {v.size?.size_label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Price & Button */}
                  <div className="p-4 sm:p-5 pt-3 flex items-center justify-between gap-3 border-t border-slate-100 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Price</span>
                      <span className="font-black text-slate-900 text-base sm:text-lg font-mono">
                        {priceDisplay}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isAdding || allSoldOut}
                      onClick={() => handleAddToCart(sp)}
                      className="px-4 py-2.5 rounded-xl bg-[#0c2461] hover:bg-blue-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-950/20 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{allSoldOut ? "Sold out" : isAdding ? "Adding..." : "Add to bag"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 6. FLOATING BOTTOM CART BAR                                               */}
      {/* ========================================================================= */}
      {cartCount > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-300">
          <Link
            href={selectedStudent ? `/cart?student=${selectedStudent.id}` : "/cart"}
            className="w-full bg-[#0c2461] hover:bg-blue-900 text-white p-3.5 px-5 rounded-full shadow-2xl shadow-blue-950/40 border border-white/20 flex items-center justify-between transition-transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                {cartCount}
              </div>
              <div>
                <p className="text-xs font-black leading-tight">
                  {cartCount} {cartCount === 1 ? "item" : "items"} for {selectedStudent?.name.split(" ")[0]}
                </p>
                <p className="text-[11px] text-blue-200 font-semibold">
                  Total: {formatPaiseToRupees(cartTotalPaise)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <span>View bag</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. QUICK ADD CHILD MODAL                                                  */}
      {/* ========================================================================= */}
      {showAddChild && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0c2461] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Add Enrolled Child</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChildSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Child Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChildForm.name}
                  onChange={(e) => setNewChildForm({ ...newChildForm, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0c2461]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enrolled School <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newChildForm.schoolId || (schools.length > 0 ? schools[0].id : "")}
                  onChange={(e) => setNewChildForm({ ...newChildForm, schoolId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0c2461]"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class / Grade</label>
                  <select
                    value={newChildForm.class}
                    onChange={(e) => setNewChildForm({ ...newChildForm, class: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0c2461]"
                  >
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={newChildForm.section}
                    onChange={(e) => setNewChildForm({ ...newChildForm, section: e.target.value })}
                    placeholder="e.g. A"
                    maxLength={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0c2461]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admission-no" className="block text-xs font-bold text-slate-700 mb-1">
                  Admission / GR number
                </label>
                <input
                  id="admission-no"
                  type="text"
                  required
                  maxLength={30}
                  autoCapitalize="characters"
                  value={newChildForm.admissionNo}
                  onChange={(e) => setNewChildForm({ ...newChildForm, admissionNo: e.target.value })}
                  placeholder="As printed on the school ID card"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-medium uppercase focus:outline-none focus:ring-2 focus:ring-[#0c2461]"
                />
                <p className="text-xs text-slate-500 mt-1">The school uses this to confirm your child before shipping.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uniform Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "boys", label: "Boys" },
                    { id: "girls", label: "Girls" },
                    { id: "all", label: "General / Unisex" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setNewChildForm({ ...newChildForm, gender: g.id })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        newChildForm.gender === g.id
                          ? "bg-[#0c2461] text-white border-[#0c2461] shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChild(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChild}
                  className="px-5 py-2.5 rounded-xl bg-[#0c2461] hover:bg-blue-900 text-white text-xs font-bold shadow-md shadow-blue-950/20 disabled:opacity-50"
                >
                  {submittingChild ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SIZE GUIDE MODAL                                                       */}
      {/* ========================================================================= */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0c2461] flex items-center justify-center">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{showSizeGuide.product.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Official Size Guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">📏 Measurement Guidelines:</p>
                <p className="text-slate-600 leading-relaxed">
                  {showSizeGuide.product.size_chart_text ||
                    "Chest size in inches: 28 (Chest 30 in) | 30 (Chest 32 in) | 32 (Chest 34 in) | 34 (Chest 36 in)"}
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Size</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showSizeGuide.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 font-medium">
                        <td className="p-2.5 font-bold font-mono text-[#0c2461]">{v.size?.size_label}</td>
                        <td className="p-2.5 font-bold">{formatPaiseToRupees(v.price)}</td>
                        <td className="p-2.5 text-emerald-600 font-bold">Available ({v.stock})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400 text-center italic">
                Free 7-day doorstep size replacement included.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSizeGuide(null)}
              className="w-full py-2.5 rounded-xl bg-[#0c2461] text-white text-xs font-bold hover:bg-blue-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
