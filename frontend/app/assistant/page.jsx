"use client";
import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { assistantService } from "../../services/assistantService";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import AudioPlayerControls from "../../components/AudioPlayerControls";
import WorkflowStepper from "../../components/WorkflowStepper";

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { language, changeLanguage, dir, t } = useLanguage();

  // Input & Query State
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: input, 2: transcribe, 3: retrieval, 4: llama3, 5: tts
  const [statusMessage, setStatusMessage] = useState("");
  const [isVoiceQuery, setIsVoiceQuery] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [activeUploadFile, setActiveUploadFile] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // Initial multilingual greetings
  const initialGreeting = useMemo(
    () => ({
      en: "Hello! I am your AI Traffic Voice Assistant. You can speak into your microphone, upload an audio recording, or type your question.\n\nFor example:\n• \"What is the fine for speeding under Section 113?\"\n• \"Why did I get this challan?\"\n• \"What is the helmet law under Section 89-A?\"",
      ur: "السلام علیکم! میں آپ کا اے آئی ٹریفک وائس اسسٹنٹ ہوں۔ آپ مائیکروفون پر بول کر، آڈیو فائل اپلوڈ کر کے یا لکھ کر ٹریفک قوانین، جرمانوں اور چالان کے بارے میں اردو میں پوچھ سکتے ہیں۔\n\nمثال کے طور پر:\n• ”دفعہ 113 کے تحت تیز رفتاری پر کتنا جرمانہ ہے؟“\n• ”موٹر سائیکل پر ہیلمٹ نہ پہننے کی کیا سزا ہے؟“\n• ”گاڑی ICT-LE-402 کا چالان چیک کریں۔“",
      ps: "سلامونه! زه ستاسو د ټرافیک سمارټ غږیز مرستیال یم. تاسو کولی شئ د خپل غږ ثبتولو له لارې، د آډیو فایل په اپلوډ کولو یا لیکلو سره د خپلو چالان او جریمو په هکله په پښتو ژبه وپوښتئ.\n\nد مثال په توګه:\n• ”د اشارې ماتولو جریمه څومره ده؟“\n• ”د موټر چلولو لایسنس قانوني شرایط څه دي؟“",
    }),
    []
  );

  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: initialGreeting[language] || initialGreeting.en,
      audio: null,
      audioFormat: "mp3",
      voiceInfo: null,
      status: "GREETING",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Audio Recorder Hook
  const {
    isRecording,
    recordingDuration,
    volumeLevel,
    error: micError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Initialize Session ID and Auto-play preference from localStorage
  useEffect(() => {
    let savedSession = localStorage.getItem("assistant_session_id");
    if (!savedSession) {
      savedSession = "conv-" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("assistant_session_id", savedSession);
    }
    setSessionId(savedSession);

    const savedAutoPlay = localStorage.getItem("assistant_autoplay_voice");
    if (savedAutoPlay !== null) {
      setAutoPlayVoice(savedAutoPlay === "true");
    }
  }, []);

  // Sync greetings when user changes language (if conversation only has greeting)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].status === "GREETING") {
        return [
          {
            sender: "assistant",
            text: initialGreeting[language] || initialGreeting.en,
            audio: null,
            audioFormat: "mp3",
            voiceInfo: null,
            status: "GREETING",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [language, initialGreeting]);

  // Handle URL query parameter (?q=...)
  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Auto scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isRecording]);

  // Toggle Auto-play Voice preference
  const toggleAutoPlay = () => {
    const nextVal = !autoPlayVoice;
    setAutoPlayVoice(nextVal);
    localStorage.setItem("assistant_autoplay_voice", String(nextVal));
  };

  // Copy text to clipboard
  const handleCopy = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // WORKFLOW 1: TEXT QUERY SUBMISSION
  // ---------------------------------------------------------------------------
  const handleSend = async (textToSend) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || loading || isRecording) return;

    setLastFailedQuery(null);
    setIsVoiceQuery(false);
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Step 1: User Question Input
    const userMessage = {
      sender: "user",
      text,
      timestamp: timeNow,
      isSpoken: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    // Step 2-4: Progression through legal knowledge retrieval & Llama 3
    setPipelineStep(3);
    setStatusMessage(
      language === "ur"
        ? "مستند ٹریفک قوانین تلاش کیے جا رہے ہیں..."
        : language === "ps"
        ? "د ټرافیکي قوانینو څېړنه روانه ده..."
        : "Retrieving verified statutes from MVO 1965 & NHSO 2000..."
    );

    try {
      // Simulate step transition for clear feedback
      setTimeout(() => {
        setPipelineStep(4);
        setStatusMessage(
          language === "ur"
            ? "لاما 3 قانونی جواب تیار کر رہا ہے..."
            : language === "ps"
            ? "لاما 3 قانوني ځواب جوړوي..."
            : "Llama 3 synthesizing grounded statutory legal answer..."
        );
      }, 500);

      const res = await assistantService.sendQuery(text, language, null, sessionId);

      setPipelineStep(5);
      setStatusMessage(
        language === "ur"
          ? "کوکی ٹی ٹی ایس صوتی آواز تیار کر رہا ہے..."
          : language === "ps"
          ? "کوکی ټي ټي ایس غږیز ځواب تیاروي..."
          : "Coqui TTS synthesizing playable speech..."
      );

      const assistantMessage = {
        sender: "assistant",
        text: res.reply_text,
        audio: res.audio_base64,
        audioFormat: res.audio_format || "mp3",
        voiceInfo: res.voice_info,
        language: res.language || language,
        actionData: res.action_data,
        intent: res.intent,
        status: res.status,
        modelUsed: res.model_used,
        ragSources: res.rag_sources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI Assistant query error:", err);
      setLastFailedQuery(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            language === "ur"
              ? "سرور سے رابطہ قائم نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔"
              : language === "ps"
              ? "له سرور سره اړیکه ونه شوه. مهرباني وکړئ خپل انټرنېټ وګورئ او بیا هڅه وکړئ."
              : "Encountered a communication issue with the traffic statutory server. Please check your network and retry.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setPipelineStep(0);
      setStatusMessage("");
      inputRef.current?.focus();
    }
  };

  // ---------------------------------------------------------------------------
  // WORKFLOW 2: LIVE MICROPHONE SPEECH -> WHISPER -> LLAMA 3 -> COQUI TTS
  // ---------------------------------------------------------------------------
  const handleStopRecordingAndProcess = async () => {
    const blob = await stopRecording();
    if (!blob || blob.size < 100) {
      resetRecording();
      return;
    }

    setLastFailedQuery(null);
    setIsVoiceQuery(true);
    setLoading(true);

    // Pipeline Step 2: Whisper STT Transcription
    setPipelineStep(2);
    setStatusMessage(
      language === "ur"
        ? "وسپر آواز کو تحریر میں تبدیل کر رہا ہے..."
        : language === "ps"
        ? "وسپر ستاسو غږ په متن بدلوي..."
        : "Whisper STT transcribing spoken speech..."
    );

    try {
      const res = await assistantService.sendVoiceAudio(
        blob,
        language,
        sessionId,
        "mic-recording.webm"
      );

      // Step 1 & 2 Completed: Add user turn with Whisper transcript & confidence
      const userMessage = {
        sender: "user",
        text: res.transcript || "[Spoken Audio Query]",
        transcriptionMeta: res.transcription_meta,
        isSpoken: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      // Step 3-5 Completed: Add assistant legal response + Coqui TTS audio
      const assistantMessage = {
        sender: "assistant",
        text: res.reply_text,
        audio: res.audio_base64,
        audioFormat: res.audio_format || "mp3",
        voiceInfo: res.voice_info,
        language: res.language || language,
        actionData: res.action_data,
        intent: res.intent,
        status: res.status,
        modelUsed: res.model_used,
        ragSources: res.rag_sources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      console.error("Whisper Voice Pipeline error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            err.message ||
            (language === "ur"
              ? "آواز ریکارڈنگ کی پروسیسنگ میں دشواری پیش آئی۔ برائے مہربانی صاف آواز میں دوبارہ بولیں۔"
              : "Failed to transcribe audio speech. Please ensure your microphone is clear and try again."),
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setPipelineStep(0);
      setStatusMessage("");
      resetRecording();
    }
  };

  // ---------------------------------------------------------------------------
  // WORKFLOW 3: AUDIO FILE UPLOAD (WAV, MP3, WebM, M4A)
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Audio file exceeds the maximum 25 MB limit.");
      return;
    }

    setActiveUploadFile(file.name);
    setIsVoiceQuery(true);
    setLoading(true);
    setPipelineStep(2);
    setStatusMessage(`Uploading "${file.name}" & transcribing with Whisper STT...`);

    try {
      const res = await assistantService.sendVoiceAudio(file, language, sessionId, file.name);

      const userMessage = {
        sender: "user",
        text: res.transcript || `[Uploaded Audio: ${file.name}]`,
        transcriptionMeta: res.transcription_meta,
        isSpoken: true,
        fileName: file.name,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const assistantMessage = {
        sender: "assistant",
        text: res.reply_text,
        audio: res.audio_base64,
        audioFormat: res.audio_format || "mp3",
        voiceInfo: res.voice_info,
        language: res.language || language,
        actionData: res.action_data,
        intent: res.intent,
        status: res.status,
        modelUsed: res.model_used,
        ragSources: res.rag_sources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      console.error("Audio file upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: err.message || "Failed to process uploaded audio file.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setPipelineStep(0);
      setStatusMessage("");
      setActiveUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------------------------
  // CLEAR CONVERSATION
  // ---------------------------------------------------------------------------
  const confirmClearSession = async () => {
    setShowClearConfirm(false);
    if (sessionId) {
      try {
        await assistantService.deleteConversation(sessionId);
      } catch (e) {
        // best effort
      }
    }
    const freshSession = "conv-" + Math.random().toString(36).substring(2, 12);
    localStorage.setItem("assistant_session_id", freshSession);
    setSessionId(freshSession);
    setMessages([
      {
        sender: "assistant",
        text: initialGreeting[language] || initialGreeting.en,
        audio: null,
        audioFormat: "mp3",
        voiceInfo: null,
        status: "GREETING",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Quick Suggestion Chips
  const quickChips = useMemo(() => {
    if (language === "ur") {
      return [
        { label: "دفعہ 113 اوور اسپیڈنگ کا جرمانہ", query: "دفعہ 113 کے تحت اوور اسپیڈنگ پر کتنا جرمانہ ہے؟" },
        { label: "ہیلمٹ نہ پہننے کی سزا (دفعہ 89-A)", query: "موٹر سائیکل پر ہیلمٹ نہ پہننے پر کتنا جرمانہ ہے؟" },
        { label: "ریڈ سگنل توڑنے کا جرمانہ", query: "سرخ اشارہ توڑنے پر کیا جرمانہ اور سزا ہے؟" },
        { label: "گاڑی ICT-LE-402 کا چالان", query: "Check pending challans for vehicle ICT-LE-402" },
      ];
    }
    if (language === "ps") {
      return [
        { label: "د اشارې ماتولو جریمه (پښتو)", query: "د اشارې ماتولو جریمه څومره ده؟" },
        { label: "د تیز رفتارۍ قانون او جریمه", query: "د تیز رفتارۍ قانون او جریمه څومره ده؟" },
        { label: "د موټر چلولو لایسنس قانون", query: "د موټر چلولو لایسنس قانوني شرایط څه دي؟" },
        { label: "چالان وګورئ ICT-LE-402", query: "Check pending challans for vehicle ICT-LE-402" },
      ];
    }
    return [
      { label: "Why did I get this challan?", query: "Why did I get this challan?" },
      { label: "Over-speeding Fine (Sec 113)", query: "What is the fine for speeding under Section 113?" },
      { label: "Helmet Requirement (Sec 89-A)", query: "What is the penalty for not wearing a helmet under Section 89-A?" },
      { label: "Traffic Signal Violation (Sec 112)", query: "What is the penalty for violating traffic light under Section 112?" },
      { label: "Check Vehicle ICT-LE-402", query: "Check pending challans for vehicle ICT-LE-402" },
    ];
  }, [language]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8" dir={dir} role="main" aria-label="AI Traffic Voice Assistant Studio">
      
      {/* 1. STUDIO HEADER BAR */}
      <header className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl mb-4 sm:mb-6 border border-cyan-neon/30 bg-navy-950/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Assistant Identity */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse w-full md:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shield-logo.png"
              alt="National Traffic Shield"
              className="w-11 h-11 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  AI Traffic Voice Assistant
                </h1>
                <span className="text-[10px] text-cyan-neon bg-cyan-950/90 px-2.5 py-0.5 rounded-full border border-cyan-neon/40 font-mono tracking-wider">
                  Whisper STT • Llama 3 • Coqui TTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pakistan Statutory Law Compliance Studio • Motor Vehicles Ordinance 1965
              </p>
            </div>
          </div>

          {/* Action Toolbar: Auto-Play, Clear Chat, Language Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Auto-play voice toggle */}
            <button
              onClick={toggleAutoPlay}
              aria-label={`Toggle voice auto-play. Current: ${autoPlayVoice ? "Enabled" : "Disabled"}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 rtl:space-x-reverse ${
                autoPlayVoice
                  ? "bg-cyan-950/80 text-cyan-neon border-cyan-neon/50 shadow-glow-cyan/20"
                  : "bg-navy-900 text-slate-400 border-slate-700 hover:text-white"
              }`}
              title="Toggle automatic speech playback on answer arrival"
            >
              <span>{autoPlayVoice ? "🔊 Auto-Voice: ON" : "🔇 Auto-Voice: OFF"}</span>
            </button>

            {/* Clear Conversation Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear conversation history and start fresh"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-navy-900 hover:bg-navy-850 border border-slate-700 transition flex items-center space-x-1 rtl:space-x-reverse"
              title="Start a new clean session"
            >
              <span>🧹</span>
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            {/* Language Selector Pills */}
            <nav className="flex items-center space-x-1 rtl:space-x-reverse bg-navy-900 p-1 rounded-xl border border-slate-700" aria-label="Language Selector">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  aria-pressed={language === l.code}
                  aria-label={`Switch language to ${l.name}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    language === l.code
                      ? "bg-gradient-to-r from-royal-600 to-cyan-500 text-white shadow-glow-cyan"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{l.nativeName}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. ARCHITECTURE WORKFLOW PIPELINE STEPPER */}
      <WorkflowStepper
        activeStep={pipelineStep}
        isProcessing={loading}
        isVoice={isVoiceQuery}
        language={language}
      />

      {/* 3. MAIN CONVERSATION CONTAINER */}
      <section
        className="glass-card rounded-2xl shadow-2xl h-[530px] flex flex-col overflow-hidden border border-slate-700/80 bg-navy-950/70"
        aria-label="Conversation Chat Stream"
      >
        {/* Messages Stream */}
        <div
          className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4 focus:outline-none"
          role="log"
          aria-live="polite"
          tabIndex={0}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-xl rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg relative ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-royal-600 to-blue-600 text-white rounded-br-none shadow-glow-blue/30"
                    : m.isError
                    ? "bg-rose-950/90 text-rose-200 border border-rose-700 rounded-bl-none"
                    : "bg-navy-850/95 text-slate-200 rounded-bl-none border border-slate-700/80 shadow-md"
                } ${m.language === "ur" || language === "ur" ? "font-urdu" : ""} ${
                  m.language === "ps" || language === "ps" ? "font-pashto" : ""
                }`}
              >
                {/* Message Header Bar */}
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10 text-xs">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-neon">
                      {m.sender === "user" ? "You" : "AI Traffic Assistant"}
                    </span>

                    {/* Spoken Query Tag */}
                    {m.isSpoken && (
                      <span className="text-[9px] bg-royal-700/80 text-cyan-200 px-1.5 py-0.2 rounded font-mono">
                        🎙️ Spoken Voice
                      </span>
                    )}

                    {/* Legal Grounding Status Badge */}
                    {m.status === "VERIFIED" && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600/70 px-2 py-0.2 rounded font-mono flex items-center space-x-1">
                        <span>✓</span>
                        <span>Verified Statute</span>
                      </span>
                    )}
                    {m.status === "UNAVAILABLE" && (
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/70 px-2 py-0.2 rounded font-mono flex items-center space-x-1">
                        <span>ℹ️</span>
                        <span>Statute Unavailable</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-[10px] text-slate-400">
                    {/* Timestamp */}
                    <span>{m.timestamp}</span>

                    {/* Copy Response Button */}
                    {m.sender === "assistant" && m.status !== "GREETING" && (
                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        aria-label="Copy assistant answer text"
                        className="hover:text-white transition px-1 py-0.5 rounded bg-navy-900/60 border border-slate-700 text-[10px]"
                        title="Copy text to clipboard"
                      >
                        {copiedIndex === idx ? "✓ Copied" : "📋 Copy"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Text Content */}
                <p className="whitespace-pre-line text-xs sm:text-sm font-medium leading-relaxed">
                  {m.text}
                </p>

                {/* Whisper STT Transcription Metadata (when voice was transcribed) */}
                {m.transcriptionMeta && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                      🎯 Whisper STT: {Math.round(m.transcriptionMeta.confidence * 100)}% Confidence
                    </span>
                    {m.transcriptionMeta.duration_seconds && (
                      <span className="text-slate-300 font-mono">
                        ⏱️ Audio Length: {m.transcriptionMeta.duration_seconds}s
                      </span>
                    )}
                    {m.transcriptionMeta.is_uncertain && (
                      <span className="text-amber-400 font-bold block w-full mt-1 bg-amber-950/50 p-1.5 rounded border border-amber-700/50">
                        ⚠️ {m.transcriptionMeta.uncertainty_warning || "Low audio clarity detected. Please verify recognized text."}
                      </span>
                    )}
                  </div>
                )}

                {/* Coqui TTS Spoken Playback Controls */}
                {m.audio && (
                  <AudioPlayerControls
                    audioBase64={m.audio}
                    audioFormat={m.audioFormat || "mp3"}
                    voiceInfo={m.voiceInfo}
                    language={m.language || language}
                    autoPlay={autoPlayVoice}
                    title={
                      (m.language || language) === "ur"
                        ? "صوتی قانونی رہنمائی (اردو)"
                        : (m.language || language) === "ps"
                        ? "غږیز قانوني وضاحت (پښتو)"
                        : "Spoken Legal Explanation"
                    }
                    onPlayStateChange={(playing) => setIsPlayingAudio(playing)}
                  />
                )}

                {/* Grounded Statutory Citations */}
                {m.ragSources && m.ragSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 text-[11px] text-sky-300 space-y-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                      Statutory Reference:
                    </span>
                    {m.ragSources.map((rule, rIdx) => (
                      <div key={rIdx} className="bg-navy-950/80 p-2.5 rounded-xl border border-slate-700/60">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{rule.section}</span>
                          {rule.penalty_amount > 0 && (
                            <span className="text-cyan-neon font-mono font-bold text-xs bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              Rs. {rule.penalty_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-normal">{rule.title || rule.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Challan Action Data Cards */}
                {m.actionData && m.actionData.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                    {m.actionData.map((item, i) => (
                      <div key={i} className="bg-navy-950 p-3 rounded-xl border border-slate-700 text-xs">
                        <div className="flex justify-between font-bold text-white">
                          <span>Challan No: {item.challan_no}</span>
                          <span className="text-cyan-neon font-mono text-sm">Rs. {item.amount}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1 flex justify-between">
                          <span>{item.location} • {item.violation}</span>
                          <span className={`font-bold uppercase ${item.status === "PAID" ? "text-emerald-400" : "text-rose-400"}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Active Processing Skeleton */}
          {loading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-navy-850/95 border border-cyan-neon/50 rounded-2xl rounded-bl-none p-4 text-xs text-cyan-neon shadow-glow-cyan/20 max-w-md w-full">
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse mb-2">
                  <span className="animate-spin text-base">⏳</span>
                  <span className="font-bold text-white">
                    {statusMessage || "Processing inquiry with Grounded Llama 3..."}
                  </span>
                </div>
                {/* Shimmer loading bar */}
                <div className="w-full bg-navy-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-royal-600 via-cyan-neon to-royal-600 h-full w-2/3 animate-pulse rounded-full" />
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                  <span>Step {pipelineStep || 3} of 5</span>
                  <span>Motor Vehicles Ordinance 1965 Grounding</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed Query Retry Banner */}
          {lastFailedQuery && !loading && (
            <div className="flex justify-center my-2">
              <div className="bg-rose-950/80 border border-rose-700/80 p-2.5 rounded-xl text-xs text-rose-200 flex items-center space-x-3 rtl:space-x-reverse">
                <span>⚠️ Failed to get answer for previous inquiry.</span>
                <button
                  onClick={() => handleSend(lastFailedQuery)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg transition"
                >
                  ↺ Retry
                </button>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 4. SUGGESTION QUICK CHIPS */}
        <div className="px-4 py-2 bg-navy-950/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Suggested:</span>
          {quickChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip.query)}
              disabled={loading || isRecording}
              className="bg-navy-850 hover:bg-navy-800 disabled:opacity-40 text-slate-300 hover:text-white px-3 py-1 rounded-full border border-slate-700/80 whitespace-nowrap transition-all hover:border-cyan-neon/50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* 5. LIVE RECORDING ANIMATION & AUDIO INPUT STATUS */}
        {isRecording && (
          <div
            className="bg-rose-950/95 border-t border-rose-600 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-200 animate-in fade-in duration-150"
            role="status"
            aria-live="assertive"
          >
            {/* Live Waveform Equalizer & Duration */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
              </div>

              <div>
                <span className="font-bold text-white text-xs">
                  Recording Speech... {Math.floor(recordingDuration / 60)}:
                  {(recordingDuration % 60).toString().padStart(2, "0")}
                </span>
                <p className="text-[10px] text-rose-300">
                  Speak into microphone in {language === "ur" ? "Urdu" : language === "ps" ? "Pashto" : "English"}
                </p>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="flex items-end space-x-1 h-6 px-2 bg-rose-900/40 rounded-lg py-1">
                {[15, 45, 80, 100, 70, 90, 50, 30].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, Math.round(((volumeLevel + 10) / 110) * h * 0.25))}px`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Recording Controls: Done vs Cancel */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={resetRecording}
                className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs transition"
                title="Discard recording without submitting"
              >
                ✕ Cancel
              </button>

              <button
                onClick={handleStopRecordingAndProcess}
                className="bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold px-4 py-1.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-1.5 shadow-rose-900/50"
              >
                <span>⏹️ Done (Transcribe with Whisper)</span>
              </button>
            </div>
          </div>
        )}

        {/* Microphone Error Notification */}
        {micError && (
          <div className="bg-rose-950/95 border-t border-rose-700 p-3 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span>⚠️</span>
              <span>{micError}</span>
            </div>
            <button
              onClick={resetRecording}
              className="text-white underline font-bold ml-2 text-xs hover:text-rose-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 6. INPUT CONTROLS: MIC BUTTON, AUDIO UPLOAD, TEXT INPUT, SEND BUTTON */}
        <div className="p-3 sm:p-4 bg-navy-900/95 border-t border-slate-800">
          <div className="flex items-center gap-2">
            
            {/* A. Live Microphone Button */}
            <button
              onClick={() => (isRecording ? handleStopRecordingAndProcess() : startRecording())}
              disabled={loading}
              aria-label={isRecording ? "Stop voice recording and transcribe" : "Click to speak into microphone"}
              aria-pressed={isRecording}
              className={`p-3 rounded-2xl text-white transition-all shadow-lg flex-shrink-0 relative group focus:outline-none focus:ring-2 focus:ring-cyan-neon ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-700 animate-pulse-ring shadow-rose-600/50"
                  : "bg-gradient-to-r from-royal-600 to-blue-600 hover:from-royal-500 hover:to-blue-500 shadow-glow-cyan"
              }`}
              title={isRecording ? "Stop recording & transcribe with Whisper" : "Click to speak your question"}
            >
              <span className="text-lg">{isRecording ? "⏹️" : "🎙️"}</span>
              {!isRecording && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-950 text-cyan-neon text-[10px] px-2 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap border border-slate-700">
                  Speak Now
                </span>
              )}
            </button>

            {/* B. Audio File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a,.flac"
              className="hidden"
              aria-label="Upload recorded audio file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isRecording}
              aria-label="Upload audio recording file"
              className="p-3 rounded-2xl bg-navy-950 hover:bg-navy-850 text-slate-300 hover:text-cyan-neon border border-slate-700/80 transition shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
              title="Upload Audio File (WAV, MP3, WebM, M4A up to 25MB)"
            >
              <span className="text-lg">📁</span>
            </button>

            {/* C. Text Input Box */}
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={loading || isRecording}
                aria-label="Ask your traffic law or challan question"
                placeholder={
                  isRecording
                    ? "Listening... Speak clearly into your microphone..."
                    : language === "ur"
                    ? "مائیک پر بولیں، فائل اپلوڈ کریں، یا ٹریفک قوانین کے متعلق سوال لکھیں..."
                    : language === "ps"
                    ? "په مایک کې خبرې وکړئ یا د ټرافیکي قوانینو په اړه پوښتنه ولیکئ..."
                    : "Speak into mic, upload audio, or ask about traffic rules & citations..."
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-navy-950 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-neon placeholder-slate-500 pr-9"
              />
              {inputQuery && (
                <button
                  onClick={() => setInputQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  title="Clear text"
                >
                  ✕
                </button>
              )}
            </div>

            {/* D. Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={loading || isRecording || !inputQuery.trim()}
              aria-label="Send query"
              className="bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 disabled:opacity-40 text-white px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-glow-cyan transition flex-shrink-0 flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
            >
              <span>{loading ? "..." : "Ask"}</span>
              {!loading && <span>↵</span>}
            </button>
          </div>

          {/* Footer Audio Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 mt-2 px-1 gap-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Grounded in Pakistan Motor Vehicles Ordinance 1965</span>
            </span>
            <span className="font-mono text-[10px]">
              {isRecording ? (
                <span className="text-rose-400 font-bold animate-pulse">🔴 Capturing Microphone Speech</span>
              ) : activeUploadFile ? (
                <span className="text-cyan-neon">📂 File: {activeUploadFile}</span>
              ) : (
                "⚪ Audio & Text Ready"
              )}
            </span>
          </div>
        </div>
      </section>

      {/* 7. CLEAR CONVERSATION CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-deepNavy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-3xl mb-3">🧹</div>
            <h3 className="text-base font-bold text-white mb-2">Clear Conversation?</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              This will reset your consultation history and start a fresh session with the AI Traffic Assistant.
            </p>
            <div className="flex justify-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-navy-950 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                Yes, Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24 text-slate-400 text-sm">
          <span className="animate-spin inline-block mr-2">⏳</span>
          Loading AI Traffic Voice Studio...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
