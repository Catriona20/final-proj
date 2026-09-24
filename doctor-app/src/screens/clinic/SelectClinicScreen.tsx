import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import {
  Building2,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ShieldCheck,
  Navigation,
  LogOut,
  Crosshair,
  Search,
  X,
  Compass,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { DoctorClinicItem, DiscoveredClinic, LocationCoords } from '../../types';
import { InteractiveMap } from '../../components/InteractiveMap';
import { ClinicSwitcherModal } from '../../components/ClinicSwitcherModal';
import { doctorLocationService, CHENNAI_PRESET_LOCATIONS, DoctorActiveLocation } from '../../services/locationService';
import { clinicApi } from '../../api/clinicApi';

interface SelectClinicScreenProps {
  navigation: any;
}

export const SelectClinicScreen: React.FC<SelectClinicScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();
  const { doctor, logout } = useDoctorAuthStore();
  const {
    availableClinics,
    allDemoClinics,
    activeClinic,
    activeClinicId,
    activeClinicName,
    fetchAuthorizedClinics,
    setActiveClinic,
    isLoading: isAuthClinicsLoading,
  } = useDoctorAppStore();

  // Location & Discovery State
  const [currentCoords, setCurrentCoords] = useState<LocationCoords>({ latitude: 13.0067, longitude: 80.2206 }); // Adyar default
  const [locationName, setLocationName] = useState('Adyar, Chennai');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Search filter for clinics
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');

  // Clinics from backend discovery
  const [discoveredClinics, setDiscoveredClinics] = useState<DiscoveredClinic[]>([]);
  const [selectedClinicCard, setSelectedClinicCard] = useState<DoctorClinicItem | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  useEffect(() => {
    initScreen();
  }, []);

  useEffect(() => {
    loadDiscoveryClinics(currentCoords);
  }, [currentCoords]);

  const initScreen = async () => {
    const clinics = await fetchAuthorizedClinics();
    if (activeClinic) {
      setSelectedClinicCard(activeClinic);
    } else if (clinics && clinics.length > 0) {
      const primary = clinics.find((c: any) => c.isPrimary) || clinics[0];
      setSelectedClinicCard(primary);
    }
    // Request initial GPS if available
    try {
      const gps = await doctorLocationService.getCurrentLocation();
      setCurrentCoords(gps);
      const geo = await doctorLocationService.reverseGeocode(gps);
      setLocationName(geo.locality || geo.name);
    } catch (e) {
      // Keep default
    }
  };

  const loadDiscoveryClinics = async (coords: LocationCoords) => {
    try {
      setIsDiscovering(true);
      const res = await clinicApi.discoverClinics({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius: 20,
      });
      const list = res.clinics || res.results || [];
      setDiscoveredClinics(list);
    } catch (e) {
      console.warn('Discovery error:', e);
    } finally {
      setIsDiscovering(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAuthorizedClinics(), loadDiscoveryClinics(currentCoords)]);
    setRefreshing(false);
  };

  const handleUseGps = async () => {
    setIsLocating(true);
    try {
      const gps = await doctorLocationService.getCurrentLocation();
      setCurrentCoords(gps);
      const geo = await doctorLocationService.reverseGeocode(gps);
      setLocationName(geo.locality || geo.name);
      setShowLocationModal(false);
    } catch (e) {
      console.warn('GPS error:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectPresetLocation = (loc: DoctorActiveLocation) => {
    setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude });
    setLocationName(loc.locality);
    setShowLocationModal(false);
  };

  const handleSelectAndProceed = async (clinic: DoctorClinicItem) => {
    // Validate doctor assignment
    const isDoctorAffiliated =
      clinic.isAssigned === true ||
      availableClinics.some((c) => c.id === clinic.id || c.name.toLowerCase() === (clinic.name || '').toLowerCase());

    if (!isDoctorAffiliated) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Doctor not assigned to ${clinic.name}.\nPlease select one of your assigned MedLink clinics.`);
      }
      return;
    }

    await setActiveClinic(clinic);
    setSelectedClinicCard(clinic);
    navigation.replace('MainTabs');
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Sign out of MedLink Doctor Workspace?') : true;
      if (confirmed) {
        await logout();
      }
    } else {
      await logout();
    }
  };

  // Filter demo clinics based on live search
  const query = clinicSearchQuery.trim().toLowerCase();
  const demoList = allDemoClinics.length > 0 ? allDemoClinics : availableClinics;

  const filteredDemoClinics = demoList.filter((item) => {
    if (!query) return true;
    const nameMatch = item.name.toLowerCase().includes(query);
    const cityMatch = (item.city || '').toLowerCase().includes(query);
    const areaMatch = (item.area || item.address || '').toLowerCase().includes(query);
    const specMatch = (item.specialization || item.department || '').toLowerCase().includes(query);
    return nameMatch || cityMatch || areaMatch || specMatch;
  });

  // Filter external discovered clinics
  const filteredDiscoveredClinics = discoveredClinics.filter((item) => {
    if (!query) return true;
    const nameMatch = item.name.toLowerCase().includes(query);
    const cityMatch = (item.city || '').toLowerCase().includes(query);
    const areaMatch = (item.area || item.address || '').toLowerCase().includes(query);
    const specMatch = (item.department || '').toLowerCase().includes(query);
    return nameMatch || cityMatch || areaMatch || specMatch;
  });

  // Combine demo clinics and discovered clinics for map markers
  const mapClinicsForMap = (): DiscoveredClinic[] => {
    const demoAsDiscovered: DiscoveredClinic[] = demoList.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address || 'Chennai',
      area: c.area || c.address || 'Chennai',
      city: c.city || 'Chennai',
      latitude: c.latitude || currentCoords.latitude,
      longitude: c.longitude || currentCoords.longitude,
      department: c.specialization || 'MedLink Clinical Facility',
      rating: 4.9,
      reviews_count: 140,
      phone: c.phone || '',
      isOpen: true,
      distance: 'MedLink Demo',
      travelTime: 'Verified Facility',
    }));

    if (discoveredClinics.length > 0) {
      return [...demoAsDiscovered, ...discoveredClinics];
    }
    return demoAsDiscovered;
  };

  const handleMarkerSelect = (clinic: DiscoveredClinic) => {
    const matchedDemo = demoList.find((c) => c.id === clinic.id);
    if (matchedDemo) {
      setSelectedClinicCard(matchedDemo);
      return;
    }

    setSelectedClinicCard({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      area: clinic.area || clinic.address,
      city: clinic.city || 'Chennai',
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      todayHours: '09:00 AM – 05:00 PM',
      status: 'External Healthcare Facility',
      waitingCount: 0,
      totalToday: 0,
      isPrimary: false,
      isAssigned: false,
    });
  };

  const displayName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Practitioner';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* TOP HEADER: GREETING & ACCOUNT LOGOUT */}
        <View style={styles.topBar}>
          <View style={styles.greetingCol}>
            <Text style={[styles.welcomeSub, { color: colors.primary }]}>DOCTOR WORKSPACE</Text>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome, {displayName}</Text>
          </View>

          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={16} color={PALETTE.error} />
            <Text style={[styles.logoutBtnText, { color: PALETTE.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE CONSULTING FACILITY SELECTOR / BANNER */}
        <View style={[styles.activeFacilityCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
          <View style={styles.activeFacilityHeader}>
            <View style={styles.activeFacilityLabelRow}>
              <Building2 size={16} color={colors.primary} />
              <Text style={[styles.activeFacilityLabel, { color: colors.primary }]}>
                {activeClinic ? 'ACTIVE CONSULTING FACILITY' : 'SELECT CONSULTING FACILITY'}
              </Text>
            </View>

            {activeClinic && (
              <View style={[styles.activeLiveBadge, { backgroundColor: PALETTE.successLight }]}>
                <View style={[styles.activeLiveDot, { backgroundColor: PALETTE.success }]} />
                <Text style={[styles.activeLiveBadgeText, { color: PALETTE.success }]}>CONNECTED</Text>
              </View>
            )}
          </View>

          {activeClinic ? (
            <View style={styles.activeFacilityBody}>
              <Text style={[styles.activeFacilityName, { color: colors.text }]}>{activeClinic.name}</Text>
              <View style={styles.activeFacilityLocationRow}>
                <MapPin size={13} color={colors.secondaryText} />
                <Text style={[styles.activeFacilityLocationText, { color: colors.secondaryText }]}>
                  {activeClinic.area || activeClinic.address || 'Chennai'}
                  {activeClinic.city ? `, ${activeClinic.city}` : ''}
                </Text>
              </View>

              <View style={styles.activeFacilityActionRow}>
                <TouchableOpacity
                  onPress={() => navigation.replace('MainTabs')}
                  style={[styles.openActiveDashboardBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openActiveDashboardBtnText}>Open Dashboard</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSwitchModalVisible(true)}
                  style={[styles.changeActiveBtn, { borderColor: colors.border, backgroundColor: colors.cardSubtle }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.changeActiveBtnText, { color: colors.text }]}>Change Clinic ▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.activeFacilityBody}>
              <Text style={[styles.noActiveClinicPrompt, { color: colors.text }]}>
                No consulting facility currently active.
              </Text>
              <Text style={[styles.noActiveClinicSub, { color: colors.secondaryText }]}>
                Select an authorized MedLink demo clinic below to load its live OPD queue, appointments, and patient charts.
              </Text>
            </View>
          )}
        </View>

        {/* LIVE SEARCH FOR CLINICS */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Search size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search clinics by name, locality, or specialty..."
            placeholderTextColor={colors.secondaryText}
            value={clinicSearchQuery}
            onChangeText={setClinicSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {clinicSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setClinicSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* PRACTICE LOCATION / ZONE BAR */}
        <View style={[styles.locationBar, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.locationInfoCol}>
            <View style={styles.locationLabelRow}>
              <Crosshair size={13} color={colors.primary} />
              <Text style={[styles.locationLabelText, { color: colors.primary }]}>PRACTICE LOCATION</Text>
            </View>
            <Text style={[styles.locationNameText, { color: colors.text }]} numberOfLines={1}>
              📍 {locationName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowLocationModal(true)}
            style={[styles.changeLocBtn, { backgroundColor: colors.cardSubtle }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.changeLocText, { color: colors.primary }]}>Change Area</Text>
          </TouchableOpacity>
        </View>

        {/* INTERACTIVE CHENNAI HEALTHCARE MAP */}
        <View style={styles.mapContainer}>
          <InteractiveMap
            clinics={mapClinicsForMap()}
            selectedClinicId={selectedClinicCard?.id || null}
            onSelectClinic={handleMarkerSelect}
            centerCoords={currentCoords}
            showRoute={true}
          />
        </View>

        {/* ============================================================ */}
        {/* SECTION 1: MEDLINK DEMO CLINICS (SHOWN FIRST) */}
        {/* ============================================================ */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleCol}>
            <View style={styles.sectionTitleRow}>
              <ShieldCheck size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                MEDLINK DEMO CLINICS ({filteredDemoClinics.length})
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
              Official MedLink platform demo network • Full OPD queue & EHR integration
            </Text>
          </View>
        </View>

        <View style={styles.clinicsList}>
          {filteredDemoClinics.map((item) => {
            const isSelected = selectedClinicCard?.id === item.id;
            const isActiveClinic = activeClinicId === item.id;
            const isDoctorAffiliated =
              item.isAssigned === true ||
              availableClinics.some((c) => c.id === item.id || c.name.toLowerCase() === item.name.toLowerCase());

            const clinicPayload: DoctorClinicItem = {
              id: item.id,
              name: item.name,
              address: item.address || '',
              area: item.area || item.address || '',
              city: item.city || 'Chennai',
              latitude: item.latitude || currentCoords.latitude,
              longitude: item.longitude || currentCoords.longitude,
              todayHours: item.todayHours || '09:00 AM – 05:00 PM',
              status: item.status || 'Running on time',
              waitingCount: item.waitingCount || 0,
              totalToday: item.totalToday || 0,
              isPrimary: item.isPrimary || false,
              isAssigned: isDoctorAffiliated,
              specialization: item.specialization || item.department || 'General Medicine',
            };

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedClinicCard(clinicPayload)}
                style={[
                  styles.clinicCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActiveClinic
                      ? PALETTE.success
                      : isSelected
                      ? PALETTE.accent
                      : isDoctorAffiliated
                      ? colors.border
                      : colors.border + '60',
                    borderWidth: isActiveClinic || isSelected ? 2 : 1.5,
                  },
                  SHADOWS.medium,
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.clinicTitleCol}>
                    <View style={styles.clinicTitleRow}>
                      <Text style={[styles.clinicName, { color: colors.text }]}>{item.name}</Text>
                      {isDoctorAffiliated ? (
                        <View style={[styles.affiliatedTag, { backgroundColor: colors.primary }]}>
                          <Text style={styles.affiliatedTagText}>MY CLINIC</Text>
                        </View>
                      ) : (
                        <View style={[styles.notAssignedTag, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                          <Text style={[styles.notAssignedTagText, { color: colors.secondaryText }]}>NOT ASSIGNED</Text>
                        </View>
                      )}

                      {isActiveClinic && (
                        <View style={[styles.activePillTag, { backgroundColor: PALETTE.successLight }]}>
                          <Text style={[styles.activePillTagText, { color: PALETTE.success }]}>ACTIVE</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.locationRow}>
                      <MapPin size={13} color={colors.secondaryText} />
                      <Text style={[styles.areaText, { color: colors.secondaryText }]}>
                        {item.area || item.address}
                        {item.city ? `, ${item.city}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* METRICS & SPECIALTY */}
                <View style={[styles.hoursBox, { backgroundColor: colors.cardSubtle }]}>
                  <View style={styles.hoursRow}>
                    <Clock size={13} color={colors.secondaryText} />
                    <Text style={[styles.hoursVal, { color: colors.text }]}>
                      {item.todayHours || '09:00 AM – 05:00 PM'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.statusPillText, { color: colors.primary }]}>
                      {item.specialization || item.department || 'Clinical Practice'}
                    </Text>
                  </View>
                </View>

                {/* BOTTOM ACTION */}
                <View style={styles.cardFooter}>
                  <View style={styles.queueCountRow}>
                    <Users size={14} color={PALETTE.warning} />
                    <Text style={[styles.queueCountText, { color: colors.text }]}>
                      {item.waitingCount || 0} waiting
                    </Text>
                  </View>

                  {isDoctorAffiliated ? (
                    <TouchableOpacity
                      onPress={() => handleSelectAndProceed(clinicPayload)}
                      style={[
                        styles.enterBtn,
                        {
                          backgroundColor: isActiveClinic
                            ? PALETTE.success
                            : isSelected
                            ? PALETTE.accent
                            : colors.primary,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.enterBtnText}>
                        {isActiveClinic ? 'Open Dashboard' : 'Select Clinic'}
                      </Text>
                      <ChevronRight size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.notAssignedBtn}>
                      <Text style={[styles.notAssignedBtnText, { color: colors.secondaryText }]}>
                        Doctor not assigned
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredDemoClinics.length === 0 && (
            <View style={[styles.emptySearchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={22} color={colors.secondaryText} />
              <Text style={[styles.emptySearchText, { color: colors.text }]}>
                No MEDLINK demo clinics matched "{clinicSearchQuery}"
              </Text>
              <TouchableOpacity onPress={() => setClinicSearchQuery('')} style={styles.resetSearchBtn}>
                <Text style={[styles.resetSearchBtnText, { color: colors.primary }]}>Reset Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* SECTION 2: REAL / NEARBY HEALTHCARE FACILITIES */}
        {/* ============================================================ */}
        <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
          <View style={styles.sectionHeaderTitleCol}>
            <View style={styles.sectionTitleRow}>
              <Building2 size={18} color={colors.secondaryText} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                NEARBY HEALTHCARE FACILITIES ({filteredDiscoveredClinics.length})
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
              Real external healthcare facilities discovered around {locationName} • Discovery view only
            </Text>
          </View>
        </View>

        {isDiscovering && discoveredClinics.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.secondaryText }]}>
              Discovering Chennai healthcare facilities around {locationName}...
            </Text>
          </View>
        ) : (
          <View style={styles.clinicsList}>
            {filteredDiscoveredClinics.map((item: any) => {
              return (
                <View
                  key={item.id}
                  style={[
                    styles.clinicCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                    SHADOWS.light,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.clinicTitleCol}>
                      <View style={styles.clinicTitleRow}>
                        <Text style={[styles.clinicName, { color: colors.text }]}>{item.name}</Text>
                        <View style={[styles.externalFacilityTag, { backgroundColor: colors.cardSubtle }]}>
                          <Text style={[styles.externalFacilityTagText, { color: colors.secondaryText }]}>
                            EXTERNAL FACILITY
                          </Text>
                        </View>
                      </View>
                      <View style={styles.locationRow}>
                        <MapPin size={13} color={colors.secondaryText} />
                        <Text style={[styles.areaText, { color: colors.secondaryText }]}>
                          {item.area || item.address}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* METRICS & HOURS */}
                  <View style={[styles.hoursBox, { backgroundColor: colors.cardSubtle }]}>
                    <View style={styles.hoursRow}>
                      <Navigation size={13} color={colors.secondaryText} />
                      <Text style={[styles.hoursVal, { color: colors.text }]}>
                        {item.distance || '1.2 km'} • {item.travelTime || '4 min drive'}
                      </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: colors.primary + '10' }]}>
                      <Text style={[styles.statusPillText, { color: colors.secondaryText }]}>
                        {item.department || 'Healthcare Facility'}
                      </Text>
                    </View>
                  </View>

                  {/* DISCOVERY ONLY FOOTER */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.discoveryOnlyNote, { color: colors.secondaryText }]}>
                      Discovery record • No operational MedLink queue
                    </Text>

                    <View style={[styles.discoveryBadge, { backgroundColor: colors.cardSubtle }]}>
                      <Text style={[styles.discoveryBadgeText, { color: colors.secondaryText }]}>
                        External
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredDiscoveredClinics.length === 0 && (
              <View style={[styles.emptySearchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.emptySearchText, { color: colors.secondaryText }]}>
                  No nearby facilities matched "{clinicSearchQuery}"
                </Text>
              </View>
            )}
          </View>
        )}

        {/* VERIFICATION FOOTER */}
        <View style={[styles.verificationFooter, { backgroundColor: colors.cardSubtle }]}>
          <ShieldCheck size={16} color={PALETTE.success} />
          <Text style={[styles.verificationFooterText, { color: colors.secondaryText }]}>
            Verified Practitioner • Reg #{doctor?.registration_number || 'TN-MED-COUNCIL'}
          </Text>
        </View>
      </ScrollView>

      {/* CLINIC SWITCHER POPUP MODAL */}
      <ClinicSwitcherModal visible={switchModalVisible} onClose={() => setSwitchModalVisible(false)} />

      {/* LOCATION SWITCHER MODAL */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }, SHADOWS.medium]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Compass size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>SELECT PRACTICE LOCATION</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* USE GPS BUTTON */}
            <TouchableOpacity
              onPress={handleUseGps}
              disabled={isLocating}
              style={[styles.gpsBtn, { backgroundColor: colors.primary + '15' }]}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Crosshair size={18} color={colors.primary} />
                  <Text style={[styles.gpsBtnText, { color: colors.primary }]}>Use Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

            {/* SEARCH AREA INPUT */}
            <View style={[styles.modalSearchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Search size={16} color={colors.secondaryText} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.text }]}
                placeholder="Search Chennai localities (e.g. OMR, Velachery)..."
                placeholderTextColor={colors.secondaryText}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
            </View>

            <Text style={[styles.presetHeading, { color: colors.secondaryText }]}>CHENNAI HEALTHCARE ZONES</Text>

            <ScrollView style={styles.presetList}>
              {doctorLocationService.searchLocations(locationSearch).map((preset) => {
                const isCurrent = locationName.includes(preset.name);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => handleSelectPresetLocation(preset)}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: isCurrent ? colors.primary + '12' : colors.cardSubtle,
                        borderColor: isCurrent ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetTextCol}>
                      <Text style={[styles.presetName, { color: isCurrent ? colors.primary : colors.text }]}>
                        {preset.name}
                      </Text>
                      <Text style={[styles.presetLocality, { color: colors.secondaryText }]}>{preset.locality}</Text>
                    </View>
                    {isCurrent && <Text style={[styles.activeTag, { color: colors.primary }]}>Active</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  greetingCol: {
    flex: 1,
  },
  welcomeSub: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 2,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF444415',
  },
  logoutBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  activeFacilityCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  activeFacilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeFacilityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFacilityLabel: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  activeLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeLiveBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.5,
  },
  activeFacilityBody: {
    marginTop: 2,
  },
  activeFacilityName: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading - 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  activeFacilityLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  activeFacilityLocationText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  activeFacilityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  openActiveDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  openActiveDashboardBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  changeActiveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  changeActiveBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  noActiveClinicPrompt: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 4,
  },
  noActiveClinicSub: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  clearSearchBtn: {
    padding: 4,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  locationInfoCol: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationLabelText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  locationNameText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  changeLocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeLocText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  mapContainer: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeaderTitleCol: {
    gap: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary - 1,
    marginTop: 2,
  },
  loaderBox: {
    padding: 30,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: TYPOGRAPHY.sizes.body,
    textAlign: 'center',
  },
  clinicsList: {
    gap: 14,
    marginBottom: 20,
  },
  clinicCard: {
    borderRadius: 18,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clinicTitleCol: {
    flex: 1,
  },
  clinicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  clinicName: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading - 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  affiliatedTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  affiliatedTagText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  notAssignedTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  notAssignedTagText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  activePillTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillTagText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  externalFacilityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  externalFacilityTagText: {
    fontSize: TYPOGRAPHY.sizes.micro - 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  areaText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hoursVal: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueCountText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enterBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  notAssignedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  notAssignedBtnText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  discoveryOnlyNote: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontStyle: 'italic',
    flex: 1,
  },
  discoveryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discoveryBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptySearchBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  emptySearchText: {
    fontSize: TYPOGRAPHY.sizes.body,
    textAlign: 'center',
  },
  resetSearchBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetSearchBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  verificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
  },
  verificationFooterText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 47, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  gpsBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  presetHeading: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetList: {
    maxHeight: 280,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  presetTextCol: {
    flex: 1,
  },
  presetName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  presetLocality: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  activeTag: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

