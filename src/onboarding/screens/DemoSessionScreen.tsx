import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import type { FrameFaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../../constants/designSystem';
import { ProgressBar } from '../components/ProgressBar';
import { OnboardingButton } from '../components/OnboardingButton';
import { ScoringEngine } from '../../scoring/scoringEngine';
import type { CalibrationFrame, FaceFrameInput, SessionResults } from '../../scoring/scoringEngine';
import { SCORING_CONFIG } from '../../scoring/scoringConfig';
import type { ScoringConfig } from '../../scoring/scoringConfig';

const DEMO_DURATION_SECONDS = 15;

interface DemoSessionScreenProps {
  onNext: (results: SessionResults) => void;
  screenIndex: number;
}

export function DemoSessionScreen({ onNext, screenIndex }: DemoSessionScreenProps) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('front');
  const { hasPermission } = useCameraPermission();

  const [phase, setPhase] = useState<'ready' | 'countdown' | 'session' | 'done'>('ready');
  const [countdownValue, setCountdownValue] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DEMO_DURATION_SECONDS);
  const [liveStats, setLiveStats] = useState({ stillness: 0, blinks: 0 });
  const [encouragement, setEncouragement] = useState('');

  // Scoring engine refs
  const scoringEngineRef = useRef<ScoringEngine | null>(null);
  const calibrationFramesRef = useRef<CalibrationFrame[]>([]);
  const isEngineCalibrated = useRef(false);
  const sessionStartTimeRef = useRef<number>(0);
  const lastStatsUpdateRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionResultsRef = useRef<SessionResults | null>(null);

  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const faceDetectionOptions = useRef<FrameFaceDetectionOptions>({
    performanceMode: 'fast',
    classificationMode: 'all',
    landmarkMode: 'none',
    contourMode: 'none',
    trackingEnabled: false,
    minFaceSize: 0.2,
  }).current;

  // Start countdown
  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdownValue(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (count <= 0) {
        clearInterval(interval);
        startSession();
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, []);

  // Start the actual session
  const startSession = useCallback(() => {
    setPhase('session');
    sessionStartTimeRef.current = Date.now();
    scoringEngineRef.current = new ScoringEngine(SCORING_CONFIG as unknown as ScoringConfig);
    calibrationFramesRef.current = [];
    isEngineCalibrated.current = false;

    // Timer countdown
    let remaining = DEMO_DURATION_SECONDS;
    setTimeLeft(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);

      // Show encouragement at midpoint
      if (remaining === Math.floor(DEMO_DURATION_SECONDS / 2)) {
        setEncouragement("You're doing it. Stay still.");
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishSession();
      }
    }, 1000);
  }, []);

  const finishSession = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('done');

    const engine = scoringEngineRef.current;
    if (engine) {
      const results = engine.getSessionResults(DEMO_DURATION_SECONDS / 60);
      sessionResultsRef.current = results;

      // Brief "Nice." moment then advance
      setTimeout(() => {
        onNext(results);
      }, 1200);
    } else {
      // Fallback if no engine (camera permission denied)
      const fallback: SessionResults = {
        dawgScore: 65,
        stillnessScore: 70,
        blinkScore: 60,
        durationScore: 55,
        grade: 'B',
        label: 'SOLID',
        color: '#2980B9',
        blinksPerMinute: 15,
        stillnessPercent: 70,
        facePresencePercent: 0,
      };
      setTimeout(() => onNext(fallback), 1200);
    }
  }, [onNext]);

  // Face detection callback — mirrors TimerScreen pattern
  const handleFacesDetected = useCallback((faces: any[]) => {
    const engine = scoringEngineRef.current;
    if (!engine || phase !== 'session') return;

    const now = Date.now();
    const elapsedMs = now - sessionStartTimeRef.current;

    if (faces.length > 0) {
      const face = faces[0];
      const faceData: FaceFrameInput = {
        yaw: face.yawAngle ?? 0,
        pitch: face.pitchAngle ?? 0,
        roll: face.rollAngle ?? 0,
        faceX: face.bounds ? face.bounds.x + face.bounds.width / 2 : 0,
        faceY: face.bounds ? face.bounds.y + face.bounds.height / 2 : 0,
        leftEyeOpenProbability: face.leftEyeOpenProbability ?? -1,
        rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
        timestamp: now,
      };

      if (!isEngineCalibrated.current) {
        calibrationFramesRef.current.push({
          timestamp: now,
          yaw: faceData.yaw,
          pitch: faceData.pitch,
          roll: faceData.roll,
          faceX: faceData.faceX,
          faceY: faceData.faceY,
        });

        if (elapsedMs >= 3000 && calibrationFramesRef.current.length > 0) {
          engine.calibrate(calibrationFramesRef.current);
          isEngineCalibrated.current = true;
        }
      } else {
        const result = engine.processFrame(faceData);
        if (now - lastStatsUpdateRef.current >= 500) {
          lastStatsUpdateRef.current = now;
          setLiveStats({
            stillness: result.liveStillness,
            blinks: result.blinkCount,
          });
        }
      }
    } else if (isEngineCalibrated.current) {
      const result = engine.processFrame(null);
      if (now - lastStatsUpdateRef.current >= 500) {
        lastStatsUpdateRef.current = now;
        setLiveStats({
          stillness: result.liveStillness,
          blinks: result.blinkCount,
        });
      }
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // No camera permission — skip to next with fallback
  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ProgressBar current={screenIndex + 1} total={15} />
        <View style={styles.noCameraContent}>
          <Text style={styles.noCameraIcon}>📹</Text>
          <Text style={styles.noCameraTitle}>Camera not available</Text>
          <Text style={styles.noCameraText}>
            You can enable it later in Settings to get camera-verified scores.
          </Text>
          <OnboardingButton
            title="Continue without camera"
            onPress={() => {
              const fallback: SessionResults = {
                dawgScore: 0,
                stillnessScore: 0,
                blinkScore: 0,
                durationScore: 0,
                grade: 'F',
                label: 'BASELINE',
                color: '#E74C3C',
                blinksPerMinute: 0,
                stillnessPercent: 0,
                facePresencePercent: 0,
              };
              onNext(fallback);
            }}
          />
        </View>
      </View>
    );
  }

  // Ready state
  if (phase === 'ready') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ProgressBar current={screenIndex + 1} total={15} />
        <View style={styles.readyContent}>
          <Text style={styles.readyEmoji}>🧘</Text>
          <Text style={styles.readyTitle}>Let's try it.{'\n'}Sit still for 15 seconds.</Text>
          <Text style={styles.readySubtitle}>
            We'll measure your stillness and blink rate to set your baseline.
          </Text>
          <OnboardingButton title="I'm ready" onPress={startCountdown} />
        </View>
      </View>
    );
  }

  // Countdown
  if (phase === 'countdown') {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          faceDetectionCallback={() => {}}
          faceDetectionOptions={faceDetectionOptions}
        />
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNumber}>{countdownValue}</Text>
        </View>
      </View>
    );
  }

  // Done
  if (phase === 'done') {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          faceDetectionCallback={() => {}}
          faceDetectionOptions={faceDetectionOptions}
        />
        <View style={styles.doneOverlay}>
          <Animated.Text style={[styles.doneText, { transform: [{ scale: pulseAnim }] }]}>
            Nice.
          </Animated.Text>
        </View>
      </View>
    );
  }

  // Active session
  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        faceDetectionCallback={handleFacesDetected}
        faceDetectionOptions={faceDetectionOptions}
      />

      {/* Top stats bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={styles.timerValue}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { top: insets.top + 56 }]}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((DEMO_DURATION_SECONDS - timeLeft) / DEMO_DURATION_SECONDS) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Live stats */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {encouragement ? (
          <Text style={styles.encouragement}>{encouragement}</Text>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(liveStats.stillness)}%</Text>
            <Text style={styles.statLabel}>still</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{liveStats.blinks}</Text>
            <Text style={styles.statLabel}>blinks</Text>
          </View>
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
  // Ready state
  readyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  readyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  readyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  readySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  // Camera states
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Countdown
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  countdownNumber: {
    fontFamily: FONTS.display,
    fontSize: 120,
    color: COLORS.textPrimary,
  },
  // Done
  doneOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  doneText: {
    fontFamily: FONTS.headingBold,
    fontSize: 48,
    color: COLORS.coral,
  },
  // Session
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(28,18,8,0.5)',
    letterSpacing: 1,
  },
  timerValue: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.textPrimary,
  },
  progressContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(28,18,8,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  encouragement: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.coral,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.monoBold,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(28,18,8,0.5)',
    marginTop: 2,
  },
  // No camera fallback
  noCameraContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  noCameraIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noCameraTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  noCameraText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
});
