"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useLanguage } from "../context/LanguageContext";

export default function VoiceWidget() {
  const router = useRouter();
  const { language } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  const langCode = language === "ur" ? "ur-PK" : language === "ps" ? "ps-AF" : "en-PK";

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    language: langCode,
    onResult: (text) => {
      setTranscript(text);
      router.push(`/assistant?q=${encodeURIComponent(text)}`);
      setModalOpen(false);
    },
  });

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setModalOpen(true);
            startListening();
          }}
          className="w-13 h-13 p-3.5 rounded-full bg-royalBlue hover:bg-brightBlue text-white shadow-card-hover flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none"
          title="Speak to Traffic Voice Assistant"
        >
          <span className="text-xl">🎙️</span>
        </button>
      </div>

      {/* Voice Prompt Overlay Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-deepNavy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => {
                stopListening();
                setModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-deepNavy text-sm font-bold"
            >
              ✕
            </button>

            <div className="my-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-lightBlue text-royalBlue flex items-center justify-center text-3xl shadow-sm">
                🎙️
              </div>
            </div>

            <h3 className="text-base font-bold text-deepNavy mb-1">
              {isListening ? "Listening to your voice..." : "Voice Assistant"}
            </h3>
            <p className="text-xs text-mutedGrey mb-4">
              Speak in <strong className="text-royalBlue">Urdu, Pashto, or English</strong>.
              <br />
              e.g. &ldquo;Why did I get this challan?&rdquo;
            </p>

            {transcript && (
              <div className="bg-slate-50 p-3 rounded-xl text-xs text-deepNavy font-mono mb-4 text-left border border-slate-200">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => (isListening ? stopListening() : startListening())}
                className="px-5 py-2.5 bg-royalBlue hover:bg-brightBlue text-white rounded-full text-xs font-semibold shadow-sm transition"
              >
                {isListening ? "Stop Listening" : "Tap to Speak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
