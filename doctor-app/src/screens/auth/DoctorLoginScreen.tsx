import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stethoscope, Lock, Mail, Phone, KeyRound, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';

interface DoctorLoginScreenProps {
  navigation: any;
}

export const DoctorLoginScreen: React.FC<DoctorLoginScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const { login, sendOtp, verifyOtp, isLoading, error, clearError } = useDoctorAuthStore();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP Flow States
  const [otpState, setOtpState] = useState<'IDLE' | 'SENT' | 'VERIFIED'>('IDLE');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!emailOrPhone.trim()) {
      setLocalMsg('Please enter your registered email or phone number.');
      return;
    }
    clearError();
    setLocalMsg(null);
    try {
      const isPhone = !emailOrPhone.includes('@');
      const res = await sendOtp(emailOrPhone.trim(), isPhone);
      setOtpState('SENT');
      setCooldown(60);
      setLocalMsg(res.message || 'OTP verification code sent.');
    } catch (e: any) {
      setLocalMsg(e.message || 'Failed to send OTP.');
    }
  };

  const handleLoginSubmit = async () => {
    clearError();
    setLocalMsg(null);

    if (!emailOrPhone.trim()) {
      setLocalMsg('Please enter your email or phone number.');
      return;
    }

    if (authMode === 'PASSWORD') {
      if (!password) {
        setLocalMsg('Please enter your account password.');
        return;
      }
      const success = await login({ emailOrPhone: emailOrPhone.trim(), password });
      if (!success) return;
    } else {
      if (!otpCode || otpCode.length < 6) {
        setLocalMsg('Please enter the 6-digit OTP code.');
        return;
      }
      const isPhone = !emailOrPhone.includes('@');
      const isVerified = await verifyOtp(emailOrPhone.trim(), otpCode.trim(), isPhone);
      if (!isVerified) return;

      const success = await login({ emailOrPhone: emailOrPhone.trim(), otp: otpCode.trim(), password: 'password123' });
      if (!success) return;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack ? (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('WelcomeAuth')) : navigation.navigate('WelcomeAuth'))}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} />
            <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          {/* HEADER */}
          <View style={styles.headerBlock}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Stethoscope size={30} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Existing Doctor Sign In</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Sign in to access your authorized clinic schedule and live OPD queue.
            </Text>
          </View>

          {/* AUTH MODE TOGGLE: PASSWORD vs OTP */}
          <View style={[styles.modeToggleBox, { backgroundColor: colors.cardSubtle }]}>
            <TouchableOpacity
              onPress={() => {
                setAuthMode('PASSWORD');
                setOtpState('IDLE');
                setLocalMsg(null);
              }}
              style={[
                styles.modeBtn,
                authMode === 'PASSWORD' && [styles.modeBtnActive, { backgroundColor: colors.card }],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: authMode === 'PASSWORD' ? colors.primary : colors.secondaryText },
                ]}
              >
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAuthMode('OTP');
                setLocalMsg(null);
              }}
              style={[
                styles.modeBtn,
                authMode === 'OTP' && [styles.modeBtnActive, { backgroundColor: colors.card }],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: authMode === 'OTP' ? colors.primary : colors.secondaryText },
                ]}
              >
                OTP Verification
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM CONTAINER */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
            {/* IDENTIFIER INPUT */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address or Mobile Number</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Mail size={18} color={colors.secondaryText} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. dr.rajesh@medlink.health or +91 9876543210"
                  placeholderTextColor={colors.secondaryText}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* PASSWORD INPUT (IF PASSWORD MODE) */}
            {authMode === 'PASSWORD' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Doctor Account Password</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.secondaryText} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your confidential password"
                    placeholderTextColor={colors.secondaryText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            {/* OTP CODE INPUT (IF OTP MODE) */}
            {authMode === 'OTP' && (
              <View style={styles.inputGroup}>
                <View style={styles.otpHeaderRow}>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>6-Digit OTP Code</Text>
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={cooldown > 0 || isLoading}
                    style={styles.sendOtpBtn}
                  >
                    <Text
                      style={[
                        styles.sendOtpBtnText,
                        { color: cooldown > 0 ? colors.secondaryText : colors.primary },
                      ]}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : otpState === 'SENT' ? 'Resend OTP' : 'Send OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <KeyRound size={18} color={colors.secondaryText} />
                  <TextInput
                    style={[styles.input, { color: colors.text, letterSpacing: 3, fontWeight: '700' }]}
                    placeholder="• • • • • •"
                    placeholderTextColor={colors.secondaryText}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            )}

            {/* ERROR OR STATUS MESSAGES */}
            {(error || localMsg) && (
              <View style={[styles.feedbackBox, { backgroundColor: error ? PALETTE.errorLight : PALETTE.infoLight }]}>
                <Text style={[styles.feedbackText, { color: error ? PALETTE.error : PALETTE.info }]}>
                  {error || localMsg}
                </Text>
              </View>
            )}

            {/* SUBMIT BUTTON (WARM ORANGE ACCENT) */}
            <TouchableOpacity
              onPress={handleLoginSubmit}
              disabled={isLoading}
              style={[styles.submitBtn, { backgroundColor: PALETTE.accent }, SHADOWS.accentGlow]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In to Workspace</Text>
              )}
            </TouchableOpacity>

            {/* DEMO DOCTOR ACCOUNTS QUICK-FILL */}
            <DemoDoctorDrawer
              onSelect={(demoEmail, demoPass, demoOtp) => {
                setEmailOrPhone(demoEmail);
                setPassword(demoPass);
                setOtpCode(demoOtp);
                setLocalMsg(null);
              }}
            />
          </View>

          {/* NEW DOCTOR LINK */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.secondaryText }]}>New practitioner?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorRegister')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Register & Verify License</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface DemoDoctorItem {
  name: string;
  email: string;
  pass: string;
  otp: string;
  role: 'DOCTOR' | 'PATIENT' | 'ASSISTANT';
  detail: string;
}

