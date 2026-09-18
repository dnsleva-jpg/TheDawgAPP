import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/designSystem';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
}

export function OnboardingButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: OnboardingButtonProps) {
  if (variant === 'text') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.6}
        style={[styles.textButton, style]}
      >
        <Text style={[styles.textLabel, disabled && styles.disabledText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabledButton,
        variant === 'primary' && !disabled && SHADOWS.coralButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'secondary' && styles.secondaryLabel,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.coral,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.bgSurfaceLight,
  },
  disabledButton: {
    backgroundColor: COLORS.bgSurfaceLight,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 17,
    fontFamily: FONTS.heading,
    letterSpacing: 0.3,
  },
  primaryLabel: {
    color: '#1C1208',
  },
  secondaryLabel: {
    color: COLORS.textPrimary,
  },
  disabledText: {
    color: COLORS.textDisabled,
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textLabel: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
});
