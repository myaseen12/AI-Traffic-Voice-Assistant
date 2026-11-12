"use client";
import React from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      badge: "Step 1: Detection",
      title: "Scan the QR Code on Your Paper Challan",
      desc: "Every electronic citation issued by Pakistani traffic authorities (Safe City cameras, patrolling officers, highway wardens) contains an encrypted QR code token. Simply point your smartphone camera or upload a clear photo of the ticket.",
      detailList: [
        "Instant camera viewfinder with automatic QR detection",
        "Manual fallback: Enter your vehicle registration (e.g. ICT-LE-1234)",
        "Parses citation reference, violation timestamp, and issuing authority"
      ],
      icon: "📱",
      techBadge: "Vision QR & Token Parser",
    },
    {
      num: "02",
      badge: "Step 2: Verification",
      title: "Authorize Securely with 2-Factor OTP",
      desc: "To protect citizen privacy and ensure driving records remain confidential, a fast 6-digit one-time password (OTP) is sent via SMS to the mobile number registered with the vehicle's Excise & Taxation profile.",
      detailList: [
        "Ephemeral 60-second OTP expiration for maximum security",
        "Prevents third parties from inspecting your penalty points or vehicle details",
        "Grants an encrypted, private session token valid for your inquiry"
      ],
      icon: "🛡️",
      techBadge: "2FA Mobile Authorization",
    },
    {
      num: "03",
      badge: "Step 3: Preference",
      title: "Select Your Preferred Language (Urdu, Pashto, English)",
      desc: "No citizen should struggle with complicated English legal terminology. Choose between Urdu (اردو), Pashto (پښتو), or English. The entire interface and voice synthesis engine instantly adjusts.",
      detailList: [
        "Seamless RTL (Right-to-Left) typography with Nastaliq font styling",
        "Acoustic models calibrated for native regional pronunciation",
        "Switch language dynamically at any point during your conversation"
      ],
      icon: "🌐",
      techBadge: "Multilingual Engine",
    },
    {
      num: "04",
      badge: "Step 4: Voice Interaction",
      title: "Ask Your Query Freely by Voice or Text",
      desc: "Tap the microphone button and ask whatever you need to know: 'Why did I get this ticket?', 'How much is the fine?', 'Where was this violation recorded?', or 'Can I dispute this camera capture?'.",
      detailList: [
        "Whisper Speech-to-Text converts your speech into high-accuracy prompts",
        "Live audio soundwave visualizer provides immediate feedback while speaking",
        "Supports hands-free voice studio or traditional text messaging"
      ],
      icon: "🎙️",
      techBadge: "Whisper Acoustic AI",
    },
    {
      num: "05",
      badge: "Step 5: Resolution",
      title: "Receive Verified Answers & Digital Settlement Guidance",
      desc: "The assistant queries our ChromaDB legal vector database, retrieves the exact statutory section under the Motor Vehicles Ordinance 1965 or NHSO 2000, and speaks the answer aloud with clear next steps.",
      detailList: [
        "Displays legal section, fine amount, demerit points, and payment deadline",
        "Generates 18-digit 1Link PSID voucher for instant mobile app / ATM payment",
        "Provides 14-day formal electronic dispute review instructions if ticket was erroneous"
      ],
      icon: "✓",
      techBadge: "ChromaDB RAG & Coqui TTS",
    },
  ];

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
              <span className="text-white font-semibold">How It Works</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Step-by-Step Architecture
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              How the Assistant Works<span className="text-sky-400">?</span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              A frictionless 5-step journey that guides motorists from a confusing paper citation to complete legal clarity, rights awareness, and secure digital fine settlement.
            </p>
          </div>
        </div>
      </section>

      {/* Main Steps Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
        
        {/* Step Cards List */}
        <div className="space-y-6">
          {steps.map((step) => (
            <Card key={step.num} className="p-6 sm:p-8 hover:border-royalBlue/40 transition-colors">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Number & Icon Badge */}
                <div className="lg:col-span-2 flex lg:flex-col items-center justify-between lg:justify-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-royalBlue to-brightBlue text-white flex items-center justify-center text-xl font-black shadow-md shadow-blue-900/20">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-deepNavy flex items-center justify-center text-2xl shadow-subtle">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-royalBlue uppercase tracking-wider">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-deepNavy">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>

                  <ul className="space-y-1.5 pt-2 text-xs text-slate-700">
                    {step.detailList.map((item, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical Badge & Action */}
                <div className="lg:col-span-3 flex lg:flex-col items-end lg:items-start justify-between h-full pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
                  <div>
                    <span className="text-[10px] text-mutedGrey uppercase tracking-wider block font-bold mb-1">
                      Component Stack
                    </span>
                    <Badge variant="info" size="sm">
                      {step.techBadge}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={step.num === "01" ? "/scan-challan" : step.num === "03" ? "/language-selection" : "/assistant"}
                      className="text-xs font-bold text-royalBlue hover:text-brightBlue flex items-center space-x-1"
                    >
                      <span>Try This Step</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>

        {/* Security & Data Privacy Panel */}
        <div className="bg-gradient-to-r from-[#DCEBFF] to-[#EBF3FC] border border-blue-200/90 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-deepNavy text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
              🛡️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-deepNavy mb-1">
                Security & Data Integrity Assured
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed max-w-xl">
                Every voice recording is processed in volatile memory (RAM) and immediately cleared after text transcription. Your National Identity (CNIC) and mobile records are isolated behind encrypted 2FA barriers.
              </p>
            </div>
          </div>
          <Link href="/privacy-policy" className="flex-shrink-0">
            <Button variant="dark" size="sm">
              Read Privacy Policy →
            </Button>
          </Link>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <h3 className="text-lg font-bold text-deepNavy mb-2">Ready to test with your challan?</h3>
          <p className="text-xs text-mutedGrey mb-5">Try scanning a physical ticket or launch the voice assistant in public mode.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/scan-challan">
              <Button variant="primary" size="md">
                📱 Scan Challan QR Code
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="outline" size="md">
                🎙️ Open Voice Assistant Studio
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
