import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OptionCard } from '../components/OptionCard';
import { saveOnboardingData } from '../onboardingStorage';
import { setScreenTimeGoal } from '../../utils/screenTimeService';

const ICON_COLOR = COLORS.coral;

const SCREEN_TIME_OPTIONS = [
  { hours: 2, label: '1–2 hours', icon: <Ionicons name="time-outline" size={20} color={ICON_COLOR} /> },
  { hours: 4, label: '3–4 hours', icon: <Ionicons name="phone-portrait-outline" size={20} color={ICON_COLOR} /> },
  { hours: 6, label: '5–6 hours', icon: <Ionicons name="warning-outline" size={20} color={ICON_COLOR} /> },
  { hours: 8, label: '7–8 hours', icon: <Ionicons name="alert-circle-outline" size={20} color={ICON_COLOR} /> },
  { hours: 10, label: '8+ hours', icon: <Ionicons name="skull-outline" size={20} color={ICON_COLOR} /> },
];

interface ScreenTimeScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function ScreenTimeScreen({ onNext, screenIndex }: ScreenTimeScreenProps) {
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const handleContinue = async () => {
    if (selectedHours == null) return;
    await saveOnboardingData({ dailyScreenTimeHours: selectedHours } as any);
    await setScreenTimeGoal(selectedHours);
    setShowResults(true);
  };

  useEffect(() => {
    if (showResults) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [showResults, fadeAnim, slideAnim]);

  if (showResults && selectedHours != null) {
    const dailyHours = selectedHours;
    const yearlyHours = Math.round(dailyHours * 365);
    const yearlyDays = Math.round(yearlyHours / 24);
    const yearlyWeeks = Math.round(yearlyDays / 7);
    const reclaimHours = Math.round(dailyHours * 0.4); // 40% reduction target
    const reclaimYearlyDays = Math.round((reclaimHours * 365) / 24);

    return (
      <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
        <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.resultsHeadline}>That's what it's costing you.</Text>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{yearlyHours.toLocaleString()}</Text>
              <Text style={styles.statLabel}>hours per year</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{yearlyWeeks}</Text>
              <Text style={styles.statLabel}>full weeks per year</Text>
            </View>
          </View>

          <View style={styles.reclaimCard}>
            <Ionicons name="arrow-redo-outline" size={20} color={COLORS.verified} />
            <View style={styles.reclaimText}>
              <Text style={styles.reclaimTitle}>
                You could reclaim {reclaimYearlyDays}+ days this year
              </Text>
              <Text style={styles.reclaimSub}>
                That's ~{reclaimHours}h/day back — enough for a new skill, better sleep, or just being present.
              </Text>
            </View>
          </View>

          <View style={styles.comparisonList}>
            <ComparisonRow emoji="📚" text={`Read ${Math.round(yearlyHours / 6)} books`} hours={yearlyHours} />
            <ComparisonRow emoji="🏋️" text={`${Math.round(yearlyHours / 1)} gym sessions`} hours={yearlyHours} />
            <ComparisonRow emoji="🎸" text="Learn an instrument" hours={yearlyHours} />
            <ComparisonRow emoji="💤" text={`${yearlyDays} extra nights of sleep`} hours={yearlyHours} />
          </View>

          <Text style={styles.resultsHook}>90 days is all it takes to rewire.</Text>

          <OnboardingButton title="Let's do this" onPress={onNext} />
        </Animated.View>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>How much time do you spend on your phone daily?</Text>
      <Text style={styles.subheadline}>Be honest — check your Screen Time if you're not sure.</Text>

      <View style={styles.options}>
        {SCREEN_TIME_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.hours}
            icon={opt.icon}
            label={opt.label}
            selected={selectedHours === opt.hours}
            onPress={() => setSelectedHours(opt.hours)}
          />
        ))}
      </View>

      <OnboardingButton
        title="Show me the math"
        onPress={handleContinue}
        disabled={selectedHours == null}
      />
    </OnboardingLayout>
  );
}

function ComparisonRow({ emoji, text }: { emoji: string; text: string; hours: number }) {
  return (
    <View style={styles.compRow}>
      <Text style={styles.compEmoji}>{emoji}</Text>
      <Text style={styles.compText}>{text}</Text>
    </View>
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
    lineHeight: 22,
  },
  options: {
    marginBottom: 24,
  },

  // Results
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultsHeadline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.coral,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Reclaim card
  reclaimCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  reclaimText: {
    flex: 1,
  },
  reclaimTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.verified,
    marginBottom: 4,
  },
  reclaimSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Comparison
  comparisonList: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compEmoji: {
    fontSize: 18,
  },
  compText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Hook
  resultsHook: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    color: COLORS.coral,
    textAlign: 'center',
    marginBottom: 20,
  },
});
