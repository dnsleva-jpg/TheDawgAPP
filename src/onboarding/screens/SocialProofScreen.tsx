import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';

const TESTIMONIALS = [
  {
    name: 'Alex M.',
    tag: 'Busy professional',
    text: "I couldn't sit still for 2 minutes on Day 1. By Day 30 I was doing 15-minute sessions scoring an A. My focus at work is noticeably better.",
  },
  {
    name: 'Jordan K.',
    tag: 'College student',
    text: 'The share cards got my whole friend group competing. We have a group chat just for posting our scores.',
  },
  {
    name: 'Sam R.',
    tag: 'Parent',
    text: 'My kids noticed I stopped reaching for my phone at dinner. That was worth more than any score.',
  },
];

interface SocialProofScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function SocialProofScreen({ onNext, screenIndex }: SocialProofScreenProps) {
  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Millions of people feel controlled by their phone.</Text>
      <Text style={styles.subheadline}>Here's what happens when they take it back.</Text>

      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t) => (
          <View key={t.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{t.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.tag}>{t.tag}</Text>
              </View>
            </View>
            <Text style={styles.quote}>"{t.text}"</Text>
          </View>
        ))}
      </View>

      {/* TODO: Replace placeholder testimonials with real beta user reviews before launch */}

      <OnboardingButton title="Continue" onPress={onNext} />
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
  testimonials: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.coral,
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  tag: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  quote: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
});
