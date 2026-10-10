"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Truck,
  ShieldCheck,
  ArrowRight,
  Package,
  ShoppingCart,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  X,
  School as SchoolIcon,
  MapPin,
} from "lucide-react";

// Pre-defined list of featured schools matching reference mockup
const FEATURED_SCHOOLS = [
  {
    code: "SXHS",
    name: "St. Xavier's High School",
    fullName: "St. Xavier's High School",
    address: "Church Street, Richmond Town, Bengaluru",
    city: "Bengaluru",
    productsCount: "24 Products",
    primaryColor: "#1e3a8a",
    logoText: "S",
    logoImage: null,
    itemsPreview: [
      { name: "Sky Blue Shirt", img: "/images/uniforms/sky-blue-shirt.jpg" },
      { name: "Navy Tie", img: "/images/uniforms/navy-tie.jpg" },
      { name: "Navy Shorts", img: "/images/uniforms/navy-shorts.jpg" },
    ],
  },
  {
    code: "GWIS",
    name: "Greenwood International School",
    fullName: "Greenwood International School",
    address: "Varthur Sarjapur Road, Gunjur, Bengaluru",
    city: "Bengaluru",
    productsCount: "18 Products",
    primaryColor: "#065f46",
    logoText: "G",
    logoImage: null,
    itemsPreview: [
      { name: "Formal Vest", img: "/images/uniforms/green-shirt.jpg" },
      { name: "Navy Shorts", img: "/images/uniforms/navy-shorts.jpg" },
    ],
  },
  {
    code: "MES",
    name: "MES Higher Secondary School",
    fullName: "MES Higher Secondary School",
    address: "15th Cross, Malleshwaram, Bengaluru",
    city: "Bengaluru",
    productsCount: "31 Products",
    primaryColor: "#0f766e",
    logoText: "M",
    logoImage: null,
    itemsPreview: [
      { name: "Green Shirt", img: "/images/uniforms/green-shirt.jpg" },
      { name: "Green Skirt", img: "/images/uniforms/green-skirt.jpg" },
    ],
  },
  {
    code: "JDT",
    name: "JDT Iqraa English School",
    fullName: "JDT Iqraa English School",
    address: "Calicut Bypass Road, Kozhikode, Kerala",
    city: "Kozhikode",
    productsCount: "22 Products",
    primaryColor: "#991b1b",
    logoText: "J",
    logoImage: null,
    itemsPreview: [
      { name: "Beige Shirt", img: "/images/uniforms/sky-blue-shirt.jpg" },
      { name: "Brown Skirt", img: "/images/uniforms/green-skirt.jpg" },
    ],
  },
  {
    code: "MR",
    name: "Markaz Residential School",
    fullName: "Markaz Residential School",
    address: "Karanthur, Kozhikode, Kerala",
    city: "Kozhikode",
    productsCount: "28 Products",
    primaryColor: "#1e293b",
    logoText: "M",
    logoImage: null,
    itemsPreview: [
      { name: "White Shirt", img: "/images/uniforms/sky-blue-shirt.jpg" },
      { name: "Navy Tie", img: "/images/uniforms/navy-tie.jpg" },
      { name: "Navy Shorts", img: "/images/uniforms/navy-shorts.jpg" },
    ],
  },
  {
    code: "KMO",
    name: "KMO Higher Secondary School",
    fullName: "KMO Higher Secondary School",
    address: "Koduvally, Kozhikode, Kerala",
    city: "Kozhikode",
    productsCount: "19 Products",
    primaryColor: "#4338ca",
    logoText: "K",
    logoImage: null,
    itemsPreview: [
      { name: "Sports T-Shirt", img: "/images/uniforms/sports-tshirt.jpg" },
      { name: "Navy Shorts", img: "/images/uniforms/navy-shorts.jpg" },
    ],
  },
  {
    code: "OIA3032",
    name: "Oxford International Academy",
    fullName: "Oxford International Academy",
    address: "Oxford Hill Road, Sector 4, Bengaluru",
    city: "Bengaluru",
    productsCount: "26 Products",
    primaryColor: "#881337",
    logoText: "O",
    logoImage: null,
    itemsPreview: [],
  },
  {
    code: "OIA644",
    name: "Oxford International Academy 644",
    fullName: "Oxford International Academy 644",
    address: "Oxford Hill Road, Sector 4, Bengaluru",
    city: "Bengaluru",
    productsCount: "20 Products",
    primaryColor: "#881337",
    logoText: "O",
    logoImage: null,
    itemsPreview: [],
  },
];

import { SchoolAvatar } from "@/components/common/SchoolAvatar";

