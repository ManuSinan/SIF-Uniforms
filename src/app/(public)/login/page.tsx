"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  User,
  Mail,
  MessageCircle,
  Shirt,
  Truck,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const IS_DEV = process.env.NODE_ENV !== "production";

type Step = "phone" | "otp" | "register";

const STEPS: { key: Step; label: string }[] = [
  { key: "phone", label: "Mobile" },
  { key: "otp", label: "Verify" },
  { key: "register", label: "Profile" },
];

const DEV_ACCOUNTS = [
  { mobile: "9876543210", role: "Super Admin", note: "Platform Control" },
  { mobile: "9876543211", role: "St. Xavier's Admin", note: "SXHS Portal" },
  { mobile: "9876543212", role: "Greenwood Admin", note: "GWIS Portal" },
  { mobile: "9876543213", role: "MES Admin", note: "MES Portal" },
  { mobile: "9876543214", role: "JDT Iqraa Admin", note: "JDT Portal" },
  { mobile: "9876543215", role: "Markaz Admin", note: "MR Portal" },
  { mobile: "9876543216", role: "KMO Admin", note: "KMO Portal" },
  { mobile: "9876543299", role: "Demo Parent", note: "Parent Store" },
];

const inputShell =
  "relative flex rounded-2xl border border-slate-300 bg-white overflow-hidden transition-all focus-within:border-blue-900 focus-within:ring-4 focus-within:ring-blue-100";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const schoolParam = searchParams.get("school");

  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showDevHelpers, setShowDevHelpers] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resolveDestination = (role: string, redirectUrl?: string) => {
    // Only same-site paths ("/orders/5"), never "//evil.com" or "https://…"
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") && !redirectParam.startsWith("/\\")) {
      return redirectParam;
    }
    if (schoolParam && role === "parent") return `/parent?school=${encodeURIComponent(schoolParam.toUpperCase())}`;
    if (redirectUrl) return redirectUrl;
    if (role === "super_admin") return "/super";
    if (role === "school_admin") return "/school";
    return "/parent";
  };

  const handleSendOtp = async (phoneToUse?: string) => {
    const targetMobile = (phoneToUse || mobile).replace(/\D/g, "").slice(-10);
    if (targetMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setLoading(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: targetMobile }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "We couldn't send the code. Please try again.");
      }

      setMobile(targetMobile);
      if (data.testOtp) {
        setOtp(data.testOtp);
      }
      setStep("otp");
      setCountdown(30);
      setSuccessMsg(`Verification code sent on WhatsApp to +91 ${targetMobile}`);
    } catch (err: any) {
      setError(err.message || "We couldn't send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Incorrect verification code. Please check and try again.");
      }

      const destination = resolveDestination(data.user.role, data.redirectUrl);

      // New parents haven't set a name yet — collect it before continuing
      if (data.user.role === "parent" && (!data.user.name || data.user.name.startsWith("Parent ("))) {
        setPendingRedirect(destination);
        setStep("register");
        setSuccessMsg("");
        return;
      }

      setSuccessMsg("Signed in successfully! Taking you to your dashboard…");
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName.trim(),
          email: parentEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "We couldn't save your details. Please try again.");
      }

      setSuccessMsg("All set! Taking you to the uniform store…");
      router.push(pendingRedirect || "/parent");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "We couldn't save your details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoMobile: string, demoRole: string) => {
    setMobile(demoMobile);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: demoMobile }),
      });
      const data = await res.json();
      const testCode = data.testOtp || "123456";

      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: demoMobile, otp: testCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error || "Login failed");

      const destination = resolveDestination(verifyData.user.role, verifyData.redirectUrl);
      setSuccessMsg(`Signed in as ${demoRole}! Redirecting…`);
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Fast sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const heading = {
    phone: "Welcome to SIF UNIFORMS",
    otp: "Verify WhatsApp Code",
    register: "Complete Your Profile",
  }[step];

  const subheading = {
    phone: "Enter your mobile number to sign in or create an account. No password needed.",
    otp: `We sent a 6-digit code to +91 ${mobile}.`,
    register: "Tell us your name so schools can identify your uniform orders.",
  }[step];

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1fr_1.1fr] selection:bg-blue-100">
      {/* Brand panel (desktop) */}
      <aside className="hidden lg:flex flex-col justify-between bg-blue-950 text-white p-12 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-800/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl"
        />

        <div />

        <div className="relative space-y-8 max-w-md">
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            School uniforms,
            <br />
            <span className="text-amber-300">sorted in minutes.</span>
          </h2>
          <ul className="space-y-4 text-blue-100 text-sm">
            <li className="flex items-start gap-3">
              <Shirt className="w-5 h-5 text-amber-300 shrink-0" />
              Official uniforms approved by your child&apos;s school
            </li>
            <li className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-amber-300 shrink-0" />
              Track every order from payment to delivery
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-amber-300 shrink-0" />
              Secure sign-in with WhatsApp. No passwords to remember
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-blue-300">© {new Date().getFullYear()} SIF UNIFORMS</p>
      </aside>

      {/* Form column */}
      <main className="flex flex-col min-h-screen px-4 sm:px-8">
        <header className="w-full max-w-md mx-auto py-5 flex items-center justify-end">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </header>

        <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto py-6">
          {/* Step indicator */}
          <ol className="flex items-center gap-2 mb-8" aria-label="Sign-in progress">
            {STEPS.map((s, i) => {
              if (s.key === "register" && step !== "register") return null;
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <li key={s.key} className="flex items-center gap-2 flex-1">
                  <span
                    className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? "bg-emerald-600 text-white"
                        : active
                        ? "bg-blue-900 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold ${active ? "text-slate-900" : "text-slate-400"}`}
                    aria-current={active ? "step" : undefined}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (s.key !== "otp" || step === "register") && (
                    <span className={`h-px flex-1 ${done ? "bg-emerald-600" : "bg-slate-200"}`} />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">{heading}</h1>
            <p className="text-slate-500 text-sm">{subheading}</p>
          </div>

          {/* Status alerts */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Phone */}
          {step === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-5"
            >
              <div>
                <label htmlFor="mobile" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mobile number
                </label>
                <div className={inputShell}>
                  <span className="inline-flex items-center px-3.5 text-sm font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">
                    +91
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    className="w-full px-3.5 py-3 text-base font-semibold text-slate-900 outline-hidden tracking-wider"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Use the number linked to your WhatsApp.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || mobile.length < 10}
                className="w-full font-bold rounded-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                New here? We&apos;ll create your account after you verify your number.
              </p>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOtp();
              }}
              className="space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="otp" className="text-sm font-semibold text-slate-700">
                    Verification code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-blue-800 hover:underline font-semibold"
                  >
                    Wrong number?
                  </button>
                </div>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  className="w-full px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.5em] text-slate-900 rounded-xl border border-slate-300 focus:border-blue-900 focus:ring-4 focus:ring-blue-100 outline-hidden transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || otp.length !== 6}
                className="w-full font-bold rounded-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify and sign in
                  </>
                )}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-xs text-slate-500">
                    Didn&apos;t get it? You can resend in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(mobile)}
                    disabled={loading}
                    className="text-xs text-blue-900 font-bold hover:underline"
                  >
                    Resend code on WhatsApp
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Profile for new parents */}
          {step === "register" && (
            <form onSubmit={handleCompleteRegistration} className="space-y-5">
              <div>
                <label htmlFor="parent-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full name
                </label>
                <div className={inputShell}>
                  <span className="inline-flex items-center px-3.5 text-slate-400 bg-slate-50 border-r border-slate-200">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="parent-name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    autoFocus
                    className="w-full px-3.5 py-3 text-base text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="parent-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email <span className="font-normal text-slate-400">(optional, for order receipts)</span>
                </label>
                <div className={inputShell}>
                  <span className="inline-flex items-center px-3.5 text-slate-400 bg-slate-50 border-r border-slate-200">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="parent-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full px-3.5 py-3 text-base text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !parentName.trim()}
                className="w-full font-bold rounded-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Continue to store
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-8 text-[11px] text-slate-400 text-center">
            By continuing, you agree to receive order updates from SIF UNIFORMS on WhatsApp.
          </p>
        </div>

        {/* Development-only quick test helper (hidden in production) */}
        {IS_DEV && (
          <div className="w-full max-w-md mx-auto pb-6">
            <button
              type="button"
              onClick={() => setShowDevHelpers(!showDevHelpers)}
              className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Developer test logins</span>
              {showDevHelpers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDevHelpers && (
              <div className="mt-2 p-3 bg-white rounded-2xl border border-dashed border-slate-300 grid grid-cols-2 gap-2">
                {DEV_ACCOUNTS.map((a) => (
                  <button
                    key={a.mobile}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemo(a.mobile, a.role)}
                    className="p-2 border rounded-xl font-semibold text-left text-[11px] bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900 transition-colors disabled:opacity-50"
                  >
                    <div className="font-bold">{a.role}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{a.mobile}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <RefreshCw className="w-6 h-6 text-blue-900 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
