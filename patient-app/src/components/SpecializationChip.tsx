import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { RADIUS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface SpecializationChipProps {
  name: string;
  icon?: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: object;
}

export const SpecializationChip: React.FC<SpecializationChipProps> = ({
  name,
  icon,
  isSelected = false,
  onPress,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.card,
          borderColor: isSelected ? theme.primary : theme.cardBorder,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          { color: isSelected ? '#FFFFFF' : theme.textPrimary },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
