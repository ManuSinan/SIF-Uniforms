"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  FileText,
  Printer,
  Download,
  Package,
  Layers,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shirt,
  Calendar,
} from "lucide-react";

export default function SchoolReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schools/reports");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.itemRequirements) return;

    const headers = ["Item Name", "Color", "Size", "Pending Pack Qty", "Dispatched Qty", "Delivered Qty", "Total Qty"];
    const rows = data.itemRequirements.map((item: any) => [
      `"${item.itemName}"`,
      `"${item.color}"`,
      `"${item.size}"`,
      item.pendingPackQty,
      item.dispatchedQty,
      item.deliveredQty,
      item.totalQty,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SIF_UNIFORMS_Packing_Manifest_${data.school?.code || "SCH"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const school = data?.school;
  const metrics = data?.metrics;
  const classBreakdown = data?.classBreakdown || [];
  const itemRequirements = data?.itemRequirements || [];

  const totalPendingUnits = itemRequirements.reduce((sum: number, it: any) => sum + (it.pendingPackQty || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Packing Manifests & Distribution Reports</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time garment size breakdown, packing requirement sheets, and class-wise distribution for{" "}
            {school?.name || "this school"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <Button
            onClick={loadReports}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3 rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Manifest</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-2xl">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
            Units Pending Packing
          </span>
          <div className="text-3xl font-black text-white font-mono">{totalPendingUnits}</div>
          <span className="text-xs text-slate-400 mt-1 block">Garments awaiting bagging</span>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-2xl">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
            Total Orders Processed
          </span>
          <div className="text-3xl font-black text-white font-mono">{metrics?.totalOrders || 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Across all classes</span>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-2xl">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-2">
            Total Units Ordered
          </span>
          <div className="text-3xl font-black text-white font-mono">{metrics?.totalItemsOrdered || 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Total uniform garments</span>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-2xl">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
            Total School Revenue
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {formatPaiseToRupees(metrics?.totalRevenue || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Paid orders</span>
        </Card>
      </div>

      {/* Printable Manifest Section */}
      <Card className="p-6 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-3xl space-y-5 print:bg-white print:text-slate-900 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-4 print:border-slate-300">
          <div>
            <h2 className="text-lg font-bold text-white print:text-slate-900">
              Garment & Size-Wise Packing Manifest
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Use this checklist at the warehouse / uniform room to assemble order bundles by size
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400 print:text-slate-600">
            Generated: {new Date().toLocaleDateString("en-IN")}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
            Generating packing manifest...
          </div>
        ) : itemRequirements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No item requirements generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700/60 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                <tr>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Color Specification</th>
                  <th className="p-3.5 text-center">Size Label</th>
                  <th className="p-3.5 text-center font-bold text-amber-400 print:text-amber-700">
                    To Pack (Pending)
                  </th>
                  <th className="p-3.5 text-center">Dispatched</th>
                  <th className="p-3.5 text-center">Delivered</th>
                  <th className="p-3.5 text-right">Total Ordered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-200 print:divide-slate-200 print:text-slate-800">
                {itemRequirements.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-3.5 font-bold text-white print:text-slate-900">
                      {item.itemName}
                    </td>
                    <td className="p-3.5 text-slate-400 print:text-slate-600">{item.color}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-blue-400 print:text-blue-700">
                      Size {item.size}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg font-mono font-black text-xs ${
                          item.pendingPackQty > 0
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 print:bg-amber-100 print:text-amber-900"
                            : "text-slate-500"
                        }`}
                      >
                        {item.pendingPackQty}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-purple-300 print:text-purple-800">
                      {item.dispatchedQty}
                    </td>
                    <td className="p-3.5 text-center font-mono text-emerald-400 print:text-emerald-700">
                      {item.deliveredQty}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white print:text-slate-900">
                      {item.totalQty} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Class-wise Distribution Summary */}
      <Card className="p-6 bg-slate-800/80 border-slate-700/60 shadow-xl rounded-3xl space-y-4 print:bg-white print:text-slate-900 print:shadow-none print:border-none print:p-0">
        <div className="border-b border-slate-700/60 pb-3 print:border-slate-300">
          <h2 className="text-lg font-bold text-white print:text-slate-900">
            Class-Wise Uniform Distribution Breakdown
          </h2>
          <p className="text-xs text-slate-400 print:text-slate-600">
            Distribution across classes from primary to senior secondary
          </p>
        </div>

        {classBreakdown.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No class breakdown data available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {classBreakdown.map((cb: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 space-y-1.5 print:bg-slate-50 print:border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white print:text-slate-900">
                    Class {cb.className}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-600/20 text-blue-300 print:bg-blue-100 print:text-blue-800">
                    {cb.orderCount} Orders
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                  <span>Uniform Garments:</span>
                  <strong className="text-slate-200 print:text-slate-800 font-mono">
                    {cb.itemsCount} units
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                  <span>Revenue:</span>
                  <strong className="text-emerald-400 print:text-emerald-700 font-mono">
                    {formatPaiseToRupees(cb.revenue)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
