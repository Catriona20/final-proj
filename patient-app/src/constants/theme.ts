import { Platform } from 'react-native';

// ============================================================
// LIGHT PALETTE — Deep Healthcare Blue + Warm Orange CTA
// ============================================================
export const LIGHT_COLORS = {
  // --- Primary Blue Scale ---
  primary: '#0D47C9',
  primaryDark: '#0A3AA6',
  primaryMid: '#2563EB',
  primaryLight: '#EBF0FF',
  primaryBorder: '#B8CCFA',

  // --- CTA & Highlighting: Warm Orange ---
  cta: '#FF8A00',
  ctaHover: '#E67A00',
  ctaLight: '#FFF4E5',
  ctaBorder: '#FFD19A',

  // --- Accent Cyan / Sky ---
  accent: '#0EA5E9',
  accentLight: '#E0F2FE',
  accentMid: '#38BDF8',

  // --- Backgrounds ---
  background: '#F5F8FC',
  backgroundSoft: '#EDF2F7',
  backgroundMuted: '#DDE4EE',

  // --- Text ---
  textPrimary: '#0B1736',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // --- Card & Surface ---
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',

  // --- Semantic ---
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // --- Gradients ---
  gradientBlue: ['#0D47C9', '#2563EB'] as [string, string],
  gradientHero: ['#081B4B', '#0D47C9'] as [string, string],
  gradientCard: ['#EBF0FF', '#FFFFFF'] as [string, string],

  // --- Utility ---
  overlay: 'rgba(11, 23, 54, 0.55)',
  overlayLight: 'rgba(11, 23, 54, 0.18)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Backward compat aliases
  border: '#E2E8F0',
  secondary: '#2563EB',
  secondaryLight: '#EBF0FF',
  darkOverlay: 'rgba(11, 23, 54, 0.55)',
};

// ============================================================
// DARK PALETTE — Deep Navy + Blue Primary + Orange CTA
// ============================================================
export const DARK_COLORS = {
  // --- Primary Blue Scale ---
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryMid: '#3B82F6',
  primaryLight: '#0F2557',
  primaryBorder: '#1E3A8A',

  // --- CTA & Highlighting: Warm Orange ---
  cta: '#FF8A00',
  ctaHover: '#FFa333',
  ctaLight: '#3D2200',
  ctaBorder: '#9A5500',

  // --- Accent Cyan / Sky ---
  accent: '#38BDF8',
  accentLight: '#082F49',
  accentMid: '#7DD3FC',

  // --- Backgrounds ---
  background: '#06152F',
  backgroundSoft: '#0B1E3D',
  backgroundMuted: '#162D54',

  // --- Text ---
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0B1736',

  // --- Card & Surface ---
  card: '#0C2347',
  cardBorder: '#1A3560',

  // --- Semantic ---
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#450A0A',

  // --- Gradients ---
  gradientBlue: ['#1E3A8A', '#2563EB'] as [string, string],
  gradientHero: ['#020817', '#0B1E3D'] as [string, string],
  gradientCard: ['#162D54', '#0C2347'] as [string, string],

  // --- Utility ---
  overlay: 'rgba(0, 0, 0, 0.70)',
  overlayLight: 'rgba(0, 0, 0, 0.35)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Backward compat aliases
  border: '#1A3560',
  secondary: '#3B82F6',
  secondaryLight: '#0F2557',
  darkOverlay: 'rgba(0, 0, 0, 0.70)',
};

// Default export uses LIGHT_COLORS for standard imports
export const COLORS = LIGHT_COLORS;

export const getThemeColors = (isDark: boolean) => (isDark ? DARK_COLORS : LIGHT_COLORS);

// ============================================================
// SPACING SCALE — Tightened for mobile-first density
// ============================================================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56,
};

// ============================================================
// BORDER RADIUS — Tactile, modern
// ============================================================
export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
  full: 999,
};

const fontFamily = Platform.select({
  web: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: 'System',
});

// ============================================================
// TYPOGRAPHY SCALE — Readable, hierarchical
// ============================================================
export const TYPOGRAPHY = {
  // Display
  display: { fontFamily, fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
  // Heading
  h1: { fontFamily, fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontFamily, fontSize: 20, fontWeight: '700' as const },
  h3: { fontFamily, fontSize: 17, fontWeight: '600' as const },
  h4: { fontFamily, fontSize: 15, fontWeight: '600' as const },
  // Body
  bodyLg: { fontFamily, fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body: { fontFamily, fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontFamily, fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  // Labels
  labelLg: { fontFamily, fontSize: 15, fontWeight: '600' as const },
  label: { fontFamily, fontSize: 13, fontWeight: '600' as const },
  labelSm: { fontFamily, fontSize: 12, fontWeight: '500' as const },
  // Caption
  caption: { fontFamily, fontSize: 11, fontWeight: '500' as const },
};

// ============================================================
// SHADOW SYSTEM — Subtle, layered depth
// ============================================================
export const SHADOWS = Platform.select({
  web: {
    float: {
      boxShadow: '0px 8px 24px rgba(13, 71, 201, 0.12)',
    },
    card: {
      boxShadow: '0px 2px 8px rgba(11, 23, 54, 0.07)',
    },
    subtle: {
      boxShadow: '0px 1px 3px rgba(11, 23, 54, 0.05)',
    },
    none: {
      boxShadow: 'none',
    },
  },
  default: {
    float: {
      shadowColor: '#0D47C9',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 12,
    },
    card: {
      shadowColor: '#0B1736',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    subtle: {
      shadowColor: '#0B1736',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
}) || {
  float: {},
  card: {},
  subtle: {},
  none: {},
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semiBold: 'System',
};

export const SHADOWS_COMPAT = {
  ...SHADOWS,
  small: SHADOWS.subtle,
  medium: SHADOWS.card,
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { tension: 100, friction: 8 },
  springBouncy: { tension: 120, friction: 7 },
};
