"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { language, changeLanguage, dir, isRtl, isSaving, saveFeedback, t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [selectedCode, setSelectedCode] = useState(language);
  const [justApplied, setJustApplied] = useState(false);

  const handleApply = async () => {
    await changeLanguage(selectedCode);
    setJustApplied(true);
    setTimeout(() => {
      router.push("/assistant");
    }, 900);
  };

  const handleCardClick = (code) => {
    setSelectedCode(code);
    changeLanguage(code);
  };

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen" dir={dir}>
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">
                {t.navHome}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{t.navLanguage}</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              {t.smartTrafficService}
            </Badge>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              {language === "ur" ? (
                <>
                  زبان منتخب کریں <br />
                  <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                    اردو • پښتو • English
                  </span>
                </>
              ) : language === "ps" ? (
                <>
                  خپله خوښه ژبه وټاکئ <br />
                  <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                    پښتو • اردو • English
                  </span>
                </>
              ) : (
                <>
                  Multilingual Language <br />
                  <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                    Selection & Audio Settings
                  </span>
                </>
              )}
            </h1>

            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>{t.tagline}</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              {t.selectLanguageSub}
            </p>
          </div>
        </div>
      </section>

      {/* Main Selection Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Status / Session Feedback Banner */}
        {isAuthenticated && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <span className="text-lg">👤</span>
              <div>
                <span className="font-bold text-deepNavy">
                  {user?.full_name || "Authenticated Citizen"}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  Preference automatically synchronized with your verified citizen profile.
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Session Linked
            </Badge>
          </div>
        )}

        {saveFeedback && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 rtl:space-x-reverse animate-in fade-in">
            <span>✓</span>
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* 3 Supported Language Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedCode === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => handleCardClick(lang.code)}
                className={`group relative cursor-pointer rounded-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white border p-6 flex flex-col justify-between ${
                  isSelected
                    ? "border-royalBlue shadow-lg shadow-blue-500/10 ring-2 ring-royalBlue bg-gradient-to-b from-white to-blue-50/20"
                    : "border-slate-200 hover:border-slate-300 shadow-card hover:shadow-card-hover"
                }`}
              >
                {/* Active Selection Indicator Pill */}
                {isSelected && (
                  <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-royalBlue text-white shadow-sm">
                      ✓ Active
                    </span>
                  </div>
                )}

                <div>
                  {/* Top Flag / Language Icon */}
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-subtle group-hover:scale-105 transition">
                      {lang.flag}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-deepNavy leading-tight">
                        {lang.nativeName}
                      </h3>
                      <span className="text-xs text-mutedGrey font-medium">
                        {lang.name}
                      </span>
                    </div>
                  </div>

                  {/* Direction & Script Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {lang.dir.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-mutedGrey">
                      {lang.region}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {lang.description}
                  </p>
                </div>

                {/* Spoken Query Preview */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-mutedGrey block uppercase mb-1">
                    Sample Spoken Query
                  </span>
                  <div className="bg-slate-50 group-hover:bg-blue-50/50 p-2.5 rounded-xl border border-slate-200 text-xs text-deepNavy font-medium italic transition">
                    {lang.sampleQuery}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-deepNavy mb-1">
                {t.applyAndContinue}
              </h4>
              <p className="text-xs text-mutedGrey">
                Current selection: <span className="font-bold text-royalBlue">{SUPPORTED_LANGUAGES.find(l => l.code === selectedCode)?.name}</span> ({SUPPORTED_LANGUAGES.find(l => l.code === selectedCode)?.nativeName})
              </p>
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse w-full sm:w-auto">
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto">
                  {t.navHome}
                </Button>
              </Link>

              <Button
                variant="primary"
                size="md"
                onClick={handleApply}
                loading={isSaving || justApplied}
                className="w-full sm:w-auto"
              >
                {justApplied ? "Applied ✓" : `${t.applyAndContinue} →`}
              </Button>
            </div>
          </div>
        </Card>

        {/* Statutory Integrity Safeguard Notice */}
        <div className="mt-8 p-5 bg-[#DCEBFF]/50 border border-blue-200 rounded-2xl text-xs text-deepNavy flex items-start space-x-3 rtl:space-x-reverse">
          <span className="text-xl">⚖️</span>
          <div className="space-y-1">
            <h5 className="font-bold text-xs text-[#061D38]">
              Statutory Traffic Law Integrity Notice
            </h5>
            <p className="text-[11px] text-slate-700 leading-relaxed font-normal">
              {t.statutoryIntegrityNotice}
              {" "}All statutory law sections (such as <em>Motor Vehicles Ordinance 1965, Section 113</em> and <em>National Highways Safety Ordinance 2000</em>) are preserved in their exact official legal citation format to ensure complete authenticity during dispute resolution and traffic officer review.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}