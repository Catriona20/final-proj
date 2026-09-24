import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.toggleBtn, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      {isDark ? <Sun size={18} color="#EAB308" /> : <Moon size={18} color={colors.primary} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
