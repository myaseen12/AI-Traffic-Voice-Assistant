"use client";
import React, { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  className = "",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#061D38]/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Dialog Box */}
      <div
        className={`relative bg-white rounded-2xl w-full ${maxWidth} p-6 shadow-2xl border border-slate-200 z-10 transform transition-all ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          {title ? (
            <h3 className="font-extrabold text-base text-deepNavy">{title}</h3>
          ) : (
            <div></div>
          )}
          <button
            onClick={onClose}
            aria-label="Close Modal"
            className="text-slate-400 hover:text-deepNavy text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
