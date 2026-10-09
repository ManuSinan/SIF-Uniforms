/**
 * Color and contrast utilities for per-school dynamic branding
 */

export function getContrastColor(hexColor: string): string {
  // If invalid or shorthand, normalize
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) {
    return "#ffffff";
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Perceived brightness formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#ffffff";
}

export function adjustBrightness(hexColor: string, percent: number): string {
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(hex, 16);
  let r = (num >> 16) + Math.round((255 * percent) / 100);
  let g = ((num >> 8) & 0x00ff) + Math.round((255 * percent) / 100);
  let b = (num & 0x0000ff) + Math.round((255 * percent) / 100);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface SchoolTheme {
  primary: string;
  secondary: string;
  primaryText: string;
  secondaryText: string;
  primaryHover: string;
}

export function getSchoolTheme(primary = "#1e3a8a", secondary = "#fbbf24"): SchoolTheme {
  return {
    primary,
    secondary,
    primaryText: getContrastColor(primary),
    secondaryText: getContrastColor(secondary),
    primaryHover: adjustBrightness(primary, -15),
  };
}

export function generateThemeCssVariables(primary = "#1e3a8a", secondary = "#fbbf24"): React.CSSProperties {
  const theme = getSchoolTheme(primary, secondary);
  return {
    "--brand-primary": theme.primary,
    "--brand-secondary": theme.secondary,
    "--brand-primary-text": theme.primaryText,
    "--brand-secondary-text": theme.secondaryText,
    "--brand-primary-hover": theme.primaryHover,
  } as React.CSSProperties;
}
