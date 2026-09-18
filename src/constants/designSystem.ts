// DO NOTHIN. - Design System v3
// Warm light theme inspired by BrainRot aesthetic

export const COLORS = {
  // Backgrounds
  bgDeep: '#F7F4EE',
  bgSurface: '#EDE9E0',
  bgSurfaceLight: '#E4DDD2',

  // Accent Colors
  primary: '#1C1208',
  accent: '#D4820A',
  coral: '#D4820A',           // Aliased to accent for backward compat
  coralGlow: '#E89B2A',
  coralDim: '#B06D08',
  amber: '#D4820A',
  amberGlow: '#E89B2A',
  verified: '#2ECC71',
  verifiedDim: '#27AE60',

  // Text Colors
  textPrimary: '#1C1208',
  textSecondary: '#8A7A60',
  textMuted: '#B0A090',
  textDisabled: '#C8C0B4',

  // Borders
  border: '#E0D8CC',

  // Utility
  white: '#FFFFFF',
  dark: '#1C1208',

  // Legacy aliases — screens that reference old names still compile
  darkSecondary: '#EDE9E0',
  darkGray: '#E4DDD2',
  gray: '#8A7A60',
};

export const FONTS = {
  display: 'Outfit_800ExtraBold',
  heading: 'Outfit_700Bold',
  headingMedium: 'Outfit_700Bold',
  headingBold: 'Outfit_800ExtraBold',
  headingRegular: 'Outfit_400Regular',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_700Bold',
  bodyBold: 'Outfit_800ExtraBold',
  mono: 'Outfit_400Regular',
  monoMedium: 'Outfit_700Bold',
  monoBold: 'Outfit_800ExtraBold',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  button: 16,
  card: 16,
  pill: 100,
  shareCard: 22,
  input: 12,
  full: 100,
};

export const SHADOWS = {
  card: {
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  coralButton: {
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 32,
  display: 42,
};

// App Identity
export const BRAND = {
  appName: 'DO NOTHIN.',
  tagline: 'Own Your Attention',
  handle: '@DoNothinApp',
  appStoreSubtitle: 'Prove you stayed present. Camera-verified focus.',
};
