"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "03009876543";
  const redirectTarget = searchParams.get("redirect") || "/citizen/dashboard";
  const demoOtpParam = searchParams.get("demo_otp");

  const { login } = useAuth();

  // 6-digit segmented input state (pre-populates demo OTP in development mode if returned)
  const [digits, setDigits] = useState(() => {
    if (demoOtpParam && demoOtpParam.length === 6) {
      return demoOtpParam.split("");
    }
    return ["1", "2", "3", "4", "5", "6"];
  });
  const inputRefs = useRef([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Resend Countdown Timer (starts at 60 seconds)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle single digit changes
  const handleDigitChange = (index, value) => {
    if (error) setError("");
    const char = value.slice(-1); // Only keep the last entered character
    if (char && !/^\d+$/.test(char)) return; // Only numbers

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle clipboard paste of complete 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newDigits = pastedData.split("");
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const currentOtp = digits.join("");

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (currentOtp.length < 6) {
      setError("Please enter all 6 digits of the OTP code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authService.verifyOtp(phone, currentOtp);
      login(data.access_token, data.user);
      setSuccess(true);
      // Brief success animation before redirect
      setTimeout(() => {
        router.push(redirectTarget);
      }, 1200);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendStatus("Dispatching new OTP...");
    setError("");

    try {
      const data = await authService.sendOtp(phone);
      setTimer(data.cooldown_seconds || 60);
      setCanResend(false);
      if (data.otp_demo) {
        setDigits(data.otp_demo.split(""));
        setResendStatus(`Code dispatched. Dev OTP: ${data.otp_demo}`);
      } else {
        setResendStatus("A new 6-digit code has been sent via SMS.");
      }
      setTimeout(() => setResendStatus(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
      setResendStatus("");
    }
  };

  const fillDemoCode = () => {
    setDigits(["1", "2", "3", "4", "5", "6"]);
    setError("");
  };

  return (
    <div className="bg-[#F7F9FC] min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        
        <Card className="p-7 sm:p-9 shadow-xl border-slate-200">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/90 flex items-center justify-center text-2xl font-bold mb-3 shadow-subtle">
              ✉️
            </div>
            <Badge variant="success" className="mb-2">
              SMS Authorization
            </Badge>
            <h1 className="text-2xl font-black text-deepNavy tracking-tight">
              Enter Verification Code
            </h1>
            <p className="text-xs text-mutedGrey mt-1 max-w-xs mx-auto">
              We sent a 6-digit one-time code to:
            </p>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className="font-mono font-bold text-sm text-deepNavy">
                +92 {phone}
              </span>
              <Link
                href="/login"
                className="text-[11px] text-royalBlue hover:underline font-semibold"
              >
                (Change)
              </Link>
            </div>
          </div>

          {/* Success State Notification */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-4 rounded-xl mb-5 text-center font-bold flex items-center justify-center space-x-2 animate-in zoom-in-95">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </span>
              <span>Verification Successful! Redirecting...</span>
            </div>
          )}

          {/* Error State Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl mb-5 flex items-start space-x-2 animate-in shake">
              <span className="font-bold">✕</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Segmented 6-Digit OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <div className="flex justify-between items-center gap-2 max-w-xs mx-auto" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={loading || success}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-11 h-13 text-center text-xl font-mono font-black rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-royalBlue/20 ${
                      error
                        ? "border-red-400 bg-red-50/40 text-red-700"
                        : success
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : digit
                        ? "border-royalBlue bg-blue-50/30 text-deepNavy"
                        : "border-slate-300 bg-slate-50 text-deepNavy"
                    }`}
                  />
                ))}
              </div>

              {/* Demo Auto-fill Helper */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={fillDemoCode}
                  className="text-[11px] text-royalBlue hover:underline font-semibold bg-lightBlue px-2.5 py-1 rounded-full"
                >
                  ⚡ Autofill Demo Code (123456)
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={success || currentOtp.length < 6}
              className="w-full text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20"
            >
              {success ? "Verified ✓" : "Verify & Authorize Citizen Session →"}
            </Button>
          </form>

          {/* Resend OTP Timer Controls */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs">
            {resendStatus && (
              <p className="text-[11px] text-emerald-700 font-semibold mb-2">
                {resendStatus}
              </p>
            )}

            <div className="text-slate-600">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-royalBlue font-bold hover:underline"
                >
                  Didn&apos;t receive code? Resend SMS OTP
                </button>
              ) : (
                <div className="text-mutedGrey text-[11px] flex items-center justify-center space-x-1.5">
                  <span>Resend code in:</span>
                  <span className="font-mono font-bold text-deepNavy bg-slate-100 px-2 py-0.5 rounded">
                    00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-mutedGrey">
              <Link href="/login" className="hover:text-deepNavy">
                ← Back to Mobile Entry
              </Link>
              <Link href="/contact" className="hover:text-deepNavy">
                Need Help?
              </Link>
            </div>
          </div>

        </Card>

      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-royalBlue border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
