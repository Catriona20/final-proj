import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, LogOut, FileText } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';

interface VerificationPendingScreenProps {
  navigation: any;
}

export const VerificationPendingScreen: React.FC<VerificationPendingScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const { doctor, riskEvaluation, fetchProfile, logout, isLoading } = useDoctorAuthStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);

    if (doctor?.is_verified || doctor?.verification_status === 'VERIFIED') {
      navigation.replace('SelectClinic');
    }
  };

  const currentStatus = doctor?.verification_status || 'UNDER_REVIEW';

  const stages = [
    { key: 'REGISTERED', label: 'Registration Submitted', done: true },
    { key: 'DOCS_UPLOADED', label: 'Credential Documents Uploaded', done: true },
    { key: 'RISK_ENGINE', label: 'Rule-Based Credential Screening', done: true },
    { key: 'COUNCIL_CHECK', label: 'State Medical Council Authentication', done: false },
    { key: 'APPROVAL', label: 'Clinical Workspace Activation', done: false },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER ICON */}
        <View style={styles.headerBlock}>
          <View style={[styles.iconCircle, { backgroundColor: PALETTE.warningLight }]}>
            <Clock size={36} color={PALETTE.warning} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verification in Progress</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Your professional medical credentials and State Council registration are currently under review.
          </Text>
        </View>

        {/* STATUS CARD */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.doctorName, { color: colors.text }]}>{doctor?.name || 'Practitioner'}</Text>
              <Text style={[styles.doctorReg, { color: colors.secondaryText }]}>
                Reg #: {doctor?.registration_number || 'Under Verification'}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: PALETTE.warningLight }]}>
              <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>{currentStatus}</Text>
            </View>
          </View>

          {/* VERIFICATION STAGES */}
          <Text style={[styles.sectionHeading, { color: colors.secondaryText }]}>VERIFICATION WORKFLOW PROGRESS</Text>
          <View style={styles.stepperBox}>
            {stages.map((stage, idx) => (
              <View key={stage.key} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: stage.done ? PALETTE.success : colors.cardSubtle }]}>
                  {stage.done ? <CheckCircle2 size={12} color="#FFFFFF" /> : <Clock size={12} color={colors.secondaryText} />}
                </View>
                <Text style={[styles.stepLabel, { color: stage.done ? colors.text : colors.secondaryText }]}>
                  {stage.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* RISK ENGINE ASSESSMENT INFO */}
        {riskEvaluation && (
          <View style={[styles.riskCard, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
            <View style={styles.riskHeader}>
              <ShieldCheck size={18} color={colors.primary} />
              <Text style={[styles.riskTitle, { color: colors.text }]}>
                Credential Risk Screening: {riskEvaluation.riskLevel} (Score: {riskEvaluation.riskScore})
              </Text>
            </View>
            <Text style={[styles.riskDesc, { color: colors.secondaryText }]}>
              {riskEvaluation.triggeredRules.length === 0
                ? 'Standard credentials validated. Awaiting council confirmation.'
                : `Triggered flags: ${riskEvaluation.triggeredRules.join(', ')}`}
            </Text>
          </View>
        )}

        {/* SECURITY ENFORCEMENT NOTICE */}
        <View style={[styles.noticeBox, { backgroundColor: colors.primary + '10' }]}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            MedLink anti-fake-doctor policy requires official state verification before clinical OPD queues, prescriptions, and patient records can be accessed.
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        <TouchableOpacity
          onPress={handleRefreshStatus}
          disabled={refreshing}
          style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Check Verification Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <LogOut size={16} color={PALETTE.error} />
          <Text style={[styles.logoutBtnText, { color: PALETTE.error }]}>Sign Out</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading + 2,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle + 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  doctorReg: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stepperBox: {
    gap: 10,
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
  stepLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  riskCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  riskTitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  riskDesc: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginBottom: 12,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  logoutBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
