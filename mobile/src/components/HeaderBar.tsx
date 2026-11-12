import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../i18n/translations';

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
}) => {
  const { t, language, setLanguage, isRTL, dirStyle } = useLanguage();

  const cycleLanguage = () => {
    const nextLang: LanguageCode = language === 'en' ? 'ur' : language === 'ur' ? 'ps' : 'en';
    setLanguage(nextLang);
  };

  const currentLangLabel = language === 'en' ? 'EN' : language === 'ur' ? 'اردو' : 'پښتو';

  return (
    <View style={[styles.container, { flexDirection: dirStyle.flexDirection }]}>
      <View style={[styles.titleSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.brandRow, { flexDirection: dirStyle.flexDirection }]}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#00F0FF" />
          </View>
          <Text style={styles.brandTitle}>
            {title || t.appName}
          </Text>
        </View>
        <Text style={[styles.brandSubtitle, { textAlign: dirStyle.textAlign }]}>
          {subtitle || t.tagline}
        </Text>
      </View>

      {showLanguageToggle && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={cycleLanguage}
          style={styles.langPill}
        >
          <Ionicons name="globe-outline" size={14} color="#00F0FF" style={{ marginHorizontal: 4 }} />
          <Text style={styles.langText}>{currentLangLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#0A192F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleSection: {
    flex: 1,
  },
  brandRow: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    marginHorizontal: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginHorizontal: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  langText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
});
