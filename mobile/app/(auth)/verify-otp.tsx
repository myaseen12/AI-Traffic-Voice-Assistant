import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; isDemo: string; demoCode: string }>();
  const phone = params.phone || '';
  const initialDemoCode = params.demoCode || '123456';

  const { verifyOtp, sendOtp } = useAuth();
  const { t, isRTL, dirStyle } = useLanguage();

  const [otp, setOtp] = useState(initialDemoCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError(t.invalidOtp);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyOtp(phone, otp);
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setError(res.message);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(60);
    setError(null);
    const res = await sendOtp(phone);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar showLanguageToggle={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { flexDirection: dirStyle.flexDirection }]}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={20}
              color="#00F0FF"
            />
            <Text style={styles.backBtnText}>
              {isRTL ? 'پیچھے جائیں' : 'Back'}
            </Text>
          </TouchableOpacity>

          <View style={styles.badgeWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={36} color="#10B981" />
            </View>
          </View>

          <Text style={[styles.title, { textAlign: dirStyle.textAlign }]}>
            {t.otpTitle}
          </Text>
          <Text style={[styles.subtitle, { textAlign: dirStyle.textAlign }]}>
            {t.otpSubtitle} <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          {/* OTP Card */}
          <View style={styles.inputCard}>
            <TextInput
              value={otp}
              onChangeText={(txt) => {
                const cleaned = txt.replace(/[^0-9]/g, '');
                setOtp(cleaned);
                if (error) setError(null);
              }}
              placeholder="123456"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
            />

            {error && (
              <View style={[styles.errorRow, { flexDirection: dirStyle.flexDirection }]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginHorizontal: 4 }} />
                <Text style={[styles.errorText, { textAlign: dirStyle.textAlign }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Resend Action */}
            <View style={[styles.resendRow, { flexDirection: dirStyle.flexDirection }]}>
              {cooldown > 0 ? (
                <Text style={styles.cooldownText}>
                  {t.resendIn} {cooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>{t.resendOtp}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={loading}
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>{t.verifyOtp}</Text>
            )}
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
  backBtn: {
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
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
  phoneHighlight: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 14,
  },
  errorRow: {
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  resendRow: {
    marginTop: 16,
    justifyContent: 'center',
    width: '100%',
  },
  cooldownText: {
    color: '#64748B',
    fontSize: 13,
  },
  resendText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#10B981',
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
});
