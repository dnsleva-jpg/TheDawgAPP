import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: (id?: any) => void; goBack: () => void; onComplete: () => void }

const LETTERS = ['Y', 'I', 'K', 'E', 'S'] as const;
const LETTER_STAGGER = 90; // ms between each letter slam
const LETTER_FIRST_DELAY = 80;
const SLAM_END = LETTER_FIRST_DELAY + LETTER_STAGGER * (LETTERS.length - 1); // 440ms

export function Screen17({ goNext }: Props) {
  const { data } = useOnboarding();
  const hours = data.userScreenTime ?? 8;
  const [showSub, setShowSub] = useState(false);
  const [showPaws, setShowPaws] = useState(false);

  const haloPulse = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mount = warning notification (the "uh oh" moment)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Per-letter HEAVY impact — one per Y/I/K/E/S as they slam in
    LETTERS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, LETTER_FIRST_DELAY + i * LETTER_STAGGER));
    });

    // Final S = screen shake + bonus heavy
    timers.push(setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Animated.sequence([
        Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }, SLAM_END));

    // Halo loop with synced LIGHT haptic pulses on every climax
    Animated.loop(Animated.sequence([
      Animated.timing(haloPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(haloPulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ])).start();

    // Pulse haptics — start after slam ends so they don't pile up on letters
    const pulseStart = 900;
    [0, 1, 2].forEach((i) => {
      timers.push(setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, pulseStart + i * 1100));
    });

    // Paws reveal = MEDIUM impact
    timers.push(setTimeout(() => {
      setShowPaws(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 700));

    // Sub reveal = selection click
    timers.push(setTimeout(() => {
      setShowSub(true);
      Haptics.selectionAsync().catch(() => {});
    }, 1400));

    timers.push(setTimeout(() => goNext(), 4200));
    return () => timers.forEach(clearTimeout);
  }, [goNext, haloPulse, shake]);

  return (
    <View style={st.container}>
      {/* Soft warm vignette so Paws emote integrates into the dark */}
      <View pointerEvents="none" style={st.vignette} />

      <Animated.View style={[st.inner, { transform: [{ translateX: shake }] }]}>
        {showPaws && (
          <View style={st.pawsWrap}>
            {/* Outer warm halo — bridges cream Paws into dark bg */}
            <Animated.View
              style={[
                st.haloOuter,
                {
                  opacity: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.55] }),
                  transform: [{
                    scale: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }),
                  }],
                },
              ]}
              pointerEvents="none"
            />
            {/* Inner amber halo — heat behind Paws */}
            <Animated.View
              style={[
                st.haloInner,
                {
                  opacity: haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] }),
                },
              ]}
              pointerEvents="none"
            />
            <MotiView
              from={{ opacity: 0, scale: 0.5, rotate: '-10deg' }}
              animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 11, mass: 0.9 }}
            >
              <AnimatedPaws state="tempted" size={150} />
            </MotiView>
          </View>
        )}

        {/* YIKES — per-letter slam */}
        <View style={st.lettersRow}>
          {LETTERS.map((ch, i) => (
            <MotiText
              key={i}
              style={st.letter}
              from={{ opacity: 0, scale: 0.2, translateY: -36, rotate: '-12deg' }}
              animate={{ opacity: 1, scale: 1, translateY: 0, rotate: '0deg' }}
              transition={{
                type: 'spring',
                damping: 7,
                mass: 0.55,
                delay: LETTER_FIRST_DELAY + i * LETTER_STAGGER,
                easing: Easing.out(Easing.cubic),
              }}
            >
              {ch}
            </MotiText>
          ))}
        </View>

        {showSub && (
          <MotiText
            style={st.sub}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 14, mass: 0.9 }}
          >
            You said <Text style={st.subEmph}>{hours} hours</Text> a day...
          </MotiText>
        )}
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1208',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  vignette: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: '#3C2410',
    opacity: 0.55,
    top: '50%',
    left: '50%',
    marginLeft: -260,
    marginTop: -260,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pawsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    width: 240,
    height: 240,
  },
  haloOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#5A2E08',
  },
  haloInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#D4820A',
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 96,
    color: '#E74C3C',
    letterSpacing: 4,
    lineHeight: 100,
    textShadowColor: 'rgba(231, 76, 60, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  sub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#F7F4EE',
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.3,
  },
  subEmph: {
    color: '#E74C3C',
    fontFamily: 'Outfit_800ExtraBold',
  },
});
