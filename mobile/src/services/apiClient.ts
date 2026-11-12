import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseApiUrl } from '../config/api';

const TOKEN_STORAGE_KEY = '@ai_traffic_auth_token';

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<ApiResponse<T>> {
  try {
    const baseUrl = await getBaseApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const token = await getStoredToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        (data && typeof data === 'object' && (data.detail || data.message)) ||
        `Request failed with status ${response.status}`;
      return {
        data: null,
        error: errorMsg,
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (err: any) {
    let message = err.message || 'Network connection failed';
    if (err.name === 'AbortError') {
      message = 'Request timed out. Please check your network connection.';
    }
    return {
      data: null,
      error: message,
      status: 0,
    };
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, timeoutMs?: number) =>
    request<T>(endpoint, { method: 'GET' }, timeoutMs),

  post: <T = any>(endpoint: string, body?: any, timeoutMs?: number) =>
    request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      timeoutMs
    ),

  patch: <T = any>(endpoint: string, body?: any, timeoutMs?: number) =>
    request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      timeoutMs
    ),

  delete: <T = any>(endpoint: string, timeoutMs?: number) =>
    request<T>(endpoint, { method: 'DELETE' }, timeoutMs),

  uploadAudio: async (
    endpoint: string,
    fileUri: string,
    language: string = 'en'
  ): Promise<ApiResponse<any>> => {
    try {
      const baseUrl = await getBaseApiUrl();
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${baseUrl}${cleanEndpoint}`;

      const token = await getStoredToken();
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'audio/m4a',
        name: 'voice_query.m4a',
      } as any);
      formData.append('language', language);

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data?.detail || 'Audio upload failed',
          status: response.status,
        };
      }

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Audio upload failed',
        status: 0,
      };
    }
  },
};
