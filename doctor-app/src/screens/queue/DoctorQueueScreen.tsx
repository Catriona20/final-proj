import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Users, Clock, CheckCircle2, AlertCircle, Zap, ShieldCheck } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { AppointmentCard } from '../../components/AppointmentCard';
import { Appointment } from '../../types';

interface DoctorQueueScreenProps {
  navigation: any;
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

export const DoctorQueueScreen: React.FC<DoctorQueueScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const {
    activeClinicName,
    appointments,
    liveQueue,
    currentPatient,
    nextPatient,
    waitingCount,
    completedCount,
    fetchDashboardData,
    startConsultation,
    isLoading,
  } = useDoctorAppStore();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      if (appointment?.id) {
        startConsultation(appointment.id);
      }
    } catch (e) {
      console.warn('startConsultation notice:', e);
    }
    navigation.navigate('Consultation', {
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patient_name || 'Patient',
      appointment,
    });
  };

  const handleViewPatient = (patientId: string) => {
    navigation.navigate('DoctorPatientDetail', { patientId });
  };

  const queueSource = liveQueue || [];
  const waitingQueue = queueSource.filter((a) =>
    !['In Consultation', 'IN_CONSULTATION', 'Completed', 'COMPLETED', 'Cancelled', 'CANCELLED', 'No-show', 'NO_SHOW', 'No Show'].includes(a.status)
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* HEADER */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Live OPD Queue</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {activeClinicName} • {waitingCount} patients waiting
          </Text>
        </View>

        {/* CURRENTLY IN CONSULTATION SECTION */}
        <Text style={[styles.sectionHeading, { color: colors.secondaryText }]}>CURRENTLY IN CONSULTATION</Text>
        {currentPatient ? (
          <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: PALETTE.accent }, SHADOWS.accentGlow]}>
            <View style={styles.activeHeader}>
              <View style={styles.badgeRow}>
                <View style={[styles.liveDot, { backgroundColor: PALETTE.accent }]} />
                <Text style={[styles.liveText, { color: PALETTE.accent }]}>ACTIVE SESSION</Text>
              </View>

              <View style={[styles.tokenPill, { backgroundColor: PALETTE.accent }]}>
                <Text style={styles.tokenPillText}>{formatToken(currentPatient)}</Text>
              </View>
            </View>

            <Text style={[styles.patientName, { color: colors.text }]}>{currentPatient.patient_name || 'Patient'}</Text>
            <Text style={[styles.patientComplaint, { color: colors.secondaryText }]}>
              {currentPatient.department} • {currentPatient.reason}
            </Text>

            <View style={styles.activeActions}>
              <TouchableOpacity
                onPress={() => handleViewPatient(currentPatient.patient_id)}
                style={[styles.outlineBtn, { borderColor: colors.border, backgroundColor: colors.cardSubtle }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>View Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStartConsultation(currentPatient)}
                style={[styles.startBtn, { backgroundColor: PALETTE.accent }]}
                activeOpacity={0.8}
              >
                <Text style={styles.startBtnText}>Resume Consultation</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyActiveBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={24} color={colors.secondaryText} />
            <Text style={[styles.emptyActiveTitle, { color: colors.text }]}>No Active Consultation</Text>
            <Text style={[styles.emptyActiveSub, { color: colors.secondaryText }]}>
              Select a waiting patient below to begin clinical consultation.
            </Text>
          </View>
        )}

        {/* WAITING QUEUE LIST WITH PRIORITY BADGES */}
        <View style={styles.queueHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.secondaryText, marginBottom: 0 }]}>
            WAITING QUEUE ({waitingQueue.length})
          </Text>
          <Text style={[styles.syncText, { color: colors.primary }]}>Live Socket.IO Sync</Text>
        </View>

        {waitingQueue.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            onViewPatient={handleViewPatient}
            onStartConsultation={handleStartConsultation}
            onPressCard={() => handleViewPatient(apt.patient_id)}
          />
        ))}

        {waitingQueue.length === 0 && (
          <View style={[styles.emptyQueueBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CheckCircle2 size={32} color={PALETTE.success} />
            <Text style={[styles.emptyQueueTitle, { color: colors.text }]}>QUEUE IS CLEAR</Text>
            <Text style={[styles.emptyQueueSub, { color: colors.secondaryText }]}>
              No patients are currently waiting for consultation at this clinic.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 4,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  activeCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  tokenPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tokenPillText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  patientName: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  patientComplaint: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 2,
    marginBottom: 14,
  },
  activeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  startBtn: {
    flex: 1.6,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyActiveBox: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyActiveTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 6,
  },
  emptyActiveSub: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyQueueBox: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyQueueTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 10,
    letterSpacing: 0.8,
  },
  emptyQueueSub: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 4,
    textAlign: 'center',
  },
});
