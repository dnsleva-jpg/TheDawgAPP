import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { saveOnboardingData } from '../onboardingStorage';

const STILLNESS_OPTIONS = [
  { emoji: '🐣', label: 'Under 1 minute' },
  { emoji: '🌱', label: '1–5 minutes' },
  { emoji: '💪', label: '5–15 minutes' },
  { emoji: '🧘', label: '15+ minutes' },
];

const TIME_OPTIONS = [
  { emoji: '🌅', label: 'Morning' },
  { emoji: '☀️', label: 'Afternoon' },
  { emoji: '🌙', label: 'Evening' },
  { emoji: '🤷', label: 'It varies' },
];

interface PreferenceScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function PreferenceScreen({ onNext, screenIndex }: PreferenceScreenProps) {
  const [stillness, setStillness] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const handleContinue = async () => {
    if (stillness && time) {
      await saveOnboardingData({ stillnessLevel: stillness, practiceTime: time });
      onNext();
    }
  };

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Let's set up your program.</Text>

      <Text style={styles.question}>
        How long can you sit still right now — honestly?
      </Text>
      <View style={styles.grid}>
        {STILLNESS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.gridItem, stillness === opt.label && styles.gridItemSelected]}
            onPress={() => setStillness(opt.label)}
            activeOpacity={0.7}
          >
            <Text style={styles.gridEmoji}>{opt.emoji}</Text>
            <Text style={[styles.gridLabel, stillness === opt.label && styles.gridLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.question}>
        When do you usually have time to practice?
      </Text>
      <View style={styles.grid}>
        {TIME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.gridItem, time === opt.label && styles.gridItemSelected]}
            onPress={() => setTime(opt.label)}
            activeOpacity={0.7}
          >
            <Text style={styles.gridEmoji}>{opt.emoji}</Text>
            <Text style={[styles.gridLabel, time === opt.label && styles.gridLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!stillness || !time}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 28,
  },
  question: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  gridItem: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: COLORS.coral,
    backgroundColor: 'rgba(255, 77, 106, 0.08)',
  },
  gridEmoji: {
    fontSize: 28,
  },
  gridLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  gridLabelSelected: {
    color: COLORS.textPrimary,
  },
});
