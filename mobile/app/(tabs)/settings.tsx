import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';
import { LanguageCode } from '../../src/i18n/translations';
import { getBaseApiUrl, setBaseApiUrl, resetBaseApiUrl } from '../../src/config/api';
import { apiClient } from '../../src/services/apiClient';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, setLanguage, supportedLanguages, isRTL, dirStyle } = useLanguage();

  const [apiUrl, setApiUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  useEffect(() => {
    getBaseApiUrl().then(setApiUrl);
  }, []);

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) return;
    await setBaseApiUrl(apiUrl);
    Alert.alert(isRTL ? 'محفوظ ہو گیا' : 'Saved', isRTL ? 'بیک اینڈ یو آر ایل محفوظ ہو گیا۔' : 'Backend URL updated successfully.');
  };

  const handleResetApiUrl = async () => {
    const def = await resetBaseApiUrl();
    setApiUrl(def);
    setConnectionStatus(null);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await apiClient.get('/health', 5000);
      if (res.data && res.data.status === 'healthy') {
        setConnectionStatus(t.serverOnline);
      } else {
        setConnectionStatus(t.serverOffline);
      }
    } catch {
      setConnectionStatus(t.serverOffline);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t.logout,
      isRTL ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out?',
      [
        { text: isRTL ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title={t.settings} subtitle="Citizen Profile & App Configuration" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        {isAuthenticated && user && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: dirStyle.flexDirection }]}>
              <Ionicons name="person-circle-outline" size={20} color="#00F0FF" />
              <Text style={styles.sectionTitle}>{t.profileHeader}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t.name}</Text>
              <Text style={styles.profileValue}>{user.full_name}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t.phoneLabel}</Text>
              <Text style={styles.profileValue}>{user.phone_number}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>{t.drivingLicense}</Text>
              <Text style={styles.profileValue}>
                {user.driving_license_no || 'LEA-DL-99482'}
              </Text>
            </View>
          </View>
        )}

        {/* Language Selection Card */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { flexDirection: dirStyle.flexDirection }]}>
            <Ionicons name="globe-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>{t.languageSection}</Text>
          </View>

          {supportedLanguages.map((langItem) => {
            const isSelected = language === langItem.code;
            return (
              <TouchableOpacity
                key={langItem.code}
                activeOpacity={0.8}
                onPress={() => setLanguage(langItem.code as LanguageCode)}
                style={[
                  styles.languageOption,
                  isSelected && styles.languageOptionActive,
                  { flexDirection: dirStyle.flexDirection },
                ]}
              >
                <View style={[styles.langTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
                    {langItem.nativeName}
                  </Text>
                  <Text style={styles.langEn}>{langItem.name}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Network & Backend Gateway Configuration */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { flexDirection: dirStyle.flexDirection }]}>
            <Ionicons name="server-outline" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>{t.networkConfig}</Text>
          </View>

          <Text style={[styles.inputLabel, { textAlign: dirStyle.textAlign }]}>
            {t.apiUrlLabel}
          </Text>

          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:8000/api/v1"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.apiInput}
          />

          <View style={[styles.btnRow, { flexDirection: dirStyle.flexDirection }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSaveApiUrl}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>{t.saveUrl}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetApiUrl}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>{t.resetUrl}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTestConnection}
            disabled={testingConnection}
            style={styles.testBtn}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color="#00F0FF" />
            ) : (
              <>
                <Ionicons name="pulse" size={16} color="#00F0FF" style={{ marginHorizontal: 6 }} />
                <Text style={styles.testBtnText}>{t.testConnection}</Text>
              </>
            )}
          </TouchableOpacity>

          {connectionStatus && (
            <Text
              style={[
                styles.statusNotice,
                {
                  color: connectionStatus === t.serverOnline ? '#10B981' : '#EF4444',
                  textAlign: 'center',
                },
              ]}
            >
              {connectionStatus}
            </Text>
          )}
        </View>

        {/* Emergency Helplines Card */}
        <View style={styles.emergencyCard}>
          <View style={[styles.sectionHeader, { flexDirection: dirStyle.flexDirection }]}>
            <Ionicons name="call-outline" size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
              {isRTL ? 'ہنگامی ٹریفک ہیلپ لائن' : 'Emergency Civic Helplines'}
            </Text>
          </View>

          <View style={[styles.helplineRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.helplineLabel}>
              {isRTL ? 'ٹریفک پولیس ہیلپ لائن' : 'Traffic Police Assistance:'}
            </Text>
            <Text style={styles.helplineNumber}>1915</Text>
          </View>

          <View style={[styles.helplineRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.helplineLabel}>
              {isRTL ? 'ریسکیو ایمرجنسی سروس' : 'Rescue Emergency Services:'}
            </Text>
            <Text style={styles.helplineNumber}>1122</Text>
          </View>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginHorizontal: 6 }} />
            <Text style={styles.logoutBtnText}>{t.logout}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>{t.version}</Text>
        <Text style={styles.legalNoticeText}>{t.aboutLegal}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  profileValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  languageOption: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: '#00F0FF',
  },
  langTextCol: {
    flex: 1,
  },
  langNative: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  langNativeActive: {
    color: '#00F0FF',
  },
  langEn: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#00F0FF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00F0FF',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  apiInput: {
    backgroundColor: '#0A192F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btnRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  testBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  testBtnText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusNotice: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  emergencyCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 20,
  },
  helplineRow: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  helplineLabel: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  helplineNumber: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  legalNoticeText: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});
