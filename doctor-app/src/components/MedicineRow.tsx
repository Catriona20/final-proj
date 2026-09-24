import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2, Pill } from 'lucide-react-native';
import { PrescriptionMedicine } from '../types';
import { PALETTE, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface MedicineRowProps {
  medicine: PrescriptionMedicine;
  index: number;
  onRemove: (index: number) => void;
}

export const MedicineRow: React.FC<MedicineRowProps> = ({ medicine, index, onRemove }) => {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <Pill size={14} color={colors.primary} />
          </View>
          <Text style={[styles.medicineName, { color: colors.text }]}>
            {index + 1}. {medicine.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onRemove(index)}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={PALETTE.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.specsRow}>
        <View style={[styles.specBadge, { backgroundColor: colors.card }]}>
          <Text style={[styles.specLabel, { color: colors.secondaryText }]}>Dose: </Text>
          <Text style={[styles.specValue, { color: colors.text }]}>{medicine.dosage}</Text>
        </View>

        <View style={[styles.specBadge, { backgroundColor: colors.card }]}>
          <Text style={[styles.specLabel, { color: colors.secondaryText }]}>Freq: </Text>
          <Text style={[styles.specValue, { color: colors.primary }]}>{medicine.frequency}</Text>
        </View>

        <View style={[styles.specBadge, { backgroundColor: colors.card }]}>
          <Text style={[styles.specLabel, { color: colors.secondaryText }]}>For: </Text>
          <Text style={[styles.specValue, { color: colors.text }]}>{medicine.duration}</Text>
        </View>
      </View>

      {medicine.instructions && (
        <Text style={[styles.instructions, { color: colors.secondaryText }]}>
          ⚠️ {medicine.instructions}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  deleteBtn: {
    padding: 4,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  specLabel: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  specValue: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  instructions: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 4,
  },
});
