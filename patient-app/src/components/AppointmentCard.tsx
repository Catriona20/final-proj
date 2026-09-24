import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, MapPin, ChevronRight, Building2 } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { Appointment } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { timeUtils } from '../utils/timeUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: (apt: Appointment) => void;
  compact?: boolean;
  style?: object;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  compact = false,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return theme.primary;
      case 'Checked In':
      case 'Completed': return theme.success;
      case 'Waiting':
      case 'Delayed': return '#F59E0B';
      case 'In Consultation': return '#8B5CF6';
      case 'Cancelled': return theme.error;
      default: return theme.primary;
    }
  };

  const statusColor = getStatusColor(appointment.status);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        style,
      ]}
      onPress={() => onPress?.(appointment)}
      activeOpacity={0.92}
    >
      {/* Top Row: Avatar + Info + Status */}
      <View style={styles.topRow}>
        <Image source={{ uri: appointment.doctorAvatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={[styles.doctorName, { color: theme.textPrimary }]} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={[styles.spec, { color: theme.primary }]}>{appointment.doctorSpecialization}</Text>
          <Text style={[styles.clinic, { color: theme.textMuted }]} numberOfLines={1}>
            {appointment.clinicName}
          </Text>
        </View>
        <View style={styles.statusCol}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{appointment.status}</Text>
          </View>
          {appointment.tokenNumber && (
            <View style={[styles.tokenBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.tokenText, { color: theme.primary }]}>{appointment.tokenNumber}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Meta Row: Date, Time, Duration, Type */}
      <View style={[styles.metaStrip, { backgroundColor: theme.backgroundSoft }]}>
        <View style={styles.metaItem}>
          <Calendar size={12} color={theme.textMuted} />
          <Text style={[styles.metaText, { color: theme.textPrimary }]}>
            {timeUtils.formatRelativeDate(appointment.date)}
          </Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.cardBorder }]} />
        <View style={styles.metaItem}>
          <Clock size={12} color={theme.textMuted} />
          <Text style={[styles.metaText, { color: theme.textPrimary }]}>{appointment.time}</Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.cardBorder }]} />
        <Text style={[styles.metaText, { color: theme.primary, fontWeight: '700' }]}>
          {timeUtils.calculateTimeUntil(appointment.date, appointment.time, appointment.status)}
        </Text>
      </View>

      {/* Reason + CTA Row */}
      {!compact && (
        <View style={styles.bottomRow}>
          {appointment.reason ? (
            <Text style={[styles.reason, { color: theme.textSecondary }]} numberOfLines={1}>
              {appointment.reason}
            </Text>
          ) : (
            <View />
          )}
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: theme.cta }]}
            onPress={() => onPress?.(appointment)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewBtnText}>View Details</Text>
            <ChevronRight size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  spec: {
    fontSize: 12,
    fontWeight: '600',
  },
  clinic: {
    fontSize: 11,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tokenText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reason: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
