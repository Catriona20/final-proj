import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ChevronRight, Building2, UserCheck } from 'lucide-react-native';
import { Department } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface DepartmentCardProps {
  department: Department;
  isSelected?: boolean;
  onPress: () => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  isSelected = false,
  onPress,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isSelected
              ? isDark
                ? '#0F2557'
                : '#EBF0FF'
              : theme.card,
            borderColor: isSelected ? theme.primary : theme.cardBorder,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isSelected
                  ? theme.primary
                  : isDark
                  ? '#162D54'
                  : theme.backgroundSoft,
              },
            ]}
          >
            <Text style={styles.iconText}>{department.icon}</Text>
          </View>

          <View style={styles.badgeContainer}>
            {department.clinicCount ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? theme.primaryLight : theme.backgroundSoft },
                ]}
              >
                <Building2 size={10} color={isSelected ? theme.primary : theme.textMuted} />
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? theme.primary : theme.textSecondary },
                  ]}
                >
                  {department.clinicCount} clinics
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text
            style={[
              styles.name,
              { color: isSelected ? theme.primary : theme.textPrimary },
            ]}
            numberOfLines={1}
          >
            {department.name}
          </Text>
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {department.description}
          </Text>
        </View>

        {department.popularSymptoms && department.popularSymptoms.length > 0 && (
          <View style={styles.symptomsRow}>
            {department.popularSymptoms.slice(0, 2).map((sym, idx) => (
              <View
                key={idx}
                style={[
                  styles.symptomTag,
                  {
                    backgroundColor: isDark ? '#0C2347' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.symptomTagText, { color: theme.textMuted }]}>
                  {sym}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <Text
            style={[
              styles.actionLabel,
              { color: isSelected ? theme.primary : theme.textMuted },
            ]}
          >
            {isSelected ? 'Selected' : 'Tap to select'}
          </Text>
          <ChevronRight
            size={14}
            color={isSelected ? theme.primary : theme.textMuted}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 8,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  symptomTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 0.5,
  },
  symptomTagText: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
