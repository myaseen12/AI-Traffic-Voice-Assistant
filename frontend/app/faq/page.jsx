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
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-block bg-lightBlue border border-subtleBorder text-deepNavy font-bold text-xs px-3.5 py-1 rounded-full mb-3 shadow-2xs">
          Help & Answers
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-bodyDark max-w-lg mx-auto">
          Common questions about Pakistani traffic rules, statutory fines, and voice assistant features.
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl overflow-hidden border border-cardBorder shadow-subtle hover:border-royalBlue/40 transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-xs sm:text-sm text-deepNavy hover:text-royalBlue transition"
            >
              <span className="pr-2">{faq.q}</span>
              <span className="text-royalBlue text-xl font-bold ml-2 shrink-0">
                {openIndex === idx ? "−" : "+"}
              </span>
            </button>
            {openIndex === idx && (
              <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-bodyDark leading-relaxed border-t border-cardBorder pt-3.5 bg-[#F8FAFC]">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
