import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Calendar, Users, Activity, CheckCircle2 } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { DoctorTimingStatus } from '../types';

interface DoctorTimingCardProps {
  doctorName: string;
  specialization: string;
  clinicName: string;
  clinicArea: string;
  operatingHours: string;
  currentTime: string;
  status: DoctorTimingStatus;
  nextAppointmentTime: string | null;
  patientsWaiting: number;
}

export const DoctorTimingCard: React.FC<DoctorTimingCardProps> = ({
  doctorName,
  specialization,
  clinicName,
  clinicArea,
  operatingHours,
  currentTime,
  status,
  nextAppointmentTime,
  patientsWaiting,
}) => {
  const { colors, isDark } = useThemeStore();

  const getStatusStyle = (st: DoctorTimingStatus) => {
    switch (st) {
      case 'In Session':
        return { bg: PALETTE.accent + '20', text: PALETTE.accent, border: PALETTE.accent, dot: PALETTE.accent };
      case 'Busy':
        return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', dot: '#F59E0B' };
      case 'Available':
        return { bg: PALETTE.successLight, text: PALETTE.success, border: PALETTE.success, dot: PALETTE.success };
      case 'On Break':
        return { bg: PALETTE.warningLight, text: '#B45309', border: PALETTE.warning, dot: PALETTE.warning };
      case 'Running Late':
        return { bg: PALETTE.errorLight, text: PALETTE.error, border: PALETTE.error, dot: PALETTE.error };
      case 'Not Started':
        return { bg: '#DBEAFE', text: PALETTE.primary, border: PALETTE.primary, dot: PALETTE.primary };
      case 'Offline':
        return { bg: colors.cardSubtle, text: colors.secondaryText, border: colors.border, dot: colors.secondaryText };
      default:
        return { bg: colors.cardSubtle, text: colors.secondaryText, border: colors.border, dot: colors.secondaryText };
    }
  };

  const statusStyle = getStatusStyle(status);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
      {/* HEADER: DOCTOR & CLINIC */}
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.doctorName, { color: colors.text }]}>{doctorName}</Text>
          <Text style={[styles.specialization, { color: colors.primary }]}>{specialization}</Text>
          <Text style={[styles.clinicLocation, { color: colors.secondaryText }]}>
            {clinicName} • {clinicArea}
          </Text>
        </View>

        {/* CURRENT STATUS BADGE */}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{status}</Text>
        </View>
      </View>

      {/* OPERATING TIMELINE & REAL SYSTEM TIME */}
      <View style={[styles.timelineBox, { backgroundColor: colors.cardSubtle }]}>
        <View style={styles.timelineRow}>
          <View style={styles.timeMetric}>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>TODAY'S HOURS</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{operatingHours}</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.timeMetric}>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>CURRENT TIME</Text>
            <Text style={[styles.importantTime, { color: colors.primary }]}>{currentTime}</Text>
          </View>
        </View>
      </View>

      {/* FOOTER METRICS: NEXT APPOINTMENT & PATIENTS WAITING */}
      <View style={styles.footerMetricsRow}>
        <View style={styles.footerMetricItem}>
          <Clock size={14} color={colors.secondaryText} />
          <Text style={[styles.footerMetricLabel, { color: colors.secondaryText }]}>Next appointment: </Text>
          <Text style={[styles.footerMetricVal, { color: colors.text }]}>
            {nextAppointmentTime || 'None scheduled'}
          </Text>
        </View>

        <View style={styles.footerMetricItem}>
          <Users size={14} color={PALETTE.warning} />
          <Text style={[styles.footerMetricLabel, { color: colors.secondaryText }]}>Waiting: </Text>
          <Text style={[styles.footerMetricVal, { color: PALETTE.warning }]}>{patientsWaiting}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleCol: {
    flex: 1,
  },
  doctorName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  specialization: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  clinicLocation: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  timelineBox: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  timeMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  importantTime: {
    fontSize: TYPOGRAPHY.sizes.importantTime,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F040',
  },
  footerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerMetricLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  footerMetricVal: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
