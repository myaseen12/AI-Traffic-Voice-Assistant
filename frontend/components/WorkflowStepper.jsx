"use client";
import React, { useState } from "react";

export default function WorkflowStepper({
  activeStep = 0,
  isProcessing = false,
  isVoice = false,
  language = "en",
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      id: 1,
      title: "1. Voice / Text Input",
      desc: isVoice ? "Audio captured from microphone" : "Statutory question submitted",
      icon: isVoice ? "🎙️" : "⌨️",
      tech: isVoice ? "Web Audio API" : "Next.js Client",
    },
    {
      id: 2,
      title: "2. Whisper Transcription",
      desc: isVoice ? "Transcribing speech into text" : "Direct input passed to pipeline",
      icon: "🎯",
      tech: "Whisper STT (Urdu/Pashto/EN)",
      skip: !isVoice,
    },
    {
      id: 3,
      title: "3. Legal Knowledge Retrieval",
      desc: "Retrieving verified traffic statutes",
      icon: "⚖️",
      tech: "MVO 1965 & NHSO 2000 RAG",
    },
    {
      id: 4,
      title: "4. Grounded Llama 3",
      desc: "Synthesizing zero-hallucination legal answer",
      icon: "🧠",
      tech: "Llama 3 8B Instruct",
    },
    {
      id: 5,
      title: "5. Coqui Spoken Voice",
      desc: "Generating spoken playable audio",
      icon: "🔊",
      tech: language === "ps" ? "Coqui Regional Phonetic Voice" : "Coqui XTTS v2 Neural Voice",
    },
  ];

  return (
    <div className="w-full bg-white border border-cardBorder rounded-2xl p-3.5 sm:p-4 mb-4 shadow-subtle transition-all">
      {/* Header bar with toggle */}
      <div
        className="flex items-center justify-between text-xs cursor-pointer select-none gap-2 flex-wrap sm:flex-nowrap"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle AI Traffic Intelligence Pipeline details"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
      >
        <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-y-1">
          <span className="w-2.5 h-2.5 rounded-full bg-royalBlue shrink-0" />
          <span className="font-bold text-deepNavy text-xs sm:text-sm tracking-tight flex items-center gap-2 flex-wrap">
            <span>AI Traffic Intelligence Pipeline</span>
            <span className="text-[10px] sm:text-[11px] text-deepNavy bg-lightBlue px-2.5 py-0.5 rounded-full border border-subtleBorder font-medium">
              Whisper • MVO 1965 • Llama 3 • Coqui TTS
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse text-mutedGrey hover:text-deepNavy transition shrink-0 ml-auto">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isProcessing ? (
              <span className="text-royalBlue font-bold animate-pulse">● Processing Pipeline Step {activeStep}/5...</span>
            ) : (
              "Pipeline Architecture"
            )}
          </span>
          <span
            className="text-xs font-bold text-royalBlue transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Workflow Stepper View */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-cardBorder animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {steps.map((s, idx) => {
              const isCurrent = isProcessing && activeStep === s.id;
              const isCompleted = activeStep > s.id;

              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                    isCurrent
                      ? "bg-lightBlue border-royalBlue shadow-sm"
                      : isCompleted
                      ? "bg-[#F8FAFC] border-royalBlue/40"
                      : "bg-white border-cardBorder"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base">{s.icon}</span>
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-royalBlue animate-ping" />
                    ) : isCompleted ? (
                      <span className="text-royalBlue font-bold text-xs">✓</span>
                    ) : (
                      <span className="text-mutedGrey font-mono text-[10px] font-semibold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-deepNavy truncate">{s.title}</div>
                  <div className="text-[11px] text-bodyDark leading-snug mt-1 line-clamp-2">
                    {s.desc}
                  </div>
                  <div className="mt-2 text-[9px] text-royalBlue font-mono font-medium truncate bg-white px-1.5 py-0.5 rounded border border-cardBorder">
                    {s.tech}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-mutedGrey flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 px-1 font-medium border-t border-cardBorder/60 pt-2">
            <span>🛡️ Legal Grounding: Motor Vehicles Ordinance 1965 & National Highway Safety Ordinance 2000</span>
            <span className="text-deepNavy font-semibold">Zero Statutory Hallucination Enforced</span>
          </div>
        </div>
      )}
    </div>
  );
}
