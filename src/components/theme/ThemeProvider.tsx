"use client";

import React, { useEffect } from "react";
import { generateThemeCssVariables } from "@/lib/theme/colors";

interface ThemeProviderProps {
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
  className?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  primaryColor = "#1e3a8a",
  secondaryColor = "#fbbf24",
  children,
  className = "",
}) => {
  const cssVars = generateThemeCssVariables(primaryColor, secondaryColor);

  useEffect(() => {
    // Also inject on root if needed
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, val]) => {
      root.style.setProperty(key, val as string);
    });
  }, [primaryColor, secondaryColor, cssVars]);

  return (
    <div style={cssVars} className={`min-h-screen ${className}`}>
      {children}
    </div>
  );
};
