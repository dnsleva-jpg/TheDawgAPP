import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OptionCard } from '../components/OptionCard';
import { saveOnboardingData } from '../onboardingStorage';

const ICON_COLOR = COLORS.coral;
const ICON_SIZE = 20;

const PAIN_POINTS = [
  {
    icon: <Ionicons name="refresh-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I check it on autopilot — I don't even realize I'm doing it",
  },
  {
    icon: <Ionicons name="alert-circle-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I feel anxious when my phone isn't nearby",
  },
  {
    icon: <Feather name="target" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I can't finish tasks without getting distracted",
  },
  {
    icon: <Ionicons name="moon-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: 'I stay up way too late scrolling',
  },
  {
    icon: <Feather name="bar-chart-2" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "Screen Time stats shame me but don't change anything",
  },
  {
    icon: <MaterialCommunityIcons name="emoticon-sad-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I've tried other solutions and nothing sticks",
  },
  {
    icon: <MaterialCommunityIcons name="meditation" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I literally cannot sit still for 5 minutes",
  },
];

interface PainPointsScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function PainPointsScreen({ onNext, screenIndex }: PainPointsScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleContinue = async () => {
    await saveOnboardingData({ userPainPoints: selected });
    onNext();
  };

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>What makes it hard to put your phone down?</Text>
      <Text style={styles.subheadline}>Select all that apply.</Text>

      <View style={styles.options}>
        {PAIN_POINTS.map((point) => (
          <OptionCard
            key={point.label}
            icon={point.icon}
            label={point.label}
            selected={selected.includes(point.label)}
            onPress={() => toggleSelection(point.label)}
            multiSelect
          />
        ))}
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={selected.length === 0}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  options: {
    marginBottom: 24,
  },
});
