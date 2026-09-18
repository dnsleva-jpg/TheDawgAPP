import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/designSystem';
import { computeShibaMood, type ShibaState } from '../utils/shibaService';
import { getDailyCheckIn } from '../utils/focusScoreService';
import { getShieldStats } from '../utils/shieldService';
import { getStreakData } from '../utils/streakManager';

// For now, one image for all moods — will add variants later
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SHIBA_IMAGE = require('../../assets/shiba/shiba-thriving.png');

interface ShibaMascotProps {
  /** Pass true if today's challenge has been completed */
  challengeCompleted?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function ShibaMascot({ challengeCompleted = false, compact = false }: ShibaMascotProps) {
  const [shibaState, setShibaState] = useState<ShibaState | null>(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMood();
  }, [challengeCompleted]);

  useEffect(() => {
    // Gentle float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [bounceAnim]);

  const loadMood = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [checkIn, shield, streak] = await Promise.all([
        getDailyCheckIn(today),
        getShieldStats(),
        getStreakData(),
      ]);

      const resistRate = shield.todayInterceptions > 0
        ? Math.round((shield.todayResisted / shield.todayInterceptions) * 100)
        : null;

      const state = computeShibaMood(
        checkIn?.focusScore ?? null,
        resistRate,
        streak.currentStreak,
        challengeCompleted,
      );
      setShibaState(state);
    } catch {
      setShibaState({
        mood: 'meh',
        label: 'Hey there',
        message: "Let's see how today goes.",
        color: '#F39C12',
      });
    }
  };

  if (!shibaState) return null;

  const imageSize = compact ? 64 : 100;
  // Mood-based opacity/saturation hint (until we have separate images)
  const moodOpacity = shibaState.mood === 'rotting' ? 0.5
    : shibaState.mood === 'struggling' ? 0.65
    : shibaState.mood === 'meh' ? 0.8
    : 1;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image
          source={SHIBA_IMAGE}
          style={[
            { width: imageSize, height: imageSize },
            { opacity: moodOpacity },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={[styles.speechBubble, compact && styles.speechBubbleCompact]}>
        <View style={styles.speechRow}>
          <View style={[styles.moodDot, { backgroundColor: shibaState.color }]} />
          <Text style={[styles.moodLabel, { color: shibaState.color }]}>
            {shibaState.label}
          </Text>
        </View>
        <Text style={[styles.message, compact && styles.messageCompact]}>
          {shibaState.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  containerCompact: {
    padding: 12,
    gap: 8,
  },
  speechBubble: {
    flex: 1,
    gap: 4,
  },
  speechBubbleCompact: {
    gap: 2,
  },
  speechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodLabel: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  messageCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
});
