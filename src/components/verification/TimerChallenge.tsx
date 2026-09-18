import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/designSystem';

interface TimerChallengeProps {
  durationSeconds: number;
  title: string;
  description: string;
  onComplete: (elapsed: number, leftApp: boolean, leftCount: number) => void;
  onCancel: () => void;
}

export function TimerChallenge({
  durationSeconds,
  title,
  description,
  onComplete,
  onCancel,
}: TimerChallengeProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [leftApp, setLeftApp] = useState(false);
  const [leftCount, setLeftCount] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const elapsed = durationSeconds - secondsLeft;
  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRunning(true);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete(durationSeconds, leftApp, leftCount);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, durationSeconds, leftApp, leftCount, onComplete]);

  // AppState detection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        isRunning &&
        appStateRef.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        setLeftApp(true);
        setLeftCount((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Challenge info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          {leftApp && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>
                Phone picked up {leftCount}x — stay off your phone!
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!isRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.runningHint}>
              Put your phone down and enjoy the moment
            </Text>
          )}

          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // Info
  infoSection: {
    gap: 8,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Timer
  timerSection: {
    alignItems: 'center',
    gap: 16,
  },
  timerText: {
    fontFamily: FONTS.display,
    fontSize: 72,
    color: COLORS.textPrimary,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.bgSurfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 3,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 77, 106, 0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  warningText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.coral,
  },

  // Actions
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 18,
    paddingHorizontal: 64,
    ...SHADOWS.coralButton,
  },
  startButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: '#1C1208',
    letterSpacing: 2,
  },
  runningHint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
