"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Package,
  User,
  Bell,
  LogOut,
  ChevronDown,
  Plus,
  Home,
  Check,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export interface Student {
  id: string;
  name: string;
  class: string;
  section?: string | null;
  gender?: string | null;
  school_id?: string;
  school?: {
    id: string;
    name: string;
    code: string;
    primary_color?: string;
  } | null;
}

interface ParentHeaderProps {
  selectedStudent?: Student | null;
  students?: Student[];
  onSelectStudent?: (student: Student) => void;
  onAddChild?: () => void;
  cartCount?: number;
  activeSchoolName?: string;
  activeSchoolCode?: string;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  selectedStudent,
  students = [],
  onSelectStudent,
  onAddChild,
  cartCount: propCartCount,
  activeSchoolName,
  activeSchoolCode,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [internalCartCount, setInternalCartCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{ name: string; mobile?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserProfile(data.user);
        }
      })
      .catch(() => {});

    if (propCartCount === undefined) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInternalCartCount(data.totalCount || 0);
        })
        .catch(() => {});
    }
  }, [propCartCount]);

  const cartCount = propCartCount !== undefined ? propCartCount : internalCartCount;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "/login";
    }
  };

  const navLinks = [
    { id: "Store", label: "Shop", href: "/parent", icon: Home },
    { id: "Orders", label: "Orders", href: "/orders", icon: Package },
    { id: "Cart", label: "Cart", href: "/cart", icon: ShoppingBag, count: cartCount },
    { id: "Profile", label: "Profile", href: "/profile", icon: User },
  ];

  const getActiveTab = () => {
    if (pathname.startsWith("/orders")) return "Orders";
    if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return "Cart";
    if (pathname.startsWith("/profile")) return "Profile";
    return "Store";
  };

  const activeTab = getActiveTab();
  const userInitial = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "P";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand / School Badge with Child Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/parent" className="flex items-center gap-3 shrink-0 group">
              <img src="/images/logo.png" alt="SIF UNIFORMS" className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105" />
              {activeSchoolName && (
                <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">School Store</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                    {activeSchoolName}
                  </span>
                </div>
              )}
            </Link>

            {/* Child Indicator Badge (Dropdown) */}
            {students.length > 0 && (
              <div className="relative ml-0.5 sm:ml-1">
                <button
                  type="button"
                  onClick={() => setShowChildDropdown(!showChildDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold text-slate-800 transition-colors cursor-pointer active:scale-95"
                  title="Switch Child"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0c2461] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {selectedStudent ? selectedStudent.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <span className="truncate max-w-[70px] sm:max-w-[130px] text-left text-[11px] sm:text-xs">
                    {selectedStudent ? selectedStudent.name : "Select Child"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {showChildDropdown && (
                  <div className="absolute left-0 top-11 mt-1 w-64 bg-white text-slate-900 rounded-2xl p-2.5 border border-slate-100 shadow-2xl z-50 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        Enrolled Children ({students.length})
                      </span>
                      {onAddChild && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowChildDropdown(false);
                            onAddChild();
                          }}
                          className="text-[11px] font-bold text-[#0c2461] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {students.map((st) => {
                        const isSelected = selectedStudent?.id === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              if (onSelectStudent) onSelectStudent(st);
                              setShowChildDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-[#0c2461] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {st.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs truncate">{st.name}</p>
                                <p className="text-[10px] text-slate-400">Class {st.class}{st.section ? ` - ${st.section}` : ""}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#0c2461] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200/70 text-xs font-semibold text-slate-600">
            {navLinks.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-4 py-1.5 rounded-full transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#0c2461] font-bold shadow-xs border border-slate-200/60"
                      : "hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {Boolean(tab.count && tab.count > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#0c2461] text-white text-[10px] font-black">
                      {tab.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell (Desktop) */}
            <Link
              href="/orders"
              className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hidden sm:flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors relative shrink-0"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />
            </Link>

            {/* Profile Avatar */}
            <Link
              href="/profile"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0c2461] text-white font-black text-xs flex items-center justify-center shadow-xs transition-transform active:scale-95 shrink-0"
            >
              {userInitial}
            </Link>

            {/* Small Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
