import React from "react";

export default function Card({
  children,
  className = "",
  hoverable = false,
  bordered = true,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 sm:p-6 transition-all ${
        bordered ? "border border-slate-200/90" : ""
      } ${
        hoverable
          ? "shadow-card hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
          : "shadow-card"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
