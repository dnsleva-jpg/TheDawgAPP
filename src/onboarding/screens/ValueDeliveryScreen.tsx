import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Share } from 'react-native';
import { COLORS, FONTS, RADIUS, BRAND } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { saveOnboardingData } from '../onboardingStorage';
import type { SessionResults } from '../../scoring/scoringEngine';

interface ValueDeliveryScreenProps {
  results: SessionResults;
  onNext: () => void;
  screenIndex: number;
}

export function ValueDeliveryScreen({ results, onNext, screenIndex }: ValueDeliveryScreenProps) {
  const [revealed, setRevealed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Save baseline data
    saveOnboardingData({
      baselineScore: results.dawgScore,
      baselineGrade: results.grade,
      baselineLabel: results.label,
      baselineGradeColor: results.color,
      baselineBlinks: Math.round(results.blinksPerMinute),
      baselineStillness: Math.round(results.stillnessPercent),
      baselineDuration: 15,
    });

    // Reveal animation after brief "calculating" delay
    const timer = setTimeout(() => {
      setRevealed(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just set my baseline on ${BRAND.appName} — scored ${results.dawgScore} (${results.grade} ${results.label}). Day 0 of my phone detox. ${BRAND.handle} #donothin #dopaminedetox`,
      });
    } catch {
      // Share cancelled
    }
  };

  if (!revealed) {
    return (
      <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingEmoji}>🧠</Text>
          <Text style={styles.loadingText}>Calculating your first score...</Text>
        </View>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Your first DO NOTHIN. Score</Text>

      <Animated.View
        style={[
          styles.scoreCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={styles.brandMark}>{BRAND.appName}</Text>

        <Text style={styles.scoreLabel}>DO NOTHIN. SCORE</Text>
        <Text style={[styles.scoreNumber, { color: results.color }]}>
          {Math.round(results.dawgScore)}
        </Text>
        <Text style={[styles.gradeText, { color: results.color }]}>
          {results.grade} {results.label}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(results.stillnessPercent)}%</Text>
            <Text style={styles.statLabel}>stillness</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(results.blinksPerMinute)}</Text>
            <Text style={styles.statLabel}>blinks/min</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0:15</Text>
            <Text style={styles.statLabel}>duration</Text>
          </View>
        </View>

        <View style={styles.baselineBadge}>
          <Text style={styles.baselineText}>BASELINE SET</Text>
        </View>

        <Text style={styles.day0}>
          Day 0 — This is your starting point.
        </Text>
      </Animated.View>

      <Text style={styles.disclaimer}>
        This was just a quick taste — the real test is 5–15 minutes to fully measure your focus.
      </Text>

      <Text style={styles.teaser}>
        Let's see where you are in 90 days.
      </Text>

      <View style={styles.buttons}>
        <OnboardingButton title="Share Your First Score" onPress={handleShare} variant="secondary" />
        <OnboardingButton title="Continue" onPress={onNext} />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.06)',
    marginBottom: 20,
  },
  brandMark: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: COLORS.coral,
    letterSpacing: 2,
    marginBottom: 16,
  },
  scoreLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  scoreNumber: {
    fontFamily: FONTS.display,
    fontSize: 80,
    lineHeight: 84,
  },
  gradeText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  baselineBadge: {
    backgroundColor: 'rgba(41, 128, 185, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(41, 128, 185, 0.25)',
    marginBottom: 16,
  },
  baselineText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: '#2980B9',
    letterSpacing: 1,
  },
  day0: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  teaser: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    color: COLORS.coral,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    gap: 10,
    marginBottom: 8,
  },
  // Loading state
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  loadingText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.textSecondary,
  },
});
