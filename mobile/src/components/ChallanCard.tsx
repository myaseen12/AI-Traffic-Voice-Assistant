import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChallanItem } from '../services/challanService';
import { useLanguage } from '../context/LanguageContext';

interface ChallanCardProps {
  challan: ChallanItem;
  onPressDetail: (challan: ChallanItem) => void;
  onPressPay?: (challan: ChallanItem) => void;
}

export const ChallanCard: React.FC<ChallanCardProps> = ({
  challan,
  onPressDetail,
  onPressPay,
}) => {
  const { t, isRTL, dirStyle } = useLanguage();

  const isPaid = challan.status === 'PAID';
  const isOverdue = challan.status === 'OVERDUE';
  const isPending = challan.status === 'PENDING';

  const statusColor = isPaid ? '#10B981' : isOverdue ? '#EF4444' : '#F59E0B';
  const statusLabel = isPaid ? t.paid : isOverdue ? t.overdue : t.pending;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPressDetail(challan)}
      style={styles.card}
    >
      {/* Top Row: Vehicle Reg & Status Badge */}
      <View style={[styles.row, { flexDirection: dirStyle.flexDirection }]}>
        <View style={styles.vehicleBadge}>
          <Ionicons name="car-outline" size={16} color="#00F0FF" style={{ marginHorizontal: 4 }} />
          <Text style={styles.vehicleText}>{challan.vehicle_no}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Middle: Offense Title and Ticket No */}
      <View style={styles.middleSection}>
        <Text
          numberOfLines={2}
          style={[styles.violationTitle, { textAlign: dirStyle.textAlign }]}
        >
          {challan.violation_title || challan.rule?.title || 'Traffic Regulation Violation'}
        </Text>
        <Text style={[styles.ticketNo, { textAlign: dirStyle.textAlign }]}>
          #{challan.challan_no} • {challan.city || 'Karachi'}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Row: Fine Amount & Actions */}
      <View style={[styles.row, { flexDirection: dirStyle.flexDirection }]}>
        <View>
          <Text style={[styles.amountLabel, { textAlign: dirStyle.textAlign }]}>{t.fineAmount}</Text>
          <Text style={[styles.amountValue, { textAlign: dirStyle.textAlign }]}>
            {t.pkr} {Number(challan.amount).toLocaleString()}
          </Text>
        </View>

        <View style={[styles.actionButtons, { flexDirection: dirStyle.flexDirection }]}>
          {isPending && onPressPay && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPressPay(challan)}
              style={styles.payBtn}
            >
              <Ionicons name="card-outline" size={15} color="#FFFFFF" style={{ marginHorizontal: 4 }} />
              <Text style={styles.payBtnText}>{t.payNowBtn}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPressDetail(challan)}
            style={styles.detailBtn}
          >
            <Text style={styles.detailBtnText}>{t.viewDossier}</Text>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={15}
              color="#00F0FF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  vehicleText: {
    color: '#00F0FF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  middleSection: {
    marginTop: 12,
  },
  violationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  ticketNo: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 12,
  },
  amountLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  actionButtons: {
    alignItems: 'center',
  },
  payBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  detailBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});
