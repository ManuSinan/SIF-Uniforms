"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Upload,
  Shirt,
  ShoppingBag,
  Trophy,
  Footprints,
  School,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  LogOut,
  Truck,
  Check,
  Package,
  ExternalLink,
} from "lucide-react";
import { formatPaiseToRupees } from "@/lib/config/constants";

export default function SuperDashboardPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [stats, setStats] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetch(`/api/super/stats?year=${year}`)
      .then((res) => res.json())
      .then((data) => setStats(data.success ? data.stats : null))
      .catch(() => setStats(null));
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, schRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/schools"),
      ]);
      const [ordData, schData] = await Promise.all([ordRes.json(), schRes.json()]);

      if (ordData.success) setOrders(ordData.orders || []);
      if (schData.success) setSchools(schData.schools || []);
    } catch (err) {
      console.error("Error loading super admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Metrics computation
  const totalRevenuePaise = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.grand_total, 0);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.order_status === "delivered").length;
  const inProgressOrders = orders.filter((o) =>
    ["placed", "confirmed", "packed", "out_for_delivery"].includes(o.order_status)
  ).length;

  const fulfillmentRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  // Category breakdowns (computed dynamically or baseline values)
  const paidItems = orders.filter((o) => o.payment_status === "paid").flatMap((o) => o.items || []);
  const categoryTotals = {
    dailyUniforms: paidItems
      .filter((it: any) => it.item_name?.toLowerCase().includes("shirt") || it.item_name?.toLowerCase().includes("pant") || it.item_name?.toLowerCase().includes("short") || it.item_name?.toLowerCase().includes("skirt"))
      .reduce((sum: number, it: any) => sum + (it.unit_price * it.qty), 0),
    blazers: paidItems
      .filter((it: any) => it.item_name?.toLowerCase().includes("blazer") || it.item_name?.toLowerCase().includes("coat") || it.item_name?.toLowerCase().includes("vest"))
      .reduce((sum: number, it: any) => sum + (it.unit_price * it.qty), 0),
    sports: paidItems
      .filter((it: any) => it.item_name?.toLowerCase().includes("sports") || it.item_name?.toLowerCase().includes("track") || it.item_name?.toLowerCase().includes("jersey"))
      .reduce((sum: number, it: any) => sum + (it.unit_price * it.qty), 0),
    accessories: paidItems
      .filter((it: any) => it.item_name?.toLowerCase().includes("shoe") || it.item_name?.toLowerCase().includes("tie") || it.item_name?.toLowerCase().includes("belt") || it.item_name?.toLowerCase().includes("badge") || it.item_name?.toLowerCase().includes("socks"))
      .reduce((sum: number, it: any) => sum + (it.unit_price * it.qty), 0),
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue: number[] = stats?.monthlyRevenue || Array(12).fill(0);
  const monthlyOrders: number[] = stats?.monthlyOrders || Array(12).fill(0);
  const yearRevenue = monthlyRevenue.reduce((sum, v) => sum + v, 0);
  const maxMonth = Math.max(...monthlyRevenue, 0);
  const peakMonthIdx = maxMonth > 0 ? monthlyRevenue.indexOf(maxMonth) : -1;
  const fulfilment = stats?.fulfilment;
  const formatHours = (h: number | null | undefined) =>
    h === null || h === undefined ? "—" : h < 48 ? `${h} hrs` : `${Math.round((h / 24) * 10) / 10} days`;

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ========================================================================= */}
      {/* TOP GLOWING ROYAL BLUE HERO SECTION                                       */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-br from-[#061536] via-[#0c2461] to-[#1e40af] text-white pt-6 pb-24 px-4 sm:px-8 lg:px-12 overflow-hidden shadow-xl shadow-blue-950/20">
        {/* Glowing radial light overlays for depth */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Navbar */}
        <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between gap-4 pb-6 sm:pb-10">
          {/* Brand Logo */}
          <Link href="/super" className="flex items-center group">
            <img src="/images/logo-white.png" alt="SIF UNIFORMS" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>

          {/* Centered Navigation Pills (Desktop) */}
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
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white font-bold shadow-xs border border-white/20"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link href="/super/whatsapp-logs">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all cursor-pointer shadow-sm relative"
                title="WhatsApp Logs & Alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </Link>

            <div className="w-10 h-10 rounded-full bg-[#0a183d] border border-white/20 text-white font-black text-xs flex items-center justify-center shadow-md">
              SA
            </div>

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
        <div className="md:hidden relative z-10 -mt-2 pb-6">
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
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white/25 text-white font-bold shadow-xs border border-white/25"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>
        </div>

        {/* Hero Banner Content & 3D Glass Stack */}
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-4">
          {/* Left Text & CTA Buttons */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs sm:text-sm font-medium text-blue-100/80 tracking-wide">
              Centralized uniform store management, school inventory & doorstep dispatch control
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              SIF UNIFORMS Platform Hub
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link href="/super/schools">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-white text-[#0c2461] hover:bg-blue-50 px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-black/10 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard New School</span>
                </button>
              </Link>

              <Link href="/super/orders">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 px-6 py-3 rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Fulfillment Pipeline</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Hero Layered Glassmorphic Card Stack */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-3 left-6 right-6 h-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl shadow-sm" />
              <div className="absolute -top-1.5 left-3 right-3 h-10 bg-white/15 backdrop-blur-md border border-white/20 rounded-3xl shadow-md" />

              {/* Main Front Glass Card */}
              <div className="relative bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-blue-950/40">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-blue-100/90 tracking-wider">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                    <span className="font-mono text-sm whitespace-nowrap">{schools.length} Partner Schools</span>
                    <span>&bull;</span>
                    <span className="whitespace-nowrap">Active Cycle</span>
                  </div>
                  <div className="font-black text-sm tracking-tight text-white whitespace-nowrap shrink-0">SIF GMV</div>
                </div>

                {/* Amount */}
                <div className="my-6">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline">
                    <span>{formatPaiseToRupees(totalRevenuePaise)}</span>
                  </div>
                </div>

                {/* Bottom Trend Badge */}
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{totalOrders} uniform orders processed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CARDS CONTENT CANVAS (Overlapping Top Banner)                        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-10 relative z-20 space-y-6">
        {/* ======================================================================= */}
        {/* ROW 1: Wide Histogram Chart (Left) + 2x2 Category Cards (Right)         */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Overview Multi-Bar Histogram Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
            {/* Header with Title and Dropdowns */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Uniform Demand & Seasonal Volume
                </h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-sans">
                    {formatPaiseToRupees(yearRevenue)}
                  </span>
                  <span className="text-slate-500 text-xs font-medium ml-2">Paid in {year}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center">
                  <span className="sr-only">Year</span>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="appearance-none bg-slate-50 border border-slate-100 pl-3.5 pr-7 py-1.5 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
                </label>

                <Link
                  href="/super/orders"
                  className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  title="View Orders"
                >
                  <Upload className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Monthly paid revenue chart */}
            <div className="relative pt-8 pb-2">
              {!stats ? (
                <div className="h-40 rounded-2xl bg-slate-50 animate-pulse" />
              ) : maxMonth === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-slate-500 bg-slate-50 rounded-2xl">
                  No paid orders in {year} yet
                </div>
              ) : (
                <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-40 px-1" role="img" aria-label={`Monthly paid revenue for ${year}`}>
                  {monthlyRevenue.map((value, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <span className="absolute -top-6 whitespace-nowrap text-[10px] font-bold text-slate-900 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatPaiseToRupees(value)} · {monthlyOrders[i]} {monthlyOrders[i] === 1 ? "order" : "orders"}
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          i === peakMonthIdx ? "bg-[#0c2461]" : value > 0 ? "bg-blue-300 hover:bg-blue-400" : "bg-slate-100"
                        }`}
                        style={{ height: value > 0 ? `${Math.max((value / maxMonth) * 100, 4)}%` : "4px" }}
                        title={`${months[i]}: ${formatPaiseToRupees(value)}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Month Labels Axis */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-50 mt-1 px-1">
                {months.map((m) => (
                  <span key={m} className="flex-1 text-center">
                    {m.charAt(0)}
                    <span className="hidden sm:inline">{m.slice(1)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 2x2 Category Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Regular Uniforms */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm">Regular Uniforms</h3>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                  <Shirt className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <div className="flex items-baseline font-sans">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatPaiseToRupees(categoryTotals.dailyUniforms)}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                <span>Shirts, Shorts & Skirts</span>
              </div>
            </div>

            {/* Card 2: Blazers & Formal */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm">Blazers & Formal</h3>
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <div className="flex items-baseline font-sans">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatPaiseToRupees(categoryTotals.blazers)}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700">
                <span>Formal House Wear</span>
              </div>
            </div>

            {/* Card 3: Sports PE Kits */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm">Sports & PE Kits</h3>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <div className="flex items-baseline font-sans">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatPaiseToRupees(categoryTotals.sports)}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span>Trackpants & Jerseys</span>
              </div>
            </div>

            {/* Card 4: Shoes & Accessories */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm">Shoes & Badges</h3>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Footprints className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <div className="flex items-baseline font-sans">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatPaiseToRupees(categoryTotals.accessories)}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span>Ties, Belts & Crests</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* ROW 2: Recent School Orders (Left) + Fulfillment Health (Right)          */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent School Orders List */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Live Uniform Orders</h3>
                <p className="text-xs text-slate-400">Recent student orders across partner schools</p>
              </div>
              <Link
                href="/super/orders"
                className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                View All ({orders.length}) <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No orders recorded yet.</div>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#0c2461] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        {ord.school?.code || "SF"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{ord.student?.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500 block">#{ord.order_no}</span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {ord.school?.name} &bull; Class {ord.student?.class}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-6 shrink-0">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          ord.order_status === "delivered"
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : ord.order_status === "packed"
                            ? "text-blue-700 bg-blue-50 border border-blue-200"
                            : "text-amber-700 bg-amber-50 border border-amber-200"
                        }`}
                      >
                        {ord.order_status.replace(/_/g, " ")}
                      </div>

                      <span className="font-bold text-slate-900 text-sm font-sans font-mono">
                        {formatPaiseToRupees(ord.grand_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Fulfillment & Dispatch SLA */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-lg">Fulfillment Health</h3>
                <Link
                  href="/super/whatsapp-logs"
                  className="text-xs font-bold text-slate-400 hover:text-[#0c2461] transition-colors"
                >
                  Logs
                </Link>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">On-time delivery and average turnaround ({year})</p>
            </div>

            <div>
              <div className="flex items-baseline gap-1 font-sans">
                <span className="text-3xl font-black text-slate-950 tracking-tight">
                  {fulfilment?.onTimePct ?? "—"}
                  {fulfilment?.onTimePct !== null && fulfilment?.onTimePct !== undefined ? "%" : ""}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-2">
                  {fulfilment?.deliveredSamples
                    ? `delivered within ${fulfilment.onTimeDays} days (${fulfilment.deliveredSamples} orders)`
                    : "No deliveries yet"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-3">
                <div className="space-y-1 min-w-0">
                  <div className="h-1.5 bg-[#0c2461] rounded-full w-full" />
                  <span className="text-[10px] text-slate-500 font-medium block">Packing</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">{formatHours(fulfilment?.avgPackingHours)}</span>
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="h-1.5 bg-blue-600 rounded-full w-full" />
                  <span className="text-[10px] text-slate-500 font-medium block">To dispatch</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">{formatHours(fulfilment?.avgDispatchHours)}</span>
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="h-1.5 bg-emerald-500 rounded-full w-full" />
                  <span className="text-[10px] text-slate-500 font-medium block">Order → door</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {fulfilment?.avgDeliveryDays === null || fulfilment?.avgDeliveryDays === undefined
                      ? "—"
                      : `${fulfilment.avgDeliveryDays} days`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">Orders delivered</span>
                <span className="font-bold text-slate-800 font-mono">
                  {deliveredOrders} / {totalOrders}
                  {totalOrders > 0 ? ` (${fulfillmentRate}%)` : ""}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-bold uppercase">WhatsApp (30 days)</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {stats?.whatsapp?.sentPct30d === null || stats?.whatsapp?.sentPct30d === undefined
                    ? "No messages"
                    : `${stats.whatsapp.sentPct30d}% sent`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
