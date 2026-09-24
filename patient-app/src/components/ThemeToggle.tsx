import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { RADIUS, getThemeColors } from '../constants/theme';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { isDark, setThemeMode } = useThemeStore();
  const theme = getThemeColors(isDark);

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity
      style={[
        styles.toggleBtn,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(13, 71, 201, 0.08)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(13, 71, 201, 0.15)',
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
      accessibilityLabel="Toggle Light or Dark Mode"
    >
      {isDark ? (
        <Sun size={15} color="#FBBF24" />
      ) : (
        <Moon size={15} color={theme.primary} />
      )}
      {!compact && (
        <Text
          style={[
            styles.toggleLabel,
            { color: isDark ? '#F1F5F9' : theme.textPrimary },
          ]}
        >
          {isDark ? 'Dark' : 'Light'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
