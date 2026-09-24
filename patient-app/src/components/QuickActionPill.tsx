import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RADIUS, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface QuickActionPillProps {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  style?: object;
}

export const QuickActionPill: React.FC<QuickActionPillProps> = ({
  label,
  icon,
  onPress,
  isActive = false,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: isActive ? theme.primary : theme.card,
          borderColor: isActive ? theme.primary : theme.cardBorder,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { color: isActive ? '#FFFFFF' : theme.textPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
