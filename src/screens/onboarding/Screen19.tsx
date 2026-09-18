import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props { goNext: (id?: any) => void; goBack: () => void; onComplete: () => void }

const FALLING_GLYPHS = ['⏰', '🕰️', '⏱️', '💸', '⏳'];

interface Particle {
  id: number;
  glyph: string;
  startX: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

export function Screen19({ goNext }: Props) {
  const { yearsOnPhone } = useOnboarding();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);

  const fadeBottom = useRef(new Animated.Value(0)).current;
  const fadeMascot = useRef(new Animated.Value(0)).current;
  const fadeItalic = useRef(new Animated.Value(0)).current;
  const counterScale = useRef(new Animated.Value(1)).current;
  const counterShake = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;

  // Generate falling-clock particles
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      glyph: FALLING_GLYPHS[i % FALLING_GLYPHS.length],
      startX: Math.random() * SCREEN_W,
      delay: Math.random() * 800,
      duration: 2200 + Math.random() * 1800,
      rotation: (Math.random() * 720) - 360,
      size: 18 + Math.random() * 16,
    }));
  }, []);

  useEffect(() => {
    const target = yearsOnPhone;
    const step = Math.max(1, Math.ceil(target / 112));
    const interval = setInterval(() => {
      setCount((c) => {
        const n = c + step;
        if (n >= target) { clearInterval(interval); setDone(true); return target; }
        return n;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [yearsOnPhone]);

  useEffect(() => {
    if (!done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 160);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 360);

    setShowShockwave(true);

    Animated.parallel([
      // Counter slam-bounce
      Animated.sequence([
        Animated.spring(counterScale, { toValue: 1.45, friction: 4, tension: 220, useNativeDriver: true }),
        Animated.spring(counterScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      ]),
      // Counter shake
      Animated.sequence([
        Animated.timing(counterShake, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(counterShake, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(counterShake, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(counterShake, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(counterShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      // Red glow
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.7, duration: 300, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      // Screen flash
      Animated.sequence([
        Animated.timing(screenFlash, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(screenFlash, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.timing(fadeBottom, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(fadeMascot, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeItalic, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => goNext(), 3400);
    return () => clearTimeout(t);
  }, [done, fadeBottom, fadeMascot, fadeItalic, counterScale, counterShake, glowOpacity, screenFlash, goNext]);

  return (
    <View style={st.container}>
      {/* Red screen flash on climax */}
      <Animated.View
        pointerEvents="none"
        style={[
          st.screenFlash,
          { opacity: screenFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.32] }) },
        ]}
      />

      {/* Falling time-glyphs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particles.map((p) => (
          <MotiView
            key={p.id}
            from={{ translateY: -60, opacity: 0, rotate: '0deg' }}
            animate={{ translateY: SCREEN_H + 60, opacity: 0.6, rotate: `${p.rotation}deg` }}
            transition={{
              type: 'timing',
              duration: p.duration,
              delay: p.delay,
              easing: Easing.in(Easing.cubic),
              loop: true,
              repeatReverse: false,
            }}
            style={{ position: 'absolute', left: p.startX }}
          >
            <Text style={{ fontSize: p.size, opacity: 0.45 }}>{p.glyph}</Text>
          </MotiView>
        ))}
      </View>

      <MotiText
        style={st.top}
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
      >
        You're on track to spend
      </MotiText>

      <View style={st.counterWrap}>
        <Animated.View style={[st.glow, { opacity: glowOpacity }]} pointerEvents="none" />
        {showShockwave && (
          <MotiView
            from={{ opacity: 0.6, scale: 0 }}
            animate={{ opacity: 0, scale: 3.4 }}
            transition={{ type: 'timing', duration: 700 }}
            style={st.shockwave}
            pointerEvents="none"
          />
        )}
        <Animated.Text
          style={[
            st.counter,
            {
              transform: [
                { scale: counterScale },
                { translateX: counterShake },
              ],
            },
          ]}
        >
          {count}
        </Animated.Text>
        <MotiText
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: done ? 1 : 0, translateY: done ? 0 : 8 }}
          transition={{ type: 'timing', duration: 320, delay: 200 }}
          style={st.counterUnit}
        >
          YEARS
        </MotiText>
      </View>

      {done && (
        <Animated.Text style={[st.bottom, { opacity: fadeBottom }]}>
          rotting on this phone.
        </Animated.Text>
      )}

      {done && (
        <Animated.View style={{ opacity: fadeMascot, marginTop: 12 }}>
          <AnimatedPaws state="brainFog" size={120} style={{ alignSelf: 'center' }} />
        </Animated.View>
      )}

      {done && (
        <Animated.Text style={[st.italic, { opacity: fadeItalic }]}>
          Paws is not okay with this.
        </Animated.Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DC2626',
  },
  top: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#1C1208',
    textAlign: 'center',
  },
  counterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 180,
    borderRadius: 140,
    backgroundColor: '#DC2626',
  },
  shockwave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: '#DC2626',
  },
  counter: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 132,
    color: '#C0392B',
    textAlign: 'center',
    lineHeight: 132,
    letterSpacing: -3,
    textShadowColor: 'rgba(220, 38, 38, 0.30)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 18,
  },
  counterUnit: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 18,
    color: '#1C1208',
    letterSpacing: 6,
    marginTop: -6,
  },
  bottom: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.3,
  },
  italic: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8A7A60',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});
