import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs",
          hoverEffect && "hover:shadow-md transition-shadow duration-150",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
