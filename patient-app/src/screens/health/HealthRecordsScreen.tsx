import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  FileText,
  TestTube,
  Pill,
  ChevronRight,
  Plus,
  Upload,
  Calendar,
  MapPin,
  Star,
  CheckCircle,
  Download,
  X,
  Clock,
  ShieldCheck,
  Bot,
} from 'lucide-react-native';
import { AppStackParamList, HealthRecord } from '../../types';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { appointmentService } from '../../services/appointmentService';
import { healthRecordsService } from '../../services/healthRecordsService';
import { MedLinkAssistantModal } from '../../components/MedLinkAssistantModal';
import { ThemeToggle } from '../../components/ThemeToggle';

type RecordTab =
  | 'history'
  | 'clinics'
  | 'doctors'
  | 'prescription'
  | 'lab'
  | 'report'
  | 'appts';

type HealthRecordsNavProp = StackNavigationProp<AppStackParamList>;

const TABS: { key: RecordTab; label: string }[] = [
  { key: 'history', label: 'Visit History' },
  { key: 'clinics', label: 'Previous Clinics' },
  { key: 'doctors', label: 'Previous Doctors' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'lab', label: 'Lab Reports' },
  { key: 'report', label: 'Medical Documents' },
  { key: 'appts', label: 'Appointment History' },
];