const DEMO_DOCTOR_LIST: DemoDoctorItem[] = [
  { name: 'Dr. Arun Kumar', email: 'doctor01@demo.medlink.test', pass: 'Doctor@2001', otp: '200001', role: 'DOCTOR', detail: 'Dentist • Moon Dental Clinic' },
  { name: 'Dr. Priya Sharma', email: 'doctor02@demo.medlink.test', pass: 'Doctor@2002', otp: '200002', role: 'DOCTOR', detail: 'Gen Med • MedLink Multispeciality' },
  { name: 'Dr. Vikram Rao', email: 'doctor03@demo.medlink.test', pass: 'Doctor@2003', otp: '200003', role: 'DOCTOR', detail: 'Cardiology • MedLink Heart Care' },
  { name: 'Dr. Neha Menon', email: 'doctor04@demo.medlink.test', pass: 'Doctor@2004', otp: '200004', role: 'DOCTOR', detail: 'Pediatrics • Rainbow Children' },
  { name: 'Dr. Rahul Iyer', email: 'doctor05@demo.medlink.test', pass: 'Doctor@2005', otp: '200005', role: 'DOCTOR', detail: 'Dermatology • MedLink Skin Care' },
  { name: 'Dr. Kavya Nair', email: 'doctor06@demo.medlink.test', pass: 'Doctor@2006', otp: '200006', role: 'DOCTOR', detail: 'ENT Care • MedLink ENT Care' },
  { name: 'Aarav Sharma', email: 'patient01@demo.medlink.test', pass: 'Demo@1001', otp: '100001', role: 'PATIENT', detail: 'Dentistry • Moon Dental' },
  { name: 'Sneha Patel', email: 'patient02@demo.medlink.test', pass: 'Demo@1002', otp: '100002', role: 'PATIENT', detail: 'Dentistry • Cleaning' },
  { name: 'Rajesh Kumar', email: 'patient03@demo.medlink.test', pass: 'Demo@1003', otp: '100003', role: 'PATIENT', detail: 'Gen Med • Apollo Family' },
  { name: 'Priya Raman', email: 'patient04@demo.medlink.test', pass: 'Demo@1004', otp: '100004', role: 'PATIENT', detail: 'Pediatrics • Child Care' },
  { name: 'Vikram Malhotra', email: 'patient05@demo.medlink.test', pass: 'Demo@1005', otp: '100005', role: 'PATIENT', detail: 'Dermatology • Skin Care' },
  { name: 'Ananya Iyer', email: 'patient06@demo.medlink.test', pass: 'Demo@1006', otp: '100006', role: 'PATIENT', detail: 'ENT Care • Hearing' },
  { name: 'Rahul Verma', email: 'patient07@demo.medlink.test', pass: 'Demo@1007', otp: '100007', role: 'PATIENT', detail: 'Orthopedics • Mobility' },
  { name: 'Pooja Nair', email: 'patient08@demo.medlink.test', pass: 'Demo@1008', otp: '100008', role: 'PATIENT', detail: 'Gynecology • GreenLife' },
  { name: 'Sheryl Thomas', email: 'assistant01@demo.medlink.test', pass: 'Clinic@3001', otp: '300001', role: 'ASSISTANT', detail: 'Admin • Moon Dental Clinic' },
  { name: 'Rahul Joseph', email: 'assistant02@demo.medlink.test', pass: 'Clinic@3002', otp: '300002', role: 'ASSISTANT', detail: 'Admin • Apollo Family Care' },
  { name: 'Nisha Kumar', email: 'assistant03@demo.medlink.test', pass: 'Clinic@3003', otp: '300003', role: 'ASSISTANT', detail: "Admin • GreenLife Women's" },
  { name: 'Ravi Shankar', email: 'assistant04@demo.medlink.test', pass: 'Clinic@3004', otp: '300004', role: 'ASSISTANT', detail: 'Admin • Chennai Heart & Vascular' },
  { name: 'Deepak Raj', email: 'assistant05@demo.medlink.test', pass: 'Clinic@3005', otp: '300005', role: 'ASSISTANT', detail: 'Admin • VisionPlus Eye' },
  { name: 'Lavanya S', email: 'assistant06@demo.medlink.test', pass: 'Clinic@3006', otp: '300006', role: 'ASSISTANT', detail: 'Admin • OrthoCare Chennai' },
];

