"use client";

import React from "react";
import Link from "next/link";
import { Menu, ExternalLink, LogOut, Bell, ShieldCheck } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  userName?: string;
  schoolCode?: string;
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  userName,
  schoolCode,
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate max-w-[180px] xs:max-w-[240px] sm:max-w-md">
            {title}
          </h1>
          {schoolCode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 uppercase shrink-0">
              {schoolCode}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {schoolCode && (
          <Link
            href={`/s/${schoolCode.toLowerCase()}`}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
            title="Preview Parent Store"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Parent Store</span>
          </Link>
        )}

        {userName && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-black font-mono shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white line-clamp-1 leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">Staff Portal</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
