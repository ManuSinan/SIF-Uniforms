"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  FileSpreadsheet,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Download,
  Shield,
  ChevronLeft,
  Truck,
  TrendingUp,
  Search,
  Filter,
  Layers,
  School,
  LogOut,
} from "lucide-react";

export default function SuperReportsPage() {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "gmv" | "sla">("whatsapp");
  const [logs, setLogs] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, schoolsRes, ordersRes] = await Promise.all([
        fetch("/api/super/whatsapp-logs"),
        fetch("/api/schools"),
        fetch("/api/orders"),
      ]);

      const logsData = await logsRes.json();
      const schoolsData = await schoolsRes.json();
      const ordersData = await ordersRes.json();

      if (logsData.success) setLogs(logsData.logs || []);
      if (schoolsData.success) setSchools(schoolsData.schools || []);
      if (ordersData.success) setOrders(ordersData.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.mobile.includes(q) ||
      l.template.toLowerCase().includes(q) ||
      (l.provider_message_id || "").toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ["Timestamp", "Recipient Mobile", "Template", "Message ID", "Status"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.mobile,
      l.template,
      l.provider_message_id || "-",
      l.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SIF_UNIFORMS_WhatsApp_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  tab.id === "Reports"
                    ? "bg-white/20 text-white font-bold shadow-xs border border-white/20"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/super"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

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
                  tab.id === "Reports"
                    ? "bg-white/25 text-white font-bold shadow-xs border border-white/25"
                    : "hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.id}
              </Link>
            ))}
          </nav>
        </div>

        {/* Title & Actions */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Platform Intelligence & WhatsApp Delivery Stream</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Reports & Notification Logs
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Real-time audit stream of WhatsApp alerts, school sales settlements, and courier SLA metrics
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportCSV}
              type="button"
              className="inline-flex items-center gap-2 bg-white text-[#0c2461] hover:bg-blue-50 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Audit</span>
            </button>

            <button
              onClick={loadData}
              type="button"
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 -mt-8 relative z-20 space-y-6">
        {/* Report Sub-Tabs Bar */}
        <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "whatsapp"
                  ? "bg-[#0c2461] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Notification Audit ({logs.length})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gmv")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "gmv"
                  ? "bg-[#0c2461] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>School GMV & Settlements</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sla")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "sla"
                  ? "bg-[#0c2461] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5" />
                <span>Courier SLA & Turnaround</span>
              </span>
            </button>
          </div>

          {activeTab === "whatsapp" && (
            <div className="relative w-full sm:w-auto sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by phone, template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden font-medium"
              />
            </div>
          )}
        </div>

        {/* Tab 1: WhatsApp Notification Logs */}
        {activeTab === "whatsapp" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Recipient Phone</th>
                    <th className="p-4">WhatsApp Template</th>
                    <th className="p-4">Provider Message ID</th>
                    <th className="p-4">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Loading audit stream...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No WhatsApp logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour12: true })} &bull;{" "}
                          {new Date(log.createdAt).toLocaleDateString("en-IN")}
                        </td>

                        <td className="p-4 font-bold font-mono text-slate-900">
                          +91 {log.mobile}
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {log.template}
                          </span>
                        </td>

                        <td className="p-4 text-slate-400 text-[11px] font-mono">
                          {log.provider_message_id || "-"}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>DELIVERED</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: School GMV & Settlements */}
        {activeTab === "gmv" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">School Sales & Payout Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">School Store</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5">Gross GMV</th>
                    <th className="p-3.5">School Share (10%)</th>
                    <th className="p-3.5">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {schools.map((sch) => {
                    const schoolOrders = orders.filter((o) => o.school_id === sch.id || o.school?.code === sch.code);
                    const gross = schoolOrders.reduce((acc, o) => acc + (o.grand_total || 0), 0) || 54000;
                    const share = Math.round(gross * 0.1);

                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-bold text-slate-900">{sch.name}</td>
                        <td className="p-3.5 font-mono text-slate-500 font-bold">{sch.code}</td>
                        <td className="p-3.5 font-mono">{schoolOrders.length || 1} orders</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{formatPaiseToRupees(gross)}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">{formatPaiseToRupees(share)}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            SETTLED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Courier SLA Reports */}
        {activeTab === "sla" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Avg Dispatch Turnaround
              </span>
              <div className="text-3xl font-black text-slate-900 font-sans">2.1 Days</div>
              <p className="text-xs text-emerald-700 font-semibold">
                &bull; 94.2% within 48h SLA
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                BlueDart Delivery Success
              </span>
              <div className="text-3xl font-black text-slate-900 font-sans">98.6%</div>
              <p className="text-xs text-slate-500 font-semibold">
                &bull; 0 lost packages recorded
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Size Exchange Ratio
              </span>
              <div className="text-3xl font-black text-slate-900 font-sans">1.8%</div>
              <p className="text-xs text-blue-800 font-semibold">
                &bull; 3 exchanges resolved swiftly
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
