"use client";
import React from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function FeaturesPage() {
  const coreFeatures = [
    {
      title: "Multilingual Speech Recognition (Whisper STT)",
      desc: "Customized acoustic models calibrated for Pakistani regional accents in Urdu, Pashto, and English. Speak comfortably without having to type complex legal terms on a mobile keyboard.",
      badge: "Speech AI",
      icon: "🎙️",
      tech: "OpenAI Whisper Base/Small",
    },
    {
      title: "Statutory Legal RAG (Zero Hallucination)",
      desc: "Information is strictly verified against the Motor Vehicles Ordinance 1965 and National Highways Safety Ordinance 2000 using ChromaDB vector embeddings. Penalties are never invented.",
      badge: "Legal RAG",
      icon: "⚖️",
      tech: "ChromaDB + Llama 3",
    },
    {
      title: "Expressive Voice Synthesis (Coqui TTS)",
      desc: "Generates clear, natural spoken responses in Urdu, Pashto, and English so citizens can listen to the exact legal reasoning without reading lengthy statutory notices.",
      badge: "Voice Synthesis",
      icon: "🔊",
      tech: "Coqui Multilingual TTS",
    },
    {
      title: "Instant QR Code Scanner",
      desc: "Point your device camera at any paper ticket issued by Safe City or highway patrols. Decodes the encrypted token in milliseconds and pulls official citation records.",
      badge: "Computer Vision",
      icon: "📱",
      tech: "QR & Vision OCR",
    },
    {
      title: "2-Factor OTP Citizen Security",
      desc: "Validates your identity using an ephemeral 6-digit SMS OTP sent to the registered owner's mobile number, ensuring private citation details remain strictly confidential.",
      badge: "Security",
      icon: "🛡️",
      tech: "2FA SMS & JWT Bearer",
    },
    {
      title: "1Link & Digital Settlement Integration",
      desc: "Automated generation of 18-digit 1Link Consumer Numbers (PSID) allowing instant fine settlement via any mobile banking app, ATM, Easypaisa, or JazzCash.",
      badge: "FinTech",
      icon: "💳",
      tech: "1Link PSID Banking Rails",
    },
    {
      title: "Electronic Dispute Filing Guidance",
      desc: "If a Safe City camera misidentified your license plate or an unlawful penalty was charged, the assistant provides step-by-step guidance to file a formal review within the 14-day statutory grace period.",
      badge: "Citizen Rights",
      icon: "📑",
      tech: "Adjudication Workflow",
    },
    {
      title: "Demerit Points & License Health",
      desc: "Real-time calculation of accumulated penalty points on your driver's license under NHSO 2000, alerting you before approaching suspension thresholds.",
      badge: "Compliance",
      icon: "🚗",
      tech: "Statutory Point Index",
    },
    {
      title: "Ephemeral Audio Processing",
      desc: "Your spoken voice stream is processed strictly in volatile memory (RAM) and immediately cleared after transcription. We do not build or retain permanent voice biometric databases.",
      badge: "Data Privacy",
      icon: "🔒",
      tech: "Zero Permanent Audio Logs",
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
              <span className="text-white font-semibold">Features</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Public Service Capabilities
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Platform Features & <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                Technical Architecture
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              A complete civic intelligence system combining regional voice recognition, verifiable statutory retrieval, instant QR decoding, and secure digital fine settlement.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((f, i) => (
            <Card key={i} hoverable className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-lightBlue text-royalBlue flex items-center justify-center text-2xl shadow-subtle">
                    {f.icon}
                  </div>
                  <Badge variant="info" size="sm">
                    {f.badge}
                  </Badge>
                </div>

                <h3 className="font-extrabold text-base text-deepNavy mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-mutedGrey font-medium">Stack:</span>
                <span className="font-mono font-bold text-royalBlue">{f.tech}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table: Traditional vs. AI Assistant */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="neutral" className="mb-2">
              Transforming Civic Experience
            </Badge>
            <h3 className="text-xl sm:text-2xl font-extrabold text-deepNavy">
              Traditional Police Station vs. AI Traffic Voice Assistant
            </h3>
            <p className="text-xs text-mutedGrey mt-1.5">
              Comparing standard manual citation handling with our AI-powered citizen assistant
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-deepNavy font-bold">
                  <th className="py-3 px-4">Feature / Dimension</th>
                  <th className="py-3 px-4 text-slate-500">Traditional Process</th>
                  <th className="py-3 px-4 text-royalBlue font-extrabold bg-blue-50/50">AI Traffic Voice Assistant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Average Resolution Time</td>
                  <td className="py-3.5 px-4 text-slate-500">2 to 4 hours in physical lines</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold bg-blue-50/30">Under 60 seconds from your phone</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Language Accessibility</td>
                  <td className="py-3.5 px-4 text-slate-500">Primarily English / complex paper jargon</td>
                  <td className="py-3.5 px-4 text-royalBlue font-bold bg-blue-50/30">Spoken Urdu, Pashto, and English</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Statutory Transparency</td>
                  <td className="py-3.5 px-4 text-slate-500">Vague section numbers on paper ticket</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold bg-blue-50/30">Exact clause from MVO 1965 / NHSO 2000 explained</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Payment Convenience</td>
                  <td className="py-3.5 px-4 text-slate-500">Designated post offices or bank branches</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold bg-blue-50/30">1Link, Easypaisa, JazzCash, ATMs 24/7</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Dispute Rights Guidance</td>
                  <td className="py-3.5 px-4 text-slate-500">Rarely communicated clearly</td>
                  <td className="py-3.5 px-4 text-royalBlue font-bold bg-blue-50/30">14-day formal review filing instructions provided</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-deepNavy">Availability</td>
                  <td className="py-3.5 px-4 text-slate-500">Government working hours (9 AM - 4 PM)</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold bg-blue-50/30">24/7/365 continuous uptime</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-[#092B50] rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-1">Try the Voice Assistant Now</h3>
            <p className="text-xs text-slate-300">Speak into your microphone or scan your physical citation to begin.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/assistant">
              <Button variant="primary" size="md">
                🎙️ Open Voice Assistant
              </Button>
            </Link>
            <Link href="/scan-challan">
              <Button variant="outline" size="md" className="bg-transparent text-white border-white/30 hover:bg-white/10">
                📱 Scan QR Code
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
