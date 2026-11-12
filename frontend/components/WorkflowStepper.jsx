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
    <div className="w-full bg-navy-950/80 border border-slate-800 rounded-2xl p-3.5 mb-4 shadow-lg backdrop-blur-md transition-all">
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between text-xs cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="w-2 h-2 rounded-full bg-cyan-neon animate-ping" />
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <span>AI Traffic Intelligence Pipeline</span>
            <span className="text-[10px] text-cyan-neon bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan- neon/30 font-mono">
              Whisper • MVO 1965 • Llama 3 • Coqui TTS
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-400 hover:text-white transition">
          <span className="text-[11px] hidden sm:inline">
            {isProcessing ? (
              <span className="text-cyan-neon font-bold animate-pulse">● Processing Pipeline Step {activeStep}/5...</span>
            ) : (
              "Pipeline Architecture"
            )}
          </span>
          <span className="text-xs transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Workflow Stepper View */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {steps.map((s, idx) => {
              const isCurrent = isProcessing && activeStep === s.id;
              const isCompleted = activeStep > s.id;

              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                    isCurrent
                      ? "bg-cyan-950/80 border-cyan-neon text-white shadow-glow-cyan"
                      : isCompleted
                      ? "bg-navy-900/90 border-emerald-600/70 text-slate-200"
                      : "bg-navy-900/40 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{s.icon}</span>
                    {isCurrent ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-neon animate-ping" />
                    ) : isCompleted ? (
                      <span className="text-emerald-400 font-bold text-[10px]">✓</span>
                    ) : (
                      <span className="text-slate-600 font-mono text-[9px]">{idx + 1}</span>
                    )}
                  </div>
                  <div className="font-bold text-[11px] text-white truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                    {s.desc}
                  </div>
                  <div className="mt-1.5 text-[9px] text-cyan-neon font-mono truncate bg-navy-950/90 px-1 py-0.5 rounded border border-slate-800">
                    {s.tech}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-1">
            <span>🛡️ Legal Grounding: Motor Vehicles Ordinance 1965 & National Highway Safety Ordinance 2000</span>
            <span>Zero Statutory Hallucination Enforced</span>
          </div>
        </div>
      )}
    </div>
  );
}
