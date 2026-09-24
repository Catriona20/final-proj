import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Share,
  Heart,
  ChevronRight,
  Navigation,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Building2,
} from 'lucide-react-native';
import { AppStackParamList, Doctor } from '../../types';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { discoveredClinicCache } from '../../services/clinicSearchService';
import { SectionHeader } from '../../components/SectionHeader';
import { PreviousVisitCard } from '../../components/PreviousVisitCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ExternalClinicBookingModal } from '../../components/ExternalClinicBookingModal';
import { doctorService } from '../../services/doctorService';
import { socketService } from '../../services/socketService';

type ClinicDetailNavProp = StackNavigationProp<AppStackParamList, 'ClinicDetail'>;
type ClinicDetailRouteProp = RouteProp<AppStackParamList, 'ClinicDetail'>;

const HERO_HEIGHT = 220;
const HEADER_THRESHOLD = 140;

export const ClinicDetailScreen: React.FC = () => {
  const navigation = useNavigation<ClinicDetailNavProp>();
  const route = useRoute<ClinicDetailRouteProp>();
  const { clinicId, department: initialDepartment } = route.params;

  const { clinics, doctors: allDoctors, getPreviousVisitForClinic } = useAppointmentStore();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const clinic = discoveredClinicCache.get(clinicId) || clinics.find((c) => c.id === clinicId) || clinics[0];
  const [selectedDept, setSelectedDept] = useState<string>(
    initialDepartment || (clinic.departments && clinic.departments.length > 0 ? clinic.departments[0] : clinic.category)
  );
  const [externalModalVisible, setExternalModalVisible] = useState(false);

  const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([]);

  const fetchClinicDoctors = async () => {
    if (!clinic?.id) return;
    try {
      const docs = await doctorService.getDoctors(clinic.id);
      if (docs && docs.length > 0) {
        setClinicDoctors(docs);
      }
    } catch (e) {
      console.warn('Failed to fetch clinic doctors:', e);
    }
  };

  useEffect(() => {
    fetchClinicDoctors();
  }, [clinic?.id]);

  useEffect(() => {
    const handleAvailUpdate = (data: any) => {
      const cId = data?.clinic_id || data?.clinicId;
      if (!cId || cId === clinic?.id || cId === 'all') {
        fetchClinicDoctors();
      }
    };
    socketService.subscribe('doctor:availability_updated', handleAvailUpdate);
    socketService.subscribe('doctor:availability_changed', handleAvailUpdate);
    socketService.subscribe('availability_request:approved', handleAvailUpdate);
    socketService.subscribe('availability_request:rejected', handleAvailUpdate);
    return () => {
      socketService.unsubscribe('doctor:availability_updated', handleAvailUpdate);
      socketService.unsubscribe('doctor:availability_changed', handleAvailUpdate);
      socketService.unsubscribe('availability_request:approved', handleAvailUpdate);
      socketService.unsubscribe('availability_request:rejected', handleAvailUpdate);
    };
  }, [clinic?.id]);

  const doctors = clinicDoctors.length > 0
    ? clinicDoctors
    : allDoctors.filter((d) => d.clinicId === clinic.id || d.clinicAffiliations?.includes(clinic.name));

  const filteredDoctors = selectedDept
    ? doctors.filter(
        (d) =>
          d.specialization.toLowerCase().includes(selectedDept.toLowerCase()) ||
          selectedDept.toLowerCase().includes(d.specialization.toLowerCase())
      )
    : doctors;

  const previousVisit = getPreviousVisitForClinic(clinic.id);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [isSaved, setIsSaved] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  const toggleSave = () => {
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setIsSaved((prev) => !prev);
  };

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_THRESHOLD - 30, HEADER_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleOpenDirections = () => {
    const lat = clinic.latitude || 13.0827;
    const lng = clinic.longitude || 80.2707;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (clinic.googlePlaceId) {
      url += `&destination_place_id=${clinic.googlePlaceId}`;
    }
    Linking.openURL(url).catch((err) => {
      console.error('Could not open directions', err);
      Alert.alert('Directions Error', 'Unable to open Google Maps.');
    });
  };

  const handleBookAppointment = () => {
    if (clinic.isConnected !== false && clinic.source === 'platform') {
      const availableDoc = filteredDoctors.find((d) => d.isAvailableToday && d.status === 'AVAILABLE');
      if (!availableDoc) {
        Alert.alert(
          'No Available Doctors',
          'No doctors are currently scheduled or available for appointments at this clinic today. Please visit during walk-in OPD hours or check back later.'
        );
        return;
      }
      navigation.navigate('Booking', {
        clinicId: clinic.id,
        doctorId: availableDoc.id,
        department: selectedDept,
      });
    } else {
      setExternalModalVisible(true);
    }
  };

  const isClinicOpen = clinic.isOpen !== false;

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

          <View style={styles.rightActions}>
            <ThemeToggle compact />

            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(6,21,47,0.85)' : 'rgba(255,255,255,0.9)' }]}
                onPress={toggleSave}
                activeOpacity={0.85}
              >
                <Heart
                  size={16}
                  color={isSaved ? theme.error : theme.textPrimary}
                  fill={isSaved ? theme.error : 'transparent'}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>

      {/* STICKY TOP BAR ON SCROLL */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            opacity: stickyHeaderOpacity,
            backgroundColor: isDark ? '#06152F' : '#FFFFFF',
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <SafeAreaView>
          <View style={styles.stickyHeaderContent}>
            <Text style={[styles.stickyTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {clinic.name}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: clinic.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradient} />
        </View>

        {/* CLINIC MAIN CONTENT CARD */}
        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.topRow}>
            <View style={[styles.categoryTag, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.categoryText, { color: theme.primary }]}>{clinic.category}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isClinicOpen ? theme.successLight : theme.errorLight },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isClinicOpen ? theme.success : theme.error },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isClinicOpen ? theme.success : theme.error },
                ]}
              >
                {isClinicOpen ? 'Open Now' : clinic.opensAt || 'Closed'}
              </Text>
            </View>
          </View>

          <Text style={[styles.clinicName, { color: theme.textPrimary }]}>{clinic.name}</Text>

          <View style={styles.ratingRow}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <Text style={[styles.ratingText, { color: theme.textPrimary }]}> {clinic.rating}</Text>
            <Text style={[styles.reviewsText, { color: theme.textMuted }]}>
              ({clinic.reviewsCount || 42} reviews)
            </Text>
            <View style={[styles.dotSep, { backgroundColor: theme.cardBorder }]} />
            <Text style={[styles.doctorsCountText, { color: theme.primary }]}>
              {doctors.length > 0 ? `${doctors.length} verified doctors` : 'Physical Clinic'}
            </Text>
          </View>

          {/* Info Grid: Distance & Hours */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
              <MapPin size={14} color={theme.primary} />
              <View style={styles.infoTextCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>DISTANCE & ETA</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                  {clinic.distance} {clinic.travelTime ? `(~${clinic.travelTime})` : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}>
              <Clock size={14} color={theme.primary} />
              <View style={styles.infoTextCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>HOURS</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{clinic.openHours}</Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.addressRow}>
            <MapPin size={13} color={theme.textMuted} />
            <Text style={[styles.addressText, { color: theme.textSecondary }]}>{clinic.address}</Text>
          </View>

          {/* Supported Departments Chips (If Multiple) */}
          {clinic.departments && clinic.departments.length > 1 && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>
                Departments & Specialities
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {clinic.departments.map((dept) => {
                  const isDeptActive = dept.toLowerCase() === selectedDept.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: RADIUS.full,
                        backgroundColor: isDeptActive ? theme.primary : theme.backgroundSoft,
                        borderColor: isDeptActive ? theme.primary : theme.cardBorder,
                        borderWidth: 1,
                      }}
                      onPress={() => setSelectedDept(dept)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: isDeptActive ? '#FFFFFF' : theme.textSecondary,
                        }}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* PREVIOUS VISIT CONTINUITY */}
        {previousVisit && (
          <View style={styles.sectionWrap}>
            <PreviousVisitCard
              visitInfo={previousVisit}
              onContinueDoctor={() => {
                const doc = doctors.find((d) => d.name === previousVisit.doctorName) || doctors[0];
                navigation.navigate('Booking', {
                  clinicId: clinic.id,
                  doctorId: doc?.id,
                  department: previousVisit.department,
                });
              }}
            />
          </View>
        )}

        {/* AVAILABLE DOCTORS SECTION */}
        <View style={styles.sectionWrap}>
          <SectionHeader
            title={selectedDept ? `${selectedDept} Specialists` : 'Available Practitioners'}
            subtitle={filteredDoctors.length > 0 ? `${filteredDoctors.length} verified doctors on duty` : undefined}
          />

          {filteredDoctors.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <AlertCircle size={24} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Doctors Listed Online</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                {clinic.isConnected !== false
                  ? 'Doctor appointment schedules for this specialty are updating. You can still visit during walk-in OPD hours.'
                  : 'This facility is available for physical walk-in visits. Instant digital tokens are not yet integrated.'}
              </Text>
              <TouchableOpacity style={[styles.walkInBtn, { backgroundColor: theme.primary }]} onPress={handleOpenDirections}>
                <Navigation size={13} color="#FFFFFF" />
                <Text style={styles.walkInBtnText}>Directions to Walk-in OPD</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.doctorsList}>
              {filteredDoctors.map((doc) => {
                const isAvailable = Boolean(doc.isAvailableToday && doc.status === 'AVAILABLE');
                return (
                  <View
                    key={doc.id}
                    style={[styles.docCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  >
                    <Image source={{ uri: doc.avatar }} style={styles.docAvatar} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.docNameRow}>
                        <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {doc.name}
                        </Text>
                        {doc.isVerified && <ShieldCheck size={13} color={theme.primary} />}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 }}>
                        <Text style={[styles.docSpec, { color: theme.primary }]}>{doc.specialization}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: isAvailable
                                ? isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7'
                                : isDark ? 'rgba(100,116,139,0.18)' : '#F1F5F9',
                              borderColor: isAvailable
                                ? isDark ? 'rgba(16,185,129,0.3)' : '#86EFAC'
                                : isDark ? 'rgba(100,116,139,0.25)' : '#CBD5E1',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isAvailable ? (isDark ? '#34D399' : '#16A34A') : (isDark ? '#94A3B8' : '#64748B') },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: isAvailable ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#94A3B8' : '#64748B') },
                            ]}
                          >
                            {isAvailable ? 'AVAILABLE' : 'NOT SCHEDULED / OFFLINE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.docQual, { color: theme.textMuted }]} numberOfLines={1}>
                        {doc.qualification}
                      </Text>
                      <View style={styles.docMetaStrip}>
                        <Text style={[styles.docMetaItem, { color: theme.textSecondary }]}>⏱ {doc.consultationDuration || '25 min'}</Text>
                        <Text style={[styles.docMetaItem, { color: theme.textPrimary, fontWeight: '700' }]}>{doc.consultationFee}</Text>
                        <Text style={[styles.docMetaItem, { color: '#F59E0B' }]}>⭐ {doc.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.docActionsCol}>
                      <TouchableOpacity
                        style={[styles.profileBtn, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
                        onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id })}
                      >
                        <Text style={[styles.profileBtnText, { color: theme.textPrimary }]}>Profile</Text>
                      </TouchableOpacity>
                      {isAvailable ? (
                        <TouchableOpacity
                          style={[styles.bookDocBtn, { backgroundColor: theme.cta }]}
                          onPress={() =>
                            navigation.navigate('Booking', {
                              doctorId: doc.id,
                              clinicId: clinic.id,
                              department: doc.specialization,
                            })
                          }
                        >
                          <Text style={styles.bookDocBtnText}>Book</Text>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={[
                            styles.unavailableDocBtn,
                            {
                              backgroundColor: isDark ? 'rgba(100,116,139,0.12)' : '#F1F5F9',
                              borderColor: isDark ? 'rgba(100,116,139,0.25)' : '#CBD5E1',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.unavailableDocBtnText,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                          >
                            Not Available
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderTopColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.bottomInfoCol}>
          <Text style={[styles.bottomFee, { color: theme.primary }]}>
            {clinic.consultationFee || 'Physical OPD'}
          </Text>
          <Text style={[styles.bottomFeeLabel, { color: isClinicOpen ? theme.success : theme.error }]}>
            {isClinicOpen ? '● Open Now' : '● Currently Closed'}
          </Text>
        </View>

        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[
              styles.dirActionBtn,
              {
                backgroundColor: theme.backgroundSoft,
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={handleOpenDirections}
            activeOpacity={0.85}
          >
            <Navigation size={14} color={theme.primary} />
            <Text style={[styles.dirActionBtnText, { color: theme.textPrimary }]}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBookBtn, { backgroundColor: theme.cta }]}
            onPress={handleBookAppointment}
            activeOpacity={0.88}
          >
            <Calendar size={14} color="#FFFFFF" />
            <Text style={styles.mainBookBtnText}>
              {isClinicOpen ? 'Book Appointment' : 'Book for Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EXTERNAL CLINIC APPOINTMENT AVAILABILITY MODAL */}
      <ExternalClinicBookingModal
        visible={externalModalVisible}
        onClose={() => setExternalModalVisible(false)}
        clinic={clinic}
        department={selectedDept}
        onViewClinic={() => setExternalModalVisible(false)}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 90,
    borderBottomWidth: 1,
  },
  stickyHeaderContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  contentCard: {
    marginHorizontal: SPACING.md,
    marginTop: -24,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  clinicName: {
    ...TYPOGRAPHY.h2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewsText: {
    fontSize: 11,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 3,
  },
  doctorsCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  infoTextCol: {
    gap: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 11,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    gap: 6,
    marginTop: 4,
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: 14,
    gap: 8,
  },
  emptyCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  walkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 5,
    marginTop: 4,
  },
  walkInBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  doctorsList: {
    gap: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.subtle,
  },
  docAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
  },
  docSpec: {
    fontSize: 11,
    fontWeight: '600',
  },
  docQual: {
    fontSize: 10,
  },
  docMetaStrip: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 1,
  },
  docMetaItem: {
    fontSize: 10,
  },
  docActionsCol: {
    gap: 5,
  },
  profileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bookDocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  bookDocBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  unavailableDocBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    borderWidth: 1,
  },
  unavailableDocBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomBar: {
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
  bottomInfoCol: {
    gap: 1,
  },
  bottomFee: {
    fontSize: 14,
    fontWeight: '800',
  },
  bottomFeeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dirActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dirActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.subtle,
  },
  mainBookBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
