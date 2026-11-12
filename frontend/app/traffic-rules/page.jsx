"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { challanService } from "../../services/challanService";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";

export default function TrafficRulesPage() {
  const { language, changeLanguage, dir, isRtl, t } = useLanguage();
  const [rules, setRules] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Civic plain-language translations mapped to statutory sections
  const statutoryCivicGuides = {
    "Section 113": {
      ur: "تیز رفتاری (Over-Speeding): سڑک پر مقرر کردہ حدِ رفتار سے زیادہ گاڑی چلانا قابلِ گرفت جرم ہے۔ کیمرہ یا اسپیڈ گن کے ذریعے تصدیق ہونے پر چالان جاری کیا جاتا ہے۔",
      ps: "تیز رفتاري (Over-Speeding): په لویه لار یا ښار کې د ټاکل شوي سرعت څخه ډیر موټر چلول سرغړونه ده. د کیمرې یا رادار له لارې ثبوت ثبت کیږي.",
    },
    "Section 89-A": {
      ur: "ہیلمٹ کا عدم استعمال (No Helmet): موٹر سائیکل یا اسکوٹر چلاتے وقت منظور شدہ حفاظتی ہیلمٹ نہ پہننا سنگین خلاف ورزی ہے، جو حادثے کی صورت میں جان لیوا ہو سکتی ہے۔",
      ps: "د هیلمټ نه کارول (No Helmet): د موټر سایکل چلولو پر مهال د معیاري هیلمټ نه لرل قانوني سرغړونه او جریمه لري.",
    },
    "Section 112": {
      ur: "ٹریفک سگنل کی خلاف ورزی (Red Light Violation): سرخ اشارہ توڑنا یا چوک میں بلا اجازت آگے بڑھنا ٹریفک کی روانی اور انسانی جانوں کے لیے انتہائی خطرناک ہے۔",
      ps: "د سرې اشارې ماتول (Signal Violation): د اشارې نه درناوی او په سرې اشارې موټر تېرول د پیښو لامل کیږي او سخته جریمه لري.",
    },
    "Section 3": {
      ur: "ڈرائیونگ لائسنس کے بغیر گاڑی چلانا (Without License): پاکستان میں بغیر درست و فعال کمپیوٹرائزڈ لائسنس کے گاڑی یا موٹر سائیکل چلانا ممنوع اور جرم ہے۔",
      ps: "بې لایسنسه موټر چلول (No Driving License): د قانوني او معتبر لایسنس پرته موټر چلول د قانون خلاف چاره ده.",
    },
    "Section 116": {
      ur: "دورانِ ڈرائیونگ موبائل فون کا استعمال (Mobile Phone Distraction): گاڑی یا موٹر سائیکل چلاتے وقت کال سننا، ٹیکسٹ کرنا یا موبائل استعمال کرنا ڈرائیور کی توجہ ہٹاتا ہے اور جرمانہ عائد ہوتا ہے۔",
      ps: "د موټر چلولو پر مهال د موبایل کارول (Mobile Distraction): د لاس په مرسته موبایل ته کتل یا خبرې کول د پام اړولو له امله قانوني سرغړونه ګڼل کیږي.",
    },
  };

  useEffect(() => {
    async function fetchRules() {
      setLoading(true);
      try {
        const data = await challanService.getTrafficRules(selectedCategory, "", language);
        if (data && data.length > 0) {
          setRules(data);
        }
      } catch (err) {
        console.error("Failed to load traffic rules:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, [selectedCategory, language]);

  const categories = [
    "All",
    "Speeding",
    "Safety",
    "Signals",
    "Distracted Driving",
    "Documentation",
    "Dangerous Driving",
  ];

  const filteredRules = rules.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      r.title.toLowerCase().includes(term) ||
      r.section.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term));
    return matchSearch;
  });

  const getCivicExplanation = (sectionStr) => {
    for (const [secPrefix, guide] of Object.entries(statutoryCivicGuides)) {
      if (sectionStr && sectionStr.includes(secPrefix)) {
        return guide[language];
      }
    }
    return null;
  };

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen" dir={dir}>
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">
                {t.navHome}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{t.navTrafficRules}</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              {t.smartTrafficService}
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Pakistan Traffic Rules & <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                Statutory Penalties
              </span>
            </h1>

            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>{t.tagline}</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Official schedule of traffic violations authorized under the{" "}
              <strong className="text-white">Motor Vehicles Ordinance 1965</strong> and the{" "}
              <strong className="text-white">National Highways Safety Ordinance 2000 (NHSO)</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Statutory Integrity Warning / Protection Notice */}
        <div className="mb-8 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <span className="text-2xl flex-shrink-0">⚖️</span>
            <div>
              <h4 className="font-bold text-deepNavy text-xs">
                Verified Statutory Source Safeguard
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                Technical sections and statutory wording are preserved verbatim in standard legal English to prevent distortion during legal proceedings or police review, accompanied by plain-language Urdu and Pashto civic guidance below.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
            <span className="text-slate-500 text-[11px] font-semibold">{t.navLanguage}:</span>
            <div className="flex space-x-1 rtl:space-x-reverse bg-white border border-slate-300 rounded-full p-1 shadow-sm">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  className={`px-2.5 py-1 text-xs rounded-full font-bold transition ${
                    language === l.code
                      ? "bg-royalBlue text-white shadow-sm"
                      : "text-slate-600 hover:text-deepNavy"
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by violation section (e.g. Section 113), keyword (speeding, helmet, signal)..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-deepNavy text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-royalBlue shadow-sm placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === "All" ? "" : cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition shadow-subtle ${
                  (cat === "All" && !selectedCategory) || selectedCategory === cat
                    ? "bg-royalBlue text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Grid */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-3 border-royalBlue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-mutedGrey font-medium">
              Loading verified statutory schedule from traffic registry...
            </p>
          </div>
        ) : filteredRules.length === 0 ? (
          <Card className="text-center py-12 p-6 border-slate-200">
            <p className="text-sm font-bold text-deepNavy">
              No matching traffic violations found for &ldquo;{searchTerm}&rdquo;
            </p>
            <p className="text-xs text-mutedGrey mt-1">
              Try searching with section numbers like "113", "89-A", or keywords like "speed", "helmet", "signal".
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.map((rule) => {
              const civicGuide =
                (language === "ur" ? rule.description_ur : language === "ps" ? rule.description_ps : null) ||
                getCivicExplanation(rule.section);
              return (
                <Card
                  key={rule.id}
                  hoverable
                  className="flex flex-col justify-between p-6 border-slate-200 shadow-card"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="statutory-code text-[11px] font-bold text-royalBlue bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg shadow-subtle">
                        {rule.section}
                      </span>
                      <Badge variant="navy" size="sm">
                        {rule.category || "General"}
                      </Badge>
                    </div>

                    {/* Verified Official English Title */}
                    <h3 className="text-base font-black text-deepNavy mb-2">
                      {rule.title}
                    </h3>

                    {/* Official Statutory Text (Always preserved) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Verified Statutory Definition:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {rule.description}
                      </p>
                    </div>

                    {/* Multilingual Plain-Language Civic Explanation (Urdu or Pashto when active) */}
                    {civicGuide && (language === "ur" || language === "ps") && (
                      <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between text-[10px] text-royalBlue font-bold mb-1">
                          <span>
                            {language === "ur" ? "عوامی وضاحت (اردو)" : "ولسي وضاحت (پښتو)"}
                          </span>
                          <span className="text-[10px]">✓ تصدیق شدہ</span>
                        </div>
                        <p className={`text-xs text-[#061D38] leading-relaxed ${language === "ur" ? "font-urdu" : "font-pashto"}`}>
                          {civicGuide}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Penalty & Voice Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-mutedGrey block">
                        Prescribed Penalty
                      </span>
                      <span className="text-base sm:text-lg font-black text-rose-600">
                        Rs. {rule.penalty_amount?.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/assistant?q=Tell me details about ${encodeURIComponent(rule.title)} under ${encodeURIComponent(rule.section)}`}
                    >
                      <Button variant="primary" size="sm" className="space-x-1 rtl:space-x-reverse">
                        <span>🎙️</span>
                        <span>Ask AI</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}