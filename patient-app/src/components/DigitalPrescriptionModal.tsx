import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, FileText, Download, ShieldCheck, Pill, Calendar, Building2, Sparkles, Info } from 'lucide-react-native';
import { DigitalPrescription } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { healthRecordsService } from '../services/healthRecordsService';

interface DigitalPrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  prescription: DigitalPrescription | null;
}

export const DigitalPrescriptionModal: React.FC<DigitalPrescriptionModalProps> = ({
  visible,
  onClose,
  prescription,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!prescription) return null;

  const handleDownload = () => {
    Alert.alert(
      'Download Prescription',
      `Prescription PDF from ${prescription.doctorName} has been saved to your downloads folder.`
    );
  };

  const handleExplainWithAi = async () => {
    setLoadingAi(true);
    const explanation = await healthRecordsService.explainPrescription(prescription.appointmentId, prescription);
    setAiExplanation(explanation);
    setLoadingAi(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: isDark ? '#1A3560' : '#E2E8F0',
            },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.headerTitleRow}>
              <FileText size={18} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Digital Prescription
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Doctor & Clinic Header Card */}
            <View style={[styles.docSection, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
              <View style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docName, { color: theme.textPrimary }]}>
                    {prescription.doctorName}
                  </Text>
                  <Text style={[styles.docSpec, { color: theme.primary }]}>
                    {prescription.doctorSpecialization}
                  </Text>
                  {prescription.doctorRegistrationNumber && (
                    <View style={styles.regBadge}>
                      <ShieldCheck size={11} color={theme.success} />
                      <Text style={[styles.regText, { color: theme.textSecondary }]}>
                        Reg: {prescription.doctorRegistrationNumber}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.rxSymbolBox, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.rxSymbolText, { color: theme.primary }]}>℞</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

              <View style={styles.clinicRow}>
                <Building2 size={12} color={theme.textMuted} />
                <Text style={[styles.clinicText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {prescription.clinicName} · {prescription.clinicAddress}
                </Text>
              </View>
              <View style={styles.clinicRow}>
                <Calendar size={12} color={theme.textMuted} />
                <Text style={[styles.clinicText, { color: theme.textSecondary }]}>
                  Date Issued: {prescription.date}
                </Text>
              </View>
            </View>

            {/* Diagnosis / Clinical Notes */}
            {prescription.diagnosis && (
              <View style={[styles.diagnosisBox, { backgroundColor: isDark ? '#06152F' : '#F1F5F9', borderColor: theme.cardBorder }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DIAGNOSIS</Text>
                <Text style={[styles.diagnosisText, { color: theme.textPrimary }]}>
                  {prescription.diagnosis}
                </Text>
                {prescription.clinicalNotes && (
                  <Text style={[styles.clinicalNotes, { color: theme.textSecondary }]}>
                    Notes: {prescription.clinicalNotes}
                  </Text>
                )}
              </View>
            )}

            {/* Prescribed Medications Table */}
            <View style={styles.medsContainer}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PRESCRIBED MEDICINES</Text>

              {prescription.medicines.map((med, index) => (
                <View
                  key={index}
                  style={[
                    styles.medCard,
                    {
                      backgroundColor: isDark ? '#06152F' : '#FFFFFF',
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.medHeadRow}>
                    <View style={styles.medIconPill}>
                      <Pill size={13} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.medName, { color: theme.textPrimary }]}>{med.name}</Text>
                      <Text style={[styles.medDosage, { color: theme.primary }]}>{med.dosage}</Text>
                    </View>
                    <View style={[styles.durationBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.durationText, { color: theme.primary }]}>{med.duration}</Text>
                    </View>
                  </View>

                  <View style={[styles.medDetailsRow, { backgroundColor: theme.backgroundSoft }]}>
                    <Text style={[styles.medDetailItem, { color: theme.textSecondary }]}>
                      ⏰ {med.frequency}
                    </Text>
                    <Text style={[styles.medDetailItem, { color: theme.textSecondary }]}>
                      ℹ️ {med.instructions}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Follow-up Note */}
            {prescription.followUpDate && (
              <View style={[styles.followUpBox, { backgroundColor: theme.primaryLight }]}>
                <Calendar size={14} color={theme.primary} />
                <Text style={[styles.followUpText, { color: theme.primary }]}>
                  Recommended Follow-up: {prescription.followUpDate}
                </Text>
              </View>
            )}

            {/* AI Prescription Guidance Section */}
            <View style={[styles.aiGuidanceCard, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
              <View style={styles.aiHeaderRow}>
                <Sparkles size={16} color={theme.primary} />
                <Text style={[styles.aiTitle, { color: theme.textPrimary }]}>AI Prescription Guidance</Text>
              </View>
              <Text style={[styles.aiSubtitle, { color: theme.textSecondary }]}>
                Get a clear breakdown of why each medicine was prescribed and dosage guidance.
              </Text>

              {!aiExplanation && (
                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: theme.primaryLight }]}
                  onPress={handleExplainWithAi}
                  disabled={loadingAi}
                  activeOpacity={0.8}
                >
                  {loadingAi ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Sparkles size={14} color={theme.primary} />
                      <Text style={[styles.aiButtonText, { color: theme.primary }]}>Explain My Medicines (AI)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {aiExplanation && (
                <View style={styles.aiResultsBox}>
                  <Text style={[styles.aiSummaryText, { color: theme.textPrimary }]}>{aiExplanation.summary}</Text>
                  
                  {aiExplanation.medicationGuidance?.map((guidance: any, idx: number) => (
                    <View key={idx} style={[styles.guidanceItem, { borderColor: theme.cardBorder }]}>
                      <Text style={[styles.guidanceMedName, { color: theme.primary }]}>💊 {guidance.name}</Text>
                      <Text style={[styles.guidanceDetails, { color: theme.textSecondary }]}>• Purpose: {guidance.purpose}</Text>
                      <Text style={[styles.guidanceDetails, { color: theme.textSecondary }]}>• Instructions: {guidance.instructions}</Text>
                      {guidance.precautions && (
                        <Text style={[styles.guidanceDetails, { color: theme.textSecondary }]}>• Precautions: {guidance.precautions}</Text>
                      )}
                    </View>
                  ))}

                  {aiExplanation.generalAdvice && (
                    <Text style={[styles.aiAdviceText, { color: theme.textSecondary }]}>
                      💡 General Advice: {aiExplanation.generalAdvice}
                    </Text>
                  )}

                  <View style={styles.disclaimerRow}>
                    <Info size={12} color={theme.textMuted} />
                    <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>
                      Disclaimer: AI explanation is informational and does not replace your doctor's clinical instructions.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Bottom Bar */}
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: theme.cta }]}
              onPress={handleDownload}
              activeOpacity={0.85}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Download PDF Prescription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 12,
  },
  docSection: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '600',
  },
  regBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  regText: {
    fontSize: 10,
    fontWeight: '500',
  },
  rxSymbolBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxSymbolText: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clinicText: {
    fontSize: 11,
  },
  diagnosisBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clinicalNotes: {
    fontSize: 11,
    lineHeight: 16,
  },
  medsContainer: {
    gap: 8,
  },
  medCard: {
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  medHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medIconPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(13, 71, 201, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
  },
  medDosage: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  medDetailsRow: {
    padding: 6,
    borderRadius: RADIUS.xs,
    gap: 2,
  },
  medDetailItem: {
    fontSize: 10.5,
  },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  followUpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aiGuidanceCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiResultsBox: {
    marginTop: 6,
    gap: 8,
  },
  aiSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  guidanceItem: {
    borderLeftWidth: 2.5,
    paddingLeft: 8,
    paddingVertical: 4,
    gap: 2,
  },
  guidanceMedName: {
    fontSize: 12,
    fontWeight: '700',
  },
  guidanceDetails: {
    fontSize: 11,
    lineHeight: 16,
  },
  aiAdviceText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
});
