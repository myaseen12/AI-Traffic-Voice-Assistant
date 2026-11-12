"use client";
import React from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function AboutPage() {
  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen">
      
      {/* Page Header Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <span className="text-white font-semibold">About Us</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Civic Technology & Public Awareness
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              About AI Traffic <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                Voice Assistant
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              An independent, public-service technology platform engineered to empower citizens across Pakistan with instant, verified legal clarity regarding electronic traffic citations and statutory road safety laws.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-12">
        
        {/* Core Mission & Challenge in Pakistan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-8">
              <Badge variant="info" className="mb-2.5">
                Our Mission
              </Badge>
              <h2 className="text-xl sm:text-2xl font-extrabold text-deepNavy mb-3">
                Bridging the Gap Between Citizens and Traffic Law
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Across Pakistan&apos;s major urban centers—including Islamabad, Lahore, Karachi, Rawalpindi, Peshawar, and Quetta—as well as national motorways (M-1, M-2, M-9), intelligent Safe City automated cameras issue tens of thousands of electronic citations daily.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                While automated enforcement improves road safety, many drivers receive paper or SMS citations with technical legal jargon, unclear fine schedules, or confusing dispute timelines. For citizens who prefer their mother tongue or struggle with complex legal English, understanding their rights can feel overwhelming.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold text-deepNavy">
                AI Traffic Voice Assistant was created to eliminate this friction: enabling anyone to scan a QR code, ask a question in spoken Urdu, Pashto, or English, and receive an instant, verified explanation of the law.
              </p>
            </Card>

            {/* Trilingual Architecture Card */}
            <Card className="p-6 sm:p-8">
              <Badge variant="neutral" className="mb-2.5">
                Linguistic Accessibility
              </Badge>
              <h3 className="text-lg sm:text-xl font-bold text-deepNavy mb-3">
                Built Trilingual from the Ground Up
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Language should never be a barrier to civic justice and road safety awareness. Our acoustic and generative AI models are specially trained on regional Pakistani dialects:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#F7F9FC] border border-slate-200 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">🇵🇰</div>
                  <div className="font-bold text-xs text-deepNavy">اردو (Urdu)</div>
                  <div className="text-[11px] text-mutedGrey mt-1">National lingua franca with Nastaliq UI</div>
                </div>
                <div className="bg-[#F7F9FC] border border-slate-200 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">🇦🇫</div>
                  <div className="font-bold text-xs text-deepNavy">پښتو (Pashto)</div>
                  <div className="text-[11px] text-mutedGrey mt-1">Fluent northern & western regional voice</div>
                </div>
                <div className="bg-[#F7F9FC] border border-slate-200 p-4 rounded-xl text-center">
                  <div className="text-2xl mb-1">🇬🇧</div>
                  <div className="font-bold text-xs text-deepNavy">English</div>
                  <div className="text-[11px] text-mutedGrey mt-1">Standard statutory legal terminology</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Statutory Grounding & Technology Pillars */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Zero-Hallucination Guarantee */}
            <div className="bg-gradient-to-br from-[#061D38] to-[#0A2E58] text-white rounded-2xl p-6 sm:p-7 shadow-card border border-sky-500/20">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-cyan-300 flex items-center justify-center text-xl mb-3">
                ⚖️
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                Strict Statutory Grounding
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Our AI does not invent laws, penalties, or arbitrary deadlines. Every answer is indexed and cross-checked against authorized statutes:
              </p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Motor Vehicles Ordinance 1965 (MVO 1965)</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>National Highways Safety Ordinance 2000 (NHSO 2000)</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Official Safe City e-Challan Penalty Schedules</strong></span>
                </li>
              </ul>
            </div>

            {/* Core Architectural Pillars */}
            <Card className="p-6">
              <h4 className="text-xs font-bold text-mutedGrey uppercase tracking-wider mb-4">
                Underlying Technology Stack
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-lightBlue text-royalBlue flex items-center justify-center font-bold flex-shrink-0">
                    STT
                  </div>
                  <div>
                    <div className="font-bold text-deepNavy">Whisper Speech-to-Text</div>
                    <div className="text-mutedGrey text-[11px]">Robust regional acoustic recognition</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-lightBlue text-royalBlue flex items-center justify-center font-bold flex-shrink-0">
                    RAG
                  </div>
                  <div>
                    <div className="font-bold text-deepNavy">ChromaDB Vector Store</div>
                    <div className="text-mutedGrey text-[11px]">Direct legal document semantic retrieval</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-lightBlue text-royalBlue flex items-center justify-center font-bold flex-shrink-0">
                    TTS
                  </div>
                  <div>
                    <div className="font-bold text-deepNavy">Coqui Natural Voice Synthesis</div>
                    <div className="text-mutedGrey text-[11px]">Clear spoken audio playback in Urdu, Pashto, English</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-lightBlue text-royalBlue flex items-center justify-center font-bold flex-shrink-0">
                    SEC
                  </div>
                  <div>
                    <div className="font-bold text-deepNavy">2FA OTP & Ephemeral Audio</div>
                    <div className="text-mutedGrey text-[11px]">RAM-only inference; no stored voice recordings</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Official Civic Notice */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 text-amber-900 text-xs">
              <div className="font-bold flex items-center space-x-1.5 mb-1 text-amber-800">
                <span>ℹ️</span>
                <span>Civic Technology Notice</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                AI Traffic Voice Assistant is an independent public-interest technology service. It does not replace judicial courts or official police headquarters. Official payments are processed directly through 1Link authorized banking rails.
              </p>
            </div>

          </div>

        </div>

        {/* Call to Action Bar */}
        <div className="bg-[#092B50] rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-1">Explore Statutory Traffic Laws</h3>
            <p className="text-xs text-slate-300">Browse verified traffic regulations, fine brackets, and license point schedules.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/traffic-rules">
              <Button variant="primary" size="md">
                View Traffic Rules Directory →
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="outline" size="md" className="bg-transparent text-white border-white/30 hover:bg-white/10">
                Launch Voice Studio
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
