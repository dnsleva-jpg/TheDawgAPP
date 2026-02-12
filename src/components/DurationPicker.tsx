import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DURATION_OPTIONS, DurationOption } from '../constants/durations';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS } from '../constants/designSystem';

interface DurationPickerProps {
  selectedDuration: number;
  onSelectDuration: (seconds: number) => void;
}

export function DurationPicker({ selectedDuration, onSelectDuration }: DurationPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label} accessibilityRole="header">Select Duration</Text>
      <View style={styles.optionsContainer}>
        {DURATION_OPTIONS.map((option: DurationOption) => {
          const isSelected = option.seconds === selectedDuration;
          const isRogue = option.isRogueMode;
          return (
            <TouchableOpacity
              key={option.seconds}
              style={[
                styles.optionButton,
                isRogue && styles.rogueButton,
                isSelected && (isRogue ? styles.rogueButtonSelected : styles.optionButtonSelected),
              ]}
              onPress={() => onSelectDuration(option.seconds)}
              accessibilityLabel={`Select ${option.label}${isSelected ? ', selected' : ''}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionText,
                  isRogue && styles.rogueText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  label: {
    fontSize: 18,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DS_COLORS.bgSurfaceLight,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    minWidth: 90,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(255, 77, 106, 0.12)',
    borderColor: DS_COLORS.coral,
  },
  rogueButton: {
    backgroundColor: DS_COLORS.bgSurface,
    borderColor: DS_COLORS.amber,
    borderWidth: 2,
  },
  rogueButtonSelected: {
    backgroundColor: DS_COLORS.amber,
    borderColor: DS_COLORS.amber,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
  },
  rogueText: {
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.amber,
  },
  optionTextSelected: {
    color: DS_COLORS.coral,
  },
});
