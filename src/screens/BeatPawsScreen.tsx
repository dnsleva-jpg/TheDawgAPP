import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import type { FrameFaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { useFaceTracking } from '../hooks/useFaceTracking';
import { ScoringEngine } from '../scoring/scoringEngine';
import type { CalibrationFrame, FaceFrameInput } from '../scoring/scoringEngine';
import { SCORING_CONFIG } from '../scoring/scoringConfig';
import {
  getCurrentLevel,
  generatePawsBlinkTime,
  calculateBeatPawsScore,
  getBeatPawsStreak,
  type PawsLevel,
} from '../utils/beatPawsService';

const PAWS_FOCUS = require('../../assets/shiba/paws-focus.png');
const PAWS_STRUGGLE = require('../../assets/shiba/paws-cant-stop.png');
const PAWS_BLINKED = require('../../assets/shiba/paws-brain-fog.png');
const PAWS_WON = require('../../assets/shiba/paws-celebrating.png');

type GamePhase = 'intro' | 'countdown' | 'active' | 'keepGoing' | 'done';

interface BeatPawsScreenProps {
  onComplete: (result: {
    score: number; blinks: number; stillnessPercent: number;
    durationSeconds: number; won: boolean; longestStretch: number; levelName: string;
  }) => void;
  onCancel: () => void;
  isOnboarding?: boolean;
}

export function BeatPawsScreen({ onComplete, onCancel, isOnboarding = false }: BeatPawsScreenProps) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blinks, setBlinks] = useState(0);
  const [stillness, setStillness] = useState(100);
  const [level, setLevel] = useState<PawsLevel | null>(null);
  const [pawsBlinkTime, setPawsBlinkTime] = useState(15);
  const [pawsBlinked, setPawsBlinked] = useState(false);
  const [streak, setStreak] = useState(0);

  // Camera/scoring refs
  const engineRef = useRef<ScoringEngine | null>(null);
  const calibrationFrames = useRef<CalibrationFrame[]>([]);
  const isCalibrated = useRef(false);
  const startTimeRef = useRef(0);
  const lastBlinkCount = useRef(0);
  const longestStretch = useRef(0);
  const currentStretch = useRef(0);
  const blinkFlash = useRef(new Animated.Value(0)).current;

  const { handleFacesDetected, getResults, reset } = useFaceTracking();

  const faceDetectionOptions = useRef<FrameFaceDetectionOptions>({
    performanceMode: 'fast',
    classificationMode: 'all',
    landmarkMode: 'none',
    contourMode: 'none',
    trackingEnabled: false,
    minFaceSize: 0.2,
  }).current;

  // Init
  useEffect(() => {
    if (!hasPermission) requestPermission();
    getCurrentLevel().then((l) => {
      const lvl = isOnboarding
        ? { ...l, durationSeconds: 20, blinkRange: [14, 16] as [number, number] }
        : l;
      setLevel(lvl);
      setPawsBlinkTime(generatePawsBlinkTime(lvl));
    });
    getBeatPawsStreak().then(setStreak);
    engineRef.current = new ScoringEngine(SCORING_CONFIG, {
      stillnessWeight: 0.60,
      blinkWeight: 0.30,
      durationWeight: 0.10,
    });
  }, [hasPermission, requestPermission, isOnboarding]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('active');
      startTimeRef.current = Date.now();
      reset();
      calibrationFrames.current = [];
      isCalibrated.current = false;
      lastBlinkCount.current = 0;
      longestStretch.current = 0;
      currentStretch.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const t = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, reset]);

  // Match timer
  useEffect(() => {
    if (phase !== 'active' || !level) return;
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= pawsBlinkTime && !pawsBlinked) {
        setPawsBlinked(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (secs >= level.durationSeconds) {
        clearInterval(interval);
        setPhase('keepGoing');
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, pawsBlinkTime, pawsBlinked, level]);

  // Keep going — 5 second hold
  useEffect(() => {
    if (phase !== 'keepGoing') return;
    const t = setTimeout(() => finishMatch(), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  // Face detection callback — real blink detection
  const onFacesDetected = useCallback((faces: any[], frame: any) => {
    if (phase !== 'active') return;
    handleFacesDetected(faces, frame);

    const engine = engineRef.current;
    if (!engine) return;
    const now = Date.now();

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
          setBlinks(result.blinkCount);

          // New blink detected
          if (result.blinkCount > lastBlinkCount.current) {
            lastBlinkCount.current = result.blinkCount;
            currentStretch.current = 0;

            // Red flash + haptic
            Animated.sequence([
              Animated.timing(blinkFlash, { toValue: 0.3, duration: 80, useNativeDriver: true }),
              Animated.timing(blinkFlash, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else {
            currentStretch.current += 0.17;
            if (currentStretch.current > longestStretch.current) {
              longestStretch.current = currentStretch.current;
            }
          }
        }
      }
    } else {
      engine.processFrame(null);
    }
  }, [phase, handleFacesDetected, blinkFlash]);

  const finishMatch = useCallback(() => {
    setPhase('done');
    const results = getResults();
    const won = pawsBlinked && results.totalBlinks === 0;
    const score = calculateBeatPawsScore(
      results.totalBlinks,
      Math.max(0, 10 - Math.round(results.stillnessScore / 10)),
      Math.round(longestStretch.current),
      streak,
    );
    Haptics.notificationAsync(won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    onComplete({
      score, blinks: results.totalBlinks, stillnessPercent: results.stillnessScore,
      durationSeconds: elapsed, won, longestStretch: Math.round(longestStretch.current),
      levelName: level?.name ?? 'Pup',
    });
  }, [getResults, pawsBlinked, streak, elapsed, level, onComplete]);

  const handleKeepGoing = useCallback(() => {
    if (!level) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPawsBlinked(false);
    setPawsBlinkTime(generatePawsBlinkTime(level));
    setPhase('active');
  }, [level]);

  if (!device || !hasPermission) {
    return (
      <SafeAreaView style={st.container}>
        <Text style={st.permText}>Camera access needed for Beat Paws</Text>
        <TouchableOpacity style={st.permBtn} onPress={requestPermission}>
          <Text style={st.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const timeLeft = level ? Math.max(0, level.durationSeconds - elapsed) : 0;
  const pawsImage = pawsBlinked ? PAWS_BLINKED : elapsed >= (pawsBlinkTime - 3) ? PAWS_STRUGGLE : PAWS_FOCUS;

  return (
    <SafeAreaView style={st.container}>
      {/* Camera feed */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={phase === 'active' || phase === 'countdown' || phase === 'keepGoing'}
        faceDetectionCallback={onFacesDetected}
        faceDetectionOptions={faceDetectionOptions}
      />

      {/* Red blink flash */}
      <Animated.View style={[st.blinkOverlay, { opacity: blinkFlash }]} pointerEvents="none" />

      {/* Dark overlay */}
      <View style={st.darkOverlay} pointerEvents="none" />

      {/* Close button */}
      <TouchableOpacity style={st.closeBtn} onPress={onCancel}>
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* INTRO */}
      {phase === 'intro' && (
        <View style={st.centerWrap}>
          <Image source={PAWS_FOCUS} style={st.introPaws} resizeMode="contain" />
          <Text style={st.introTitle}>Beat Paws</Text>
          <Text style={st.introBody}>
            Stare at Paws. Don't blink. Don't move.{'\n'}
            Paws tracks your blinks with the camera.{'\n'}
            Fewer blinks = higher Focus Score.
          </Text>
          <View style={st.introRules}>
            <View style={st.ruleRow}><Text style={st.ruleIcon}>👁️</Text><Text style={st.ruleText}>Camera detects your blinks</Text></View>
            <View style={st.ruleRow}><Text style={st.ruleIcon}>🧘</Text><Text style={st.ruleText}>Stay perfectly still</Text></View>
            <View style={st.ruleRow}><Text style={st.ruleIcon}>⏱️</Text><Text style={st.ruleText}>{level?.durationSeconds ?? 20}s to beat Paws</Text></View>
          </View>
          <TouchableOpacity style={st.startBtn} onPress={() => setPhase('countdown')} activeOpacity={0.8}>
            <Text style={st.startBtnText}>Start Match</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* COUNTDOWN */}
      {phase === 'countdown' && (
        <View style={st.centerWrap}>
          <Text style={st.countdownNum}>{countdown || 'GO!'}</Text>
          <Text style={st.countdownSub}>Don't blink. Don't move.</Text>
        </View>
      )}

      {/* ACTIVE MATCH */}
      {phase === 'active' && (
        <>
          <View style={st.topBar}>
            <Text style={st.timerText}>{timeLeft}s</Text>
            <Text style={st.levelText}>{level?.emoji} {level?.label}</Text>
            {streak > 0 && <Text style={st.streakText}>🔥 {streak}</Text>}
          </View>

          <View style={st.bottomStats}>
            <View style={st.statBox}>
              <Text style={st.statValue}>{blinks}</Text>
              <Text style={st.statLabel}>Blinks</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statValue}>{stillness}%</Text>
              <Text style={st.statLabel}>Stillness</Text>
            </View>
          </View>

          <View style={st.pawsCorner}>
            <Image source={pawsImage} style={st.pawsSmall} resizeMode="contain" />
          </View>
        </>
      )}

      {/* KEEP GOING */}
      {phase === 'keepGoing' && (
        <View style={st.keepGoingWrap}>
          <Text style={st.keepGoingTitle}>Keep going?</Text>
          <Text style={st.keepGoingSub}>Hold still for 5 more seconds</Text>
          <TouchableOpacity style={st.keepGoingBtn} onPress={handleKeepGoing} activeOpacity={0.8}>
            <Text style={st.keepGoingBtnText}>Keep Going</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={finishMatch} activeOpacity={0.7}>
            <Text style={st.endText}>End match</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  blinkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E74C3C' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  closeBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 8 },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  permText: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', textAlign: 'center', marginTop: 100 },
  permBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 16, paddingHorizontal: 32, marginTop: 20 },
  permBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF' },

  // Intro
  introPaws: { width: 120, height: 120, marginBottom: 12 },
  introTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: '#FFF' },
  introBody: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  introRules: { marginTop: 20, gap: 12, width: '100%' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14 },
  ruleIcon: { fontSize: 20 },
  ruleText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#FFF' },
  startBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, width: '100%', alignItems: 'center', marginTop: 24 },
  startBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF' },

  // Countdown
  countdownNum: { fontFamily: 'Outfit_800ExtraBold', fontSize: 96, color: '#FFF' },
  countdownSub: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  // Active
  topBar: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  timerText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: '#FFF' },
  levelText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  streakText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF' },
  bottomStats: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 40 },
  statBox: { alignItems: 'center' },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#FFF' },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  pawsCorner: { position: 'absolute', bottom: 130, right: 20, backgroundColor: 'rgba(247,244,238,0.9)', borderRadius: 20, padding: 8 },
  pawsSmall: { width: 80, height: 80 },

  // Keep going
  keepGoingWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  keepGoingTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#FFF' },
  keepGoingSub: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  keepGoingBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, paddingHorizontal: 48, marginTop: 24 },
  keepGoingBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF' },
  endText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 16 },
});
