import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DURATION_OPTIONS, DurationOption } from '../constants/durations';
import { COLORS } from '../constants/colors';

interface DurationPickerProps {
  selectedDuration: number;
  onSelectDuration: (seconds: number) => void;
}

export function DurationPicker({ selectedDuration, onSelectDuration }: DurationPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Duration</Text>
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
    fontWeight: '600',
    color: COLORS.white,
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
    backgroundColor: COLORS.darkGray,
    borderWidth: 2,
    borderColor: COLORS.darkGray,
    minWidth: 90,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  rogueButton: {
    backgroundColor: COLORS.darkSecondary,
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  rogueButtonSelected: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
  },
  rogueText: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: COLORS.white,
  },
});
