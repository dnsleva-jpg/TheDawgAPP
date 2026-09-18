import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

type PawsState = 'focus' | 'calm' | 'celebrating' | 'notepad' | 'tempted';

interface PillarBadge {
  label: string;
  value: string;
  bg: string;
  fg: string;
}

interface Pillar {
  num: string;
  name: string;
  pawsState: PawsState;
  one: string;
  two: string;
  accent: string;
  tint: string;
  haptic: 'Light' | 'Medium' | 'Heavy';
  badge: PillarBadge;
}

const PILLARS: Pillar[] = [
  {
    num: '01',
    name: 'MEASURE',
    pawsState: 'focus',
    one: 'Weekly camera test.',
    two: 'Stillness. Blinks. Focus 0–100.',
    accent: '#D4820A',
    tint: 'rgba(212, 130, 10, 0.22)',
    haptic: 'Heavy',
    badge: { label: 'FOCUS', value: '87', bg: 'rgba(22, 163, 74, 0.16)', fg: '#16A34A' },
  },
  {
    num: '02',
    name: 'SHIELD',
    pawsState: 'calm',
    one: 'Doom apps get a pause.',
    two: '30 seconds before TikTok opens.',
    accent: '#16A34A',
    tint: 'rgba(22, 163, 74, 0.20)',
    haptic: 'Heavy',
    badge: { label: 'PAUSE', value: '30s', bg: 'rgba(220, 38, 38, 0.14)', fg: '#DC2626' },
  },
  {
    num: '03',
    name: 'TRAIN',
    pawsState: 'celebrating',
    one: 'Daily phone-free wins.',
    two: 'Walks. Drawing. Real things.',
    accent: '#3B82F6',
    tint: 'rgba(59, 130, 246, 0.20)',
    haptic: 'Heavy',
    badge: { label: 'WIN', value: '✓ WALK', bg: 'rgba(59, 130, 246, 0.16)', fg: '#3B82F6' },
  },
  {
    num: '04',
    name: 'TRACK',
    pawsState: 'notepad',
    one: '90-day Brain Recovery.',
    two: 'Watch yourself come back.',
    accent: '#9333EA',
    tint: 'rgba(147, 51, 234, 0.22)',
    haptic: 'Heavy',
    badge: { label: 'DAY', value: '90', bg: 'rgba(147, 51, 234, 0.14)', fg: '#9333EA' },
  },
];

const FAILS = [
  { tag: 'App blockers', text: 'you unblock them' },
  { tag: 'Screen time', text: "knowing doesn't change behavior" },
  { tag: 'Willpower', text: "you're outgunned by design" },
];

const INTRO_DURATION = 3800;     // slowed for readability
const PILLAR_DURATION = 2300;    // ~50% slower than before
const FLASH_DURATION = 320;
const FINAL_HOLD = 900;

type Phase = 'intro' | 'pillar';

