// Legacy colors file - updated to match The D.A.W.G. App brand kit
// Importing from design system for consistency
import { COLORS as DS_COLORS } from './designSystem';

export const COLORS = {
  // Backgrounds (updated to brand kit)
  dark: DS_COLORS.bgDeep,
  darkSecondary: DS_COLORS.bgSurface,
  darkGray: DS_COLORS.bgSurfaceLight,
  
  // Primary accent (updated to brand kit)
  coral: DS_COLORS.coral,
  coralDark: DS_COLORS.coralDim,
  
  // Text (updated to brand kit)
  white: DS_COLORS.textPrimary,
  gray: DS_COLORS.textSecondary,
  lightGray: DS_COLORS.textMuted,
  
  // Status colors (updated to brand kit)
  success: DS_COLORS.verified,
  warning: DS_COLORS.amber,
  
  // Utility
  transparent: 'transparent',
  overlay: 'rgba(13, 13, 18, 0.78)', // Updated to match share card overlay
};
