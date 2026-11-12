"use client";
import { useState, useCallback } from "react";
import { assistantService } from "../services/assistantService";
import { useLanguage } from "../context/LanguageContext";

export function useVoiceAssistant() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (text, challanContext = null) => {
      if (!text.trim()) return;

      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);
      setError(null);

      try {
        const response = await assistantService.query(text, language, challanContext);
        const botMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: response.answer,
          audioUrl: response.audio_url || null,
          verifiedRule: response.verified_rule || null,
          fineAmount: response.fine_amount || null,
          legalSection: response.legal_section || null,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);
        return botMessage;
      } catch (err) {
        setError(err.message || "Failed to process query");
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "معذرت، رابطہ قائم نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔ (Connection error. Please try again.)",
          isError: true,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [language]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isProcessing,
    error,
    sendMessage,
    clearMessages,
  };
}
