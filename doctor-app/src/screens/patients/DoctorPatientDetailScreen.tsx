import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Droplet,
  Phone,
  FileText,
  Calendar,
  Pill,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorPatientStore } from '../../store/useDoctorPatientStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';
import { doctorApi } from '../../api/doctorApi';

interface DoctorPatientDetailScreenProps {
  route: any;
  navigation: any;
}

export const DoctorPatientDetailScreen: React.FC<DoctorPatientDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { patientId } = route.params;
  const { colors, isDark } = useThemeStore();
  const { doctor } = useDoctorAuthStore();
  const { selectedPatientDetail, fetchPatientDetail, isLoading } = useDoctorPatientStore();

  const [activeTab, setActiveTab] = useState<'REQUIREMENTS' | 'VISITS' | 'PRESCRIPTIONS' | 'REPORTS'>('REQUIREMENTS');
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleFetchAiSummary = async () => {
    if (!patientId) return;
    setLoadingAi(true);
    try {
      const res = await doctorApi.getAiPatientSummary(patientId);
      if (res?.summary) {
        setAiSummary(res.summary);
      }
    } catch (e) {
      console.warn('AI summary fetch notice:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetail(patientId);
    }
  }, [patientId]);

  if (isLoading || !selectedPatientDetail) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading patient health records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { patient, history } = selectedPatientDetail;
  const doctorTreatments = doctor?.procedures || [
    'Root Canal Treatment',
    'Root Canal Retreatment',
    'Pulp Therapy',
    'Dental Trauma Management',
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Patient Health Record</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* PATIENT DEMOGRAPHICS CARD */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri:
                  patient.avatar ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
              }}
              style={styles.avatar}
            />

            <View style={styles.patientInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.patientName, { color: colors.text }]}>{patient.name}</Text>
                {patient.blood_group && (
                  <View style={[styles.bloodBadge, { backgroundColor: PALETTE.errorLight }]}>
                    <Droplet size={11} color={PALETTE.error} />
                    <Text style={[styles.bloodText, { color: PALETTE.error }]}>{patient.blood_group}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {patient.gender || 'Female'} • {patient.age || 29} years • ID: {patient.id}
              </Text>

              <View style={styles.contactRow}>
                <Phone size={13} color={colors.secondaryText} />
                <Text style={[styles.contactText, { color: colors.secondaryText }]}>{patient.phone}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.hipaaBadge, { backgroundColor: colors.cardSubtle }]}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.hipaaText, { color: colors.secondaryText }]}>
              Authorized access logged for security compliance.
            </Text>
          </View>

          {/* AI PATIENT HISTORY SUMMARY */}
          <View style={[styles.aiSummaryBox, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
            <View style={styles.aiSummaryHeader}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={[styles.aiSummaryTitle, { color: colors.text }]}>Clinical History Overview (AI)</Text>
            </View>

            {!aiSummary ? (
              <TouchableOpacity
                style={[styles.aiSummaryBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
                onPress={handleFetchAiSummary}
                disabled={loadingAi}
                activeOpacity={0.8}
              >
                {loadingAi ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Sparkles size={13} color={colors.primary} />
                    <Text style={[styles.aiSummaryBtnText, { color: colors.primary }]}>Summarize Patient History</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.aiSummaryContent}>
                <Text style={[styles.aiSummaryLine, { color: colors.text }]}>
                  📊 <Text style={{ fontWeight: '700' }}>Visits:</Text> {aiSummary.totalVisits} total visits on record
                </Text>
                {aiSummary.recentDiagnoses?.length > 0 && (
                  <Text style={[styles.aiSummaryLine, { color: colors.text }]}>
                    🩺 <Text style={{ fontWeight: '700' }}>Recent Diagnoses:</Text> {aiSummary.recentDiagnoses.join(', ')}
                  </Text>
                )}
                {aiSummary.activeMedications?.length > 0 && (
                  <Text style={[styles.aiSummaryLine, { color: colors.text }]}>
                    💊 <Text style={{ fontWeight: '700' }}>Active Medications:</Text> {aiSummary.activeMedications.join(', ')}
                  </Text>
                )}
                <Text style={[styles.aiSummaryLine, { color: colors.secondaryText, fontStyle: 'italic', marginTop: 2 }]}>
                  {aiSummary.keyMedicalEvents}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('REQUIREMENTS')}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === 'REQUIREMENTS' ? colors.primary : 'transparent' },
            ]}
          >
            <Layers size={14} color={activeTab === 'REQUIREMENTS' ? colors.primary : colors.secondaryText} />
            <Text style={[styles.tabText, { color: activeTab === 'REQUIREMENTS' ? colors.primary : colors.secondaryText }]}>
              Treatment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('VISITS')}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === 'VISITS' ? colors.primary : 'transparent' },
            ]}
          >
            <Calendar size={14} color={activeTab === 'VISITS' ? colors.primary : colors.secondaryText} />
            <Text style={[styles.tabText, { color: activeTab === 'VISITS' ? colors.primary : colors.secondaryText }]}>
              Visits ({history?.appointments?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('PRESCRIPTIONS')}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === 'PRESCRIPTIONS' ? colors.primary : 'transparent' },
            ]}
          >
            <Pill size={14} color={activeTab === 'PRESCRIPTIONS' ? colors.primary : colors.secondaryText} />
            <Text style={[styles.tabText, { color: activeTab === 'PRESCRIPTIONS' ? colors.primary : colors.secondaryText }]}>
              Rx ({history?.prescriptions?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('REPORTS')}
            style={[
              styles.tabItem,
              { borderBottomColor: activeTab === 'REPORTS' ? colors.primary : 'transparent' },
            ]}
          >
            <FileText size={14} color={activeTab === 'REPORTS' ? colors.primary : colors.secondaryText} />
            <Text style={[styles.tabText, { color: activeTab === 'REPORTS' ? colors.primary : colors.secondaryText }]}>
              Reports ({history?.reports?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: TREATMENT-AWARE REQUIREMENT */}
        {activeTab === 'REQUIREMENTS' && (
          <View style={styles.tabContent}>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
              <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>PATIENT REQUIREMENT</Text>
              <Text style={[styles.reqTitle, { color: colors.text }]}>
                {patient.lastReason || 'Root Canal Treatment'}
              </Text>
              <View style={styles.specRow}>
                <Text style={[styles.specLabel, { color: colors.secondaryText }]}>Recommended Specialty: </Text>
                <Text style={[styles.specValue, { color: colors.primary }]}>
                  {doctor?.specialization || 'Endodontics'}
                </Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
              <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>MY COVERED TREATMENTS</Text>
              <View style={styles.treatmentsList}>
                {doctorTreatments.map((t, idx) => (
                  <View key={idx} style={[styles.treatmentChip, { backgroundColor: colors.cardSubtle }]}>
                    <Text style={[styles.treatmentText, { color: colors.text }]}>✓ {t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: VISITS CHRONOLOGICAL */}
        {activeTab === 'VISITS' && (
          <View style={styles.tabContent}>
            {history?.appointments?.map((apt) => (
              <View key={apt.id} style={[styles.visitCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
                <View style={styles.visitHeader}>
                  <Text style={[styles.visitDate, { color: colors.primary }]}>{apt.date}</Text>
                  <Text style={[styles.visitStatus, { color: colors.text }]}>{apt.status}</Text>
                </View>
                <Text style={[styles.visitReason, { color: colors.text }]}>{apt.reason}</Text>
                <Text style={[styles.visitMeta, { color: colors.secondaryText }]}>
                  {apt.clinic_name} • Dr. {apt.doctor_name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: PRESCRIPTIONS */}
        {activeTab === 'PRESCRIPTIONS' && (
          <View style={styles.tabContent}>
            {history?.prescriptions?.map((rx) => (
              <View key={rx.id} style={[styles.rxCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
                <Text style={[styles.rxDiagnosis, { color: colors.text }]}>{rx.diagnosis}</Text>
                <Text style={[styles.rxMeta, { color: colors.secondaryText }]}>
                  {rx.doctor_name} • {rx.date}
                </Text>
                <View style={styles.medicinesList}>
                  {rx.medicines?.map((m, idx) => (
                    <View key={idx} style={[styles.medBadge, { backgroundColor: colors.cardSubtle }]}>
                      <Text style={[styles.medName, { color: colors.text }]}>{m.name}</Text>
                      <Text style={[styles.medSpecs, { color: colors.secondaryText }]}>
                        {m.dosage} • {m.frequency} • {m.duration} ({m.instructions})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: LAB REPORTS */}
        {activeTab === 'REPORTS' && (
          <View style={styles.tabContent}>
            {history?.reports?.map((rep) => (
              <View key={rep.id} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
                <FileText size={22} color={colors.primary} />
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: colors.text }]}>{rep.file_name || rep.test_name}</Text>
                  <Text style={[styles.reportMeta, { color: colors.secondaryText }]}>
                    {rep.category} • {rep.test_date}
                  </Text>
                </View>
              </View>
            ))}
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  patientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  contactText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  hipaaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
  },
  hipaaText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.micro,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tabContent: {
    gap: 12,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  reqTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 4,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  specValue: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  treatmentsList: {
    gap: 6,
    marginTop: 6,
  },
  treatmentChip: {
    padding: 10,
    borderRadius: 10,
  },
  treatmentText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  visitCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  visitDate: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  visitStatus: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  visitReason: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  visitMeta: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  rxCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  rxDiagnosis: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  rxMeta: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
    marginBottom: 10,
  },
  medicinesList: {
    gap: 6,
  },
  medBadge: {
    padding: 10,
    borderRadius: 10,
  },
  medName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  medSpecs: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  reportMeta: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  aiSummaryBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSummaryTitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  aiSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiSummaryBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  aiSummaryContent: {
    gap: 4,
    paddingTop: 4,
  },
  aiSummaryLine: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 18,
  },
});
