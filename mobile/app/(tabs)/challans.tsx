import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ChallanCard } from '../../src/components/ChallanCard';
import { challanService, ChallanItem } from '../../src/services/challanService';

export default function ChallansScreen() {
  const router = useRouter();
  const { t, isRTL, dirStyle } = useLanguage();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [challans, setChallans] = useState<ChallanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChallans('LEA-24-9182');
  }, []);

  async function loadChallans(searchQuery?: string) {
    try {
      setLoading(true);
      const res = await challanService.search(searchQuery || query || 'LEA-24-9182');
      setChallans(res);
    } catch (e) {
      console.warn('[Challans] Search error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleSearch = () => {
    loadChallans(query);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChallans(query);
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

  const filteredChallans = challans.filter((c) => {
    if (activeFilter === 'ALL') return true;
    return c.status === activeFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title={t.challans} subtitle="Provincial Safe City Citations" />

      <View style={styles.container}>
        {/* Search Input Bar */}
        <View style={[styles.searchRow, { flexDirection: dirStyle.flexDirection }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder={t.searchChallanPlaceholder}
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            style={[styles.searchInput, { textAlign: dirStyle.textAlign }]}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSearch}
            style={styles.searchBtn}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips */}
        <View style={[styles.filterChipsRow, { flexDirection: dirStyle.flexDirection }]}>
          {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((filterKey) => {
            const isSelected = activeFilter === filterKey;
            const label =
              filterKey === 'ALL'
                ? t.all
                : filterKey === 'PENDING'
                ? t.pending
                : filterKey === 'PAID'
                ? t.paid
                : t.overdue;

            return (
              <TouchableOpacity
                key={filterKey}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(filterKey)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Challans List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00F0FF"
              colors={['#00F0FF', '#2563EB']}
            />
          }
        >
          {loading ? (
            <ActivityIndicator size="small" color="#00F0FF" style={{ marginTop: 40 }} />
          ) : filteredChallans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={44} color="#64748B" />
              <Text style={[styles.emptyText, { textAlign: 'center' }]}>
                {t.noCitations}
              </Text>
            </View>
          ) : (
            filteredChallans.map((item) => (
              <ChallanCard
                key={item.id || item.challan_no}
                challan={item}
                onPressDetail={handleDetail}
                onPressPay={handlePay}
              />
            ))
          )}
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: '#112240',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 8,
  },
  filterChipsRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 22,
  },
});
