import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, SHADOWS_COMPAT as SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, Calendar, MapPin, ArrowRight } from 'lucide-react-native';

type WelcomeNavProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavProp>();
  const { setHasCompletedOnboarding } = useAuthStore();

  const handleGetStarted = async () => {
    await setHasCompletedOnboarding(true);
    navigation.navigate('Register');
  };

  const handleLoginNav = async () => {
    await setHasCompletedOnboarding(true);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Patient Mobile Portal</Text>
          </View>
          <Text style={styles.title}>Book Appointments & Manage Healthcare</Text>
          <Text style={styles.subtitle}>
            Find nearby clinics, connect with top specialist doctors, and view your upcoming visits seamlessly.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#CCFBF1' }]}>
                <MapPin size={20} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Locate Nearby Clinics</Text>
                <Text style={styles.featureDesc}>Browse verified healthcare centers around you</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Calendar size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Instant Booking</Text>
                <Text style={styles.featureDesc}>Reserve slots without waiting in line</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                <ShieldCheck size={20} color={COLORS.accent} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Secure Records</Text>
                <Text style={styles.featureDesc}>Your medical history protected and accessible</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoginNav} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
  },
  heroSection: {
    marginTop: SPACING.lg,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  badgeText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  featureList: {
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});


