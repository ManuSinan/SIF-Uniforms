import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "neutral" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "neutral",
  size = "sm",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-medium rounded-full",
    md: "px-3 py-1 text-sm font-semibold rounded-full",
  };

  const variantStyles = {
    brand: "bg-brand-primary text-white",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
  };

  return (
    <span className={twMerge(clsx("inline-flex items-center gap-1", sizeStyles[size], variantStyles[variant], className))} {...props}>
      {children}
    </span>
  );
};
