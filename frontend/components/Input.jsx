"use client";
import React from "react";

export default function Input({
  label,
  error,
  helperText,
  icon,
  iconPosition = "left",
  className = "",
  id,
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-deepNavy mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        {icon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-slate-50 border rounded-xl text-xs sm:text-sm text-deepNavy placeholder-slate-400 font-medium py-2.5 transition focus:outline-none focus:ring-2 focus:ring-royalBlue/20 focus:bg-white ${
            icon && iconPosition === "left" ? "pl-10" : "pl-3.5"
          } ${icon && iconPosition === "right" ? "pr-10" : "pr-3.5"} ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-300 focus:border-royalBlue"
          } ${className}`}
          {...props}
        />

        {icon && iconPosition === "right" && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-[11px] text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-mutedGrey">{helperText}</p>
      ) : null}
    </div>
  );
}
