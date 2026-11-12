import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { challanService, ChallanItem } from '../../src/services/challanService';

export default function ChallanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; autoPay?: string }>();
  const challanNo = params.id;
  const autoPay = params.autoPay === 'true';

  const { t, isRTL, dirStyle } = useLanguage();

  const [challan, setChallan] = useState<ChallanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccessModal, setPaySuccessModal] = useState(false);
  const [txnId, setTxnId] = useState('');

  useEffect(() => {
    loadDossier();
  }, [challanNo]);

  async function loadDossier() {
    if (!challanNo) return;
    try {
      setLoading(true);
      // Fetch public status first
      const statusRes = await challanService.getStatus(challanNo);
      if (statusRes) {
        setChallan(statusRes);
        if (autoPay && statusRes.status === 'PENDING') {
          setTimeout(() => handleExecutePayment(statusRes), 300);
        }
      } else {
        // Fallback to detailed
        const detailRes = await challanService.getDetail(challanNo);
        setChallan(detailRes);
      }
    } catch (e) {
      console.warn('[ChallanDetail] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleExecutePayment = async (targetChallan?: ChallanItem) => {
    const item = targetChallan || challan;
    if (!item) return;

    setPaying(true);
    try {
      const res = await challanService.payChallan(item.id || 2, '1Link');
      if (res.success) {
        setTxnId(res.transactionId || `1LINK-${Date.now()}`);
        setPaySuccessModal(true);
        // Refresh local state to PAID
        setChallan((prev) => (prev ? { ...prev, status: 'PAID' } : null));
      } else {
        Alert.alert('Payment Error', res.message);
      }
    } catch (e: any) {
      Alert.alert('Payment Error', e.message || 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!challan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Citation Dossier Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = challan.status === 'PAID';
  const isOverdue = challan.status === 'OVERDUE';
  const statusColor = isPaid ? '#10B981' : isOverdue ? '#EF4444' : '#F59E0B';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modal Navigation Bar */}
      <View style={[styles.topBar, { flexDirection: dirStyle.flexDirection }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>
          {isRTL ? 'سرکاری چالان ریکارڈ' : 'Official Citation Dossier'}
        </Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Alert Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time'}
            size={24}
            color={statusColor}
          />
          <View style={[styles.statusTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.statusBannerTitle, { color: statusColor }]}>
              {challan.status} CITATION
            </Text>
            <Text style={styles.statusBannerSub}>
              {isPaid
                ? isRTL ? 'یہ چالان کامیابی سے ادا ہو چکا ہے۔' : 'This citation has been cleared in the Safe City registry.'
                : isRTL ? 'براہ کرم آخری تاریخ سے پہلے واجبات ادا کریں۔' : 'Please clear penalty dues before the expiry date.'}
            </Text>
          </View>
        </View>

        {/* Primary Ticket Dossier Card */}
        <View style={styles.dossierCard}>
          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>{t.challanNo}</Text>
            <Text style={styles.dossierValueHighlight}>{challan.challan_no}</Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>{t.vehicleNo}</Text>
            <Text style={styles.dossierValue}>{challan.vehicle_no}</Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>Vehicle Category</Text>
            <Text style={styles.dossierValue}>{challan.vehicle_type || 'Motorcycle'}</Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>City / Safe City Unit</Text>
            <Text style={styles.dossierValue}>{challan.city || 'Karachi'}</Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>Violation Location</Text>
            <Text style={styles.dossierValueSmall}>{challan.location}</Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>{t.dueDate}</Text>
            <Text style={styles.dossierValue}>
              {new Date(challan.due_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Legal Act & Violation Statutory Section Card */}
        <View style={styles.legalSectionCard}>
          <View style={[styles.legalHeader, { flexDirection: dirStyle.flexDirection }]}>
            <Ionicons name="book-outline" size={18} color="#00F0FF" />
            <Text style={styles.legalHeaderTitle}>
              {isRTL ? 'قانونی دفعہ اور تفصیل' : 'Statutory Legal Authority'}
            </Text>
          </View>

          <Text style={[styles.legalViolationTitle, { textAlign: dirStyle.textAlign }]}>
            {challan.violation_title || challan.rule?.title || 'Motor Vehicle Act Violation'}
          </Text>

          <View style={styles.legalActBadge}>
            <Text style={styles.legalActText}>
              {challan.section || challan.rule?.section || 'Section 113, Motor Vehicles Ordinance 1965'}
            </Text>
          </View>

          <Text style={[styles.legalDescription, { textAlign: dirStyle.textAlign }]}>
            {challan.rule?.description ||
              'Exceeding statutory speed limit prescribed by traffic management ordinance.'}
          </Text>
        </View>

        {/* Fine Settlement Breakdown Card */}
        <View style={styles.fineCard}>
          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>Base Penalty Fine</Text>
            <Text style={styles.fineNumber}>
              {t.pkr} {Number(challan.amount).toLocaleString()}
            </Text>
          </View>

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.dossierLabel}>Late Fee Surcharge</Text>
            <Text style={styles.fineNumber}>
              {t.pkr} {Number(challan.late_fee || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.dossierRow, { flexDirection: dirStyle.flexDirection }]}>
            <Text style={styles.totalLabel}>Total Payable Amount</Text>
            <Text style={styles.totalValue}>
              {t.pkr} {(Number(challan.amount) + Number(challan.late_fee || 0)).toLocaleString()}
            </Text>
          </View>

          {!isPaid && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleExecutePayment()}
              disabled={paying}
              style={[styles.payButton, paying && styles.disabledBtn]}
            >
              {paying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginHorizontal: 6 }} />
                  <Text style={styles.payButtonText}>
                    {isRTL ? 'فوری 1Link ڈیجیٹل ادائیگی کریں' : 'Instant 1Link Settlement'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Payment Success Modal */}
      <Modal visible={paySuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={48} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>{t.settlementSuccess}</Text>
            <Text style={styles.successSub}>
              {isRTL
                ? 'آپ کا چالان ریکارڈ کامیابی سے کلیئر کر دیا گیا ہے۔'
                : 'Your citation record has been updated to PAID.'}
            </Text>

            <View style={styles.txnCard}>
              <Text style={styles.txnLabel}>{t.transactionId}</Text>
              <Text style={styles.txnValue}>{txnId}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setPaySuccessModal(false);
                router.back();
              }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>
                {isRTL ? 'مکمل' : 'Done'}
              </Text>
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
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusTextCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBannerSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },
  dossierCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  dossierRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dossierLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  dossierValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dossierValueHighlight: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '800',
  },
  dossierValueSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '65%',
  },
  legalSectionCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    marginBottom: 16,
  },
  legalHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  legalHeaderTitle: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 6,
  },
  legalViolationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  legalActBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  legalActText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  legalDescription: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  fineCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  fineNumber: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '800',
  },
  payButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#112240',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  txnCard: {
    backgroundColor: '#0A192F',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  txnLabel: {
    color: '#64748B',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  txnValue: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
