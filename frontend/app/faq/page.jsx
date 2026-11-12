"use client";
import React, { useState } from "react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How can I check pending challans using voice in Urdu or Pashto?",
      a: "Click on the 🎙️ Voice Assistant button or visit the Voice Studio. Select 'اردو' or 'پښتو' from the language bar. Speak your question or say your vehicle registration plate (for example: 'ICT-LE-402' or 'چالان کی رقم کتنی ہے؟'). The assistant will transcribe your query and speak the answer.",
    },
    {
      q: "What is Section 113 of the Motor Vehicles Ordinance 1965?",
      a: "Section 113 governs the enforcement of prescribed speed limits on Pakistani roads, expressways, and motorways. Violations carry statutory fines typically ranging between Rs. 2,500 and Rs. 5,000 depending on vehicle classification and recorded speed.",
    },
    {
      q: "What happens if an e-challan is not paid within the due date in Pakistan?",
      a: "If an e-challan remains unpaid after the due date (usually 10 to 14 days), an automated non-compliance report is forwarded to the excise & taxation department and traffic police. The vehicle may be blacklisted from ownership transfer or token tax renewal.",
    },
    {
      q: "How does the QR Code Scanner work on paper challans?",
      a: "Modern traffic police tickets (Islamabad Safe City, Punjab Traffic Police, KP Safe City) print a standardized QR code. Opening our QR scanner on your phone automatically reads the citation ID and pulls the verified statutory violation details in seconds.",
    },
    {
      q: "Can I dispute a citation if I wasn't driving or if the photo is wrong?",
      a: "Yes. You have a legal right under provincial traffic rules to contest citations with evidence errors. You can ask our voice assistant for the specific grievance procedure or review the photographic CCTV snapshot attached to the record.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-block bg-royal-700/40 border border-royal-500/40 text-cyan-neon font-semibold text-xs px-3 py-1 rounded-full mb-3">
          Help & Answers
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-slate-400">Common questions about Pakistani traffic rules, fines, and voice assistant features.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-card rounded-2xl overflow-hidden border border-slate-700/80 shadow-md">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full text-left p-5 flex items-center justify-between font-bold text-xs sm:text-sm text-white hover:text-cyan-neon transition"
            >
              <span>{faq.q}</span>
              <span className="text-cyan-neon text-lg ml-2">{openIndex === idx ? "−" : "+"}</span>
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
