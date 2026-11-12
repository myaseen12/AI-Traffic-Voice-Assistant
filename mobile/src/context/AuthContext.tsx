import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, storeToken, clearStoredToken } from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

const USER_STORAGE_KEY = '@ai_traffic_user_profile';

export interface CitizenUser {
  id: number;
  full_name: string;
  phone_number: string;
  email?: string;
  driving_license_no?: string;
  role: 'CITIZEN' | 'ADMIN' | 'OFFICER';
  preferred_language: 'en' | 'ur' | 'ps';
}

interface AuthContextType {
  user: CitizenUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; isDemo?: boolean; demoCode?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CitizenUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem('@ai_traffic_auth_token'),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Silently verify with /auth/me in background
        apiClient.get(API_ENDPOINTS.AUTH.ME).then(res => {
          if (res.data) {
            setUser(res.data);
            AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
          } else if (res.status === 401) {
            // Token expired
            logout();
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[Auth] Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendOtp(phone: string) {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, {
      phone_number: phone,
    });

    if (res.error) {
      return { success: false, message: res.error };
    }

    return {
      success: true,
      message: res.data?.message || 'Verification code sent',
      isDemo: res.data?.is_demo,
      demoCode: res.data?.otp_demo,
    };
  }

  async function verifyOtp(phone: string, otp: string) {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      phone_number: phone,
      otp: otp.trim(),
    });

    if (res.error || !res.data?.access_token) {
      return { success: false, message: res.error || 'Verification failed' };
    }

    const accessToken = res.data.access_token;
    const userData = res.data.user;

    setToken(accessToken);
    setUser(userData);

    await Promise.all([
      storeToken(accessToken),
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData)),
    ]);

    return { success: true, message: 'Login successful' };
  }

  async function logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      await Promise.all([
        clearStoredToken(),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);
    }
  }

  async function refreshProfile() {
    const res = await apiClient.get<CitizenUser>(API_ENDPOINTS.AUTH.ME);
    if (res.data) {
      setUser(res.data);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        sendOtp,
        verifyOtp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
