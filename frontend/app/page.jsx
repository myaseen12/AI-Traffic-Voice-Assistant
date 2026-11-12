"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useChallan } from "../context/ChallanContext";
import { challanService } from "../services/challanService";
import ChallanCard from "../components/ChallanCard";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Card from "../components/Card";
import PhoneVoiceMockup from "../components/PhoneVoiceMockup";

export default function HomePage() {
  const { language, changeLanguage } = useLanguage();
  const { selectChallan } = useChallan();

  // Search & Loading state
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState("");

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoOtp, setDemoOtp] = useState("123456");
  const [otpVerified, setOtpVerified] = useState(false);
  const [demoLang, setDemoLang] = useState("ur");

  // Interactive Language Showcase Tab
  const [activeLangTab, setActiveLangTab] = useState("ur");

  // FAQ Accordion State (open question index)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Search Vehicle Registration
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!vehicleQuery.trim()) return;
    setLoading(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const data = await challanService.search(vehicleQuery.trim());
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message || "No citation found for this vehicle registration");
    } finally {
      setLoading(false);
    }
  };

  // Simulate QR Code Scanner
  const handleSimulateQRScan = async (challanCode = "PK-2024-883921") => {
    setLoading(true);
    setQrModalOpen(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/challans/qr-decode`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_data: challanCode }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSearchResults([data]);
        selectChallan(data);
      } else {
        setSearchError(data.detail || "QR code decoding failed");
      }
    } catch (e) {
      setSearchError("Could not connect to verification server");
    } finally {
      setLoading(false);
    }
  };

  // Language Showcase data
  const languageSamples = {
    ur: {
      name: "اردو (Urdu)",
      flag: "🇵🇰",
      query: "مجھے یہ چالان کس وجہ سے ملا ہے اور اس کا جرمانہ کتنا ہے؟",
      answer:
        "آپ کو اسلام آباد ایکسپریس وے پر حد رفتار سے زیادہ تیز رفتاری (سیکشن 113) پر چالان جاری کیا گیا ہے۔ کل جرمانہ 5,000 روپے ہے، جسے آپ 14 دنوں میں آن لائن یا بینک کے ذریعے ادا کر سکتے ہیں۔",
      section: "موٹر وہیکلز آرڈیننس، سیکشن 113",
      fine: "5,000 روپے",
      due: "14 دن باقی",
    },
    ps: {
      name: "پښتو (Pashto)",
      flag: "🇦🇫",
      query: "ما ته دا چالان ولې راکړل شو او جریمه یې څومره ده؟",
      answer:
        "تاسو ته د اسلام آباد په لویه لار د تیز رفتارۍ (۱۱۳ برخه) له امله چالان درکړل شوی دی. ټوله جریمه ۵،۰۰۰ کلدارې ده چې تاسو یې په ۱۴ ورځو کې په آنلاین بڼه ورکولی شئ.",
      section: "د موټرو قانون، ۱۱۳ برخه",
      fine: "۵،۰۰۰ کلدارې",
      due: "۱۴ ورځې پاتې",
    },
    en: {
      name: "English",
      flag: "🇬🇧",
      query: "Why did I receive this citation and what is the exact penalty amount?",
      answer:
        "You were cited for exceeding the posted speed limit (70 km/h in an 80 km/h zone) on Islamabad Expressway under Section 113. Total fine is Rs. 5,000, payable within 14 days via 1Link or any designated bank branch.",
      section: "Motor Vehicles Ordinance, Section 113",
      fine: "Rs. 5,000",
      due: "14 Days Remaining",
    },
  };

  // Realistic Civic FAQs
  const faqs = [
    {
      q: "How does the AI assistant access my specific traffic citation?",
      a: "When you scan the QR code printed on your paper ticket or enter your vehicle registration number, the system securely decodes the encrypted citation identifier. After you verify identity via a one-time SMS OTP, your specific citation details (violation code, speed telemetry, officer notes) are loaded into your private session.",
    },
    {
      q: "Can I speak directly in Urdu or Pashto without typing?",
      a: "Yes. Our Speech-to-Text engine utilizes customized Whisper acoustic models tuned for regional accents across Pakistan. You can simply tap the microphone button and ask questions naturally in Urdu, Pashto, or English. The assistant will answer with both synchronized text and synthesized natural voice.",
    },
    {
      q: "Are the traffic rules, fines, and legal sections verified?",
      a: "Yes, 100%. The assistant operates using Retrieval-Augmented Generation (RAG) directly anchored in official statutory texts: the Motor Vehicles Ordinance 1965 and the National Highways Safety Ordinance 2000. It never fabricates laws, arbitrary fine amounts, or non-existent penalties.",
    },
    {
      q: "How can I pay my traffic challan digitally?",
      a: "Every challan includes an official 18-digit 1Link Consumer Number (PSID). You can pay instantly through any mobile banking application (HBL, Meezan, UBL, etc.), Easypaisa, JazzCash, or at any ATM across Pakistan by selecting 'Govt / Traffic Fines'.",
    },
    {
      q: "What should I do if I believe a challan was issued in error?",
      a: "You have the statutory right to contest a violation within 14 days of issuance. The assistant guides you on the exact procedural steps, required photo/dashcam evidence, and allows you to file an electronic dispute review directly for the senior traffic adjudication magistrate.",
    },
    {
      q: "Is my voice recording or personal citizen data stored permanently?",
      a: "No. Your voice audio stream is processed ephemerally in RAM strictly for speech-to-text inference and is deleted immediately after processing. We do not store citizen voice biometric profiles, fulfilling strict civic data protection standards.",
    },
  ];

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen">

      {/* =========================================================================
          1. HERO SECTION (Pakistani Traffic Authority Theme matching Reference Image 1)
          ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white pt-8 pb-20 sm:pb-24 overflow-hidden border-b border-[#0D3868]">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines, Feature Badges & CTAs */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center pt-2 lg:pt-0">
              
              {/* Top Badge: Pakistan's Smart Traffic Solution */}
              <div className="inline-flex items-center space-x-2 bg-[#0C2B4E]/90 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-xs font-semibold w-fit mb-6 shadow-md shadow-emerald-950/20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] inline-block animate-pulse"></span>
                <span className="text-emerald-300 font-bold tracking-wide">
                  Pakistan's Smart Traffic Solution
                </span>
              </div>

              {/* Main Heading: AI Traffic Voice Assistant */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4">
                AI Traffic <br />
                <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent drop-shadow-sm">
                  Voice Assistant
                </span>
              </h1>

              {/* Tagline & Subheading */}
              <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-3">
                <span>Ask. Understand. Follow.</span>
                <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-7 font-normal">
                Get instant explanation of your traffic violation in your preferred language —{" "}
                <span className="text-white font-semibold">Urdu</span>,{" "}
                <span className="text-white font-semibold">Pashto</span> or{" "}
                <span className="text-white font-semibold">English</span> using voice or text.
              </p>

              {/* Quick Feature Chips Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8 max-w-xl">
                <div className="flex items-center space-x-2 bg-[#0B2544]/80 border border-slate-700/60 rounded-xl px-2.5 py-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    🎙️
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">
                    Voice Assistant
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-[#0B2544]/80 border border-slate-700/60 rounded-xl px-2.5 py-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    🌐
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                    Multi-Language
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-[#0B2544]/80 border border-slate-700/60 rounded-xl px-2.5 py-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    📱
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">
                    QR Code Access
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-[#0B2544]/80 border border-slate-700/60 rounded-xl px-2.5 py-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    🛡️
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">
                    Know Your Rights
                  </span>
                </div>
              </div>

              {/* Action Buttons: Speak Your Query & Scan Challan */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Link
                  href="/assistant"
                  className="bg-gradient-to-r from-royalBlue to-brightBlue hover:from-brightBlue hover:to-royalBlue text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-full shadow-lg shadow-blue-600/30 flex items-center space-x-2.5 transition transform hover:scale-[1.02]"
                >
                  <span className="text-base">🎙️</span>
                  <span>Speak Your Query</span>
                  <span className="text-base font-bold">→</span>
                </Link>

                <button
                  onClick={() => setQrModalOpen(true)}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full backdrop-blur-md flex items-center space-x-2 transition"
                >
                  <span>📱</span>
                  <span>Scan Challan QR</span>
                </button>

                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="text-xs text-sky-300 hover:text-white flex items-center space-x-1.5 px-3 py-2 transition"
                >
                  <span className="w-4 h-4 rounded-full bg-sky-500/30 flex items-center justify-center text-[9px]">
                    ▶
                  </span>
                  <span>Watch Demo</span>
                </button>
              </div>

            </div>

            {/* Right Column: Code-Rendered Smartphone Voice Assistant Mockup */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center pt-6 lg:pt-0">
              
              {/* Concentric Audio Radar Pulse Rings */}
              <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full border border-sky-400/20 animate-radar pointer-events-none"></div>
              <div className="absolute w-[440px] h-[440px] sm:w-[560px] sm:h-[560px] rounded-full border border-sky-400/10 animate-radar-delayed pointer-events-none"></div>

              {/* High-tech Smartphone Voice Mockup */}
              <PhoneVoiceMockup />

            </div>

          </div>
        </div>

        {/* =========================================================================
            STATS RIBBON BAR
            ========================================================================= */}
        <div className="max-w-6xl mx-auto px-4 -mb-16 sm:-mb-20 pt-12 relative z-30">
          <div className="bg-[#092B50]/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(8,117,223,0.25)] text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-700/60 items-center">
              
              <div className="flex items-center space-x-3.5 px-3 py-1">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl flex-shrink-0">
                  👥
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    1M+
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Citizens Helped
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 px-3 py-1 pt-3 md:pt-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    99%
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Verified Accuracy
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 px-3 py-1 pt-3 md:pt-1">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    24/7
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Availability
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 px-3 py-1 pt-3 md:pt-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
                  🇵🇰
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Pakistan
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Wide Support
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          2. HOW IT WORKS (5 Connected Steps + Security Assurance)
          ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#DCEBFF] text-royalBlue text-xs font-bold px-3.5 py-1 rounded-full mb-2.5">
            Simple 5-Step Process
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-deepNavy tracking-tight">
            How It Works<span className="text-royalBlue">?</span>
          </h2>
          <p className="text-xs sm:text-sm text-mutedGrey mt-2 max-w-lg mx-auto">
            Get your traffic violation details and accurate legal rights in five easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 5-Step Connected Container */}
          <div className="lg:col-span-9 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-card flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-center">
              
              {/* Step 1 */}
              <div
                onClick={() => setQrModalOpen(true)}
                className="flex flex-col items-center group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-royalBlue text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                  1
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl mb-2 text-deepNavy group-hover:border-royalBlue transition">
                  📱
                </div>
                <h4 className="font-extrabold text-xs text-deepNavy leading-tight">
                  Scan QR Code
                </h4>
                <p className="text-[11px] text-mutedGrey mt-0.5">
                  on your Challan ticket
                </p>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => setOtpModalOpen(true)}
                className="flex flex-col items-center group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-royalBlue text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                  2
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl mb-2 text-emerald-500 group-hover:border-royalBlue transition">
                  🛡️
                </div>
                <h4 className="font-extrabold text-xs text-deepNavy leading-tight">
                  Verify with OTP
                </h4>
                <p className="text-[11px] text-mutedGrey mt-0.5">
                  for secure authorization
                </p>
              </div>

              {/* Step 3 */}
              <Link
                href="/language-selection"
                className="flex flex-col items-center group p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-royalBlue text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                  3
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl mb-2 text-royalBlue group-hover:border-royalBlue transition font-serif font-bold">
                  A文
                </div>
                <h4 className="font-extrabold text-xs text-deepNavy leading-tight">
                  Choose Language
                </h4>
                <p className="text-[11px] text-mutedGrey mt-0.5">
                  Urdu / Pashto / English
                </p>
              </Link>

              {/* Step 4 */}
              <Link
                href="/assistant"
                className="flex flex-col items-center group p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-royalBlue text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                  4
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl mb-2 text-royalBlue group-hover:border-royalBlue transition">
                  🎙️
                </div>
                <h4 className="font-extrabold text-xs text-deepNavy leading-tight">
                  Ask Your Query
                </h4>
                <p className="text-[11px] text-mutedGrey mt-0.5">
                  by Voice or Text
                </p>
              </Link>

              {/* Step 5 */}
              <Link
                href="/assistant"
                className="flex flex-col items-center group p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-royalBlue text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                  5
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl mb-2 text-emerald-500 group-hover:border-royalBlue transition">
                  ✓
                </div>
                <h4 className="font-extrabold text-xs text-deepNavy leading-tight">
                  Instant Response
                </h4>
                <p className="text-[11px] text-mutedGrey mt-0.5">
                  with Rules & Pay Option
                </p>
              </Link>

            </div>
          </div>

          {/* Trusted & Secure Card */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#EBF3FC] to-[#F1F6FC] rounded-2xl p-6 border border-blue-200/90 shadow-card flex flex-col justify-between">
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-deepNavy text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                🛡️
              </div>
              <div>
                <h3 className="font-extrabold text-base text-deepNavy">
                  Trusted & Secure
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your citizen data is safeguarded with end-to-end encryption and ephemeral voice inference.
                </p>
              </div>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center justify-center space-x-2 bg-deepNavy hover:bg-darkNavy text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-sm w-full"
            >
              <span>Learn More</span>
              <span>→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. MAIN FEATURES SECTION (6 High-Impact Pillars)
          ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200">
        <div className="text-center mb-12">
          <Badge variant="info" className="mb-2.5">
            Core Capabilities
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-deepNavy tracking-tight">
            Engineered for Civic Clarity & Legal Transparency
          </h2>
          <p className="text-xs sm:text-sm text-mutedGrey mt-2 max-w-xl mx-auto">
            Combining state-of-the-art multilingual speech synthesis with verified statutory RAG retrieval
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-lightBlue text-royalBlue flex items-center justify-center text-2xl mb-4 shadow-subtle">
                🎙️
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                Multilingual Speech-to-Speech AI
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                Powered by Whisper for speech transcription and Coqui TTS for expressive voice synthesis. Speak naturally in <strong>Urdu</strong>, <strong>Pashto</strong>, or <strong>English</strong>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-royalBlue">
              <span>Whisper STT + Coqui TTS</span>
            </div>
          </Card>

          {/* Feature 2 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl mb-4 shadow-subtle">
                ⚖️
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                Verified Statutory RAG (Zero Hallucination)
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                Information is verified against the <strong>Motor Vehicles Ordinance 1965</strong> and <strong>NHSO 2000</strong> using ChromaDB. Legal penalties are never invented or misquoted.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600">
              <span>ChromaDB Vector Retrieval</span>
            </div>
          </Card>

          {/* Feature 3 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-deepNavy text-white flex items-center justify-center text-2xl mb-4 shadow-subtle">
                📱
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                Instant QR Code Token Decoding
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                Point your mobile camera at any traffic citation ticket to instantly parse the violation code, officer remarks, photo evidence, and 18-digit PSID payment voucher.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-deepNavy">
              <span>Encrypted QR Payload</span>
            </div>
          </Card>

          {/* Feature 4 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-2xl mb-4 shadow-subtle">
                💳
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                1Link & Digital Settlement Integration
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                Clear fine amounts online directly through 1Link, Easypaisa, JazzCash, or bank apps without standing in physical post office queues.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600">
              <span>Instant Digital Receipt</span>
            </div>
          </Card>

          {/* Feature 5 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mb-4 shadow-subtle">
                📑
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                Fair Citizen Dispute Resolution
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                If a camera captured an incorrect license plate or an unlawful penalty was assessed, the assistant walks you through filing a formal review within the 14-day statutory limit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600">
              <span>Electronic Review Filing</span>
            </div>
          </Card>

          {/* Feature 6 */}
          <Card hoverable className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-2xl mb-4 shadow-subtle">
                🔒
              </div>
              <h3 className="font-extrabold text-base text-deepNavy mb-2">
                Ephemeral Audio & Data Privacy
              </h3>
              <p className="text-xs text-mutedGrey leading-relaxed">
                Voice audio is processed ephemerally in RAM and wiped after inference. Identity access is protected by one-time SMS 2FA with complete CNIC isolation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-rose-600">
              <span>Zero Permanent Voice Logs</span>
            </div>
          </Card>

        </div>
      </section>

      {/* =========================================================================
          4. SUPPORTED LANGUAGES & VOICE STUDIO SHOWCASE
          ========================================================================= */}
      <section className="bg-gradient-to-b from-[#092B50] to-[#061D38] text-white py-16 sm:py-20 border-y border-[#0D3868]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="inline-block bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-bold px-3.5 py-1 rounded-full mb-2.5">
              Multilingual Voice Studio
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Experience the Assistant in Your Mother Tongue
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto">
              Select a language to preview an authentic traffic violation consultation:
            </p>

            {/* Language Selector Tabs */}
            <div className="flex justify-center space-x-2 mt-6">
              {Object.keys(languageSamples).map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => setActiveLangTab(langKey)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                    activeLangTab === langKey
                      ? "bg-gradient-to-r from-royalBlue to-brightBlue text-white shadow-blue-500/30 scale-105"
                      : "bg-[#0A2240] text-slate-300 hover:text-white border border-slate-700/80"
                  }`}
                >
                  <span>{languageSamples[langKey].flag}</span>
                  <span>{languageSamples[langKey].name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Dialogue Container */}
          <div className="max-w-3xl mx-auto bg-[#072242]/90 border border-sky-400/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            
            {/* Citizen Question Bubble */}
            <div className="flex justify-end mb-6">
              <div className="bg-royalBlue text-white rounded-2xl rounded-tr-none p-4 max-w-[85%] sm:max-w-[75%] shadow-md">
                <div className="text-[10px] uppercase tracking-wider text-sky-200 font-bold mb-1">
                  Citizen Query (Voice Input)
                </div>
                <div className="text-sm sm:text-base font-semibold leading-relaxed">
                  "{languageSamples[activeLangTab].query}"
                </div>
              </div>
            </div>

            {/* AI Assistant Answer Bubble */}
            <div className="flex justify-start items-start space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-royalBlue text-white flex items-center justify-center text-lg flex-shrink-0 shadow-lg mt-1">
                🎙️
              </div>
              <div className="bg-[#0B2C55] border border-cyan-400/30 rounded-2xl rounded-tl-none p-4 sm:p-5 max-w-[90%] sm:max-w-[85%] shadow-md">
                <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold mb-2 pb-1.5 border-b border-slate-700">
                  <span>AI Traffic Voice Assistant • Verified Answer</span>
                  <span className="bg-cyan-500/20 px-2 py-0.5 rounded text-[9px] font-mono">
                    Statutory RAG Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed mb-4">
                  {languageSamples[activeLangTab].answer}
                </p>

                {/* Verified Metadata Pill Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-2">
                  <div className="bg-[#061D38] px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block text-[9px]">Legal Statute</span>
                    <span className="font-bold text-sky-300">
                      {languageSamples[activeLangTab].section}
                    </span>
                  </div>
                  <div className="bg-[#061D38] px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block text-[9px]">Penalty Amount</span>
                    <span className="font-bold text-emerald-400">
                      {languageSamples[activeLangTab].fine}
                    </span>
                  </div>
                  <div className="bg-[#061D38] px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block text-[9px]">Payment Grace</span>
                    <span className="font-bold text-amber-300">
                      {languageSamples[activeLangTab].due}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Waveform Active Visualizer */}
            <div className="flex items-center justify-between bg-[#061D38] border border-slate-700/80 rounded-xl px-4 py-2.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="text-xs font-semibold text-slate-200">
                  Coqui Audio Synthesizer (Natural Speech Playback)
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "300ms" }}></span>
                <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "450ms" }}></span>
                <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "200ms" }}></span>
              </div>
            </div>

            {/* CTA inside showcase */}
            <div className="mt-6 text-center">
              <Link
                href="/assistant"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-royalBlue to-brightBlue hover:from-brightBlue hover:to-royalBlue text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition shadow-lg shadow-blue-900/40"
              >
                <span>Launch Interactive Voice Studio</span>
                <span>→</span>
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. CITIZEN BENEFITS SECTION (Value Proposition)
          ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200">
        <div className="text-center mb-12">
          <Badge variant="success" className="mb-2.5">
            Public Impact
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-deepNavy tracking-tight">
            Why Citizens Across Pakistan Rely on AI Traffic Assistant
          </h2>
          <p className="text-xs sm:text-sm text-mutedGrey mt-2 max-w-lg mx-auto">
            Transforming stressful traffic violations into transparent, educational, and accessible civic experiences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="text-3xl mb-3">⏱️</div>
            <div className="text-2xl font-black text-deepNavy mb-1">0 Minutes</div>
            <h4 className="font-bold text-sm text-deepNavy mb-2">Queue-Free Resolution</h4>
            <p className="text-xs text-mutedGrey leading-relaxed">
              Eliminate physical visits to congested traffic headquarters. Understand and settle citations in minutes from your phone.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="text-3xl mb-3">🛡️</div>
            <div className="text-2xl font-black text-deepNavy mb-1">100% Legal</div>
            <h4 className="font-bold text-sm text-deepNavy mb-2">Transparent Rights</h4>
            <p className="text-xs text-mutedGrey leading-relaxed">
              Verify the exact section of law cited against you. Never pay unlawful surcharges or undocumented on-the-spot fines.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="text-3xl mb-3">🗣️</div>
            <div className="text-2xl font-black text-deepNavy mb-1">3 Languages</div>
            <h4 className="font-bold text-sm text-deepNavy mb-2">Complete Inclusivity</h4>
            <p className="text-xs text-mutedGrey leading-relaxed">
              Empowering citizens who may struggle with complex English legal jargon by providing fluent spoken explanations in Urdu and Pashto.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="text-3xl mb-3">🧾</div>
            <div className="text-2xl font-black text-deepNavy mb-1">Immediate</div>
            <h4 className="font-bold text-sm text-deepNavy mb-2">Verified Digital Receipt</h4>
            <p className="text-xs text-mutedGrey leading-relaxed">
              Instant clearance transaction numbers linked directly to the central e-Challan database to prevent duplicate ticketing.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          6. VEHICLE LOOKUP & CITATION SEARCH DRAWER
          ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-lightBlue text-royalBlue flex items-center justify-center text-2xl font-bold mb-3 shadow-subtle">
            🚗
          </div>
          <h3 className="text-base sm:text-lg font-bold text-deepNavy mb-1">
            Check Citation by Vehicle Registration
          </h3>
          <p className="text-xs text-mutedGrey max-w-md mx-auto mb-5">
            Enter your registration (e.g. <span className="font-mono text-royalBlue font-bold">ICT-LE-1234</span> or <span className="font-mono text-royalBlue font-bold">LHR-2023-9912</span>) to check outstanding violations:
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="e.g. ICT-LE-1234"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-deepNavy font-medium focus:outline-none focus:border-royalBlue"
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full sm:w-auto"
            >
              Search Citation
            </Button>
          </form>

          {/* Demo Citations Fast Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-mutedGrey">
            <span>Try sample registration:</span>
            <button
              type="button"
              onClick={() => {
                setVehicleQuery("ICT-LE-1234");
                challanService.search("ICT-LE-1234").then(setSearchResults).catch(() => {});
              }}
              className="font-mono font-bold text-royalBlue hover:underline bg-slate-100 px-2 py-0.5 rounded"
            >
              ICT-LE-1234 (Speeding)
            </button>
            <button
              type="button"
              onClick={() => {
                setVehicleQuery("LHR-2023-9912");
                challanService.search("LHR-2023-9912").then(setSearchResults).catch(() => {});
              }}
              className="font-mono font-bold text-royalBlue hover:underline bg-slate-100 px-2 py-0.5 rounded"
            >
              LHR-2023-9912 (Helmet)
            </button>
          </div>
        </div>
      </section>

      {/* SEARCH RESULTS SECTION */}
      {searchResults !== null && (
        <section className="max-w-4xl mx-auto px-4 mb-14">
          <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-deepNavy text-sm">
                Verified Search Results ({searchResults.length})
              </h2>
              <button
                onClick={() => setSearchResults(null)}
                className="text-xs text-mutedGrey hover:text-deepNavy font-semibold"
              >
                ✕ Close
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-6 text-xs text-mutedGrey">
                No active traffic citations found for this registration. Drive safely!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((c) => (
                  <ChallanCard
                    key={c.id}
                    challan={c}
                    onPaymentSuccess={(updated) => {
                      setSearchResults(
                        searchResults.map((item) =>
                          item.challan_no === updated.challan_no
                            ? { ...item, status: "PAID", payment_transaction_id: updated.transaction_id }
                            : item
                        )
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {searchError && (
        <div className="max-w-md mx-auto px-4 mb-8 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
            {searchError}
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FREQUENTLY ASKED QUESTIONS (Interactive Accordion)
          ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <Badge variant="neutral" className="mb-2">
            Civic Knowledge Base
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-mutedGrey mt-1.5">
            Clear, honest answers regarding data privacy, legal verification, and online settlement
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-subtle transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-xs sm:text-sm text-deepNavy hover:text-royalBlue transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span
                    className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0 transition-transform ${
                      isOpen ? "transform rotate-180 bg-lightBlue text-royalBlue" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          8. CALL TO ACTION BANNER (Drive Safe & Launch Assistant)
          ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-10">
        <div className="bg-gradient-to-r from-[#061D38] via-[#092B50] to-[#0A386D] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-sky-500/20">
          
          <div className="max-w-xl">
            <span className="inline-block bg-sky-400/20 text-sky-300 border border-sky-400/30 text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              Ask. Understand. Follow.
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-2">
              Have Questions About a Traffic Citation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Launch the AI Traffic Voice Assistant now to receive instant statutory advice in Urdu, Pashto, or English.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/assistant"
              className="w-full sm:w-auto bg-gradient-to-r from-royalBlue to-brightBlue hover:from-brightBlue hover:to-royalBlue text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-lg shadow-blue-900/40 text-center transition transform hover:scale-[1.02]"
            >
              🎙️ Speak Your Query
            </Link>
            <button
              onClick={() => setQrModalOpen(true)}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-full text-center transition"
            >
              📱 Scan QR Code
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          QR SCANNER SIMULATION MODAL
          ========================================================================= */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-[#061D38]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-deepNavy text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-lightBlue text-royalBlue flex items-center justify-center text-2xl font-bold">
              📱
            </div>
            <h3 className="text-base font-bold text-deepNavy mb-1">Scan Challan QR Code</h3>
            <p className="text-xs text-mutedGrey mb-4">
              Hold camera to your paper ticket QR code or select a sample citation below:
            </p>

            <div className="w-40 h-40 mx-auto border-2 border-dashed border-royalBlue rounded-2xl relative overflow-hidden flex items-center justify-center bg-slate-50 mb-4">
              <div className="absolute inset-x-0 h-1 bg-royalBlue animate-bounce opacity-80"></div>
              <span className="text-4xl text-slate-400">📷</span>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => handleSimulateQRScan("PK-2024-883921")}
                className="w-full bg-royalBlue hover:bg-brightBlue text-white py-2.5 rounded-xl font-semibold transition"
              >
                Scan Ticket: PK-2024-883921 (Over-Speeding • Rs. 5,000)
              </button>
              <button
                onClick={() => handleSimulateQRScan("PK-2024-774102")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-deepNavy py-2.5 rounded-xl font-semibold transition"
              >
                Scan Ticket: PK-2024-774102 (Helmet • Rs. 2,000)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OTP VERIFICATION MODAL
          ========================================================================= */}
      {otpModalOpen && (
        <div className="fixed inset-0 bg-[#061D38]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setOtpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-deepNavy text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-lightBlue text-royalBlue flex items-center justify-center text-2xl font-bold">
              ✉️
            </div>
            <h3 className="text-base font-bold text-deepNavy mb-1">Verify Mobile with OTP</h3>
            <p className="text-xs text-mutedGrey mb-4">
              Enter 6-digit code sent to +92 300 9876543
            </p>

            <input
              type="text"
              maxLength={6}
              value={demoOtp}
              onChange={(e) => setDemoOtp(e.target.value)}
              className="w-full text-center tracking-[0.4em] text-lg font-mono bg-slate-50 border border-slate-300 text-deepNavy py-2.5 rounded-xl mb-4 focus:outline-none focus:border-royalBlue font-bold"
            />

            <button
              onClick={() => {
                setOtpVerified(true);
                setTimeout(() => setOtpModalOpen(false), 1000);
              }}
              className="w-full bg-royalBlue hover:bg-brightBlue text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              {otpVerified ? "✓ Verified Successfully!" : "Verify & Authorize"}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE DEMO MODAL
          ========================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 bg-[#061D38]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#092B50] text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-sky-500/30">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
            >
              ✕
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-royalBlue flex items-center justify-center text-lg">
                🎙️
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Live Voice Assistant Demo</h3>
                <p className="text-[11px] text-slate-300">Experience multilingual traffic explanation</p>
              </div>
            </div>

            <div className="flex space-x-1.5 mb-4 bg-[#061D38] p-1 rounded-xl">
              <button
                onClick={() => setDemoLang("ur")}
                className={`flex-1 py-1 text-xs rounded-lg font-semibold transition ${
                  demoLang === "ur" ? "bg-royalBlue text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                onClick={() => setDemoLang("ps")}
                className={`flex-1 py-1 text-xs rounded-lg font-semibold transition ${
                  demoLang === "ps" ? "bg-royalBlue text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                پښتو (Pashto)
              </button>
              <button
                onClick={() => setDemoLang("en")}
                className={`flex-1 py-1 text-xs rounded-lg font-semibold transition ${
                  demoLang === "en" ? "bg-royalBlue text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
            </div>

            <div className="space-y-3 bg-[#061D38]/60 border border-slate-700/60 rounded-xl p-4 mb-4 text-xs">
              <div className="flex justify-end">
                <div className="bg-royalBlue text-white px-3.5 py-2 rounded-2xl rounded-tr-none max-w-[80%] font-medium">
                  {demoLang === "ur" && "مجھے یہ چالان کیوں ملا اور جرمانہ کتنا ہے؟"}
                  {demoLang === "ps" && "ما ته دا چالان ولې راکړل شو او جریمه څومره ده؟"}
                  {demoLang === "en" && "Why did I get this challan and what is the penalty amount?"}
                </div>
              </div>

              <div className="flex justify-start items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-[#0D3868] text-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed border border-cyan-500/20">
                  {demoLang === "ur" && (
                    <>
                      آپ کو اسلام آباد ایکسپریس وے پر حد رفتار سے زیادہ گاڑی چلانے (سیکشن 113) پر چالان جاری کیا گیا ہے۔ کل جرمانہ <strong>5,000 روپے</strong> ہے، جسے آپ 14 دنوں میں آن لائن یا بینک میں ادا کر سکتے ہیں۔
                    </>
                  )}
                  {demoLang === "ps" && (
                    <>
                      تاسو ته د اسلام آباد په لویه لار د تیز رفتارۍ (۱۱۳ برخه) له امله چالان درکړل شوی دی. ټوله جریمه <strong>۵،۰۰۰ کلدارې</strong> ده چې تاسو یې په ۱۴ ورځو کې ادا کولی شئ.
                    </>
                  )}
                  {demoLang === "en" && (
                    <>
                      You received a citation for exceeding the speed limit on Islamabad Expressway under Section 113. Total fine is <strong>Rs. 5,000</strong>, payable within 14 days via 1Link or designated banks.
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-1.5 py-2 mb-3 bg-[#061D38] rounded-xl border border-slate-700">
              <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "300ms" }}></span>
              <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "450ms" }}></span>
              <span className="w-1 bg-[#00F0FF] rounded-full soundwave-bar" style={{ animationDelay: "200ms" }}></span>
              <span className="text-[11px] text-cyan-300 font-mono pl-2">Voice Audio Synthesizer Active</span>
            </div>

            <Link
              href="/assistant"
              className="w-full bg-gradient-to-r from-royalBlue to-brightBlue hover:from-brightBlue hover:to-royalBlue text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md"
            >
              <span>Try Live in Voice Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
