"use client";
import React from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <span className="text-white font-semibold">Privacy Policy</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Data Protection & Citizen Rights
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Citizen Data & <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Effective Date: November 2026 • We adhere to strict civic data minimization and ephemeral audio processing standards. Your voice and driving records are safeguarded.
            </p>
          </div>
        </div>
      </section>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-8">
        
        {/* Core Guarantee Card */}
        <div className="bg-gradient-to-r from-[#061D38] to-[#0A2B50] rounded-2xl p-6 sm:p-8 text-white border border-sky-500/30 shadow-card">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-cyan-300 flex items-center justify-center text-2xl flex-shrink-0">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1.5">
                Our Ephemeral Voice Processing Commitment
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you speak to the AI Traffic Voice Assistant, your microphone audio stream is held solely in volatile memory (RAM) for the few seconds required to transcribe your words via Whisper Speech-to-Text. Once transcribed, <strong>the audio recording is immediately destroyed</strong>. We never build voice biometric profiles or sell voice data.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Information We Process */}
        <Card className="p-6 sm:p-8 space-y-4">
          <Badge variant="info">Section 1</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Information We Process to Provide Service
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To provide accurate citation explanations, calculate fines, and authenticate ticket ownership, our platform processes only the following necessary data points:
          </p>

          <ul className="space-y-3 text-xs text-slate-700 pl-2">
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <div>
                <strong>Ephemeral Spoken Audio:</strong> Processed in real-time during your active voice session to generate text inquiries.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <div>
                <strong>Mobile Phone Number:</strong> Used strictly for two-factor authentication (2FA) via a 6-digit SMS OTP to prevent unauthorized individuals from viewing your citations.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <div>
                <strong>Vehicle Registration & Citation Identifiers:</strong> Your license plate (e.g. <code>ICT-LE-1234</code>) or challan code (e.g. <code>PK-2024-883921</code>) to pull verified violation telemetry from authorized e-challan systems.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <div>
                <strong>Local Storage Preferences:</strong> Your preferred language (<code>preferred_lang: 'ur' | 'ps' | 'en'</code>) and encrypted JWT bearer token stored locally on your device browser.
              </div>
            </li>
          </ul>
        </Card>

        {/* Section 2: What We Never Collect */}
        <Card className="p-6 sm:p-8 space-y-4">
          <Badge variant="neutral">Section 2</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            What We Explicitly Never Collect or Store
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900">
              <div className="font-bold text-rose-800 mb-1">✕ No Voice Biometrics</div>
              <p className="text-[11px] leading-relaxed">We do not analyze voiceprints or acoustic biometric signatures.</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900">
              <div className="font-bold text-rose-800 mb-1">✕ No Financial Credentials</div>
              <p className="text-[11px] leading-relaxed">We never request or store debit card PINs, CVVs, or mobile banking passwords.</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900">
              <div className="font-bold text-rose-800 mb-1">✕ No Live GPS Tracking</div>
              <p className="text-[11px] leading-relaxed">We do not track continuous device location or vehicle movement paths.</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900">
              <div className="font-bold text-rose-800 mb-1">✕ No Third-Party Advertising</div>
              <p className="text-[11px] leading-relaxed">Zero tracking pixels, ad networks, or commercial telemetry brokers.</p>
            </div>
          </div>
        </Card>

        {/* Section 3: Data Security & 2FA Protection */}
        <Card className="p-6 sm:p-8 space-y-4">
          <Badge variant="info">Section 3</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Two-Factor Authentication (OTP) & Session Security
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Traffic citation details contain sensitive driving records. To uphold the highest standards of citizen privacy:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-2">
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>60-Second TTL:</strong> OTP tokens expire within 60 seconds of generation.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Brute-Force Rate Limiting:</strong> Automated IP throttling locks attempts after 5 consecutive invalid entries.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>JWT Encryption:</strong> Authentication tokens are signed using industry-standard HS256 algorithms with strict expiry.</span>
            </li>
          </ul>
        </Card>

        {/* Section 4: Citizen Control & Data Rights */}
        <Card className="p-6 sm:p-8 space-y-4">
          <Badge variant="info">Section 4</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Citizen Control & Deletion Rights
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every citizen using our platform retains full autonomy over their interactions:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-2">
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <span><strong>Clear History Anytime:</strong> You can purge all past conversational transcripts directly from the <Link href="/citizen/history" className="text-royalBlue underline font-semibold">Chat History</Link> tab.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <span><strong>Immediate Session Logout:</strong> Clicking &apos;Logout&apos; immediately destroys the client-side authentication token in your browser.</span>
            </li>
          </ul>
        </Card>

        {/* Section 5: Data Protection Contact */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-deepNavy mb-1">Questions regarding data protection or privacy?</div>
            <p className="text-[11px] text-mutedGrey">Our civic technology compliance team can be contacted directly.</p>
          </div>
          <Link href="/contact">
            <Button variant="outline" size="sm" className="bg-white">
              Contact Privacy Officer →
            </Button>
          </Link>
        </div>

      </div>

    </div>
  );
}
