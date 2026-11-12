"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/authService";

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
    flag: "🇬🇧",
    region: "Statutory Law & Civic Standard",
    description: "Official statutory legal language with standard traffic terminology.",
    sampleQuery: "“What is the fine for speeding under Section 113?”",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    dir: "rtl",
    flag: "🇵🇰",
    region: "قومی زبان (Pakistan National)",
    description: "ٹریفک قوانین، جرمانوں اور چالان کی قانونی وضاحت اپنی قومی زبان میں۔",
    sampleQuery: "”اوور اسپیڈنگ اور اشارہ توڑنے پر کتنا جرمانہ ہے؟“",
  },
  {
    code: "ps",
    name: "Pashto",
    nativeName: "پښتو",
    dir: "rtl",
    flag: "🇵🇰",
    region: "خیبر پختونخوا او بلوچستان",
    description: "د ټرافیکي قوانینو، جریمو او چالان په اړه توضیحات په پښتو ژبه کې.",
    sampleQuery: "”د اشارې ماتولو او بې هلمټه موټر سایکل جریمه څومره ده؟“",
  },
];

export const UI_TRANSLATIONS = {
  en: {
    // Navigation
    navHome: "Home",
    navAbout: "About",
    navFeatures: "Features",
    navHowItWorks: "How It Works",
    navTrafficRules: "Traffic Rules",
    navFAQ: "FAQ",
    navContact: "Contact",
    navLogin: "Login",
    navDashboard: "Dashboard",
    navScanChallan: "Scan Challan",
    navLogout: "Logout",
    navLanguage: "Language",

    // Branding & Tagline
    projectTitle: "AI Traffic Voice Assistant",
    tagline: "Ask. Understand. Follow.",
    smartTrafficService: "Smart Traffic Service",
    driveSafeRules: "Drive Safe. Follow Rules.",

    // Hero Section
    heroMainTitle: "AI Traffic",
    heroVoiceHighlight: "Voice Assistant",
    heroSubtitle:
      "Get instant information about your traffic challan, traffic rules and violations — using voice or text.",
    scanChallanBtn: "Scan Challan",
    getAssistanceBtn: "Get Assistance",
    supportedLanguagesLabel: "Supported Languages",

    // Service Cards
    card1Title: "QR Challan Verification",
    card1Desc: "Scan and verify your challan instantly.",
    card2Title: "Traffic Rule Information",
    card2Desc: "Get accurate information about traffic rules.",
    card3Title: "Multilingual Voice Assistant",
    card3Desc: "Ask questions in Urdu, Pashto or English.",
    card4Title: "Challan Details",
    card4Desc: "View your challan details securely.",

    // How It Works
    howItWorksTitle: "How It Works?",
    howItWorksSubtitle: "Just 4 simple steps to get the information you need",
    step1Title: "Scan Challan QR Code",
    step1Desc: "Scan the QR code printed on your official paper citation.",
    step2Title: "Verify with OTP",
    step2Desc: "Secure authentication using one-time SMS verification code.",
    step3Title: "Select Language",
    step3Desc: "Choose Urdu, Pashto or English according to your comfort.",
    step4Title: "Ask Your Question",
    step4Desc: "Speak naturally or type your traffic violation inquiry.",

    // Trust & Security
    trustedSecureTitle: "Trusted & Secure",
    trustedSecureDesc: "Your data is safe with us using advanced security.",
    learnMoreBtn: "Learn More",

    // Footer
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    helpCenter: "Help Center",
    contactUs: "Contact Us",
    followUs: "Follow Us",
    copyrightText: "© 2025 AI Traffic Voice Assistant. All rights reserved.",

    // Common Interface
    languagePreferenceSaved: "Language preference saved successfully",
    savingPreference: "Saving preference...",
    selectLanguageHeading: "Select Your Preferred Language",
    selectLanguageSub:
      "The voice assistant and interface will adapt to your chosen language. Official statutory sections remain accessible in English for legal precision.",
    applyAndContinue: "Apply & Continue",
    speakQuery: "Speak Your Query",
    askAssistant: "Ask AI Assistant",
    verifiedOfficialRecord: "Verified Official Record",
    issuingAuthority: "Issuing Authority",
    citationReference: "Citation Reference",
    vehicleRegistration: "Vehicle Registration",
    offenseSection: "Offense / Violation Section",
    penaltyAmount: "Penalty Amount",
    status: "Status",
    statutoryIntegrityNotice:
      "Statutory traffic violation sections (MVO 1965 / NHSO 2000) are cited in verified legal form for authenticity.",
  },
  ur: {
    // Navigation
    navHome: "ہوم",
    navAbout: "تعارف",
    navFeatures: "خصوصیات",
    navHowItWorks: "طریقہ کار",
    navTrafficRules: "ٹریفک قوانین",
    navFAQ: "سوالات و جوابات",
    navContact: "رابطہ",
    navLogin: "لاگ ان",
    navDashboard: "ڈیش بورڈ",
    navScanChallan: "چالان اسکین کریں",
    navLogout: "لاگ آؤٹ",
    navLanguage: "زبان",

    // Branding & Tagline
    projectTitle: "اے آئی ٹریفک وائس اسسٹنٹ",
    tagline: "پوچھیں۔ سمجھیں۔ عمل کریں۔",
    smartTrafficService: "سمارٹ ٹریفک سروس",
    driveSafeRules: "محفوظ چلائیں، قوانین پر عمل کریں۔",

    // Hero Section
    heroMainTitle: "اے آئی ٹریفک",
    heroVoiceHighlight: "وائس اسسٹنٹ",
    heroSubtitle:
      "اپنے ٹریفک چالان، ٹریفک قوانین اور خلاف ورزیوں کے بارے میں فوری معلومات حاصل کریں — آواز یا تحریر کے ذریعے۔",
    scanChallanBtn: "چالان اسکین کریں",
    getAssistanceBtn: "معاونت حاصل کریں",
    supportedLanguagesLabel: "معاون زبانیں",

    // Service Cards
    card1Title: "کیو آر چالان تصدیق",
    card1Desc: "اپنے چالان کو فوری اسکین اور تصدیق کریں۔",
    card2Title: "ٹریفک قوانین کی معلومات",
    card2Desc: "ٹریفک قوانین کی مستند معلومات حاصل کریں۔",
    card3Title: "کثیر لسانی وائس اسسٹنٹ",
    card3Desc: "اردو، پشتو یا انگریزی میں باآسانی سوال پوچھیں۔",
    card4Title: "چالان کی تفصیلات",
    card4Desc: "اپنے چالان کی مکمل تفصیلات محفوظ طریقے سے دیکھیں۔",

    // How It Works
    howItWorksTitle: "یہ کیسے کام کرتا ہے؟",
    howItWorksSubtitle: "ضروری معلومات کے حصول کے لیے صرف ۴ آسان مراحل",
    step1Title: "چالان کا کیو آر کوڈ اسکین کریں",
    step1Desc: "اپنے کاغذی چالان پر موجود کیو آر کوڈ کو کیمرے سے اسکین کریں۔",
    step2Title: "او ٹی پی سے تصدیق کریں",
    step2Desc: "موبائل پر موصولہ یک وقتی کوڈ کے ذریعے محفوظ تصدیق۔",
    step3Title: "اپنی زبان منتخب کریں",
    step3Desc: "اپنی سہولت کے مطابق اردو، پشتو یا انگریزی کا انتخاب کریں۔",
    step4Title: "اپنا سوال پوچھیں",
    step4Desc: "قدرتی انداز میں بول کر یا لکھ کر اپنا مسئلہ بیان کریں۔",

    // Trust & Security
    trustedSecureTitle: "محفوظ اور قابلِ اعتماد",
    trustedSecureDesc: "آپ کی معلومات جدید ترین سیکیورٹی کے تحت مکمل محفوظ ہیں۔",
    learnMoreBtn: "مزید جانیں",

    // Footer
    privacyPolicy: "رازداری کی پالیسی",
    termsConditions: "قواعد و ضوابط",
    helpCenter: "امدادی مرکز",
    contactUs: "ہم سے رابطہ کریں",
    followUs: "سوشل میڈیا",
    copyrightText: "© ۲۰۲۵ اے آئی ٹریفک وائس اسسٹنٹ۔ جملہ حقوق محفوظ ہیں۔",

    // Common Interface
    languagePreferenceSaved: "زبان کی ترجیح کامیابی سے محفوظ ہو گئی ہے",
    savingPreference: "ترجیح محفوظ ہو رہی ہے...",
    selectLanguageHeading: "اپنی پسندیدہ زبان منتخب کریں",
    selectLanguageSub:
      "وائس اسسٹنٹ اور انٹرفیس آپ کی منتخب کردہ زبان کے مطابق ہو جائے گا۔ قانونی صداقت کے لیے ٹریفک قوانین کے اصل ایکٹ و سیکشن انگریزی میں بھی دستیاب رہیں گے۔",
    applyAndContinue: "لاگو کریں اور آگے بڑھیں",
    speakQuery: "بول کر سوال پوچھیں",
    askAssistant: "اے آئی اسسٹنٹ سے پوچھیں",
    verifiedOfficialRecord: "تصدیق شدہ سرکاری ریکارڈ",
    issuingAuthority: "جاری کنندہ ادارہ",
    citationReference: "چالان ریفرنس نمبر",
    vehicleRegistration: "گاڑی کا رجسٹریشن نمبر",
    offenseSection: "خلاف ورزی اور قانونی سیکشن",
    penaltyAmount: "جرمانے کی رقم",
    status: "حیثیت",
    statutoryIntegrityNotice:
      "قانونی اصطلاحات (MVO 1965 / NHSO 2000) کی مستند قانونی شکل برقرار رکھی گئی ہے تاکہ صداقت پر آنچ نہ آئے۔",
  },
  ps: {
    // Navigation
    navHome: "کورپاڼه",
    navAbout: "زموږ په اړه",
    navFeatures: "ځانګړتیاوې",
    navHowItWorks: "کړنلاره",
    navTrafficRules: "ټرافیکي قوانین",
    navFAQ: "پوښتنې او ځوابونه",
    navContact: "اړیکه",
    navLogin: "ننوتل",
    navDashboard: "ډشبورډ",
    navScanChallan: "چالان سکن کړئ",
    navLogout: "وتل",
    navLanguage: "ژبه",

    // Branding & Tagline
    projectTitle: "د ټرافیک سمارټ غږیز مرستیال",
    tagline: "پوښتنه وکړئ. پوه شئ. عمل وکړئ.",
    smartTrafficService: "سمارټ ټرافیک خدمت",
    driveSafeRules: "په احتیاط چلول، د قوانینو درناوی.",

    // Hero Section
    heroMainTitle: "د ټرافیک سمارټ",
    heroVoiceHighlight: "غږیز مرستیال",
    heroSubtitle:
      "د خپل ټرافیکي چالان، قوانینو او سرغړونو په اړه سمدستي معلومات په پښتو غږ یا لیکلې بڼه ترلاسه کړئ.",
    scanChallanBtn: "چالان سکن کړئ",
    getAssistanceBtn: "لارښوونه ترلاسه کړئ",
    supportedLanguagesLabel: "ملاتړ شوې ژبې",

    // Service Cards
    card1Title: "د کیو آر چالان تصدیق",
    card1Desc: "خپل چالان سمدستي سکن او تایید کړئ.",
    card2Title: "د ټرافیکي قوانینو معلومات",
    card2Desc: "د باوري قوانینو او مقرراتو په هکله پوه شئ.",
    card3Title: "څو ژبنیز غږیز مرستیال",
    card3Desc: "په پښتو، اردو یا انګلیسي کې اسانه پوښتنه وکړئ.",
    card4Title: "د چالان بشپړ معلومات",
    card4Desc: "د خپل جریمې جزئیات په خوندي توګه وګورئ.",

    // How It Works
    howItWorksTitle: "دا څنګه کار کوي؟",
    howItWorksSubtitle: "د اړینو معلوماتو ترلاسه کولو لپاره یوازې ۴ اسانه ګامونه",
    step1Title: "د چالان کیو آر کوډ سکن کړئ",
    step1Desc: "په کاغذي ټکټ باندې موجود کیو آر کوډ په کیمرې سره سکن کړئ.",
    step2Title: "د او ټي پي له لارې تایید کړئ",
    step2Desc: "موبایل ته د لیږل شوي یو ځلي کوډ له لارې خوندي پخلی.",
    step3Title: "خپله ژبه وټاکئ",
    step3Desc: "پښتو، اردو یا انګلیسي د خپلې خوښې سره سم انتخاب کړئ.",
    step4Title: "خپله پوښتنه وپوښتئ",
    step4Desc: "په غږیزه بڼه یا لیکلو سره خپل معلومات ترلاسه کړئ.",

    // Trust & Security
    trustedSecureTitle: "باوري او خوندي",
    trustedSecureDesc: "ستاسو ټول معلومات د پرمختللي امنیت له مخې خوندي دي.",
    learnMoreBtn: "نور مالومات",

    // Footer
    privacyPolicy: "د محرمیت تګلاره",
    termsConditions: "شرایط او مقررات",
    helpCenter: "د مرستې مرکز",
    contactUs: "له موږ سره اړیکه",
    followUs: "ټولنیزې شبکې",
    copyrightText: "© ۲۰۲۵ د ټرافیک غږیز مرستیال. ټول حقونه خوندي دي.",

    // Common Interface
    languagePreferenceSaved: "د ژبې انتخاب په بریا سره خوندي شو",
    savingPreference: "ژبه خوندي کیږي...",
    selectLanguageHeading: "خپله غوره شوې ژبه وټاکئ",
    selectLanguageSub:
      "د غږیز مرستیال ټول ځوابونه به ستاسو په خوښه ژبه وي. قانوني مادو او اصلي متنونه په رسمي انګلیسي بڼه هم خوندي دي.",
    applyAndContinue: "تایید او دوام ورکول",
    speakQuery: "په غږ پوښتنه وکړئ",
    askAssistant: "له غږیز مرستیال څخه پوښتنه",
    verifiedOfficialRecord: "تصدیق شوی رسمي ریکارډ",
    issuingAuthority: "صادرونکی ارګان",
    citationReference: "د چالان شمېره",
    vehicleRegistration: "د موټر نمبر پلیټ",
    offenseSection: "ټرافیکي ماده او سرغړونه",
    penaltyAmount: "د جریمې اندازه",
    status: "حالت",
    statutoryIntegrityNotice:
      "قانوني مواد او ټرافیکي مادې د اصل له مخې خوندي ساتل کیږي ترڅو قانوني وضاحت له منځه لاړ نشي.",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");

  // Sync HTML dir and lang tags
  const applyHtmlAttributes = useCallback((langCode) => {
    if (typeof document === "undefined") return;
    const isRtl = langCode === "ur" || langCode === "ps";
    const dir = isRtl ? "rtl" : "ltr";

    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", langCode);

    if (isRtl) {
      document.body.classList.add("rtl-mode");
      if (langCode === "ur") {
        document.body.classList.add("font-urdu");
        document.body.classList.remove("font-pashto");
      } else {
        document.body.classList.add("font-pashto");
        document.body.classList.remove("font-urdu");
      }
    } else {
      document.body.classList.remove("rtl-mode", "font-urdu", "font-pashto");
    }
  }, []);

  // Hydrate preference on mount: localStorage > session cookie > fallback 'en'
  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferred_lang");
      if (saved && (saved === "en" || saved === "ur" || saved === "ps")) {
        setLanguageState(saved);
        applyHtmlAttributes(saved);
      } else {
        // Also check if user object has preferred_language
        const savedUserStr = localStorage.getItem("traffic_user");
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          if (u.preferred_language && (u.preferred_language === "en" || u.preferred_language === "ur" || u.preferred_language === "ps")) {
            setLanguageState(u.preferred_language);
            applyHtmlAttributes(u.preferred_language);
            localStorage.setItem("preferred_lang", u.preferred_language);
          }
        }
      }
    } catch (e) {
      console.error("Language hydration error:", e);
    }
  }, [applyHtmlAttributes]);

  // Language switch function
  const changeLanguage = useCallback(
    async (newLang, syncWithBackend = true) => {
      if (!["en", "ur", "ps"].includes(newLang)) return;

      setLanguageState(newLang);
      applyHtmlAttributes(newLang);

      try {
        localStorage.setItem("preferred_lang", newLang);
        // Also store cookie for server-side persistence
        if (typeof document !== "undefined") {
          document.cookie = `preferred_lang=${newLang};path=/;max-age=31536000;SameSite=Lax`;
        }

        // If user is authenticated, sync with backend profile
        const token = localStorage.getItem("traffic_token");
        if (syncWithBackend && token) {
          setIsSaving(true);
          setSaveFeedback("Saving preference...");
          try {
            await authService.updatePreferredLanguage(newLang);
            // Update local user object
            const savedUserStr = localStorage.getItem("traffic_user");
            if (savedUserStr) {
              const u = JSON.parse(savedUserStr);
              u.preferred_language = newLang;
              localStorage.setItem("traffic_user", JSON.stringify(u));
            }
            setSaveFeedback("Language preference saved for authenticated session");
          } catch (syncErr) {
            console.warn("Backend language sync failed, local preference saved:", syncErr);
            setSaveFeedback("Saved for current browser session");
          } finally {
            setIsSaving(false);
            setTimeout(() => setSaveFeedback(""), 3500);
          }
        }
      } catch (err) {
        console.error("Error updating language preference:", err);
      }
    },
    [applyHtmlAttributes]
  );

  // Dynamic translator with foolproof English fallback & Proxy support
  const t = useMemo(() => {
    const currentDict = UI_TRANSLATIONS[language] || {};
    const enDict = UI_TRANSLATIONS.en || {};

    const translateFn = (key, defaultFallback) => {
      if (currentDict[key] !== undefined && currentDict[key] !== "") {
        return currentDict[key];
      }
      if (enDict[key] !== undefined && enDict[key] !== "") {
        return enDict[key];
      }
      return defaultFallback !== undefined ? defaultFallback : key;
    };

    return new Proxy(translateFn, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (currentDict[prop] !== undefined && currentDict[prop] !== "") {
          return currentDict[prop];
        }
        if (enDict[prop] !== undefined && enDict[prop] !== "") {
          return enDict[prop];
        }
        return prop;
      },
    });
  }, [language]);

  const currentLangObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRtl = language === "ur" || language === "ps";

  // Statutory Citation Formatter: Preserves authentic legal wording with explanatory translation
  const formatStatutoryRule = useCallback(
    (rule) => {
      if (!rule) return null;
      return {
        officialSection: rule.section, // e.g. "Section 113, Motor Vehicles Ordinance 1965"
        officialTitle: rule.title,
        penaltyAmount: rule.penalty_amount,
        penaltyPoints: rule.penalty_points,
        // Verified civic explanation in active language
        description:
          language === "ur" && rule.description_ur
            ? rule.description_ur
            : language === "ps" && rule.description_ps
            ? rule.description_ps
            : rule.description,
        isOriginalVerified: true,
      };
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        languages: SUPPORTED_LANGUAGES,
        currentLangObj,
        isRtl,
        dir: isRtl ? "rtl" : "ltr",
        t,
        isSaving,
        saveFeedback,
        formatStatutoryRule,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}