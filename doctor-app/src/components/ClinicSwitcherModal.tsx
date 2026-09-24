import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Building2, Check, X, MapPin, Users, Clock, Search, ShieldCheck, Map } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { useDoctorAppStore } from '../store/useDoctorAppStore';
import { DoctorClinicItem } from '../types';

interface ClinicSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ClinicSwitcherModal: React.FC<ClinicSwitcherModalProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { activeClinicId, availableClinics, allDemoClinics, setActiveClinic } = useDoctorAppStore();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectClinic = async (clinic: DoctorClinicItem) => {
    const isAssigned =
      clinic.isAssigned === true ||
      availableClinics.some((c) => c.id === clinic.id || c.name.toLowerCase() === (clinic.name || '').toLowerCase());

    if (!isAssigned) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Doctor not assigned to ${clinic.name}.\nPlease select one of your assigned MedLink clinics.`);
      }
      return;
    }

    await setActiveClinic(clinic);
    onClose();
  };

  const handleOpenDirectory = () => {
    onClose();
    navigation.navigate('SelectClinic');
  };

  // Demo clinics to display
  const demoList = allDemoClinics.length > 0 ? allDemoClinics : availableClinics;
  const query = searchQuery.trim().toLowerCase();

  const filteredClinics = demoList.filter((item) => {
    if (!query) return true;
    const nameMatch = item.name.toLowerCase().includes(query);
    const cityMatch = (item.city || '').toLowerCase().includes(query);
    const areaMatch = (item.area || item.address || '').toLowerCase().includes(query);
    const specMatch = (item.specialization || item.department || '').toLowerCase().includes(query);
    return nameMatch || cityMatch || areaMatch || specMatch;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }, SHADOWS.medium]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Building2 size={22} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>SELECT CONSULTING CLINIC</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <X size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDescription, { color: colors.secondaryText }]}>
            Switch your active consulting clinic to load its independent live queue, schedule, and patient records.
          </Text>

          {/* SEARCH FIELD */}
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Search size={16} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search demo clinics (e.g. Apollo, Moon, Heart, OMR)..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={15} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* SECTION HEADER */}
          <View style={styles.sectionHeaderRow}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.sectionHeadingText, { color: colors.secondaryText }]}>
              MEDLINK DEMO CLINICS ({filteredClinics.length})
            </Text>
          </View>

          <ScrollView style={styles.clinicList} keyboardShouldPersistTaps="handled">
            {filteredClinics.map((item) => {
              const isSelected = item.id === activeClinicId;
              const isAssigned =
                item.isAssigned === true ||
                availableClinics.some((c) => c.id === item.id || c.name.toLowerCase() === (item.name || '').toLowerCase());

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectClinic(item)}
                  disabled={!isAssigned}
                  style={[
                    styles.clinicItem,
                    {
                      backgroundColor: isSelected
                        ? colors.primary + '14'
                        : isAssigned
                        ? colors.cardSubtle
                        : colors.cardSubtle + '60',
                      borderColor: isSelected
                        ? colors.primary
                        : isAssigned
                        ? colors.border
                        : colors.border + '50',
                      opacity: isAssigned ? 1 : 0.65,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.clinicInfo}>
                    <View style={styles.nameRow}>
                      {isSelected && <Text style={[styles.checkPrefix, { color: colors.primary }]}>✓ </Text>}
                      <Text
                        style={[
                          styles.clinicName,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '800' : '700',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>

                      {isAssigned ? (
                        <View style={[styles.myClinicTag, { backgroundColor: colors.primary }]}>
                          <Text style={styles.myClinicTagText}>MY CLINIC</Text>
                        </View>
                      ) : (
                        <View style={[styles.unassignedTag, { backgroundColor: colors.border }]}>
                          <Text style={[styles.unassignedTagText, { color: colors.secondaryText }]}>NOT ASSIGNED</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.locationRow}>
                      <MapPin size={12} color={colors.secondaryText} />
                      <Text style={[styles.clinicAddress, { color: colors.secondaryText }]}>
                        {item.area || item.address}
                        {item.city ? `, ${item.city}` : ''}
                        {item.specialization ? ` • ${item.specialization}` : ''}
                      </Text>
                    </View>

                    {isAssigned ? (
                      <View style={styles.hoursMetaRow}>
                        <View style={styles.metaBadge}>
                          <Clock size={11} color={colors.secondaryText} />
                          <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                            {item.todayHours || '09:00 AM – 05:00 PM'}
                          </Text>
                        </View>

                        <View style={styles.metaBadge}>
                          <Users size={11} color={PALETTE.warning} />
                          <Text style={[styles.metaText, { color: PALETTE.warning }]}>
                            {item.waitingCount || 0} waiting
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.notAssignedWarning, { color: colors.secondaryText }]}>
                        Doctor not assigned to this clinic
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <View style={[styles.selectedCheckCircle, { backgroundColor: colors.primary }]}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {filteredClinics.length === 0 && (
              <View style={styles.emptySearchBox}>
                <Text style={[styles.emptySearchText, { color: colors.secondaryText }]}>
                  No demo clinics matched "{searchQuery}"
                </Text>
              </View>
            )}
          </ScrollView>

          {/* EXPLORE DIRECTORY BUTTON */}
          <TouchableOpacity onPress={handleOpenDirectory} style={[styles.directoryBtn, { backgroundColor: colors.cardSubtle }]} activeOpacity={0.8}>
            <Map size={16} color={colors.primary} />
            <Text style={[styles.directoryBtnText, { color: colors.primary }]}>
              Explore Full Facility Directory & Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 47, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading - 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 6,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  clearSearchBtn: {
    padding: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeadingText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    letterSpacing: 0.8,
  },
  clinicList: {
    maxHeight: 360,
    marginBottom: 12,
  },
  clinicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  clinicInfo: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkPrefix: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  clinicName: {
    fontSize: TYPOGRAPHY.sizes.body,
  },
  myClinicTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  myClinicTagText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.micro - 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  unassignedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  unassignedTagText: {
    fontSize: TYPOGRAPHY.sizes.micro - 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clinicAddress: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  hoursMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  notAssignedWarning: {
    fontSize: TYPOGRAPHY.sizes.micro + 1,
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  directoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  directoryBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

