import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const { t, isRTL, dirStyle } = useLanguage();

  const [phone, setPhone] = useState('03009876543'); // Pre-fill verified demo citizen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (text: string) => {
    // Keep only digits
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    if (error) setError(null);
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setError(t.invalidPhone);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sendOtp(phone);
    setLoading(false);

    if (res.success) {
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phone,
          isDemo: res.isDemo ? 'true' : 'false',
          demoCode: res.demoCode || '123456',
        },
      });
    } else {
      setError(res.message);
    }
  };

  const handleBrowseGuest = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar showLanguageToggle={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header Shield */}
          <View style={styles.badgeWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={36} color="#00F0FF" />
            </View>
          </View>

          <Text style={[styles.title, { textAlign: dirStyle.textAlign }]}>
            {t.loginTitle}
          </Text>
          <Text style={[styles.subtitle, { textAlign: dirStyle.textAlign }]}>
            {t.loginSubtitle}
          </Text>

          {/* Input Box */}
          <View style={styles.inputCard}>
            <Text style={[styles.inputLabel, { textAlign: dirStyle.textAlign }]}>
              {t.phoneLabel}
            </Text>

            <View style={[styles.inputRow, { flexDirection: dirStyle.flexDirection }]}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>🇵🇰 +92</Text>
              </View>

              <TextInput
                value={phone}
                onChangeText={formatPhone}
                placeholder={t.phonePlaceholder}
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                maxLength={12}
                style={[
                  styles.textInput,
                  { textAlign: dirStyle.textAlign },
                ]}
              />
            </View>

            {error && (
              <View style={[styles.errorRow, { flexDirection: dirStyle.flexDirection }]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginHorizontal: 4 }} />
                <Text style={[styles.errorText, { textAlign: dirStyle.textAlign }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.demoNoticeBadge}>
              <Ionicons name="information-circle" size={14} color="#00F0FF" style={{ marginHorizontal: 4 }} />
              <Text style={styles.demoNoticeText}>{t.demoOtpNotice}</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSendCode}
            disabled={loading}
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>{t.sendOtp}</Text>
                <Ionicons
                  name={isRTL ? 'arrow-back' : 'arrow-forward'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginHorizontal: 6 }}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Guest Access Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBrowseGuest}
            style={styles.guestBtn}
          >
            <Text style={styles.guestBtnText}>
              {isRTL ? 'بطور مہمان ایپ دیکھیں ←' : 'Browse Portal as Guest →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 28,
  },
  inputCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 47, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
  },
  countryCodeBadge: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  errorRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  demoNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  demoNoticeText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guestBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestBtnText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
