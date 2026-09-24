import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  Search,
  MapPin,
  Building2,
  Navigation,
  Check,
  ChevronRight,
  Crosshair,
  Compass,
  X,
  Layers,
} from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { clinicApi } from '../../api/clinicApi';
import { DiscoveredClinic, LocationCoords } from '../../types';
import { InteractiveMap } from '../../components/InteractiveMap';
import { doctorLocationService, CHENNAI_PRESET_LOCATIONS, DoctorActiveLocation } from '../../services/locationService';

interface DoctorMapScreenProps {
  navigation: any;
}

export const DoctorMapScreen: React.FC<DoctorMapScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { activeClinicId, availableClinics, setActiveClinic } = useDoctorAppStore();

  // Location & Discovery State
  const [currentCoords, setCurrentCoords] = useState<LocationCoords>({ latitude: 13.0067, longitude: 80.2206 }); // Adyar
  const [locationName, setLocationName] = useState('Adyar, Chennai');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [discoveryMode, setDiscoveryMode] = useState<'NEARBY' | 'CHENNAI_WIDE'>('NEARBY');

  const [clinics, setClinics] = useState<DiscoveredClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<DiscoveredClinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const filters = [
    { key: 'ALL', label: 'All Clinics' },
    { key: 'MY_CLINICS', label: 'My Clinics' },
    { key: 'Dentistry', label: 'Dentistry' },
    { key: 'General Medicine', label: 'General Medicine' },
    { key: 'Cardiology', label: 'Cardiology' },
    { key: 'Dermatology', label: 'Dermatology' },
    { key: 'Ophthalmology', label: 'Ophthalmology' },
    { key: 'Orthopedics', label: 'Orthopedics' },
  ];

  useEffect(() => {
    initLocation();
  }, []);

  useEffect(() => {
    fetchMapClinics();
  }, [searchQuery, selectedFilter, currentCoords, discoveryMode]);

  const initLocation = async () => {
    try {
      const gps = await doctorLocationService.getCurrentLocation();
      setCurrentCoords(gps);
      const geo = await doctorLocationService.reverseGeocode(gps);
      setLocationName(geo.locality || geo.name);
    } catch (e) {
      // Keep Adyar default
    }
  };

  const fetchMapClinics = async () => {
    try {
      setIsLoading(true);
      const deptParam =
        selectedFilter !== 'ALL' && selectedFilter !== 'MY_CLINICS' ? selectedFilter : undefined;
      const radiusParam = discoveryMode === 'NEARBY' ? 12 : 35;

      const res = await clinicApi.discoverClinics({
        query: searchQuery,
        department: deptParam,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        radius: radiusParam,
      });

      let list = res.clinics || res.results || [];

      if (selectedFilter === 'MY_CLINICS') {
        const myIds = availableClinics.map((c) => c.id);
        const myNames = availableClinics.map((c) => c.name.toLowerCase());
        list = list.filter((c) => myIds.includes(c.id) || myNames.some((n) => c.name.toLowerCase().includes(n)));
      }

      setClinics(list);
      if (list.length > 0) {
        setSelectedClinic(list[0]);
      }
    } catch (e) {
      console.warn('Failed to discover map clinics:', e);
    } finally {
      setIsLoading(false);
    }
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

  const handleSelectActiveClinic = async (clinic: DiscoveredClinic) => {
    await setActiveClinic({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      area: clinic.area || clinic.address,
      city: clinic.city || 'Chennai',
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      todayHours: '09:00 AM – 05:00 PM',
      status: 'Running on time',
      waitingCount: 0,
      totalToday: 0,
      isPrimary: false,
    });
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* TOP SEARCH & LOCATION BAR */}
        <View style={styles.topControlContainer}>
          <View style={[styles.searchHeader, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
            <Search size={18} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search Chennai clinics, hospitals or areas..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* LOCATION STATUS & SWITCHER ROW */}
          <View style={styles.locationMetaRow}>
            <TouchableOpacity
              onPress={() => setShowLocationModal(true)}
              style={[styles.locationChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Crosshair size={13} color={colors.primary} />
              <Text style={[styles.locationChipText, { color: colors.text }]} numberOfLines={1}>
                {locationName}
              </Text>
              <Text style={[styles.changeText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>

            {/* NEARBY vs CHENNAI-WIDE TOGGLE */}
            <View style={[styles.modeToggle, { backgroundColor: colors.cardSubtle }]}>
              <TouchableOpacity
                onPress={() => setDiscoveryMode('NEARBY')}
                style={[
                  styles.modeBtn,
                  discoveryMode === 'NEARBY' && [styles.modeBtnActive, { backgroundColor: colors.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: discoveryMode === 'NEARBY' ? '#FFFFFF' : colors.secondaryText },
                  ]}
                >
                  Nearby
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDiscoveryMode('CHENNAI_WIDE')}
                style={[
                  styles.modeBtn,
                  discoveryMode === 'CHENNAI_WIDE' && [styles.modeBtnActive, { backgroundColor: colors.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: discoveryMode === 'CHENNAI_WIDE' ? '#FFFFFF' : colors.secondaryText },
                  ]}
                >
                  Chennai-Wide
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CATEGORY FILTER CHIPS */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map((f) => {
              const isActive = selectedFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setSelectedFilter(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : colors.text }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* REAL LEAFLET MAP RENDERING PORT */}
        <View style={styles.mapWrapper}>
          <InteractiveMap
            clinics={clinics}
            selectedClinicId={selectedClinic?.id || null}
            onSelectClinic={setSelectedClinic}
            centerCoords={currentCoords}
            showRoute={true}
          />
        </View>

        {/* BOTTOM SHEET CLINIC DETAILS */}
        {selectedClinic && (
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.medium]}>
            <View style={styles.sheetTopRow}>
              <View style={styles.sheetTitleCol}>
                <View style={styles.sheetBadgeRow}>
                  <Text style={[styles.sheetClinicName, { color: colors.text }]} numberOfLines={1}>
                    {selectedClinic.name}
                  </Text>
                  {availableClinics.some((c) => c.id === selectedClinic.id || c.name.toLowerCase() === selectedClinic.name.toLowerCase()) && (
                    <View style={[styles.myClinicBadge, { backgroundColor: PALETTE.accent }]}>
                      <Text style={styles.myClinicBadgeText}>MY CLINIC</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sheetAddress, { color: colors.secondaryText }]}>
                  {selectedClinic.area || selectedClinic.address}
                </Text>
              </View>

              <View style={[styles.openBadge, { backgroundColor: PALETTE.successLight }]}>
                <Text style={[styles.openText, { color: PALETTE.success }]}>Open</Text>
              </View>
            </View>

            <View style={styles.sheetMetaRow}>
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                  {selectedClinic.distance || '2.4 km'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Navigation size={13} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                  {selectedClinic.travelTime || '8 min'}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Building2 size={13} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                  {selectedClinic.department || 'Healthcare Facility'}
                </Text>
              </View>
            </View>

            {selectedClinic.id !== activeClinicId ? (
              <TouchableOpacity
                onPress={() => handleSelectActiveClinic(selectedClinic)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>Select as Active Clinic</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={[styles.activeStatusBanner, { backgroundColor: PALETTE.accent + '15' }]}>
                <Check size={16} color={PALETTE.accent} />
                <Text style={[styles.activeStatusText, { color: PALETTE.accent }]}>Currently Active Consulting Clinic</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* LOCATION SWITCHER MODAL */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }, SHADOWS.medium]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Compass size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>CHANGE DISCOVERY LOCATION</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

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
                  <Text style={[styles.gpsBtnText, { color: colors.primary }]}>Use My Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

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
  container: {
    flex: 1,
  },
  topControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationChipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  changeText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeBtnActive: {},
  modeBtnText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  filtersWrapper: {
    maxHeight: 42,
    marginVertical: 8,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  mapWrapper: {
    flex: 1,
  },
  bottomSheet: {
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetClinicName: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading - 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    maxWidth: 220,
  },
  myClinicBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myClinicBadgeText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  sheetAddress: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  activeStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeStatusText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
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