export const HealthRecordsScreen: React.FC = () => {
  const navigation = useNavigation<HealthRecordsNavProp>();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const { user } = useAuthStore();

  const { healthRecords, appointments, clinics, doctors, addHealthRecord } = useAppointmentStore();
  const [activeTab, setActiveTab] = useState<RecordTab>('history');

  // Modals
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<HealthRecord | null>(null);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  // New Record Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'lab' | 'prescription' | 'report'>('lab');
  const [newClinic, setNewClinic] = useState('Moon Dental Clinic');
  const [newDoctor, setNewDoctor] = useState('Dr. Arun Kumar');
  const [newReason, setNewReason] = useState('');

  // Auto-refresh when screen gains focus
  const refreshScreenData = useCallback(async () => {
    const authUser = useAuthStore.getState().user;
    if (authUser?.id) {
      try {
        const [appts, recs] = await Promise.all([
          appointmentService.getAppointments(authUser.id),
          healthRecordsService.fetchRecords(authUser.id),
        ]);
        useAppointmentStore.setState({
          appointments: appts,
          healthRecords: recs,
        });
      } catch (e) {
        console.warn('Error refreshing health records:', e);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshScreenData();
    }, [refreshScreenData])
  );

  // Unified Completed Visits Calculation
  const isCompletedApt = (a: any) =>
    ['completed'].includes(a.status?.toLowerCase() || '') ||
    ['completed'].includes(a.appointmentStatus?.toLowerCase() || '');

  const completedAppts = appointments.filter(isCompletedApt);
  const backendVisits = healthRecordsService.getAllVisits();

  const visitMap = new Map<string, any>();
  for (const apt of completedAppts) {
    visitMap.set(apt.id, {
      id: apt.id,
      appointmentId: apt.id,
      patientId: (apt as any).patientId || (apt as any).patient_id || user?.id,
      doctorId: (apt as any).doctorId || (apt as any).doctor_id,
      doctorName: apt.doctorName,
      doctorSpecialization: apt.doctorSpecialization,
      doctorAvatar: apt.doctorAvatar,
      clinicName: apt.clinicName,
      clinicId: (apt as any).clinicId || (apt as any).clinic_id,
      clinicAddress: apt.clinicAddress,
      date: apt.date,
      time: apt.time,
      tokenNumber: apt.tokenNumber,
      reason: apt.reason,
      prescriptionAvailable: apt.prescriptionAvailable,
      status: 'Completed',
    });
  }
  for (const v of backendVisits) {
    const key = v.appointmentId || v.id;
    if (!visitMap.has(key)) {
      visitMap.set(key, {
        id: v.id,
        appointmentId: v.appointmentId,
        patientId: v.patientId || user?.id,
        doctorId: v.doctorId,
        doctorName: v.doctorName,
        doctorSpecialization: v.doctorSpecialization,
        doctorAvatar: v.doctorAvatar,
        clinicName: v.clinicName,
        clinicId: v.clinicId,
        clinicAddress: v.clinicAddress,
        date: v.date,
        time: v.time,
        tokenNumber: v.tokenNumber,
        reason: v.reason || v.diagnosis,
        prescriptionAvailable: v.prescriptionAvailable,
        status: 'Completed',
      });
    }
  }

  const allVisits = Array.from(visitMap.values());

  // Counts for Top Summary Cards
  const labCount = healthRecords.filter((r) => r.type === 'lab').length;
  const rxCount = healthRecords.filter((r) => r.type === 'prescription').length;
  const docCount = healthRecords.filter((r) => r.type === 'report').length;
  const visitCount = allVisits.length;

  const handleDownload = (docName: string) => {
    Alert.alert('Download Record', `Downloading ${docName} PDF to your device downloads folder...`);
  };

  const handleAddRecord = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Enter Title', 'Please specify a document title or test name.');
      return;
    }
    await addHealthRecord({
      title: newTitle.trim(),
      type: newType,
      clinic: newClinic,
      doctor: newDoctor,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Ready',
      reason: newReason.trim() || 'Routine Consultation',
      prescriptionAvailable: newType === 'prescription',
    });
    setIsUploadModalVisible(false);
    setNewTitle('');
    setNewReason('');
    Alert.alert('Record Uploaded', 'Your health document has been securely added.');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'history': {
        return (
          <View style={styles.tabContentContainer}>
            {allVisits.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Calendar size={32} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No past consultations yet</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  Your completed doctor visits and consultation notes will appear here.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyActionBtn, { backgroundColor: theme.cta }]}
                  onPress={() => navigation.navigate('Booking')}
                >
                  <Text style={styles.emptyActionBtnText}>Book a Consultation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              allVisits.map((visit) => (
                <View
                  key={visit.id}
                  style={[styles.visitCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                >
                  <View style={styles.visitHeaderRow}>
                    <View style={styles.visitDateBadge}>
                      <Calendar size={13} color={theme.primary} />
                      <Text style={[styles.visitDateText, { color: theme.primary }]}>{visit.date}</Text>
                    </View>
                    <View style={[styles.tokenTag, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.tokenTagText, { color: theme.primary }]}>{visit.tokenNumber || '#01'}</Text>
                    </View>
                  </View>

                  <View style={styles.visitDoctorRow}>
                    <Image source={{ uri: visit.doctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400' }} style={styles.visitAvatar} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.visitDocName, { color: theme.textPrimary }]}>{visit.doctorName}</Text>
                      <Text style={[styles.visitDocSpec, { color: theme.primary }]}>{visit.doctorSpecialization}</Text>
                      <Text style={[styles.visitClinicName, { color: theme.textMuted }]} numberOfLines={1}>
                        📍 {visit.clinicName}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.visitReasonBox, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.visitReasonLabel, { color: theme.textMuted }]}>Reason: </Text>
                    <Text style={[styles.visitReasonText, { color: theme.textSecondary }]}>
                      {visit.reason || 'General Health Consultation'}
                    </Text>
                  </View>

                  <View style={styles.visitFooter}>
                    <View style={styles.statusPillsRow}>
                      <View style={[styles.statusMiniPill, { backgroundColor: theme.successLight }]}>
                        <CheckCircle size={11} color={theme.success} />
                        <Text style={[styles.statusMiniText, { color: theme.success }]}>Completed</Text>
                      </View>
                      {visit.prescriptionAvailable && (
                        <View style={[styles.statusMiniPill, { backgroundColor: theme.primaryLight }]}>
                          <Pill size={11} color={theme.primary} />
                          <Text style={[styles.statusMiniText, { color: theme.primary }]}>Rx Available</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.detailsBtn, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
                      onPress={() => {
                        const matchingRecord = healthRecords.find(
                          (r) => (r.appointmentId && r.appointmentId === visit.appointmentId) ||
                                 r.id === `rec-rx-${visit.appointmentId}` ||
                                 r.id === `rec-visit-${visit.appointmentId}` ||
                                 r.clinic === visit.clinicName
                        ) || {
                          id: visit.id,
                          type: 'report' as const,
                          title: `Consultation Summary — ${visit.doctorName}`,
                          clinic: visit.clinicName,
                          clinicId: visit.clinicId,
                          appointmentId: visit.appointmentId,
                          doctorId: visit.doctorId,
                          patientId: visit.patientId,
                          date: visit.date,
                          doctor: visit.doctorName,
                          status: 'Completed',
                          reason: visit.reason,
                          details: `Clinical notes and routine vitals recorded during ${visit.duration || '20 min'} consultation.`,
                          prescriptionAvailable: visit.prescriptionAvailable,
                        };
                        setSelectedRecordDetail(matchingRecord);
                      }}
                    >
                      <Text style={[styles.detailsBtnText, { color: theme.textPrimary }]}>View Details</Text>
                      <ChevronRight size={14} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      }

      case 'clinics': {
        return (
          <View style={styles.tabContentContainer}>
            {clinics.slice(0, 3).map((clinic) => (
              <TouchableOpacity
                key={clinic.id}
                style={[styles.entityCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('ClinicDetail', { clinicId: clinic.id })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: clinic.image }} style={styles.entityImage} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.entityName, { color: theme.textPrimary }]}>{clinic.name}</Text>
                  <Text style={[styles.entityCat, { color: theme.primary }]}>{clinic.category}</Text>
                  <Text style={[styles.entityAddr, { color: theme.textMuted }]} numberOfLines={1}>
                    📍 {clinic.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookAgainBtn, { backgroundColor: theme.cta }]}
                  onPress={() => navigation.navigate('Booking', { clinicId: clinic.id })}
                >
                  <Text style={styles.bookAgainBtnText}>Book Again</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      case 'doctors': {
        return (
          <View style={styles.tabContentContainer}>
            {doctors.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={[styles.entityCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: doc.avatar }} style={styles.entityAvatar} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.entityName, { color: theme.textPrimary }]}>{doc.name}</Text>
                  <Text style={[styles.entityCat, { color: theme.primary }]}>{doc.specialization}</Text>
                  <View style={styles.ratingRow}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={[styles.ratingVal, { color: theme.textPrimary }]}> {doc.rating}</Text>
                    <Text style={[styles.docExp, { color: theme.textMuted }]}> • {doc.experienceYears}y exp</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.bookAgainBtn, { backgroundColor: theme.cta }]}
                  onPress={() => navigation.navigate('Booking', { doctorId: doc.id, clinicId: doc.clinicId })}
                >
                  <Text style={styles.bookAgainBtnText}>Book Slot</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      case 'prescription': {
        const prescriptions = healthRecords.filter((r) => r.type === 'prescription');
        return renderRecordsList(prescriptions, 'prescriptions');
      }

      case 'lab': {
        const labs = healthRecords.filter((r) => r.type === 'lab');
        return renderRecordsList(labs, 'lab reports');
      }

      case 'report': {
        const reports = healthRecords.filter((r) => r.type === 'report');
        return renderRecordsList(reports, 'medical documents');
      }

      case 'appts': {
        return (
          <View style={styles.tabContentContainer}>
            {appointments.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={[styles.recordCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appt.id })}
                activeOpacity={0.88}
              >
                <View style={[styles.statusColorBar, { backgroundColor: appt.status === 'Completed' ? theme.success : theme.primary }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.recordTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {appt.doctorName} • {appt.doctorSpecialization}
                  </Text>
                  <Text style={[styles.recordSub, { color: theme.textMuted }]}>📍 {appt.clinicName}</Text>
                  <View style={styles.metaBadgeRow}>
                    <Text style={[styles.recordDateText, { color: theme.textSecondary }]}>
                      📅 {appt.date} • ⏰ {appt.time}
                    </Text>
                    <View style={[styles.statusMiniBadge, { backgroundColor: theme.backgroundSoft }]}>
                      <Text style={[styles.statusMiniBadgeText, { color: theme.primary }]}>{appt.status}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        );
      }
    }
  };

  const renderRecordsList = (list: HealthRecord[], label: string) => (
    <View style={styles.tabContentContainer}>
      {list.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <FileText size={32} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No {label} uploaded</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            You have not uploaded any {label} yet. Add a record or upload your reports.
          </Text>
          <TouchableOpacity
            style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsUploadModalVisible(true)}
          >
            <Text style={styles.emptyActionBtnText}>Upload First Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        list.map((rec) => (
          <TouchableOpacity
            key={rec.id}
            style={[styles.recordCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setSelectedRecordDetail(rec)}
            activeOpacity={0.88}
          >
            <View
              style={[
                styles.recIconBox,
                {
                  backgroundColor:
                    rec.type === 'lab' ? '#EDE9FE' : rec.type === 'prescription' ? theme.primaryLight : theme.successLight,
                },
              ]}
            >
              {rec.type === 'lab' ? (
                <TestTube size={18} color="#8B5CF6" />
              ) : rec.type === 'prescription' ? (
                <Pill size={18} color={theme.primary} />
              ) : (
                <FileText size={18} color={theme.success} />
              )}
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.recordTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {rec.title}
              </Text>
              <Text style={[styles.recordSub, { color: theme.textMuted }]}>
                {rec.doctor} • {rec.clinic}
              </Text>
              <View style={styles.metaBadgeRow}>
                <Text style={[styles.recordDateText, { color: theme.textSecondary }]}>📅 {rec.date}</Text>
                <View style={[styles.statusMiniBadge, { backgroundColor: theme.successLight }]}>
                  <Text style={[styles.statusMiniBadgeText, { color: theme.success }]}>{rec.status}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: theme.backgroundSoft }]}
              onPress={() => handleDownload(rec.title)}
            >
              <Download size={15} color={theme.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Health Records</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            Digital reports, prescriptions & visit history
          </Text>
        </View>

        <View style={styles.headerActions}>
          <ThemeToggle compact />

          <TouchableOpacity
            style={[styles.uploadHeaderBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsUploadModalVisible(true)}
            activeOpacity={0.85}
          >
            <Upload size={14} color="#FFFFFF" />
            <Text style={styles.uploadHeaderBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* TOP SUMMARY CARDS (Lab, Rx, Docs, Visits) */}
        <View style={styles.summaryGrid}>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setActiveTab('lab')}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#EDE9FE' }]}>
              <TestTube size={18} color="#8B5CF6" />
            </View>
            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{labCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Lab Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setActiveTab('prescription')}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: theme.primaryLight }]}>
              <Pill size={18} color={theme.primary} />
            </View>
            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{rxCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Prescriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setActiveTab('report')}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: theme.successLight }]}>
              <FileText size={18} color={theme.success} />
            </View>
            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{docCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setActiveTab('history')}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Calendar size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{visitCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Visits</Text>
          </TouchableOpacity>
        </View>

        {/* 7 HORIZONTAL FILTER TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.card,
                      borderColor: isSelected ? theme.primary : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* TAB CONTENT */}
        {renderContent()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* RECORD DETAIL MODAL */}
      {selectedRecordDetail && (
        <Modal transparent animationType="slide" visible={!!selectedRecordDetail}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.detailModalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.detailModalHeader, { borderBottomColor: theme.cardBorder }]}>
                <Text style={[styles.detailModalTitle, { color: theme.textPrimary }]}>Record Details</Text>
                <TouchableOpacity
                  onPress={() => setSelectedRecordDetail(null)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.backgroundSoft }]}
                >
                  <X size={18} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.detailModalContent}>
                <View style={[styles.detailBadgeRow, { backgroundColor: theme.primaryLight }]}>
                  <ShieldCheck size={16} color={theme.primary} />
                  <Text style={[styles.detailBadgeText, { color: theme.primary }]}>
                    Verified Healthcare Record
                  </Text>
                </View>

                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  {selectedRecordDetail.title}
                </Text>

                <View style={[styles.detailBox, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Healthcare Center</Text>
                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{selectedRecordDetail.clinic}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Attending Physician</Text>
                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{selectedRecordDetail.doctor}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Date</Text>
                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{selectedRecordDetail.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Status</Text>
                    <Text style={[styles.detailVal, { color: theme.success }]}>{selectedRecordDetail.status}</Text>
                  </View>
                  {selectedRecordDetail.reason && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Reason</Text>
                      <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{selectedRecordDetail.reason}</Text>
                    </View>
                  )}
                </View>

                {selectedRecordDetail.medicines && selectedRecordDetail.medicines.length > 0 && (
                  <View style={[styles.detailBox, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder, marginTop: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Pill size={16} color={theme.primary} />
                      <Text style={[styles.detailLabel, { color: theme.textPrimary, fontWeight: '700' }]}>
                        Prescribed Medicines ({selectedRecordDetail.medicines.length})
                      </Text>
                    </View>
                    {selectedRecordDetail.medicines.map((med, idx) => (
                      <View key={idx} style={{ paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: theme.cardBorder }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>{med.name}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                          Dosage: {med.dosage} • Frequency: {med.frequency} • Duration: {med.duration}
                        </Text>
                        {med.instructions ? (
                          <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginTop: 2 }}>
                            Instructions: {med.instructions}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {selectedRecordDetail.details && (
                  <View style={[styles.detailBox, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Clinical Summary</Text>
                    <Text style={[styles.detailDesc, { color: theme.textSecondary }]}>
                      {selectedRecordDetail.details}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.modalDownloadBtn, { backgroundColor: theme.cta }]}
                  onPress={() => {
                    handleDownload(selectedRecordDetail.title);
                    setSelectedRecordDetail(null);
                  }}
                >
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.modalDownloadBtnText}>Download Official PDF</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* UPLOAD RECORD MODAL */}
      <Modal transparent animationType="slide" visible={isUploadModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.uploadModalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.detailModalHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.detailModalTitle, { color: theme.textPrimary }]}>Upload Health Document</Text>
              <TouchableOpacity
                onPress={() => setIsUploadModalVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: theme.backgroundSoft }]}
              >
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailModalContent}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Document Category</Text>
              <View style={styles.typeSelectRow}>
                {(['lab', 'prescription', 'report'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      newType === t && [styles.typeChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                    ]}
                    onPress={() => setNewType(t)}
                  >
                    <Text style={[styles.typeChipText, newType === t && { color: '#FFFFFF', fontWeight: '700' }]}>
                      {t === 'lab' ? 'Lab Report' : t === 'prescription' ? 'Prescription' : 'Medical Doc'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Title / Test Name</Text>
              <TextInput
                style={[styles.formInput, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
                placeholder="e.g. Lipid Profile, Chest X-Ray"
                placeholderTextColor={theme.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Doctor or Diagnostic Center</Text>
              <TextInput
                style={[styles.formInput, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
                placeholder="e.g. MetroCare Clinic"
                placeholderTextColor={theme.textMuted}
                value={newClinic}
                onChangeText={setNewClinic}
              />

              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Notes / Reason (Optional)</Text>
              <TextInput
                style={[styles.formInput, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
                placeholder="e.g. Routine annual physical"
                placeholderTextColor={theme.textMuted}
                value={newReason}
                onChangeText={setNewReason}
              />

              <TouchableOpacity
                style={[styles.modalDownloadBtn, { backgroundColor: theme.cta }]}
                onPress={handleAddRecord}
              >
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.modalDownloadBtnText}>Save & Upload Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FLOATING MEDLINK AI ASSISTANT BUTTON */}
      <TouchableOpacity
        style={[styles.floatingAssistantBtn, { backgroundColor: theme.cta }]}
        onPress={() => setIsChatbotVisible(true)}
        activeOpacity={0.88}
      >
        <Bot size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MEDLINK ASSISTANT MODAL */}
      <MedLinkAssistantModal
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  headerSub: {
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOWS.subtle,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  summaryCard: {
    flex: 1,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 3,
    ...SHADOWS.subtle,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  tabsContainer: {
    marginHorizontal: -SPACING.lg,
  },
  tabsScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs + 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 12,
  },
  tabContentContainer: {
    gap: SPACING.md,
  },
  visitCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  visitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tokenTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tokenTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  visitDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  visitAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  visitDocName: {
    fontSize: 13,
    fontWeight: '700',
  },
  visitDocSpec: {
    fontSize: 11,
    fontWeight: '700',
  },
  visitClinicName: {
    fontSize: 10.5,
  },
  visitReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  visitReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  visitReasonText: {
    fontSize: 11,
    flex: 1,
  },
  visitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  entityImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
  },
  entityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  entityName: {
    fontSize: 13,
    fontWeight: '700',
  },
  entityCat: {
    fontSize: 11,
    fontWeight: '700',
  },
  entityAddr: {
    fontSize: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  docExp: {
    fontSize: 10.5,
  },
  bookAgainBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  bookAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  statusColorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  recIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordSub: {
    fontSize: 11,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  recordDateText: {
    fontSize: 10.5,
  },
  statusMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusMiniBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.labelLg,
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailModalSheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  uploadModalSheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  detailModalTitle: {
    ...TYPOGRAPHY.h3,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  detailBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs + 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  modalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  modalDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeChipActive: {},
  typeChipText: {
    fontSize: 11,
  },
  formInput: {
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 12,
  },
  floatingAssistantBtn: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.float,
    zIndex: 999,
  },
});
