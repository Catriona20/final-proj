import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Clock, UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react-native';
import { AppointmentStatus } from '../types';
import { RADIUS, SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface AppointmentTimelineProps {
  status: AppointmentStatus;
}

const STAGES = [
  { key: 'Booked', label: 'Booked' },
  { key: 'Arrived', label: 'Arrived' },
  { key: 'Waiting', label: 'Waiting' },
  { key: 'Next', label: 'Next Up' },
  { key: 'In Consultation', label: 'In Session' },
  { key: 'Completed', label: 'Completed' },
];

export const AppointmentTimeline: React.FC<AppointmentTimelineProps> = ({ status }) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  if (status === 'Cancelled') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderColor: isDark ? '#1A3560' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Appointment Status</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.error }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.error }}>
            BOOKED → CANCELLED
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>
          This consultation was cancelled. The reserved slot has been released.
        </Text>
      </View>
    );
  }

  if (status === 'No-show' || (status as string) === 'NO_SHOW') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderColor: isDark ? '#1A3560' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Appointment Status</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
            BOOKED → NO-SHOW
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>
          Patient did not check in during the arrival grace period. Marked as No-Show.
        </Text>
      </View>
    );
  }

  const getStageIndex = (currStatus: AppointmentStatus) => {
    switch (currStatus) {
      case 'Confirmed':
      case 'Booked':
        return 0;
      case 'Checked In':
      case 'Arrived':
        return 1;
      case 'Waiting':
        return 2;
      case 'Almost Your Turn':
      case 'Next':
        return 3;
      case 'In Consultation':
        return 4;
      case 'Completed':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(status);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
          borderColor: isDark ? '#1A3560' : '#E2E8F0',
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Appointment Progress</Text>

      <View style={styles.timelineRow}>
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <View key={stage.key} style={styles.stageCol}>
              {/* Connector line behind */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: idx <= currentIndex ? theme.primary : theme.cardBorder,
                    },
                  ]}
                />
              )}

              <View
                style={[
                  styles.nodeCircle,
                  {
                    backgroundColor: isPassed
                      ? theme.success
                      : isCurrent
                      ? theme.primary
                      : isDark
                      ? '#162D54'
                      : theme.backgroundSoft,
                    borderColor: isCurrent
                      ? theme.cta
                      : isPassed
                      ? theme.success
                      : theme.cardBorder,
                    borderWidth: isCurrent ? 2 : 1,
                  },
                ]}
              >
                {isPassed ? (
                  <Check size={10} color="#FFFFFF" />
                ) : (
                  <View
                    style={[
                      styles.innerDot,
                      { backgroundColor: isCurrent ? '#FFFFFF' : theme.textMuted },
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.stageLabel,
                  {
                    color: isCurrent
                      ? theme.primary
                      : isPassed
                      ? theme.success
                      : theme.textMuted,
                    fontWeight: isCurrent ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {stage.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 4,
  },
  stageCol: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    gap: 4,
  },
  connectorLine: {
    position: 'absolute',
    top: 10,
    right: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
});
