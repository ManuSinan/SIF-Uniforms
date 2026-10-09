"use client";

import React from "react";
import { SuperAdminBottomNav } from "@/components/layout/SuperAdminBottomNav";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 antialiased pb-20 md:pb-0">
      <main className="min-w-0">{children}</main>
      <SuperAdminBottomNav />
    </div>
  );
}
