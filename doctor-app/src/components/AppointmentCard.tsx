import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, User, ChevronRight, Stethoscope } from 'lucide-react-native';
import { Appointment } from '../types';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { PriorityBadge } from './PriorityBadge';

interface AppointmentCardProps {
  appointment: Appointment;
  onViewPatient: (patientId: string) => void;
  onStartConsultation?: (appointment: Appointment) => void;
  onPressCard?: () => void;
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

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewPatient,
  onStartConsultation,
  onPressCard,
}) => {
  const { colors, isDark } = useThemeStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Consultation':
        return { bg: PALETTE.accent + '20', text: PALETTE.accent, border: PALETTE.accent + '50' };
      case 'Next':
        return { bg: '#DBEAFE', text: PALETTE.primary, border: PALETTE.primary + '50' };
      case 'Waiting':
      case 'Almost Your Turn':
      case 'Checked In':
      case 'CHECKED_IN':
        return { bg: PALETTE.warningLight, text: '#B45309', border: PALETTE.warning + '50' };
      case 'Completed':
        return { bg: PALETTE.successLight, text: PALETTE.success, border: PALETTE.success + '50' };
      case 'Cancelled':
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
      default:
        return { bg: colors.cardSubtle, text: colors.text, border: colors.border };
    }
  };

  const statusStyle = getStatusColor(appointment.status);
  const canStartConsultation =
    appointment.status !== 'Completed' &&
    appointment.status !== 'Cancelled' &&
    onStartConsultation;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressCard}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: appointment.status === 'In Consultation' ? PALETTE.accent : colors.border,
          borderWidth: appointment.status === 'In Consultation' ? 2 : 1,
        },
        SHADOWS.light,
      ]}
    >
      {/* Top Header: Priority, Token & Status Pill */}
      <PriorityBadge priority={appointment.priority} reason={appointment.reason} />
      
      <View style={styles.headerRow}>
        <View style={styles.tokenContainer}>
          <View style={[styles.tokenBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.tokenText}>{formatToken(appointment)}</Text>
          </View>
          <View>
            <Text style={[styles.patientName, { color: colors.text }]}>{appointment.patient_name || 'Patient'}</Text>
            <Text style={[styles.patientMeta, { color: colors.secondaryText }]}>
              {appointment.department} • Slot {appointment.time}
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{appointment.status}</Text>
        </View>
      </View>

      {/* Clinical Complaint & Symptoms */}
      <View style={[styles.detailsBox, { backgroundColor: colors.cardSubtle }]}>
        <Text style={[styles.reasonLabel, { color: colors.secondaryText }]}>Chief Complaint:</Text>
        <Text style={[styles.reasonText, { color: colors.text }]} numberOfLines={2}>
          {appointment.reason || 'General clinical consultation'}
        </Text>

        {appointment.symptoms && appointment.symptoms.length > 0 && (
          <View style={styles.symptomsRow}>
            {appointment.symptoms.map((sym, idx) => (
              <View key={idx} style={[styles.symptomChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.symptomChipText, { color: colors.text }]}>{sym}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Footer Info: Estimated Wait & Action Buttons */}
      <View style={styles.footerRow}>
        <View style={styles.waitInfo}>
          <Clock size={14} color={colors.secondaryText} />
          <Text style={[styles.waitText, { color: colors.secondaryText }]}>
            {appointment.status === 'Completed'
              ? 'Finished'
              : appointment.status === 'In Consultation'
              ? 'Active Now'
              : `${appointment.estimated_wait} (${appointment.patients_ahead} ahead)`}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={() => onViewPatient(appointment.patient_id)}
            style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <User size={14} color={colors.secondary} />
            <Text style={[styles.secondaryBtnText, { color: colors.secondary }]}>View Patient</Text>
          </TouchableOpacity>

          {canStartConsultation && (
            <TouchableOpacity
              onPress={() => onStartConsultation && onStartConsultation(appointment)}
              style={[
                styles.primaryBtn,
                { backgroundColor: PALETTE.accent },
                appointment.status === 'In Consultation' ? SHADOWS.accentGlow : {},
              ]}
              activeOpacity={0.8}
            >
              <Stethoscope size={15} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {appointment.status === 'In Consultation' ? 'Resume' : 'Start'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tokenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  patientName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  patientMeta: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  detailsBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    lineHeight: 18,
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  symptomChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  symptomChipText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
