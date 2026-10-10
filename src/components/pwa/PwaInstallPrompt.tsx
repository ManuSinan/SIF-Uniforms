"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Share } from "lucide-react";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Only show prompt on the landing page
    if (pathname !== "/") {
      setShowPrompt(false);
      return;
    }
    // 1. Check if already running in standalone PWA mode
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if recently dismissed in this session
    const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
    if (dismissed) {
      return;
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|mercury/.test(ua);
    if (isIosDevice && isSafari) {
      setIsIOS(true);
      const timer = setTimeout(() => setShowPrompt(true), 1000);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt event (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 800);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (pathname !== "/" || !showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4 animate-in zoom-in-95 fade-in duration-300 relative">
        {/* Header: Logo + Title + Rounded Close Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/images/logo.png"
              alt="SIF Uniforms"
              className="h-9 w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/icon-192.png";
              }}
            />
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                Install SIF Uniforms
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                Fast uniform shopping &amp; live tracking
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 self-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Action Buttons */}
        {isIOS ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-700 leading-relaxed bg-black/5 p-3 rounded-2xl border border-black/5">
              To install on iPhone / iPad, tap{" "}
              <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> in Safari and choose{" "}
              <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 bg-[#0c2461] hover:bg-blue-900 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-blue-950/20"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-300/80 bg-white/60 hover:bg-white text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#0c2461] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/25 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
