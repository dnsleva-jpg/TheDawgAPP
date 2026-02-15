// The D.A.W.G. App - Complete Design System
// Based on brand kit dated February 4, 2026

export const COLORS = {
  // Backgrounds
  bgDeep: '#0D0D12',
  bgSurface: '#16161F',
  bgSurfaceLight: '#1E1E2A',
  
  // Accent Colors
  coral: '#FF4D6A',
  coralGlow: '#FF6B81',
  coralDim: '#CC3D55',
  amber: '#FFBE0B',          // Also used for V2 score ring (mid-range scores)
  amberGlow: '#FFD166',
  verified: '#2ECC71',       // Also used for V2 score ring (high scores / verified badge)
  verifiedDim: '#27AE60',
  
  // Text Colors
  textPrimary: '#F0EDE8',
  textSecondary: '#B8B3AC',
  textMuted: '#8A857E',
  textDisabled: '#5A5650',
  
  // Legacy (for backward compatibility - will be removed)
  dark: '#0D0D12',
  darkSecondary: '#16161F',
  darkGray: '#1E1E2A',
  white: '#F0EDE8',
  gray: '#B8B3AC',
};

export const FONTS = {
  display: 'BebasNeue-Regular',
  heading: 'Outfit-SemiBold',
  headingMedium: 'Outfit-Medium',
  headingBold: 'Outfit-Bold',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
  mono: 'SpaceGrotesk-Regular',
  monoMedium: 'SpaceGrotesk-Medium',
  monoBold: 'SpaceGrotesk-Bold',
};

export const RADIUS = {
  button: 14,
  card: 16,
  pill: 100,
  shareCard: 22,
  input: 12,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  coralButton: {
    shadowColor: '#FF4D6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
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

// App Identity
export const BRAND = {
  appName: 'The D.A.W.G. App',
  tagline: 'The art of doing absolutely nothing',
  handle: '@TheDAWGApp',
  appStoreSubtitle: 'Prove you stayed present. Camera-verified focus.',
};
