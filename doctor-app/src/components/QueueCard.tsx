import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stethoscope, Clock, UserCheck, ArrowRight } from 'lucide-react-native';
import { Appointment } from '../types';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface QueueCardProps {
  currentPatient: Appointment | null;
  nextPatient: Appointment | null;
  onStartConsultation: (appointment: Appointment) => void;
  onViewPatient: (patientId: string) => void;
}

const formatToken = (item: any): string => {
  if (!item) return 'A001';
  const val = item.token || item.token_number || item.tokenNumber || item.queueNumber;
  if (val && typeof val === 'string' && val.trim() && val.trim() !== '#undefined' && val.trim() !== 'undefined') {
    return val.trim();
  }
  const pos = item.queue_number || item.queuePosition;
  if (pos !== undefined && pos !== null && !isNaN(pos)) {
    return `A${String(pos).padStart(3, '0')}`;
  }
  return 'A001';
};

export const QueueCard: React.FC<QueueCardProps> = ({
  currentPatient,
  nextPatient,
  onStartConsultation,
  onViewPatient,
}) => {
  const { colors, isDark } = useThemeStore();

  return (
    <View style={styles.container}>
      {/* NOW CONSULTING CARD */}
      <View
        style={[
          styles.activeCard,
          {
            backgroundColor: currentPatient ? (isDark ? '#08234D' : '#EFF6FF') : colors.card,
            borderColor: currentPatient ? PALETTE.accent : colors.border,
          },
          currentPatient ? SHADOWS.accentGlow : SHADOWS.light,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.liveBadgeRow}>
            <View style={[styles.pulseDot, { backgroundColor: currentPatient ? PALETTE.accent : PALETTE.secondaryTextLight }]} />
            <Text style={[styles.cardTag, { color: currentPatient ? PALETTE.accent : colors.secondaryText }]}>
              {currentPatient ? 'NOW CONSULTING' : 'NO ACTIVE CONSULTATION'}
            </Text>
          </View>
          {currentPatient && (
            <View style={[styles.tokenPill, { backgroundColor: PALETTE.accent }]}>
              <Text style={styles.tokenPillText}>{formatToken(currentPatient)}</Text>
            </View>
          )}
        </View>

        {currentPatient ? (
          <View style={styles.patientInfoBlock}>
            <Text style={[styles.patientName, { color: colors.text }]}>{currentPatient.patient_name || 'Patient'}</Text>
            <Text style={[styles.patientSub, { color: colors.secondaryText }]}>
              {currentPatient.department} • {currentPatient.reason || 'General Consultation'}
            </Text>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                onPress={() => onViewPatient(currentPatient.patient_id)}
                style={[styles.outlineBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>Patient Record</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onStartConsultation(currentPatient)}
                style={[styles.accentBtn, { backgroundColor: PALETTE.accent }]}
                activeOpacity={0.8}
              >
                <Stethoscope size={16} color="#FFFFFF" />
                <Text style={styles.accentBtnText}>Resume Consultation</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyPrompt}>
            <Text style={[styles.emptyPromptText, { color: colors.secondaryText }]}>
              Ready for next consultation. Select next patient from queue.
            </Text>
          </View>
        )}
      </View>

      {/* NEXT PATIENT IN LINE */}
      {nextPatient && (
        <View
          style={[
            styles.nextCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            SHADOWS.light,
          ]}
        >
          <View style={styles.nextHeaderRow}>
            <View style={styles.nextTagRow}>
              <UserCheck size={14} color={colors.primary} />
              <Text style={[styles.nextTagText, { color: colors.primary }]}>NEXT PATIENT IN QUEUE</Text>
            </View>
            <View style={[styles.nextTokenBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.nextTokenText, { color: colors.primary }]}>
                {formatToken(nextPatient)}
              </Text>
            </View>
          </View>

          <View style={styles.nextBodyRow}>
            <View style={styles.nextDetails}>
              <Text style={[styles.nextPatientName, { color: colors.text }]}>
                {nextPatient.patient_name || 'Patient'}
              </Text>
              <View style={styles.waitRow}>
                <Clock size={12} color={colors.secondaryText} />
                <Text style={[styles.nextWaitText, { color: colors.secondaryText }]}>
                  Est. wait: {nextPatient.estimated_wait} ({nextPatient.patients_ahead} ahead)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onStartConsultation(nextPatient)}
              style={[styles.startNextBtn, { backgroundColor: PALETTE.accent }]}
              activeOpacity={0.8}
            >
              <Text style={styles.startNextBtnText}>Start</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 12,
  },
  activeCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTag: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  tokenPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tokenPillText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  patientInfoBlock: {},
  patientName: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 6,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  patientSub: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 2,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  accentBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  accentBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyPrompt: {
    paddingVertical: 10,
  },
  emptyPromptText: {
    fontSize: TYPOGRAPHY.sizes.body,
    lineHeight: 20,
  },
  nextCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  nextHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nextTagText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  nextTokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nextTokenText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  nextBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextDetails: {
    flex: 1,
  },
  nextPatientName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nextWaitText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  startNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startNextBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
