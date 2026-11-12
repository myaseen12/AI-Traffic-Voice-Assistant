import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_API_KEY = '@ai_traffic_custom_api_url';

// Auto-detect standard host address:
// - Android Emulator: 10.0.2.2 maps to host machine 127.0.0.1
// - iOS Simulator / Local Web: localhost
// - Fallback / Physical Device Default: Local network host or deployed gateway
export const FALLBACK_API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export const PRODUCTION_API_URL = 'http://10.0.2.2:8000/api/v1';

let cachedApiUrl: string | null = null;

export async function getBaseApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) {
      cachedApiUrl = saved.trim().replace(/\/+$/, '');
      return cachedApiUrl;
    }
  } catch (e) {
    console.warn('[Config] Failed to load saved API URL:', e);
  }
  cachedApiUrl = FALLBACK_API_URL;
  return cachedApiUrl;
}

export async function setBaseApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  cachedApiUrl = clean;
  await AsyncStorage.setItem(STORAGE_API_KEY, clean);
}

export async function resetBaseApiUrl(): Promise<string> {
  cachedApiUrl = FALLBACK_API_URL;
  await AsyncStorage.removeItem(STORAGE_API_KEY);
  return FALLBACK_API_URL;
}

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    LANGUAGE: '/auth/preferences/language',
  },
  CHALLANS: {
    SEARCH: '/challans/search',
    MY_CHALLANS: '/challans/my-challans',
    STATUS: (no: string) => `/challans/${encodeURIComponent(no)}/status`,
    DETAIL: (no: string) => `/challans/${encodeURIComponent(no)}`,
    QR_VALIDATE: '/challans/qr/validate',
    PAY: (id: number | string) => `/challans/${id}/pay`,
  },
  ASSISTANT: {
    QUERY: '/assistant/query',
    TRANSCRIBE: '/assistant/transcribe',
    TTS: '/assistant/tts',
    HISTORY: '/assistant/history',
  },
  TRAFFIC_RULES: {
    LIST: '/traffic-rules',
    DETAIL: (id: number | string) => `/traffic-rules/${id}`,
  },
  CITIZEN: {
    DASHBOARD: '/citizens/dashboard',
  },
};
