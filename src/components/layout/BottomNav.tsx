"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Package, User } from "lucide-react";
import { clsx } from "clsx";

export const BottomNav: React.FC<{ cartCount?: number }> = ({ cartCount: propCartCount }) => {
  const pathname = usePathname();
  const [internalCount, setInternalCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (propCartCount === undefined) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInternalCount(data.totalCount || 0);
        })
        .catch(() => {});
    }
  }, [propCartCount, pathname]);

  // Checkout has its own pay button at the bottom; don't cover it.
  if (pathname.startsWith("/checkout")) return null;

  const cartCount = propCartCount !== undefined ? propCartCount : internalCount;

  const tabs = [
    { href: "/parent", label: "Home", icon: Home, active: pathname === "/parent" },
    { href: "/orders", label: "Orders", icon: Package, active: pathname.startsWith("/orders") },
    { href: "/cart", label: "Bag", icon: ShoppingBag, active: pathname.startsWith("/cart"), badge: cartCount },
    { href: "/profile", label: "Account", icon: User, active: pathname.startsWith("/profile") },
  ];

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 md:hidden pointer-events-none"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Main"
        className="max-w-sm mx-auto bg-white/95 backdrop-blur-xl border border-slate-100/90 shadow-2xl shadow-slate-900/15 rounded-full px-3 py-1.5 flex items-center justify-around pointer-events-auto"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={clsx(
              "flex flex-col items-center justify-center w-16 h-12 rounded-full transition-colors",
              tab.active ? "text-[#0c2461] font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span className="relative">
              <tab.icon className={clsx("w-5 h-5", tab.active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className="text-[11px] mt-0.5 font-medium">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
