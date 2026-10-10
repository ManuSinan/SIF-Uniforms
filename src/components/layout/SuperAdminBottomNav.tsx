"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  ShoppingCart,
  Shirt,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";

export const SuperAdminBottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/super", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/super/schools", label: "Schools", icon: School },
    { href: "/super/orders", label: "Orders", icon: ShoppingCart },
    { href: "/super/catalogue", label: "Catalog", icon: Shirt },
    { href: "/super/whatsapp-logs", label: "Reports", icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-3 md:hidden pointer-events-none">
      <nav className="max-w-md mx-auto bg-[#061536]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-blue-950/40 rounded-full px-2 py-1.5 flex items-center justify-around pointer-events-auto text-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center min-w-[58px] py-1 px-1.5 rounded-full transition-all",
                isActive
                  ? "bg-white/20 text-white font-bold shadow-xs border border-white/20 scale-105"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span className="text-[9px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
