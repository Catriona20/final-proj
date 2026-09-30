import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ArrowLeft,
  Star,
  Clock,
  Award,
  MapPin,
  Heart,
  Share2,
  ShieldCheck,
  Calendar,
  Languages,
  FileCheck,
  Building2,
  Sparkles,
} from 'lucide-react-native';
import { AppStackParamList, Doctor } from '../../types';
import { doctorService } from '../../services/doctorService';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ThemeToggle } from '../../components/ThemeToggle';
import { socketService } from '../../services/socketService';

type DoctorProfileNavProp = StackNavigationProp<AppStackParamList, 'DoctorProfile'>;
type DoctorProfileRouteProp = RouteProp<AppStackParamList, 'DoctorProfile'>;

export const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation<DoctorProfileNavProp>();
  const route = useRoute<DoctorProfileRouteProp>();
  const { doctorId } = route.params;

  const { doctors, clinics } = useAppointmentStore();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const doctor = doctors.find((d) => d.id === doctorId) ?? doctors[0];
  const clinic = clinics.find((c) => c.id === doctor.clinicId);
  const [liveDoctor, setLiveDoctor] = React.useState<Doctor>(doctor);

  React.useEffect(() => {
    if (doctor.clinicId) {
      doctorService.getDoctors(doctor.clinicId).then((docs) => {
        const found = docs.find((d) => d.id === doctorId);
        if (found) setLiveDoctor(found);
      });
    }

    const handleStatusUpdate = (data: any) => {
      const dId = data?.doctorId || data?.doctor_id;
      const newStatus = (data?.status || '').toUpperCase();
      if (dId === doctorId && newStatus) {
        setLiveDoctor((prev) => ({
          ...prev,
          status: newStatus,
          liveStatus: newStatus,
          isAvailableToday: newStatus === 'AVAILABLE',
        }));
      }
    };
    socketService.subscribe('doctor:status_updated', handleStatusUpdate);
    return () => {
      socketService.unsubscribe('doctor:status_updated', handleStatusUpdate);
    };
  }, [doctorId, doctor.clinicId]);

  const isDoctorAvailable = Boolean(liveDoctor.isAvailableToday && liveDoctor.status === 'AVAILABLE');
  const isDoctorBusy = liveDoctor.status === 'BUSY';

  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* FLOATING HEADER CONTROLS */}
      <SafeAreaView style={[styles.floatingHeader, { pointerEvents: 'box-none' }]}>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(6,21,47,0.85)' : 'rgba(255,255,255,0.9)' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.headerCenterTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {doctor.name}
          </Text>

          <ThemeToggle compact />
        </View>
      </SafeAreaView>

      {/* SCROLLABLE CONTENT */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* HERO CARD */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#06152F' : '#0B1530' }]}>
          <View style={styles.heroProfileRow}>
            <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
            <View style={styles.heroMeta}>
              <View style={styles.tagRow}>
                <View style={[styles.specBadge, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <Text style={styles.specBadgeText}>{doctor.specialization}</Text>
                </View>
                {doctor.isVerified && (
                  <View style={styles.verifiedPill}>
                    <ShieldCheck size={11} color="#34D399" />
                    <Text style={styles.verifiedText}>Verified Doctor</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isDoctorAvailable
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isDoctorBusy
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isDoctorAvailable
                          ? '#10B981'
                          : isDoctorBusy
                          ? '#FBBF24'
                          : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isDoctorAvailable
                          ? '#6EE7B7'
                          : isDoctorBusy
                          ? '#FDE68A'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {isDoctorAvailable ? 'AVAILABLE' : isDoctorBusy ? 'BUSY' : 'NOT AVAILABLE / OFFLINE'}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroName}>{doctor.name}</Text>
              <Text style={styles.heroQual}>{doctor.qualification}</Text>
            </View>
          </View>
        </View>

        {/* CONTINUITY BADGE */}
        {(doctor.previousVisitsCount || 0) > 0 && (
          <View style={[styles.continuityCard, { backgroundColor: isDark ? '#0F2557' : '#EFF6FF', borderColor: '#38BDF8' }]}>
            <Sparkles size={14} color="#0284C7" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.continuityTitle, { color: '#0284C7' }]}>
                Your Previous Practitioner
              </Text>
              <Text style={[styles.continuitySub, { color: theme.textSecondary }]}>
                You consulted with {doctor.name} {doctor.previousVisitsCount} times previously · Last visit: {doctor.lastVisitedDate || 'Recent'}
              </Text>
            </View>
          </View>
        )}

        {/* QUICK STATS ROW */}
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.statItem}>
            <Award size={18} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{doctor.experienceYears}+ Yrs</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>EXPERIENCE</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.statItem}>
            <Star size={18} color="#F59E0B" fill="#F59E0B" />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{doctor.rating}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>({doctor.reviewsCount} REVIEWS)</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.statItem}>
            <Clock size={18} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{doctor.consultationDuration || '25 min'}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>DURATION</Text>
          </View>
        </View>

        {/* MEDICAL REGISTRATION & LICENSE CREDENTIALS */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <FileCheck size={16} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Medical License & Registration</Text>
          </View>
          <View style={[styles.regBox, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
            <View style={styles.regRow}>
              <Text style={[styles.regLabel, { color: theme.textMuted }]}>Registration Number</Text>
              <Text style={[styles.regValue, { color: theme.textPrimary }]}>
                {doctor.registrationNumber || 'TNMC-2014-48291'}
              </Text>
            </View>
            <View style={styles.regRow}>
              <Text style={[styles.regLabel, { color: theme.textMuted }]}>Licensing Authority</Text>
              <Text style={[styles.regValue, { color: theme.textPrimary }]}>
                {doctor.registrationAuthority || 'Tamil Nadu Medical Council'}
              </Text>
            </View>
            <View style={styles.regRow}>
              <Text style={[styles.regLabel, { color: theme.textMuted }]}>Verification Status</Text>
              <View style={styles.statusVerifiedRow}>
                <ShieldCheck size={12} color={theme.success} />
                <Text style={[styles.statusVerifiedText, { color: theme.success }]}>Government Registered</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>About Doctor</Text>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            {doctor.about ||
              `${doctor.name} is a highly skilled practitioner with over ${doctor.experienceYears} years of clinical experience specializing in ${doctor.specialization}.`}
          </Text>
        </View>

        {/* CLINIC AFFILIATION & TIMINGS */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Physical Clinic & Timings</Text>
          <View style={styles.clinicInfoRow}>
            <Building2 size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.clinicName, { color: theme.textPrimary }]}>{doctor.clinicName}</Text>
              <Text style={[styles.clinicSub, { color: theme.textMuted }]}>
                OPD Days: {doctor.availableDays.join(', ')} · 09:00 AM - 05:00 PM
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* BOTTOM CTA BAR */}
      <View
        style={[
          styles.bottomCTA,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderTopColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.bottomCTALeft}>
          <Text style={[styles.bottomFee, { color: theme.primary }]}>{doctor.consultationFee}</Text>
          <Text style={[styles.bottomFeeLabel, { color: theme.textMuted }]}>
            OPD Consultation ({doctor.consultationDuration || '25 min'})
          </Text>
        </View>

        {isDoctorAvailable ? (
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: theme.cta }]}
            onPress={() =>
              navigation.navigate('Booking', {
                doctorId: liveDoctor.id,
                clinicId: liveDoctor.clinicId,
                department: liveDoctor.specialization,
              })
            }
            activeOpacity={0.88}
          >
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.bookBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                paddingHorizontal: 16,
              },
            ]}
          >
            <Text
              style={[
                styles.bookBtnText,
                { color: isDoctorBusy ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#94A3B8' : '#64748B') },
              ]}
            >
              {isDoctorBusy ? 'Busy' : 'Not Available'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  headerCenterTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    paddingTop: 70,
    gap: 12,
  },
  heroCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  heroMeta: {
    flex: 1,
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  specBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },
  heroName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroQual: {
    fontSize: 11,
    color: '#94A3B8',
  },
  continuityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
  },
  continuityTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  continuitySub: {
    fontSize: 10.5,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  sectionCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
    ...SHADOWS.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  regBox: {
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  regRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regLabel: {
    fontSize: 11,
  },
  regValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 18,
  },
  clinicInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  clinicName: {
    fontSize: 13,
    fontWeight: '700',
  },
  clinicSub: {
    fontSize: 11,
    marginTop: 1,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    ...SHADOWS.float,
  },
  bottomCTALeft: {
    gap: 1,
  },
  bottomFee: {
    fontSize: 16,
    fontWeight: '800',
  },
  bottomFeeLabel: {
    fontSize: 10,
  },
  bookBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
