import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { COLORS as DS_COLORS, FONTS, RADIUS, SHADOWS } from '../constants/designSystem';

interface WalkModeScreenProps {
  durationMinutes: number;
  onComplete: (completedSeconds: number, leftApp: boolean) => void;
  onCancel: () => void;
}

export function WalkModeScreen({ durationMinutes, onComplete, onCancel }: WalkModeScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [leftApp, setLeftApp] = useState(false);
  const [leftCount, setLeftCount] = useState(0);
  const startTimeRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsLeft;

  // Start walk
  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete(totalSeconds, leftApp);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, leftApp, onComplete]);

  // AppState detection — detect if user leaves the app
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

  const handleCancel = () => {
    Alert.alert('End Walk?', 'Your walk progress will be lost.', [
      { text: 'Keep Walking', style: 'cancel' },
      {
        text: 'End Walk',
        style: 'destructive',
        onPress: () => {
          if (elapsedSeconds > 30) {
            onComplete(elapsedSeconds, leftApp);
          } else {
            onCancel();
          }
        },
      },
    ]);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  if (!isRunning) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.preStartContent}>
          <Text style={styles.modeLabel}>WALK MODE</Text>
          <Text style={styles.emoji}>🚶</Text>
          <Text style={styles.headline}>Put your phone down{'\n'}and walk.</Text>
          <Text style={styles.subtext}>
            Your phone stays face-down for {durationMinutes} minutes.{'\n'}
            We'll track if you pick it up.
          </Text>
          <View style={styles.rules}>
            <Text style={styles.rule}>1. Place your phone face-down</Text>
            <Text style={styles.rule}>2. Go for your walk</Text>
            <Text style={styles.rule}>3. Come back when the timer is done</Text>
          </View>
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>START WALK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.activeContent}>
        <Text style={styles.modeLabel}>WALK MODE</Text>

        {/* Progress ring placeholder — simple bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {Math.round(progress * 100)}% complete
          </Text>
        </View>

        {/* Status */}
        {leftApp ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.warningText}>
              You left the app {leftCount} {leftCount === 1 ? 'time' : 'times'}
            </Text>
            <Text style={styles.warningSubtext}>Put your phone back down!</Text>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <Text style={styles.statusEmoji}>✅</Text>
            <Text style={styles.statusText}>Phone untouched</Text>
            <Text style={styles.statusSubtext}>Keep walking!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.endButton} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={styles.endButtonText}>END WALK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  // ─── Pre-Start ───
  preStartContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeLabel: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    color: DS_COLORS.coral,
    letterSpacing: 2,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 32,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  subtext: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  rules: {
    gap: 10,
    marginBottom: 32,
  },
  rule: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: DS_COLORS.textPrimary,
  },
  startButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: RADIUS.button,
    ...SHADOWS.coralButton,
  },
  startButtonText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  cancelLink: {
    marginTop: 16,
    padding: 12,
  },
  cancelLinkText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: DS_COLORS.textMuted,
  },
  // ─── Active Walk ───
  activeContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timer: {
    fontFamily: FONTS.display,
    fontSize: 72,
    color: DS_COLORS.textPrimary,
    letterSpacing: 4,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(28,18,8,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: DS_COLORS.coral,
    borderRadius: 4,
  },
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: DS_COLORS.textMuted,
  },
  // Status cards
  statusCard: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: DS_COLORS.verified,
  },
  statusEmoji: {
    fontSize: 28,
  },
  statusText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: DS_COLORS.verified,
  },
  statusSubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: DS_COLORS.textSecondary,
  },
  warningCard: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  warningEmoji: {
    fontSize: 28,
  },
  warningText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#E74C3C',
  },
  warningSubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: DS_COLORS.textSecondary,
  },
  endButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button,
    borderWidth: 1.5,
    borderColor: 'rgba(255,77,106,0.4)',
  },
  endButtonText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: DS_COLORS.coral,
    letterSpacing: 1,
  },
});
