import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Image,
  Linking,
  Alert,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ArrowLeft,
  Star,
  MapPin,
  Navigation,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Building2,
  Calendar,
  X,
  List,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Search,
} from 'lucide-react-native';
import { AppStackParamList, Clinic, FilterOptions } from '../../types';
import { MOCK_DEPARTMENTS } from '../../data/mockData';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAppStore } from '../../store/useAppStore';
import { InteractiveMap } from '../../components/InteractiveMap';
import { LocationSelectorModal } from '../../components/LocationSelectorModal';
import { FilterSheet } from '../../components/FilterSheet';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ExternalClinicBookingModal } from '../../components/ExternalClinicBookingModal';
import { clinicSearchService } from '../../services/clinicSearchService';

type MapNavProp = StackNavigationProp<AppStackParamList, 'MapView'>;
type MapRouteProp = RouteProp<AppStackParamList, 'MapView'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SortOption = 'best' | 'fastest' | 'shortest';
const RADIUS_OPTIONS = [2, 5, 10, 20];

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapNavProp>();
  const route = useRoute<MapRouteProp>();
  const initialDepartment = route.params?.department || 'General Medicine';
  const initialClinicId = route.params?.clinicId || null;

  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const { activeLocation } = useAppStore();

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [modalClinic, setModalClinic] = useState<Clinic | null>(null);
  const [externalModalVisible, setExternalModalVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartment);
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const [sortOption, setSortOption] = useState<SortOption>('fastest');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterOptions>({
    specialization: initialDepartment,
    department: initialDepartment,
    distance: 10,
    availability: 'all',
    maxWait: 60,
    minRating: 0,
    openNow: false,
  });

  // Animated values for card transition
  const cardSlideAnim = useRef(new Animated.Value(200)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.92)).current;

  const fetchClinics = async (dept: string, radius: number) => {
    setIsLoading(true);

    const result = await clinicSearchService.discoverNearby(
      dept,
      radius,
      { latitude: activeLocation.latitude, longitude: activeLocation.longitude },
      dept,
      { ...filters, distance: radius, specialization: dept }
    );

    let sorted = [...result.clinics];

    if (sortOption === 'fastest') {
      sorted.sort((a, b) => (a.travelDurationSeconds || 600) - (b.travelDurationSeconds || 600));
    } else if (sortOption === 'shortest') {
      sorted.sort((a, b) => (a.distanceMeters || 2000) - (b.distanceMeters || 2000));
    } else {
      // Best match (rating + distance combined score)
      sorted.sort((a, b) => b.rating - a.rating);
    }

    setClinics(sorted);
    setIsLoading(false);

    if (sorted.length > 0) {
      const matchInitial = initialClinicId
        ? sorted.find((c) => c.id === initialClinicId)
        : null;
      handleSelectClinic(matchInitial || sorted[0]);
    } else {
      setSelectedClinic(null);
    }
  };

  useEffect(() => {
    fetchClinics(selectedDepartment, selectedRadius);
  }, [activeLocation, selectedDepartment, selectedRadius, sortOption]);

  const handleSelectClinic = (clinic: Clinic) => {
    // Smooth exit then entry animation
    Animated.parallel([
      Animated.timing(cardOpacityAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(cardScaleAnim, { toValue: 0.94, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setSelectedClinic(clinic);
      cardSlideAnim.setValue(80);
      Animated.parallel([
        Animated.spring(cardSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 9,
        }),
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();
    });
  };

  const handleOpenDirections = (clinic: Clinic) => {
    const lat = clinic.latitude || activeLocation.latitude;
    const lng = clinic.longitude || activeLocation.longitude;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (clinic.googlePlaceId) {
      url += `&destination_place_id=${clinic.googlePlaceId}`;
    }
    Linking.openURL(url).catch((err) => {
      console.error('Could not open directions', err);
      Alert.alert('Directions Error', 'Unable to open Google Maps.');
    });
  };

  const handleBookClinic = (clinic: Clinic) => {
    if (clinic.isConnected !== false && clinic.source === 'platform') {
      navigation.navigate('Booking', {
        clinicId: clinic.id,
        department: selectedDepartment,
      });
    } else {
      setModalClinic(clinic);
      setExternalModalVisible(true);
    }
  };

  const isOpen = selectedClinic?.isOpen !== false;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── TOP CONTROL HEADER ─── */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: isDark ? '#06152F' : '#FFFFFF',
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        {/* Row 1: Back + Location Pill + Filter + Theme Toggle */}
        <View style={styles.headerRow1}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationPill,
              {
                backgroundColor: isDark ? '#0C2347' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={() => setIsLocationModalVisible(true)}
            activeOpacity={0.85}
          >
            <MapPin size={13} color={theme.primary} />
            <Text style={[styles.locationText, { color: theme.textPrimary }]} numberOfLines={1}>
              {activeLocation.name}
            </Text>
            <ChevronRight size={12} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                {
                  backgroundColor: filters.openNow || filters.minRating > 0 ? theme.primaryLight : theme.backgroundSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => setShowFilter(true)}
            >
              <SlidersHorizontal size={15} color={theme.primary} />
            </TouchableOpacity>

            <ThemeToggle compact />
          </View>
        </View>

        {/* Row 2: 10 Departments Horizontal Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptRail}
        >
          {MOCK_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDepartment.toLowerCase() === dept.name.toLowerCase();
            return (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.deptPill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isDark
                      ? '#0C2347'
                      : '#F8FAFC',
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelectedDepartment(dept.name)}
                activeOpacity={0.85}
              >
                <Text style={styles.deptIcon}>{dept.icon}</Text>
                <Text
                  style={[
                    styles.deptPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {dept.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Row 3: Count + Radius selector + Sort Selector + Map/List toggle */}
        <View style={styles.subControlsRow}>
          <View style={styles.countAndRadiusBox}>
            <Text style={[styles.clinicCountText, { color: theme.textPrimary }]}>
              <Text style={{ fontWeight: '800', color: theme.primary }}>{clinics.length}</Text> {selectedDepartment}
            </Text>

            {/* Radius Pills */}
            <View style={styles.radiusPillsRow}>
              {RADIUS_OPTIONS.map((r) => {
                const isSelected = selectedRadius === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.backgroundSoft,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedRadius(r)}
                  >
                    <Text
                      style={[
                        styles.radiusPillText,
                        { color: isSelected ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {r}km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort & Map/List Toggle */}
          <View style={styles.sortToggleRow}>
            <TouchableOpacity
              style={[
                styles.sortBtn,
                { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder },
              ]}
              onPress={() => {
                const nextSort: SortOption =
                  sortOption === 'fastest' ? 'shortest' : sortOption === 'shortest' ? 'best' : 'fastest';
                setSortOption(nextSort);
              }}
            >
              <Text style={[styles.sortBtnText, { color: theme.textPrimary }]}>
                {sortOption === 'fastest' ? '⚡ Fastest' : sortOption === 'shortest' ? '📏 Shortest' : '⭐ Best'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
            >
              {viewMode === 'map' ? (
                <List size={14} color="#FFFFFF" />
              ) : (
                <MapIcon size={14} color="#FFFFFF" />
              )}
              <Text style={styles.viewModeBtnText}>
                {viewMode === 'map' ? 'List' : 'Map'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── MAIN CONTENT AREA ─── */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <InteractiveMap
            clinics={clinics}
            selectedClinicId={selectedClinic?.id ?? null}
            onSelectClinic={handleSelectClinic}
            centerCoords={{ latitude: activeLocation.latitude, longitude: activeLocation.longitude }}
            showRoute={true}
            searchedLocation={activeLocation.type === 'manual' ? { name: activeLocation.name, latitude: activeLocation.latitude, longitude: activeLocation.longitude } : null}
          />

          {/* ─── EMPTY STATE (when 0 clinics found in radius) ─── */}
          {clinics.length === 0 && !isLoading && (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#0C2347' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <Building2 size={28} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No {selectedDepartment} Clinics within {selectedRadius} km
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
                Try expanding your search radius to find nearby specialist centers in Chennai.
              </Text>
              <View style={styles.expandRadiusRow}>
                {[10, 20].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.expandBtn, { backgroundColor: theme.primary }]}
                    onPress={() => setSelectedRadius(r)}
                  >
                    <Text style={styles.expandBtnText}>Search in {r} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ─── FLOATING CLINIC CARD (SAFELY POSITIONED ABOVE VIEWPORT) ─── */}
          {selectedClinic && (
            <Animated.View
              style={[
                styles.floatingClinicCard,
                {
                  backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
                  borderColor: isDark ? '#1E3A8A' : '#E2E8F0',
                  transform: [
                    { translateY: cardSlideAnim },
                    { scale: cardScaleAnim },
                  ],
                  opacity: cardOpacityAnim,
                },
              ]}
            >
              {/* Header Info */}
              <View style={styles.cardHeaderRow}>
                <Image source={{ uri: selectedClinic.image }} style={styles.clinicImage} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.categoryRow}>
                    <Text style={[styles.categoryTag, { color: theme.primary }]}>
                      {selectedClinic.category}
                    </Text>
                    <View
                      style={[
                        styles.openChip,
                        {
                          backgroundColor: isOpen ? theme.successLight : theme.errorLight,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.openDot,
                          { backgroundColor: isOpen ? theme.success : theme.error },
                        ]}
                      />
                      <Text
                        style={[
                          styles.openText,
                          { color: isOpen ? theme.success : theme.error },
                        ]}
                      >
                        {isOpen ? 'Open Now' : selectedClinic.opensAt || 'Closed'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.clinicName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {selectedClinic.name}
                  </Text>

                  <View style={styles.metaRow}>
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                    <Text style={[styles.metaText, { color: theme.textPrimary, fontWeight: '700' }]}>
                      {selectedClinic.rating}
                    </Text>
                    <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
                    <Navigation size={11} color={theme.textMuted} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {selectedClinic.distance}
                    </Text>
                    <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
                    <Clock size={11} color={theme.textMuted} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {selectedClinic.travelTime || '6 min'} ETA
                    </Text>
                  </View>

                  {selectedClinic.doctorsCount > 0 ? (
                    <View style={[styles.docCountTag, { backgroundColor: theme.primaryLight }]}>
                      <ShieldCheck size={11} color={theme.primary} />
                      <Text style={[styles.docCountText, { color: theme.primary }]}>
                        {selectedClinic.doctorsCount} verified specialist{selectedClinic.doctorsCount === 1 ? '' : 's'} on duty
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => handleOpenDirections(selectedClinic)}
                  activeOpacity={0.85}
                >
                  <Navigation size={13} color={theme.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('ClinicDetail', {
                      clinicId: selectedClinic.id,
                      department: selectedDepartment,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Building2 size={13} color={theme.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>View Clinic</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bookBtn,
                    {
                      backgroundColor: theme.cta,
                    },
                  ]}
                  onPress={() => handleBookClinic(selectedClinic)}
                  activeOpacity={0.88}
                >
                  <Calendar size={13} color="#FFFFFF" />
                  <Text style={styles.bookBtnText}>
                    {selectedClinic.isConnected !== false
                      ? isOpen
                        ? 'Book Visit'
                        : 'Book for Later'
                      : 'Book Appointment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        /* ─── LIST VIEW MODE (SCROLLABLE CLINIC CARDS WITH PROPER BOTTOM PADDING) ─── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {clinics.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#0C2347' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <Building2 size={32} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Clinics Found
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
                Expand search radius to 20 km or choose another specialty.
              </Text>
            </View>
          ) : (
            clinics.map((clinic) => {
              const clinicIsOpen = clinic.isOpen !== false;
              const isSelected = clinic.id === selectedClinic?.id;

              return (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    styles.listCard,
                    {
                      backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
                      borderColor: isSelected ? theme.primary : theme.cardBorder,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    handleSelectClinic(clinic);
                    setViewMode('map');
                  }}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: clinic.image }} style={styles.listClinicImg} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.categoryRow}>
                      <Text style={[styles.categoryTag, { color: theme.primary }]}>
                        {clinic.category}
                      </Text>
                      <View
                        style={[
                          styles.openChip,
                          {
                            backgroundColor: clinicIsOpen ? theme.successLight : theme.errorLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.openText,
                            { color: clinicIsOpen ? theme.success : theme.error },
                          ]}
                        >
                          {clinicIsOpen ? 'Open Now' : 'Closed'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.clinicName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {clinic.name}
                    </Text>

                    <Text style={[styles.clinicAddressText, { color: theme.textMuted }]} numberOfLines={1}>
                      {clinic.address}
                    </Text>

                    <View style={styles.metaRow}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <Text style={[styles.metaText, { color: theme.textPrimary, fontWeight: '700' }]}>
                        {clinic.rating}
                      </Text>
                      <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                        📍 {clinic.distance} · 🚗 {clinic.travelTime || '6 min'}
                      </Text>
                    </View>

                    {clinic.doctorsCount > 0 && (
                      <Text style={[styles.listDocCount, { color: theme.primary }]}>
                        ✓ {clinic.doctorsCount} verified doctor{clinic.doctorsCount === 1 ? '' : 's'} available
                      </Text>
                    )}

                    <View style={styles.listActionRow}>
                      <TouchableOpacity
                        style={[styles.listBookBtn, { backgroundColor: theme.cta }]}
                        onPress={() => handleBookClinic(clinic)}
                      >
                        <Calendar size={12} color="#FFFFFF" />
                        <Text style={styles.listBookBtnText}>
                          {clinic.isConnected !== false ? 'Book Visit' : 'Book Appointment'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.listDirBtn, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
                        onPress={() => handleOpenDirections(clinic)}
                      >
                        <Navigation size={12} color={theme.primary} />
                        <Text style={[styles.listDirBtnText, { color: theme.textPrimary }]}>Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Guaranteed Bottom Spacing so last item is never cut off */}
          <View style={{ height: 140 }} />
        </ScrollView>
      )}

      <FilterSheet
        visible={showFilter}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onClose={() => setShowFilter(false)}
      />

      <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
      />

      <ExternalClinicBookingModal
        visible={externalModalVisible}
        onClose={() => setExternalModalVisible(false)}
        clinic={modalClinic}
        department={selectedDepartment}
        onViewClinic={() =>
          modalClinic &&
          navigation.navigate('ClinicDetail', {
            clinicId: modalClinic.id,
            department: selectedDepartment,
          })
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 8,
    zIndex: 30,
  },
  headerRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptRail: {
    gap: 6,
    paddingVertical: 2,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  deptIcon: {
    fontSize: 12,
  },
  deptPillText: {
    fontSize: 11,
  },
  subControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  countAndRadiusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clinicCountText: {
    fontSize: 11,
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  radiusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  radiusPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  viewModeBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyCard: {
    position: 'absolute',
    top: 30,
    left: SPACING.md,
    right: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.float,
    zIndex: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  expandRadiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  expandBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  expandBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingClinicCard: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.md,
    right: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    gap: 10,
    ...SHADOWS.float,
    zIndex: 999,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clinicImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    resizeMode: 'cover',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  openText: {
    fontSize: 9,
    fontWeight: '700',
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
  },
  docCountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 4,
    marginTop: 1,
  },
  docCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  listContainer: {
    padding: SPACING.md,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 10,
    gap: 10,
    ...SHADOWS.subtle,
  },
  listClinicImg: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    resizeMode: 'cover',
  },
  clinicAddressText: {
    fontSize: 10.5,
  },
  listDocCount: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  listActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  listBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  listBookBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  listDirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  listDirBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
