'use client';

import React from 'react';

export default function PhoneVoiceMockup() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[370px] mx-auto select-none">
      
      {/* Ambient background glow behind the phone */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#1E6BFF]/30 via-[#19D3FF]/20 to-transparent rounded-[48px] blur-2xl pointer-events-none opacity-80"></div>
      
      {/* Outer Phone Bezel & Body */}
      <div className="relative rounded-[38px] sm:rounded-[42px] p-3 sm:p-3.5 bg-gradient-to-b from-[#162D59] via-[#0B1F44] to-[#071229] border-2 border-cyan-500/30 shadow-[0_20px_50px_rgba(7,18,41,0.9),0_0_35px_rgba(30,107,255,0.3)]">
        
        {/* Subtle phone rim highlight */}
        <div className="rounded-[30px] sm:rounded-[34px] overflow-hidden bg-gradient-to-b from-[#0B1F44] via-[#071229] to-[#040B18] border border-cyan-400/20 shadow-inner flex flex-col">
          
          {/* Top Status Bar & Notch */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <span className="font-semibold text-slate-200 tracking-tight">09:41</span>
            
            {/* Dynamic Island / Speaker Pill */}
            <div className="w-20 h-3.5 bg-[#030914] rounded-full flex items-center justify-center space-x-1 border border-slate-800/80 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="w-2.5 h-1 rounded-full bg-slate-800"></span>
            </div>

            {/* Network / Battery status */}
            <div className="flex items-center space-x-1.5 text-slate-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" opacity="0.3"/>
                <path d="M12 4.5C8.96 4.5 6.5 6.96 6.5 10c0 1.48.59 2.83 1.54 3.82L12 19.5l3.96-5.68c.95-.99 1.54-2.34 1.54-3.82 0-3.04-2.46-5.5-5.5-5.5z"/>
              </svg>
              <span className="text-[10px] font-bold text-cyan-400">5G</span>
              <div className="w-4 h-2 rounded-[2px] border border-slate-300 p-[1px] flex items-center">
                <div className="w-2.5 h-full bg-emerald-400 rounded-[1px]"></div>
              </div>
            </div>
          </div>

          {/* Phone Header */}
          <div className="px-4 py-2.5 bg-[#0B2544]/80 border-b border-slate-700/50 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#19D3FF]"></span>
                <span className="absolute w-4 h-4 rounded-full bg-cyan-400/40 animate-ping"></span>
              </div>
              <div>
                <h4 className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight flex items-center gap-1.5">
                  AI Traffic Voice Assistant
                </h4>
                <p className="text-[9.5px] text-cyan-300/80 font-mono">
                  Online • Voice & Text Active
                </p>
              </div>
            </div>
            
            {/* Language badges */}
            <div className="flex items-center space-x-1 text-[9px] font-medium bg-black/40 px-2 py-0.5 rounded-full border border-slate-700/60 text-slate-300">
              <span className="text-cyan-300">اردو</span>
              <span className="text-slate-600">•</span>
              <span>پښتو</span>
              <span className="text-slate-600">•</span>
              <span>EN</span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="p-3.5 sm:p-4 space-y-3.5 min-h-[220px] flex flex-col justify-center">
            
            {/* Timestamp Divider */}
            <div className="flex items-center justify-center">
              <span className="text-[9px] font-mono text-slate-400 bg-black/30 px-2.5 py-0.5 rounded-full border border-slate-800">
                Today • Safe City e-Challan Inquiry
              </span>
            </div>

            {/* User Message Bubble (Right aligned) */}
            <div className="flex justify-end items-end space-x-1.5">
              <div className="max-w-[82%] bg-gradient-to-r from-[#1E6BFF] to-[#0F55D6] text-white rounded-2xl rounded-br-xs px-3.5 py-2.5 shadow-md border border-blue-400/30">
                <p className="text-[12px] sm:text-[12.5px] font-medium leading-relaxed">
                  Why did I get this challan?
                </p>
                <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-blue-200/80 font-mono">
                  <span>🎙️ Voice Query</span>
                  <span>•</span>
                  <span>10:24 AM</span>
                </div>
              </div>
            </div>

            {/* Assistant Bot Bubble (Left aligned) */}
            <div className="flex justify-start items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#19D3FF] to-[#1E6BFF] flex items-center justify-center text-white text-[11px] font-bold shadow-[0_0_10px_rgba(25,211,255,0.4)] flex-shrink-0 mt-0.5">
                AI
              </div>

              <div className="max-w-[86%] bg-[#0E2752]/95 text-slate-100 rounded-2xl rounded-tl-xs p-3 shadow-lg border border-cyan-500/30 backdrop-blur-md">
                <p className="text-[12px] sm:text-[12.5px] font-normal leading-relaxed text-slate-100">
                  You received a challan for over-speeding. The fine is <span className="font-bold text-cyan-300">Rs. 5,000</span>.
                </p>

                {/* Statutory Citation Card inside bot reply */}
                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[9.5px]">
                  <span className="text-slate-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/60">
                    Section 112, MVO 1965
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Verified
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Voice Control Section with Glowing Mic Button */}
          <div className="p-3.5 pt-1 pb-4 bg-gradient-to-t from-[#030914] via-[#07152B] to-transparent flex flex-col items-center">
            
            {/* Glowing Microphone Button */}
            <div className="relative group cursor-pointer my-1">
              {/* Outer Pulsing Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#19D3FF] to-[#1E6BFF] rounded-full blur-md opacity-75 group-hover:opacity-100 animate-pulse transition"></div>
              
              {/* Interactive Mic Button */}
              <button 
                type="button"
                aria-label="Activate Voice Assistant"
                className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#19D3FF] via-[#1E6BFF] to-[#09469E] p-[2px] shadow-[0_0_20px_rgba(25,211,255,0.6)] flex items-center justify-center transition-transform transform group-hover:scale-105 active:scale-95"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#0E356E] to-[#071B3B] flex items-center justify-center border border-white/30">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 drop-shadow-[0_0_6px_#19D3FF]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
              </button>
            </div>

            {/* Instruction text */}
            <p className="text-[10px] text-cyan-300/90 font-medium tracking-tight mt-1">
              Tap mic to speak in Urdu, Pashto or English
            </p>
          </div>

          {/* Home indicator bar at phone bottom */}
          <div className="pb-1.5 pt-0.5 flex justify-center bg-[#030914]">
            <div className="w-28 h-1 bg-slate-600/60 rounded-full"></div>
          </div>

        </div>
      </div>

      {/* Floating "Multilingual Voice Active" Badge
          Positioned absolute at bottom-right of the phone mockup frame,
          cleanly elevated so it never overlaps any chat message or text */}
      <div className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-4 z-20 flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 bg-[#071229]/95 backdrop-blur-md rounded-full border border-cyan-400/50 shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_15px_rgba(25,211,255,0.3)]">
        <span className="w-1 bg-[#19D3FF] rounded-full soundwave-bar" style={{ animationDelay: '0ms' }}></span>
        <span className="w-1 bg-[#19D3FF] rounded-full soundwave-bar" style={{ animationDelay: '150ms' }}></span>
        <span className="w-1 bg-[#19D3FF] rounded-full soundwave-bar" style={{ animationDelay: '300ms' }}></span>
        <span className="w-1 bg-[#19D3FF] rounded-full soundwave-bar" style={{ animationDelay: '450ms' }}></span>
        <span className="w-1 bg-[#19D3FF] rounded-full soundwave-bar" style={{ animationDelay: '200ms' }}></span>
        <span className="text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wide pl-1">
          Multilingual Voice Active
        </span>
      </div>

    </div>
  );
}
