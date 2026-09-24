import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { Search, User, Calendar, Droplet, ChevronRight } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorPatientStore } from '../../store/useDoctorPatientStore';
import { EmptyState } from '../../components/EmptyState';

interface DoctorPatientsScreenProps {
  navigation: any;
}

export const DoctorPatientsScreen: React.FC<DoctorPatientsScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { patients, fetchPatients, searchQuery, setSearchQuery, isLoading } = useDoctorPatientStore();

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* SEARCH BAR */}
        <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search patient name, phone, or ID..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* PATIENTS DIRECTORY LIST */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPatients} tintColor={colors.primary} />}
        >
          {patients.map((pat) => (
            <TouchableOpacity
              key={pat.id}
              onPress={() => navigation.navigate('DoctorPatientDetail', { patientId: pat.id })}
              style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    pat.avatar ||
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                }}
                style={styles.avatar}
              />

              <View style={styles.patientInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.patientName, { color: colors.text }]}>{pat.name}</Text>
                  {pat.blood_group && (
                    <View style={[styles.bloodBadge, { backgroundColor: PALETTE.errorLight }]}>
                      <Droplet size={11} color={PALETTE.error} />
                      <Text style={[styles.bloodText, { color: PALETTE.error }]}>{pat.blood_group}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.patientDemographics, { color: colors.secondaryText }]}>
                  {pat.gender || 'Female'} • {pat.age || 29} yrs • {pat.phone}
                </Text>

                {pat.lastReason && (
                  <Text style={[styles.lastReason, { color: colors.text }]} numberOfLines={1}>
                    Last visit: {pat.lastReason} ({pat.lastVisitDate})
                  </Text>
                )}
              </View>

              <ChevronRight size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          ))}

          {patients.length === 0 && !isLoading && (
            <EmptyState
              icon={User}
              title="No Patient Records"
              description="Patients consulting with you will automatically appear in your authorized clinical directory."
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  listContent: {
    paddingBottom: 30,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  patientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  bloodText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  patientDemographics: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  lastReason: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 4,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
