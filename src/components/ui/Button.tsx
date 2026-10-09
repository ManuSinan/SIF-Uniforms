import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "brand",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const sizeStyles = {
    sm: "min-h-[36px] px-3 py-1.5 text-xs gap-1.5",
    md: "min-h-[44px] px-4 py-2.5 text-sm gap-2",
    lg: "min-h-[48px] px-6 py-3 text-base gap-2.5",
  };

  const variantStyles = {
    brand: "bg-brand-primary text-white hover:opacity-90 active:scale-[0.99] focus:ring-[var(--brand-primary)]",
    primary: "bg-blue-900 text-white hover:bg-blue-800 active:scale-[0.99] focus:ring-blue-500",
    secondary: "bg-brand-secondary text-slate-900 hover:opacity-90 active:scale-[0.99] focus:ring-[var(--brand-secondary)]",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
