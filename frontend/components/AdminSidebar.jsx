"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, openLogoutDialog } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard Overview", href: "/admin/dashboard", icon: "📊" },
    { label: "Manage Challans", href: "/admin/challans", icon: "📋" },
    { label: "Manage Citizens", href: "/admin/citizens", icon: "👥" },
    { label: "Manage Traffic Rules", href: "/admin/traffic-rules", icon: "⚖️" },
    { label: "Knowledge Base (RAG)", href: "/admin/knowledge-base", icon: "📚" },
    { label: "Reports & Analytics", href: "/admin/reports", icon: "📈" },
    { label: "System Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile Bar */}
      <div className="lg:hidden bg-[#061D38] border-b border-[#0A2B55] p-4 flex items-center justify-between text-white sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Logo variant="dark" size="sm" />
          <span className="text-xs font-bold text-sky-300">Command HQ</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200"
          aria-label="Toggle Admin Sidebar"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-[#061D38] text-white border-r border-[#0A2B55] flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#0A2B55]">
            <Logo variant="dark" size="md" />
            <div className="mt-3 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300 font-bold">
                Command & Operations HQ
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-gradient-to-r from-royalBlue to-brightBlue text-white shadow-md shadow-blue-900/40 border border-blue-400/30"
                      : "text-slate-300 hover:text-white hover:bg-[#092B50]"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Officer Profile & Logout */}
        <div className="p-4 border-t border-[#0A2B55] bg-[#041529]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-royalBlue text-white font-black text-xs flex items-center justify-center border border-sky-400/40">
                HQ
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate max-w-[130px]">
                  {user?.full_name || "Operations HQ"}
                </div>
                <div className="text-[10px] text-sky-300 font-mono">
                  Badge: HQ-CMD-01
                </div>
              </div>
            </div>

            <button
              onClick={openLogoutDialog}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition text-xs"
              title="Sign Out of Operations Command"
            >
              🚪
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center flex items-center justify-between pt-2 border-t border-slate-800">
            <span>Role: Administrator</span>
            <span className="text-emerald-400 font-mono">2FA Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}