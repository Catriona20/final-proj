import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Search, Calendar } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { AppointmentCard } from '../../components/AppointmentCard';
import { EmptyState } from '../../components/EmptyState';
import { Appointment } from '../../types';

interface DoctorAppointmentsScreenProps {
  navigation: any;
}

export const DoctorAppointmentsScreen: React.FC<DoctorAppointmentsScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { appointments, upcomingAppointments, fetchTodayAppointments, fetchUpcomingAppointments, isLoading } = useDoctorAppStore();

  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'NOSHOW'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodayAppointments(), fetchUpcomingAppointments()]);
    setRefreshing(false);
  };

  const handleStartConsultation = (appointment: Appointment) => {
    navigation.navigate('Consultation', {
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patient_name || 'Patient',
      appointment,
    });
  };

  const handleViewPatient = (patientId: string) => {
    navigation.navigate('DoctorPatientDetail', { patientId });
  };

  const tabs = [
    { key: 'TODAY', label: 'Today', count: appointments.filter((a) => !['Cancelled', 'No-show', 'NO_SHOW'].includes(a.status)).length },
    { key: 'UPCOMING', label: 'Upcoming', count: upcomingAppointments.length },
    { key: 'COMPLETED', label: 'Completed', count: appointments.filter((a) => a.status === 'Completed').length },
    { key: 'CANCELLED', label: 'Cancelled', count: appointments.filter((a) => a.status === 'Cancelled').length },
    { key: 'NOSHOW', label: 'No-show', count: appointments.filter((a) => a.status === 'No-show' || a.status === 'NO_SHOW').length },
  ];

  const sourceList = activeTab === 'UPCOMING' ? upcomingAppointments : appointments;

  const filteredAppointments = sourceList.filter((apt) => {
    if (activeTab === 'TODAY' && ['Cancelled', 'No-show', 'NO_SHOW'].includes(apt.status)) return false;
    if (activeTab === 'COMPLETED' && apt.status !== 'Completed') return false;
    if (activeTab === 'CANCELLED' && apt.status !== 'Cancelled') return false;
    if (activeTab === 'NOSHOW' && apt.status !== 'No-show' && apt.status !== 'NO_SHOW') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        apt.patient_name?.toLowerCase().includes(q) ||
        apt.doctor_name?.toLowerCase().includes(q) ||
        apt.reason?.toLowerCase().includes(q) ||
        apt.token_number?.toLowerCase().includes(q) ||
        apt.treatmentRequirement?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* TOP SEARCH BAR */}
        <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search patient name, treatment, or token..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : colors.text }]}>{tab.label}</Text>
                <View style={[styles.tabCountBadge, { backgroundColor: isActive ? '#FFFFFF30' : colors.cardSubtle }]}>
                  <Text style={[styles.tabCountText, { color: isActive ? '#FFFFFF' : colors.secondaryText }]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* APPOINTMENTS LIST */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {filteredAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onViewPatient={handleViewPatient}
              onStartConsultation={handleStartConsultation}
              onPressCard={() => handleViewPatient(apt.patient_id)}
            />
          ))}

          {filteredAppointments.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="NO APPOINTMENTS"
              description="No appointments are scheduled for this clinic under the selected filter."
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  tabsRow: {
    maxHeight: 44,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabCountText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  listContent: {
    paddingBottom: 30,
  },
});
