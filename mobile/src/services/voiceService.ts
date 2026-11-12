import { Audio } from 'expo-av';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface RAGSource {
  title?: string;
  section?: string;
  source?: string;
  penalty?: string;
}

export interface AssistantResponse {
  transcript: string;
  reply_text: string;
  audio_base64?: string;
  audio_format?: string;
  intent: string;
  status: string;
  language: string;
  is_grounded: boolean;
  rag_sources?: RAGSource[];
}

let activeRecording: Audio.Recording | null = null;
let activeSound: Audio.Sound | null = null;

export const voiceService = {
  requestMicrophonePermission: async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  startRecording: async (): Promise<boolean> => {
    try {
      const hasPermission = await voiceService.requestMicrophonePermission();
      if (!hasPermission) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (activeRecording) {
        try {
          await activeRecording.stopAndUnloadAsync();
        } catch {}
        activeRecording = null;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      activeRecording = recording;
      return true;
    } catch (e) {
      console.warn('[VoiceService] Start recording error:', e);
      return false;
    }
  },

  stopRecording: async (): Promise<string | null> => {
    try {
      if (!activeRecording) return null;
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      activeRecording = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      return uri;
    } catch (e) {
      console.warn('[VoiceService] Stop recording error:', e);
      activeRecording = null;
      return null;
    }
  },

  queryText: async (queryText: string, language: string = 'en'): Promise<AssistantResponse | null> => {
    const res = await apiClient.post<AssistantResponse>(API_ENDPOINTS.ASSISTANT.QUERY, {
      query_text: queryText.trim(),
      language,
    });
    return res.data;
  },

  queryAudioFile: async (fileUri: string, language: string = 'en'): Promise<AssistantResponse | null> => {
    // 1. Transcribe audio through backend Whisper
    const transcribeRes = await apiClient.uploadAudio(
      API_ENDPOINTS.ASSISTANT.TRANSCRIBE,
      fileUri,
      language
    );

    const transcript = transcribeRes.data?.transcript || '';
    if (!transcript) {
      return {
        transcript: '',
        reply_text:
          language === 'ur'
            ? 'آواز واضح نہیں تھی۔ براہ کرم دوبارہ بولیے یا متن لکھیں۔'
            : language === 'ps'
            ? 'غږ روښانه نه و. مهرباني وکړئ بیا خبرې وکړئ.'
            : 'Audio was unclear. Please speak again or type your query.',
        intent: 'UNCLEAR_AUDIO',
        status: 'UNAVAILABLE',
        language,
        is_grounded: false,
      };
    }

    // 2. Query grounded RAG engine with transcribed text
    return voiceService.queryText(transcript, language);
  },

  playBase64Audio: async (base64Audio: string, onPlaybackFinished?: () => void): Promise<boolean> => {
    try {
      if (activeSound) {
        try {
          await activeSound.stopAsync();
          await activeSound.unloadAsync();
        } catch {}
        activeSound = null;
      }

      if (!base64Audio) return false;

      const source = {
        uri: `data:audio/mp3;base64,${base64Audio}`,
      };

      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            if (onPlaybackFinished) onPlaybackFinished();
          }
        }
      );
      activeSound = sound;
      return true;
    } catch (e) {
      console.warn('[VoiceService] Play audio error:', e);
      return false;
    }
  },

  stopAudio: async (): Promise<void> => {
    try {
      if (activeSound) {
        await activeSound.stopAsync();
        await activeSound.unloadAsync();
        activeSound = null;
      }
    } catch {}
  },
};
