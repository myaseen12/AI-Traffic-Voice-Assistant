import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ChallanCard } from '../../src/components/ChallanCard';
import { challanService, ChallanItem, CitizenDashboardStats } from '../../src/services/challanService';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t, isRTL, dirStyle } = useLanguage();

  const [stats, setStats] = useState<CitizenDashboardStats | null>(null);
  const [recentChallans, setRecentChallans] = useState<ChallanItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const citizenName = user?.full_name || (isRTL ? 'معزز شہری' : 'Respected Citizen');

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [statsData, challansData] = await Promise.all([
        challanService.getDashboardStats().catch(() => null),
        challanService.search(user?.driving_license_no || 'LEA-24-9182').catch(() => []),
      ]);

      setStats(statsData);
      setRecentChallans(challansData.slice(0, 3));
    } catch (e) {
      console.warn('[Dashboard] Load data error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleDetail = (challan: ChallanItem) => {
    router.push({
      pathname: '/challan/[id]',
      params: { id: challan.challan_no },
    });
  };

  const handlePay = (challan: ChallanItem) => {
    router.push({
      pathname: '/challan/[id]',
      params: { id: challan.challan_no, autoPay: 'true' },
    });
  };

  const pendingAmount = stats?.pending_amount ?? 1000;
  const pendingCount = stats?.pending_challans ?? (recentChallans.filter(c => c.status === 'PENDING').length || 1);
  const vehicleCount = stats?.registered_vehicles?.length ?? 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00F0FF"
            colors={['#00F0FF', '#2563EB']}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={[styles.welcomeRow, { flexDirection: dirStyle.flexDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeSub, { textAlign: dirStyle.textAlign }]}>
                {t.welcomeCitizen}
              </Text>
              <Text style={[styles.citizenName, { textAlign: dirStyle.textAlign }]}>
                {citizenName}
              </Text>
            </View>

            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.verifiedText}>
                {isRTL ? 'سیف سٹی تصدیق' : 'Safe City Verified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Metric Cards Row */}
        <View style={[styles.statsRow, { flexDirection: dirStyle.flexDirection }]}>
          {/* Card 1: Pending Dues */}
          <View style={[styles.statBox, { borderColor: '#F59E0B' }]}>
            <View style={[styles.statHeader, { flexDirection: dirStyle.flexDirection }]}>
              <Ionicons name="alert-circle" size={16} color="#F59E0B" />
              <Text style={styles.statLabel}>{t.pendingFines}</Text>
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B', textAlign: dirStyle.textAlign }]}>
              {t.pkr} {pendingAmount.toLocaleString()}
            </Text>
            <Text style={[styles.statMeta, { textAlign: dirStyle.textAlign }]}>
              {pendingCount} {t.pending}
            </Text>
          </View>

          {/* Card 2: Vehicles */}
          <View style={[styles.statBox, { borderColor: '#00F0FF' }]}>
            <View style={[styles.statHeader, { flexDirection: dirStyle.flexDirection }]}>
              <Ionicons name="car-sport" size={16} color="#00F0FF" />
              <Text style={styles.statLabel}>{t.activeVehicles}</Text>
            </View>
            <Text style={[styles.statValue, { color: '#00F0FF', textAlign: dirStyle.textAlign }]}>
              {vehicleCount}
            </Text>
            <Text style={[styles.statMeta, { textAlign: dirStyle.textAlign }]}>
              LEA-24-9182, ICT-LE-402
            </Text>
          </View>
        </View>

        {/* Quick Actions Carousel */}
        <Text style={[styles.sectionHeading, { textAlign: dirStyle.textAlign }]}>
          {t.quickActions}
        </Text>

        <View style={[styles.actionsRow, { flexDirection: dirStyle.flexDirection }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/scanner')}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
              <Ionicons name="qr-code-outline" size={24} color="#00F0FF" />
            </View>
            <Text style={styles.actionBtnLabel}>{t.scanQrBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/assistant')}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.25)' }]}>
              <Ionicons name="mic-outline" size={24} color="#38BDF8" />
            </View>
            <Text style={styles.actionBtnLabel}>{t.askAiBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/challans')}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="search-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionBtnLabel}>{t.searchVehicleBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Tip Alert Box */}
        <View style={styles.safetyCard}>
          <View style={[styles.safetyHeader, { flexDirection: dirStyle.flexDirection }]}>
            <Ionicons name="bulb-outline" size={18} color="#00F0FF" style={{ marginHorizontal: 6 }} />
            <Text style={styles.safetyTitle}>{t.safetyTips}</Text>
          </View>
          <Text style={[styles.safetyText, { textAlign: dirStyle.textAlign }]}>
            {t.safetyTipText}
          </Text>
        </View>

        {/* Recent Citations List */}
        <View style={[styles.recentHeaderRow, { flexDirection: dirStyle.flexDirection }]}>
          <Text style={styles.sectionHeading}>{t.recentActivity}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/challans')}>
            <Text style={styles.seeAllText}>
              {isRTL ? 'تمام دیکھیں ←' : 'View All →'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#00F0FF" style={{ marginVertical: 20 }} />
        ) : recentChallans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={38} color="#10B981" />
            <Text style={[styles.emptyText, { textAlign: dirStyle.textAlign }]}>
              {t.noCitations}
            </Text>
          </View>
        ) : (
          recentChallans.map((item) => (
            <ChallanCard
              key={item.id || item.challan_no}
              challan={item}
              onPressDetail={handleDetail}
              onPressPay={handlePay}
            />
          ))
        )}
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  welcomeRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  citizenName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#112240',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statMeta: {
    color: '#64748B',
    fontSize: 10,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionsRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#112240',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  safetyCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    marginBottom: 20,
  },
  safetyHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  safetyTitle: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
  },
  safetyText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  recentHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#112240',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 20,
  },
});
