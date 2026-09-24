import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, SHADOWS_COMPAT as SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react-native';

type LoginNavProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const route = useRoute<LoginRouteProp>();
  const initialEmail = route.params?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    setValidationError(null);
    clearError();

    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      setValidationError(passCheck.error || 'Invalid password.');
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      // Error handled in store
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flexOne}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Welcome')}>
            <ArrowLeft size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Sign in to manage your appointments and health history</Text>
          </View>

          {(validationError || error) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{validationError || error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Sign In</Text>
                  <LogIn size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            {/* DEMO ACCOUNTS QUICK-FILL DRAWER */}
            <DemoAccountsDrawer
              onSelect={(demoEmail, demoPassword) => {
                setEmail(demoEmail);
                setPassword(demoPassword);
                setValidationError(null);
              }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface DemoUserItem {
  name: string;
  email: string;
  pass: string;
  otp: string;
  role: 'PATIENT' | 'DOCTOR' | 'ASSISTANT';
  detail: string;
}

const DEMO_USERS_LIST: DemoUserItem[] = [
  { name: 'Aarav Sharma', email: 'patient01@demo.medlink.test', pass: 'Demo@1001', otp: '100001', role: 'PATIENT', detail: 'Dentistry • Moon Dental' },
  { name: 'Sneha Patel', email: 'patient02@demo.medlink.test', pass: 'Demo@1002', otp: '100002', role: 'PATIENT', detail: 'Dentistry • Cleaning' },
  { name: 'Rajesh Kumar', email: 'patient03@demo.medlink.test', pass: 'Demo@1003', otp: '100003', role: 'PATIENT', detail: 'Gen Med • Apollo Family' },
  { name: 'Priya Raman', email: 'patient04@demo.medlink.test', pass: 'Demo@1004', otp: '100004', role: 'PATIENT', detail: 'Pediatrics • Child Care' },
  { name: 'Vikram Malhotra', email: 'patient05@demo.medlink.test', pass: 'Demo@1005', otp: '100005', role: 'PATIENT', detail: 'Dermatology • Skin Care' },
  { name: 'Ananya Iyer', email: 'patient06@demo.medlink.test', pass: 'Demo@1006', otp: '100006', role: 'PATIENT', detail: 'ENT Care • Hearing' },
  { name: 'Rahul Verma', email: 'patient07@demo.medlink.test', pass: 'Demo@1007', otp: '100007', role: 'PATIENT', detail: 'Orthopedics • Mobility' },
  { name: 'Pooja Nair', email: 'patient08@demo.medlink.test', pass: 'Demo@1008', otp: '100008', role: 'PATIENT', detail: 'Gynecology • GreenLife' },
  { name: 'Dr. Arun Kumar', email: 'doctor01@demo.medlink.test', pass: 'Doctor@2001', otp: '200001', role: 'DOCTOR', detail: 'Dentist • Moon Dental' },
  { name: 'Dr. Priya Sharma', email: 'doctor02@demo.medlink.test', pass: 'Doctor@2002', otp: '200002', role: 'DOCTOR', detail: 'Gen Med • MedLink Multi' },
  { name: 'Dr. Vikram Rao', email: 'doctor03@demo.medlink.test', pass: 'Doctor@2003', otp: '200003', role: 'DOCTOR', detail: 'Cardio • MedLink Heart' },
  { name: 'Dr. Neha Menon', email: 'doctor04@demo.medlink.test', pass: 'Doctor@2004', otp: '200004', role: 'DOCTOR', detail: 'Pediatrics • Rainbow' },
  { name: 'Dr. Rahul Iyer', email: 'doctor05@demo.medlink.test', pass: 'Doctor@2005', otp: '200005', role: 'DOCTOR', detail: 'Derma • MedLink Skin' },
  { name: 'Dr. Kavya Nair', email: 'doctor06@demo.medlink.test', pass: 'Doctor@2006', otp: '200006', role: 'DOCTOR', detail: 'ENT • MedLink ENT' },
  { name: 'Sheryl Thomas', email: 'assistant01@demo.medlink.test', pass: 'Clinic@3001', otp: '300001', role: 'ASSISTANT', detail: 'Admin • Moon Dental' },
  { name: 'Rahul Joseph', email: 'assistant02@demo.medlink.test', pass: 'Clinic@3002', otp: '300002', role: 'ASSISTANT', detail: 'Admin • MedLink Multi' },
  { name: 'Nisha Kumar', email: 'assistant03@demo.medlink.test', pass: 'Clinic@3003', otp: '300003', role: 'ASSISTANT', detail: 'Admin • Heart Care' },
  { name: 'Divya Raj', email: 'assistant04@demo.medlink.test', pass: 'Clinic@3004', otp: '300004', role: 'ASSISTANT', detail: 'Admin • Rainbow Child' },
  { name: 'Joseph Mathew', email: 'assistant05@demo.medlink.test', pass: 'Clinic@3005', otp: '300005', role: 'ASSISTANT', detail: 'Admin • Skin Care' },
  { name: 'Priyanka Das', email: 'assistant06@demo.medlink.test', pass: 'Clinic@3006', otp: '300006', role: 'ASSISTANT', detail: 'Admin • ENT Care' },
];

const DemoAccountsDrawer: React.FC<{ onSelect: (email: string, pass: string) => void }> = ({ onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | 'ASSISTANT'>('PATIENT');

  const filtered = DEMO_USERS_LIST.filter((u) => u.role === selectedRole);

  return (
    <View style={demoStyles.container}>
      <TouchableOpacity
        style={demoStyles.toggleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={demoStyles.toggleHeaderText}>⚡ Demo Accounts Quick-Fill</Text>
        <Text style={demoStyles.toggleHeaderHint}>{expanded ? 'Hide ▲' : 'Show (20 Accounts) ▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={demoStyles.content}>
          {/* Role Filter Tabs */}
          <View style={demoStyles.roleTabs}>
            {(['PATIENT', 'DOCTOR', 'ASSISTANT'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[demoStyles.roleTab, selectedRole === r && demoStyles.roleTabActive]}
                onPress={() => setSelectedRole(r)}
              >
                <Text style={[demoStyles.roleTabText, selectedRole === r && demoStyles.roleTabTextActive]}>
                  {r === 'PATIENT' ? 'Patients (8)' : r === 'DOCTOR' ? 'Doctors (6)' : 'Assistants (6)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List of Accounts */}
          <ScrollView style={demoStyles.userList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            {filtered.map((user) => (
              <TouchableOpacity
                key={user.email}
                style={demoStyles.userCard}
                onPress={() => onSelect(user.email, user.pass)}
                activeOpacity={0.7}
              >
                <View style={demoStyles.userCardLeft}>
                  <Text style={demoStyles.userName}>{user.name}</Text>
                  <Text style={demoStyles.userDetail}>{user.detail}</Text>
                  <Text style={demoStyles.userEmail}>{user.email}</Text>
                </View>
                <View style={demoStyles.userCardRight}>
                  <Text style={demoStyles.otpBadge}>OTP: {user.otp}</Text>
                  <Text style={demoStyles.fillBtn}>Auto-Fill</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const demoStyles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#E2E8F0',
  },
  toggleHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  toggleHeaderHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  content: {
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
  userList: {
    gap: 6,
    maxHeight: 280,
  },
  userCard: {
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
  userCardLeft: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  userDetail: {
    fontSize: 10,
    color: '#64748B',
  },
  userEmail: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  userCardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  otpBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fillBtn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    marginTop: SPACING.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    ...SHADOWS.medium,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
