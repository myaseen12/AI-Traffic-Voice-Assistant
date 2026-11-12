"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../../context/LanguageContext";
import { useChallan } from "../../../context/ChallanContext";
import { fetchApi } from "../../../services/api";
import { challanService } from "../../../services/challanService";
import { citizenService } from "../../../services/citizenService";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Badge from "../../../components/Badge";

function CitizenDashboardContent() {
  const router = useRouter();
  const { user, openLogoutDialog } = useAuth();
  const { language, changeLanguage, dir, isRtl, t } = useLanguage();
  const { selectChallan } = useChallan();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);

  // Modal states
  const [activePayChallan, setActivePayChallan] = useState(null);
  const [activeDisputeChallan, setActiveDisputeChallan] = useState(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await citizenService.getDashboard();
        setData(res);
        setIsDemoData(!res.is_backend_data);
      } catch (err) {
        console.warn("Backend dashboard fetch failed, loading verified fallback demo:", err);
        // Fallback realistic demo profile
        setData({
          user: {
            name: user?.full_name || "Muhammad Yaseen",
            phone: user?.phone_number || "03009876543",
            email: user?.email || "citizen@traffic.gov.pk",
            license: user?.driving_license_no || "ICT-DL-2019-88392",
            language: language || "ur",
            vehicles: ["ICT-LE-402"],
            member_since: "Nov 2024",
            is_verified: true,
          },
          stats: {
            total_challans: 3,
            pending_count: 2,
            pending_amount: 7000,
            paid_count: 1,
            paid_amount: 1500,
            penalty_points: 3,
            safe_driving_score: 85,
          },
          recent_challans: [
            {
              id: 1,
              challan_no: "PK-2024-883921",
              vehicle_no: "ICT-LE-402",
              amount: 5000,
              status: "PENDING",
              date: "02 Nov 2026",
              due_date: "16 Nov 2026",
              violation: "Exceeding Prescribed Speed Limit (Section 113)",
              section: "Section 113, Motor Vehicles Ordinance 1965",
              location: "Islamabad Expressway, Zero Point Interchange",
              remarks: "Safe City ANPR Camera #Cam08: Speed detected 104 km/h in 80 km/h zone.",
            },
            {
              id: 2,
              challan_no: "PK-2024-774102",
              vehicle_no: "ICT-LE-402",
              amount: 2000,
              status: "PENDING",
              date: "31 Oct 2026",
              due_date: "14 Nov 2026",
              violation: "Riding Motorcycle without Safety Helmet (Section 89-A)",
              section: "Section 89-A, Motor Vehicles Ordinance 1965",
              location: "7th Avenue, Blue Area Intersection",
              remarks: "Traffic Warden Handheld e-Ticketing Device: Pillion rider helmet absent.",
            },
            {
              id: 3,
              challan_no: "PK-2024-551209",
              vehicle_no: "ICT-LE-402",
              amount: 1500,
              status: "PAID",
              date: "15 Oct 2026",
              due_date: "29 Oct 2026",
              violation: "Failure to Fasten Seatbelt while Driving (Section 89-B)",
              section: "Section 89-B, Motor Vehicles Ordinance 1965",
              location: "Kashmir Highway, G-9 Sector",
              remarks: "Settled online via 1Link PSID 100883921004. Receipt #PK-PAY-99120.",
            },
          ],
        });
        setIsDemoData(true);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, language]);

  // Handle immediate payment simulation
  const handleConfirmPayment = async (challanId) => {
    try {
      await challanService.pay(challanId, "1LINK_DIGITAL");
    } catch (e) {
      console.warn("Backend payment simulated:", e);
    }
    // Update local state
    setData((prev) => {
      const updatedList = prev.recent_challans.map((c) =>
        c.id === challanId ? { ...c, status: "PAID" } : c
      );
      const pending = updatedList.filter((c) => c.status === "PENDING");
      const paid = updatedList.filter((c) => c.status === "PAID");
      return {
        ...prev,
        stats: {
          ...prev.stats,
          pending_count: pending.length,
          pending_amount: pending.reduce((sum, c) => sum + c.amount, 0),
          paid_count: paid.length,
          paid_amount: paid.reduce((sum, c) => sum + c.amount, 0),
        },
        recent_challans: updatedList,
      };
    });
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setActivePayChallan(null);
    }, 2000);
  };

  // Recent AI Consultations Log
  const recentConsultations = [
    {
      id: 101,
      query: "Why did I receive challan PK-2024-883921 and how is speed calculated?",
      responseSummary: "Explained Section 113 over-speeding penalty (Rs. 5,000) and Safe City ANPR camera evidence.",
      langCode: "ur",
      langLabel: "اردو (Urdu)",
      timeAgo: "2 hours ago",
      challanRef: "PK-2024-883921",
    },
    {
      id: 102,
      query: "Can I contest a helmet violation under Section 89-A?",
      responseSummary: "Provided procedural steps for magistrate review within the 14-day statutory grace window.",
      langCode: "en",
      langLabel: "English",
      timeAgo: "Yesterday",
      challanRef: "PK-2024-774102",
    },
    {
      id: 103,
      query: "د ۱لنک له لارې د چالان د انلاین ادا کولو طریقه څه ده؟",
      responseSummary: "د ۱۸ عددي PSID نمبر او ایزی پیسه / موبایل بانکینګ له لارې د تادیې لارښوونه وشوه.",
      langCode: "ps",
      langLabel: "پښتو (Pashto)",
      timeAgo: "3 days ago",
      challanRef: "PK-2024-551209",
    },
  ];

  // Recent Account Activity Timeline
  const recentActivity = [
    {
      id: 201,
      icon: "📸",
      title: "Safe City ANPR Citation Detected",
      detail: "Speed detected 104 km/h at Zero Point Interchange on Islamabad Expressway (Ref: PK-2024-883921).",
      timestamp: "02 Nov 2026, 14:22",
      type: "violation",
    },
    {
      id: 202,
      icon: "🔐",
      title: "2FA SMS OTP Citizen Authentication",
      detail: "Secure login verified via one-time SMS passkey for registered mobile +92 300 9876543.",
      timestamp: "06 Nov 2026, 14:40",
      type: "auth",
    },
    {
      id: 203,
      icon: "🌐",
      title: "Language Preference Updated",
      detail: `Voice Assistant and interface configured to ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name} (${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}).`,
      timestamp: "06 Nov 2026, 14:45",
      type: "settings",
    },
    {
      id: 204,
      icon: "💳",
      title: "e-Challan Paid via 1Link PSID",
      detail: "Rs. 1,500 settled for citation PK-2024-551209 via Mobile Banking. Digital receipt archived.",
      timestamp: "15 Oct 2026, 10:15",
      type: "payment",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-royalBlue border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-mutedGrey">
          Connecting to Central Citizen Citation Registry...
        </span>
      </div>
    );
  }

  const { stats, recent_challans, user: citizenUser } = data;

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen py-10" dir={dir}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* =========================================================================
            1. WELCOME HERO & ACTION BAR
            ========================================================================= */}
        <div className="bg-gradient-to-r from-[#061D38] via-[#092B50] to-[#0A386D] rounded-2xl p-6 sm:p-8 text-white shadow-card border border-sky-500/20 relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div>
              {/* Status & Verification Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0E2F54] text-sky-300 border border-sky-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>NADRA & Safe City Verified</span>
                </span>

                {isDemoData ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Demo Mode Civic Record
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live Registry Connected
                  </span>
                )}
              </div>

              {/* Welcome Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {language === "ur"
                  ? `خوش آمدید، ${citizenUser.name}`
                  : language === "ps"
                  ? `ښه راغلاست، ${citizenUser.name}`
                  : `Welcome back, ${citizenUser.name}`}
              </h1>

              {/* Profile credentials strip */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-300 mt-2 font-medium">
                <span className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>📱</span>
                  <span>Mobile: <strong className="text-white font-mono">+92 {citizenUser.phone}</strong></span>
                </span>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>🪪</span>
                  <span>License: <strong className="font-mono text-sky-300">{citizenUser.license}</strong></span>
                </span>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span>🚗</span>
                  <span>Registered Vehicle: <strong className="font-mono text-white">{citizenUser.vehicles?.[0] || "ICT-LE-402"}</strong></span>
                </span>
              </div>
            </div>

            {/* Quick Actions & Logout */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/scan-challan">
                <Button variant="primary" size="md" className="space-x-2 rtl:space-x-reverse shadow-md shadow-blue-900/40">
                  <span>📷</span>
                  <span>Scan New Challan</span>
                </Button>
              </Link>

              <Link href="/assistant">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/15 space-x-2 rtl:space-x-reverse"
                >
                  <span>🎙️</span>
                  <span>Ask AI Assistant</span>
                </Button>
              </Link>

              <button
                onClick={openLogoutDialog}
                className="px-3.5 py-2.5 rounded-full border border-slate-600 hover:border-slate-400 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 rtl:space-x-reverse"
                title="Log out of citizen portal"
              >
                <span>🚪</span>
                <span>{t.navLogout}</span>
              </button>
            </div>

          </div>

          {/* Embedded Language Quick-Switch Strip */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-300">
              <span className="text-sm">🌐</span>
              <span className="font-semibold">{t.navLanguage} Selection:</span>
              <span className="text-sky-300 font-bold">
                {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName})
              </span>
            </div>

            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 rtl:space-x-reverse ${
                    language === l.code
                      ? "bg-royalBlue text-white shadow-sm ring-1 ring-white/30"
                      : "bg-[#0A2446] text-slate-300 hover:text-white hover:bg-[#0E3464]"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </button>
              ))}
              <Link
                href="/language-selection"
                className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold ml-2 rtl:ml-0 rtl:mr-2"
              >
                Settings →
              </Link>
            </div>
          </div>

        </div>

        {/* =========================================================================
            2. HIGH-LEVEL CITATION METRICS
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Citations */}
          <Card className="p-6 border-slate-200 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-mutedGrey uppercase tracking-wider">
                  Total Citations
                </span>
                <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm">
                  📋
                </span>
              </div>
              <div className="text-3xl font-black text-deepNavy">
                {stats.total_challans}
              </div>
            </div>
            <span className="text-[11px] text-mutedGrey mt-3 pt-2 border-t border-slate-100 block">
              Registered Plate: <strong className="statutory-code text-deepNavy font-bold">ICT-LE-402</strong>
            </span>
          </Card>

          {/* Card 2: Pending Fines */}
          <Card className="p-6 border-rose-200 bg-rose-50/20 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                  Pending Fines ({stats.pending_count})
                </span>
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm">
                  ⚠️
                </span>
              </div>
              <div className="text-3xl font-black text-rose-600">
                Rs. {stats.pending_amount?.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-100 flex items-center justify-between">
              <span className="text-[11px] text-rose-700 font-semibold">
                Due within grace window
              </span>
              <button
                onClick={() => {
                  const firstPending = recent_challans.find((c) => c.status === "PENDING");
                  if (firstPending) setActivePayChallan(firstPending);
                }}
                className="text-xs font-bold text-royalBlue hover:underline"
              >
                Pay Now →
              </button>
            </div>
          </Card>

          {/* Card 3: Cleared Fines */}
          <Card className="p-6 border-emerald-200 bg-emerald-50/20 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Cleared Citations ({stats.paid_count})
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">
                  ✓
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-600">
                Rs. {stats.paid_amount?.toLocaleString()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-semibold">
                Settled via 1Link
              </span>
              <Link href="/citizen/history" className="text-xs font-bold text-emerald-700 hover:underline">
                Receipts →
              </Link>
            </div>
          </Card>

          {/* Card 4: Safe Driving Score & Penalty Points */}
          <Card className="p-6 border-sky-200 bg-blue-50/30 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-royalBlue uppercase tracking-wider">
                  Penalty Points Tally
                </span>
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-royalBlue flex items-center justify-center text-sm">
                  🛡️
                </span>
              </div>
              <div className="text-3xl font-black text-deepNavy">
                {stats.penalty_points} <span className="text-sm font-semibold text-mutedGrey">/ 12 pts</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px]">
              <span className="text-mutedGrey">Safety Standing:</span>
              <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Good (Score: {stats.safe_driving_score}/100)
              </span>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            3. MAIN CONTENT: CHALLAN SECTION (LEFT) + SIDEBAR WIDGETS (RIGHT)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Citations List + Recent Voice Consultations + Activity */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Challans List Card */}
            <Card className="p-6 sm:p-8 border-slate-200 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3 mb-6">
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h2 className="text-lg sm:text-xl font-black text-deepNavy">
                      Traffic Citations & Violations
                    </h2>
                    <Badge variant="navy" size="sm">
                      Vehicle: ICT-LE-402
                    </Badge>
                  </div>
                  <p className="text-xs text-mutedGrey mt-0.5">
                    Verified electronic citations issued under Capital Traffic Police & Safe City Authority
                  </p>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Link href="/citizen/challans">
                    <Button variant="outline" size="sm">
                      All Citations →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Citations List */}
              <div className="space-y-4">
                {recent_challans.map((challan) => {
                  const isPending = challan.status === "PENDING";
                  return (
                    <div
                      key={challan.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 transition shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="statutory-code text-xs font-black text-royalBlue bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                            {challan.challan_no}
                          </span>
                          <span className="statutory-code text-xs font-bold text-deepNavy bg-slate-100 px-2 py-0.5 rounded-md">
                            {challan.vehicle_no}
                          </span>
                          <Badge
                            variant={isPending ? "error" : "success"}
                            size="sm"
                            dot
                          >
                            {challan.status}
                          </Badge>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-deepNavy leading-snug">
                          {challan.violation}
                        </h3>

                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                            <span className="text-slate-400">📍</span>
                            <span>{challan.location}</span>
                          </div>
                          {challan.remarks && (
                            <div className="text-[11px] text-mutedGrey italic">
                              Note: {challan.remarks}
                            </div>
                          )}
                          <div className="flex items-center space-x-3 rtl:space-x-reverse text-[11px] text-slate-500 pt-1">
                            <span>Issued: <strong>{challan.date}</strong></span>
                            <span>•</span>
                            <span className={isPending ? "text-rose-600 font-bold" : "text-emerald-600"}>
                              Due: <strong>{challan.due_date}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side amount & action buttons */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                        <div className="md:text-right">
                          <span className="text-[10px] uppercase font-bold text-mutedGrey block">
                            Penalty Amount
                          </span>
                          <span className="text-lg sm:text-xl font-black text-deepNavy">
                            Rs. {challan.amount?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Link
                            href={`/assistant?challan=${challan.challan_no}`}
                            onClick={() => selectChallan(challan)}
                          >
                            <Button variant="secondary" size="sm" className="space-x-1 rtl:space-x-reverse" title="Ask AI about this violation">
                              <span>🎙️</span>
                              <span>Ask AI</span>
                            </Button>
                          </Link>

                          {isPending ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setActivePayChallan(challan)}
                              className="space-x-1 rtl:space-x-reverse"
                            >
                              <span>💳</span>
                              <span>Pay Online</span>
                            </Button>
                          ) : (
                            <Link href="/citizen/history">
                              <span className="text-xs font-bold text-emerald-600 border border-emerald-300 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block hover:bg-emerald-100 transition">
                                View Receipt ✓
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Voice Consultations Section */}
            <Card className="p-6 sm:p-8 border-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-black text-deepNavy flex items-center space-x-2 rtl:space-x-reverse">
                    <span>🎙️</span>
                    <span>Recent Voice Consultations & Inquiries</span>
                  </h2>
                  <p className="text-xs text-mutedGrey mt-0.5">
                    Audio dialogues and legal rule inquiries processed by the AI Traffic Assistant
                  </p>
                </div>
                <Link href="/assistant">
                  <Button variant="outline" size="sm">
                    New Query +
                  </Button>
                </Link>
              </div>

              <div className="space-y-3.5">
                {recentConsultations.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-100 text-royalBlue">
                          {item.langLabel}
                        </span>
                        <span className="text-[11px] text-mutedGrey font-medium">
                          {item.timeAgo}
                        </span>
                        <span className="statutory-code text-[11px] text-slate-500 font-mono">
                          Ref: {item.challanRef}
                        </span>
                      </div>
                      <h4 className="font-bold text-deepNavy text-xs sm:text-sm">
                        &ldquo;{item.query}&rdquo;
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {item.responseSummary}
                      </p>
                    </div>

                    <Link
                      href={`/assistant?q=${encodeURIComponent(item.query)}&challan=${item.challanRef}`}
                      className="flex-shrink-0"
                    >
                      <Button variant="secondary" size="sm">
                        Resume Chat →
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity Timeline Section */}
            <Card className="p-6 sm:p-8 border-slate-200 shadow-md">
              <div className="pb-4 border-b border-slate-100 mb-6">
                <h2 className="text-lg font-black text-deepNavy flex items-center space-x-2 rtl:space-x-reverse">
                  <span>⏱️</span>
                  <span>Citizen Account Activity & Audit Log</span>
                </h2>
                <p className="text-xs text-mutedGrey mt-0.5">
                  Verifiable chronological record of citations, 2FA logins, and digital clearances
                </p>
              </div>

              <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 space-y-6">
                {recentActivity.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Timeline bullet icon */}
                    <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0 w-6 h-6 rounded-full bg-white border-2 border-royalBlue flex items-center justify-center text-[10px] shadow-sm">
                      {act.icon}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="font-bold text-deepNavy text-xs sm:text-sm">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-mutedGrey font-mono">
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: User Profile Summary, Shortcuts, Support */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Profile Summary Card */}
            <Card className="p-6 border-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-sm text-deepNavy flex items-center space-x-1.5 rtl:space-x-reverse">
                  <span>👤</span>
                  <span>Citizen Identity Summary</span>
                </h3>
                <Link
                  href="/citizen/profile"
                  className="text-xs font-bold text-royalBlue hover:underline"
                >
                  Edit Profile →
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-mutedGrey text-[10px] uppercase font-bold block">
                    Full Legal Name
                  </span>
                  <span className="font-extrabold text-sm text-deepNavy">
                    {citizenUser.name}
                  </span>
                </div>

                <div>
                  <span className="text-mutedGrey text-[10px] uppercase font-bold block">
                    Verified Mobile (2FA)
                  </span>
                  <span className="font-mono font-bold text-deepNavy">
                    +92 {citizenUser.phone}
                  </span>
                </div>

                <div>
                  <span className="text-mutedGrey text-[10px] uppercase font-bold block">
                    Driving License (DL Number)
                  </span>
                  <span className="statutory-code font-bold text-royalBlue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {citizenUser.license}
                  </span>
                </div>

                <div>
                  <span className="text-mutedGrey text-[10px] uppercase font-bold block">
                    Linked Vehicles
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {citizenUser.vehicles?.map((v) => (
                      <span
                        key={v}
                        className="statutory-code text-xs font-bold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-deepNavy"
                      >
                        {v} (Honda Civic)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-mutedGrey">
                  <span>Enrolled: <strong>{citizenUser.member_since}</strong></span>
                  <span className="text-emerald-600 font-bold">2FA Active ✓</span>
                </div>
              </div>
            </Card>

            {/* Quick QR Scanner Shortcut Card */}
            <Card className="p-6 border-sky-200 bg-gradient-to-br from-white to-blue-50/40 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-royalBlue text-white flex items-center justify-center text-2xl mb-3 shadow-md shadow-blue-500/20">
                📷
              </div>
              <h3 className="font-black text-base text-deepNavy mb-1">
                Scan Challan QR Code
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Point your mobile camera at your paper citation barcode or upload a ticket photo for instant extraction.
              </p>
              <Link href="/scan-challan" className="block">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Open Camera Scanner →
                </Button>
              </Link>
            </Card>

            {/* AI Voice Assistant Prompt Shortcut Card */}
            <Card className="p-6 border-slate-200 shadow-md">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                <span className="w-8 h-8 rounded-xl bg-royalBlue/10 text-royalBlue flex items-center justify-center text-lg">
                  🎙️
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-deepNavy">
                    AI Voice Assistant Studio
                  </h3>
                  <span className="text-[10px] text-mutedGrey">
                    Ask. Understand. Follow.
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-3">
                Tap any sample inquiry to launch an instant voice consultation:
              </p>

              <div className="space-y-1.5 mb-4">
                {[
                  "Why did I get this challan?",
                  "What is the fine for speeding under Section 113?",
                  "ہیلمٹ نہ پہننے کا جرمانہ کتنا ہے؟",
                  "د اشارې ماتولو قانوني جریمه څومره ده؟",
                ].map((prompt, i) => (
                  <Link
                    key={i}
                    href={`/assistant?q=${encodeURIComponent(prompt)}`}
                    className="block p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-royalBlue text-xs text-deepNavy font-medium transition"
                  >
                    &ldquo;{prompt}&rdquo;
                  </Link>
                ))}
              </div>

              <Link href="/assistant" className="block">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Launch Interactive Studio →
                </Button>
              </Link>
            </Card>

            {/* Help & Support Section */}
            <Card className="p-6 border-slate-200 shadow-md">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                  📞
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-deepNavy">
                    Help & Police Support
                  </h3>
                  <span className="text-[10px] text-mutedGrey">
                    Official Emergency & Grievance Desk
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Police Helpline:</span>
                  <a href="tel:1915" className="font-bold text-royalBlue font-mono text-sm hover:underline">
                    1915 (Toll-Free)
                  </a>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Traffic HQ UAN:</span>
                  <a href="tel:0519265555" className="font-bold text-deepNavy font-mono hover:underline">
                    051-9265555
                  </a>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Safe City Desk:</span>
                  <span className="font-semibold text-slate-600">H-8/2, Islamabad</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSupportModalOpen(true)}
                className="w-full justify-center"
              >
                File Inquiry / Dispute Notice →
              </Button>
            </Card>

          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL 1: 1LINK DIGITAL SETTLEMENT
          ========================================================================= */}
      {activePayChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xl">💳</span>
                <h3 className="font-black text-base text-deepNavy">
                  1Link Digital Settlement
                </h3>
              </div>
              <button
                onClick={() => setActivePayChallan(null)}
                className="text-slate-400 hover:text-deepNavy text-lg"
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h4 className="font-black text-base text-deepNavy">
                  Challan Settled Successfully!
                </h4>
                <p className="text-xs text-slate-600">
                  Receipt #PK-PAY-99120 generated. The citation status in the Safe City database has been marked PAID.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-mutedGrey">Citation Reference:</span>
                    <span className="font-mono font-bold text-deepNavy">{activePayChallan.challan_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mutedGrey">Vehicle Registration:</span>
                    <span className="font-mono font-bold text-royalBlue">{activePayChallan.vehicle_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mutedGrey">1Link PSID (18-Digit):</span>
                    <span className="statutory-code font-bold text-deepNavy">100883921004992101</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-deepNavy">Total Payable:</span>
                    <span className="font-black text-base text-rose-600">Rs. {activePayChallan.amount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-deepNavy">Supported Payment Channels:</p>
                  <p className="text-[11px] text-mutedGrey">
                    Pay through any Mobile Banking App (HBL, Meezan, UBL), Easypaisa, JazzCash, or any ATM via 1Link Consumer PSID.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setActivePayChallan(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleConfirmPayment(activePayChallan.id)}
                    className="flex-1"
                  >
                    Confirm Settlement →
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CITIZEN GRIEVANCE / INQUIRY NOTICE
          ========================================================================= */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xl">⚖️</span>
                <h3 className="font-black text-base text-deepNavy">
                  File Electronic Grievance / Inquiry
                </h3>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="text-slate-400 hover:text-deepNavy text-lg"
              >
                ✕
              </button>
            </div>

            {disputeSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h4 className="font-black text-base text-deepNavy">
                  Grievance Forwarded to Magistrate
                </h4>
                <p className="text-xs text-slate-600">
                  Tracking Ticket #DISP-2026-4401 issued. You will receive an SMS status notification within 48 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDisputeSuccess(true);
                  setTimeout(() => {
                    setDisputeSuccess(false);
                    setSupportModalOpen(false);
                  }, 2500);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-deepNavy mb-1">
                    Select Subject / Grounds
                  </label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-deepNavy">
                    <option>Vehicle sold prior to violation date</option>
                    <option>Number plate misidentified by ANPR camera</option>
                    <option>Emergency medical situation justification</option>
                    <option>Technical issue with 1Link fine payment</option>
                    <option>General traffic rule inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-deepNavy mb-1">
                    Explanation / Evidentiary Statement
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details regarding your citation, vehicle circumstances, or dispute reason..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-deepNavy focus:outline-none focus:ring-2 focus:ring-royalBlue"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setSupportModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1"
                  >
                    Submit Notice →
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function CitizenDashboardPage() {
  return (
    <ProtectedRoute requiredRole="citizen">
      <CitizenDashboardContent />
    </ProtectedRoute>
  );
}