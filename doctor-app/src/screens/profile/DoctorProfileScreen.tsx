import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  Award,
  Layers,
  Building2,
  Phone,
  Mail,
  Calendar,
  LogOut,
  MapPin,
  Clock,
  Settings,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';

interface DoctorProfileScreenProps {
  navigation: any;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const { doctor, logout } = useDoctorAuthStore();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Sign out of MedLink Doctor Workspace? You will need to sign in again to access your clinical workspace.') : true;
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of the Doctor Workspace?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
    }
  };

  const displayName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Doctor';
  const qualification = doctor?.qualification || 'Medical Practitioner';
  const specialization = doctor?.specialization || 'Clinical Specialist';
  const regNumber = doctor?.registration_number || 'TN-MED-COUNCIL';
  const experienceYears = doctor?.experience_years ? `${doctor.experience_years} years experience` : 'Registered Specialist';
  const aboutSummary = doctor?.about || `${qualification} specializing in ${specialization} with active clinical practice in Chennai healthcare network.`;
  const treatments = doctor?.procedures?.length
    ? doctor.procedures
    : ['General Medical Consultation', 'OPD Assessment', 'Diagnostic Evaluation', 'Preventive Care'];
  const clinics = doctor?.clinic_affiliations?.length
    ? doctor.clinic_affiliations
    : [doctor?.clinic_name || 'Associated Healthcare Center'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TOP BAR WITH TITLE & SIGN OUT */}
        <View style={styles.topBar}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Doctor Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutTopBtn} activeOpacity={0.7}>
            <LogOut size={18} color={PALETTE.error} />
          </TouchableOpacity>
        </View>

        {/* PROFILE IDENTITY CARD */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
          <Image
            source={{
              uri:
                doctor?.avatar ||
                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
            }}
            style={styles.avatar}
          />
          <Text style={[styles.doctorName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.qualText, { color: colors.primary }]}>
            {qualification} • {specialization}
          </Text>

          {/* VERIFIED BADGE */}
          {doctor?.is_verified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: PALETTE.successLight }]}>
              <ShieldCheck size={14} color={PALETTE.success} />
              <Text style={[styles.verifiedText, { color: PALETTE.success }]}>✓ Verified Doctor</Text>
            </View>
          ) : (
            <View style={[styles.verifiedBadge, { backgroundColor: PALETTE.warningLight }]}>
              <Clock size={14} color={PALETTE.warning} />
              <Text style={[styles.verifiedText, { color: '#B45309' }]}>
                {doctor?.verification_status || 'UNDER_REVIEW'}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={[styles.regText, { color: colors.secondaryText }]}>Registration: {regNumber}</Text>
            <Text style={[styles.dotSep, { color: colors.secondaryText }]}>•</Text>
            <Text style={[styles.expText, { color: colors.secondaryText }]}>{experienceYears}</Text>
          </View>
        </View>

        {/* ABOUT / PROFESSIONAL SUMMARY */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>ABOUT</Text>
          <Text style={[styles.aboutBody, { color: colors.text }]}>{aboutSummary}</Text>
        </View>

        {/* SPECIALIZATIONS & DEPARTMENT */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>SPECIALIZATION</Text>
          <View style={styles.specChipRow}>
            <View style={[styles.specChip, { backgroundColor: colors.primary + '15' }]}>
              <Award size={14} color={colors.primary} />
              <Text style={[styles.specChipText, { color: colors.primary }]}>{specialization}</Text>
            </View>
          </View>
        </View>

        {/* TREATMENTS / SERVICES PROVIDED */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>TREATMENTS & SERVICES</Text>
          <View style={styles.treatmentsGrid}>
            {treatments.map((item, idx) => (
              <View key={idx} style={[styles.treatmentBadge, { backgroundColor: colors.cardSubtle }]}>
                <Text style={[styles.treatmentText, { color: colors.text }]}>✓ {item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ASSOCIATED CLINICS */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardHeading, { color: colors.secondaryText }]}>MY CLINICS</Text>
          <View style={styles.clinicsList}>
            {clinics.map((clinic, idx) => (
              <View key={idx} style={[styles.clinicRow, { borderBottomColor: colors.border }]}>
                <Building2 size={16} color={colors.primary} />
                <View style={styles.clinicInfo}>
                  <Text style={[styles.clinicName, { color: colors.text }]}>{clinic}</Text>
                  <Text style={[styles.clinicArea, { color: colors.secondaryText }]}>Chennai Metropolitan Area</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* QUICK LINK TO VERIFICATION AUDIT & SCHEDULE */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Schedule')}
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.text }]}>OPD Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('VerificationProfile')}
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ShieldCheck size={16} color={PALETTE.success} />
            <Text style={[styles.linkBtnText, { color: colors.text }]}>Verification Docs</Text>
          </TouchableOpacity>
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
    padding: 18,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  logoutTopBtn: {
    padding: 8,
  },
  profileCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 10,
  },
  doctorName: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 4,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  qualText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    marginTop: 3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  regText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  dotSep: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  expText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  aboutBody: {
    fontSize: TYPOGRAPHY.sizes.body,
    lineHeight: 20,
  },
  specChipRow: {
    flexDirection: 'row',
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  specChipText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  treatmentsGrid: {
    gap: 6,
  },
  treatmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  treatmentText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  clinicsList: {
    gap: 10,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  clinicArea: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 1,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
