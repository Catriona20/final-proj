import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Linking,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Navigation,
  CheckCircle,
  ShieldCheck,
  Building2,
  Stethoscope,
  ChevronRight,
  Edit3,
  Sparkles,
  Download,
  X,
} from 'lucide-react-native';
import { AppStackParamList } from '../../types';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { QueueVisualizer } from '../../components/QueueVisualizer';
import { AppointmentTimeline } from '../../components/AppointmentTimeline';
import { DigitalPrescriptionModal } from '../../components/DigitalPrescriptionModal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { timeUtils } from '../../utils/timeUtils';

type AppointmentDetailNavProp = StackNavigationProp<AppStackParamList, 'AppointmentDetail'>;
type AppointmentDetailRouteProp = RouteProp<AppStackParamList, 'AppointmentDetail'>;

const CANCELLATION_REASONS = [
  'Schedule conflict / Change of plans',
  'Condition improved / No longer needed',
  'Booked by mistake',
  'Doctor / Clinic requested reschedule',
  'Consulted another doctor',
  'Other personal reason',
];

export const AppointmentDetailScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentDetailNavProp>();
  const route = useRoute<AppointmentDetailRouteProp>();
  const { appointmentId } = route.params;

  const {
    appointments,
    doctors,
    clinics,
    cancelAppointment,
    simulateQueueAdvance,
    doctorCompleteAppointment,
  } = useAppointmentStore();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const [isPrescriptionModalVisible, setIsPrescriptionModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [isCancelling, setIsCancelling] = useState(false);

  const appointment = appointments.find((a) => a.id === appointmentId);
  const doctor = doctors.find(
    (d) => d.id === appointment?.doctorId || d.name === appointment?.doctorName
  );
  const clinic = clinics.find(
    (c) => c.id === appointment?.clinicId || c.name === appointment?.clinicName
  );

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <AlertCircle size={36} color={theme.error} />
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Appointment Not Found</Text>
        <Text style={[styles.errorSub, { color: theme.textMuted }]}>
          This consultation booking might have been removed or cancelled.
        </Text>
        <TouchableOpacity
          style={[styles.backHomeBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelAppointment(appointment.id, selectedReason);
      setIsCancelling(false);
      setIsCancelModalVisible(false);
    } catch (err) {
      setIsCancelling(false);
      setIsCancelModalVisible(false);
    }
  };

  const handleOpenDirections = () => {
    const query = encodeURIComponent(`${appointment.clinicName}, ${appointment.clinicAddress}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert('Directions Error', 'Unable to open Google Maps.');
    });
  };

  const isCompleted = appointment.status === 'Completed';
  const isCancelled = appointment.status === 'Cancelled';
  const canModify = !isCompleted && !isCancelled && appointment.status !== 'In Consultation';

  React.useEffect(() => {
    // Refresh appointments in background to guarantee live queue accuracy
    useAppointmentStore.getState().initializeStore();
  }, [appointmentId]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#06152F' : '#FFFFFF',
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.backgroundSoft }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={18} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Your Consultation
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Token {appointment.tokenNumber || '#01'} · {timeUtils.formatRelativeDate(appointment.date)}
          </Text>
        </View>

        <ThemeToggle compact />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. DYNAMIC LIVE QUEUE VISUALIZER OR UPCOMING ADVISORY */}
        {appointment.status === 'Cancelled' ? null : ['Checked In', 'In Consultation', 'Waiting', 'Next', 'Almost Your Turn'].includes(appointment.status) ? (
          <QueueVisualizer
            tokenNumber={appointment.tokenNumber || '#01'}
            queuePosition={appointment.queuePosition || 1}
            patientsAhead={appointment.patientsAhead ?? 0}
            estimatedWait={appointment.estimatedWait || 'Under 2 min'}
            status={appointment.status}
            doctorName={appointment.doctorName}
            clinicName={appointment.clinicName}
            nowServingToken={appointment.currentServingToken}
            nowServingPatient={appointment.currentServingPatient}
          />
        ) : (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
                borderColor: theme.primary,
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                  Confirmed for {appointment.date} at {appointment.time}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  Check-in opens on {appointment.date} at the clinic reception desk (30 minutes prior to your slot).
                </Text>
              </View>
            </View>
          </View>
        )}


        {/* Digital Prescription Banner (when doctor completes consultation) */}
        {isCompleted && appointment.prescription && (
          <TouchableOpacity
            style={[styles.prescriptionBanner, { backgroundColor: theme.successLight, borderColor: theme.success }]}
            onPress={() => setIsPrescriptionModalVisible(true)}
            activeOpacity={0.88}
          >
            <View style={[styles.rxIconCircle, { backgroundColor: theme.success }]}>
              <FileText size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[styles.rxBannerTitle, { color: theme.success }]}>
                Digital Prescription Available
              </Text>
              <Text style={[styles.rxBannerSub, { color: theme.textSecondary }]}>
                Issued by {appointment.doctorName} · Tap to view & download PDF
              </Text>
            </View>
            <ChevronRight size={16} color={theme.success} />
          </TouchableOpacity>
        )}

        {/* 2. APPOINTMENT PROGRESS TIMELINE */}
        <AppointmentTimeline status={appointment.status} />

        {/* 3. DOCTOR CARD */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Image source={{ uri: appointment.doctorAvatar }} style={styles.avatar} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.docNameRow}>
                <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {appointment.doctorName}
                </Text>
                <ShieldCheck size={14} color={theme.primary} />
              </View>
              <Text style={[styles.docSpec, { color: theme.primary }]}>
                {appointment.doctorSpecialization} {appointment.department ? `· ${appointment.department}` : ''}
              </Text>
              {doctor?.qualification && (
                <Text style={[styles.docExp, { color: theme.textMuted }]}>
                  {doctor.qualification}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 4. CLINIC CARD WITH DIRECTIONS */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.clinicRow}>
            <Building2 size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.clinicTitle, { color: theme.textPrimary }]}>
                {appointment.clinicName}
              </Text>
              <Text style={[styles.clinicAddress, { color: theme.textSecondary }]}>
                {appointment.clinicAddress}
              </Text>
            </View>
          </View>

          <View style={styles.clinicActionRow}>
            <TouchableOpacity
              style={[styles.directionsBtn, { backgroundColor: theme.primary }]}
              onPress={handleOpenDirections}
              activeOpacity={0.85}
            >
              <Navigation size={13} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>

            {clinic && (
              <TouchableOpacity
                style={[styles.viewClinicBtn, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('ClinicDetail', { clinicId: clinic.id })}
                activeOpacity={0.85}
              >
                <Text style={[styles.viewClinicText, { color: theme.textPrimary }]}>View Clinic</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 5. CONSULTATION DETAILS & SYMPTOMS */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Consultation Reason</Text>
          <Text style={[styles.reasonText, { color: theme.textPrimary }]}>
            {appointment.reason || 'General Consultation'}
          </Text>
          {appointment.customReasonText && (
            <Text style={[styles.reasonNote, { color: theme.textSecondary }]}>
              "{appointment.customReasonText}"
            </Text>
          )}

          {appointment.symptoms && appointment.symptoms.length > 0 && (
            <View style={styles.symptomsSection}>
              <Text style={[styles.symptomsLabel, { color: theme.textMuted }]}>REPORTED SYMPTOMS</Text>
              <View style={styles.symptomsChips}>
                {appointment.symptoms.map((sym, idx) => (
                  <View
                    key={idx}
                    style={[styles.symptomChip, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
                  >
                    <Text style={[styles.symptomChipText, { color: theme.textPrimary }]}>{sym}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {appointment.uploadedFiles && appointment.uploadedFiles.length > 0 && (
            <View style={styles.attachedFilesSection}>
              <Text style={[styles.symptomsLabel, { color: theme.textMuted }]}>ATTACHED TEST REPORTS</Text>
              {appointment.uploadedFiles.map((file) => (
                <View
                  key={file.id}
                  style={[styles.fileRow, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
                >
                  <FileText size={14} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileRowName, { color: theme.textPrimary }]}>{file.testName}</Text>
                    <Text style={[styles.fileRowSub, { color: theme.textMuted }]}>
                      {file.category} · {file.clinicPerformed}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Cancellation Notice / Action */}
        {canModify && (
          <TouchableOpacity style={styles.cancelLinkBtn} onPress={handleCancel}>
            <Text style={[styles.cancelLinkText, { color: theme.error }]}>
              Cancel Appointment Booking
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#0C2347' : '#FFFFFF', borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Cancel Appointment</Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  Please select a reason for cancelling this consultation slot.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCancelModalVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: theme.backgroundSoft }]}
              >
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.reasonsList}>
              {CANCELLATION_REASONS.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSelected
                          ? isDark ? '#1E3A8A' : '#EFF6FF'
                          : theme.backgroundSoft,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedReason(r)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? theme.primary : theme.textMuted },
                      ]}
                    >
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonOptionText,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalKeepBtn, { backgroundColor: theme.backgroundSoft }]}
                onPress={() => setIsCancelModalVisible(false)}
                disabled={isCancelling}
              >
                <Text style={[styles.modalKeepBtnText, { color: theme.textPrimary }]}>Keep Slot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmCancelBtn, { backgroundColor: theme.error }]}
                onPress={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmCancelText}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Digital Prescription Modal */}
      <DigitalPrescriptionModal
        visible={isPrescriptionModalVisible}
        onClose={() => setIsPrescriptionModalVisible(false)}
        prescription={appointment.prescription || null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 12,
  },
  simControlsCard: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  simLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  simBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  prescriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    gap: 10,
  },
  rxIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rxBannerSub: {
    fontSize: 11,
  },
  infoCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '600',
  },
  docExp: {
    fontSize: 11,
  },
  clinicRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clinicTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  clinicAddress: {
    fontSize: 11,
    marginTop: 1,
  },
  clinicActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  viewClinicBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  viewClinicText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonNote: {
    fontSize: 11,
    lineHeight: 15,
  },
  symptomsSection: {
    gap: 4,
    marginTop: 4,
  },
  symptomsLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  symptomsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
  },
  symptomChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  attachedFilesSection: {
    gap: 4,
    marginTop: 4,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 8,
  },
  fileRowName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  fileRowSub: {
    fontSize: 10,
  },
  cancelLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  backHomeBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reasonOptionText: {
    fontSize: 12,
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalKeepBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalKeepBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmCancelBtn: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
