import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/designSystem';
import { ProgressBar } from '../components/ProgressBar';

const STEPS = [
  'Analyzing your goals...',
  'Selecting your daily challenges...',
  'Calibrating difficulty to your level...',
  'Your plan is ready.',
];

interface ProcessingScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function ProcessingScreen({ onNext, screenIndex }: ProcessingScreenProps) {
  const insets = useSafeAreaInsets();
  const [visibleSteps, setVisibleSteps] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the brain icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Reveal steps one by one
    const timers: NodeJS.Timeout[] = [];
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 700)
      );
    });

    // Auto-advance after all steps shown
    timers.push(setTimeout(onNext, STEPS.length * 700 + 800));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProgressBar current={screenIndex + 1} total={15} />

      <View style={styles.content}>
        <Animated.View style={[styles.brainIcon, { transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons name="brain" size={56} color={COLORS.coral} />
        </Animated.View>

        <Text style={styles.headline}>Building your 90-day{'\n'}recovery plan...</Text>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View
              key={step}
              style={[styles.step, i >= visibleSteps && styles.stepHidden]}
            >
              <Text style={styles.stepCheck}>
                {i < visibleSteps ? '✓' : ''}
              </Text>
              <Text style={[styles.stepText, i >= visibleSteps && styles.stepTextHidden]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brainIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 77, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  steps: {
    alignSelf: 'stretch',
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepHidden: {
    opacity: 0,
  },
  stepCheck: {
    fontFamily: FONTS.monoBold,
    fontSize: 16,
    color: COLORS.verified,
    width: 20,
    textAlign: 'center',
  },
  stepText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  stepTextHidden: {
    color: 'transparent',
  },
});
