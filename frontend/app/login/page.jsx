"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "../../services/authService";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/citizen/dashboard";
  const justLoggedOut = searchParams.get("logged_out") === "true";

  const [phoneNumber, setPhoneNumber] = useState("03009876543");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const formatPhoneInput = (val) => {
    // Keep only numbers and plus
    return val.replace(/[^\d+]/g, "");
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, "");
    // Valid Pakistani numbers: 03XXXXXXXXX (11 digits) or +923XXXXXXXXX (13 chars) or 3XXXXXXXXX (10 digits)
    const pakPhoneRegex = /^((\+923\d{9})|(03\d{9})|(3\d{9}))$/;
    if (!cleaned) {
      return "Mobile phone number is required";
    }
    if (!pakPhoneRegex.test(cleaned)) {
      return "Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567)";
    }
    return "";
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const vErr = validatePhone(phoneNumber);
    if (vErr) {
      setValidationError(vErr);
      return;
    }
    setValidationError("");
    setError("");
    setLoading(true);

    try {
      const data = await authService.sendOtp(phoneNumber);
      const demoParam = data?.otp_demo ? `&demo_otp=${encodeURIComponent(data.otp_demo)}` : "";
      // Navigate to OTP verification page
      router.push(
        `/verify-otp?phone=${encodeURIComponent(phoneNumber)}&redirect=${encodeURIComponent(
          redirectTarget
        )}${demoParam}`
      );
    } catch (err) {
      setError(err.message || "Failed to dispatch verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F7F9FC] min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        
        {/* Logged Out Toast Notification */}
        {justLoggedOut && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center space-x-2 shadow-sm animate-in fade-in">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>You have been securely signed out. Session token cleared.</span>
          </div>
        )}

        <Card className="p-7 sm:p-9 shadow-xl border-slate-200">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-lightBlue text-royalBlue border border-blue-200/90 flex items-center justify-center text-2xl font-bold mb-3 shadow-subtle">
              📱
            </div>
            <Badge variant="navy" className="mb-2 bg-deepNavy text-sky-300 border-slate-700">
              Citizen Self-Service Portal
            </Badge>
            <h1 className="text-2xl font-black text-deepNavy tracking-tight">
              Sign In with Mobile
            </h1>
            <p className="text-xs text-mutedGrey mt-1 max-w-xs mx-auto">
              Enter your registered mobile number to receive a secure 6-digit one-time password (OTP).
            </p>
          </div>

          {/* Backend Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-5 flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-deepNavy mb-1.5">
                Pakistani Mobile Number <span className="text-red-500">*</span>
              </label>

              <div className="relative rounded-xl">
                {/* Country Code Prefix Pill */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-500 border-r border-slate-200 pr-2.5 my-1.5">
                  <span className="mr-1">🇵🇰</span>
                  <span>+92</span>
                </div>

                <input
                  type="tel"
                  placeholder="0300 1234567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(formatPhoneInput(e.target.value));
                    if (validationError) setValidationError("");
                  }}
                  className={`w-full bg-slate-50 border rounded-xl text-xs sm:text-sm text-deepNavy placeholder-slate-400 font-mono font-medium py-3 pl-24 pr-4 focus:outline-none focus:ring-2 focus:ring-royalBlue/20 focus:bg-white transition ${
                    validationError ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-royalBlue"
                  }`}
                />
              </div>

              {validationError ? (
                <p className="mt-1.5 text-[11px] text-red-600 font-medium">
                  {validationError}
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-mutedGrey">
                  Must be registered with your vehicle / CNIC profile
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20"
            >
              Send 6-Digit SMS OTP →
            </Button>
          </form>

          {/* Quick Demo Citizen Test Numbers */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-mutedGrey mb-2">
              <span className="font-semibold text-deepNavy">Demo Test Numbers:</span>
              <span className="text-[10px] text-royalBlue bg-lightBlue px-2 py-0.5 rounded font-mono font-bold">
                OTP: 123456
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber("03009876543");
                  setValidationError("");
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-left font-mono text-[11px] transition ${
                  phoneNumber === "03009876543"
                    ? "border-royalBlue bg-blue-50/50 text-royalBlue font-bold"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50"
                }`}
              >
                0300 9876543
                <span className="block text-[9px] font-sans text-mutedGrey font-normal">Active Citations</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhoneNumber("03001234567");
                  setValidationError("");
                }}
                className={`py-1.5 px-2.5 rounded-lg border text-left font-mono text-[11px] transition ${
                  phoneNumber === "03001234567"
                    ? "border-royalBlue bg-blue-50/50 text-royalBlue font-bold"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50"
                }`}
              >
                0300 1234567
                <span className="block text-[9px] font-sans text-mutedGrey font-normal">Clean Record</span>
              </button>
            </div>
          </div>

          {/* Notice & Admin Gateway */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5 text-center text-xs">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
              <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                ℹ️ Sandbox Simulation Notice
              </span>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Live telecom SMS gateway integration will be active upon department deployment. In this sandbox, entering any mobile number accepts development OTP code <code>123456</code>.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-mutedGrey pt-2">
              <Link href="/scan-challan" className="text-royalBlue font-bold hover:underline">
                📷 Scan Ticket Instead
              </Link>
              <span>•</span>
              <Link href="/admin/login" className="text-slate-600 hover:text-deepNavy font-semibold">
                Officer / Admin Sign In →
              </Link>
            </div>
          </div>

        </Card>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-royalBlue border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
