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

const GOALS = [
  {
    icon: <Ionicons name="phone-portrait-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: 'I pick up my phone without thinking',
  },
  {
    icon: <MaterialCommunityIcons name="brain" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I can't focus for more than a few minutes",
  },
  {
    icon: <Ionicons name="moon-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: 'I scroll instead of sleeping',
  },
  {
    icon: <MaterialCommunityIcons name="shield-off-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I've tried app blockers — they don't work",
  },
  {
    icon: <Feather name="clock" size={ICON_SIZE} color={ICON_COLOR} />,
    label: 'I waste hours every day and feel guilty',
  },
  {
    icon: <MaterialCommunityIcons name="arm-flex-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: 'I want to prove I can control my attention',
  },
  {
    icon: <MaterialCommunityIcons name="flask-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    label: "I'm into the science and want a real program",
  },
];

interface GoalScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function GoalScreen({ onNext, screenIndex }: GoalScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selected) {
      await saveOnboardingData({ userGoal: selected });
      onNext();
    }
  };

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>What brought you here?</Text>
      <Text style={styles.subheadline}>Pick the one that fits best.</Text>

      <View style={styles.options}>
        {GOALS.map((goal) => (
          <OptionCard
            key={goal.label}
            icon={goal.icon}
            label={goal.label}
            selected={selected === goal.label}
            onPress={() => setSelected(goal.label)}
          />
        ))}
      </View>

      <OnboardingButton
        title="That's me — continue"
        onPress={handleContinue}
        disabled={!selected}
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
