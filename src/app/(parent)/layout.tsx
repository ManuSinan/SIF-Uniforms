import React from "react";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28 md:pb-6">
      {children}
      <BottomNav />
    </div>
  );
}
