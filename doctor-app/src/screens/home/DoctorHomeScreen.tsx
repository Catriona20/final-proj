import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import {
  Building2,
  Clock,
  Users,
  CheckCircle2,
  Stethoscope,
  ChevronDown,
  Calendar,
  Activity,
  MapPin,
  ShieldCheck,
  UserCheck,
  Bell,
  Check,
  X,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { VerificationBanner } from '../../components/VerificationBanner';
import { DoctorTimingCard } from '../../components/DoctorTimingCard';
import { QueueCard } from '../../components/QueueCard';
import { AppointmentCard } from '../../components/AppointmentCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ClinicSwitcherModal } from '../../components/ClinicSwitcherModal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DoctorAvailabilityStatus, Appointment } from '../../types';
import { timeUtils } from '../../utils/timeUtils';

interface DoctorHomeScreenProps {
  navigation: any;
}

export const DoctorHomeScreen: React.FC<DoctorHomeScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const { doctor } = useDoctorAuthStore();
  const {
    activeClinicName,
    activeClinic,
    appointments,
    currentPatient,
    nextPatient,
    waitingCount,
    completedCount,
    totalToday,
    doctorTiming,
    fetchDashboardData,
    startConsultation,
    availabilityRequests,
    approveAvailabilityRequest,
    rejectAvailabilityRequest,
    isLoading,
  } = useDoctorAppStore();

  const [clinicModalVisible, setClinicModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveTime, setLiveTime] = useState(timeUtils.formatCurrentTime());
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const dashInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    const clockInterval = setInterval(() => {
      setLiveTime(timeUtils.formatCurrentTime());
    }, 1000);
    return () => {
      clearInterval(dashInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await approveAvailabilityRequest(requestId, 'Approved by Doctor');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await rejectAvailabilityRequest(requestId, 'Declined due to schedule conflict');
    } finally {
      setProcessingRequestId(null);
    }
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

  const inConsultationCount = currentPatient ? 1 : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* TOP APP BAR: CLINIC SWITCHER DROPDOWN */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setClinicModalVisible(true)}
            style={[styles.clinicSelector, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}
            activeOpacity={0.8}
          >
            <Building2 size={16} color={colors.primary} />
            <Text style={[styles.clinicSelectorText, { color: colors.text }]} numberOfLines={1}>
              [ {activeClinicName} ▾ ]
            </Text>
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('DoctorNotifications')}
              style={[styles.loadQuickBtn, { backgroundColor: colors.cardSubtle }]}
              activeOpacity={0.8}
            >
              <Bell size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('DoctorLoad')}
              style={[styles.loadQuickBtn, { backgroundColor: colors.cardSubtle }]}
              activeOpacity={0.8}
            >
              <Activity size={14} color={colors.primary} />
              <Text style={[styles.loadQuickBtnText, { color: colors.primary }]}>Load</Text>
            </TouchableOpacity>

            <ThemeToggle />
          </View>
        </View>

        {/* GOOD MORNING GREETING */}
        <View style={styles.greetingHeader}>
          <Text style={[styles.greetingSub, { color: colors.secondaryText }]}>CLINICAL WORKSPACE</Text>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            GOOD MORNING, {doctor?.name ? (doctor.name.toUpperCase().startsWith('DR.') ? doctor.name.toUpperCase() : `DR. ${doctor.name.toUpperCase()}`) : 'DOCTOR'}
          </Text>
        </View>

        {/* VERIFICATION STATE BANNER */}
        <VerificationBanner
          status={doctor?.verification_status || 'VERIFIED'}
          rejectionReason={doctor?.verification_rejection_reason}
          onPressDetails={() => navigation.navigate('VerificationProfile')}
        />

        {/* REAL DOCTOR TIMING WIDGET */}
        <DoctorTimingCard
          doctorName={doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Practitioner'}
          specialization={doctor?.specialization || 'Clinical Specialist'}
          clinicName={activeClinicName || activeClinic?.name || 'Clinical Center'}
          clinicArea={activeClinic?.area || activeClinic?.address || 'Chennai'}
          operatingHours={doctorTiming.operatingHours}
          currentTime={liveTime}
          status={doctorTiming.status}
          nextAppointmentTime={doctorTiming.nextAppointmentTime}
          patientsWaiting={waitingCount}
        />

        {/* OPD SUMMARY STATISTICS */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{totalToday || appointments.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Appointments</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
            <Text style={[styles.metricValue, { color: PALETTE.warning }]}>{waitingCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Waiting</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
            <Text style={[styles.metricValue, { color: PALETTE.accent }]}>{inConsultationCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>In Consultation</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
            <Text style={[styles.metricValue, { color: PALETTE.success }]}>{completedCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>Completed</Text>
          </View>
        </View>

        {/* AVAILABILITY REQUESTS SECTION */}
        <SectionHeader
          title="AVAILABILITY REQUESTS"
          subtitle="Shift booking proposals from clinics"
          badgeCount={availabilityRequests.filter((r) => r.status === 'PENDING').length}
        />

        <View style={styles.requestsContainer}>
          {availabilityRequests.length === 0 ? (
            <View style={[styles.emptyRequestsCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
              <Clock size={20} color={colors.secondaryText} />
              <Text style={[styles.emptyRequestsText, { color: colors.secondaryText }]}>
                No pending doctor availability requests from clinics.
              </Text>
            </View>
          ) : (
            availabilityRequests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isRejected = req.status === 'REJECTED';
              const isProcessing = processingRequestId === req.id;

              return (
                <View
                  key={req.id}
                  style={[
                    styles.requestCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isPending ? PALETTE.warning + '60' : isApproved ? PALETTE.success + '60' : colors.border,
                    },
                    SHADOWS.light,
                  ]}
                >
                  <View style={styles.requestHeaderRow}>
                    <View style={styles.requestClinicCol}>
                      <View style={styles.requestClinicNameRow}>
                        <Building2 size={15} color={colors.primary} />
                        <Text style={[styles.requestClinicName, { color: colors.text }]} numberOfLines={1}>
                          {req.clinic_name || 'Clinic Facility'}
                        </Text>
                      </View>
                      <Text style={[styles.requestSpecialty, { color: colors.primary }]}>
                        {req.specialty}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.requestBadge,
                        {
                          backgroundColor: isApproved
                            ? PALETTE.successLight
                            : isPending
                            ? PALETTE.warningLight
                            : PALETTE.errorLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.requestBadgeText,
                          {
                            color: isApproved
                              ? PALETTE.success
                              : isPending
                              ? PALETTE.warning
                              : PALETTE.error,
                          },
                        ]}
                      >
                        {req.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.requestDetailsBox, { backgroundColor: colors.cardSubtle }]}>
                    <View style={styles.requestDetailRow}>
                      <Calendar size={13} color={colors.secondaryText} />
                      <Text style={[styles.requestDetailText, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>Date: </Text>{req.date}
                      </Text>
                    </View>

                    <View style={styles.requestDetailRow}>
                      <Clock size={13} color={colors.secondaryText} />
                      <Text style={[styles.requestDetailText, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>Requested Window: </Text>{req.start_time} – {req.end_time}
                      </Text>
                    </View>

                    {req.notes ? (
                      <Text style={[styles.requestNotesText, { color: colors.secondaryText }]}>
                        "{req.notes}"
                      </Text>
                    ) : null}
                  </View>

                  {isPending && (
                    <View style={styles.requestActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(req.id)}
                        disabled={isProcessing}
                        style={[styles.rejectBtn, { borderColor: PALETTE.error }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.rejectBtnText, { color: PALETTE.error }]}>
                          [ REJECT ]
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(req.id)}
                        disabled={isProcessing}
                        style={[styles.acceptBtn, { backgroundColor: PALETTE.success }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.acceptBtnText}>
                          {isProcessing ? 'CONFIRMING...' : '[ ACCEPT ]'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isApproved && (
                    <View style={styles.approvedStatusRow}>
                      <CheckCircle2 size={14} color={PALETTE.success} />
                      <Text style={[styles.approvedStatusText, { color: PALETTE.success }]}>
                        Availability confirmed. Appointment slots activated for patients.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* TODAY'S SCHEDULE TIMELINE */}
        <SectionHeader
          title="TODAY'S SCHEDULE"
          badgeCount={appointments.length}
          actionText="View All"
          onActionPress={() => navigation.navigate('Appointments')}
        />

        <View style={[styles.scheduleTimelineBox, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          {appointments.slice(0, 5).map((apt, index) => {
            const isCompleted = apt.status === 'Completed';
            const isInSession = apt.status === 'In Consultation';

            return (
              <View key={apt.id} style={styles.timelineItem}>
                <View style={styles.timeCol}>
                  <Text style={[styles.timelineTime, { color: isInSession ? PALETTE.accent : colors.text }]}>
                    {apt.time}
                  </Text>
                </View>

                <View style={styles.lineCol}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isCompleted
                          ? PALETTE.success
                          : isInSession
                          ? PALETTE.accent
                          : colors.primary,
                      },
                    ]}
                  />
                  {index < Math.min(appointments.length, 5) - 1 && (
                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleViewPatient(apt.patient_id)}
                  style={[
                    styles.timelineContent,
                    {
                      backgroundColor: isInSession ? PALETTE.accent + '15' : colors.cardSubtle,
                      borderColor: isInSession ? PALETTE.accent : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.timelineTextCol}>
                    <Text style={[styles.timelinePatientName, { color: colors.text }]}>
                      {apt.patient_name || 'Patient'}
                    </Text>
                    <Text style={[styles.timelineReason, { color: colors.secondaryText }]}>{apt.reason}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusTag,
                      {
                        backgroundColor: isCompleted
                          ? PALETTE.successLight
                          : isInSession
                          ? PALETTE.accent + '20'
                          : colors.primary + '18',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        {
                          color: isCompleted
                            ? PALETTE.success
                            : isInSession
                            ? PALETTE.accent
                            : colors.primary,
                        },
                      ]}
                    >
                      {apt.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}

          {appointments.length === 0 && (
            <View style={styles.noApptsBox}>
              <Calendar size={24} color={colors.secondaryText} />
              <Text style={[styles.noApptsText, { color: colors.secondaryText }]}>
                No appointments scheduled for this clinic today.
              </Text>
            </View>
          )}
        </View>

        {/* LIVE OPD CONSULTATION (WITHOUT CALL NEXT BUTTON!) */}
        <SectionHeader title="Live OPD Queue" subtitle="Explicit patient selection workspace" />
        <QueueCard
          currentPatient={currentPatient}
          nextPatient={nextPatient}
          onStartConsultation={handleStartConsultation}
          onViewPatient={handleViewPatient}
        />
      </ScrollView>

      {/* CLINIC SWITCHER MODAL */}
      <ClinicSwitcherModal visible={clinicModalVisible} onClose={() => setClinicModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  clinicSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  clinicSelectorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loadQuickBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  greetingHeader: {
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 1,
  },
  greetingTitle: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 2,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 4,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.micro,
    marginTop: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  scheduleTimelineBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeCol: {
    width: 60,
    paddingTop: 8,
  },
  timelineTime: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  lineCol: {
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalLine: {
    width: 1.5,
    height: 40,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  timelineTextCol: {
    flex: 1,
  },
  timelinePatientName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  timelineReason: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusTagText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  noApptsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noApptsText: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 6,
    textAlign: 'center',
  },
  requestsContainer: {
    marginBottom: 20,
    gap: 10,
  },
  emptyRequestsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyRequestsText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    textAlign: 'center',
  },
  requestCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestClinicCol: {
    flex: 1,
    marginRight: 8,
  },
  requestClinicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestClinicName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  requestSpecialty: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  requestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  requestBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    textTransform: 'uppercase',
  },
  requestDetailsBox: {
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  requestDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestDetailText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  requestNotesText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontStyle: 'italic',
    marginTop: 2,
  },
  requestActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  rejectBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.5,
  },
  acceptBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.5,
  },
  approvedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  approvedStatusText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
