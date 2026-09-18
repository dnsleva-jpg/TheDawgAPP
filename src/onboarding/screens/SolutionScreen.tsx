import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { getOnboardingData } from '../onboardingStorage';

interface SolutionItem {
  pain: string;
  solution: string;
  icon: string;
}

const SOLUTION_MAP: Record<string, SolutionItem> = {
  "I literally cannot sit still for 5 minutes": {
    pain: "Can't sit still",
    solution: 'Camera-verified sessions measure your stillness in real-time — like a blood test for your brain.',
    icon: '📹',
  },
  "I've tried other solutions and nothing sticks": {
    pain: 'Nothing else sticks',
    solution: 'A 90-day program with daily challenges that escalate from phone-free meals to full digital sabbaths.',
    icon: '📈',
  },
  "Screen Time stats shame me but don't change anything": {
    pain: "Screen Time doesn't work",
    solution: 'Your Brain Recovery Score tracks real biometric improvement — not just time blocked.',
    icon: '🧠',
  },
  "I check it on autopilot — I don't even realize I'm doing it": {
    pain: 'Autopilot phone checking',
    solution: 'Daily challenges rewire the habit loop one day at a time — starting easy, getting harder.',
    icon: '🔄',
  },
  "I can't finish tasks without getting distracted": {
    pain: "Can't finish tasks",
    solution: 'Focus sessions train your brain to sustain attention. Track your improvement with real data.',
    icon: '🎯',
  },
  "I feel anxious when my phone isn't nearby": {
    pain: 'Phone separation anxiety',
    solution: 'Walk Mode and Phone Pauses gradually desensitize your brain to being without your phone.',
    icon: '🧘',
  },
  "I stay up way too late scrolling": {
    pain: 'Late-night scrolling',
    solution: 'Scheduled Phone Pauses protect your evenings. Your circadian rhythm will thank you.',
    icon: '🌙',
  },
};

const FALLBACK_SOLUTIONS: SolutionItem[] = [
  {
    pain: "Can't sit still",
    solution: 'Camera-verified sessions measure your stillness in real-time — like a blood test for your brain.',
    icon: '📹',
  },
  {
    pain: 'Nothing else sticks',
    solution: 'A 90-day program with daily challenges that escalate from phone-free meals to full digital sabbaths.',
    icon: '📈',
  },
  {
    pain: "Screen Time doesn't work",
    solution: 'Your Brain Recovery Score tracks real biometric improvement — not just time blocked.',
    icon: '🧠',
  },
  {
    pain: 'Autopilot phone checking',
    solution: 'Daily challenges rewire the habit loop one day at a time — starting easy, getting harder.',
    icon: '🔄',
  },
];

interface SolutionScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function SolutionScreen({ onNext, screenIndex }: SolutionScreenProps) {
  const [solutions, setSolutions] = useState<SolutionItem[]>(FALLBACK_SOLUTIONS);

  useEffect(() => {
    (async () => {
      const data = await getOnboardingData();
      if (data.userPainPoints && data.userPainPoints.length > 0) {
        const matched = data.userPainPoints
          .map((p) => SOLUTION_MAP[p])
          .filter(Boolean) as SolutionItem[];
        if (matched.length >= 2) {
          setSolutions(matched.slice(0, 4));
        }
      }
    })();
  }, []);

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Here's how DO NOTHIN. actually fixes this.</Text>
      <Text style={styles.subheadline}>
        You told us your problems. Here's exactly how we solve them.
      </Text>

      <View style={styles.list}>
        {solutions.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.itemContent}>
              <Text style={styles.pain}>{item.pain}</Text>
              <Text style={styles.solution}>{item.solution}</Text>
            </View>
          </View>
        ))}
      </View>

      <OnboardingButton title="Show me proof" onPress={onNext} />
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
    marginBottom: 28,
  },
  list: {
    gap: 16,
    marginBottom: 32,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.04)',
  },
  icon: {
    fontSize: 28,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  pain: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 6,
  },
  solution: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
});
