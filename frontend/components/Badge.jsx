import React from "react";

export default function Badge({
  children,
  variant = "info", // "info" | "success" | "warning" | "error" | "navy" | "neutral"
  size = "md", // "sm" | "md"
  dot = false,
  className = "",
}) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  const variantStyles = {
    info: "bg-lightBlue text-royalBlue border border-blue-200/80",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-rose-50 text-rose-700 border border-rose-200",
    navy: "bg-deepNavy text-white border border-darkNavy",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const dotColors = {
    info: "bg-royalBlue",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    navy: "bg-white",
    neutral: "bg-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${dotColors[variant]}`}
        ></span>
      )}
      <span>{children}</span>
    </span>
  );
}
