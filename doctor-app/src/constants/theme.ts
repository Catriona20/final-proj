export const PALETTE = {
  // Primary & System Identity
  primary: '#0D47C9', // Deep Healthcare Blue
  secondary: '#2563EB', // Bright Blue
  accent: '#FF8A00', // Warm Orange (Reserved ONLY for primary CTAs like Start Consultation, Confirm, Complete)

  // Neutral Light Mode
  backgroundLight: '#F5F8FC',
  cardLight: '#FFFFFF',
  cardSubtleLight: '#F0F4FA',
  textLight: '#0B1736',
  secondaryTextLight: '#64748B',
  borderLight: '#E2E8F0',
  inputBgLight: '#F8FAFC',

  // Neutral Dark Mode (Rich Healthcare Navy, NOT black!)
  backgroundDark: '#06152F',
  cardDark: '#0C2347',
  cardSubtleDark: '#102E5C',
  textDark: '#F8FAFC',
  secondaryTextDark: '#94A3B8',
  borderDark: '#1E3A6B',
  inputBgDark: '#0A1C38',

  // Status & Clinical Feedback
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Medical Triage & Verification
  emergency: '#DC2626',
  emergencyBg: '#FFE4E6',
  priority: '#D97706',
  priorityBg: '#FEF3C7',
  verifiedBadge: '#0D47C9',
};

export const TYPOGRAPHY = {
  fontFamily: 'Plus Jakarta Sans, Inter, -apple-system, sans-serif',
  sizes: {
    largeHeading: 28, // 26-30px
    sectionHeading: 20, // 18-21px
    cardTitle: 16, // 15-17px
    body: 14, // 13-15px
    secondary: 12, // 11-13px
    micro: 10,
    importantTime: 18,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: '#0B1736',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0B1736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
};
