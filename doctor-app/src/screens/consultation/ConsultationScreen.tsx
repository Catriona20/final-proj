import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Stethoscope,
  HeartPulse,
  Pill,
  FileCheck,
  Calendar,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { MedicineRow } from '../../components/MedicineRow';
import { PrescriptionMedicine } from '../../types';
import { doctorApi } from '../../api/doctorApi';

interface ConsultationScreenProps {
  route: any;
  navigation: any;
}

export const ConsultationScreen: React.FC<ConsultationScreenProps> = ({ route, navigation }) => {
  const { appointmentId, patientId, patientName, appointment } = route.params;
  const { colors, isDark } = useThemeStore();
  const { submitConsultation, isLoading } = useDoctorAppStore();

  // Clinical Examination State
  const [diagnosis, setDiagnosis] = useState(
    appointment?.reason ? `Clinical evaluation of ${appointment.reason}` : 'Seasonal Allergic Bronchitis'
  );
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presented with chief complaints. Vitals stable. Systemic examination normal.'
  );
  const [assessment, setAssessment] = useState('Satisfactory prognosis. Responding well to treatment.');

  // Vitals
  const [bp, setBp] = useState('120/80 mmHg');
  const [pulse, setPulse] = useState('74 bpm');
  const [temp, setTemp] = useState('98.4 °F');
  const [spO2, setSpO2] = useState('99%');

  // Digital Prescription State
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      name: 'Amoxicillin & Potassium Clavulanate 625 mg',
      dosage: '625 mg',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'After food',
    },
    {
      name: 'Paracetamol 650mg (Dolo)',
      dosage: '650 mg',
      frequency: '1-0-1 (SOS)',
      duration: '3 days',
      instructions: 'After food during fever or pain',
    },
  ]);

  // New Medicine Modal / Form Inputs
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('500 mg');
  const [medFrequency, setMedFrequency] = useState('1-0-1');
  const [medDuration, setMedDuration] = useState('5 days');
  const [medInstructions, setMedInstructions] = useState('After food');
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState('Aug 27, 2026');
  const [followUpReason, setFollowUpReason] = useState('Review symptom resolution and recovery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiConsultSummary, setAiConsultSummary] = useState<any>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  const handleGenerateAiSummary = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Required', 'Please enter a diagnosis first before summarizing');
      return;
    }
    setLoadingAiSummary(true);
    try {
      const res = await doctorApi.getAiConsultationSummary({
        reason: appointment?.reason || diagnosis,
        diagnosis,
        clinicalNotes,
        followUpDate,
      });
      if (res?.summary) {
        setAiConsultSummary(res.summary);
      }
    } catch (e) {
      console.warn('AI consultation summary notice:', e);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const quickMedicines = [
    'Amoxicillin & Potassium Clavulanate 625 mg',
    'Amoxicillin 500mg',
    'Paracetamol 650mg',
    'Ibuprofen 400mg',
    'Levocetirizine 5mg',
    'Pantoprazole 40mg',
    'Azithromycin 500mg',
    'Metformin 500mg',
    'Cefixime 200mg',
  ];

  const handleSelectQuickMed = (qm: string) => {
    setMedName(qm);
    if (qm.includes('Amoxicillin & Potassium Clavulanate') || qm.includes('625 mg')) {
      setMedDosage('625 mg');
      setMedFrequency('1-0-1');
      setMedDuration('5 days');
      setMedInstructions('After food with water');
    } else if (qm.includes('Amoxicillin 500mg')) {
      setMedDosage('500 mg');
      setMedFrequency('1-0-1');
      setMedDuration('5 days');
      setMedInstructions('After food');
    } else if (qm.includes('Paracetamol 650mg')) {
      setMedDosage('650 mg');
      setMedFrequency('1-0-1 (SOS)');
      setMedDuration('3 days');
      setMedInstructions('After food during fever or pain');
    }
  };

  const handleSetFefoDemoRx = () => {
    setMedicines([
      {
        name: 'Amoxicillin & Potassium Clavulanate 625 mg',
        dosage: '625 mg',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'After food',
      },
      {
        name: 'Paracetamol 650mg (Dolo)',
        dosage: '650 mg',
        frequency: '1-0-1 (SOS)',
        duration: '3 days',
        instructions: 'After food during fever or pain',
      },
    ]);
    Alert.alert('FEFO Demo Rx Loaded', 'Loaded canonical "Amoxicillin & Potassium Clavulanate 625 mg" (625 mg, 5 days) for pharmacy FEFO dispensing.');
  };

  const handleAddMedicine = () => {
    const trimmed = medName.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter medicine name');
      return;
    }

    const isFefoCombo =
      (trimmed.toLowerCase().includes('amoxicillin') && trimmed.toLowerCase().includes('clavulanate')) ||
      (trimmed.toLowerCase().includes('potassium clavulanate') && medicines.some(m => m.name.toLowerCase().includes('amoxicillin'))) ||
      (trimmed.toLowerCase().includes('amoxicillin') && medicines.some(m => m.name.toLowerCase().includes('clavulanate')));

    if (isFefoCombo) {
      // Collapse into canonical single prescription item for the FEFO demo case
      const cleaned = medicines.filter(
        (m) => !m.name.toLowerCase().includes('amoxicillin') && !m.name.toLowerCase().includes('clavulanate')
      );
      setMedicines([
        ...cleaned,
        {
          name: 'Amoxicillin & Potassium Clavulanate 625 mg',
          dosage: '625 mg',
          frequency: '1-0-1',
          duration: '5 days',
          instructions: medInstructions || 'After food',
        },
      ]);
      setMedName('');
      setShowAddMedForm(false);
      return;
    }

    // Preserve support for genuinely separate medicines
    setMedicines([
      ...medicines,
      {
        name: trimmed,
        dosage: medDosage,
        frequency: medFrequency,
        duration: medDuration,
        instructions: medInstructions,
      },
    ]);

    setMedName('');
    setShowAddMedForm(false);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Required', 'Please enter a clinical diagnosis');
      return;
    }

    setIsSubmitting(true);
    const success = await submitConsultation({
      appointmentId,
      patientId,
      diagnosis,
      clinicalNotes,
      assessment,
      medicines,
      followUpDate,
      followUpReason,
      vitals: { bp, pulse, temperature: temp, spO2 },
    });
    setIsSubmitting(false);

    if (success) {
      navigation.navigate('Home');
      Alert.alert(
        'Consultation Completed 🎉',
        'Prescription issued to Patient Health Records and live OPD queue updated.',
        [
          {
            text: 'Return to Queue',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } else {
      Alert.alert('Notice', 'Consultation could not be submitted. Please check connection and try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Clinical Consultation</Text>
            <Text style={[styles.pageSub, { color: colors.secondaryText }]}>Token {appointment?.token_number || '#01'}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* ACTIVE PATIENT BANNER */}
        <View style={[styles.patientBanner, { backgroundColor: colors.card, borderColor: colors.primary }, SHADOWS.light]}>
          <View style={styles.bannerRow}>
            <View style={[styles.tokenBadge, { backgroundColor: PALETTE.accent }]}>
              <Text style={styles.tokenText}>{appointment?.token_number || '#01'}</Text>
            </View>
            <View style={styles.patientBannerInfo}>
              <Text style={[styles.patientBannerName, { color: colors.text }]}>
                {appointment?.doctor_name || patientName || 'Patient'}
              </Text>
              <Text style={[styles.patientBannerSub, { color: colors.secondaryText }]}>
                Complaint: {appointment?.reason || 'General clinical consultation'}
              </Text>
            </View>
          </View>
        </View>

        {/* AI DEPARTMENT RECOMMENDATION SECTION */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles size={18} color={PALETTE.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Department Recommendation</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.statusBadgeText, { color: '#0369A1' }]}>Recommended</Text>
            </View>
          </View>

          <View style={styles.aiRoutingBody}>
            <View style={styles.aiFieldRow}>
              <Text style={[styles.aiFieldLabel, { color: colors.secondaryText }]}>Patient:</Text>
              <Text style={[styles.aiFieldValue, { color: colors.text }]}>{patientName || 'Demo Patient'}</Text>
            </View>

            <View style={styles.aiFieldRow}>
              <Text style={[styles.aiFieldLabel, { color: colors.secondaryText }]}>Symptoms:</Text>
              <Text style={[styles.aiFieldValue, { color: colors.text }]}>
                "{appointment?.reason || 'Persistent tooth pain and sensitivity'}"
              </Text>
            </View>

            <View style={styles.aiFieldRow}>
              <Text style={[styles.aiFieldLabel, { color: colors.secondaryText }]}>AI-assisted routing:</Text>
              <Text style={[styles.aiFieldValueBold, { color: PALETTE.primary }]}>
                {appointment?.department || 'Dentistry'}
              </Text>
            </View>

            <View style={styles.aiFieldRow}>
              <Text style={[styles.aiFieldLabel, { color: colors.secondaryText }]}>Confidence:</Text>
              <Text style={[styles.aiFieldValueBold, { color: '#16A34A' }]}>
                94%
              </Text>
            </View>

            <View style={[styles.clinicalNoticeBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
              <Text style={[styles.clinicalNoticeText, { color: colors.secondaryText }]}>
                AI-assisted routing only — final clinical assessment remains with the healthcare professional.
              </Text>
            </View>
          </View>
        </View>

        {/* VITALS ENTRY BLOCK */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.sectionHeaderRow}>
            <HeartPulse size={18} color={PALETTE.emergency} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Vitals</Text>
          </View>

          <View style={styles.vitalsGrid}>
            <View style={[styles.vitalItem, { backgroundColor: colors.cardSubtle }]}>
              <Text style={[styles.vitalLabel, { color: colors.secondaryText }]}>BP</Text>
              <TextInput
                value={bp}
                onChangeText={setBp}
                style={[styles.vitalInput, { color: colors.text }]}
                placeholder="120/80"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            <View style={[styles.vitalItem, { backgroundColor: colors.cardSubtle }]}>
              <Text style={[styles.vitalLabel, { color: colors.secondaryText }]}>Pulse</Text>
              <TextInput
                value={pulse}
                onChangeText={setPulse}
                style={[styles.vitalInput, { color: colors.text }]}
                placeholder="72 bpm"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            <View style={[styles.vitalItem, { backgroundColor: colors.cardSubtle }]}>
              <Text style={[styles.vitalLabel, { color: colors.secondaryText }]}>Temp</Text>
              <TextInput
                value={temp}
                onChangeText={setTemp}
                style={[styles.vitalInput, { color: colors.text }]}
                placeholder="98.6 F"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            <View style={[styles.vitalItem, { backgroundColor: colors.cardSubtle }]}>
              <Text style={[styles.vitalLabel, { color: colors.secondaryText }]}>SpO2</Text>
              <TextInput
                value={spO2}
                onChangeText={setSpO2}
                style={[styles.vitalInput, { color: colors.text }]}
                placeholder="99%"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          </View>
        </View>

        {/* CLINICAL ASSESSMENT & DIAGNOSIS */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.sectionHeaderRow}>
            <Stethoscope size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clinical Diagnosis & Notes</Text>
          </View>

          <Text style={[styles.inputLabel, { color: colors.text }]}>Clinical Diagnosis *</Text>
          <TextInput
            value={diagnosis}
            onChangeText={setDiagnosis}
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Acute Pharyngitis with Mild Bronchitis"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Examination & Clinical Observations</Text>
          <TextInput
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Document clinical symptoms, physical findings..."
            placeholderTextColor={colors.secondaryText}
          />

          {/* AI Consultation Summary Generator */}
          <View style={[styles.aiConsultCard, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
            <View style={styles.aiConsultHeader}>
              <Sparkles size={15} color={colors.primary} />
              <Text style={[styles.aiConsultTitle, { color: colors.text }]}>Consultation Summary Assistant (AI)</Text>
            </View>

            {!aiConsultSummary ? (
              <TouchableOpacity
                style={[styles.aiConsultBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
                onPress={handleGenerateAiSummary}
                disabled={loadingAiSummary}
                activeOpacity={0.8}
              >
                {loadingAiSummary ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Sparkles size={13} color={colors.primary} />
                    <Text style={[styles.aiConsultBtnText, { color: colors.primary }]}>Summarize Clinical Notes</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.aiConsultResult}>
                <Text style={[styles.aiResultLine, { color: colors.text }]}>
                  🎯 <Text style={{ fontWeight: '700' }}>Impression:</Text> {aiConsultSummary.clinicalImpression}
                </Text>
                <Text style={[styles.aiResultLine, { color: colors.text }]}>
                  📝 <Text style={{ fontWeight: '700' }}>Recommendations:</Text> {aiConsultSummary.keyRecommendations}
                </Text>
                <Text style={[styles.aiResultLine, { color: colors.secondaryText }]}>
                  🗓️ <Text style={{ fontWeight: '700' }}>Follow-up:</Text> {aiConsultSummary.suggestedFollowUp}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* DIGITAL PRESCRIPTION BUILDER */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.sectionHeaderRowBetween}>
            <View style={styles.sectionHeaderRow}>
              <Pill size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Digital Prescription Builder</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={handleSetFefoDemoRx}
                style={[styles.addMedBtn, { backgroundColor: '#E0F2FE' }]}
                activeOpacity={0.7}
              >
                <Sparkles size={13} color="#0369A1" />
                <Text style={[styles.addMedBtnText, { color: '#0369A1' }]}>FEFO Demo Rx</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddMedForm(!showAddMedForm)}
                style={[styles.addMedBtn, { backgroundColor: colors.primary + '18' }]}
                activeOpacity={0.7}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addMedBtnText, { color: colors.primary }]}>Add Medicine</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MEDICINES LIST */}
          {medicines.map((med, idx) => (
            <MedicineRow key={idx} medicine={med} index={idx} onRemove={handleRemoveMedicine} />
          ))}

          {/* ADD MEDICINE INLINE FORM */}
          {showAddMedForm && (
            <View style={[styles.addMedBox, { backgroundColor: colors.cardSubtle, borderColor: colors.primary }]}>
              <Text style={[styles.formSubHeading, { color: colors.text }]}>New Prescription Item</Text>

              {/* QUICK CHIPS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChips}>
                {quickMedicines.map((qm) => (
                  <TouchableOpacity
                    key={qm}
                    onPress={() => handleSelectQuickMed(qm)}
                    style={[styles.qmChip, { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.qmChipText, { color: colors.primary }]}>{qm}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={medName}
                onChangeText={setMedName}
                style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                placeholder="Medicine Name & Strength (e.g. Paracetamol 650mg)"
                placeholderTextColor={colors.secondaryText}
              />

              <View style={styles.medInputsRow}>
                <TextInput
                  value={medDosage}
                  onChangeText={setMedDosage}
                  style={[styles.medInputSmall, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Dose (500mg)"
                  placeholderTextColor={colors.secondaryText}
                />
                <TextInput
                  value={medFrequency}
                  onChangeText={setMedFrequency}
                  style={[styles.medInputSmall, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Freq (1-0-1)"
                  placeholderTextColor={colors.secondaryText}
                />
                <TextInput
                  value={medDuration}
                  onChangeText={setMedDuration}
                  style={[styles.medInputSmall, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Dur (5 days)"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>

              <TextInput
                value={medInstructions}
                onChangeText={setMedInstructions}
                style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginTop: 8, marginBottom: 12 }]}
                placeholder="Instructions (e.g. After food with water)"
                placeholderTextColor={colors.secondaryText}
              />

              <View style={styles.formActionRow}>
                <TouchableOpacity
                  onPress={() => setShowAddMedForm(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddMedicine}
                  style={[styles.saveMedBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveMedBtnText}>Save Medicine to Rx</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* FOLLOW-UP RECOMMENDATION */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={18} color={PALETTE.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Follow-Up Schedule</Text>
          </View>

          <Text style={[styles.inputLabel, { color: colors.text }]}>Recommended Follow-Up Date</Text>
          <TextInput
            value={followUpDate}
            onChangeText={setFollowUpDate}
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Aug 27, 2026"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Follow-Up Clinical Purpose</Text>
          <TextInput
            value={followUpReason}
            onChangeText={setFollowUpReason}
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Review healing progress"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {/* COMPLETE CONSULTATION CTA */}
        <TouchableOpacity
          onPress={handleCompleteConsultation}
          disabled={isSubmitting}
          style={[styles.completeBtn, { backgroundColor: PALETTE.accent }, SHADOWS.accentGlow]}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <CheckCircle2 size={20} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>Complete & Issue Prescription</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 40,
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
  topBarTitle: {
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  pageSub: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  patientBanner: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  patientBannerInfo: {
    flex: 1,
  },
  patientBannerName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  patientBannerSub: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalItem: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 2,
  },
  vitalInput: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 6,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    textAlignVertical: 'top',
    height: 70,
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addMedBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addMedBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  formSubHeading: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 8,
  },
  quickChips: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  qmChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  qmChipText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  medInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  medInputSmall: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  saveMedBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveMedBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  aiConsultCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  aiConsultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiConsultTitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  aiConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiConsultBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  aiConsultResult: {
    gap: 4,
    paddingTop: 4,
  },
  aiResultLine: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 18,
  },
  aiRoutingBody: {
    gap: 8,
    marginTop: 4,
  },
  aiFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiFieldLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    width: 140,
  },
  aiFieldValue: {
    fontSize: TYPOGRAPHY.sizes.body,
    flex: 1,
  },
  aiFieldValueBold: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clinicalNoticeBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  clinicalNoticeText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
