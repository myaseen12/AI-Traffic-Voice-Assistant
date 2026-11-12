import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';
import { challanService } from '../../src/services/challanService';

export default function ScannerScreen() {
  const router = useRouter();
  const { t, isRTL, dirStyle } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();

  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);

  // Manual input modal
  const [manualModal, setManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || validating) return;
    setScanned(true);
    setValidating(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await processScannedToken(data);
    } catch (e) {
      console.warn('[Scanner] Scan error:', e);
      setScanned(false);
    } finally {
      setValidating(false);
    }
  };

  const processScannedToken = async (rawToken: string) => {
    const clean = rawToken.trim();
    // 1. Check if token is QR reference token
    const res = await challanService.validateQR(clean);

    if (res.status === 'valid' && res.challan?.challan_no) {
      router.push({
        pathname: '/challan/[id]',
        params: { id: res.challan.challan_no },
      });
      setTimeout(() => setScanned(false), 2000);
    } else {
      // 2. Try looking up as plain ticket number (e.g. KHI-2024-883492)
      const detail = await challanService.getStatus(clean).catch(() => null);
      if (detail && detail.challan_no) {
        router.push({
          pathname: '/challan/[id]',
          params: { id: detail.challan_no },
        });
        setTimeout(() => setScanned(false), 2000);
      } else {
        Alert.alert(
          isRTL ? 'غیر تصدیق شدہ چالان' : 'Verification Failed',
          res.message || (isRTL ? 'یہ کیو آر کوڈ سیف سٹی ریکارڈ میں موجود نہیں ہے۔' : 'QR code not found in Safe City database.'),
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setManualError(t.enterTokenOrVehicle);
      return;
    }

    setValidating(true);
    setManualError(null);

    try {
      const clean = manualInput.trim();
      const res = await challanService.validateQR(clean);

      if (res.status === 'valid' && res.challan?.challan_no) {
        setManualModal(false);
        router.push({
          pathname: '/challan/[id]',
          params: { id: res.challan.challan_no },
        });
      } else {
        const detail = await challanService.getStatus(clean).catch(() => null);
        if (detail && detail.challan_no) {
          setManualModal(false);
          router.push({
            pathname: '/challan/[id]',
            params: { id: detail.challan_no },
          });
        } else {
          setManualError(res.message || (isRTL ? 'چالان ریکارڈ نہیں ملا۔' : 'No matching citation found.'));
        }
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title={t.scannerHeader} subtitle={t.scanCountNotice} />

      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="camera-outline" size={44} color="#00F0FF" />
            </View>
            <Text style={[styles.permissionTitle, { textAlign: dirStyle.textAlign }]}>
              {t.requestCameraPermission}
            </Text>
            <Text style={[styles.permissionDesc, { textAlign: dirStyle.textAlign }]}>
              {t.cameraPermissionDesc}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={requestPermission}
              style={styles.grantBtn}
            >
              <Text style={styles.grantBtnText}>{t.grantPermission}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setManualModal(true)}
              style={styles.manualEntryLink}
            >
              <Text style={styles.manualEntryLinkText}>{t.manualInputBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Dark Overlay with Scan Window */}
            <View style={styles.overlayTop} />

            <View style={styles.reticleRow}>
              <View style={styles.overlaySide} />
              <View style={styles.reticleBox}>
                {/* 4 Corner Markers */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {validating && (
                  <View style={styles.reticleLoading}>
                    <ActivityIndicator size="large" color="#00F0FF" />
                    <Text style={styles.reticleLoadingText}>{t.validating}</Text>
                  </View>
                )}
              </View>
              <View style={styles.overlaySide} />
            </View>

            <View style={styles.overlayBottom}>
              <Text style={[styles.promptText, { textAlign: 'center' }]}>
                {t.scannerPrompt}
              </Text>

              {/* Bottom Floating Bar */}
              <View style={[styles.controlsRow, { flexDirection: dirStyle.flexDirection }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTorch(!torch)}
                  style={styles.controlPill}
                >
                  <Ionicons
                    name={torch ? 'flash' : 'flash-outline'}
                    size={20}
                    color={torch ? '#F59E0B' : '#FFFFFF'}
                  />
                  <Text style={styles.controlText}>
                    {torch ? t.torchOff : t.torchOn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setManualModal(true)}
                  style={[styles.controlPill, styles.manualPill]}
                >
                  <Ionicons name="keypad-outline" size={20} color="#00F0FF" />
                  <Text style={[styles.controlText, { color: '#00F0FF' }]}>
                    {t.manualInputBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={manualModal}
        transparent
        animationType="slide"
        onRequestClose={() => setManualModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { flexDirection: dirStyle.flexDirection }]}>
              <Text style={styles.modalTitle}>{t.manualInputTitle}</Text>
              <TouchableOpacity onPress={() => setManualModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { textAlign: dirStyle.textAlign }]}>
              {t.enterTokenOrVehicle}
            </Text>

            <TextInput
              value={manualInput}
              onChangeText={(txt) => {
                setManualInput(txt);
                if (manualError) setManualError(null);
              }}
              placeholder="e.g. KHI-2024-883492 or QRC-B17C..."
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              style={[styles.modalInput, { textAlign: dirStyle.textAlign }]}
            />

            {manualError && (
              <Text style={[styles.modalError, { textAlign: dirStyle.textAlign }]}>
                {manualError}
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleManualSubmit}
              disabled={validating}
              style={[styles.modalSubmitBtn, validating && styles.disabledBtn]}
            >
              {validating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>{t.validateBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  container: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    marginBottom: 20,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  permissionDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
    textAlign: 'center',
  },
  grantBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  manualEntryLink: {
    marginTop: 20,
  },
  manualEntryLinkText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraWrapper: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
  },
  reticleRow: {
    flexDirection: 'row',
    height: 270,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
  },
  reticleBox: {
    width: 270,
    height: 270,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#00F0FF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  reticleLoading: {
    backgroundColor: 'rgba(10, 25, 47, 0.85)',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  reticleLoadingText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  overlayBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(10, 25, 47, 0.75)',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  promptText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  controlsRow: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
  },
  manualPill: {
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#112240',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: '#0A192F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: '600',
  },
  modalError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  modalSubmitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
