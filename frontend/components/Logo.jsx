"use client";
import React from "react";
import Link from "next/link";

export default function Logo({
  showText = true,
  variant = "dark", // "dark" (for dark navy navbar/footer) or "light" (for white canvas)
  size = "md", // "sm", "md", "lg"
  href = "/",
  className = "",
}) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
  };

  const taglineSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
  };

  const content = (
    <div className={`flex items-center space-x-3 group cursor-pointer ${className}`}>
      {/* Authentic Shield Microphone Emblem */}
      <div className={`${iconSizes[size]} flex-shrink-0 relative transition-transform duration-200 group-hover:scale-105`}>
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="navShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E2F54" />
              <stop offset="100%" stopColor="#061D38" />
            </linearGradient>
            <linearGradient id="navMicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1685F5" />
              <stop offset="100%" stopColor="#0875DF" />
            </linearGradient>
          </defs>

          {/* Outer White Border */}
          <path
            d="M60 12 L96 24 C96 66 78 96 60 108 C42 96 24 66 24 24 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Shield Body with Cyan Glow Border */}
          <path
            d="M60 15 L93 26 C93 64 76 93 60 104 C44 93 27 64 27 26 Z"
            fill="url(#navShieldGrad)"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Microphone Capsule */}
          <rect
            x="49"
            y="34"
            width="22"
            height="36"
            rx="11"
            fill="url(#navMicGrad)"
          />

          {/* Sound Wave / Pulse Line across Mic */}
          <path
            d="M38 52 L50 52 L54 44 L60 62 L66 44 L70 52 L82 52"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Mic Cradle */}
          <path
            d="M42 48 C42 66 78 66 78 48"
            fill="none"
            stroke="#1685F5"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Stem & Pedestal */}
          <line x1="60" y1="67" x2="60" y2="82" stroke="#1685F5" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="48" y1="82" x2="72" y2="82" stroke="#1685F5" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight leading-tight ${textSizes[size]} ${variant === "light" ? "text-deepNavy" : "text-white"}`}>
            AI Traffic <span className={variant === "light" ? "text-royalBlue" : "text-sky-400 font-bold"}>Voice Assistant</span>
          </div>
          <div className={`tracking-wide font-medium ${taglineSizes[size]} ${variant === "light" ? "text-mutedGrey" : "text-slate-300"}`}>
            Ask. Understand. Follow.
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
