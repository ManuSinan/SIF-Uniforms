"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  Users,
  Package,
  ShoppingCart,
  RotateCcw,
  FileText,
  ShieldAlert,
  MessageSquare,
  LogOut,
  Shirt,
  GraduationCap,
  X,
} from "lucide-react";
import { clsx } from "clsx";

interface AdminSidebarProps {
  role: "super_admin" | "school_admin";
  schoolName?: string;
  schoolLogo?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  role,
  schoolName,
  schoolLogo,
  isOpen = true,
  onClose,
}) => {
  const pathname = usePathname();

  const superLinks = [
    { href: "/super", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super/schools", label: "Schools", icon: School },
    { href: "/super/admins", label: "School Admins", icon: Users },
    { href: "/super/catalogue", label: "Master Catalogue", icon: Package },
    { href: "/super/orders", label: "All Orders", icon: ShoppingCart },
    { href: "/super/change-requests", label: "Change Requests", icon: MessageSquare },
    { href: "/super/refunds", label: "Refunds", icon: RotateCcw },
    { href: "/super/reports", label: "Reports & Exports", icon: FileText },
    { href: "/super/audit-logs", label: "Audit Logs", icon: ShieldAlert },
    { href: "/super/whatsapp-logs", label: "WhatsApp Logs", icon: MessageSquare },
  ];

  const schoolLinks = [
    { href: "/school", label: "Dashboard", icon: LayoutDashboard },
    { href: "/school/items", label: "Uniform Items", icon: Shirt },
    { href: "/school/orders", label: "Orders", icon: ShoppingCart },
    { href: "/school/change-requests", label: "Change Requests", icon: MessageSquare },
    { href: "/school/reports", label: "Packing Reports", icon: FileText },
  ];

  const links = role === "super_admin" ? superLinks : schoolLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0 border-r border-slate-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/images/logo-white.png" alt="SIF UNIFORMS" className="h-8 w-auto object-contain" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 capitalize leading-tight">
                {role === "super_admin" ? "Platform Control" : "Staff Operations"}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/super" && item.href !== "/school" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
