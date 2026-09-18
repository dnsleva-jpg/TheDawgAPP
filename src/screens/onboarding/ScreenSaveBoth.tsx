import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';

const PAWS_STATES = [
  require('../../../assets/shiba/paws-full-rot.png'),     // 0: fully rotted
  require('../../../assets/shiba/paws-melting.png'),       // 1: melting
  require('../../../assets/shiba/paws-cant-stop.png'),     // 2: can't stop, notifications
  require('../../../assets/shiba/paws-tempted.png'),       // 3: tempted, looking away from phone
  require('../../../assets/shiba/paws-celebrating.png'),   // 4: FREE! celebrating
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenSaveBoth({ goNext }: Props) {
  const { yearsOnPhone } = useOnboarding();
  const [taps, setTaps] = useState(0);
  const [done, setDone] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  // Calculate years at each tap stage
  const yearsAtTap = [
    yearsOnPhone,
    Math.round(yearsOnPhone * 0.75),
    Math.round(yearsOnPhone * 0.5),
    Math.round(yearsOnPhone * 0.25),
    0,
  ];

  const MESSAGES = [
    'Paws is stuck on the phone. Just like you.',
    'Breaking free...',
    'Almost there...',
    'Paws can see clearly now.',
    'Reclaimed.',
  ];

  const handleTap = useCallback(() => {
    if (done) return;
    const newTaps = taps + 1;
    setTaps(newTaps);

    // Paws grows bigger with each tap
    const newScale = 0.7 + (newTaps * 0.15);
    Animated.spring(scaleAnim, {
      toValue: Math.min(newScale, 1.3),
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Number pulse
    Animated.sequence([
      Animated.timing(numberAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(numberAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Haptic escalation
    if (newTaps <= 2) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (newTaps <= 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Final tap
    if (newTaps >= 4) {
      setDone(true);
      Animated.parallel([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [taps, done, scaleAnim, numberAnim, glowAnim, btnOpacity]);

  const pawsIdx = Math.min(taps, 4);
  const currentYears = yearsAtTap[pawsIdx];
  const message = MESSAGES[pawsIdx];
  const yearColor = taps >= 4 ? '#4CAF50' : taps >= 2 ? '#D4820A' : '#E74C3C';

  return (
    <View style={st.container}>
      {/* Glow behind Paws on final tap */}
      <Animated.View style={[st.glow, { opacity: glowAnim }]} pointerEvents="none" />

      {/* Years wasted counter */}
      <View style={st.yearSection}>
        <Text style={st.yearLabel}>{done ? 'Years reclaimed' : 'Years on your phone'}</Text>
        <Animated.Text style={[st.yearNumber, { color: yearColor, transform: [{ scale: numberAnim }] }]}>
          {currentYears}
        </Animated.Text>
      </View>

      {/* Paws — tap target */}
      <TouchableOpacity onPress={handleTap} activeOpacity={1} disabled={done}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image source={PAWS_STATES[pawsIdx]} style={st.pawsImage} resizeMode="contain" />
        </Animated.View>
      </TouchableOpacity>

      {/* Message */}
      <Text style={st.message}>{message}</Text>

      {/* Tap indicator */}
      {!done && (
        <View style={st.tapArea}>
          <Text style={st.tapHint}>Tap Paws to break free</Text>
          <View style={st.tapDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[st.tapDot, i < taps && st.tapDotFilled]} />
            ))}
          </View>
        </View>
      )}

      {/* CTA after completion */}
      {done && (
        <Animated.View style={[st.ctaArea, { opacity: btnOpacity }]}>
          <Text style={st.ctaText}>This is what Do Nothin' does.</Text>
          <TouchableOpacity style={st.ctaBtn} onPress={goNext} activeOpacity={0.8}>
            <Text style={st.ctaBtnText}>Ready</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4EE', paddingHorizontal: 24 },

  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(76, 175, 80, 0.15)' },

  yearSection: { alignItems: 'center', marginBottom: 20 },
  yearLabel: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60' },
  yearNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 64 },

  pawsImage: { width: 180, height: 180 },

  message: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208', textAlign: 'center', marginTop: 16 },

  tapArea: { alignItems: 'center', marginTop: 24 },
  tapHint: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', marginBottom: 12 },
  tapDots: { flexDirection: 'row', gap: 10 },
  tapDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0D8CC' },
  tapDotFilled: { backgroundColor: '#D4820A' },

  ctaArea: { alignItems: 'center', marginTop: 24, width: '100%' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208', textAlign: 'center', marginBottom: 16 },
  ctaBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, width: '100%', alignItems: 'center' },
  ctaBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
