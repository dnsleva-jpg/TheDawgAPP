import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Conditional camera imports — graceful fallback for preview builds
let CameraModule: any = null;
let useCameraDeviceFn: any = null;
let useCameraPermissionFn: any = null;
let useFaceTrackingFn: any = null;
let ScoringEngineClass: any = null;
let scoringConfig: any = null;

try {
  const vc = require('react-native-vision-camera');
  const vcd = require('react-native-vision-camera-face-detector');
  CameraModule = vcd.Camera;
  useCameraDeviceFn = vc.useCameraDevice;
  useCameraPermissionFn = vc.useCameraPermission;
  useFaceTrackingFn = require('../../hooks/useFaceTracking').useFaceTracking;
  ScoringEngineClass = require('../../scoring/scoringEngine').ScoringEngine;
  scoringConfig = require('../../scoring/scoringConfig').SCORING_CONFIG;
} catch {
  // Camera not available in this build
}

const PAWS_FOCUS = require('../../../assets/shiba/paws-focus.png');
const PAWS_HOOKED = require('../../../assets/shiba/paws-hooked.png');
const PAWS_CELEBRATING = require('../../../assets/shiba/paws-celebrating.png');

type Phase = 'permission' | 'ready' | 'stillness' | 'blink' | 'challenge' | 'result' | 'simulated';

// Paws dialogue per phase — lines rotate mid-phase via `enterAt` (ms after phase start)
type PawsLine = { enterAt: number; title: string; sub: string; paws: any };

const PAWS_LINES: Record<Exclude<Phase, 'permission' | 'result'>, PawsLine[]> = {
  ready: [
    { enterAt: 0,    title: "I'm Paws. Let's measure your focus.", sub: 'Look at me.', paws: PAWS_FOCUS },
  ],
  stillness: [
    { enterAt: 0,    title: 'Freeze like a statue.',       sub: "I'm tracking every micro-movement.", paws: PAWS_FOCUS },
    { enterAt: 2500, title: "Nice — you're locked in.",    sub: 'This is what stillness looks like.', paws: PAWS_FOCUS },
  ],
  blink: [
    { enterAt: 0,    title: 'Now blink on purpose.',       sub: 'I see every one.',                    paws: PAWS_HOOKED },
    { enterAt: 2500, title: 'Every blink drops your score.', sub: 'Focus costs attention.',           paws: PAWS_HOOKED },
  ],
  challenge: [
    { enterAt: 0,    title: "Stare at me. Don't blink.",   sub: 'Hold it as long as you can.',         paws: PAWS_FOCUS },
    { enterAt: 3000, title: 'Almost there — keep going.',  sub: "This is the real you.",               paws: PAWS_FOCUS },
  ],
  simulated: [
    { enterAt: 0,    title: 'This is your daily Focus Test.',       sub: "20 seconds. That's it.",              paws: PAWS_FOCUS },
    { enterAt: 4000, title: 'I measure stillness and every blink.', sub: 'Your score is earned, not estimated.', paws: PAWS_HOOKED },
    { enterAt: 8000, title: 'Every day, your score climbs.',        sub: 'Day 0 starts now.',                   paws: PAWS_CELEBRATING },
  ],
};

