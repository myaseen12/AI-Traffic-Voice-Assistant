import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, translations, isLanguageRTL, SUPPORTED_LANGUAGES, LanguageInfo } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@ai_traffic_selected_language';

interface LanguageContextType {
  language: LanguageCode;
  isRTL: boolean;
  t: typeof translations.en;
  setLanguage: (code: LanguageCode) => Promise<void>;
  supportedLanguages: LanguageInfo[];
  dirStyle: {
    textAlign: 'left' | 'right';
    flexDirection: 'row' | 'row-reverse';
  };
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  async function loadSavedLanguage() {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'ur' || saved === 'ps')) {
        setLanguageState(saved as LanguageCode);
      }
    } catch (e) {
      console.warn('[Language] Failed to load language:', e);
    }
  }

  async function setLanguage(code: LanguageCode) {
    setLanguageState(code);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }

  const isRTL = isLanguageRTL(language);
  const t = translations[language] || translations.en;

  const dirStyle = {
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const),
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        t,
        setLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
        dirStyle,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
