import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { History, FileText, ChevronRight, User, Calendar } from 'lucide-react-native';
import { PreviousVisitInfo } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface PreviousVisitCardProps {
  visitInfo: PreviousVisitInfo;
  onContinueDoctor?: () => void;
}

export const PreviousVisitCard: React.FC<PreviousVisitCardProps> = ({
  visitInfo,
  onContinueDoctor,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#0F2557' : '#EFF6FF',
          borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconPill, { backgroundColor: theme.primary }]}>
          <History size={13} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: theme.primary }]}>
          Your Previous Visits ({visitInfo.count})
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Calendar size={11} color={theme.textMuted} />
          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Last visit:</Text>
          <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{visitInfo.lastDate}</Text>
        </View>

        <View style={styles.detailItem}>
          <User size={11} color={theme.textMuted} />
          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Doctor:</Text>
          <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{visitInfo.doctorName}</Text>
        </View>

        {visitInfo.prescriptionAvailable && (
          <View style={styles.detailItem}>
            <FileText size={11} color={theme.success} />
            <Text style={[styles.detailValue, { color: theme.success, fontWeight: '700' }]}>
              Prescription Available
            </Text>
          </View>
        )}
      </View>

      {onContinueDoctor && (
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: theme.primary }]}
          onPress={onContinueDoctor}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            Continue with {visitInfo.doctorName}
          </Text>
          <ChevronRight size={13} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsGrid: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
