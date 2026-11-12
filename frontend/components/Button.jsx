"use client";
import React from "react";

export default function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "dark" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  loading = false,
  disabled = false,
  className = "",
  icon,
  iconPosition = "left",
  type = "button",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-xs sm:text-sm px-5 py-2.5 gap-2",
    lg: "text-sm sm:text-base px-7 py-3.5 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-royalBlue to-brightBlue hover:from-brightBlue hover:to-royalBlue text-white shadow-md shadow-blue-900/20 focus:ring-royalBlue active:scale-[0.98]",
    secondary:
      "bg-lightBlue text-darkNavy hover:bg-blue-100 border border-blue-200/80 focus:ring-royalBlue active:scale-[0.98]",
    outline:
      "bg-white hover:bg-slate-50 text-deepNavy border border-slate-300 hover:border-slate-400 focus:ring-royalBlue shadow-subtle active:scale-[0.98]",
    dark:
      "bg-deepNavy hover:bg-darkNavy text-white shadow-sm focus:ring-darkNavy active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
