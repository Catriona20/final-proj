import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ShieldCheck, Award, FileText, CheckCircle2, Clock, UploadCloud, AlertCircle } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';
import { doctorApi } from '../../api/doctorApi';
import { VerificationAuditItem } from '../../types';

interface VerificationProfileScreenProps {
  navigation: any;
}

export const VerificationProfileScreen: React.FC<VerificationProfileScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { doctor } = useDoctorAuthStore();

  const [auditTrail, setAuditTrail] = useState<VerificationAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  const fetchAuditTrail = async () => {
    try {
      setIsLoading(true);
      const res = await doctorApi.getVerificationAuditTrail();
      setAuditTrail(res.auditTrail || []);
    } catch (e) {
      console.warn('Failed to load audit trail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const stages = [
    { key: 'PENDING', label: 'Registration Submitted', done: true },
    { key: 'DOCUMENTS_SUBMITTED', label: 'Documents Uploaded', done: true },
    { key: 'UNDER_REVIEW', label: 'Credential Review', done: true },
    { key: 'COUNCIL_VERIFIED', label: 'Council Verification', done: doctor?.is_verified ?? true },
    { key: 'ACCOUNT_APPROVED', label: 'Account Approval', done: doctor?.is_verified ?? true },
  ];

  const currentStatus = doctor?.verification_status || 'VERIFIED';
  const isVerified = currentStatus === 'VERIFIED' || currentStatus === 'ACTIVE';

  const documents = doctor?.verificationDocuments || [
    {
      id: 'vdoc-1',
      document_type: 'medical_reg_cert',
      document_name: 'STATE_MEDICAL_COUNCIL_LICENSE.pdf',
      status: 'VERIFIED',
      uploaded_at: '2025-01-10',
    },
    {
      id: 'vdoc-2',
      document_type: 'degree_cert',
      document_name: 'BDS_MDS_DEGREE_DIPLOMA.pdf',
      status: 'VERIFIED',
      uploaded_at: '2025-01-10',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleColumn}>
            <Text style={[styles.title, { color: colors.text }]}>Practitioner Verification</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Anti-fake-doctor verification & council audit records
            </Text>
          </View>
        </View>

        {/* STATUS CARD */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.badgeRow}>
            <View style={[styles.iconCircle, { backgroundColor: isVerified ? PALETTE.successLight : PALETTE.warningLight }]}>
              {isVerified ? <ShieldCheck size={28} color={PALETTE.success} /> : <Clock size={28} color={PALETTE.warning} />}
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusHeading, { color: isVerified ? PALETTE.success : '#B45309' }]}>
                {isVerified ? 'VERIFIED DOCTOR' : currentStatus}
              </Text>
              <Text style={[styles.statusSub, { color: colors.secondaryText }]}>
                Registration #: {doctor?.registration_number || 'Under Council Review'}
              </Text>
            </View>
          </View>

          {/* PROGRESS WORKFLOW STEPPER */}
          <Text style={[styles.stepperHeading, { color: colors.secondaryText }]}>VERIFICATION WORKFLOW STATUS</Text>
          <View style={styles.stepperContainer}>
            {stages.map((stage, idx) => (
              <View key={stage.key} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: stage.done ? PALETTE.success : colors.cardSubtle }]}>
                  {stage.done ? <CheckCircle2 size={12} color="#FFFFFF" /> : <Clock size={12} color={colors.secondaryText} />}
                </View>
                <Text style={[styles.stepText, { color: stage.done ? colors.text : colors.secondaryText }]}>
                  {stage.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* VERIFICATION AUDIT TRAIL */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>VERIFICATION AUDIT TRAIL</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            auditTrail.map((item) => (
              <View key={item.id} style={[styles.auditItem, { backgroundColor: colors.cardSubtle }]}>
                <View style={styles.auditHeader}>
                  <Text style={[styles.auditDate, { color: colors.primary }]}>{item.date}</Text>
                  <Text style={[styles.auditTransition, { color: PALETTE.success }]}>{item.statusTransition}</Text>
                </View>
                <Text style={[styles.auditReviewer, { color: colors.text }]}>Reviewer: {item.reviewer}</Text>
                <Text style={[styles.auditDetails, { color: colors.secondaryText }]}>{item.details}</Text>
              </View>
            ))
          )}
        </View>

        {/* SUBMITTED LICENSES */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.docHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Submitted Licenses & Proofs</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DocumentUpload')}
              style={[styles.uploadDocBtn, { backgroundColor: colors.primary + '18' }]}
            >
              <UploadCloud size={14} color={colors.primary} />
              <Text style={[styles.uploadDocBtnText, { color: colors.primary }]}>Upload New</Text>
            </TouchableOpacity>
          </View>

          {documents.map((doc, idx) => (
            <View key={idx} style={[styles.docItem, { backgroundColor: colors.cardSubtle }]}>
              <FileText size={20} color={colors.primary} />
              <View style={styles.docInfo}>
                <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                  {doc.document_name}
                </Text>
                <Text style={[styles.docMeta, { color: colors.secondaryText }]}>Type: {doc.document_type}</Text>
              </View>
              <View style={[styles.docStatusBadge, { backgroundColor: PALETTE.successLight }]}>
                <Text style={[styles.docStatusText, { color: PALETTE.success }]}>Verified ✓</Text>
              </View>
            </View>
          ))}
        </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  statusCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusHeading: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  statusSub: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  stepperHeading: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepperContainer: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 12,
  },
  auditItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditDate: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  auditTransition: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  auditReviewer: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  auditDetails: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  uploadDocBtnText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.sizes.micro,
    marginTop: 2,
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docStatusText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
