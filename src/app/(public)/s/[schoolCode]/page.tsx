import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPaiseToRupees } from "@/lib/config/constants";
import {
  MapPin,
  Phone,
  Truck,
  ShieldCheck,
  ArrowRight,
  Shirt,
  Info,
  ChevronLeft,
} from "lucide-react";
import prisma from "@/lib/db/prisma";
import { SchoolAvatar } from "@/components/common/SchoolAvatar";

interface PageProps {
  params: Promise<{ schoolCode: string }>;
}

export default async function SchoolStorePage({ params }: PageProps) {
  const resolvedParams = await params;
  const schoolCode = resolvedParams.schoolCode.toLowerCase();

  const dbSchool = await prisma.school.findFirst({
    where: { code: schoolCode.toUpperCase(), is_active: true },
    include: {
      schoolProducts: {
        where: { is_active: true },
        include: {
          product: { include: { sizes: true } },
          variants: { include: { size: true } },
        },
      },
    },
  });

  if (!dbSchool) {
    notFound();
  }

  let resolvedLogo = dbSchool.logo_url;
  if (resolvedLogo && resolvedLogo.includes("/images/schools/") && resolvedLogo.endsWith(".jpg")) {
    resolvedLogo = resolvedLogo.replace(/\.jpg$/, ".svg");
  }
  if (!resolvedLogo) {
    resolvedLogo = `/images/schools/${dbSchool.code.toLowerCase()}-logo.svg`;
  }

  const schoolData = {
    name: dbSchool.name,
    code: dbSchool.code,
    logo_url: resolvedLogo,
    primary_color: dbSchool.primary_color,
    secondary_color: dbSchool.secondary_color,
    delivery_charge: dbSchool.delivery_charge,
    free_delivery_above: dbSchool.free_delivery_above,
    address: dbSchool.address,
    contact_phone: dbSchool.contact_phone,
    products: dbSchool.schoolProducts.map((sp) => ({
      id: sp.id,
      name: sp.product.name,
      category: sp.product.category,
      description: sp.product.description,
      color: sp.color_name,
      image_url: sp.image_url,
      gender: sp.gender,
      class_from: sp.class_from,
      class_to: sp.class_to,
      price: sp.variants[0]?.price || 50000,
      sizes: sp.variants.map((v) => v.size.size_label),
    })),
  };

  return (
    <ThemeProvider primaryColor={schoolData.primary_color} secondaryColor={schoolData.secondary_color}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* School Branded Header */}
        <header
          className="text-white shadow-md transition-colors"
          style={{ backgroundColor: schoolData.primary_color }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SchoolAvatar school={schoolData} className="w-16 h-16" />

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-90 px-2 py-0.5 rounded-full bg-white/20">
                      Official Uniform Store
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-900 font-mono">
                      {schoolData.code}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{schoolData.name}</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    All Schools
                  </Button>
                </Link>
                <Link href={`/login?school=${schoolData.code}`}>
                  <Button className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-sm">
                    Parent Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Delivery & School Info Strip */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-900" />
              <span>
                Home Delivery: <strong className="text-slate-900 font-mono">{formatPaiseToRupees(schoolData.delivery_charge)}</strong>
                {schoolData.free_delivery_above && (
                  <span className="ml-1 text-emerald-700 font-semibold">
                    (Free above {formatPaiseToRupees(schoolData.free_delivery_above)})
                  </span>
                )}
              </span>
            </div>

            {schoolData.contact_phone && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Help: {schoolData.contact_phone}</span>
              </div>
            )}

            {schoolData.address && (
              <div className="flex items-center gap-1.5 text-slate-500 max-w-sm truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{schoolData.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Catalogue Area */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Official School Uniform Sets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic colors and certified fabrics strictly aligned with school regulations
              </p>
            </div>

            <Link href={`/login?school=${schoolData.code}`}>
              <Button className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs">
                Log In with WhatsApp to Order
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolData.products.map((item) => (
              <Card
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Real Uniform Image */}
                  <div className="w-full h-56 bg-slate-50 relative flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <Shirt className="w-16 h-16 text-slate-300" />
                    )}

                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/95 text-slate-800 shadow-2xs border border-slate-200/80">
                        {item.color}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-white shadow-2xs">
                        Class {item.class_from}-{item.class_to}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold capitalize mb-0.5">
                        {item.category} &bull; {item.gender === "all" ? "Unisex" : item.gender}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Size Options */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Available Sizes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.sizes.map((sz) => (
                          <span
                            key={sz}
                            className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-md font-semibold"
                          >
                            Size {sz}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Starting at</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatPaiseToRupees(item.price)}
                      </span>
                    </div>

                    <Link href={`/login?school=${schoolData.code}`}>
                      <Button size="sm" className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs">
                        Select & Order
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
