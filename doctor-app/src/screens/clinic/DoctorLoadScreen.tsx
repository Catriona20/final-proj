import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Users, Activity, Building2 } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAppStore } from '../../store/useDoctorAppStore';
import { DoctorLoadCard } from '../../components/DoctorLoadCard';

interface DoctorLoadScreenProps {
  navigation: any;
}

export const DoctorLoadScreen: React.FC<DoctorLoadScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { activeClinicName, doctorLoad, fetchDoctorLoad, isLoading } = useDoctorAppStore();

  useEffect(() => {
    fetchDoctorLoad();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: colors.text }]}>Adaptive Doctor Load</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{activeClinicName}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Activity size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Real-time OPD practitioner load balancing for adaptive appointment distribution across clinic doctors.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {doctorLoad.map((item) => (
              <DoctorLoadCard key={item.doctorId} item={item} />
            ))}
          </ScrollView>
        )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    padding: 6,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 30,
  },
});