export function ScreenHowItWorks({ goNext }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [pillarIdx, setPillarIdx] = useState(0);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  // Master progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: INTRO_DURATION + PILLAR_DURATION * PILLARS.length,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Halo pulse loop (always running)
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(haloPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(haloPulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, [haloPulse]);

  // Intro phase
  useEffect(() => {
    if (phase !== 'intro') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Heavy haptic on each X stamp + selection on each strike-through
    const xTimers: ReturnType<typeof setTimeout>[] = [];
    [0, 1, 2].forEach((i) => {
      const stampDelay = 740 + i * 420;
      xTimers.push(setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), stampDelay));
      xTimers.push(setTimeout(() => Haptics.selectionAsync().catch(() => {}), stampDelay + 300));
    });

    const advance = setTimeout(() => setPhase('pillar'), INTRO_DURATION);

    return () => {
      xTimers.forEach(clearTimeout);
      clearTimeout(advance);
    };
  }, [phase]);

  // Pillar phase
  useEffect(() => {
    if (phase !== 'pillar') return;
    const pillar = PILLARS[pillarIdx];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle[pillar.haptic]).catch(() => {});
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 100);

    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: FLASH_DURATION,
      useNativeDriver: false,
    }).start();

    const t = setTimeout(() => {
      if (pillarIdx < PILLARS.length - 1) {
        setPillarIdx(pillarIdx + 1);
      } else {
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 100);
        setTimeout(() => goNext(), FINAL_HOLD);
      }
    }, PILLAR_DURATION);

    return () => clearTimeout(t);
  }, [phase, pillarIdx, goNext, flashAnim]);

  const current = PILLARS[pillarIdx];
  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(247,244,238,0)', current.tint],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={st.container}>
      {/* Accent flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: flashColor }]}
      />

      <View style={st.stage}>
        <AnimatePresence exitBeforeEnter>
          {phase === 'intro' && (
            <MotiView
              key="intro"
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -24, scale: 0.94 }}
              transition={{ type: 'timing', duration: 320 }}
              style={st.introWrap}
            >
              {/* Hero Paws (tempted = phone-bound, we'll fix it) */}
              <MotiView
                from={{ opacity: 0, scale: 0.6, rotate: '-8deg' }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                transition={{ type: 'spring', damping: 11, mass: 0.9 }}
                style={st.introPawsWrap}
              >
                <Animated.View
                  style={[
                    st.haloIntro,
                    {
                      opacity: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] }),
                      transform: [{
                        scale: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }),
                      }],
                    },
                  ]}
                />
                <AnimatedPaws state="tempted" size={130} />
              </MotiView>

              <MotiText
                from={{ opacity: 0, translateX: -32 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 12, mass: 0.9, delay: 200 }}
                style={st.introH1}
              >
                Blocking doesn't work.
              </MotiText>

              <MotiText
                from={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 9, mass: 0.7, delay: 460 }}
                style={st.introH2}
              >
                <Text style={st.introH2Strong}>Measuring</Text> does.
              </MotiText>

              <View style={st.failList}>
                {FAILS.map((f, i) => {
                  const baseDelay = 700 + i * 420;
                  return (
                    <MotiView
                      key={f.tag}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 220, delay: baseDelay }}
                      style={st.failRow}
                    >
                      <View style={st.failXWrap}>
                        {/* Red shockwave stamp */}
                        <MotiView
                          from={{ opacity: 0.5, scale: 0 }}
                          animate={{ opacity: 0, scale: 2.6 }}
                          transition={{ type: 'timing', duration: 520, delay: baseDelay + 40 }}
                          style={st.shockwave}
                        />
                        {/* Big X — overshoot bounce */}
                        <MotiText
                          from={{ scale: 0, rotate: '-110deg' }}
                          animate={{ scale: 1, rotate: '0deg' }}
                          transition={{ type: 'spring', damping: 7, mass: 0.5, delay: baseDelay + 40 }}
                          style={st.failX}
                        >
                          ✗
                        </MotiText>
                      </View>

                      <View style={st.failTextWrap}>
                        <Text style={st.failText}>
                          <Text style={st.failTag}>{f.tag}</Text>
                          <Text style={st.failDash}> — </Text>
                          {f.text}
                        </Text>
                        {/* Strike-through line draws across after X lands */}
                        <MotiView
                          from={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ type: 'timing', duration: 380, delay: baseDelay + 280 }}
                          style={st.strikeLine}
                        />
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            </MotiView>
          )}

          {phase === 'pillar' && (
            <MotiView
              key={current.num}
              from={{ opacity: 0, translateX: 60, scale: 0.94 }}
              animate={{ opacity: 1, translateX: 0, scale: 1 }}
              exit={{ opacity: 0, translateX: -60, scale: 0.96 }}
              transition={{ type: 'timing', duration: 320 }}
              style={st.card}
            >
              {/* Big number — bounces in */}
              <MotiText
                from={{ opacity: 0, scale: 0.5, translateY: 14 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 9, mass: 0.7, delay: 80 }}
                style={[st.num, { color: current.accent }]}
              >
                {current.num}
                <Text style={st.numTotal}>/04</Text>
              </MotiText>

              {/* Paws hero with pulsing halo + thematic badge */}
              <View style={st.pawsStage}>
                <Animated.View
                  style={[
                    st.halo,
                    {
                      backgroundColor: current.accent,
                      opacity: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.36] }),
                      transform: [{
                        scale: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.10] }),
                      }],
                    },
                  ]}
                />
                <MotiView
                  from={{ opacity: 0, scale: 0.4, rotate: '-12deg' }}
                  animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                  transition={{ type: 'spring', damping: 10, mass: 0.85, delay: 200 }}
                >
                  <AnimatedPaws state={current.pawsState} size={150} />
                </MotiView>

                {/* Floating thematic badge — PAUSE 30s, FOCUS 87, etc. */}
                <MotiView
                  from={{ opacity: 0, scale: 0.4, translateY: 8 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 9, mass: 0.6, delay: 480 }}
                  style={[st.pillarBadge, { backgroundColor: current.badge.bg }]}
                >
                  <Text style={[st.pillarBadgeLabel, { color: current.badge.fg }]}>
                    {current.badge.label}
                  </Text>
                  <Text style={[st.pillarBadgeValue, { color: current.badge.fg }]}>
                    {current.badge.value}
                  </Text>
                </MotiView>
              </View>

              {/* Pillar name — slams in */}
              <MotiText
                from={{ opacity: 0, translateX: -34, scale: 0.92 }}
                animate={{ opacity: 1, translateX: 0, scale: 1 }}
                transition={{ type: 'timing', duration: 340, delay: 360 }}
                style={[st.name, { color: current.accent }]}
              >
                {current.name}
              </MotiText>

              {/* Line one */}
              <MotiText
                from={{ opacity: 0, translateY: 18 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 14, mass: 1.0, delay: 540 }}
                style={st.lineOne}
              >
                {current.one}
              </MotiText>

              {/* Line two */}
              <MotiText
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 320, delay: 720 }}
                style={st.lineTwo}
              >
                {current.two}
              </MotiText>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Phase header (pillar phase only) */}
      {phase === 'pillar' && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 220 }}
          style={st.phaseHeader}
        >
          <Text style={st.phaseHeaderText}>HOW WE GET YOUR BRAIN BACK</Text>
        </MotiView>
      )}

      {/* Dot indicators */}
      {phase === 'pillar' && (
        <View style={st.dots}>
          {PILLARS.map((p, i) => (
            <MotiView
              key={p.num}
              animate={{
                width: i === pillarIdx ? 32 : 9,
                backgroundColor: i < pillarIdx ? '#1C1208' : i === pillarIdx ? p.accent : '#E0D8CC',
              }}
              transition={{ type: 'timing', duration: 240 }}
              style={st.dot}
            />
          ))}
        </View>
      )}

      <View style={st.progressTrack}>
        <Animated.View
          style={[
            st.progressFill,
            { width: progressWidth, backgroundColor: phase === 'intro' ? '#1C1208' : current.accent },
          ]}
        />
      </View>

      {showConfetti && (
        <ConfettiCannon
          count={140}
          origin={{ x: -10, y: 0 }}
          fadeOut
          autoStart
          fallSpeed={2400}
          colors={['#D4820A', '#16A34A', '#3B82F6', '#9333EA', '#FFFFFF']}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Intro
  introWrap: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  introPawsWrap: {
    alignSelf: 'center',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloIntro: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DC2626',
  },
  introH1: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 36,
    color: '#1C1208',
    letterSpacing: 0.2,
    lineHeight: 40,
  },
  introH2: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 36,
    color: '#1C1208',
    letterSpacing: 0.2,
    lineHeight: 40,
    marginBottom: 24,
  },
  introH2Strong: {
    color: '#16A34A',
  },
  failList: {
    width: '100%',
    gap: 18,
  },
  failRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  failXWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwave: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
  },
  failX: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 48,
    color: '#DC2626',
    lineHeight: 50,
    textShadowColor: 'rgba(220, 38, 38, 0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  failTextWrap: {
    flex: 1,
    position: 'relative',
    paddingVertical: 4,
  },
  failText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 17,
    color: '#1C1208',
    lineHeight: 24,
  },
  failTag: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1C1208',
  },
  failDash: {
    color: '#8A7A60',
  },
  strikeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2.5,
    backgroundColor: '#DC2626',
    borderRadius: 2,
    transformOrigin: 'left' as any,
  },

  // Pillar
  card: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  num: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 96,
    letterSpacing: -2.5,
    lineHeight: 96,
  },
  numTotal: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 30,
    color: '#8A7A60',
  },
  pawsStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  halo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  pillarBadge: {
    position: 'absolute',
    top: 4,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
    minWidth: 64,
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  pillarBadgeLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1.4,
    opacity: 0.85,
  },
  pillarBadgeValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: -1,
  },
  name: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 32,
    marginTop: 4,
  },
  lineOne: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 26,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 14,
  },
  lineTwo: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  phaseHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseHeaderText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    color: '#8A7A60',
    letterSpacing: 2.4,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E0D8CC',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E0D8CC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
