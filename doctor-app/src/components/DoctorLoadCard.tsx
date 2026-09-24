import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Users, Activity } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { DoctorLoadItem } from '../types';

interface DoctorLoadCardProps {
  item: DoctorLoadItem;
}

export const DoctorLoadCard: React.FC<DoctorLoadCardProps> = ({ item }) => {
  const { colors } = useThemeStore();

  const getLoadBadge = (load: 'Low' | 'Moderate' | 'High') => {
    switch (load) {
      case 'High':
        return { bg: PALETTE.errorLight, text: PALETTE.error };
      case 'Moderate':
        return { bg: PALETTE.warningLight, text: '#B45309' };
      case 'Low':
        return { bg: PALETTE.successLight, text: PALETTE.success };
    }
  };

  const loadStyle = getLoadBadge(item.currentLoad);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image
        source={{
          uri:
            item.avatar ||
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
        }}
        style={styles.avatar}
      />

      <View style={styles.infoCol}>
        <Text style={[styles.name, { color: colors.text }]}>{item.doctorName}</Text>
        <Text style={[styles.specialization, { color: colors.secondaryText }]}>{item.specialization}</Text>
        <View style={styles.waitingRow}>
          <Users size={12} color={colors.secondaryText} />
          <Text style={[styles.waitingText, { color: colors.secondaryText }]}>
            {item.patientsWaiting} {item.patientsWaiting === 1 ? 'patient' : 'patients'} waiting
          </Text>
        </View>
      </View>

      <View style={[styles.loadBadge, { backgroundColor: loadStyle.bg }]}>
        <Text style={[styles.loadText, { color: loadStyle.text }]}>{item.currentLoad} Load</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  specialization: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 1,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  waitingText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  loadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loadText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
});
