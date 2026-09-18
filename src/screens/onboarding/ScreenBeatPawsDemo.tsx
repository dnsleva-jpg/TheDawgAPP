import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';

const PAWS_FOCUSED = require('../../../assets/shiba/shiba-thriving.png');
const PAWS_STRUGGLE = require('../../../assets/shiba/paws-scroll-3.png');
const PAWS_SAD = require('../../../assets/shiba/paws-scroll-5.png');

type DemoPhase = 'explain' | 'countdown' | 'playing' | 'result';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenBeatPawsDemo({ goNext }: Props) {
  const { updateField } = useOnboarding();
  const [phase, setPhase] = useState<DemoPhase>('explain');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blinks, setBlinks] = useState(0);
  const [pawsBlinked, setPawsBlinked] = useState(false);
  const [won, setWon] = useState(false);

  const DURATION = 20;
  const PAWS_BLINK_TIME = 15;

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const t = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setElapsed(secs);
      if (secs >= PAWS_BLINK_TIME && !pawsBlinked) {
        setPawsBlinked(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (secs >= DURATION) {
        clearInterval(interval);
        finishDemo();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, pawsBlinked]);

  const handleBlink = useCallback(() => {
    if (phase !== 'playing') return;
    setBlinks(b => b + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [phase, shakeAnim]);

  const finishDemo = useCallback(() => {
    const score = Math.max(0, Math.min(100, 100 - (blinks * 8) + 10));
    const didWin = blinks === 0 || pawsBlinked;
    setWon(didWin);
    setPhase('result');

    // Save baseline
    updateField('baselineScore' as any, String(score));

    Animated.spring(scoreAnim, { toValue: score, tension: 40, friction: 7, useNativeDriver: true }).start();
    Haptics.notificationAsync(didWin ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  }, [blinks, pawsBlinked, updateField, scoreAnim]);

  const timeLeft = Math.max(0, DURATION - elapsed);
  const score = Math.max(0, Math.min(100, 100 - (blinks * 8) + 10));

  // ─── EXPLAIN ───
  if (phase === 'explain') {
    return (
      <View style={st.container}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <Image source={PAWS_FOCUSED} style={st.pawsBig} resizeMode="contain" />
        </Animated.View>
        <Text style={st.title}>Beat Paws.</Text>
        <Text style={st.body}>
          Stare at Paws for 20 seconds.{'\n'}
          Don't blink. Don't look away.{'\n'}
          Tap the screen when you blink.
        </Text>
        <Text style={st.hook}>This is how Do Nothin' measures your focus.</Text>
        <TouchableOpacity style={st.startBtn} onPress={() => setPhase('countdown')} activeOpacity={0.8}>
          <Text style={st.startBtnText}>I'm ready</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} activeOpacity={0.7}>
          <Text style={st.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── COUNTDOWN ───
  if (phase === 'countdown') {
    return (
      <View style={st.container}>
        <Image source={PAWS_FOCUSED} style={st.pawsMed} resizeMode="contain" />
        <Text style={st.countdownNum}>{countdown || 'GO!'}</Text>
        <Text style={st.countdownSub}>Don't blink.</Text>
      </View>
    );
  }

  // ─── PLAYING ───
  if (phase === 'playing') {
    return (
      <TouchableOpacity style={st.container} onPress={handleBlink} activeOpacity={1}>
        <View style={st.topBar}>
          <Text style={st.timerText}>{timeLeft}s</Text>
          <Text style={st.blinkCount}>Blinks: {blinks}</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Image
            source={pawsBlinked ? PAWS_STRUGGLE : PAWS_FOCUSED}
            style={st.pawsBig}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={st.playHint}>
          {blinks === 0 ? "Staring contest... don't blink!" : `You blinked ${blinks} time${blinks > 1 ? 's' : ''}!`}
        </Text>
        <Text style={st.tapReminder}>Tap when you blink</Text>
      </TouchableOpacity>
    );
  }

  // ─── RESULT ───
  return (
    <View style={st.container}>
      <Image source={won ? PAWS_FOCUSED : PAWS_SAD} style={st.pawsMed} resizeMode="contain" />
      <Text style={st.resultTitle}>{won ? 'You beat Paws!' : 'Paws won this round.'}</Text>
      <Text style={st.scoreText}>{score}</Text>
      <Text style={st.scoreLabel}>Your baseline Focus Score</Text>
      <Text style={st.resultBody}>
        {won
          ? `${blinks} blinks in 20 seconds. Not bad for Day 0.`
          : `${blinks} blinks. This is your starting point — it only gets better.`}
      </Text>
      <TouchableOpacity style={st.startBtn} onPress={goNext} activeOpacity={0.8}>
        <Text style={st.startBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },

  pawsBig: { width: 180, height: 180 },
  pawsMed: { width: 140, height: 140 },

  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, color: '#1C1208', marginTop: 16 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', textAlign: 'center', lineHeight: 24, marginTop: 12 },
  hook: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#D4820A', textAlign: 'center', marginTop: 16 },
  startBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, width: '100%', alignItems: 'center', marginTop: 24 },
  startBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', marginTop: 16 },

  // Countdown
  countdownNum: { fontFamily: 'Outfit_800ExtraBold', fontSize: 72, color: '#1C1208', marginTop: 16 },
  countdownSub: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#8A7A60', marginTop: 8 },

  // Playing
  topBar: { position: 'absolute', top: 80, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  timerText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208' },
  blinkCount: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#E74C3C' },
  playHint: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208', textAlign: 'center', marginTop: 20 },
  tapReminder: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#B0A090', marginTop: 8 },

  // Result
  resultTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', marginTop: 16 },
  scoreText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 64, color: '#D4820A', marginTop: 8 },
  scoreLabel: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60' },
  resultBody: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 12 },
});
