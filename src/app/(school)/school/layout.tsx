"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [school, setSchool] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          if (data.user?.school) {
            setSchool(data.user.school);
          }
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      <AdminSidebar
        role="school_admin"
        schoolName={school?.name || user?.school?.name || "School Portal"}
        schoolLogo={school?.logo_url}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 min-h-screen">
        <AdminHeader
          title={school?.name ? `${school.name}` : "School Operations Hub"}
          userName={user?.name || "School Admin"}
          schoolCode={school?.code || user?.school?.code}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-16">{children}</main>
      </div>
    </div>
  );
}
