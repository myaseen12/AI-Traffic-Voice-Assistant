"use client";
import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t, dir, isRtl } = useLanguage();

  return (
    <footer className="bg-[#061D38] text-slate-300 border-t border-[#092B50] pt-10 pb-6 text-xs" dir={dir}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-slate-800/80 gap-6">
          
          {/* Brand Left with Shield Logo */}
          <Logo variant="dark" size="md" />

          {/* Quick Legal & Help Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-medium">
            <Link href="/privacy-policy" className="hover:text-royalBlue transition">
              {t.privacyPolicy}
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link href="/terms-conditions" className="hover:text-royalBlue transition">
              {t.termsConditions}
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link href="/faq" className="hover:text-royalBlue transition">
              {t.navFAQ}
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link href="/contact" className="hover:text-royalBlue transition">
              {t.contactUs}
            </Link>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="text-xs font-semibold text-slate-400">{t.followUs}:</span>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="w-7 h-7 rounded-full bg-royalBlue text-white flex items-center justify-center text-xs font-bold hover:bg-brightBlue transition shadow-sm"
              >
                f
              </a>
              {/* YouTube */}
              <a
                href="#"
                aria-label="YouTube"
                className="w-7 h-7 rounded-full bg-royalBlue text-white flex items-center justify-center text-xs font-bold hover:bg-brightBlue transition shadow-sm"
              >
                ▶
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-7 h-7 rounded-full bg-royalBlue text-white flex items-center justify-center text-xs font-bold hover:bg-brightBlue transition shadow-sm"
              >
                in
              </a>
              {/* X */}
              <a
                href="#"
                aria-label="X Twitter"
                className="w-7 h-7 rounded-full bg-royalBlue text-white flex items-center justify-center text-xs font-bold hover:bg-brightBlue transition shadow-sm"
              >
                𝕏
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Sub-row */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] text-slate-400 gap-3">
          <div>
            {t.copyrightText}
          </div>
          <div className="text-slate-300 font-bold tracking-wide">
            {t.driveSafeRules}
          </div>
        </div>

      </div>
    </footer>
  );
}