// Transient reaction lines — flash over the instruction for ~900ms
const BLINK_CHALLENGE_REACTIONS = [
  { title: 'I saw that!',        sub: 'That one cost you.' },
  { title: 'Oof — a blink.',     sub: 'Stay with me.' },
  { title: 'Gotcha.',            sub: 'Your score just dropped.' },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenGuidedDemo({ goNext }: Props) {
  const [phase, setPhase] = useState<Phase>('permission');
  const [hasCamera, setHasCamera] = useState(false);
  const [stillness, setStillness] = useState(0);
  const [blinks, setBlinks] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(7);
  const [challengeBlinks, setChallengeBlinks] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [reaction, setReaction] = useState<{ title: string; sub: string } | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const meterWidth = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const pawsScale = useRef(new Animated.Value(1)).current;

  // Camera refs
  const device = useCameraDeviceFn ? useCameraDeviceFn('front') : null;
  const permission = useCameraPermissionFn ? useCameraPermissionFn() : { hasPermission: false, requestPermission: async () => {} };
  const faceTracking = useFaceTrackingFn ? useFaceTrackingFn() : null;
  const engineRef = useRef<any>(null);
  const calibrationFrames = useRef<any[]>([]);
  const isCalibrated = useRef(false);
  const lastBlinkCount = useRef(0);
  const phaseStartTime = useRef(0);

  const faceDetectionOptions = useRef({
    performanceMode: 'fast',
    classificationMode: 'all',
    landmarkMode: 'none',
    contourMode: 'none',
    trackingEnabled: false,
    minFaceSize: 0.2,
  }).current;

  // ─── PHASE MANAGEMENT ─────────────────────────────────

  // Request camera permission
  useEffect(() => {
    if (phase !== 'permission') return;

    if (!CameraModule || !device) {
      // No camera available — run simulated demo
      setTimeout(() => setPhase('simulated'), 500);
      return;
    }

    if (permission.hasPermission) {
      initEngine();
      setHasCamera(true);
      setPhase('ready');
    } else {
      permission.requestPermission().then((granted: any) => {
        if (granted) {
          initEngine();
          setHasCamera(true);
          setPhase('ready');
        } else {
          setPhase('simulated');
        }
      });
    }
  }, [phase]);

  const initEngine = () => {
    if (ScoringEngineClass && scoringConfig) {
      engineRef.current = new ScoringEngineClass(scoringConfig);
    }
  };

  // Ready → Stillness (auto after 2s)
  useEffect(() => {
    if (phase !== 'ready') return;
    fadeInInstruction();
    const t = setTimeout(() => {
      phaseStartTime.current = Date.now();
      setPhase('stillness');
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Stillness phase (5 seconds)
  useEffect(() => {
    if (phase !== 'stillness') return;
    fadeInInstruction();
    const t = setTimeout(() => {
      setPhase('blink');
      lastBlinkCount.current = blinks;
    }, 5000);
    return () => clearTimeout(t);
  }, [phase]);

  // Blink teaching phase (5 seconds)
  useEffect(() => {
    if (phase !== 'blink') return;
    fadeInInstruction();
    const t = setTimeout(() => {
      setChallengeBlinks(0);
      lastBlinkCount.current = blinks;
      setChallengeTimer(7);
      setPhase('challenge');
    }, 5000);
    return () => clearTimeout(t);
  }, [phase, blinks]);

  // Challenge phase (7 second countdown)
  useEffect(() => {
    if (phase !== 'challenge') return;
    fadeInInstruction();

    const interval = setInterval(() => {
      setChallengeTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishDemo();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // ─── PAWS DIALOGUE ROTATION ───────────────────────────
  // Reset line idx on phase change, then schedule auto-advance to later lines.
  useEffect(() => {
    setLineIdx(0);
    setReaction(null);
    const lines = PAWS_LINES[phase as keyof typeof PAWS_LINES];
    if (!lines) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    lines.forEach((line, i) => {
      if (i === 0) return;
      timeouts.push(
        setTimeout(() => {
          setLineIdx(i);
          fadeInInstruction();
        }, line.enterAt),
      );
    });
    return () => {
      timeouts.forEach(clearTimeout);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, [phase]);

  // ─── FACE DETECTION CALLBACK ──────────────────────────

  const onFacesDetected = useCallback((faces: any[], frame: any) => {
    if (!faceTracking) return;
    faceTracking.handleFacesDetected(faces, frame);

    const engine = engineRef.current;
    if (!engine) return;

    const now = Date.now();

    if (faces.length > 0) {
      const face = faces[0];
      const faceData = {
        yaw: face.yawAngle ?? 0,
        pitch: face.pitchAngle ?? 0,
        roll: face.rollAngle ?? 0,
        faceX: face.bounds ? face.bounds.x + face.bounds.width / 2 : 0,
        faceY: face.bounds ? face.bounds.y + face.bounds.height / 2 : 0,
        leftEyeOpenProbability: face.leftEyeOpenProbability ?? -1,
        rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
        timestamp: now,
      };

      if (!isCalibrated.current) {
        calibrationFrames.current.push({
          yaw: faceData.yaw, pitch: faceData.pitch, roll: faceData.roll,
          faceX: faceData.faceX, faceY: faceData.faceY, timestamp: now,
        });
        if (calibrationFrames.current.length >= 15) {
          engine.calibrate(calibrationFrames.current);
          isCalibrated.current = true;
        }
      } else {
        const result = engine.processFrame(faceData);
        if (result) {
          setStillness(Math.round(result.liveStillness));

          if (result.blinkCount > lastBlinkCount.current) {
            const newBlinks = result.blinkCount;
            setBlinks(newBlinks);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Track challenge blinks + flash a Paws reaction line
            if (phase === 'challenge') {
              setChallengeBlinks((c) => c + 1);
              const r = BLINK_CHALLENGE_REACTIONS[
                Math.floor(Math.random() * BLINK_CHALLENGE_REACTIONS.length)
              ];
              setReaction(r);
              fadeInInstruction();
              if (reactionTimer.current) clearTimeout(reactionTimer.current);
              reactionTimer.current = setTimeout(() => setReaction(null), 900);
            }

            // Paws reaction
            Animated.sequence([
              Animated.timing(pawsScale, { toValue: 0.9, duration: 60, useNativeDriver: true }),
              Animated.spring(pawsScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
            ]).start();

            lastBlinkCount.current = newBlinks;
          }

          // Update meter
          Animated.timing(meterWidth, {
            toValue: result.liveStillness / 100,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      }
    } else {
      engine.processFrame(null);
    }
  }, [phase, faceTracking, pawsScale, meterWidth]);

  // ─── HELPERS ───────────────────────────────────────────

  const fadeInInstruction = () => {
    instructionOpacity.setValue(0);
    Animated.timing(instructionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const finishDemo = () => {
    const score = Math.max(10, Math.min(100, 100 - (challengeBlinks * 15) + Math.round(stillness * 0.3)));
    setFinalScore(score);
    setPhase('result');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scoreScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();
  };

  // ─── SIMULATED DEMO (no camera) ───────────────────────

  useEffect(() => {
    if (phase !== 'simulated') return;
    fadeInInstruction();

    // Fake a demo experience with animated numbers
    let fakeStillness = 0;
    let fakeBlinks = 0;
    const interval = setInterval(() => {
      fakeStillness = Math.min(95, fakeStillness + 5);
      setStillness(fakeStillness);
      Animated.timing(meterWidth, { toValue: fakeStillness / 100, duration: 200, useNativeDriver: false }).start();
    }, 200);

    // Simulate blinks at certain moments
    setTimeout(() => { fakeBlinks++; setBlinks(fakeBlinks); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 3000);
    setTimeout(() => { fakeBlinks++; setBlinks(fakeBlinks); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 5000);
    setTimeout(() => { fakeBlinks++; setBlinks(fakeBlinks); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, 8000);

    // Show result after 12 seconds
    const t = setTimeout(() => {
      clearInterval(interval);
      setFinalScore(62);
      setPhase('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(scoreScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();
    }, 12000);

    return () => { clearInterval(interval); clearTimeout(t); };
  }, [phase]);

  // ─── RENDER ────────────────────────────────────────────

  const cameraActive = hasCamera && phase !== 'permission' && phase !== 'result';

  const getInstruction = () => {
    // Challenge phase shows the live countdown in the timer element —
    // the Paws line stays as dialogue, not the number.
    const lines = PAWS_LINES[phase as keyof typeof PAWS_LINES];
    const line = lines?.[Math.min(lineIdx, (lines?.length ?? 1) - 1)];
    if (reaction && line) {
      return { title: reaction.title, sub: reaction.sub, paws: PAWS_HOOKED };
    }
    if (line) return line;
    return { title: '', sub: '', paws: PAWS_FOCUS };
  };

  const instruction = getInstruction();
  const showStats = ['stillness', 'blink', 'challenge', 'simulated'].includes(phase);

  // ─── RESULT SCREEN ────────────────────────────────────

  if (phase === 'result') {
    const gradeColor = finalScore >= 80 ? '#4CAF50' : finalScore >= 60 ? '#D4820A' : finalScore >= 40 ? '#E67E22' : '#E74C3C';
    return (
      <View style={st.resultContainer}>
        <StatusBar style="dark" />
        <Image source={finalScore >= 60 ? PAWS_CELEBRATING : PAWS_HOOKED} style={st.resultPaws} resizeMode="contain" />

        <Animated.View style={[st.scoreCircle, { transform: [{ scale: scoreScale }] }]}>
          <Text style={[st.scoreNumber, { color: gradeColor }]}>{finalScore}</Text>
        </Animated.View>

        <Text style={st.resultTitle}>Your baseline Focus Score</Text>
        <Text style={st.resultBody}>Day 0 — this is where you start.</Text>
        <Text style={st.resultHook}>
          Every day you test with Paws,{'\n'}your score improves. Imagine Day 90.
        </Text>

        <Text style={st.resultBtn} onPress={goNext}>Continue</Text>
      </View>
    );
  }

  // ─── MAIN GUIDED DEMO SCREEN ──────────────────────────

  return (
    <View style={st.container}>
      <StatusBar style={hasCamera ? 'light' : 'dark'} />

      {/* Camera feed (full screen behind overlays) */}
      {cameraActive && CameraModule && device && (
        <CameraModule
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          faceDetectionCallback={onFacesDetected}
          faceDetectionOptions={faceDetectionOptions}
        />
      )}

      {/* Dark overlay for readability */}
      {cameraActive && <View style={st.cameraOverlay} pointerEvents="none" />}

      {/* Non-camera background */}
      {!cameraActive && <View style={st.warmBg} />}

      {/* Paws in corner */}
      <Animated.View style={[st.pawsCorner, { transform: [{ scale: pawsScale }] }]}>
        <Image source={instruction.paws} style={st.pawsImage} resizeMode="contain" />
      </Animated.View>

      {/* Phase instruction */}
      <Animated.View style={[st.instructionWrap, { opacity: instructionOpacity }]}>
        <Text style={[st.instructionTitle, hasCamera && st.instructionTitleLight]}>{instruction.title}</Text>
        <Text style={[st.instructionSub, hasCamera && st.instructionSubLight]}>{instruction.sub}</Text>
      </Animated.View>

      {/* Live stats */}
      {showStats && (
        <View style={st.statsWrap}>
          {/* Stillness meter */}
          <View style={st.meterContainer}>
            <Text style={[st.meterLabel, hasCamera && { color: 'rgba(255,255,255,0.7)' }]}>Stillness</Text>
            <View style={st.meterTrack}>
              <Animated.View style={[st.meterFill, {
                width: meterWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: stillness >= 70 ? '#4CAF50' : stillness >= 40 ? '#D4820A' : '#E74C3C',
              }]} />
            </View>
            <Text style={[st.meterValue, hasCamera && { color: '#FFF' }]}>{stillness}%</Text>
          </View>

          {/* Blink counter */}
          <View style={st.blinkCounter}>
            <Text style={[st.blinkLabel, hasCamera && { color: 'rgba(255,255,255,0.7)' }]}>Blinks</Text>
            <Text style={[st.blinkValue, hasCamera && { color: '#FFF' }]}>{blinks}</Text>
          </View>

          {/* Challenge timer */}
          {phase === 'challenge' && (
            <View style={st.challengeTimerWrap}>
              <Text style={st.challengeTimerNum}>{challengeTimer}</Text>
            </View>
          )}
        </View>
      )}

      {/* Phase indicator dots */}
      <View style={st.phaseDots}>
        {['ready', 'stillness', 'blink', 'challenge'].map((p, i) => (
          <View key={p} style={[
            st.phaseDot,
            (phase === p || ['stillness', 'blink', 'challenge'].indexOf(phase) > i - 1) && st.phaseDotActive,
          ]} />
        ))}
      </View>

      {/* Loading / permission state */}
      {phase === 'permission' && (
        <View style={st.permissionWrap}>
          <Image source={PAWS_FOCUS} style={st.permissionPaws} resizeMode="contain" />
          <Text style={st.permissionText}>Setting up camera...</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  warmBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F7F4EE' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },

  // Paws corner
  pawsCorner: {
    position: 'absolute', bottom: 120, right: 20, zIndex: 10,
    backgroundColor: 'rgba(247,244,238,0.95)', borderRadius: 20, padding: 8,
  },
  pawsImage: { width: 80, height: 80 },

  // Instructions
  instructionWrap: { position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  instructionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center' },
  instructionTitleLight: { color: '#FFFFFF' },
  instructionSub: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', textAlign: 'center', marginTop: 6 },
  instructionSubLight: { color: 'rgba(255,255,255,0.7)' },

  // Stats
  statsWrap: { position: 'absolute', bottom: 220, left: 24, right: 24 },
  meterContainer: { marginBottom: 12 },
  meterLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#8A7A60', marginBottom: 6 },
  meterTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 100 },
  meterValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 20, color: '#1C1208', marginTop: 4 },
  blinkCounter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blinkLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#8A7A60' },
  blinkValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208' },
  challengeTimerWrap: { position: 'absolute', top: -80, alignSelf: 'center' },
  challengeTimerNum: { fontFamily: 'Outfit_800ExtraBold', fontSize: 72, color: '#FFFFFF' },

  // Phase dots
  phaseDots: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', gap: 8 },
  phaseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  phaseDotActive: { backgroundColor: '#D4820A', width: 20 },

  // Permission
  permissionWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionPaws: { width: 120, height: 120, marginBottom: 16 },
  permissionText: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60' },

  // Result
  resultContainer: { flex: 1, backgroundColor: '#F7F4EE', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  resultPaws: { width: 120, height: 120, marginBottom: 12 },
  scoreCircle: { alignItems: 'center', marginBottom: 8 },
  scoreNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 72 },
  resultTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#1C1208' },
  resultBody: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', marginTop: 4 },
  resultHook: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 16 },
  resultBtn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', marginTop: 24, overflow: 'hidden' },
});
