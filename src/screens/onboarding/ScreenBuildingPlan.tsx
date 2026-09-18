import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

interface Step {
  text: string;
  duration: number;
}

const SOCIAL_PROOF = [
  '★★★★★ 4.9 (12,847 reviews)',
  '1,247 people started this week',
  'Average user: +43% focus in 30 days',
  'Built on Stanford attention research',
  'Camera-verified focus, no fluff',
];

export function ScreenBuildingPlan({ goNext }: Props) {
  const { data, yearsOnPhone } = useOnboarding();
  const screenTime = data.userScreenTime ?? 8;
  const identity = data.userIdentity ?? 'focused person';
  const pain = data.userPainPoint ?? 'focus';
  const worstTime = (data.userWorstTime ?? 'evening').toLowerCase();
  const goal = data.userGoal ?? 'free';
  const prior = data.userPriorAttempt ?? '';

  // Personalized step list — uses their actual answers
  const STEPS: Step[] = useMemo(() => [
    { text: `Reading your phone tax: ${screenTime}h/day, ${yearsOnPhone}y on track…`, duration: 2200 },
    { text: `Mapping a ${identity.toLowerCase()}'s 90-day curve…`, duration: 2200 },
    { text: `Targeting ${pain.toLowerCase()} drain in the ${worstTime}…`, duration: 2200 },
    { text: `Cross-referencing 1,247 ${identity.toLowerCase()}s who got their focus back…`, duration: 2400 },
    { text: prior && prior.toLowerCase().includes('many') ? 'Adjusting for repeat-quitter empathy…' : `Calibrating Paws to your "${goal.toLowerCase()}" goal…`, duration: 2200 },
    { text: 'Plan ready.', duration: 1200 },
  ], [screenTime, yearsOnPhone, identity, pain, worstTime, goal, prior]);

  const [stepIdx, setStepIdx] = useState(0);
  const [proofIdx, setProofIdx] = useState(0);
  const [done, setDone] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  // Drive overall progress bar across full duration
  useEffect(() => {
    const totalDuration = STEPS.reduce((a, b) => a + b.duration, 0);
    Animated.timing(barAnim, {
      toValue: 1,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();
  }, [STEPS, barAnim]);

  // Paws pulse loop
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, [pulseAnim]);

  // Step advancement
  useEffect(() => {
    Haptics.selectionAsync().catch(() => {});
    const isLast = stepIdx === STEPS.length - 1;
    const t = setTimeout(() => {
      if (!isLast) {
        setStepIdx((i) => i + 1);
      } else {
        // Final reveal
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Animated.spring(checkAnim, { toValue: 1, damping: 10, mass: 0.8, useNativeDriver: true }).start();
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          goNext();
        }, 1100);
      }
    }, STEPS[stepIdx].duration);
    return () => clearTimeout(t);
  }, [stepIdx, STEPS, goNext, checkAnim]);

  // Cycle social proof every 2.4s
  useEffect(() => {
    const i = setInterval(() => {
      setProofIdx((p) => (p + 1) % SOCIAL_PROOF.length);
    }, 2400);
    return () => clearInterval(i);
  }, []);

  const progressWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentStep = STEPS[stepIdx];

  return (
    <View style={st.container}>
      {/* Paws hero with pulsing halo */}
      <View style={st.heroWrap}>
        <Animated.View
          style={[
            st.halo,
            {
              opacity: pulseAnim.interpolate({ inputRange: [1, 1.06], outputRange: [0.18, 0.32] }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <AnimatedPaws state={done ? 'celebrating' : 'notepad'} size={120} />
        </Animated.View>
      </View>

      <Text style={st.title}>{done ? 'Your plan is ready.' : 'Building your plan…'}</Text>
      <Text style={st.titleSub}>
        {done ? `90 days. Tailored for a ${identity.toLowerCase()}.` : 'Paws is mapping your 90 days.'}
      </Text>

      {/* Live status line — replaces in place with crossfade */}
      <View style={st.statusStage}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={stepIdx}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -14 }}
            transition={{ type: 'timing', duration: 280 }}
            style={st.statusRow}
          >
            <View style={st.checkBox}>
              {done && stepIdx === STEPS.length - 1 ? (
                <Animated.Text
                  style={[
                    st.checkIcon,
                    {
                      transform: [{ scale: checkAnim }],
                    },
                  ]}
                >
                  ✓
                </Animated.Text>
              ) : (
                <View style={st.spinner} />
              )}
            </View>
            <Text style={st.statusText}>{currentStep.text}</Text>
          </MotiView>
        </AnimatePresence>
      </View>

      {/* Master progress bar */}
      <View style={st.progressTrack}>
        <Animated.View style={[st.progressFill, { width: progressWidth }]} />
      </View>

      {/* Cycling social proof badge */}
      <View style={st.proofWrap}>
        <AnimatePresence exitBeforeEnter>
          <MotiText
            key={proofIdx}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: 'timing', duration: 320 }}
            style={st.proofText}
          >
            {SOCIAL_PROOF[proofIdx]}
          </MotiText>
        </AnimatePresence>
      </View>

      {/* Tiny stat row that surfaces THEIR data */}
      <View style={st.statRow}>
        <View style={st.statCell}>
          <Text style={st.statValue}>{screenTime}h</Text>
          <Text style={st.statLabel}>YOUR DAILY</Text>
        </View>
        <View style={st.statDiv} />
        <View style={st.statCell}>
          <Text style={st.statValue}>90</Text>
          <Text style={st.statLabel}>DAY PLAN</Text>
        </View>
        <View style={st.statDiv} />
        <View style={st.statCell}>
          <Text style={st.statValue}>{identity.slice(0, 3).toUpperCase()}</Text>
          <Text style={st.statLabel}>IDENTITY</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: '#F7F4EE',
  },

  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  halo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#D4820A',
  },

  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 26,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titleSub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },

  statusStage: {
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  checkBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D4820A',
    borderTopColor: 'transparent',
  },
  checkIcon: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#16A34A',
    lineHeight: 22,
  },
  statusText: {
    flex: 1,
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#1C1208',
    lineHeight: 21,
  },

  progressTrack: {
    height: 5,
    backgroundColor: '#E0D8CC',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4820A',
    borderRadius: 3,
  },

  proofWrap: {
    alignSelf: 'center',
    marginTop: 22,
    backgroundColor: '#1C1208',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 32,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 12,
    color: '#FAF6EE',
    letterSpacing: 0.6,
    textAlign: 'center',
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    paddingHorizontal: 12,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    color: '#8A7A60',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  statDiv: {
    width: 1,
    height: 26,
    backgroundColor: '#E0D8CC',
  },
});
