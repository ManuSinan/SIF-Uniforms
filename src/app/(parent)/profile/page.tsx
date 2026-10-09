"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ParentNavbar } from "@/components/layout/ParentNavbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Phone,
  LogOut,
  MapPin,
  Users,
  Shield,
  ChevronRight,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meRes, addrRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/addresses"),
      ]);
      const meData = await meRes.json();
      const addrData = await addrRes.json();

      if (meData.authenticated && meData.user) {
        setUser(meData.user);
      }
      if (addrData.success) {
        setAddresses(addrData.addresses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ParentNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Your Account</h1>

        {/* User Card */}
        <Card className="p-6 bg-white border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{user?.name || "Parent"}</h2>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                +91 {user?.mobile}
              </p>
              <div className="mt-2">
                <Badge variant="brand" className="capitalize text-[10px]">
                  {user?.role?.replace("_", " ") || "Parent"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Logout
          </Button>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/parent">
            <Card hoverEffect className="p-4 bg-white border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Child Profiles</h3>
                  <p className="text-xs text-slate-500">Manage children & schools</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Card>
          </Link>

          <Link href="/orders">
            <Card hoverEffect className="p-4 bg-white border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Order History</h3>
                  <p className="text-xs text-slate-500">Track packages & receipts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Card>
          </Link>
        </div>

        {/* Saved Addresses */}
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              Saved Delivery Addresses
            </h3>
          </div>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between font-bold text-slate-900 mb-1">
                  <span>{addr.name}</span>
                  <span className="font-mono text-slate-500">{addr.phone}</span>
                </div>
                <p className="text-slate-600">
                  {addr.line1}, {addr.city} - <strong>{addr.pincode}</strong>
                </p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