const DemoDoctorDrawer: React.FC<{
  onSelect: (email: string, pass: string, otp: string) => void;
}> = ({ onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [filterRole, setFilterRole] = useState<'DOCTOR' | 'PATIENT' | 'ASSISTANT'>('DOCTOR');

  const filtered = DEMO_DOCTOR_LIST.filter((d) => d.role === filterRole);

  return (
    <View style={demoDocStyles.container}>
      <TouchableOpacity
        style={demoDocStyles.toggleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={demoDocStyles.toggleTitle}>⚡ Demo Accounts Quick-Fill</Text>
        <Text style={demoDocStyles.toggleHint}>{expanded ? 'Hide ▲' : 'Show Accounts ▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={demoDocStyles.body}>
          <View style={demoDocStyles.roleTabs}>
            {(['DOCTOR', 'PATIENT', 'ASSISTANT'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[demoDocStyles.roleTab, filterRole === r && demoDocStyles.roleTabActive]}
                onPress={() => setFilterRole(r)}
              >
                <Text style={[demoDocStyles.roleTabText, filterRole === r && demoDocStyles.roleTabTextActive]}>
                  {r === 'DOCTOR' ? 'Doctors (6)' : r === 'PATIENT' ? 'Patients (8)' : 'Assistants (6)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={demoDocStyles.list} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.email}
                style={demoDocStyles.card}
                onPress={() => onSelect(item.email, item.pass, item.otp)}
                activeOpacity={0.7}
              >
                <View style={demoDocStyles.cardLeft}>
                  <Text style={demoDocStyles.name}>{item.name}</Text>
                  <Text style={demoDocStyles.detail}>{item.detail}</Text>
                  <Text style={demoDocStyles.email}>{item.email}</Text>
                </View>
                <View style={demoDocStyles.cardRight}>
                  <Text style={demoDocStyles.otp}>OTP: {item.otp}</Text>
                  <Text style={demoDocStyles.fill}>Auto-Fill</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const demoDocStyles = StyleSheet.create({
  container: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  toggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  toggleHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  body: {
    padding: 10,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleTabActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  roleTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 6,
    maxHeight: 280,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLeft: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  detail: {
    fontSize: 10,
    color: '#64748B',
  },
  email: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  otp: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading + 2,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  modeToggleBox: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 18,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  card: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 6,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sendOtpBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sendOtpBtnText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  feedbackBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  feedbackText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
