import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';

interface OptionCardProps {
  emoji?: string;
  icon?: React.ReactNode;
  label: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}

export function OptionCard({
  emoji,
  icon,
  label,
  selected,
  onPress,
  multiSelect = false,
}: OptionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, selected && styles.containerSelected]}
    >
      {icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : (
        <Text style={styles.emoji}>{emoji}</Text>
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {multiSelect && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: COLORS.coral,
    backgroundColor: 'rgba(255, 77, 106, 0.08)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  labelSelected: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.bgSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  checkmark: {
    color: '#1C1208',
    fontSize: 14,
    fontWeight: '700',
  },
});
