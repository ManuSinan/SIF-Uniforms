"use client";

import React, { useState } from "react";

export interface SchoolAvatarProps {
  school?: {
    code?: string | null;
    name?: string | null;
    logo_url?: string | null;
    logoImage?: string | null;
    primary_color?: string | null;
    primaryColor?: string | null;
    secondary_color?: string | null;
    secondaryColor?: string | null;
  } | null;
  className?: string;
  roundedClassName?: string;
  alt?: string;
}

// Curated rich background colors if school primary color is not set
export const FALLBACK_COLORS = [
  "#1e3a8a", // Royal Navy
  "#065f46", // Deep Emerald
  "#991b1b", // Crimson Red
  "#581c87", // Royal Purple
  "#c2410c", // Rich Orange
  "#0f766e", // Deep Teal
  "#1e293b", // Midnight Slate
  "#831843", // Berry Rose
  "#312e81", // Indigo
  "#14532d", // Forest Green
];

export function SchoolAvatar({
  school,
  className = "w-12 h-12",
  roundedClassName = "rounded-2xl",
  alt,
}: SchoolAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const rawUrl = school?.logo_url || school?.logoImage;
  const name = (school?.name || school?.code || "School").trim();
  
  // Extract 1st alphanumeric letter
  const cleanStr = name.replace(/[^a-zA-Z0-9]/g, "");
  const firstLetter = (cleanStr.charAt(0) || name.charAt(0) || "S").toUpperCase();

  // If a valid uploaded image URL is present and has not errored
  const hasValidImage = Boolean(rawUrl && !imgError && rawUrl.trim().length > 0);

  if (hasValidImage) {
    return (
      <img
        src={rawUrl!}
        alt={alt || name}
        className={`${className} ${roundedClassName} object-contain shrink-0 group-hover:scale-105 transition-transform`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Determine background color: primary_color or deterministic fallback color
  const code = (school?.code || school?.name || "SCH").toUpperCase();
  const hash = code.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const bgColor =
    school?.primary_color ||
    school?.primaryColor ||
    FALLBACK_COLORS[hash % FALLBACK_COLORS.length];

  return (
    <div
      className={`${className} ${roundedClassName} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden select-none`}
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-white font-black text-xl sm:text-2xl uppercase tracking-tight">
        {firstLetter}
      </span>
    </div>
  );
}

export default SchoolAvatar;
