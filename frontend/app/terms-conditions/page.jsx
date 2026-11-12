"use client";
import React from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function TermsConditionsPage() {
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
              <span className="text-white font-semibold">Terms & Conditions</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Statutory Terms of Civic Service
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Terms & Conditions <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                of Platform Use
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Please read these terms carefully before accessing or using the AI Traffic Voice Assistant. By using this service, you agree to comply with statutory Pakistani road safety regulations.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-8">
        
        {/* Important Warning Notice */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-amber-900 text-xs shadow-card">
          <div className="flex items-start space-x-3.5">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="font-extrabold text-sm text-amber-900 mb-1">
                Crucial Safe Driving Prohibition: Never Operate While Driving
              </h3>
              <p className="leading-relaxed text-[11px] text-amber-800">
                You must <strong>never operate or speak into this application while driving or operating a motor vehicle</strong>. Operating a mobile device while in control of a vehicle is a serious violation under Section 89B of the Motor Vehicles Ordinance 1965 and creates severe road safety hazards. Always pull over to a safe, designated parking spot before using this service.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Nature of Service */}
        <Card className="p-6 sm:p-8 space-y-3">
          <Badge variant="info">Section 1</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Nature of the Civic Platform & Legal Status
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            AI Traffic Voice Assistant is an independent civic information platform developed to translate, summarize, and explain statutory traffic citations and road safety legislation for public convenience.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This platform is <strong>not a court of law, a sovereign police body, or a judicial adjudication tribunal</strong>. It does not possess the authority to cancel, waive, or pardon lawful citations issued by authorized law enforcement agencies. Official disputes must follow the statutory review procedures described herein.
          </p>
        </Card>

        {/* Section 2: Statutory Authority & Applicable Law */}
        <Card className="p-6 sm:p-8 space-y-3">
          <Badge variant="info">Section 2</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Statutory Authority & Governed Legislation
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All legal sections, definitions of offenses, penalty schedules, and demerit points referenced by the assistant are derived strictly from:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-3">
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <span><strong>The Motor Vehicles Ordinance, 1965 (Ordinance XIX of 1965)</strong> as adapted and enforced in ICT and provincial jurisdictions.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <span><strong>The National Highways Safety Ordinance, 2000 (NHSO 2000)</strong> governing traffic rules across motorways and national highways.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-royalBlue font-bold">•</span>
              <span>Official regulatory notifications issued by regional Safe City Authorities and Transport Departments.</span>
            </li>
          </ul>
        </Card>

        {/* Section 3: 1Link Digital Fine Settlements */}
        <Card className="p-6 sm:p-8 space-y-3">
          <Badge variant="info">Section 3</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Payment Rails & 1Link Digital Settlements
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Payment transactions for traffic citations are facilitated through authorized 1Link PSID billing infrastructure and official state banking channels. Our platform does not assess processing fees, surcharge commissions, or hold citizen banking funds in escrow.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Citizens are responsible for verifying the payment reference (PSID), vehicle registration number, and fine amount before authorizing bank or mobile wallet transactions.
          </p>
        </Card>

        {/* Section 4: 14-Day Statutory Dispute Window */}
        <Card className="p-6 sm:p-8 space-y-3">
          <Badge variant="info">Section 4</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Citizen Dispute Rights & 14-Day Grace Period
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Under Pakistani statutory procedures, if a citizen believes a citation was issued mistakenly (e.g. camera OCR license plate misread, stolen vehicle, or emergency medical exemption), a formal review must be submitted <strong>within 14 calendar days</strong> of issuance.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Our assistant will guide you on the necessary documentary evidence required by the senior traffic magistrate, but the final adjudication remains the exclusive prerogative of the official traffic authority.
          </p>
        </Card>

        {/* Section 5: Limitation of Liability */}
        <Card className="p-6 sm:p-8 space-y-3">
          <Badge variant="neutral">Section 5</Badge>
          <h3 className="text-lg font-extrabold text-deepNavy">
            Limitation of Liability & Jurisdiction
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            While every technical measure is taken to maintain 100% legal alignment via ChromaDB RAG verification, the platform and its developers assume no liability for indirect, incidental, or consequential damages resulting from network delays, bank gateway downtime, or failure of a driver to settle fines within statutory deadlines.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            These terms are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan.
          </p>
        </Card>

        {/* Bottom Helpdesk link */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-deepNavy mb-1">Need clarification on these terms?</div>
            <p className="text-[11px] text-mutedGrey">Our civic team is available to explain statutory compliance guidelines.</p>
          </div>
          <Link href="/contact">
            <Button variant="outline" size="sm" className="bg-white">
              Contact Civic Support →
            </Button>
          </Link>
        </div>

      </div>

    </div>
  );
}