// Helper to determine city from address string
function extractCity(address?: string | null): string {
  if (!address) return "Other";
  const lower = address.toLowerCase();
  if (lower.includes("bengaluru") || lower.includes("bangalore")) return "Bengaluru";
  if (lower.includes("kozhikode") || lower.includes("calicut") || lower.includes("kerala")) return "Kozhikode";
  return "Other";
}

export default function HomePage() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchError, setSearchError] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [activeNav, setActiveNav] = useState<"home" | "schools" | "how" | "track">("home");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.schools?.length > 0) {
          setSchools(data.schools);
        }
      })
      .catch((err) => console.error("Failed to load schools:", err));
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalize schools list with full details & guaranteed unique fallback logos
  const allSchoolsList = useMemo(() => {
    if (schools.length > 0) {
      return schools.map((s) => {
        const codeUpper = (s.code || "").toUpperCase();
        const fallback = FEATURED_SCHOOLS.find(
          (f) => f.code.toUpperCase() === codeUpper || f.code.toUpperCase() === codeUpper.replace(/\d+/g, "")
        );
        const logoImage = s.logo_url || fallback?.logoImage || null;
        const address = s.address || fallback?.address || "";
        const city = extractCity(address) || fallback?.city || "Other";
        return {
          code: s.code,
          name: s.name,
          fullName: s.name || fallback?.fullName,
          address,
          city,
          primaryColor: s.primary_color || fallback?.primaryColor || "#1e3a8a",
          logoImage,
          logoText: s.code?.slice(0, 3).toUpperCase(),
          productsCount: s._count
            ? `${s._count.schoolProducts} Uniform Items`
            : fallback?.productsCount || "Uniform Store",
        };
      });
    }
    return FEATURED_SCHOOLS;
  }, [schools]);

  // Live autocomplete search suggestions for Hero bar
  const liveSuggestions = useMemo(() => {
    const query = searchCode.trim().toLowerCase();
    if (!query) return [];

    return allSchoolsList.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(query);
      const codeMatch = s.code.toLowerCase().includes(query);
      const fullNameMatch = s.fullName && s.fullName.toLowerCase().includes(query);
      const addressMatch = s.address && s.address.toLowerCase().includes(query);
      return nameMatch || codeMatch || fullNameMatch || addressMatch;
    });
  }, [searchCode, allSchoolsList]);



  const handleSchoolSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim();
    if (!query) return;

    const qLower = query.toLowerCase();

    // 1. Direct exact code match
    const exactCodeMatch = allSchoolsList.find(
      (s) => s.code.toLowerCase() === qLower
    );
    if (exactCodeMatch) {
      setSearchError("");
      setIsSearchFocused(false);
      router.push(`/s/${exactCodeMatch.code.toLowerCase()}`);
      return;
    }

    // 2. Direct name match (exact or single close match)
    const matches = allSchoolsList.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        s.code.toLowerCase().includes(qLower) ||
        (s.fullName && s.fullName.toLowerCase().includes(qLower)) ||
        (s.address && s.address.toLowerCase().includes(qLower))
    );

    if (matches.length === 1) {
      setSearchError("");
      setIsSearchFocused(false);
      router.push(`/s/${matches[0].code.toLowerCase()}`);
      return;
    }

    if (matches.length > 1) {
      setSearchError("");
      setIsSearchFocused(false);
      const el = document.getElementById("schools-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setSearchError(`No school found for "${query}". Please check the name or try "Xavier", "Greenwood", or "MES".`);
  };

  const handleQuickSchoolClick = (code: string) => {
    setIsSearchFocused(false);
    router.push(`/s/${code.toLowerCase()}`);
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const token = trackingToken.trim();
    if (token) {
      router.push(`/t/${token}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col selection:bg-blue-100 selection:text-blue-950">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#061536] via-[#0c2461] to-[#1e40af] lg:bg-gradient-to-b lg:from-slate-50 lg:via-white lg:to-slate-50 border-b border-slate-800 lg:border-slate-100 text-white lg:text-slate-900 transition-colors">
        {/* Mobile-only Glowing Gradient Orbs (matching Super Admin Theme) */}
        <div className="lg:hidden absolute top-0 right-0 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute top-1/2 left-1/3 w-64 h-64 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Desktop-only Background Image with ultra-smooth blend */}
        <div
          className="hidden lg:block absolute inset-0 z-0 bg-no-repeat bg-cover pointer-events-none"
          style={{
            backgroundImage: `url('/images/hero-banner.png')`,
            backgroundPosition: "right center",
          }}
        />

        {/* Desktop White Fade Gradient Overlay */}
        <div
          className="hidden lg:block absolute inset-0 z-1 pointer-events-none"
          style={{
            background: `
              linear-gradient(90deg, #fafbfc 0%, #fafbfc 30%, rgba(250, 251, 252, 0.96) 42%, rgba(250, 251, 252, 0.5) 54%, rgba(250, 251, 252, 0) 64%),
              linear-gradient(180deg, rgba(250,251,252,0.8) 0%, rgba(250,251,252,0) 20%, rgba(250,251,252,0) 80%, #fafbfc 100%)
            `,
          }}
        />

        {/* Floating Centered Pill Navbar */}
        <div className="relative z-30 pt-3 sm:pt-6 px-3 sm:px-6 w-full flex justify-center">
          <header className="w-full max-w-6xl flex items-center justify-between bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg lg:bg-white/95 lg:border-slate-200/90 lg:shadow-sm px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all">
            {/* Brand Logo: White on mobile, standard on laptop */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/images/logo-white.png"
                alt="SIF UNIFORMS - Represent Your Institution"
                className="block lg:hidden h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img
                src="/images/logo.png"
                alt="SIF UNIFORMS - Represent Your Institution"
                className="hidden lg:block h-8 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Nav Menu (Desktop) */}
            <nav className="hidden md:flex items-center gap-1.5">
              <a
                href="#"
                onClick={() => setActiveNav("home")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeNav === "home"
                    ? "bg-[#eef4ff] text-[#1e3a8a]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                Home
              </a>
              <a
                href="#schools-section"
                onClick={() => setActiveNav("schools")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeNav === "schools"
                    ? "bg-[#eef4ff] text-[#1e3a8a] font-semibold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                Partner Schools
              </a>
              <a
                href="#how-it-works-section"
                onClick={() => setActiveNav("how")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeNav === "how"
                    ? "bg-[#eef4ff] text-[#1e3a8a] font-semibold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                How It Works
              </a>
              <a
                href="#track-section"
                onClick={() => setActiveNav("track")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeNav === "track"
                    ? "bg-[#eef4ff] text-[#1e3a8a] font-semibold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                Track Order
              </a>
            </nav>

            {/* Sign In CTA */}
            <Link
              href="/login"
              className="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-white text-[#0c2461] hover:bg-blue-50 shadow-md lg:bg-[#0c2461] lg:text-white lg:hover:bg-[#081a46] lg:shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
        </div>

        {/* Hero Main Content */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 pt-7 sm:pt-14 pb-12 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[340px] sm:min-h-[440px]">
            {/* Left Column: Text & Search Form */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 text-blue-200 border border-white/20 backdrop-blur-md lg:bg-blue-50/90 lg:text-blue-800 lg:border-blue-200/80 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-sky-300 lg:text-blue-700 shrink-0" />
                <span>Official School-Approved Uniforms</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-white lg:text-slate-950 tracking-tight leading-[1.12]">
                Your School Uniform.
                <br />
                <span className="text-sky-400 lg:text-[#2563eb]">Just a Few Clicks Away.</span>
              </h1>

              {/* Subheading */}
              <p className="text-blue-100/90 lg:text-slate-600 text-sm sm:text-base leading-relaxed max-w-md font-normal">
                Find your school&apos;s official uniform store, select your child&apos;s class and
                size, and get everything delivered to your doorstep.
              </p>

              {/* Search Box with Autocomplete Dropdown */}
              <div ref={searchContainerRef} className="relative pt-1 max-w-lg space-y-3">
                <form
                  onSubmit={handleSchoolSearch}
                  className="relative flex items-center bg-white rounded-full border border-slate-200 shadow-xl shadow-black/15 lg:shadow-md lg:shadow-slate-200/50 p-1.5 pl-3.5 sm:pl-5 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-400/30"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 mr-2 sm:mr-3" />
                  <input
                    type="text"
                    placeholder="Search by school name (e.g. Xavier, Greenwood) or code..."
                    value={searchCode}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchCode(e.target.value);
                      setIsSearchFocused(true);
                      setSearchError("");
                    }}
                    className="w-full text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none pr-2 min-w-0"
                  />
                  {searchCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCode("");
                        setSearchError("");
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 sm:px-7 py-2 sm:py-2.5 bg-[#0c2461] hover:bg-[#081a46] text-white font-bold text-xs sm:text-sm rounded-full transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    Search
                  </button>
                </form>

                {/* Live Autocomplete Suggestions Dropdown */}
                {isSearchFocused && searchCode.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 bg-slate-50/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Matching Schools ({liveSuggestions.length})</span>
                      <span className="text-[10px] text-slate-400">Press Enter or select below</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {liveSuggestions.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          <SchoolIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">No matching schools found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try searching &quot;Xavier&quot;, &quot;Greenwood&quot;, &quot;MES&quot;, or &quot;Markaz&quot;</p>
                        </div>
                      ) : (
                        liveSuggestions.map((sch) => (
                          <div
                            key={sch.code}
                            onClick={() => handleQuickSchoolClick(sch.code)}
                            className="p-3.5 hover:bg-blue-50/80 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <SchoolAvatar school={sch} className="w-10 h-10" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-900 transition-colors truncate">
                                    {sch.fullName || sch.name}
                                  </h4>
                                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-blue-100 text-blue-800">
                                    {sch.code}
                                  </span>
                                </div>
                                {sch.address && (
                                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span>{sch.address}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800 flex items-center gap-1 shrink-0">
                              <span>Open Store</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {searchError && (
                  <p className="text-xs font-semibold text-rose-300 lg:text-rose-600 pl-3">{searchError}</p>
                )}
              </div>
            </div>

            {/* Right Column (Desktop Hero Image Placeholder / Spacer) */}
            <div className="lg:col-span-6 hidden lg:block" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PARTNER SCHOOLS / SELECT YOUR INSTITUTION                              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. PARTNER SCHOOLS / SELECT YOUR INSTITUTION                              */}
      {/* ========================================================================= */}
      <section id="schools-section" className="py-10 sm:py-14 max-w-6xl mx-auto px-4 sm:px-6 w-full scroll-mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Partner Schools
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-bold text-xs border border-blue-100">
                {allSchoolsList.length} Schools
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your institution to view official uniforms and sizing.
            </p>
          </div>
        </div>

        {allSchoolsList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs space-y-2 max-w-md mx-auto">
            <SchoolIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No schools found</h3>
            <p className="text-xs text-slate-400">
              No registered partner institutions at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {allSchoolsList.map((school) => (
              <Link
                key={school.code}
                href={`/s/${school.code.toLowerCase()}`}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-600 hover:shadow-md p-3.5 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top: School Logo + Code Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <SchoolAvatar school={school} className="w-11 h-11" />
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200/70 group-hover:bg-blue-50 group-hover:text-blue-800 group-hover:border-blue-200 transition-colors">
                      {school.code}
                    </span>
                  </div>

                  {/* School Name */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[38px] group-hover:text-blue-900 transition-colors">
                    {school.fullName || school.name}
                  </h3>

                  {/* Location snippet */}
                  <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    <span>{school.city || "Official Store"}</span>
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-medium text-slate-400">
                    {school.productsCount || "Uniforms"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-900 group-hover:text-blue-600 transition-colors text-[11px]">
                    <span>Store</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS SECTION                                                  */}
      {/* ========================================================================= */}
      <section id="how-it-works-section" className="py-12 sm:py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              How SIF Uniforms Works for Parents
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Order compliant uniforms in 3 quick steps without standing in long queues at the school.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 font-black text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-950 text-base">Select School & Add Child</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log in securely via WhatsApp OTP. Add your child with their grade and gender to auto-filter mandatory uniforms.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-950 text-base">Choose Sizes & Checkout</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select your preferred size using verified school sizing charts. Pay securely online via Razorpay (Cards, UPI, NetBanking).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 font-black text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-950 text-base">Doorstep Delivery & Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your package is verified, packed by the school, and delivered directly to your home with real-time WhatsApp updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. LIVE ORDER TRACKING SECTION                                            */}
      {/* ========================================================================= */}
      <section id="track-section" className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <div className="p-8 bg-gradient-to-br from-[#0c2461] to-[#081a46] text-white rounded-3xl shadow-xl">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Have an Existing Order?</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Enter your tracking token from your WhatsApp confirmation message to view real-time courier status and packing progress.
            </p>

            <form onSubmit={handleTrackOrder} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Enter 16-character tracking token..."
                value={trackingToken}
                onChange={(e) => setTrackingToken(e.target.value)}
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none font-mono focus:border-white focus:bg-white/20 transition-all"
                required
              />
              <button
                type="submit"
                className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Track
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="SIF UNIFORMS"
              className="h-8 w-auto object-contain opacity-90"
            />
            <span className="text-slate-400">&bull; &copy; 2026 SIF UNIFORMS &bull; Represent Your Institution</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Parent Portal
            </Link>
            <Link
              href="/login?role=admin"
              className="hover:text-slate-900 transition-colors text-slate-400"
            >
              Staff & School Admin Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

