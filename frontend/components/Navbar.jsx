"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();
  const { user, openLogoutDialog } = useAuth();
  const { language, changeLanguage, dir, isRtl, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    {
      label: t.navHome,
      href: "/",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: t.navAbout,
      href: "/about",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t.navFeatures,
      href: "/features",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      label: t.navHowItWorks,
      href: "/how-it-works",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t.navTrafficRules,
      href: "/traffic-rules",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      label: t.navFAQ,
      href: "/faq",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t.navContact,
      href: "/contact",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <nav className="bg-[#061D38] text-white sticky top-0 z-50 border-b border-[#0A2548] shadow-lg transition-colors" dir={dir}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* Logo & Brand Name with Official Shield Emblem */}
          <Logo variant="dark" size="md" />

          {/* Desktop Navigation Links with Icon & Active Pill */}
          <div className="hidden xl:flex items-center space-x-1 rtl:space-x-reverse font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold flex items-center space-x-1.5 rtl:space-x-reverse ${
                    isActive
                      ? "bg-gradient-to-r from-royalBlue to-brightBlue text-white shadow-md shadow-blue-900/40 border border-blue-400/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action: Language Selector & Scan Challan Button */}
          <div className="hidden md:flex items-center space-x-3 rtl:space-x-reverse">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1.5 rtl:space-x-reverse bg-[#092B50]/80 hover:bg-[#0E3A6B] text-slate-200 border border-slate-700/60 rounded-full text-xs font-medium py-1.5 px-3.5 transition"
                aria-expanded={langDropdownOpen}
                aria-label="Language selector"
              >
                <span className="text-sm">{currentLangObj.flag || "🌐"}</span>
                <span className="font-semibold">{currentLangObj.nativeName}</span>
                <span className="text-slate-400 text-[10px]">▾</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-[#092B50] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-md">
                  <div className="px-3 py-1 text-[10px] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                    {t.navLanguage}
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left rtl:text-right px-4 py-2 text-xs flex items-center justify-between hover:bg-[#061D38] transition ${
                        language === lang.code ? "text-sky-400 font-bold bg-[#061D38]/50" : "text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono">
                        {lang.name}
                      </span>
                    </button>
                  ))}
                  
                  <div className="mt-1 pt-1 border-t border-slate-800 px-2">
                    <Link
                      href="/language-selection"
                      onClick={() => setLangDropdownOpen(false)}
                      className="block text-center text-[11px] text-sky-400 hover:text-sky-300 py-1 font-semibold"
                    >
                      {language === "ur" ? "مزید اختیارات ←" : language === "ps" ? "نور انتخابونه ←" : "Language Settings →"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Challan Primary Button */}
            <Link
              href="/scan-challan"
              className="bg-royalBlue hover:bg-brightBlue text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-blue-900/30 flex items-center space-x-1.5 rtl:space-x-reverse transition transform hover:scale-[1.02]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>{t.navScanChallan}</span>
            </Link>

            {/* Citizen / Admin Login / Dashboard */}
            {user ? (
              <div className="flex items-center space-x-2 rtl:space-x-reverse pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-slate-700/60">
                <Link
                  href={user.role === "admin" ? "/admin/dashboard" : "/citizen/dashboard"}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 rtl:space-x-reverse transition"
                >
                  <span>{t.navDashboard}</span>
                </Link>
                <button
                  onClick={openLogoutDialog}
                  className="text-xs text-slate-400 hover:text-white px-1 py-1"
                >
                  {t.navLogout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-transparent hover:bg-white/10 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition"
              >
                {t.navLogin}
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="xl:hidden flex items-center space-x-2 rtl:space-x-reverse">
            <Link
              href="/scan-challan"
              className="bg-royalBlue text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              {t.navScanChallan}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2 rounded-lg"
              aria-label="Toggle Navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-800 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg text-xs font-semibold ${
                  pathname === link.href ? "bg-royalBlue text-white" : "text-slate-300 hover:bg-darkNavy"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2 px-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.navLanguage}:</span>
                <Link
                  href="/language-selection"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sky-400 text-[11px]"
                >
                  Settings ⚙
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      changeLanguage(l.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-xs py-2 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                      language === l.code
                        ? "bg-royalBlue text-white shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}