import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { PALETTE } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    cardSubtle: string;
    text: string;
    secondaryText: string;
    border: string;
    inputBg: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initializeTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@medlink_doctor_theme_mode';

const getColors = (isDark: boolean) => ({
  background: isDark ? PALETTE.backgroundDark : PALETTE.backgroundLight,
  card: isDark ? PALETTE.cardDark : PALETTE.cardLight,
  cardSubtle: isDark ? PALETTE.cardSubtleDark : PALETTE.cardSubtleLight,
  text: isDark ? PALETTE.textDark : PALETTE.textLight,
  secondaryText: isDark ? PALETTE.secondaryTextDark : PALETTE.secondaryTextLight,
  border: isDark ? PALETTE.borderDark : PALETTE.borderLight,
  inputBg: isDark ? PALETTE.inputBgDark : PALETTE.inputBgLight,
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  accent: PALETTE.accent,
  success: PALETTE.success,
  warning: PALETTE.warning,
  error: PALETTE.error,
});

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: false,
  colors: getColors(false),

  initializeTheme: async () => {
    try {
      const savedMode = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode | null;
      const initialMode = savedMode || 'light';
      const isDark =
        initialMode === 'dark' ||
        (initialMode === 'system' && Appearance.getColorScheme() === 'dark');

      set({
        mode: initialMode,
        isDark,
        colors: getColors(isDark),
      });
    } catch (e) {
      set({ mode: 'light', isDark: false, colors: getColors(false) });
    }
  },

  setMode: async (mode: ThemeMode) => {
    const isDark =
      mode === 'dark' || (mode === 'system' && Appearance.getColorScheme() === 'dark');
    set({
      mode,
      isDark,
      colors: getColors(isDark),
    });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {}
  },

  toggleTheme: async () => {
    const currentIsDark = get().isDark;
    const newMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    await get().setMode(newMode);
  },
}));
