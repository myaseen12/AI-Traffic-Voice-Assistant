"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";
import Logo from "../../../components/Logo";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your official email / badge identifier and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authService.loginWithPassword(identifier.trim(), password);
      const role = (res.user?.role || "").toLowerCase();
      if (!["admin", "super_admin", "traffic_officer"].includes(role)) {
        setError("Access Denied: This portal is restricted to authorized Police Command & Operations staff.");
        setLoading(false);
        return;
      }

      login(res.access_token, res.user);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid officer badge credentials or unauthorized IP.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setIdentifier("hq@trafficpolice.gov.pk");
    setPassword("Admin@123");
    setError("");
  };

  return (
    <div className="bg-[#061D38] text-white min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar */}
      <header className="p-6 max-w-[1440px] mx-auto w-full flex items-center justify-between border-b border-[#0A2B55] relative z-10">
        <Logo variant="dark" size="md" />
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          ← Citizen Portal Login
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10 py-12">
        <div className="max-w-md w-full bg-[#092B50] border border-[#0D3868] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <Badge variant="navy" className="bg-[#061D38] text-sky-300 border-sky-400/30 mx-auto">
              Command & Control Staff
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Traffic Police HQ Login
            </h1>
            <p className="text-xs text-slate-300">
              Safe City Surveillance, e-Challan Management & AI Rules Gateway
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-300 text-xs font-semibold flex items-start space-x-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Official Email or Officer Badge ID
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. hq@trafficpolice.gov.pk"
                className="w-full bg-[#061D38] border border-slate-700 focus:border-royalBlue rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-royalBlue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Command Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#061D38] border border-slate-700 focus:border-royalBlue rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-royalBlue"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center shadow-lg shadow-blue-900/50"
            >
              Sign In to Command Center →
            </Button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
              Authorized Evaluation Credentials:
            </span>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full p-2.5 rounded-xl bg-[#061D38] hover:bg-[#0A2446] border border-slate-700 hover:border-royalBlue transition text-left text-xs space-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-300 group-hover:text-white">
                  hq@trafficpolice.gov.pk
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  One-Click Auto-Fill
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Password: <strong className="text-slate-300">Admin@123</strong> (Role: Administrator)
              </div>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Restricted government information system. Unauthorized access is punishable under PECA 2016.
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-[#0A2B55] relative z-10">
        © 2026 AI Traffic Voice Assistant. National Highway & Safe City Enforcement Operations.
      </footer>
    </div>
  );
}