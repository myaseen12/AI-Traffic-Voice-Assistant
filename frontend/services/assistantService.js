import { fetchApi } from "./api";

export const assistantService = {
  // Send text query to Llama 3 Grounded Engine
  sendQuery: (queryText, language = "en", vehicleNo = null, sessionId = null) =>
    fetchApi("/assistant/query", {
      method: "POST",
      body: JSON.stringify({
        query_text: queryText,
        language,
        vehicle_no: vehicleNo,
        session_id: sessionId,
      }),
    }),

  // Transcribe recorded audio file with Whisper STT
  transcribeAudio: (audioBlob, language = "en", filename = "recording.wav") => {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("language", language);
    return fetchApi("/assistant/transcribe", {
      method: "POST",
      body: formData,
    });
  },

  // Full Voice Pipeline: Transcribe with Whisper + Answer with Llama 3
  sendVoiceAudio: (audioBlob, language = "en", sessionId = null, filename = "recording.wav") => {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("language", language);
    if (sessionId) {
      formData.append("session_id", sessionId);
    }
    return fetchApi("/assistant/voice-audio", {
      method: "POST",
      body: formData,
    });
  },

  // Retrieve stored conversation session
  getConversation: (sessionId) =>
    fetchApi(`/assistant/conversations/${encodeURIComponent(sessionId)}`),

  // Clear / delete conversation session
  deleteConversation: (sessionId) =>
    fetchApi(`/assistant/conversations/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    }),

  // Synthesize text into spoken voice audio via Coqui TTS
  synthesizeSpeech: (text, language = "en") =>
    fetchApi("/assistant/tts", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    }),

  // Get TTS supported voices and quality tiers (High Quality vs Low Resource Pashto)
  getVoiceProfiles: () =>
    fetchApi("/assistant/tts/voices"),

  // Retrieve citizen's past consultation list
  getMyConversations: () =>
    fetchApi("/assistant/my-conversations"),

  // Backward compatibility alias
  sendAudioStream: (audioBlob, language = "en", sessionId = null) =>
    assistantService.sendVoiceAudio(audioBlob, language, sessionId),
};
