import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '@fyp_patient_theme_mode';

interface ThemeState {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initializeTheme: () => Promise<void>;
}

const getIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return Appearance.getColorScheme() === 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  isDark: false,

  initializeTheme: async () => {
    try {
      const savedMode = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode | null;
      const mode: ThemeMode = savedMode || 'light';
      set({
        themeMode: mode,
        isDark: getIsDark(mode),
      });

      // Listen for system appearance changes
      Appearance.addChangeListener(({ colorScheme }) => {
        const currentMode = get().themeMode;
        if (currentMode === 'system') {
          set({ isDark: colorScheme === 'dark' });
        }
      });
    } catch (e) {
      console.warn('Failed to load theme preference', e);
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({
        themeMode: mode,
        isDark: getIsDark(mode),
      });
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },
}));
