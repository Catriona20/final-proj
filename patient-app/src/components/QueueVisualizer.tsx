import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Users, Clock, CheckCircle, AlertCircle, Sparkles, Activity } from 'lucide-react-native';
import { AppointmentStatus } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface QueueVisualizerProps {
  tokenNumber: string;
  queuePosition?: number;
  patientsAhead?: number;
  estimatedWait?: string;
  status: AppointmentStatus;
  doctorName: string;
  clinicName: string;
  nowServingToken?: string;
  nowServingPatient?: string;
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  tokenNumber,
  queuePosition = 1,
  patientsAhead = 0,
  estimatedWait = '~12 min',
  status,
  doctorName,
  clinicName,
  nowServingToken,
  nowServingPatient,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  const displayServingToken = nowServingToken || (status === 'In Consultation' ? tokenNumber : `#01`);

  const getStatusDisplay = () => {
    switch (status) {
      case 'In Consultation':
        return {
          title: 'You are in consultation',
          subtitle: `Consultation in progress with ${doctorName}`,
          badgeColor: '#8B5CF6',
          badgeBg: '#8B5CF61A',
        };
      case 'Next':
        return {
          title: 'You are next!',
          subtitle: 'Please step forward to the consultation room',
          badgeColor: theme.cta,
          badgeBg: theme.ctaLight,
        };
      case 'Almost Your Turn':
        return {
          title: "You're almost up",
          subtitle: '1 patient ahead · Prepare your documents',
          badgeColor: '#F59E0B',
          badgeBg: '#F59E0B1A',
        };
      case 'Completed':
        return {
          title: 'Consultation Completed',
          subtitle: 'Prescription & medical record attached',
          badgeColor: theme.success,
          badgeBg: theme.successLight,
        };
      case 'Cancelled':
      case 'CANCELLED':
        return {
          title: 'Appointment Cancelled',
          subtitle: 'This booking is no longer active',
          badgeColor: theme.error,
          badgeBg: theme.errorLight,
        };
      case 'Delayed':
        return {
          title: 'Doctor Running Late',
          subtitle: 'Expected delay ~15 min',
          badgeColor: '#EF4444',
          badgeBg: '#FEE2E2',
        };
      case 'Waiting':
      case 'Checked In':
      case 'Booked':
      case 'Arrived':
      default:
        if (patientsAhead === 0) {
          return {
            title: 'You are next in line!',
            subtitle: `Ready for consultation with ${doctorName}`,
            badgeColor: theme.cta,
            badgeBg: theme.ctaLight,
          };
        }
        if (patientsAhead === 1) {
          return {
            title: "You're almost up (1 patient ahead)",
            subtitle: `Estimated wait time: ${estimatedWait}`,
            badgeColor: '#F59E0B',
            badgeBg: '#F59E0B1A',
          };
        }
        return {
          title: `${patientsAhead} patients ahead of you`,
          subtitle: `Estimated wait time: ${estimatedWait}`,
          badgeColor: theme.primary,
          badgeBg: isDark ? '#0F2557' : '#EBF0FF',
        };
    }
  };

  const statusInfo = getStatusDisplay();

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
      {/* Top Banner Status */}
      <View style={[styles.statusBanner, { backgroundColor: statusInfo.badgeBg }]}>
        <Activity size={14} color={statusInfo.badgeColor} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusTitle, { color: statusInfo.badgeColor }]}>
            {statusInfo.title}
          </Text>
          <Text style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
            {statusInfo.subtitle}
          </Text>
        </View>
      </View>

      {/* Queue Counter Display */}
      <View style={styles.counterRow}>
        {/* NOW SERVING CARD */}
        <View
          style={[
            styles.counterCard,
            {
              backgroundColor: isDark ? '#06152F' : '#F8FAFC',
              borderColor: isDark ? '#162D54' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.counterLabel, { color: theme.textMuted }]}>NOW SERVING</Text>
          <Text style={[styles.nowServingNum, { color: theme.textPrimary }]}>
            {status === 'In Consultation' ? tokenNumber : displayServingToken}
          </Text>
          <Text style={[styles.counterSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {status === 'In Consultation'
              ? 'You in Room'
              : nowServingPatient
              ? `${nowServingPatient} (In Room)`
              : 'In Room'}
          </Text>
        </View>

        {/* ARROW PROGRESSION */}
        <View style={styles.flowCol}>
          <Text style={styles.flowArrow}>➔</Text>
          <View style={[styles.patientsPill, { backgroundColor: theme.primaryLight }]}>
            <Users size={10} color={theme.primary} />
            <Text style={[styles.patientsPillText, { color: theme.primary }]}>
              {status === 'In Consultation' ? '0 ahead' : `${patientsAhead} ahead`}
            </Text>
          </View>
        </View>

        {/* YOUR TOKEN CARD */}
        <Animated.View
          style={[
            styles.counterCard,
            styles.yourTokenCard,
            {
              backgroundColor: isDark ? '#0F2557' : '#EBF0FF',
              borderColor: theme.primary,
              transform: [{ scale: status === 'In Consultation' ? pulseAnim : 1 }],
            },
          ]}
        >
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU</Text>
          </View>
          <Text style={[styles.counterLabel, { color: theme.primary }]}>YOUR TOKEN</Text>
          <Text style={[styles.yourTokenNum, { color: theme.primary }]}>{tokenNumber}</Text>
          <Text style={[styles.counterSub, { color: theme.primary }]}>
            {status === 'In Consultation' ? 'In Session' : estimatedWait}
          </Text>
        </Animated.View>
      </View>

      {/* Queue Position Steps Visualization */}
      <View style={[styles.stepsContainer, { backgroundColor: theme.backgroundSoft }]}>
        {Array.from({ length: 4 }).map((_, index) => {
          const stepTokenNum = Math.max(1, queuePosition - 3 + index);
          const isYou = stepTokenNum === queuePosition;
          const isPast = stepTokenNum < queuePosition - patientsAhead;
          const isServing = stepTokenNum === queuePosition - patientsAhead;

          return (
            <View key={index} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isYou
                      ? theme.cta
                      : isServing
                      ? theme.primary
                      : isPast
                      ? theme.success
                      : theme.cardBorder,
                  },
                ]}
              >
                {isPast ? (
                  <CheckCircle size={10} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepDotText}>#{stepTokenNum < 10 ? `0${stepTokenNum}` : stepTokenNum}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isYou ? theme.cta : isServing ? theme.primary : theme.textMuted,
                    fontWeight: isYou || isServing ? '700' : '500',
                  },
                ]}
              >
                {isYou ? 'YOU' : isServing ? 'Serving' : isPast ? 'Done' : 'Waiting'}
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
    ...SHADOWS.card,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 11,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  counterCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  yourTokenCard: {
    borderWidth: 1.5,
    position: 'relative',
  },
  youBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  counterLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nowServingNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  yourTokenNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  counterSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  flowCol: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  flowArrow: {
    fontSize: 16,
    color: '#94A3B8',
  },
  patientsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  patientsPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: 3,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 9.5,
  },
});
